export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "STORE_OPERATOR" | "RIDER";
  phone: string;
  storeId?: string | null;
}

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  sku: string;
  hue: number;
  categorySlug: string;
  unitPriceCents: number;
  quantity: number;
  lineCents: number;
  available: boolean;
  stock: number;
}

export interface CartView {
  id: string;
  store: { id: string; name: string; address: string; region: string } | null;
  addressLabel: string | null;
  lat: number | null;
  lng: number | null;
  items: CartLine[];
  subtotalCents: number;
  discountCents: number;
  promoCode: string | null;
  promoError: string | null;
  deliveryFeeCents: number | null;
  totalCents: number | null;
  etaMinutes: number | null;
  etaLabel: string | null;
  distanceKm: number | null;
  eligible: boolean;
  basketReady?: boolean;
  deliveryMessage: string;
  freeDeliveryRemainingCents: number;
  freeDeliveryThresholdCents: number;
  unavailableCount: number;
}
