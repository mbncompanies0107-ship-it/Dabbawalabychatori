"use client";

import { api } from "@/lib/client";
import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Row {
  number: string;
  status: string;
  totalCents: number;
  city: string;
  etaLabel: string;
  store: { name: string } | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ orders: Row[] }>("/api/orders").then((data) => setOrders(data.orders)).catch((err: Error) => setError(err.message));
  }, []);
  if (error) return <p className="text-red-700">{error}</p>;
  if (!orders) return <div className="h-48 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      {orders.length === 0 && <p className="mt-4 rounded-[24px] bg-white p-6 text-stone-600">No orders yet. The presentation order appears when you sign in as Sarah Murphy.</p>}
      <ul className="mt-4 space-y-3">
        {orders.map((order) => (
          <li key={order.number} className="rounded-[22px] bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{order.number}</p>
                <p className="text-sm text-stone-600">{order.store?.name} · {order.city} · {order.etaLabel}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatMoney(order.totalCents)}</p>
                <p className="text-xs uppercase text-brand-800">{order.status.replaceAll("_", " ")}</p>
              </div>
            </div>
            <Link href={`/track/${order.number}`} className="mt-3 inline-block text-sm font-semibold text-brand-800">Track order</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
