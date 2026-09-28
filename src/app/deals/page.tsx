"use client";

import { ProductCard, type CardProduct } from "@/components/product-card";
import { api } from "@/lib/client";
import { useEffect, useState } from "react";

export default function DealsPage() {
  const [items, setItems] = useState<CardProduct[] | null>(null);
  useEffect(() => {
    api<{ items: CardProduct[] }>("/api/products?flag=deal&pageSize=24").then((data) => setItems(data.items));
  }, []);
  return (
    <div>
      <h1 className="font-display text-4xl">Deals</h1>
      <p className="mt-2 max-w-xl text-stone-600">Marked-down pantry staples, plus WELCOME for €5 off baskets over €30 and MINI3 for €3 off over €20.</p>
      {!items ? <div className="mt-6 h-64 animate-pulse rounded-[24px] bg-white" /> : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      )}
    </div>
  );
}
