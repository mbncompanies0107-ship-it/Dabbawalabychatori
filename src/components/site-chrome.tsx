"use client";

import { useAuth, useCart, useLocation } from "@/components/providers";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import {
  ClipboardList,
  Home,
  LayoutGrid,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
  { href: "/track/MI-10482", label: "Track order" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/admin") || pathname.startsWith("/store") || pathname.startsWith("/rider");
  if (bare) return <>{children}</>;
  return (
    <>
      <Header />
      <main id="main" className="mx-auto min-h-[70vh] w-full max-w-page px-4 pb-28 pt-6 md:px-8 md:pb-16">
        {children}
      </main>
      <Footer />
      <MobileNav />
      <CartPill />
    </>
  );
}

function Header() {
  const { location, setOpen, quote } = useLocation();
  const { count } = useCart();
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const router = useRouter();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  const accountHref =
    user?.role === "ADMIN" ? "/admin" : user?.role === "STORE_OPERATOR" ? "/store" : user?.role === "RIDER" ? "/rider" : "/account";

  return (
    <header className="sticky top-0 z-40">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="bg-brand-900 text-cream">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-2 text-xs md:px-8">
          <p>Up to 60 min delivery · Dublin & Limerick</p>
          <p className="hidden sm:block">Free delivery over €50</p>
        </div>
      </div>
      <div className="border-b border-stone-200/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-page items-center gap-3 px-4 py-3 md:px-8">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Mini India home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-800 text-cream">
              <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
                <path d="M8 23c2.4-1.3 3.6-3.6 3.8-6.6.9 2.3 2.6 3.8 4.6 4.4-2.1.8-3.6 2.1-4.3 4H8zm8.6-15c.4 2.8-.2 5.1-1.7 7 2.4-.2 4.4.4 6.1 1.9-1.7-3-1.9-5.7-.8-8.3-1.3-.6-2.5-.8-3.6-.6z" fill="currentColor" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="block font-display text-[1.35rem] tracking-tight">Mini India</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700">Ireland</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden min-w-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-left md:flex"
            aria-label="Choose delivery location"
          >
            <MapPin className="h-4 w-4 shrink-0 text-spice-500" />
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-stone-500">Delivering to</span>
              <span className="block truncate text-sm font-semibold">{location ? `${location.line1}, ${location.city}` : "Select address"}</span>
            </span>
          </button>
          <form onSubmit={onSearch} className="hidden flex-1 lg:block" role="search">
            <label className="sr-only" htmlFor="site-search">Search groceries, snacks, spices</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="site-search"
                name="q"
                placeholder="Search groceries, snacks, spices..."
                className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-4 outline-none ring-brand-700 focus:ring-2"
              />
            </div>
          </form>
          <nav className="ml-auto hidden items-center gap-5 text-sm font-semibold lg:flex" aria-label="Primary">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-stone-700 hover:text-brand-800">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link href="/search" className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white lg:hidden" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white" aria-label="Account" aria-expanded={account} onClick={() => setAccount((value) => !value)}>
                <UserRound className="h-5 w-5" />
              </button>
              {account && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-lift">
                  <p className="px-3 py-2 text-sm text-stone-500">{user ? user.name : "Guest"}</p>
                  <Link href={accountHref} className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-stone-50" onClick={() => setAccount(false)}>
                    {user ? "Your dashboard" : "Sign in"}
                  </Link>
                  <Link href="/orders" className="block rounded-xl px-3 py-2 text-sm hover:bg-stone-50" onClick={() => setAccount(false)}>Orders</Link>
                  <Link href="/login" className="block rounded-xl px-3 py-2 text-sm hover:bg-stone-50" onClick={() => setAccount(false)}>Switch demo account</Link>
                </div>
              )}
            </div>
            <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full bg-brand-800 text-white" aria-label={`Basket, ${count} items`}>
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-spice-500 px-1 text-[11px] font-bold">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 border-t border-stone-100 px-4 py-2 text-left text-sm md:hidden">
          <MapPin className="h-4 w-4 text-spice-500" />
          <span className="truncate font-medium">{location ? `Delivering to ${location.city}` : "Delivering to… choose an address"}</span>
          {quote?.eligible && quote.etaLabel && <span className="ml-auto shrink-0 text-brand-700">{quote.etaLabel}</span>}
        </button>
      </div>
      {menu && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMenu(false)}>
          <div className="h-full w-[82%] max-w-sm bg-paper p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl">Menu</p>
              <button type="button" aria-label="Close menu" onClick={() => setMenu(false)}><X /></button>
            </div>
            <div className="mt-6 flex flex-col gap-2 text-lg font-semibold">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenu(false)} className="rounded-2xl px-3 py-3 hover:bg-white">
                  {link.label}
                </Link>
              ))}
              <Link href="/account" onClick={() => setMenu(false)} className="rounded-2xl px-3 py-3 hover:bg-white">Account</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const columns = [
    ["About Mini India", "/about"],
    ["Contact", "/contact"],
    ["Delivery information", "/delivery-info"],
    ["Refund policy", "/refunds"],
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["GDPR", "/gdpr"],
    ["Careers", "/careers"],
  ];
  return (
    <footer className="border-t border-stone-200 bg-brand-900 text-cream">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-12 md:grid-cols-[1.3fr_1fr] md:px-8">
        <div>
          <p className="font-display text-3xl">Mini India</p>
          <p className="mt-3 max-w-md text-sm text-cream/80">Indian groceries, snacks and everyday essentials, packed in Dublin and Limerick and delivered in under an hour.</p>
          <p className="mt-4 text-sm text-cream/70">Mini India Ireland · Europe/Dublin · EUR</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {columns.map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="text-cream/85 hover:text-white">{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const items = [
    ["/","Home", Home],
    ["/categories", "Categories", LayoutGrid],
    ["/search", "Search", Search],
    ["/orders", "Orders", ClipboardList],
    ["/account", "Account", UserRound],
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-paper/95 backdrop-blur md:hidden" aria-label="Mobile">
      <ul className="grid grid-cols-5">
        {items.map(([href, label, Icon]) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link href={href} className={cn("flex flex-col items-center gap-1 py-2 text-[11px]", active ? "text-brand-800" : "text-stone-500")} aria-current={active ? "page" : undefined}>
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CartPill() {
  const { cart, count } = useCart();
  const pathname = usePathname();
  if (!count || pathname === "/cart" || pathname === "/checkout") return null;
  return (
    <Link href="/cart" className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lift md:hidden">
      <ShoppingBag className="h-4 w-4" />
      View basket · {count}
      {cart?.totalCents != null && <span>{formatMoney(cart.totalCents)}</span>}
    </Link>
  );
}
