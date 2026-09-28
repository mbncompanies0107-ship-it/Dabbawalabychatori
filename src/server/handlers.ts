import { NextResponse } from "next/server";
import { readDB, updateDB } from "@/lib/db";
import { DEMO_LOCATIONS, resolveAddressQuery } from "@/lib/demo-locations";
import {
  deliveryFeeCents as quoteDeliveryFee,
  formatEtaRange,
  selectStore,
  type StoreCandidate,
} from "@/lib/delivery";
import { dublinDateKey, dublinHour, normaliseEircode } from "@/lib/format";
import { newId } from "@/lib/ids";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { availableUnits } from "@/lib/seed";
import { cartIdFromRequest, readSession, signSession, tokenFromRequest } from "@/lib/token";
import type {
  Cart,
  Database,
  DeliveryStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  Role,
  User,
} from "@/lib/types";
import { listProducts, toProductDTO } from "@/server/queries";

const ORDER_RANK: Record<OrderStatus, number> = {
  CANCELLED: -1,
  PLACED: 0,
  STORE_CONFIRMED: 1,
  PICKING: 2,
  PACKED: 3,
  RIDER_ASSIGNED: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
};

const DELIVERY_FLOW: DeliveryStatus[] = [
  "ASSIGNED",
  "ACCEPTED",
  "ARRIVED_AT_STORE",
  "PICKED_UP",
  "ON_THE_WAY",
  "ARRIVED",
  "DELIVERED",
];

type CookieSet = { name: string; value: string; maxAge: number };

function json(data: unknown, status = 200, cookies: CookieSet[] = []) {
  const response = NextResponse.json(data, { status });
  cookies.forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: cookie.maxAge,
    });
  });
  return response;
}

function fail(error: string, status = 400) {
  return json({ error }, status);
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (req.method === "GET" || req.method === "HEAD") return {};
  const text = await req.text();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function sessionUser(req: Request): User | null {
  const session = readSession(tokenFromRequest(req));
  if (!session) return null;
  const db = readDB();
  return db.users.find((user) => user.id === session.uid && !user.deletedAt) ?? null;
}

function requireUser(req: Request, roles?: Role[]) {
  const user = sessionUser(req);
  if (!user) return { user: null, response: fail("Please sign in to continue.", 401) };
  if (roles && !roles.includes(user.role)) return { user: null, response: fail("You don't have access to that.", 403) };
  return { user, response: null };
}

function candidates(db: Database, lines: { productId: string; quantity: number }[] = []): StoreCandidate[] {
  return db.stores
    .filter((store) => !store.deletedAt)
    .map((store) => {
      const rows = db.inventory.filter((row) => row.storeId === store.id && !row.deletedAt && !row.disabled);
      const stocked = rows.filter((row) => availableUnits(row) > 0).length;
      const hasRequiredInventory =
        lines.length === 0
          ? stocked > 0
          : lines.every((line) => {
              const row = rows.find((item) => item.productId === line.productId);
              return !!row && availableUnits(row) >= line.quantity;
            });
      return {
        id: store.id,
        name: store.name,
        status: store.status,
        lat: store.lat,
        lng: store.lng,
        availabilityScore: rows.length ? stocked / rows.length : 0,
        hasRequiredInventory,
      };
    });
}

function unitsAt(db: Database, storeId: string, productId: string) {
  const row = db.inventory.find((item) => item.storeId === storeId && item.productId === productId && !item.deletedAt);
  if (!row || row.disabled) return 0;
  return availableUnits(row);
}

function promoValue(db: Database, code: string | null, subtotalCents: number) {
  if (!code) return { discountCents: 0, error: null as string | null };
  const promo = db.promotions.find(
    (item) => item.code.toLowerCase() === code.toLowerCase() && item.active && !item.deletedAt,
  );
  if (!promo) return { discountCents: 0, error: "That code isn't active." };
  if (subtotalCents < promo.minSubtotalCents) {
    return { discountCents: 0, error: `${promo.code} applies on baskets over €${(promo.minSubtotalCents / 100).toFixed(0)}.` };
  }
  return { discountCents: promo.amountCents, error: null };
}

function cartView(db: Database, cart: Cart) {
  const draft = db.cartItems
    .filter((item) => item.cartId === cart.id)
    .map((item) => {
      const product = db.products.find((product) => product.id === item.productId);
      if (!product) return null;
      const category = db.categories.find((category) => category.id === product.categoryId);
      return {
        id: item.id,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        size: product.size,
        sku: product.sku,
        hue: product.hue,
        categorySlug: category?.slug ?? "",
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        lineCents: product.priceCents * item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  const subtotalCents = draft.reduce((sum, item) => sum + item.lineCents, 0);
  const promo = promoValue(db, cart.promoCode, subtotalCents);
  const lines = draft.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  const area =
    cart.lat != null && cart.lng != null
      ? selectStore({
          customerLat: cart.lat,
          customerLng: cart.lng,
          stores: candidates(db),
          subtotalCents,
          settings: db.settings,
        })
      : null;
  const decision =
    area?.eligible && lines.length
      ? selectStore({
          customerLat: cart.lat!,
          customerLng: cart.lng!,
          stores: candidates(db, lines),
          subtotalCents,
          settings: db.settings,
        })
      : area;
  const store = area?.storeId ? db.stores.find((item) => item.id === area.storeId) ?? null : null;
  if (store && cart.storeId !== store.id) cart.storeId = store.id;
  const items = draft.map((item) => ({
    ...item,
    available: Boolean(area?.eligible && area.storeId && unitsAt(db, area.storeId, item.productId) >= item.quantity),
    stock: area?.storeId ? unitsAt(db, area.storeId, item.productId) : 0,
  }));
  const deliveryFeeCents =
    area?.eligible && area.distanceKm != null
      ? quoteDeliveryFee(area.distanceKm, subtotalCents, db.settings)
      : null;
  const discountCents = promo.discountCents;
  const totalCents =
    deliveryFeeCents == null ? null : Math.max(0, subtotalCents - discountCents + deliveryFeeCents);
  const threshold = db.settings.freeDeliveryThresholdCents;
  return {
    id: cart.id,
    store: store
      ? { id: store.id, name: store.name, address: `${store.addressLine}, ${store.city}`, region: store.region }
      : null,
    addressLabel: cart.addressLabel,
    lat: cart.lat,
    lng: cart.lng,
    items,
    subtotalCents,
    discountCents,
    promoCode: cart.promoCode,
    promoError: promo.error,
    deliveryFeeCents,
    totalCents,
    etaMinutes: area?.etaMinutes ?? null,
    etaLabel: area?.etaLabel ?? null,
    distanceKm: area?.distanceKm ?? null,
    eligible: area?.eligible ?? false,
    basketReady: Boolean(area?.eligible && items.every((item) => item.available) && (items.length === 0 || decision?.eligible)),
    deliveryMessage: area?.message ?? "Enter your Eircode to check delivery.",
    freeDeliveryRemainingCents:
      deliveryFeeCents === 0 ? 0 : Math.max(0, threshold - subtotalCents),
    freeDeliveryThresholdCents: threshold,
    unavailableCount: items.filter((item) => !item.available).length,
  };
}

function ensureCart(db: Database, req: Request, user: User | null) {
  const existingId = cartIdFromRequest(req);
  let cart =
    (existingId ? db.carts.find((item) => item.id === existingId) : undefined) ??
    (user ? db.carts.find((item) => item.userId === user.id) : undefined);
  let created = false;
  if (!cart) {
    cart = {
      id: newId(),
      userId: user?.id ?? null,
      storeId: null,
      promoCode: null,
      lat: null,
      lng: null,
      addressLabel: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.carts.push(cart);
    created = true;
  } else if (user && !cart.userId) {
    cart.userId = user.id;
  }
  return { cart, created };
}

function publicOrder(db: Database, order: Order) {
  const store = db.stores.find((item) => item.id === order.storeId);
  const delivery = db.deliveries.find((item) => item.orderId === order.id);
  const rider = delivery?.riderId ? db.riders.find((item) => item.id === delivery.riderId) : null;
  const items = db.orderItems.filter((item) => item.orderId === order.id);
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    addressLine: order.addressLine,
    city: order.city,
    eircode: order.eircode,
    instructions: order.instructions,
    lat: order.lat,
    lng: order.lng,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: order.totalCents,
    promoCode: order.promoCode,
    etaMinutes: order.etaMinutes,
    etaLabel: order.etaLabel,
    distanceKm: order.distanceKm,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    store: store ? { id: store.id, name: store.name, address: `${store.addressLine}, ${store.city}`, lat: store.lat, lng: store.lng } : null,
    rider: rider ? { id: rider.id, name: rider.name.split(" ")[0], fullName: rider.name, phone: rider.phone, rating: rider.rating } : null,
    deliveryStatus: delivery?.status ?? null,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      size: item.size,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      picked: item.picked,
      hue: db.products.find((product) => product.id === item.productId)?.hue ?? 140,
      categorySlug: db.categories.find(
        (category) => category.id === db.products.find((product) => product.id === item.productId)?.categoryId,
      )?.slug,
    })),
  };
}

function tracking(db: Database, order: Order) {
  const base = publicOrder(db, order);
  const steps = [
    ["PLACED", "Order placed"],
    ["STORE_CONFIRMED", "Store confirmed"],
    ["PICKING", "Picking your items"],
    ["PACKED", "Packed"],
    ["RIDER_ASSIGNED", "Rider assigned"],
    ["OUT_FOR_DELIVERY", "On the way"],
    ["DELIVERED", "Delivered"],
  ] as const;
  const current = ORDER_RANK[order.status];
  const events = db.deliveryStatusHistory.filter((event) => event.orderId === order.id);
  const timeline = steps.map(([key, label]) => {
    const rank = ORDER_RANK[key];
    const event = events.find((item) => item.status === key || (key === "OUT_FOR_DELIVERY" && item.status === "ON_THE_WAY") || (key === "RIDER_ASSIGNED" && item.status === "ACCEPTED"));
    return {
      key,
      label,
      done: current > rank,
      current: current === rank,
      at: event?.createdAt ?? (key === "PLACED" ? order.createdAt : null),
    };
  });
  const store = db.stores.find((item) => item.id === order.storeId)!;
  const delivery = db.deliveries.find((item) => item.orderId === order.id);
  const progress: Record<string, number> = {
    ASSIGNED: 0.12,
    ACCEPTED: 0.18,
    ARRIVED_AT_STORE: 0,
    PICKED_UP: 0.08,
    ON_THE_WAY: 0.62,
    ARRIVED: 0.96,
    DELIVERED: 1,
  };
  const t = delivery ? progress[delivery.status] ?? 0.4 : order.status === "OUT_FOR_DELIVERY" ? 0.62 : 0;
  const riderLat = store.lat + (order.lat - store.lat) * t;
  const riderLng = store.lng + (order.lng - store.lng) * t;
  const headline =
    order.status === "DELIVERED"
      ? "Delivered"
      : order.status === "OUT_FOR_DELIVERY"
        ? "Your order is on the way"
        : order.status === "CANCELLED"
          ? "Order cancelled"
          : "We're preparing your order";
  return {
    ...base,
    etaMinutes: order.status === "OUT_FOR_DELIVERY" && delivery ? delivery.etaMinutes : order.etaMinutes,
    headline,
    timeline,
    map: {
      store: { lat: store.lat, lng: store.lng, label: store.name },
      customer: { lat: order.lat, lng: order.lng, label: order.city },
      rider: delivery?.riderId ? { lat: riderLat, lng: riderLng, label: base.rider?.name ?? "Rider" } : null,
    },
  };
}

function findOrder(db: Database, id: string) {
  return db.orders.find((order) => order.id === id || order.number.toLowerCase() === id.toLowerCase());
}

function normalisePhone(input: string) {
  const compact = input.replace(/[^\d+]/g, "");
  if (compact.startsWith("+353")) return compact;
  if (compact.startsWith("353")) return `+${compact}`;
  if (compact.startsWith("0")) return `+353${compact.slice(1)}`;
  return compact;
}

function remember(existingCookie: string | null, number: string): string {
  const prev = (existingCookie ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [number, ...prev.filter((item) => item !== number)].slice(0, 20).join(",");
}

function ordersCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)mi_orders=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function analytics(db: Database) {
  const today = dublinDateKey();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86_400_000);
    return dublinDateKey(date);
  });
  const live = db.orders.filter((order) => !order.deletedAt);
  const todayOrders = live.filter((order) => dublinDateKey(new Date(order.createdAt)) === today);
  const weekOrders = live.filter((order) => days.includes(dublinDateKey(new Date(order.createdAt))));
  const paid = (orders: Order[]) => orders.filter((order) => order.status !== "CANCELLED");
  const revenue = (orders: Order[]) => paid(orders).reduce((sum, order) => sum + order.totalCents, 0);
  const todayPaid = paid(todayOrders);
  const delivered = live.filter((order) => order.status === "DELIVERED");
  const avgDelivery =
    delivered.length === 0
      ? 0
      : Math.round(delivered.reduce((sum, order) => sum + order.etaMinutes, 0) / delivered.length);
  const cancelled = weekOrders.filter((order) => order.status === "CANCELLED").length;
  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}`,
    value: todayOrders.filter((order) => dublinHour(new Date(order.createdAt)) === hour).length,
  }));
  const revenueByDay = days.map((day) => ({
    label: day.slice(5),
    value: revenue(weekOrders.filter((order) => dublinDateKey(new Date(order.createdAt)) === day)) / 100,
  }));
  const ordersByStore = db.stores.map((store) => ({
    label: store.name.replace("Mini India ", ""),
    value: todayOrders.filter((order) => order.storeId === store.id && order.status !== "CANCELLED").length,
  }));
  const productQty = new Map<string, number>();
  weekOrders
    .filter((order) => order.status !== "CANCELLED")
    .forEach((order) => {
      db.orderItems
        .filter((item) => item.orderId === order.id)
        .forEach((item) => productQty.set(item.name, (productQty.get(item.name) ?? 0) + item.quantity));
    });
  const topProducts = [...productQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));
  const onTime = delivered.filter((order) => order.etaMinutes <= 45).length;
  return {
    ordersToday: todayOrders.length,
    ordersWeek: weekOrders.length,
    revenueTodayCents: revenue(todayOrders),
    revenueWeekCents: revenue(weekOrders),
    averageBasketCents: todayPaid.length ? Math.round(revenue(todayOrders) / todayPaid.length) : 0,
    averageDeliveryMinutes: avgDelivery,
    cancellationRate: weekOrders.length ? cancelled / weekOrders.length : 0,
    activeRiders: db.riders.filter((rider) => rider.online && !rider.deletedAt).length,
    ordersInProgress: live.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length,
    customerCount: db.users.filter((user) => user.role === "CUSTOMER" && !user.deletedAt).length,
    onTimeRate: delivered.length ? onTime / delivered.length : 1,
    ordersByHour: byHour,
    revenueByDay,
    ordersByStore,
    topProducts,
    lowStock: db.inventory.filter((row) => !row.deletedAt && availableUnits(row) <= row.reorderThreshold).length,
  };
}

function unavailableCopy(db: Database, lat: number, lng: number, productId: string) {
  const decision = selectStore({
    customerLat: lat,
    customerLng: lng,
    stores: candidates(db),
    settings: db.settings,
  });
  if (!decision.storeId) return decision.message;
  if (unitsAt(db, decision.storeId, productId) > 0) return null;
  const other = decision.considered.find(
    (store) => store.eligible && store.id !== decision.storeId && unitsAt(db, store.id, productId) > 0,
  );
  if (other) {
    return "Not available for delivery from your nearest store. Available from another nearby store.";
  }
  return "This product is currently unavailable.";
}

export async function handleApi(req: Request, parts: string[]): Promise<Response> {
  try {
    return await route(req, parts.filter(Boolean));
  } catch (error) {
    console.error(error);
    return fail("Something went wrong. Please try again.", 500);
  }
}

async function route(req: Request, parts: string[]): Promise<Response> {
  const method = req.method.toUpperCase();
  const path = parts.join("/");
  const url = new URL(req.url);
  const q = url.searchParams;

  if (method === "GET" && path === "health") {
    const db = readDB();
    return json({ ok: true, stores: db.stores.length, products: db.products.length, orders: db.orders.length });
  }

  if (method === "POST" && path === "auth/login") {
    const body = await readBody(req);
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const db = readDB();
    const user = db.users.find((item) => item.email.toLowerCase() === email && !item.deletedAt);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail("Email or password is incorrect.", 401);
    }
    const token = signSession({ uid: user.id, role: user.role });
    return json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } },
      200,
      [{ name: "mi_token", value: token, maxAge: 60 * 60 * 24 * 14 }],
    );
  }

  if (method === "POST" && path === "auth/register") {
    const body = await readBody(req);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const phone = normalisePhone(String(body.phone ?? ""));
    if (name.length < 2 || !email.includes("@") || password.length < 8) {
      return fail("Add your name, a valid email and a password of at least 8 characters.");
    }
    const created = updateDB((db) => {
      if (db.users.some((user) => user.email.toLowerCase() === email)) return null;
      const user: User = {
        id: newId(),
        role: "CUSTOMER",
        name,
        email,
        phone,
        passwordHash: hashPassword(password),
        storeId: null,
        riderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };
      db.users.push(user);
      return user;
    });
    if (!created) return fail("An account with that email already exists.", 409);
    const token = signSession({ uid: created.id, role: created.role });
    return json(
      { user: { id: created.id, name: created.name, email: created.email, role: created.role, phone: created.phone } },
      201,
      [{ name: "mi_token", value: token, maxAge: 60 * 60 * 24 * 14 }],
    );
  }

  if (method === "POST" && path === "auth/logout") {
    return json({ ok: true }, 200, [{ name: "mi_token", value: "", maxAge: 0 }]);
  }

  if (method === "GET" && path === "auth/me") {
    const user = sessionUser(req);
    if (!user) return json({ user: null });
    return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, storeId: user.storeId } });
  }

  if (method === "GET" && path === "stores") {
    const db = readDB();
    return json({
      stores: db.stores.filter((store) => !store.deletedAt).map((store) => ({
        ...store,
        activeOrders: db.orders.filter((order) => order.storeId === store.id && !["DELIVERED", "CANCELLED"].includes(order.status)).length,
        riderCount: db.riders.filter((rider) => rider.storeId === store.id && rider.online).length,
        inventoryCount: db.inventory.filter((row) => row.storeId === store.id && availableUnits(row) > 0).length,
      })),
    });
  }

  if (method === "GET" && (path === "stores/nearest" || path === "delivery/estimate")) {
    const lat = Number(q.get("lat"));
    const lng = Number(q.get("lng"));
    const subtotal = Math.round(Number(q.get("subtotal") ?? 0) * 100);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return fail("Add a location to check delivery.");
    const db = readDB();
    const decision = selectStore({
      customerLat: lat,
      customerLng: lng,
      stores: candidates(db),
      subtotalCents: subtotal,
      settings: db.settings,
    });
    const store = db.stores.find((item) => item.id === decision.storeId) ?? null;
    return json({ ...decision, store });
  }

  if (method === "GET" && parts[0] === "stores" && parts.length === 2) {
    const db = readDB();
    const store = db.stores.find((item) => item.id === parts[1] || item.slug === parts[1]);
    if (!store) return fail("We couldn't find that store.", 404);
    return json({ store });
  }

  if (method === "GET" && path === "categories") {
    const db = readDB();
    return json({ categories: db.categories.filter((category) => !category.deletedAt) });
  }

  if (method === "GET" && path === "products") {
    const result = listProducts({
      q: q.get("q") ?? undefined,
      category: q.get("category") ?? undefined,
      sort: q.get("sort") ?? undefined,
      min: q.get("min") ? Math.round(Number(q.get("min")) * 100) : undefined,
      max: q.get("max") ? Math.round(Number(q.get("max")) * 100) : undefined,
      storeId: q.get("storeId") ?? undefined,
      inStock: q.get("inStock") === "1",
      page: q.get("page") ? Number(q.get("page")) : 1,
      pageSize: q.get("pageSize") ? Number(q.get("pageSize")) : 24,
      flag: (q.get("flag") as "popular" | "bestseller" | "favourite" | "new" | "deal" | null) ?? undefined,
    });
    return json(result);
  }

  if (method === "GET" && parts[0] === "products" && parts.length === 2) {
    const product = toProductDTO(parts[1]);
    if (!product) return fail("We couldn't find that product.", 404);
    const db = readDB();
    const reviews = db.reviews.filter((review) => review.productId === product.id && !review.deletedAt).slice(0, 4);
    return json({ product, reviews });
  }

  if (method === "GET" && path === "inventory") {
    const gate = requireUser(req, ["ADMIN", "STORE_OPERATOR"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    const storeId = gate.user.role === "STORE_OPERATOR" ? gate.user.storeId : q.get("storeId");
    const low = q.get("low") === "1";
    const term = (q.get("q") ?? "").toLowerCase();
    const page = Math.max(1, Number(q.get("page") ?? 1));
    const pageSize = 40;
    let rows = db.inventory.filter((row) => !row.deletedAt);
    if (storeId) rows = rows.filter((row) => row.storeId === storeId);
    if (low) rows = rows.filter((row) => availableUnits(row) <= row.reorderThreshold);
    const mapped = rows
      .map((row) => {
        const product = db.products.find((item) => item.id === row.productId);
        const store = db.stores.find((item) => item.id === row.storeId);
        if (!product || !store) return null;
        return {
          id: row.id,
          sku: row.sku,
          product: product.name,
          brand: product.brand,
          size: product.size,
          storeId: store.id,
          store: store.name,
          stock: row.stock,
          reserved: row.reserved,
          available: availableUnits(row),
          reorderThreshold: row.reorderThreshold,
          priceCents: product.priceCents,
          disabled: row.disabled,
          status: row.disabled ? "Disabled" : availableUnits(row) <= row.reorderThreshold ? "Low stock" : "In stock",
        };
      })
      .filter((row): row is NonNullable<typeof row> => !!row)
      .filter((row) => !term || `${row.product} ${row.sku} ${row.brand}`.toLowerCase().includes(term));
    const start = (page - 1) * pageSize;
    return json({ items: mapped.slice(start, start + pageSize), total: mapped.length, page, pageSize });
  }

  if (method === "PATCH" && parts[0] === "inventory" && parts.length === 2) {
    const gate = requireUser(req, ["ADMIN", "STORE_OPERATOR"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const updated = updateDB((db) => {
      const row = db.inventory.find((item) => item.id === parts[1]);
      if (!row) return null;
      if (gate.user!.role === "STORE_OPERATOR" && row.storeId !== gate.user!.storeId) return "forbidden";
      if (typeof body.stock === "number") row.stock = Math.max(0, Math.round(body.stock));
      if (typeof body.restock === "number") row.stock += Math.max(0, Math.round(body.restock));
      if (typeof body.disabled === "boolean") row.disabled = body.disabled;
      row.updatedAt = new Date().toISOString();
      return row;
    });
    if (updated === "forbidden") return fail("You can only update your own store.", 403);
    if (!updated) return fail("Inventory row not found.", 404);
    return json({ inventory: updated });
  }

  if (method === "GET" && path === "cart") {
    const user = sessionUser(req);
    const result = updateDB((db) => {
      const { cart, created } = ensureCart(db, req, user);
      cart.updatedAt = new Date().toISOString();
      return { view: cartView(db, cart), created, id: cart.id };
    });
    return json(result.view, 200, result.created ? [{ name: "mi_cart", value: result.id, maxAge: 60 * 60 * 24 * 30 }] : []);
  }

  if (method === "PATCH" && path === "cart") {
    const user = sessionUser(req);
    const body = await readBody(req);
    const result = updateDB((db) => {
      const { cart, created } = ensureCart(db, req, user);
      if ("promoCode" in body) cart.promoCode = body.promoCode ? String(body.promoCode).trim().toUpperCase() : null;
      if (typeof body.lat === "number" && typeof body.lng === "number") {
        cart.lat = body.lat;
        cart.lng = body.lng;
      }
      if (typeof body.addressLabel === "string") cart.addressLabel = body.addressLabel;
      cart.updatedAt = new Date().toISOString();
      return { view: cartView(db, cart), created, id: cart.id };
    });
    return json(result.view, 200, result.created ? [{ name: "mi_cart", value: result.id, maxAge: 60 * 60 * 24 * 30 }] : []);
  }

  if (method === "POST" && path === "cart/items") {
    const user = sessionUser(req);
    const body = await readBody(req);
    const productKey = String(body.productId ?? "");
    const quantity = Math.max(1, Math.min(12, Number(body.quantity ?? 1)));
    const result = updateDB((db) => {
      const product = db.products.find((item) => item.id === productKey || item.slug === productKey || item.sku === productKey);
      if (!product || product.deletedAt) return { error: "We couldn't find that product.", status: 404 };
      const { cart, created } = ensureCart(db, req, user);
      if (cart.lat == null || cart.lng == null) {
        return { error: "Enter your Eircode before adding items.", status: 400, created, id: cart.id };
      }
      const existing = db.cartItems.find((item) => item.cartId === cart.id && item.productId === product.id);
      const nextQty = (existing?.quantity ?? 0) + quantity;
      const message = unavailableCopy(db, cart.lat, cart.lng, product.id);
      const decision = selectStore({
        customerLat: cart.lat,
        customerLng: cart.lng,
        stores: candidates(db),
        settings: db.settings,
      });
      if (!decision.eligible || !decision.storeId) return { error: decision.message, status: 400, created, id: cart.id };
      if (unitsAt(db, decision.storeId, product.id) < nextQty) {
        return { error: message ?? "This product is currently unavailable.", status: 409, created, id: cart.id };
      }
      cart.storeId = decision.storeId;
      if (existing) {
        existing.quantity = nextQty;
        existing.updatedAt = new Date().toISOString();
      } else {
        db.cartItems.push({
          id: newId(),
          cartId: cart.id,
          productId: product.id,
          quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      cart.updatedAt = new Date().toISOString();
      return { view: cartView(db, cart), created, id: cart.id };
    });
    if ("error" in result && result.error) {
      return json({ error: result.error }, result.status ?? 400, result.created ? [{ name: "mi_cart", value: result.id!, maxAge: 60 * 60 * 24 * 30 }] : []);
    }
    return json(result.view, 200, result.created ? [{ name: "mi_cart", value: result.id, maxAge: 60 * 60 * 24 * 30 }] : []);
  }

  if ((method === "PATCH" || method === "DELETE") && parts[0] === "cart" && parts[1] === "items" && parts[2]) {
    const user = sessionUser(req);
    const body = method === "PATCH" ? await readBody(req) : {};
    const result = updateDB((db) => {
      const { cart, created } = ensureCart(db, req, user);
      const item = db.cartItems.find((entry) => entry.id === parts[2] && entry.cartId === cart.id);
      if (!item) return { error: "That item is no longer in your basket.", status: 404, created, id: cart.id };
      if (method === "DELETE" || Number(body.quantity) <= 0) {
        db.cartItems = db.cartItems.filter((entry) => entry.id !== item.id);
      } else {
        const quantity = Math.max(1, Math.min(12, Number(body.quantity)));
        const activeStore = cart.storeId;
        if (cart.lat != null && cart.lng != null && activeStore && unitsAt(db, activeStore, item.productId) < quantity) {
          return { error: "There isn't enough stock at your store for that quantity.", status: 409, created, id: cart.id };
        }
        item.quantity = quantity;
        item.updatedAt = new Date().toISOString();
      }
      return { view: cartView(db, cart), created, id: cart.id };
    });
    if ("error" in result && result.error) return json({ error: result.error }, result.status ?? 400);
    return json(result.view, 200, result.created ? [{ name: "mi_cart", value: result.id, maxAge: 60 * 60 * 24 * 30 }] : []);
  }

  if (method === "POST" && path === "delivery/check") {
    const body = await readBody(req);
    let lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
    let lng = typeof body.lng === "number" ? body.lng : Number(body.lng);
    let resolved = null as ReturnType<typeof resolveAddressQuery>;
    if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && body.query) {
      resolved = resolveAddressQuery(String(body.query));
      if (!resolved) return fail("Sorry, we couldn't find your location.");
      lat = resolved.lat;
      lng = resolved.lng;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return fail("Sorry, we couldn't find your location.");
    const preset = resolved ?? DEMO_LOCATIONS.find((item) => Math.abs(item.lat - lat) < 0.0002 && Math.abs(item.lng - lng) < 0.0002) ?? null;
    const db = readDB();
    const decision = selectStore({
      customerLat: lat,
      customerLng: lng,
      stores: candidates(db),
      subtotalCents: Number(body.subtotalCents ?? 0),
      settings: db.settings,
    });
    const store = db.stores.find((item) => item.id === decision.storeId) ?? null;
    return json({
      ...decision,
      zone: store?.region ?? null,
      store: store
        ? { id: store.id, name: store.name, address: `${store.addressLine}, ${store.city}`, region: store.region, status: store.status }
        : null,
      address: preset,
    });
  }

  if (method === "POST" && path === "orders") {
    const user = sessionUser(req);
    const body = await readBody(req);
    if (body.fail === true) return fail("Your payment couldn't be completed.", 402);
    const methodName = String(body.paymentMethod ?? "") as PaymentMethod;
    if (!["card", "apple_pay", "google_pay"].includes(methodName)) {
      return fail("Your payment couldn't be completed.");
    }
    const name = String(body.name ?? "").trim();
    const phone = normalisePhone(String(body.phone ?? ""));
    const line1 = String(body.line1 ?? "").trim();
    const line2 = String(body.line2 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const eircode = normaliseEircode(String(body.eircode ?? ""));
    const instructions = String(body.instructions ?? "").trim();
    if (name.length < 2 || line1.length < 3 || city.length < 2) return fail("Add the name and delivery address.");
    if (!/^\+353\d{7,10}$/.test(phone)) return fail("Use an Irish mobile or landline, starting with +353.");
    if (!/^[AC-FHKNPRTV-Y]\d{2}\s[0-9AC-FHKNPRTV-Y]{4}$/i.test(eircode)) {
      return fail("Enter a valid Eircode, for example D02 XY45.");
    }
    const placed = updateDB((db) => {
      const { cart } = ensureCart(db, req, user);
      const view = cartView(db, cart);
      if (!view.items.length) return { error: "Your basket is empty." };
      if (cart.lat == null || cart.lng == null || !view.store || !view.eligible) {
        return { error: view.deliveryMessage || "We don't deliver to this area yet." };
      }
      if (view.unavailableCount > 0) return { error: "This product is currently unavailable." };
      const lines = view.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
      for (const line of lines) {
        if (unitsAt(db, view.store.id, line.productId) < line.quantity) {
          return { error: "This product is currently unavailable." };
        }
      }
      const number = `MI-${db.meta.nextOrderNumber++}`;
      const now = new Date().toISOString();
      const order: Order = {
        id: newId(),
        number,
        userId: user?.id ?? cart.userId,
        storeId: view.store.id,
        status: "PLACED",
        customerName: name,
        phone,
        addressLine: line2 ? `${line1}, ${line2}` : line1,
        city,
        eircode,
        instructions,
        lat: cart.lat,
        lng: cart.lng,
        subtotalCents: view.subtotalCents,
        discountCents: view.discountCents,
        deliveryFeeCents: view.deliveryFeeCents ?? 0,
        totalCents: view.totalCents ?? view.subtotalCents,
        promoCode: view.discountCents ? cart.promoCode : null,
        etaMinutes: view.etaMinutes ?? 35,
        etaLabel: view.etaLabel ?? formatEtaRange(view.etaMinutes ?? 35),
        distanceKm: view.distanceKm ?? 0,
        paymentMethod: methodName,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      db.orders.push(order);
      view.items.forEach((item) => {
        db.orderItems.push({
          id: newId(),
          orderId: order.id,
          productId: item.productId,
          name: item.name,
          brand: item.brand,
          size: item.size,
          sku: item.sku,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
          picked: false,
          createdAt: now,
          updatedAt: now,
        });
        const row = db.inventory.find((inventory) => inventory.storeId === order.storeId && inventory.productId === item.productId);
        if (row) row.stock = Math.max(0, row.stock - item.quantity);
      });
      db.payments.push({
        id: newId(),
        orderId: order.id,
        method: methodName,
        status: "PAID",
        amountCents: order.totalCents,
        provider: "demo",
        last4: methodName === "card" ? "4242" : null,
        createdAt: now,
        updatedAt: now,
      });
      db.deliveryStatusHistory.push({
        id: newId(),
        deliveryId: order.id,
        orderId: order.id,
        status: "PLACED",
        note: "Order placed",
        createdAt: now,
      });
      if (order.userId) {
        db.notifications.push({
          id: newId(),
          userId: order.userId,
          title: "Order confirmed",
          body: `${order.number} is with ${view.store.name}.`,
          read: false,
          createdAt: now,
        });
      }
      db.cartItems = db.cartItems.filter((item) => item.cartId !== cart.id);
      cart.promoCode = null;
      db.meta.presentationLocked = true;
      return { order: publicOrder(db, order) };
    });
    if ("error" in placed && placed.error) return fail(placed.error);
    const cookie = remember(ordersCookie(req), placed.order!.number);
    return json({ order: placed.order }, 201, [{ name: "mi_orders", value: cookie, maxAge: 60 * 60 * 24 * 30 }]);
  }

  if (method === "GET" && path === "orders") {
    const user = sessionUser(req);
    const db = readDB();
    const remembered = ordersCookie(req).split(",").filter(Boolean);
    const orders = db.orders
      .filter((order) => !order.deletedAt)
      .filter((order) => (user && order.userId === user.id) || remembered.includes(order.number) || (user?.role === "ADMIN"))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, user?.role === "ADMIN" ? 200 : 30)
      .map((order) => publicOrder(db, order));
    return json({ orders });
  }

  if (method === "GET" && parts[0] === "orders" && parts.length === 2) {
    const db = readDB();
    const order = findOrder(db, parts[1]);
    if (!order) return fail("We couldn't find that order.", 404);
    return json({ order: publicOrder(db, order) });
  }

  if (method === "GET" && parts[0] === "orders" && parts[2] === "tracking") {
    const db = readDB();
    const order = findOrder(db, parts[1]);
    if (!order) return fail("We couldn't find that order.", 404);
    return json({ tracking: tracking(db, order) });
  }

  if (method === "POST" && parts[0] === "orders" && parts[2] === "message") {
    const body = await readBody(req);
    const text = String(body.message ?? "").trim();
    if (text.length < 2) return fail("Write a short message for your rider.");
    const saved = updateDB((db) => {
      const order = findOrder(db, parts[1]);
      if (!order) return null;
      db.notifications.push({
        id: newId(),
        userId: order.userId,
        title: `Message about ${order.number}`,
        body: text,
        read: false,
        createdAt: new Date().toISOString(),
      });
      return { ok: true };
    });
    if (!saved) return fail("We couldn't find that order.", 404);
    return json({ ok: true, notice: "Message saved for the rider. This demo doesn't send SMS." });
  }

  if (method === "GET" && path === "rider/orders") {
    const gate = requireUser(req, ["RIDER", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    const rider = gate.user.role === "RIDER"
      ? db.riders.find((item) => item.id === gate.user!.riderId)
      : db.riders.find((item) => item.id === q.get("riderId")) ?? db.riders[0];
    if (!rider) return fail("Rider profile missing.", 404);
    const deliveredToday = db.deliveries.filter((delivery) => {
      return delivery.riderId === rider.id && delivery.status === "DELIVERED" && dublinDateKey(new Date(delivery.updatedAt)) === dublinDateKey();
    });
    const earningsCents = deliveredToday.reduce((sum, delivery) => sum + 350 + Math.round(delivery.distanceKm * 40), 0);
    const active = db.deliveries
      .filter((delivery) => delivery.riderId === rider.id && delivery.status !== "DELIVERED")
      .map((delivery) => {
        const order = db.orders.find((item) => item.id === delivery.orderId);
        return order ? { delivery, order: publicOrder(db, order) } : null;
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
    const available = db.orders
      .filter((order) => order.storeId === rider.storeId && order.status === "PACKED")
      .filter((order) => !db.deliveries.some((delivery) => delivery.orderId === order.id && delivery.riderId))
      .map((order) => publicOrder(db, order));
    const completed = db.deliveries.filter((delivery) => delivery.riderId === rider.id && delivery.status === "DELIVERED").length;
    return json({
      rider: { ...rider, firstName: rider.name.split(" ")[0] },
      earningsCents,
      completed,
      active,
      available,
    });
  }

  if (method === "POST" && parts[0] === "rider" && parts[1] === "orders" && parts[3] === "accept") {
    const gate = requireUser(req, ["RIDER", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const updated = updateDB((db) => {
      const rider = db.riders.find((item) => item.id === gate.user!.riderId) ?? db.riders.find((item) => item.online);
      const order = findOrder(db, parts[2]);
      if (!rider || !order) return null;
      if (!rider.online) return { error: "Switch online before accepting a delivery." };
      if (!["PACKED", "RIDER_ASSIGNED"].includes(order.status) && order.status !== "OUT_FOR_DELIVERY") {
        if (order.status !== "PACKED") return { error: "This order isn't packed yet." };
      }
      const now = new Date().toISOString();
      let delivery = db.deliveries.find((item) => item.orderId === order.id);
      if (!delivery) {
        delivery = {
          id: newId(),
          orderId: order.id,
          riderId: rider.id,
          storeId: order.storeId,
          status: "ACCEPTED",
          otp: "1234",
          etaMinutes: Math.max(12, Math.round(order.etaMinutes * 0.55)),
          distanceKm: order.distanceKm,
          customerLat: order.lat,
          customerLng: order.lng,
          createdAt: now,
          updatedAt: now,
        };
        db.deliveries.push(delivery);
      } else {
        delivery.riderId = rider.id;
        delivery.status = "ACCEPTED";
        delivery.updatedAt = now;
      }
      order.status = "RIDER_ASSIGNED";
      order.updatedAt = now;
      db.deliveryStatusHistory.push({
        id: newId(),
        deliveryId: delivery.id,
        orderId: order.id,
        status: "ACCEPTED",
        note: `${rider.name.split(" ")[0]} accepted the delivery`,
        createdAt: now,
      });
      return { order: publicOrder(db, order) };
    });
    if (!updated) return fail("We couldn't find that delivery.", 404);
    if ("error" in updated && updated.error) return fail(updated.error);
    return json(updated);
  }

  if (method === "POST" && parts[0] === "rider" && parts[1] === "orders" && parts[3] === "status") {
    const gate = requireUser(req, ["RIDER", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const next = String(body.status ?? "") as DeliveryStatus;
    if (!DELIVERY_FLOW.includes(next)) return fail("Unknown delivery status.");
    const updated = updateDB((db) => {
      const order = findOrder(db, parts[2]);
      const rider = db.riders.find((item) => item.id === gate.user!.riderId) ?? db.riders.find((item) => item.id === db.deliveries.find((delivery) => delivery.orderId === order?.id)?.riderId);
      if (!order || !rider) return null;
      const delivery = db.deliveries.find((item) => item.orderId === order.id);
      if (!delivery || delivery.riderId !== rider.id) return { error: "Accept the delivery first." };
      const from = DELIVERY_FLOW.indexOf(delivery.status);
      const to = DELIVERY_FLOW.indexOf(next);
      if (to !== from + 1) return { error: "Update the delivery one step at a time." };
      if (next === "DELIVERED" && String(body.otp ?? "") !== delivery.otp) {
        return { error: "That OTP doesn't match. The demo code is 1234." };
      }
      const now = new Date().toISOString();
      delivery.status = next;
      delivery.updatedAt = now;
      if (next === "ACCEPTED" || next === "ARRIVED_AT_STORE") order.status = "RIDER_ASSIGNED";
      if (next === "PICKED_UP" || next === "ON_THE_WAY" || next === "ARRIVED") order.status = "OUT_FOR_DELIVERY";
      if (next === "DELIVERED") {
        order.status = "DELIVERED";
        rider.completedCount += 1;
      }
      order.updatedAt = now;
      db.deliveryStatusHistory.push({
        id: newId(),
        deliveryId: delivery.id,
        orderId: order.id,
        status: next === "ON_THE_WAY" ? "OUT_FOR_DELIVERY" : next,
        note: next.replaceAll("_", " ").toLowerCase(),
        createdAt: now,
      });
      if (order.userId) {
        db.notifications.push({
          id: newId(),
          userId: order.userId,
          title: next === "DELIVERED" ? "Delivered" : "Delivery update",
          body: `${order.number} is now ${next.replaceAll("_", " ").toLowerCase()}.`,
          read: false,
          createdAt: now,
        });
      }
      return { order: publicOrder(db, order) };
    });
    if (!updated) return fail("We couldn't find that delivery.", 404);
    if ("error" in updated && updated.error) return fail(updated.error);
    return json(updated);
  }

  if (method === "POST" && path === "rider/online") {
    const gate = requireUser(req, ["RIDER", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const rider = updateDB((db) => {
      const row = db.riders.find((item) => item.id === gate.user!.riderId);
      if (!row) return null;
      row.online = Boolean(body.online);
      row.updatedAt = new Date().toISOString();
      return row;
    });
    if (!rider) return fail("Rider profile missing.", 404);
    return json({ rider });
  }

  if (method === "GET" && path === "store/dashboard") {
    const gate = requireUser(req, ["STORE_OPERATOR", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    const storeId = gate.user.role === "ADMIN" ? q.get("storeId") || db.stores[0].id : gate.user.storeId;
    const store = db.stores.find((item) => item.id === storeId);
    if (!store) return fail("Store not found.", 404);
    const orders = db.orders
      .filter((order) => order.storeId === store.id && !order.deletedAt)
      .filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((order) => publicOrder(db, order));
    const lowStock = db.inventory
      .filter((row) => row.storeId === store.id && availableUnits(row) <= row.reorderThreshold)
      .slice(0, 6)
      .map((row) => {
        const product = db.products.find((item) => item.id === row.productId);
        return { sku: row.sku, name: product?.name ?? row.sku, available: availableUnits(row) };
      });
    return json({
      store,
      orders,
      lowStock,
      riders: db.riders.filter((rider) => rider.storeId === store.id),
      stores: gate.user.role === "ADMIN" ? db.stores : [store],
    });
  }

  if (method === "POST" && parts[0] === "store" && parts[1] === "orders" && parts[3]) {
    const gate = requireUser(req, ["STORE_OPERATOR", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const action = parts[3];
    const body = await readBody(req);
    const updated = updateDB((db) => {
      const order = findOrder(db, parts[2]);
      if (!order) return null;
      if (gate.user!.role === "STORE_OPERATOR" && order.storeId !== gate.user!.storeId) {
        return { error: "That order belongs to another store." };
      }
      const now = new Date().toISOString();
      const push = (status: string, note: string) => {
        db.deliveryStatusHistory.push({ id: newId(), deliveryId: order.id, orderId: order.id, status, note, createdAt: now });
      };
      if (action === "accept") {
        if (order.status !== "PLACED") return { error: "This order has already been accepted." };
        order.status = "STORE_CONFIRMED";
        push("STORE_CONFIRMED", "Store confirmed");
      } else if (action === "picking") {
        if (!["STORE_CONFIRMED", "PLACED"].includes(order.status)) return { error: "Accept the order before picking." };
        order.status = "PICKING";
        push("PICKING", "Picking your items");
      } else if (action === "pick") {
        const item = db.orderItems.find((entry) => entry.id === String(body.itemId) && entry.orderId === order.id);
        if (!item) return { error: "Item not on this order." };
        if (order.status === "STORE_CONFIRMED" || order.status === "PLACED") order.status = "PICKING";
        item.picked = body.picked !== false;
        item.updatedAt = now;
      } else if (action === "pack") {
        const items = db.orderItems.filter((entry) => entry.orderId === order.id);
        if (items.some((entry) => !entry.picked)) return { error: "Mark every item as picked before packing." };
        order.status = "PACKED";
        push("PACKED", "Order packed");
      } else {
        return { error: "Unknown store action." };
      }
      order.updatedAt = now;
      return { order: publicOrder(db, order) };
    });
    if (!updated) return fail("We couldn't find that order.", 404);
    if ("error" in updated && updated.error) return fail(updated.error);
    return json(updated);
  }

  if (method === "PATCH" && path === "store/status") {
    const gate = requireUser(req, ["STORE_OPERATOR", "ADMIN"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const status = String(body.status ?? "");
    if (!["OPEN", "BUSY", "CLOSED"].includes(status)) return fail("Status must be OPEN, BUSY or CLOSED.");
    const store = updateDB((db) => {
      const storeId = gate.user!.role === "ADMIN" ? String(body.storeId ?? gate.user!.storeId ?? db.stores[0].id) : gate.user!.storeId;
      const row = db.stores.find((item) => item.id === storeId);
      if (!row) return null;
      row.status = status as "OPEN" | "BUSY" | "CLOSED";
      row.updatedAt = new Date().toISOString();
      return row;
    });
    if (!store) return fail("Store not found.", 404);
    return json({ store });
  }

  if (method === "GET" && path === "admin/dashboard") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    return json({
      metrics: analytics(db),
      recent: db.orders
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 8)
        .map((order) => publicOrder(db, order)),
    });
  }

  if (method === "GET" && path === "admin/orders") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    const status = q.get("status");
    const storeId = q.get("storeId");
    const term = (q.get("q") ?? "").toLowerCase();
    const page = Math.max(1, Number(q.get("page") ?? 1));
    let orders = db.orders.filter((order) => !order.deletedAt);
    if (status) orders = orders.filter((order) => order.status === status);
    if (storeId) orders = orders.filter((order) => order.storeId === storeId);
    if (term) orders = orders.filter((order) => `${order.number} ${order.customerName} ${order.city}`.toLowerCase().includes(term));
    orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const pageSize = 15;
    const start = (page - 1) * pageSize;
    return json({
      orders: orders.slice(start, start + pageSize).map((order) => publicOrder(db, order)),
      total: orders.length,
      page,
      pageSize,
    });
  }

  if (method === "GET" && path === "admin/analytics") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    return json({ analytics: analytics(readDB()) });
  }

  if (method === "GET" && path === "admin/settings") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    return json({ settings: readDB().settings });
  }

  if (method === "PATCH" && path === "admin/settings") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const settings = updateDB((db) => {
      const next = { ...db.settings };
      const numeric: Array<keyof typeof next> = [
        "radiusKm",
        "maxEtaMinutes",
        "feeNearCents",
        "feeFarCents",
        "nearKm",
        "freeDeliveryThresholdCents",
      ];
      numeric.forEach((key) => {
        if (typeof body[key] === "number" && Number.isFinite(body[key])) {
          (next[key] as number) = Math.round(body[key] as number);
        }
      });
      if (next.radiusKm < 1 || next.maxEtaMinutes < 10) return null;
      db.settings = next;
      return db.settings;
    });
    if (!settings) return fail("Check the delivery settings and try again.");
    return json({ settings });
  }

  if (method === "PATCH" && parts[0] === "admin" && parts[1] === "stores" && parts[2]) {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const status = String(body.status ?? "");
    if (!["OPEN", "BUSY", "CLOSED"].includes(status)) return fail("Status must be OPEN, BUSY or CLOSED.");
    const store = updateDB((db) => {
      const row = db.stores.find((item) => item.id === parts[2] || item.slug === parts[2]);
      if (!row) return null;
      row.status = status as "OPEN" | "BUSY" | "CLOSED";
      row.updatedAt = new Date().toISOString();
      return row;
    });
    if (!store) return fail("Store not found.", 404);
    return json({ store });
  }

  if (method === "GET" && path === "admin/customers") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    const customers = db.users
      .filter((user) => user.role === "CUSTOMER" && !user.deletedAt)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        orders: db.orders.filter((order) => order.userId === user.id).length,
        createdAt: user.createdAt,
      }));
    return json({ customers });
  }

  if (method === "GET" && path === "admin/riders") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const db = readDB();
    return json({
      riders: db.riders.map((rider) => ({
        ...rider,
        store: db.stores.find((store) => store.id === rider.storeId)?.name,
        active: db.deliveries.some((delivery) => delivery.riderId === rider.id && delivery.status !== "DELIVERED"),
      })),
    });
  }

  if (method === "GET" && path === "admin/promotions") {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    return json({ promotions: readDB().promotions.filter((promo) => !promo.deletedAt) });
  }

  if (method === "PATCH" && parts[0] === "admin" && parts[1] === "promotions" && parts[2]) {
    const gate = requireUser(req, ["ADMIN"]);
    if (!gate.user) return gate.response!;
    const body = await readBody(req);
    const promo = updateDB((db) => {
      const row = db.promotions.find((item) => item.id === parts[2]);
      if (!row) return null;
      if (typeof body.active === "boolean") row.active = body.active;
      row.updatedAt = new Date().toISOString();
      return row;
    });
    if (!promo) return fail("Promotion not found.", 404);
    return json({ promotion: promo });
  }

  if (method === "POST" && path === "waitlist") {
    const body = await readBody(req);
    const email = String(body.email ?? "").trim().toLowerCase();
    const address = String(body.address ?? "").trim();
    if (!email.includes("@")) return fail("Add an email so we can tell you when we launch there.");
    updateDB((db) => {
      db.waitlist.push({ id: newId(), email, address, createdAt: new Date().toISOString() });
      return true;
    });
    return json({ ok: true, message: "You're on the list. We'll email you when Mini India reaches your area." });
  }

  if (method === "POST" && path === "contact") {
    const body = await readBody(req);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    if (name.length < 2 || !email.includes("@") || message.length < 8) {
      return fail("Add your name, email and a short message.");
    }
    updateDB((db) => {
      db.messages.push({ id: newId(), name, email, message, createdAt: new Date().toISOString() });
      return true;
    });
    return json({ ok: true, message: "Thanks. The Dublin team will reply on the next working day." });
  }

  if (method === "GET" && path === "home") {
    const { homePayload } = await import("@/server/queries");
    return json(homePayload());
  }

  return fail("We couldn't find that.", 404);
}
