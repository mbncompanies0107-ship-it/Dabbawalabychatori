export type Role = "CUSTOMER" | "ADMIN" | "STORE_OPERATOR" | "RIDER";

export type StoreStatus = "OPEN" | "BUSY" | "CLOSED";

export type OrderStatus =
  | "PLACED"
  | "STORE_CONFIRMED"
  | "PICKING"
  | "PACKED"
  | "RIDER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type DeliveryStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "ARRIVED_AT_STORE"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "DELIVERED";

export type PaymentMethod = "card" | "apple_pay" | "google_pay";

export interface Settings {
  radiusKm: number;
  maxEtaMinutes: number;
  feeNearCents: number;
  feeFarCents: number;
  nearKm: number;
  freeDeliveryThresholdCents: number;
  currency: "EUR";
  timezone: "Europe/Dublin";
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  storeId: string | null;
  riderId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  addressLine: string;
  city: string;
  region: string;
  eircode: string;
  phone: string;
  lat: number;
  lng: number;
  status: StoreStatus;
  openingHours: string;
  serviceRadiusKm: number;
  maxEtaMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  categoryId: string;
  description: string;
  ingredients: string;
  allergens: string;
  origin: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  ratingCount: number;
  popular: boolean;
  bestseller: boolean;
  favourite: boolean;
  isNew: boolean;
  hue: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Inventory {
  id: string;
  storeId: string;
  productId: string;
  sku: string;
  stock: number;
  reserved: number;
  reorderThreshold: number;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Address {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  eircode: string;
  instructions: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Cart {
  id: string;
  userId: string | null;
  storeId: string | null;
  promoCode: string | null;
  lat: number | null;
  lng: number | null;
  addressLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  number: string;
  userId: string | null;
  storeId: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  addressLine: string;
  city: string;
  eircode: string;
  instructions: string;
  lat: number;
  lng: number;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  promoCode: string | null;
  etaMinutes: number;
  etaLabel: string;
  distanceKm: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  picked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: "PAID" | "FAILED" | "PENDING";
  amountCents: number;
  provider: "demo" | "stripe";
  last4: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  storeId: string;
  online: boolean;
  lat: number;
  lng: number;
  rating: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Delivery {
  id: string;
  orderId: string;
  riderId: string | null;
  storeId: string;
  status: DeliveryStatus;
  otp: string;
  etaMinutes: number;
  distanceKm: number;
  customerLat: number;
  customerLng: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  orderId: string;
  status: string;
  note: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  amountCents: number;
  minSubtotalCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Review {
  id: string;
  productId: string;
  userId: string | null;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  stores: Store[];
  categories: Category[];
  products: Product[];
  inventory: Inventory[];
  addresses: Address[];
  carts: Cart[];
  cartItems: CartItem[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  riders: Rider[];
  deliveries: Delivery[];
  deliveryStatusHistory: DeliveryEvent[];
  promotions: Promotion[];
  reviews: Review[];
  notifications: Notification[];
  waitlist: WaitlistEntry[];
  messages: ContactMessage[];
  settings: Settings;
  meta: {
    nextOrderNumber: number;
    anchorDate: string;
    presentationLocked: boolean;
  };
}

export interface ProductDTO {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  ingredients: string;
  allergens: string;
  origin: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  ratingCount: number;
  popular: boolean;
  bestseller: boolean;
  favourite: boolean;
  isNew: boolean;
  hue: number;
  stockByStore: Record<string, number>;
}

export interface DemoAddress {
  id: string;
  label: string;
  shortLabel: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  eircode: string;
  instructions: string;
  lat: number;
  lng: number;
}
