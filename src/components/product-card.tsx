"use client";

import { ProductVisual } from "@/components/product-visual";
import { useCart, useLocation } from "@/components/providers";
import { formatMoney, discountPercent } from "@/lib/format";
import { Minus, Plus, Star } from "lucide-react";
import Link from "next/link";

export interface CardProduct {
  id: string;
  name: string;
  brand: string;
  size: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  hue: number;
  categorySlug: string;
  slug: string;
}

export function ProductCard({ product }: { product: CardProduct }) {
  const { cart, add, update } = useCart();
  const { location, setOpen } = useLocation();
  const line = cart?.items.find((item) => item.productId === product.id);
  const discount = discountPercent(product.priceCents, product.compareAtCents);

  return (
    <article className="group flex flex-col rounded-[22px] border border-stone-200/80 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden rounded-2xl">
        <ProductVisual hue={product.hue} category={product.categorySlug} name={product.name} className="aspect-square w-full" />
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-spice-500 px-2.5 py-1 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
      </Link>
      <div className="mt-3 flex flex-1 flex-col px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{product.brand}</p>
        <Link href={`/product/${product.slug}`} className="mt-1 line-clamp-2 font-medium leading-snug text-ink">
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-stone-500">{product.size}</p>
        <div className="mt-2 flex items-center gap-1 text-sm text-stone-600">
          <Star className="h-3.5 w-3.5 fill-spice-500 text-spice-500" aria-hidden />
          <span>{product.rating.toFixed(1)}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-semibold">{formatMoney(product.priceCents)}</p>
            {product.compareAtCents && (
              <p className="text-xs text-stone-400 line-through">{formatMoney(product.compareAtCents)}</p>
            )}
          </div>
          {line ? (
            <div className="flex items-center rounded-full bg-brand-50 p-1">
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white" aria-label={`Reduce ${product.name}`} onClick={() => void update(line.id, line.quantity - 1)}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{line.quantity}</span>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-white" aria-label={`Add another ${product.name}`} onClick={() => void update(line.id, line.quantity + 1)}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-brand-800 text-white shadow-lift transition hover:bg-brand-700"
              aria-label={`Add ${product.name} to basket`}
              onClick={() => {
                if (!location) {
                  setOpen(true);
                  return;
                }
                void add(product.id);
              }}
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductRow({ title, products, href }: { title: string; products: CardProduct[]; href?: string }) {
  if (!products.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-semibold text-brand-700">
            View all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
