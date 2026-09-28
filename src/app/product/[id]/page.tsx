"use client";

import { ProductVisual } from "@/components/product-visual";
import { useCart, useLocation } from "@/components/providers";
import { api } from "@/lib/client";
import { discountPercent, formatMoney } from "@/lib/format";
import { Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  brand: string;
  size: string;
  description: string;
  ingredients: string;
  allergens: string;
  origin: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  ratingCount: number;
  hue: number;
  categorySlug: string;
  categoryName: string;
  stockByStore: Record<string, number>;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const { add } = useCart();
  const { quote, location, setOpen } = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<{ author: string; rating: number; comment: string }[]>([]);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    api<{ product: Product; reviews: { author: string; rating: number; comment: string }[] }>(`/api/products/${params.id}`)
      .then((data) => {
        setProduct(data.product);
        setReviews(data.reviews);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (error) return <p className="rounded-2xl bg-white p-8 text-red-700">{error}</p>;
  if (!product) return <div className="h-96 animate-pulse rounded-[28px] bg-white" />;

  const discount = discountPercent(product.priceCents, product.compareAtCents);
  const stockValues = Object.values(product.stockByStore);
  const anyStock = stockValues.some((value) => value > 0);
  let availability = "Check your Eircode for delivery from the nearest store.";
  if (location && quote) {
    const nearestStock = quote.storeId ? product.stockByStore[quote.storeId] ?? 0 : 0;
    const otherStore = Object.entries(product.stockByStore).some(([id, units]) => id !== quote.storeId && units > 0);
    if (!quote.eligible) availability = quote.message;
    else if (nearestStock > 0) availability = `In stock · Fulfilled by ${quote.storeName}`;
    else if (otherStore) availability = "Not available for delivery from your nearest store. Available from another nearby store.";
    else availability = "This product is currently unavailable.";
  } else if (!anyStock) {
    availability = "This product is currently unavailable.";
  }

  return (
    <article className="grid gap-8 lg:grid-cols-2">
      <ProductVisual hue={product.hue} category={product.categorySlug} name={product.name} className="aspect-square rounded-[32px]" />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">{product.brand}</p>
        <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
        <p className="mt-2 text-stone-500">{product.size} · {product.categoryName}</p>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-spice-500 text-spice-500" />
          {product.rating.toFixed(1)} · {product.ratingCount} ratings
        </p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-3xl font-semibold">{formatMoney(product.priceCents)}</p>
          {product.compareAtCents && <p className="text-stone-400 line-through">{formatMoney(product.compareAtCents)}</p>}
          {discount && <span className="rounded-full bg-spice-500 px-2 py-1 text-xs font-bold text-white">-{discount}%</span>}
        </div>
        <p className="mt-4 text-stone-700">{product.description}</p>
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-card">{availability}</p>
        <p className="mt-3 text-sm text-stone-600">Delivery in {quote?.etaLabel ?? "25–35 min"}</p>
        <div className="mt-5 flex items-center gap-3">
          <label className="text-sm" htmlFor="qty">Quantity</label>
          <input id="qty" type="number" min={1} max={12} value={qty} onChange={(event) => setQty(Number(event.target.value))} className="w-20 rounded-xl border border-stone-200 px-3 py-2" />
        </div>
        <button
          type="button"
          className="mt-4 rounded-full bg-brand-800 px-6 py-3 font-semibold text-white"
          onClick={() => {
            if (!location) {
              setOpen(true);
              return;
            }
            void add(product.id, qty).then((ok) => {
              if (ok) setNote("Added to basket");
            });
          }}
        >
          Add to basket
        </button>
        {note && <p className="mt-2 text-sm text-brand-800">{note}</p>}
        <dl className="mt-8 grid gap-3 text-sm">
          <div><dt className="font-semibold">Ingredients</dt><dd className="text-stone-600">{product.ingredients}</dd></div>
          <div><dt className="font-semibold">Allergens</dt><dd className="text-stone-600">{product.allergens}</dd></div>
          <div><dt className="font-semibold">Origin</dt><dd className="text-stone-600">{product.origin}</dd></div>
        </dl>
        {reviews.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl">Reviews</h2>
            <ul className="mt-3 space-y-3">
              {reviews.map((review) => (
                <li key={review.author} className="rounded-2xl bg-white p-4 shadow-card">
                  <p className="text-sm font-semibold">{review.author} · {review.rating}/5</p>
                  <p className="mt-1 text-sm text-stone-600">{review.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
