"use client";

import { ProductVisual } from "@/components/product-visual";
import { useLocation } from "@/components/providers";
import { Clock, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

const tiles = [
  { name: "Basmati", category: "rice-atta", hue: 42 },
  { name: "Masala", category: "spices", hue: 18 },
  { name: "Bhujia", category: "snacks", hue: 30 },
  { name: "Chai", category: "drinks", hue: 150 },
];

export function HomeHero({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const { setOpen, quote, location } = useLocation();
  const homeCategories = [
    "fresh",
    "rice-atta",
    "dal-pulses",
    "spices",
    "snacks",
    "biscuits",
    "drinks",
    "frozen",
    "dairy",
    "pickles",
    "instant",
    "household",
  ];
  const shown = homeCategories
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is { slug: string; name: string } => !!category);

  return (
    <div>
      <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Dublin & Limerick</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
            Indian groceries delivered fast.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-stone-600">
            Your favourite Indian groceries, snacks and essentials delivered to your door across Ireland.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white">
              Shop now
            </Link>
            <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold">
              Enter your Eircode
            </button>
          </div>
          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <Clock className="h-4 w-4 text-spice-500" />
              <dt className="mt-2 text-stone-500">Delivery promise</dt>
              <dd className="font-semibold">{quote?.eligible && quote.etaLabel ? quote.etaLabel : "Up to 60 min delivery"}</dd>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <MapPin className="h-4 w-4 text-brand-700" />
              <dt className="mt-2 text-stone-500">Service coverage</dt>
              <dd className="font-semibold">Currently serving Dublin & Limerick</dd>
            </div>
          </dl>
          {location && quote && (
            <p className={`mt-4 text-sm font-medium ${quote.eligible ? "text-brand-800" : "text-red-700"}`}>
              {quote.eligible
                ? `${quote.message} ${quote.storeName ?? ""} · ${quote.etaLabel} · Delivery available`
                : quote.message}
            </p>
          )}
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((tile) => (
              <ProductVisual key={tile.name} {...tile} className="aspect-[4/5] rounded-[28px]" />
            ))}
          </div>
          <div className="absolute -left-2 bottom-6 hidden rounded-2xl bg-white px-4 py-3 shadow-lift sm:block">
            <p className="text-xs uppercase tracking-wide text-stone-500">From your nearest store</p>
            <p className="font-display text-2xl">{quote?.etaLabel ?? "25–35 min"}</p>
          </div>
        </div>
      </section>
      <section className="mt-10" aria-label="Categories">
        <div className="flex gap-2 overflow-auto pb-2 no-scrollbar">
          {shown.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="shrink-0 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold hover:border-brand-700"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8 grid gap-3 md:grid-cols-3">
        {[
          ["1", "Share your Eircode", "We check the 6 km radius and a 60 minute arrival."],
          ["2", "We pick nearby", "One store fulfils the basket. No split orders."],
          ["3", "A rider brings it", "Track packing, pickup and the doorstep handoff."],
        ].map(([step, title, copy]) => (
          <article key={step} className="rounded-[22px] bg-white p-5 shadow-card">
            <p className="font-display text-3xl text-brand-800">{step}</p>
            <h2 className="mt-2 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-stone-600">{copy}</p>
          </article>
        ))}
      </section>
      <p className="mt-6 flex items-center gap-2 text-sm text-stone-500">
        <ShieldCheck className="h-4 w-4" /> Demo payment only. Card details are never stored.
      </p>
    </div>
  );
}
