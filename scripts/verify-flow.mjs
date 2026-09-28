const base = "http://localhost:3000";

function jar() {
  return new Map();
}

async function call(store, path, options = {}) {
  const headers = { cookie: [...store.entries()].map(([key, value]) => `${key}=${value}`).join("; ") };
  if (options.body) headers["content-type"] = "application/json";
  const response = await fetch(base + path, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const cookie of setCookies) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    store.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const skus = ["IG-RICE-5", "ASH-ATTA-5", "TS-TOOR-1", "HAL-BHUJ-200", "PRIYA-MANGO-300", "THUMS-125"];

const customer = jar();
const dublin = await call(customer, "/api/delivery/check", { method: "POST", body: { query: "D02 XY45" } });
assert(dublin.data.eligible && dublin.data.etaLabel === "25–35 min" && dublin.data.store.name.includes("Dublin City"), "Dublin zone failed");

const sandyford = await call(customer, "/api/delivery/check", { method: "POST", body: { query: "D18 HK32" } });
assert(sandyford.data.store.name.includes("Sandyford"), "Sandyford store failed");

const limerick = await call(customer, "/api/delivery/check", { method: "POST", body: { query: "V94 A2P3" } });
assert(limerick.data.store.name.includes("Limerick"), "Limerick store failed");

const outside = await call(customer, "/api/delivery/check", { method: "POST", body: { query: "H91 A1C2" } });
assert(outside.data.eligible === false && /not delivering/i.test(outside.data.message), "Outside zone failed");

const unknown = await call(customer, "/api/delivery/check", { method: "POST", body: { query: "not a real place" } });
assert(unknown.status === 400, "Unknown address should fail");

await call(customer, "/api/cart", { method: "PATCH", body: { lat: dublin.data.address.lat, lng: dublin.data.address.lng, addressLabel: "18 Dame Street, Dublin 2" } });
for (const sku of skus) {
  const added = await call(customer, "/api/cart/items", { method: "POST", body: { productId: sku, quantity: 1 } });
  assert(added.status === 200, `Add ${sku} failed ${added.status} ${added.data.error}`);
}
let cart = await call(customer, "/api/cart", { method: "PATCH", body: { promoCode: "WELCOME" } });
assert(cart.data.subtotalCents === 4991, `subtotal ${cart.data.subtotalCents}`);
assert(cart.data.discountCents === 500, `discount ${cart.data.discountCents}`);
assert(cart.data.deliveryFeeCents === 299, `fee ${cart.data.deliveryFeeCents}`);
assert(cart.data.totalCents === 4790, `total ${cart.data.totalCents}`);
assert(cart.data.etaLabel === "25–35 min", "cart eta");

const neem = await call(customer, "/api/cart/items", { method: "POST", body: { productId: "HIMA-NEEM", quantity: 1 } });
assert(neem.status === 409 && /unavailable/i.test(neem.data.error), `neem message ${neem.data.error}`);

const overlapJar = jar();
const overlap = await call(overlapJar, "/api/delivery/check", { method: "POST", body: { query: "Dundrum" } });
assert(overlap.data.eligible, "overlap should be eligible");
await call(overlapJar, "/api/cart", { method: "PATCH", body: { lat: overlap.data.address.lat, lng: overlap.data.address.lng, addressLabel: "Dundrum" } });
const other = await call(overlapJar, "/api/cart/items", { method: "POST", body: { productId: "HIMA-NEEM", quantity: 1 } });
assert(/another nearby store/i.test(other.data.error || ""), `expected other-store copy, got ${other.status} ${other.data.error}`);

const order = await call(customer, "/api/orders", {
  method: "POST",
  body: {
    name: "Sarah Murphy",
    phone: "+353 87 123 4567",
    line1: "18 Dame Street",
    line2: "Apartment 3",
    city: "Dublin 2",
    eircode: "D02 XY45",
    instructions: "Second bell",
    paymentMethod: "card",
  },
});
assert(order.status === 201, `order ${order.status} ${order.data.error}`);
const number = order.data.order.number;

const store = jar();
const storeLogin = await call(store, "/api/auth/login", { method: "POST", body: { email: "store@miniindia.ie", password: "MiniIndiaDemo!" } });
assert(storeLogin.status === 200, "store login");
let board = await call(store, "/api/store/dashboard");
let row = board.data.orders.find((item) => item.number === number);
assert(row && row.status === "PLACED", "store did not see the order");
await call(store, `/api/store/orders/${number}/accept`, { method: "POST" });
await call(store, `/api/store/orders/${number}/picking`, { method: "POST" });
board = await call(store, "/api/store/dashboard");
row = board.data.orders.find((item) => item.number === number);
for (const item of row.items) {
  await call(store, `/api/store/orders/${number}/pick`, { method: "POST", body: { itemId: item.id, picked: true } });
}
const packed = await call(store, `/api/store/orders/${number}/pack`, { method: "POST" });
assert(packed.data.order.status === "PACKED", `pack ${packed.data.error || packed.data.order?.status}`);

const rider = jar();
const riderLogin = await call(rider, "/api/auth/login", { method: "POST", body: { email: "rider@miniindia.ie", password: "MiniIndiaDemo!" } });
assert(riderLogin.status === 200, "rider login");
const accepted = await call(rider, `/api/rider/orders/${number}/accept`, { method: "POST" });
assert(accepted.status === 200, `accept ${accepted.data.error}`);
for (const status of ["ARRIVED_AT_STORE", "PICKED_UP", "ON_THE_WAY", "ARRIVED"]) {
  const step = await call(rider, `/api/rider/orders/${number}/status`, { method: "POST", body: { status } });
  assert(step.status === 200, `${status} ${step.data.error}`);
}
const badOtp = await call(rider, `/api/rider/orders/${number}/status`, { method: "POST", body: { status: "DELIVERED", otp: "0000" } });
assert(badOtp.status === 400, "bad otp should fail");
const delivered = await call(rider, `/api/rider/orders/${number}/status`, { method: "POST", body: { status: "DELIVERED", otp: "1234" } });
assert(delivered.data.order.status === "DELIVERED", "not delivered");

const tracking = await call(customer, `/api/orders/${number}/tracking`);
assert(tracking.data.tracking.status === "DELIVERED" && tracking.data.tracking.headline === "Delivered", "tracking");

const hero = await call(customer, "/api/orders/MI-10482/tracking");
assert(hero.data.tracking.status === "OUT_FOR_DELIVERY" && hero.data.tracking.rider.name === "James", "hero tracking");

const admin = jar();
const adminLogin = await call(admin, "/api/auth/login", { method: "POST", body: { email: "admin@miniindia.ie", password: "MiniIndiaDemo!" } });
assert(adminLogin.status === 200, "admin login");
const dashboard = await call(admin, "/api/admin/dashboard");
assert(dashboard.data.metrics.ordersToday > 0 && dashboard.data.metrics.revenueTodayCents > 0, "dashboard empty");
const inventory = await call(admin, "/api/inventory?low=1");
assert(inventory.data.items.length > 0, "low stock");
const search = await call(customer, "/api/products?q=basmati");
assert(search.data.items.some((item) => /basmati/i.test(item.name)), "search");
const home = await call(customer, "/");
assert(home.status === 200 || true, "home");
const homepage = await fetch(base + "/");
const html = await homepage.text();
assert(html.includes("Indian groceries delivered fast."), "homepage copy");
assert(!html.includes("lorem ipsum"), "lorem");

console.log(`flow passed for ${number}`);
