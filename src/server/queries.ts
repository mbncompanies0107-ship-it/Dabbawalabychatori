import { availableUnits } from "@/lib/seed";
import { readDB } from "@/lib/db";
import type { ProductDTO } from "@/lib/types";

export function toProductDTO(productId: string): ProductDTO | null {
  const db = readDB();
  const product = db.products.find((item) => item.id === productId || item.slug === productId || item.sku === productId);
  if (!product || product.deletedAt) return null;
  const category = db.categories.find((item) => item.id === product.categoryId);
  const stockByStore: Record<string, number> = {};
  db.inventory
    .filter((row) => row.productId === product.id && !row.disabled && !row.deletedAt)
    .forEach((row) => {
      stockByStore[row.storeId] = availableUnits(row);
    });
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    size: product.size,
    categoryId: product.categoryId,
    categorySlug: category?.slug ?? "",
    categoryName: category?.name ?? "",
    description: product.description,
    ingredients: product.ingredients,
    allergens: product.allergens,
    origin: product.origin,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    rating: product.rating,
    ratingCount: product.ratingCount,
    popular: product.popular,
    bestseller: product.bestseller,
    favourite: product.favourite,
    isNew: product.isNew,
    hue: product.hue,
    stockByStore,
  };
}

export function listProducts(filters: {
  q?: string;
  category?: string;
  sort?: string;
  min?: number;
  max?: number;
  storeId?: string;
  inStock?: boolean;
  page?: number;
  pageSize?: number;
  flag?: "popular" | "bestseller" | "favourite" | "new" | "deal";
}) {
  const db = readDB();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, filters.pageSize ?? 24));
  let items = db.products.filter((product) => !product.deletedAt).map((product) => toProductDTO(product.id)!);

  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter((product) =>
      [product.name, product.brand, product.sku, product.categoryName, product.size].join(" ").toLowerCase().includes(q),
    );
  }
  if (filters.category) {
    items = items.filter(
      (product) => product.categorySlug === filters.category || product.categoryId === filters.category,
    );
  }
  if (typeof filters.min === "number") items = items.filter((product) => product.priceCents >= filters.min!);
  if (typeof filters.max === "number") items = items.filter((product) => product.priceCents <= filters.max!);
  if (filters.flag === "popular") items = items.filter((product) => product.popular);
  if (filters.flag === "bestseller") items = items.filter((product) => product.bestseller);
  if (filters.flag === "favourite") items = items.filter((product) => product.favourite);
  if (filters.flag === "new") items = items.filter((product) => product.isNew);
  if (filters.flag === "deal") items = items.filter((product) => product.compareAtCents);
  if (filters.inStock && filters.storeId) {
    items = items.filter((product) => (product.stockByStore[filters.storeId!] ?? 0) > 0);
  }

  const sort = filters.sort ?? "featured";
  items.sort((a, b) => {
    if (sort === "price-asc") return a.priceCents - b.priceCents;
    if (sort === "price-desc") return b.priceCents - a.priceCents;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "newest") return Number(b.isNew) - Number(a.isNew) || b.ratingCount - a.ratingCount;
    return Number(b.popular) - Number(a.popular) || b.ratingCount - a.ratingCount;
  });

  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function homePayload() {
  const db = readDB();
  const categories = db.categories
    .filter((category) => !category.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    categories,
    popular: listProducts({ flag: "popular", pageSize: 8 }).items,
    bestsellers: listProducts({ flag: "bestseller", pageSize: 8 }).items,
    favourites: listProducts({ flag: "favourite", pageSize: 8 }).items,
    newest: listProducts({ flag: "new", pageSize: 8 }).items,
    deals: listProducts({ flag: "deal", pageSize: 8 }).items,
    stores: db.stores.filter((store) => !store.deletedAt),
  };
}
