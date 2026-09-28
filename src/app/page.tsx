import { HomeHero } from "@/components/home-hero";
import { ProductRow, type CardProduct } from "@/components/product-card";
import { homePayload } from "@/server/queries";

export const dynamic = "force-dynamic";

function cards(items: ReturnType<typeof homePayload>["popular"]): CardProduct[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    size: item.size,
    priceCents: item.priceCents,
    compareAtCents: item.compareAtCents,
    rating: item.rating,
    hue: item.hue,
    categorySlug: item.categorySlug,
    slug: item.slug,
  }));
}

export default function HomePage() {
  const data = homePayload();
  return (
    <>
      <HomeHero categories={data.categories.map((category) => ({ slug: category.slug, name: category.name }))} />
      <ProductRow title="Popular near you" products={cards(data.popular)} href="/shop?flag=popular" />
      <ProductRow title="Best sellers" products={cards(data.bestsellers)} href="/shop?flag=bestseller" />
      <ProductRow title="Indian favourites" products={cards(data.favourites)} href="/shop?flag=favourite" />
      <ProductRow title="New arrivals" products={cards(data.newest)} href="/shop?flag=new" />
    </>
  );
}
