import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-[28px] bg-white p-8 text-center shadow-card">
      <h1 className="font-display text-4xl">That page isn't on the shelf</h1>
      <p className="mt-2 text-stone-600">The link may be out of date. The shop, your basket and order tracking are still open.</p>
      <Link href="/" className="mt-4 inline-block rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white">Back home</Link>
    </div>
  );
}
