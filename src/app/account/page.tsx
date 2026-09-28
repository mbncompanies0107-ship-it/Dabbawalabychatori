"use client";

import { useAuth } from "@/components/providers";
import { api } from "@/lib/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const { user, logout, ready } = useAuth();
  const [notes, setNotes] = useState<{ id: string; title: string; body: string }[]>([]);
  useEffect(() => {
    if (!user) return;
    api<{ orders: { number: string }[] }>("/api/orders").catch(() => {});
  }, [user]);

  if (!ready) return <div className="h-40 animate-pulse rounded-[24px] bg-white" />;
  if (!user) {
    return (
      <div className="rounded-[24px] bg-white p-8 shadow-card">
        <h1 className="font-display text-4xl">Account</h1>
        <p className="mt-2 text-stone-600">Sign in to see orders, addresses and messages.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl">{user.name}</h1>
      <p className="mt-1 text-stone-600">{user.email} · {user.phone || "No phone yet"} · {user.role.toLowerCase().replace("_", " ")}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/orders" className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white">Orders</Link>
        {user.role === "ADMIN" && <Link href="/admin" className="rounded-full border px-4 py-2 text-sm font-semibold">Admin</Link>}
        {user.role === "STORE_OPERATOR" && <Link href="/store" className="rounded-full border px-4 py-2 text-sm font-semibold">Store</Link>}
        {user.role === "RIDER" && <Link href="/rider" className="rounded-full border px-4 py-2 text-sm font-semibold">Rider</Link>}
        <button type="button" onClick={() => void logout()} className="rounded-full border px-4 py-2 text-sm">Sign out</button>
      </div>
      <section className="mt-6 rounded-[24px] bg-white p-5 shadow-card">
        <h2 className="font-semibold">Saved address</h2>
        <p className="mt-2 text-sm text-stone-600">Sarah Murphy's demo address is 18 Dame Street, Dublin 2, D02 XY45. Choose it from the delivery bar any time.</p>
        <button type="button" className="mt-3 text-sm font-semibold text-brand-800" onClick={() => setNotes([{ id: "1", title: "No new alerts", body: "Order updates appear here after you place a basket." }])}>
          Refresh notifications
        </button>
        <ul className="mt-3 space-y-2 text-sm">
          {notes.map((note) => (
            <li key={note.id}><span className="font-semibold">{note.title}. </span>{note.body}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
