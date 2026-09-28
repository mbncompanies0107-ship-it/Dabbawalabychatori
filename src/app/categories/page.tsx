"use client";

import { api } from "@/lib/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{ slug: string; name: string }[] | null>(null);
  useEffect(() => {
    api<{ categories: { slug: string; name: string }[] }>("/api/categories").then((data) => setCategories(data.categories));
  }, []);
  if (!categories) return <div className="h-48 animate-pulse rounded-[24px] bg-white" />;
  return (
    <div>
      <h1 className="font-display text-4xl">Categories</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.slug} href={`/shop?category=${category.slug}`} className="rounded-[22px] bg-white p-5 font-semibold shadow-card hover:-translate-y-0.5">
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
