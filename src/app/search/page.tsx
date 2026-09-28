"use client";

import { ProductCard, type CardProduct } from "@/components/product-card";
import { api } from "@/lib/client";
import { FormEvent, useState } from "react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<CardProduct[] | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setItems(null);
    try {
      const data = await api<{ items: CardProduct[] }>(`/api/products?q=${encodeURIComponent(q)}&pageSize=24`);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Search</h1>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2" role="search">
        <label className="sr-only" htmlFor="q">Search groceries, snacks, spices</label>
        <input id="q" autoFocus value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search groceries, snacks, spices..." className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-3" />
        <button className="rounded-full bg-brand-800 px-5 text-sm font-semibold text-white" type="submit">Search</button>
      </form>
      {error && <p className="mt-4 text-red-700">{error}</p>}
      {items && items.length === 0 && <p className="mt-6 text-stone-600">Nothing matches that. Try rice, Maggi, pickle or chai.</p>}
      {items && items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      )}
    </div>
  );
}
