"use client";

import { DeliveryMap } from "@/components/map-card";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import {
  BarChart3,
  Bike,
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  Store,
  Tag,
  Users,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const items = [
    ["/admin", "Dashboard", LayoutDashboard],
    ["/admin/orders", "Orders", ClipboardList],
    ["/admin/products", "Products", Package],
    ["/admin/inventory", "Inventory", Boxes],
    ["/admin/stores", "Stores", Store],
    ["/admin/riders", "Riders", Bike],
    ["/admin/customers", "Customers", Users],
    ["/admin/promotions", "Promotions", Tag],
    ["/admin/analytics", "Analytics", BarChart3],
    ["/admin/settings", "Settings", Settings],
  ] as const;
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-brand-900 text-cream lg:min-h-screen">
        <div className="px-5 py-5">
          <p className="font-display text-2xl">Mini India</p>
          <p className="text-xs uppercase tracking-[0.18em] text-cream/60">Operations</p>
        </div>
        <nav className="flex gap-1 overflow-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3" aria-label="Admin">
          {items.map(([href, label, Icon]) => (
            <Link key={href} href={href} className={cn("flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm", pathname === href ? "bg-white/10" : "text-cream/75 hover:bg-white/5")}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}

export function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="flex h-44 items-end gap-1.5">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-t-lg bg-brand-700" style={{ height: `${Math.max(6, (item.value / max) * 100)}%` }} title={`${item.label}: ${item.value}`} />
          <span className="truncate text-[10px] text-stone-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[22px] bg-white p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </article>
  );
}

export function useLoader<T>(path: string, interval = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const next = await api<T>(path);
        if (!stop) setData(next);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    }
    void load();
    const timer = interval ? setInterval(load, interval) : null;
    return () => {
      stop = true;
      if (timer) clearInterval(timer);
    };
  }, [path, interval]);
  return { data, error, setData };
}

interface Metrics {
  ordersToday: number;
  revenueTodayCents: number;
  averageBasketCents: number;
  averageDeliveryMinutes: number;
  activeRiders: number;
  ordersInProgress: number;
  customerCount: number;
  ordersWeek: number;
  revenueWeekCents: number;
  cancellationRate: number;
  onTimeRate: number;
  ordersByHour: { label: string; value: number }[];
  revenueByDay: { label: string; value: number }[];
  ordersByStore: { label: string; value: number }[];
  topProducts: { label: string; value: number }[];
  lowStock: number;
}

export function AdminHome() {
  const { data, error } = useLoader<{ metrics: Metrics; recent: { number: string; customerName: string; totalCents: number; status: string; city: string }[] }>("/api/admin/dashboard");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-[24px] bg-white" />;
  const m = data.metrics;
  return (
    <div>
      <h1 className="font-display text-4xl">Today in Ireland</h1>
      <p className="mt-1 text-sm text-stone-500">Live figures from the demo ledger. Europe/Dublin.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Today's orders" value={String(m.ordersToday)} />
        <Metric label="Revenue" value={formatMoney(m.revenueTodayCents)} />
        <Metric label="Average basket" value={formatMoney(m.averageBasketCents)} />
        <Metric label="Average delivery" value={`${m.averageDeliveryMinutes} min`} />
        <Metric label="Active riders" value={String(m.activeRiders)} />
        <Metric label="Orders in progress" value={String(m.ordersInProgress)} />
        <Metric label="Customers" value={String(m.customerCount)} />
        <Metric label="Low stock lines" value={String(m.lowStock)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white p-4 shadow-card"><h2 className="font-semibold">Orders by hour</h2><Bars data={m.ordersByHour.filter((_, index) => index % 2 === 0)} /></section>
        <section className="rounded-[24px] bg-white p-4 shadow-card"><h2 className="font-semibold">Revenue by day (€)</h2><Bars data={m.revenueByDay} /></section>
        <section className="rounded-[24px] bg-white p-4 shadow-card"><h2 className="font-semibold">Orders by store</h2><Bars data={m.ordersByStore} /></section>
        <section className="rounded-[24px] bg-white p-4 shadow-card">
          <h2 className="font-semibold">Top products this week</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {m.topProducts.map((item) => (
              <li key={item.label} className="flex justify-between gap-3"><span className="truncate">{item.label}</span><span className="font-semibold">{item.value}</span></li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-4 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">Latest orders</h2>
        <ul className="mt-3 divide-y text-sm">
          {data.recent.map((order) => (
            <li key={order.number} className="flex items-center justify-between py-2">
              <span>{order.number} · {order.customerName}</span>
              <span>{order.city}</span>
              <span>{formatMoney(order.totalCents)}</span>
              <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">{order.status.replaceAll("_", " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function AdminOrders() {
  const { data, error } = useLoader<{ orders: { number: string; customerName: string; city: string; totalCents: number; status: string; store: { name: string } | null; createdAt: string }[]; total: number }>("/api/admin/orders");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      <p className="text-sm text-stone-500">{data.total} on the ledger</p>
      <div className="mt-4 overflow-auto rounded-[24px] bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-stone-500"><tr><th className="p-3">Order</th><th>Customer</th><th>Store</th><th>Area</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {data.orders.map((order) => (
              <tr key={order.number} className="border-t border-stone-100">
                <td className="p-3 font-semibold"><Link href={`/track/${order.number}`}>{order.number}</Link></td>
                <td>{order.customerName}</td>
                <td>{order.store?.name.replace("Mini India ", "")}</td>
                <td>{order.city}</td>
                <td>{formatMoney(order.totalCents)}</td>
                <td>{order.status.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const { data, error } = useLoader<{ items: { name: string; brand: string; size: string; priceCents: number; categoryName: string; rating: number; sku: string }[] }>("/api/products?pageSize=60");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Products</h1>
      <div className="mt-4 overflow-auto rounded-[24px] bg-white shadow-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-stone-500"><tr><th className="p-3">Product</th><th>Brand</th><th>Category</th><th>Size</th><th>Price</th><th>Rating</th></tr></thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.sku} className="border-t border-stone-100">
                <td className="p-3">{item.name}</td><td>{item.brand}</td><td>{item.categoryName}</td><td>{item.size}</td><td>{formatMoney(item.priceCents)}</td><td>{item.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface InventoryRow {
  id: string;
  sku: string;
  product: string;
  store: string;
  stock: number;
  reserved: number;
  available: number;
  reorderThreshold: number;
  priceCents: number;
  status: string;
  disabled: boolean;
}

export function AdminInventory() {
  const [storeId, setStoreId] = useState("");
  const [low, setLow] = useState(false);
  const [q, setQ] = useState("");
  const query = `/api/inventory?pageSize=40${storeId ? `&storeId=${storeId}` : ""}${low ? "&low=1" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const { data, error, setData } = useLoader<{ items: InventoryRow[]; total: number }>(query);
  const stores = useLoader<{ stores: { id: string; name: string }[] }>("/api/stores");

  async function act(id: string, body: object) {
    await api(`/api/inventory/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    const fresh = await api<{ items: InventoryRow[]; total: number }>(query);
    setData(fresh);
  }

  if (error) return <p className="text-red-700">{error}</p>;
  return (
    <div>
      <h1 className="font-display text-4xl">Inventory</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search product or SKU" className="rounded-full border border-stone-200 bg-white px-4 py-2" aria-label="Search inventory" />
        <select value={storeId} onChange={(event) => setStoreId(event.target.value)} className="rounded-full border border-stone-200 bg-white px-3 py-2" aria-label="Filter by store">
          <option value="">All stores</option>
          {stores.data?.stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={low} onChange={(event) => setLow(event.target.checked)} /> Low stock</label>
      </div>
      {!data ? <div className="mt-4 h-64 animate-pulse rounded-[24px] bg-white" /> : (
        <div className="mt-4 overflow-auto rounded-[24px] bg-white shadow-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-stone-500"><tr><th className="p-3">Product</th><th>SKU</th><th>Store</th><th>Stock</th><th>Reserved</th><th>Available</th><th>Reorder</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id} className="border-t border-stone-100">
                  <td className="p-3">{row.product}</td>
                  <td>{row.sku}</td>
                  <td>{row.store.replace("Mini India ", "")}</td>
                  <td>{row.stock}</td>
                  <td>{row.reserved}</td>
                  <td>{row.available}</td>
                  <td>{row.reorderThreshold}</td>
                  <td>{formatMoney(row.priceCents)}</td>
                  <td>{row.status}</td>
                  <td className="space-x-2 py-2">
                    <button type="button" className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold" onClick={() => void act(row.id, { restock: 12 })}>Restock</button>
                    <button type="button" className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold" onClick={() => void act(row.id, { disabled: !row.disabled })}>{row.disabled ? "Enable" : "Disable"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminStores() {
  const { data, error, setData } = useLoader<{ stores: StoreCard[] }>("/api/stores");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-[24px] bg-white" />;
  async function setStatus(id: string, status: string) {
    await api(`/api/admin/stores/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    const fresh = await api<{ stores: StoreCard[] }>("/api/stores");
    setData(fresh);
  }
  return (
    <div>
      <h1 className="font-display text-4xl">Stores</h1>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {data.stores.map((store) => (
          <article key={store.id} className="rounded-[24px] bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl">{store.name}</h2>
            <p className="mt-1 text-sm text-stone-600">{store.addressLine}, {store.city}, {store.eircode}</p>
            <p className="mt-3 text-sm">Hours {store.openingHours}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-stone-500">Open orders</dt><dd className="font-semibold">{store.activeOrders}</dd></div>
              <div><dt className="text-stone-500">Stocked lines</dt><dd className="font-semibold">{store.inventoryCount}</dd></div>
              <div><dt className="text-stone-500">Active riders</dt><dd className="font-semibold">{store.riderCount}</dd></div>
              <div><dt className="text-stone-500">Radius / ETA</dt><dd className="font-semibold">{store.serviceRadiusKm} km · {store.maxEtaMinutes} min</dd></div>
            </dl>
            <div className="mt-4 flex gap-2">
              {["OPEN", "BUSY", "CLOSED"].map((status) => (
                <button key={status} type="button" onClick={() => void setStatus(store.id, status)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", store.status === status ? "bg-brand-800 text-white" : "bg-stone-100")}>{status}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface StoreCard {
  id: string;
  name: string;
  addressLine: string;
  city: string;
  eircode: string;
  openingHours: string;
  activeOrders: number;
  inventoryCount: number;
  riderCount: number;
  serviceRadiusKm: number;
  maxEtaMinutes: number;
  status: string;
}

export function AdminRiders() {
  const { data, error } = useLoader<{ riders: { id: string; name: string; phone: string; store?: string; online: boolean; rating: number; completedCount: number; active: boolean }[] }>("/api/admin/riders");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-48 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Riders</h1>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {data.riders.map((rider) => (
          <li key={rider.id} className="rounded-[22px] bg-white p-4 shadow-card">
            <p className="font-semibold">{rider.name}</p>
            <p className="text-sm text-stone-500">{rider.store} · {rider.phone}</p>
            <p className="mt-2 text-sm">{rider.online ? "Online" : "Offline"} · {rider.active ? "On a delivery" : "Waiting"} · {rider.rating.toFixed(1)} · {rider.completedCount} completed</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminCustomers() {
  const { data, error } = useLoader<{ customers: { id: string; name: string; email: string; phone: string; orders: number }[] }>("/api/admin/customers");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-48 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Customers</h1>
      <ul className="mt-4 divide-y rounded-[24px] bg-white px-4 shadow-card">
        {data.customers.map((customer) => (
          <li key={customer.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <span className="font-semibold">{customer.name}</span>
            <span>{customer.email}</span>
            <span>{customer.phone}</span>
            <span>{customer.orders} orders</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPromos() {
  const { data, error, setData } = useLoader<{ promotions: { id: string; code: string; description: string; active: boolean; amountCents: number }[] }>("/api/admin/promotions");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-40 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Promotions</h1>
      <ul className="mt-4 space-y-3">
        {data.promotions.map((promo) => (
          <li key={promo.id} className="flex items-center justify-between rounded-[22px] bg-white p-4 shadow-card">
            <div>
              <p className="font-semibold">{promo.code}</p>
              <p className="text-sm text-stone-600">{promo.description} · {formatMoney(promo.amountCents)}</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-brand-800 px-3 py-2 text-xs font-semibold text-white"
              onClick={async () => {
                await api(`/api/admin/promotions/${promo.id}`, { method: "PATCH", body: JSON.stringify({ active: !promo.active }) });
                setData(await api("/api/admin/promotions"));
              }}
            >
              {promo.active ? "Disable" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminAnalytics() {
  const { data, error } = useLoader<{ analytics: Metrics }>("/api/admin/analytics");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-[24px] bg-white" />;
  const a = data.analytics;
  return (
    <div>
      <h1 className="font-display text-4xl">Analytics</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Orders this week" value={String(a.ordersWeek)} />
        <Metric label="Week revenue" value={formatMoney(a.revenueWeekCents)} />
        <Metric label="Cancellation rate" value={`${Math.round(a.cancellationRate * 100)}%`} />
        <Metric label="On-time deliveries" value={`${Math.round(a.onTimeRate * 100)}%`} />
        <Metric label="Average delivery" value={`${a.averageDeliveryMinutes} min`} />
        <Metric label="Peak pattern" value="Lunch & evening" />
      </div>
      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">Delivery performance by store today</h2>
        <Bars data={a.ordersByStore} />
      </section>
    </div>
  );
}

export function AdminSettings() {
  const { data, error, setData } = useLoader<{ settings: Record<string, number> }>("/api/admin/settings");
  const [form, setForm] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (data) setForm(data.settings);
  }, [data]);
  if (error) return <p className="text-red-700">{error}</p>;
  if (!form) return <div className="h-48 animate-pulse rounded-[24px] bg-white" />;
  const fields = [
    ["radiusKm", "Service radius (km)"],
    ["maxEtaMinutes", "Maximum ETA (minutes)"],
    ["nearKm", "Near distance (km)"],
    ["feeNearCents", "Fee within near distance (cents)"],
    ["feeFarCents", "Fee to the edge of the zone (cents)"],
    ["freeDeliveryThresholdCents", "Free delivery threshold (cents)"],
  ] as const;
  return (
    <form
      className="max-w-xl rounded-[24px] bg-white p-5 shadow-card"
      onSubmit={async (event) => {
        event.preventDefault();
        const saved = await api<{ settings: Record<string, number> }>("/api/admin/settings", { method: "PATCH", body: JSON.stringify(form) });
        setData(saved);
      }}
    >
      <h1 className="font-display text-4xl">Settings</h1>
      <p className="mt-1 text-sm text-stone-500">Delivery fees and the 6 km / 60 minute rule. Both conditions must pass.</p>
      <div className="mt-4 space-y-3">
        {fields.map(([key, label]) => (
          <label key={key} className="block text-sm">
            {label}
            <input type="number" value={form[key]} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" />
          </label>
        ))}
      </div>
      <button className="mt-4 rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white" type="submit">Save settings</button>
    </form>
  );
}

interface StoreOrder {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  etaMinutes: number;
  city: string;
  customerName: string;
  items: { id: string; name: string; quantity: number; picked: boolean }[];
}

export function StoreBoard() {
  const { data, error, setData } = useLoader<{ store: { id: string; name: string; status: string }; orders: StoreOrder[]; lowStock: { sku: string; name: string; available: number }[] }>("/api/store/dashboard", 4000);
  const [open, setOpen] = useState<string | null>(null);
  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!data) return <div className="m-6 h-80 animate-pulse rounded-[24px] bg-white" />;

  async function reload() {
    setData(await api("/api/store/dashboard"));
  }
  async function action(id: string, name: string, body?: object) {
    await api(`/api/store/orders/${id}/${name}`, { method: "POST", body: JSON.stringify(body ?? {}) });
    await reload();
  }
  async function status(next: string) {
    await api("/api/store/status", { method: "PATCH", body: JSON.stringify({ status: next }) });
    await reload();
  }

  const columns = [
    ["New", data.orders.filter((order) => order.status === "PLACED")],
    ["To pick", data.orders.filter((order) => order.status === "STORE_CONFIRMED" || order.status === "PICKING")],
    ["Packed", data.orders.filter((order) => order.status === "PACKED")],
    ["With rider", data.orders.filter((order) => order.status === "RIDER_ASSIGNED" || order.status === "OUT_FOR_DELIVERY")],
  ] as const;

  return (
    <div className="min-h-screen bg-cream px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Store</p>
          <h1 className="font-display text-4xl">{data.store.name}</h1>
        </div>
        <div className="flex gap-2">
          {["OPEN", "BUSY", "CLOSED"].map((item) => (
            <button key={item} type="button" onClick={() => void status(item)} className={cn("rounded-full px-3 py-2 text-xs font-semibold", data.store.status === item ? "bg-brand-800 text-white" : "bg-white")}>{item}</button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {columns.map(([title, orders]) => (
          <section key={title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
            <div className="mt-2 space-y-3">
              {orders.length === 0 && <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">Nothing in this lane</p>}
              {orders.map((order) => (
                <article key={order.id} className="rounded-[22px] bg-white p-4 shadow-card">
                  <p className="text-xs font-semibold text-spice-600">{order.status === "PLACED" ? "NEW ORDER" : order.status.replaceAll("_", " ")}</p>
                  <p className="font-semibold">{order.number}</p>
                  <p className="text-sm text-stone-600">{order.items.length} items · {formatMoney(order.totalCents)}</p>
                  <p className="text-sm">Customer: {order.city}</p>
                  <p className="text-sm text-brand-800">ETA {order.etaMinutes} min</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.status === "PLACED" && <button className="rounded-full bg-brand-800 px-3 py-2 text-xs font-semibold text-white" type="button" onClick={() => void action(order.id, "accept")}>Accept</button>}
                    {order.status === "STORE_CONFIRMED" && <button className="rounded-full bg-brand-800 px-3 py-2 text-xs font-semibold text-white" type="button" onClick={() => { setOpen(order.id); void action(order.id, "picking"); }}>Start picking</button>}
                    {order.status === "PICKING" && <button className="rounded-full border px-3 py-2 text-xs font-semibold" type="button" onClick={() => setOpen(order.id)}>Checklist</button>}
                    {order.status === "PICKING" && order.items.every((item) => item.picked) && <button className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white" type="button" onClick={() => void action(order.id, "pack")}>Mark packed</button>}
                  </div>
                  {open === order.id && (
                    <ul className="mt-3 space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={item.picked} onChange={() => void action(order.id, "pick", { itemId: item.id, picked: !item.picked })} />
                            {item.quantity} × {item.name}
                          </label>
                        </li>
                      ))}
                      {order.items.every((item) => item.picked) && <p className="text-sm font-semibold text-brand-800">Order packed · waiting for a rider once you mark it packed.</p>}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <aside className="mt-6 rounded-[22px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">Low-stock products</h2>
        <ul className="mt-2 text-sm text-stone-600">
          {data.lowStock.map((item) => <li key={item.sku}>{item.name} · {item.available} available</li>)}
        </ul>
      </aside>
    </div>
  );
}

const NEXT: Record<string, { status: string; label: string }> = {
  ACCEPTED: { status: "ARRIVED_AT_STORE", label: "Arrived at store" },
  ARRIVED_AT_STORE: { status: "PICKED_UP", label: "Picked up" },
  PICKED_UP: { status: "ON_THE_WAY", label: "On the way" },
  ON_THE_WAY: { status: "ARRIVED", label: "Arrived" },
  ARRIVED: { status: "DELIVERED", label: "Confirm delivery" },
};

export function RiderApp() {
  const { data, error, setData } = useLoader<RiderPayload>("/api/rider/orders", 4000);
  const [focus, setFocus] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState("");
  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!data) return <div className="mx-auto mt-10 h-96 max-w-md animate-pulse rounded-[28px] bg-white" />;
  const active = data.active.find((item) => item.order.id === focus) ?? data.active[0];

  async function reload() {
    setData(await api("/api/rider/orders"));
  }
  async function online(next: boolean) {
    await api("/api/rider/online", { method: "POST", body: JSON.stringify({ online: next }) });
    await reload();
  }
  async function accept(id: string) {
    await api(`/api/rider/orders/${id}/accept`, { method: "POST" });
    setFocus(id);
    await reload();
  }
  async function advance(orderId: string, status: string) {
    try {
      await api(`/api/rider/orders/${orderId}/status`, { method: "POST", body: JSON.stringify({ status, otp }) });
      setNotice("");
      setOtp("");
      await reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto min-h-screen max-w-md bg-cream px-4 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Rider</p>
            <h1 className="font-display text-3xl">{data.rider.online ? "You're online" : "You're offline"}</h1>
          </div>
          <button type="button" onClick={() => void online(!data.rider.online)} className={cn("rounded-full px-4 py-2 text-sm font-semibold text-white", data.rider.online ? "bg-brand-800" : "bg-stone-500")}>
            {data.rider.online ? "Go offline" : "Go online"}
          </button>
        </div>
        <p className="mt-1 text-sm text-stone-600">{data.rider.name} · {data.available.length} deliveries nearby · rating {data.rider.rating.toFixed(1)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <article className="rounded-2xl bg-white p-3 shadow-card"><p className="text-xs text-stone-500">Today's earnings</p><p className="font-display text-2xl">{formatMoney(data.earningsCents)}</p></article>
          <article className="rounded-2xl bg-white p-3 shadow-card"><p className="text-xs text-stone-500">Completed</p><p className="font-display text-2xl">{data.completed}</p></article>
        </div>
        {active && (
          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-card">
            <p className="text-xs font-semibold text-spice-600">ACTIVE DELIVERY</p>
            <h2 className="font-display text-2xl">{active.order.number}</h2>
            <p className="text-sm">Pickup: {active.order.store?.name}</p>
            <p className="text-sm">Drop: {active.order.city}</p>
            <p className="text-sm">Distance {active.order.distanceKm.toFixed(1)} km · ETA {active.delivery.etaMinutes} min</p>
            <p className="text-sm font-semibold">Paid · {formatMoney(active.order.totalCents)}</p>
            <p className="mt-1 text-xs uppercase text-stone-500">{active.delivery.status.replaceAll("_", " ")}</p>
            {active.order.store && (
              <div className="mt-3">
                <DeliveryMap
                  store={{ lat: active.order.store.lat, lng: active.order.store.lng, label: "Pickup" }}
                  customer={{ lat: active.order.lat, lng: active.order.lng, label: "Drop" }}
                  rider={{ lat: (active.order.store.lat + active.order.lat) / 2, lng: (active.order.store.lng + active.order.lng) / 2, label: "You" }}
                />
              </div>
            )}
            {active.delivery.status === "ARRIVED" && (
              <label className="mt-3 block text-sm">
                Enter customer OTP
                <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="1234" className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" inputMode="numeric" />
                <span className="text-xs text-stone-500">Demo OTP: 1234</span>
              </label>
            )}
            {NEXT[active.delivery.status] && (
              <button type="button" className="mt-3 w-full rounded-full bg-brand-800 py-3 text-sm font-semibold text-white" onClick={() => void advance(active.order.id, NEXT[active.delivery.status].status)}>
                {NEXT[active.delivery.status].label}
              </button>
            )}
            {notice && <p className="mt-2 text-sm text-red-700">{notice}</p>}
          </section>
        )}
        <section className="mt-5">
          <h2 className="font-semibold">Available deliveries</h2>
          <div className="mt-2 space-y-3">
            {data.available.length === 0 && <p className="text-sm text-stone-500">No packed orders waiting at your store.</p>}
            {data.available.map((order) => (
              <article key={order.id} className="rounded-[22px] bg-white p-4 shadow-card">
                <p className="font-semibold">{order.number}</p>
                <p className="text-sm">Pickup: {order.store?.name}</p>
                <p className="text-sm">Drop: {order.city}</p>
                <p className="text-sm">Distance {order.distanceKm.toFixed(1)} km · ETA {Math.max(10, Math.round(order.etaMinutes * 0.4))} min</p>
                <p className="text-sm">Payment {formatMoney(order.totalCents)}</p>
                <button type="button" disabled={!data.rider.online} className="mt-3 w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-40" onClick={() => void accept(order.id)}>Accept delivery</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface RiderPayload {
  rider: { name: string; online: boolean; rating: number };
  earningsCents: number;
  completed: number;
  active: { delivery: { status: string; etaMinutes: number }; order: StoreOrder & { store: { name: string; lat: number; lng: number } | null; lat: number; lng: number; distanceKm: number } }[];
  available: (StoreOrder & { store: { name: string } | null; distanceKm: number })[];
}
