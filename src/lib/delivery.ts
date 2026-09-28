import type { Settings, StoreStatus } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  radiusKm: 6,
  maxEtaMinutes: 60,
  feeNearCents: 299,
  feeFarCents: 499,
  nearKm: 3,
  freeDeliveryThresholdCents: 5000,
  currency: "EUR",
  timezone: "Europe/Dublin",
};

export interface StoreCandidate {
  id: string;
  name: string;
  status: StoreStatus;
  lat: number;
  lng: number;
  availabilityScore: number;
  hasRequiredInventory: boolean;
}

export interface ConsideredStore {
  id: string;
  name: string;
  eligible: boolean;
  reason: string | null;
  distanceKm: number;
  etaMinutes: number;
  etaLabel: string;
  availabilityScore: number;
}

export interface DeliveryDecision {
  eligible: boolean;
  reason: string | null;
  message: string;
  storeId: string | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  etaLabel: string | null;
  deliveryFeeCents: number | null;
  considered: ConsideredStore[];
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earth = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateEtaMinutes(distanceKm: number, status: StoreStatus): number {
  const busy = status === "BUSY" ? 8 : 0;
  return Math.round(24 + distanceKm * 5 + busy);
}

export function formatEtaRange(minutes: number): string {
  const start = Math.floor((minutes - 3) / 5) * 5;
  const end = start + 10;
  return `${Math.max(15, start)}–${end} min`;
}

export function deliveryFeeCents(
  distanceKm: number,
  subtotalCents: number,
  settings: Settings = DEFAULT_SETTINGS,
): number {
  if (subtotalCents >= settings.freeDeliveryThresholdCents) return 0;
  if (distanceKm <= settings.nearKm) return settings.feeNearCents;
  return settings.feeFarCents;
}

function roundKm(km: number): number {
  return Math.round(km * 100) / 100;
}

export function selectStore(input: {
  customerLat: number;
  customerLng: number;
  stores: StoreCandidate[];
  subtotalCents?: number;
  settings?: Settings;
}): DeliveryDecision {
  const settings = input.settings ?? DEFAULT_SETTINGS;
  const subtotal = input.subtotalCents ?? 0;
  const customer = { lat: input.customerLat, lng: input.customerLng };

  const considered: ConsideredStore[] = input.stores.map((store) => {
    const distanceKm = roundKm(haversineKm(customer, store));
    const etaMinutes = estimateEtaMinutes(distanceKm, store.status);
    const etaLabel = formatEtaRange(etaMinutes);
    let reason: string | null = null;
    if (store.status === "CLOSED") reason = "Store is closed";
    else if (!store.hasRequiredInventory) reason = "Items unavailable at this store";
    else if (distanceKm > settings.radiusKm + 0.05) reason = "Outside the 6 km delivery area";
    else if (etaMinutes > settings.maxEtaMinutes) reason = "Estimated delivery exceeds 60 minutes";
    return {
      id: store.id,
      name: store.name,
      eligible: reason === null,
      reason,
      distanceKm,
      etaMinutes,
      etaLabel,
      availabilityScore: store.availabilityScore,
    };
  });

  const eligible = considered
    .filter((store) => store.eligible)
    .sort((a, b) => {
      if (a.etaMinutes !== b.etaMinutes) return a.etaMinutes - b.etaMinutes;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return b.availabilityScore - a.availabilityScore;
    });

  if (!eligible.length) {
    const nearest = [...considered].sort((a, b) => a.distanceKm - b.distanceKm)[0];
    const outside = !nearest || nearest.distanceKm > settings.radiusKm + 0.05;
    return {
      eligible: false,
      reason: outside ? "OUTSIDE_ZONE" : nearest?.reason ?? "NO_STORE",
      message: outside
        ? "Sorry, we're not delivering to this area yet."
        : nearest?.reason === "Store is closed"
          ? "Your nearest Mini India store is closed right now."
          : nearest?.reason === "Estimated delivery exceeds 60 minutes"
            ? "We can reach this address, but not within 60 minutes right now."
            : "We can't fulfil this basket from a nearby store.",
      storeId: null,
      distanceKm: nearest?.distanceKm ?? null,
      etaMinutes: null,
      etaLabel: null,
      deliveryFeeCents: null,
      considered,
    };
  }

  const winner = eligible[0];
  return {
    eligible: true,
    reason: null,
    message: "Great news! We deliver to you.",
    storeId: winner.id,
    distanceKm: winner.distanceKm,
    etaMinutes: winner.etaMinutes,
    etaLabel: winner.etaLabel,
    deliveryFeeCents: deliveryFeeCents(winner.distanceKm, subtotal, settings),
    considered,
  };
}
