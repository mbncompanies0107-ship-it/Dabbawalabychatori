import { CATEGORY_DEFAULTS, CATALOG, CATALOG_CATEGORIES } from "./catalog";
import { DEMO_LOCATIONS } from "./demo-locations";
import { DEFAULT_SETTINGS, formatEtaRange } from "./delivery";
import { dublinDateKey } from "./format";
import { idFrom, newId } from "./ids";
import { DEMO_PASSWORD, hashPassword } from "./passwords";
import type {
  Database,
  Delivery,
  DeliveryEvent,
  Inventory,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Rider,
  Store,
  User,
} from "./types";

export const STORE_DUBLIN = idFrom("store:dublin");
export const STORE_SANDYFORD = idFrom("store:sandyford");
export const STORE_LIMERICK = idFrom("store:limerick");

const NOW = () => new Date().toISOString();

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

const FIRST = [
  "Aoife", "Sean", "Niamh", "Conor", "Siobhan", "Patrick", "Emma", "Oisin", "Ciara", "Liam",
  "Saoirse", "Cian", "Maeve", "Declan", "Orla", "Finn", "Aisling", "Padraig", "Hannah", "Jack",
  "Amira", "Yusuf", "Priya", "Daniel", "Sofia", "Laura", "Mark", "Chen", "Fatima", "Roisin",
];
const LAST = [
  "Murphy", "Kelly", "Walsh", "Byrne", "O'Brien", "Ryan", "Doyle", "McCarthy", "O'Connor", "Lynch",
  "Brennan", "Fitzgerald", "Khan", "Patel", "Nowak", "Kowalski", "Okafor", "Nguyen", "Singh", "Hayes",
];

const STOCK_OUT: Record<string, string[]> = {
  [STORE_LIMERICK]: ["FRESH-CURRY", "AMUL-YOG-400"],
  [STORE_DUBLIN]: ["HIMA-NEEM"],
  [STORE_SANDYFORD]: ["FRZ-NAAN-4", "BALAJI-135"],
};

const LOW_STOCK: Record<string, string[]> = {
  [STORE_SANDYFORD]: ["FRZ-SAMOSA-12", "FRESH-CORI"],
  [STORE_DUBLIN]: ["AVON-MILK-1"],
  [STORE_LIMERICK]: ["IG-RICE-5"],
};

export function createDatabase(): Database {
  const now = NOW();
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const stores = buildStores(now);
  const categories = CATALOG_CATEGORIES.map((category, index) => ({
    id: idFrom(`category:${category.slug}`),
    slug: category.slug,
    name: category.name,
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
  const categoryId = new Map(categories.map((category) => [category.slug, category.id]));
  const products: Product[] = CATALOG.map((item) => {
    const defaults = CATEGORY_DEFAULTS[item.category];
    const flags = item.flags ?? "";
    return {
      id: idFrom(`product:${item.sku}`),
      sku: item.sku,
      slug: item.sku.toLowerCase(),
      name: item.name,
      brand: item.brand,
      size: item.size,
      categoryId: categoryId.get(item.category)!,
      description: item.blurb,
      ingredients: item.ingredients ?? defaults.ingredients,
      allergens: item.allergens ?? defaults.allergens,
      origin: item.origin,
      priceCents: item.priceCents,
      compareAtCents: item.compareAtCents ?? null,
      rating: item.rating,
      ratingCount: item.ratingCount,
      popular: flags.includes("p"),
      bestseller: flags.includes("b"),
      favourite: flags.includes("f"),
      isNew: flags.includes("n"),
      hue: item.hue,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  });

  const riderSeeds = [
    ["James O'Brien", STORE_DUBLIN, 4.9, true, "+353 87 410 2201"],
    ["Aoife Kelly", STORE_DUBLIN, 4.8, true, "+353 86 220 1184"],
    ["Daniel Okonkwo", STORE_DUBLIN, 4.7, true, "+353 85 610 4420"],
    ["Priya Walsh", STORE_SANDYFORD, 4.8, true, "+353 87 330 9088"],
    ["Sean Byrne", STORE_SANDYFORD, 4.6, true, "+353 83 441 7721"],
    ["Conor Hayes", STORE_LIMERICK, 4.8, true, "+353 86 900 2214"],
    ["Niamh Ryan", STORE_LIMERICK, 4.9, true, "+353 87 155 6630"],
    ["Fatima Rahman", STORE_DUBLIN, 4.7, false, "+353 85 277 0193"],
  ] as const;

  const riders: Rider[] = riderSeeds.map(([name, storeId, rating, online, phone], index) => {
    const store = stores.find((item) => item.id === storeId)!;
    return {
      id: idFrom(`rider:${name}`),
      userId: idFrom(`user:${name}`),
      name,
      phone,
      storeId,
      online,
      lat: store.lat + (index % 2 === 0 ? 0.004 : -0.003),
      lng: store.lng + (index % 3 === 0 ? 0.004 : -0.002),
      rating,
      completedCount: 40 + index * 17,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  });

  const users: User[] = [
    user("Aisling Byrne", "admin@miniindia.ie", "ADMIN", "+353 1 555 0100", null, null, passwordHash, now),
    user("Ciara Walsh", "store@miniindia.ie", "STORE_OPERATOR", "+353 1 555 0142", STORE_DUBLIN, null, passwordHash, now),
    user("James O'Brien", "rider@miniindia.ie", "RIDER", "+353 87 410 2201", STORE_DUBLIN, idFrom("rider:James O'Brien"), passwordHash, now),
    user("Sarah Murphy", "customer@example.com", "CUSTOMER", "+353 87 123 4567", null, null, passwordHash, now),
  ];

  for (let i = 0; i < 36; i += 1) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
    users.push(
      user(
        name,
        `customer${i + 1}@example.com`,
        "CUSTOMER",
        `+353 8${(i % 7) + 3} ${100 + i} ${2000 + i}`,
        null,
        null,
        passwordHash,
        iso(-i * 86_400_000),
      ),
    );
  }

  const inventory: Inventory[] = [];
  stores.forEach((store, storeIndex) => {
    products.forEach((product, productIndex) => {
      let stock = 18 + ((productIndex * 5 + storeIndex * 7) % 36);
      let reserved = productIndex % 7 === 0 ? 2 : 0;
      if (STOCK_OUT[store.id]?.includes(product.sku)) {
        stock = 0;
        reserved = 0;
      } else if (LOW_STOCK[store.id]?.includes(product.sku)) {
        stock = 4;
        reserved = 2;
      }
      inventory.push({
        id: idFrom(`inv:${store.id}:${product.id}`),
        storeId: store.id,
        productId: product.id,
        sku: product.sku,
        stock,
        reserved,
        reorderThreshold: 6,
        disabled: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });
  });

  const db: Database = {
    users,
    stores,
    categories,
    products,
    inventory,
    addresses: [
      {
        id: idFrom("address:sarah"),
        userId: idFrom("user:Sarah Murphy"),
        name: "Sarah Murphy",
        phone: "+353 87 123 4567",
        line1: "18 Dame Street",
        line2: "Apartment 3",
        city: "Dublin 2",
        county: "Dublin",
        eircode: "D02 XY45",
        instructions: "Second bell. Reception can take the delivery if I'm not in.",
        lat: DEMO_LOCATIONS[0].lat,
        lng: DEMO_LOCATIONS[0].lng,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ],
    carts: [],
    cartItems: [],
    orders: [],
    orderItems: [],
    payments: [],
    riders,
    deliveries: [],
    deliveryStatusHistory: [],
    promotions: [
      {
        id: idFrom("promo:welcome"),
        code: "WELCOME",
        description: "€5 off baskets over €30",
        amountCents: 500,
        minSubtotalCents: 3000,
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: idFrom("promo:mini3"),
        code: "MINI3",
        description: "€3 off baskets over €20",
        amountCents: 300,
        minSubtotalCents: 2000,
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ],
    reviews: [
      review("IG-RICE-5", "Sarah Murphy", 5, "The grains stay long after cooking. I use it for Friday biryani."),
      review("ASH-ATTA-5", "Conor Hayes", 5, "Soft rotis and it arrived the same hour I ordered."),
      review("HAL-BHUJ-200", "Niamh Ryan", 4, "Fresh bag, properly sealed. Gone by Sunday."),
      review("PRIYA-MANGO-300", "Aoife Kelly", 5, "Proper pickle, not a mild supermarket version."),
      review("THUMS-125", "Sean Doyle", 4, "Cold enough when it arrived in Sandyford."),
      review("MAGGI-8", "Priya Walsh", 5, "The 8-pack is the one to get if you have students in the house."),
      review("AMUL-PAN-200", "Daniel Okonkwo", 5, "Paneer was fresh and the block wasn't swimming in water."),
      review("TATA-TEA-500", "Ciara Walsh", 5, "Strong enough for masala chai. Better value than the corner shop."),
    ],
    notifications: [
      {
        id: idFrom("note:sarah-1"),
        userId: idFrom("user:Sarah Murphy"),
        title: "Order on the way",
        body: "James is heading to Dame Street with order MI-10482.",
        read: false,
        createdAt: iso(-12 * 60_000),
      },
    ],
    waitlist: [],
    messages: [],
    settings: { ...DEFAULT_SETTINGS },
    meta: {
      nextOrderNumber: 10483,
      anchorDate: dublinDateKey(),
      presentationLocked: false,
    },
  };

  seedHistoricalOrders(db);
  seedHeroOrder(db);
  return db;
}

function user(
  name: string,
  email: string,
  role: User["role"],
  phone: string,
  storeId: string | null,
  riderId: string | null,
  passwordHash: string,
  createdAt: string,
): User {
  return {
    id: idFrom(`user:${name}`),
    role,
    name,
    email,
    phone,
    passwordHash,
    storeId,
    riderId,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };
}

function review(sku: string, author: string, rating: number, comment: string) {
  return {
    id: idFrom(`review:${sku}:${author}`),
    productId: idFrom(`product:${sku}`),
    userId: null,
    author,
    rating,
    comment,
    createdAt: iso(-4 * 86_400_000),
    updatedAt: iso(-4 * 86_400_000),
    deletedAt: null,
  };
}

function buildStores(now: string): Store[] {
  const rows: Array<[string, string, string, string, string, string, number, number, string]> = [
    [
      STORE_DUBLIN,
      "Mini India Dublin City",
      "dublin-city",
      "28 Westmoreland Street",
      "Dublin 2",
      "D02 WK40",
      53.3463,
      -6.2589,
      "+353 1 555 0142",
    ],
    [
      STORE_SANDYFORD,
      "Mini India Sandyford",
      "sandyford",
      "7 Blackthorn Avenue, Sandyford",
      "Dublin 18",
      "D18 YX29",
      53.2775,
      -6.2075,
      "+353 1 555 0188",
    ],
    [
      STORE_LIMERICK,
      "Mini India Limerick",
      "limerick",
      "Unit 1, Chatori, Singland",
      "Limerick",
      "V94 F8F2",
      52.6642,
      -8.6048,
      "+353 61 555 0170",
    ],
  ];
  return rows.map(([id, name, slug, addressLine, city, eircode, lat, lng, phone]) => ({
    id,
    name,
    slug,
    addressLine,
    city,
    region: city.startsWith("Limerick") ? "Limerick" : "Dublin",
    eircode,
    phone,
    lat,
    lng,
    status: "OPEN",
    openingHours: "08:00–23:00, seven days",
    serviceRadiusKm: 6,
    maxEtaMinutes: 60,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
}

function seedHeroOrder(db: Database) {
  const createdAt = iso(-26 * 60_000);
  const productSkus = ["IG-RICE-5", "ASH-ATTA-5", "TS-TOOR-1", "HAL-BHUJ-200", "PRIYA-MANGO-300", "THUMS-125"];
  const products = productSkus.map((sku) => db.products.find((product) => product.sku === sku)!);
  const subtotal = products.reduce((sum, product) => sum + product.priceCents, 0);
  const discount = 500;
  const deliveryFee = 299;
  const orderId = idFrom("order:MI-10482");
  const order: Order = {
    id: orderId,
    number: "MI-10482",
    userId: idFrom("user:Sarah Murphy"),
    storeId: STORE_DUBLIN,
    status: "OUT_FOR_DELIVERY",
    customerName: "Sarah Murphy",
    phone: "+353 87 123 4567",
    addressLine: "18 Dame Street, Apartment 3",
    city: "Dublin 2",
    eircode: "D02 XY45",
    instructions: "Second bell. Reception can take the delivery if I'm not in.",
    lat: DEMO_LOCATIONS[0].lat,
    lng: DEMO_LOCATIONS[0].lng,
    subtotalCents: subtotal,
    discountCents: discount,
    deliveryFeeCents: deliveryFee,
    totalCents: subtotal - discount + deliveryFee,
    promoCode: "WELCOME",
    etaMinutes: 28,
    etaLabel: formatEtaRange(28),
    distanceKm: 0.78,
    paymentMethod: "card",
    createdAt,
    updatedAt: iso(-8 * 60_000),
    deletedAt: null,
  };
  const items: OrderItem[] = products.map((product) => ({
    id: idFrom(`order-item:MI-10482:${product.sku}`),
    orderId,
    productId: product.id,
    name: product.name,
    brand: product.brand,
    size: product.size,
    sku: product.sku,
    unitPriceCents: product.priceCents,
    quantity: 1,
    picked: true,
    createdAt,
    updatedAt: iso(-18 * 60_000),
  }));
  const deliveryId = idFrom("delivery:MI-10482");
  const riderId = idFrom("rider:James O'Brien");
  const delivery: Delivery = {
    id: deliveryId,
    orderId,
    riderId,
    storeId: STORE_DUBLIN,
    status: "ON_THE_WAY",
    otp: "1234",
    etaMinutes: 18,
    distanceKm: 0.78,
    customerLat: order.lat,
    customerLng: order.lng,
    createdAt: iso(-20 * 60_000),
    updatedAt: iso(-8 * 60_000),
  };
  const historyRows: Array<[string, string, number]> = [
    ["PLACED", "Order placed", -26],
    ["STORE_CONFIRMED", "Dublin City accepted the order", -24],
    ["PICKING", "Ciara started picking", -22],
    ["PACKED", "Basket packed", -19],
    ["ASSIGNED", "James assigned", -16],
    ["ACCEPTED", "James accepted the delivery", -15],
    ["ARRIVED_AT_STORE", "James reached Westmoreland Street", -13],
    ["PICKED_UP", "Order collected", -11],
    ["ON_THE_WAY", "On the way to Dame Street", -8],
  ];
  const history: DeliveryEvent[] = historyRows.map(([status, note, minutes]) => ({
    id: idFrom(`event:MI-10482:${status}`),
    deliveryId,
    orderId,
    status,
    note,
    createdAt: iso(Number(minutes) * 60_000),
  }));

  db.orders.push(order);
  db.orderItems.push(...items);
  db.payments.push({
    id: idFrom("payment:MI-10482"),
    orderId,
    method: "card",
    status: "PAID",
    amountCents: order.totalCents,
    provider: "demo",
    last4: "4242",
    createdAt,
    updatedAt: createdAt,
  });
  db.deliveries.push(delivery);
  db.deliveryStatusHistory.push(...history);

  for (const product of products) {
    const row = db.inventory.find((item) => item.storeId === STORE_DUBLIN && item.productId === product.id);
    if (row && row.stock > 0) row.stock -= 1;
  }
}

function seedHistoricalOrders(db: Database) {
  const storeIds = [STORE_DUBLIN, STORE_SANDYFORD, STORE_LIMERICK];
  const customers = db.users.filter((user) => user.role === "CUSTOMER" && user.email !== "customer@example.com");
  const sellable = db.products.filter((product) => product.priceCents > 150);
  let sequence = 10001;

  const plan: Array<{ ageHours: number; status: OrderStatus; store: number }> = [];
  for (let i = 0; i < 28; i += 1) {
    plan.push({ ageHours: 0.25 + (i % 10) * 0.65, status: "DELIVERED", store: i % 3 });
  }
  // Keep a spread across the previous six days regardless of clock time.
  for (let day = 1; day <= 6; day += 1) {
    for (let i = 0; i < 16; i += 1) {
      plan.push({
        ageHours: day * 24 + (i % 12) + 0.3,
        status: i % 19 === 0 ? "CANCELLED" : "DELIVERED",
        store: (day + i) % 3,
      });
    }
  }
  plan.push(
    { ageHours: 0.3, status: "PLACED", store: 0 },
    { ageHours: 0.5, status: "PICKING", store: 0 },
    { ageHours: 0.8, status: "PACKED", store: 1 },
    { ageHours: 0.6, status: "STORE_CONFIRMED", store: 2 },
  );

  plan.forEach((entry, index) => {
    const count = 2 + (index % 4);
    const chosen: Product[] = [];
    for (let n = 0; n < count; n += 1) {
      chosen.push(sellable[(index * 3 + n * 5) % sellable.length]);
    }
    const subtotal = chosen.reduce((sum, product) => sum + product.priceCents, 0);
    const distance = [1.2, 2.4, 3.6, 4.8][index % 4];
    const deliveryFee = entry.status === "CANCELLED" ? 0 : subtotal >= 5000 ? 0 : distance <= 3 ? 299 : 499;
    const discount = index % 6 === 0 && subtotal >= 3000 ? 300 : 0;
    const storeId = storeIds[entry.store];
    const customer = customers[index % customers.length];
    const created = iso(-entry.ageHours * 3_600_000);
    const number = `MI-${sequence++}`;
    const orderId = idFrom(`order:${number}`);
    const cities = ["Dublin 2", "Sandyford, Dublin 18", "Limerick"];
    const order: Order = {
      id: orderId,
      number,
      userId: customer.id,
      storeId,
      status: entry.status,
      customerName: customer.name,
      phone: customer.phone,
      addressLine: `${10 + (index % 40)} Demo Street`,
      city: cities[entry.store],
      eircode: entry.store === 2 ? "V94 AA11" : entry.store === 1 ? "D18 BB22" : "D02 CC33",
      instructions: "",
      lat: db.stores.find((store) => store.id === storeId)!.lat - 0.01,
      lng: db.stores.find((store) => store.id === storeId)!.lng,
      subtotalCents: subtotal,
      discountCents: discount,
      deliveryFeeCents: deliveryFee,
      totalCents: Math.max(0, subtotal - discount + deliveryFee),
      promoCode: discount ? "MINI3" : null,
      etaMinutes: 24 + Math.round(distance * 5),
      etaLabel: formatEtaRange(24 + Math.round(distance * 5)),
      distanceKm: distance,
      paymentMethod: index % 5 === 0 ? "apple_pay" : index % 7 === 0 ? "google_pay" : "card",
      createdAt: created,
      updatedAt: created,
      deletedAt: null,
    };
    db.orders.push(order);
    chosen.forEach((product, itemIndex) => {
      db.orderItems.push({
        id: idFrom(`order-item:${number}:${itemIndex}`),
        orderId,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        size: product.size,
        sku: product.sku,
        unitPriceCents: product.priceCents,
        quantity: 1,
        picked: !["PLACED", "STORE_CONFIRMED", "PICKING"].includes(entry.status) || itemIndex === 0 && entry.status === "PICKING",
        createdAt: created,
        updatedAt: created,
      });
    });
    if (entry.status !== "CANCELLED") {
      db.payments.push({
        id: newId(),
        orderId,
        method: order.paymentMethod,
        status: "PAID",
        amountCents: order.totalCents,
        provider: "demo",
        last4: "4242",
        createdAt: created,
        updatedAt: created,
      });
    }
    if (["PACKED", "DELIVERED", "PICKING", "STORE_CONFIRMED", "PLACED"].includes(entry.status) && entry.status !== "PLACED") {
      const rider = db.riders.find((item) => item.storeId === storeId && item.online);
      if (entry.status === "DELIVERED" && rider) {
        const deliveryId = idFrom(`delivery:${number}`);
        db.deliveries.push({
          id: deliveryId,
          orderId,
          riderId: rider.id,
          storeId,
          status: "DELIVERED",
          otp: "1234",
          etaMinutes: order.etaMinutes,
          distanceKm: distance,
          customerLat: order.lat,
          customerLng: order.lng,
          createdAt: created,
          updatedAt: created,
        });
        db.deliveryStatusHistory.push({
          id: idFrom(`event:${number}:DELIVERED`),
          deliveryId,
          orderId,
          status: "DELIVERED",
          note: "Delivered",
          createdAt: created,
        });
      }
    }
  });
}

export function availableUnits(row: Inventory): number {
  return Math.max(0, row.stock - row.reserved);
}
