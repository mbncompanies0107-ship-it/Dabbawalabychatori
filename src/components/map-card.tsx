export function DeliveryMap({
  store,
  customer,
  rider,
}: {
  store: { lat: number; lng: number; label: string };
  customer: { lat: number; lng: number; label: string };
  rider: { lat: number; lng: number; label: string } | null;
}) {
  const points = [store, customer, ...(rider ? [rider] : [])];
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const place = (point: { lat: number; lng: number }) => {
    const x = maxLng === minLng ? 50 : ((point.lng - minLng) / (maxLng - minLng)) * 68 + 16;
    const y = maxLat === minLat ? 46 : (1 - (point.lat - minLat) / (maxLat - minLat)) * 64 + 16;
    return { left: `${x}%`, top: `${y}%` };
  };
  const storePos = place(store);
  const customerPos = place(customer);
  const riderPos = rider ? place(rider) : null;

  return (
    <div className="map-surface relative h-72 overflow-hidden rounded-[24px] border border-brand-100" role="img" aria-label="Delivery map showing the store, rider and your address">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <line x1={storePos.left} y1={storePos.top} x2={customerPos.left} y2={customerPos.top} stroke="#0E6246" strokeWidth="3" strokeDasharray="6 8" />
      </svg>
      <Pin style={storePos} tone="bg-brand-800" label={store.label} />
      <Pin style={customerPos} tone="bg-ink" label={customer.label} />
      {rider && riderPos && (
        <span className="absolute -translate-x-1/2 -translate-y-1/2" style={riderPos}>
          <span className="rider-pulse absolute inset-0 rounded-full bg-spice-500" />
          <span className="relative grid h-8 w-8 place-items-center rounded-full bg-spice-500 text-[10px] font-bold text-white">You</span>
          <span className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold shadow">{rider.label}</span>
        </span>
      )}
      <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] text-stone-600">Simulated Dublin delivery map</p>
    </div>
  );
}

function Pin({ style, tone, label }: { style: { left: string; top: string }; tone: string; label: string }) {
  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
      <span className={`block h-4 w-4 rounded-full ring-4 ring-white ${tone}`} />
      <span className="absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold shadow">{label}</span>
    </span>
  );
}
