import assert from "node:assert/strict";
import { DEMO_LOCATIONS } from "../src/lib/demo-locations";
import {
  deliveryFeeCents,
  estimateEtaMinutes,
  formatEtaRange,
  selectStore,
  type StoreCandidate,
} from "../src/lib/delivery";

const dublin = DEMO_LOCATIONS.find((item) => item.id === "dublin")!;
const sandyford = DEMO_LOCATIONS.find((item) => item.id === "sandyford")!;
const limerick = DEMO_LOCATIONS.find((item) => item.id === "limerick")!;
const outside = DEMO_LOCATIONS.find((item) => item.id === "outside")!;
const overlap = DEMO_LOCATIONS.find((item) => item.id === "overlap")!;

const stores: StoreCandidate[] = [
  { id: "dublin", name: "Mini India Dublin City", status: "OPEN", lat: 53.3463, lng: -6.2589, availabilityScore: 0.9, hasRequiredInventory: true },
  { id: "sandyford", name: "Mini India Sandyford", status: "OPEN", lat: 53.2775, lng: -6.2075, availabilityScore: 0.8, hasRequiredInventory: true },
  { id: "limerick", name: "Mini India Limerick", status: "OPEN", lat: 52.6642, lng: -8.6048, availabilityScore: 0.85, hasRequiredInventory: true },
];

function check(location: { lat: number; lng: number }, extra = stores) {
  return selectStore({ customerLat: location.lat, customerLng: location.lng, stores: extra, subtotalCents: 2000 });
}

const city = check(dublin);
assert.equal(city.eligible, true);
assert.equal(city.storeId, "dublin");
assert.equal(city.etaMinutes, 28);
assert.equal(city.etaLabel, "25–35 min");
assert.equal(city.message, "Great news! We deliver to you.");
assert.equal(city.deliveryFeeCents, 299);

const south = check(sandyford);
assert.equal(south.storeId, "sandyford");
assert.equal(south.eligible, true);
assert.ok((south.distanceKm ?? 99) < 6);

const west = check(limerick);
assert.equal(west.storeId, "limerick");
assert.equal(west.eligible, true);

const galway = check(outside);
assert.equal(galway.eligible, false);
assert.equal(galway.reason, "OUTSIDE_ZONE");
assert.match(galway.message, /not delivering/i);

const both = check(overlap);
assert.equal(both.eligible, true);
assert.equal(both.deliveryFeeCents, 499);
assert.ok(both.considered.filter((store) => store.eligible).length >= 2);

const closedCity = check(dublin, stores.map((store) => (store.id === "dublin" ? { ...store, status: "CLOSED" as const } : store)));
assert.equal(closedCity.eligible, false);

const busy = selectStore({
  customerLat: dublin.lat,
  customerLng: dublin.lng,
  subtotalCents: 2000,
  stores: stores.map((store) => (store.id === "dublin" ? { ...store, status: "BUSY" as const } : store)),
});
assert.equal(busy.storeId, "dublin");
assert.equal(busy.etaMinutes, 36);

const noStock = check(
  overlap,
  stores.map((store) => (store.id === "dublin" ? { ...store, hasRequiredInventory: false, availabilityScore: 1 } : store)),
);
assert.equal(noStock.storeId, "sandyford");

const ranked = selectStore({
  customerLat: overlap.lat,
  customerLng: overlap.lng,
  subtotalCents: 1000,
  stores: [
    { id: "low", name: "Low", status: "OPEN", lat: 53.3119, lng: -6.2332, availabilityScore: 0.2, hasRequiredInventory: true },
    { id: "high", name: "High", status: "OPEN", lat: 53.3119, lng: -6.2332, availabilityScore: 0.95, hasRequiredInventory: true },
  ],
});
assert.equal(ranked.storeId, "high");

assert.equal(deliveryFeeCents(1, 2000), 299);
assert.equal(deliveryFeeCents(4, 2000), 499);
assert.equal(deliveryFeeCents(4, 5000), 0);
assert.equal(formatEtaRange(estimateEtaMinutes(0.78, "OPEN")), "25–35 min");
assert.ok(estimateEtaMinutes(6, "OPEN") <= 60);
assert.ok(estimateEtaMinutes(6, "BUSY") > 60);

console.log("delivery engine tests passed");
