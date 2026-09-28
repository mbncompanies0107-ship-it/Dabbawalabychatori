"use client";

import { ProductCard, type CardProduct } from "@/components/product-card";
import { api } from "@/lib/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Result {
  items: CardProduct[];
  total: number;
  page: number;
  pageCount: number;
}

function ShopInner() {
  const params = useSearchParams();
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "featured";
  const flag = params.get("flag") ?? "";
  const inStock = params.get("inStock") ?? "";
  const page = params.get("page") ?? "1";

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    if (sort) query.set("sort", sort);
    if (flag) query.set("flag", flag);
    if (min) query.set("min", min);
    if (max) query.set("max", max);
    if (inStock) query.set("inStock", inStock);
    query.set("page", page);
    setData(null);
    api<Result>(`/api/products?${query.toString()}`)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [q, category, sort, flag, min, max, inStock, page]);

  function href(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) query.set(key, value);
      else query.delete(key);
    });
    return `/shop?${query.toString()}`;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Shop</p>
      <h1 className="mt-1 font-display text-4xl">{q ? `Results for “${q}”` : category ? category.replace("-", " ") : "All groceries"}</h1>
      <form className="mt-5 grid gap-3 rounded-[22px] bg-white p-4 shadow-card md:grid-cols-5" action="/shop">
        <input name="q" defaultValue={q} placeholder="Search groceries, snacks, spices..." className="rounded-xl border border-stone-200 px-3 py-2 md:col-span-2" aria-label="Search" />
        <select name="category" defaultValue={category} className="rounded-xl border border-stone-200 px-3 py-2" aria-label="Category">
          <option value="">All categories</option>
          {[
            ["fresh", "Fresh"],
            ["rice-atta", "Rice & Atta"],
            ["dal-pulses", "Dal & Pulses"],
            ["spices", "Spices"],
            ["snacks", "Snacks"],
            ["biscuits", "Biscuits"],
            ["drinks", "Drinks"],
            ["frozen", "Frozen"],
            ["dairy", "Dairy"],
            ["pickles", "Pickles"],
            ["instant", "Instant Food"],
            ["household", "Household"],
            ["sweets", "Sweets"],
            ["cooking", "Cooking Essentials"],
            ["personal-care", "Personal Care"],
          ].map(([slug, label]) => (
            <option key={slug} value={slug}>{label}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded-xl border border-stone-200 px-3 py-2" aria-label="Sort">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Rating</option>
          <option value="newest">New arrivals</option>
        </select>
        <button className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white" type="submit">Apply</button>
        <label className="flex items-center gap-2 text-sm">
          <span>Min €</span>
          <input name="min" value={min} onChange={(event) => setMin(event.target.value)} className="w-full rounded-xl border border-stone-200 px-2 py-1" inputMode="decimal" aria-label="Minimum price" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>Max €</span>
          <input name="max" value={max} onChange={(event) => setMax(event.target.value)} className="w-full rounded-xl border border-stone-200 px-2 py-1" inputMode="decimal" aria-label="Maximum price" />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={inStock === "1"} onChange={() => { window.location.href = href({ inStock: inStock === "1" ? "" : "1", page: "1" }); }} />
          In stock at your store
        </label>
      </form>
      {error && <p className="mt-6 text-red-700">{error}</p>}
      {!data && !error && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-[22px] bg-white" />
          ))}
        </div>
      )}
      {data && data.items.length === 0 && <p className="mt-8 rounded-[22px] bg-white p-8 text-stone-600">Nothing matches that search. Try a spice, a brand, or clear the filters.</p>}
      {data && data.items.length > 0 && (
        <>
          <p className="mt-4 text-sm text-stone-500">{data.total} products</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {data.pageCount > 1 && (
            <div className="mt-6 flex gap-2">
              <a className="rounded-full border px-4 py-2 text-sm" href={href({ page: String(Math.max(1, data.page - 1)) })}>Previous</a>
              <a className="rounded-full border px-4 py-2 text-sm" href={href({ page: String(Math.min(data.pageCount, data.page + 1)) })}>Next</a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-[22px] bg-white" />}>
      <ShopInner />
    </Suspense>
  );
}
