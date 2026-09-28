"use client";

import { api } from "@/lib/client";
import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Order {
  number: string;
  status: string;
  etaLabel: string;
  etaMinutes: number;
  totalCents: number;
  customerName: string;
  addressLine: string;
  city: string;
  eircode: string;
  store: { name: string } | null;
  rider: { name: string } | null;
  items: { id: string; name: string; quantity: number; unitPriceCents: number }[];
}

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ order: Order }>(`/api/orders/${params.id}`)
      .then((data) => setOrder(data.order))
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="rounded-2xl bg-white p-8 text-red-700">{error}</p>;
  if (!order) return <div className="h-80 animate-pulse rounded-[28px] bg-white" />;

  return (
    <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6 shadow-card sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Mini India</p>
      <h1 className="mt-2 font-display text-4xl">Order confirmed!</h1>
      <p className="mt-2 text-lg">Order #{order.number}</p>
      <p className="mt-1 text-brand-800">{order.status === "DELIVERED" ? "Delivered" : `Arriving in ${order.etaMinutes} minutes`}</p>
      <p className="text-sm text-stone-500">{order.etaLabel} · {order.store?.name}</p>
      <dl className="mt-6 space-y-2 text-sm">
        <div><dt className="text-stone-500">Delivery address</dt><dd>{order.customerName}, {order.addressLine}, {order.city}, {order.eircode}</dd></div>
        <div><dt className="text-stone-500">Rider</dt><dd>{order.rider ? `${order.rider.name} is assigned` : "Looking for a rider once the store packs your basket."}</dd></div>
      </dl>
      <ul className="mt-4 divide-y divide-stone-100 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>{item.quantity} × {item.name}</span>
            <span>{formatMoney(item.unitPriceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xl font-semibold">Total {formatMoney(order.totalCents)}</p>
      <Link href={`/track/${order.number}`} className="mt-6 inline-block rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white">Track order</Link>
    </div>
  );
}
