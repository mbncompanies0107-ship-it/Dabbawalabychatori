"use client";

import { ProductVisual } from "@/components/product-visual";
import { useCart, useLocation } from "@/components/providers";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { cart, update, applyPromo } = useCart();
  const { setOpen, location } = useLocation();
  const [code, setCode] = useState("WELCOME");
  if (!cart) return <div className="h-80 animate-pulse rounded-[28px] bg-white" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section>
        <h1 className="font-display text-4xl">Basket</h1>
        {cart.items.length === 0 ? (
          <div className="mt-6 rounded-[24px] bg-white p-8 shadow-card">
            <p className="text-lg font-semibold">Your basket is empty</p>
            <p className="mt-2 text-sm text-stone-600">Basmati, atta, dal, snacks and the evening pickle are a search away.</p>
            <Link href="/shop" className="mt-4 inline-block rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white">Browse the shop</Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-3 rounded-[22px] bg-white p-3 shadow-card">
                <ProductVisual hue={item.hue} category={item.categorySlug} name={item.name} className="h-24 w-24 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-stone-500">{item.brand}</p>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-stone-500">{item.size}</p>
                  {!item.available && <p className="mt-1 text-sm text-red-700">Not available for delivery from your nearest store.</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full bg-brand-50 p-1">
                      <button type="button" aria-label="Decrease quantity" onClick={() => void update(item.id, item.quantity - 1)} className="grid h-8 w-8 place-items-center"><Minus className="h-4 w-4" /></button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => void update(item.id, item.quantity + 1)} className="grid h-8 w-8 place-items-center"><Plus className="h-4 w-4" /></button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(item.lineCents)}</p>
                      <button type="button" aria-label={`Remove ${item.name}`} onClick={() => void update(item.id, 0)} className="text-stone-400"><Trash2 className="ml-auto h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="h-fit rounded-[24px] bg-white p-5 shadow-card">
        <h2 className="font-display text-2xl">Summary</h2>
        <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-2xl bg-cream px-3 py-3 text-left text-sm">
          <span className="block text-stone-500">Delivering to</span>
          <span className="font-semibold">{location ? `${location.line1}, ${location.city}` : "Choose an address"}</span>
        </button>
        {cart.store && <p className="mt-3 text-sm">Fulfilled by <span className="font-semibold">{cart.store.name}</span></p>}
        {cart.etaLabel && <p className="text-sm text-brand-800">Arriving in {cart.etaLabel}</p>}
        <div className="mt-4 flex gap-2">
          <input value={code} onChange={(event) => setCode(event.target.value)} aria-label="Promo code" className="flex-1 rounded-xl border border-stone-200 px-3 py-2" />
          <button type="button" className="rounded-full bg-ink px-4 text-sm font-semibold text-white" onClick={() => void applyPromo(code)}>Apply</button>
        </div>
        {cart.promoError && <p className="mt-2 text-sm text-red-700">{cart.promoError}</p>}
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(cart.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{cart.deliveryFeeCents == null ? "—" : cart.deliveryFeeCents === 0 ? "Free" : formatMoney(cart.deliveryFeeCents)}</dd></div>
          <div className="flex justify-between"><dt>Discount</dt><dd>{cart.discountCents ? `-${formatMoney(cart.discountCents)}` : "€0.00"}</dd></div>
          <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-semibold"><dt>Total</dt><dd>{cart.totalCents == null ? "—" : formatMoney(cart.totalCents)}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-stone-600">
          {cart.freeDeliveryRemainingCents > 0 ? `Free delivery over €50. Add ${formatMoney(cart.freeDeliveryRemainingCents)} more.` : "Free delivery over €50 is applied."}
        </p>
        {!cart.eligible && location && <p className="mt-2 text-sm text-red-700">{cart.deliveryMessage}</p>}
        <Link
          href={cart.items.length && cart.eligible ? "/checkout" : "#"}
          aria-disabled={!cart.items.length || !cart.eligible}
          className={`mt-4 block rounded-full px-4 py-3 text-center text-sm font-semibold text-white ${cart.items.length && cart.eligible ? "bg-brand-800" : "pointer-events-none bg-stone-300"}`}
        >
          Continue to checkout
        </Link>
      </aside>
    </div>
  );
}
