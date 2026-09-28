"use client";

import { DEMO_LOCATIONS } from "@/lib/demo-locations";
import { api, type CartView, type SessionUser } from "@/lib/client";
import type { DemoAddress } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Toast = { id: number; message: string; tone: "ok" | "err" | "info" };

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});
const AuthContext = createContext<{
  user: SessionUser | null;
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}>({ user: null, ready: false, refresh: async () => {}, logout: async () => {} });

const CartContext = createContext<{
  cart: CartView | null;
  count: number;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<boolean>;
  update: (itemId: string, quantity: number) => Promise<void>;
  applyPromo: (code: string) => Promise<void>;
}>({
  cart: null,
  count: 0,
  refresh: async () => {},
  add: async () => false,
  update: async () => {},
  applyPromo: async () => {},
});

const LocationContext = createContext<{
  location: DemoAddress | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  choose: (location: DemoAddress, options?: { keepOpen?: boolean }) => Promise<void>;
  quote: { eligible: boolean; message: string; etaLabel?: string | null; storeName?: string | null; storeId?: string | null; zone?: string | null } | null;
}>({ location: null, open: false, setOpen: () => {}, choose: async () => {}, quote: null });

export function useToast() {
  return useContext(ToastContext);
}
export function useAuth() {
  return useContext(AuthContext);
}
export function useCart() {
  return useContext(CartContext);
}
export function useLocation() {
  return useContext(LocationContext);
}

const LOCATION_KEY = "mini-india-location";

export function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState<CartView | null>(null);
  const [location, setLocation] = useState<DemoAddress | null>(null);
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<{ eligible: boolean; message: string; etaLabel?: string | null; storeName?: string | null; storeId?: string | null; zone?: string | null } | null>(null);

  const toast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  const refreshAuth = useCallback(async () => {
    const data = await api<{ user: SessionUser | null }>("/api/auth/me");
    setUser(data.user);
    setAuthReady(true);
  }, []);

  const refreshCart = useCallback(async () => {
    const data = await api<CartView>("/api/cart");
    setCart(data);
  }, []);

  useEffect(() => {
    refreshAuth().catch(() => setAuthReady(true));
  }, [refreshAuth]);

  const choose = useCallback(
    async (next: DemoAddress, options?: { keepOpen?: boolean }) => {
      setLocation(next);
      window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
      const check = await api<{
        eligible: boolean;
        message: string;
        etaLabel: string | null;
        zone: string | null;
        store: { id: string; name: string } | null;
      }>("/api/delivery/check", {
        method: "POST",
        body: JSON.stringify({ lat: next.lat, lng: next.lng, query: next.eircode }),
      });
      setQuote({
        eligible: check.eligible,
        message: check.message,
        etaLabel: check.etaLabel,
        storeName: check.store?.name ?? null,
        storeId: check.store?.id ?? null,
        zone: check.zone,
      });
      const updated = await api<CartView>("/api/cart", {
        method: "PATCH",
        body: JSON.stringify({
          lat: next.lat,
          lng: next.lng,
          addressLabel: `${next.line1}, ${next.city}`,
        }),
      });
      setCart(updated);
      if (!options?.keepOpen) setOpen(false);
    },
    [],
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        await refreshCart();
      } catch {
        /* cart can be created on the next action */
      }
      if (cancel) return;
      const saved = window.localStorage.getItem(LOCATION_KEY);
      if (!saved) return;
      try {
        await choose(JSON.parse(saved) as DemoAddress);
      } catch {
        window.localStorage.removeItem(LOCATION_KEY);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [choose, refreshCart]);

  const add = useCallback(
    async (productId: string, quantity = 1) => {
      if (!location) {
        setOpen(true);
        toast("Enter your Eircode before adding items.", "info");
        return false;
      }
      try {
        const updated = await api<CartView>("/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        });
        setCart(updated);
        toast("Added to basket", "ok");
        return true;
      } catch (error) {
        toast(error instanceof Error ? error.message : "Something went wrong. Please try again.", "err");
        return false;
      }
    },
    [location, toast],
  );

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        const updated = await api<CartView>(`/api/cart/items/${itemId}`, {
          method: quantity <= 0 ? "DELETE" : "PATCH",
          body: quantity <= 0 ? undefined : JSON.stringify({ quantity }),
        });
        setCart(updated);
      } catch (error) {
        toast(error instanceof Error ? error.message : "Something went wrong. Please try again.", "err");
      }
    },
    [toast],
  );

  const applyPromo = useCallback(
    async (code: string) => {
      try {
        const updated = await api<CartView>("/api/cart", {
          method: "PATCH",
          body: JSON.stringify({ promoCode: code }),
        });
        setCart(updated);
        if (updated.promoError) toast(updated.promoError, "err");
        else if (code) toast("Offer applied", "ok");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Something went wrong. Please try again.", "err");
      }
    },
    [toast],
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast("Signed out", "info");
  }, [toast]);

  const authValue = useMemo(() => ({ user, ready: authReady, refresh: refreshAuth, logout }), [user, authReady, refreshAuth, logout]);
  const cartValue = useMemo(
    () => ({
      cart,
      count: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      refresh: refreshCart,
      add,
      update,
      applyPromo,
    }),
    [cart, refreshCart, add, update, applyPromo],
  );
  const locationValue = useMemo(() => ({ location, open, setOpen, choose, quote }), [location, open, choose, quote]);

  return (
    <ToastContext.Provider value={toast}>
      <AuthContext.Provider value={authValue}>
        <LocationContext.Provider value={locationValue}>
          <CartContext.Provider value={cartValue}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
              {toasts.map((item) => (
                <div
                  key={item.id}
                  className={`pointer-events-auto max-w-sm rounded-full px-4 py-2 text-sm shadow-lift ${
                    item.tone === "err" ? "bg-red-700 text-white" : item.tone === "ok" ? "bg-brand-800 text-cream" : "bg-ink text-cream"
                  }`}
                >
                  {item.message}
                </div>
              ))}
            </div>
            <LocationModal />
          </CartContext.Provider>
        </LocationContext.Provider>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}

function LocationModal() {
  const { open, setOpen, choose } = useLocation();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [outside, setOutside] = useState("");
  const [found, setFound] = useState<{ message: string; store: string; eta: string; zone: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  async function submit(value?: string) {
    setPending(true);
    setError("");
    setOutside("");
    setFound(null);
    try {
      const check = await api<{
        eligible: boolean;
        message: string;
        address: DemoAddress | null;
        etaLabel: string | null;
        zone: string | null;
        store: { name: string } | null;
      }>("/api/delivery/check", {
        method: "POST",
        body: JSON.stringify({ query: value ?? query }),
      });
      if (!check.address) {
        setError("Sorry, we couldn't find your location.");
        return;
      }
      await choose(check.address, { keepOpen: true });
      if (!check.eligible) {
        setOutside(check.message);
        return;
      }
      setFound({
        message: check.message,
        store: check.store?.name ?? "Nearest store",
        eta: check.etaLabel ?? "",
        zone: check.zone ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, we couldn't find your location.");
    } finally {
      setPending(false);
    }
  }

  async function geolocate() {
    if (!navigator.geolocation) {
      setError("Sorry, we couldn't find your location.");
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const check = await api<{
            eligible: boolean;
            message: string;
            etaLabel: string | null;
            store: { name: string } | null;
          }>("/api/delivery/check", {
            method: "POST",
            body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          });
          if (!check.eligible) {
            setError(check.message);
            setPending(false);
            return;
          }
          const nearest = DEMO_LOCATIONS.find((item) => item.id !== "outside")!;
          await choose({
            ...nearest,
            id: "gps",
            label: "Your location",
            line1: "Current location",
            city: check.store?.name.includes("Limerick") ? "Limerick" : "Dublin",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            eircode: nearest.eircode,
          });
          toast(`${check.message} ${check.etaLabel ?? ""}`.trim(), "ok");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Sorry, we couldn't find your location.");
        } finally {
          setPending(false);
        }
      },
      () => {
        setPending(false);
        setError("Sorry, we couldn't find your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const buttons = [
    ["dublin", "Demo Dublin"],
    ["sandyford", "Demo Sandyford"],
    ["limerick", "Demo Limerick"],
    ["outside", "Demo Outside Zone"],
  ] as const;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deliver-title"
        className="max-h-[92vh] w-full overflow-auto rounded-t-[28px] bg-paper p-5 shadow-lift sm:max-w-xl sm:rounded-[28px] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Delivery</p>
            <h2 id="deliver-title" className="mt-1 font-display text-3xl text-ink">
              Where should we deliver?
            </h2>
          </div>
          <button type="button" className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100" onClick={() => setOpen(false)} aria-label="Close location dialog">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-stone-600">Enter an Eircode or address in Dublin or Limerick. We deliver within about 6 km when the rider can arrive within 60 minutes.</p>
        {demo && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {buttons.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-left text-sm font-semibold hover:border-brand-700"
                onClick={() => {
                  const preset = DEMO_LOCATIONS.find((item) => item.id === id)!;
                  setQuery(preset.eircode);
                  void submit(preset.eircode);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <label className="mt-4 block text-sm font-medium" htmlFor="eircode">
          Enter your Eircode or address
        </label>
        <input
          id="eircode"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="D02 XY45"
          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none ring-brand-700 focus:ring-2"
        />
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {outside && (
          <form
            className="mt-4 rounded-2xl bg-cream p-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const result = await api<{ message: string }>("/api/waitlist", {
                  method: "POST",
                  body: JSON.stringify({ email, address: query }),
                });
                toast(result.message, "ok");
                setOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
              }
            }}
          >
            <p className="font-semibold">{outside}</p>
            <p className="mt-1 text-sm text-stone-600">Join the waitlist and we'll email you when a store opens nearby.</p>
            <label className="mt-3 block text-sm" htmlFor="waitlist-email">Email</label>
            <input id="waitlist-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" />
            <button className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">Join the waitlist</button>
          </form>
        )}
        {found && (
          <div className="mt-4 rounded-2xl bg-brand-50 p-4">
            <p className="font-semibold text-brand-900">{found.message}</p>
            <p className="mt-2 text-sm">Nearest store · {found.store}</p>
            <p className="text-sm">Estimated delivery · {found.eta}</p>
            <p className="text-sm">Delivery zone · {found.zone}</p>
            <p className="mt-1 text-sm font-semibold">Delivery available</p>
            <button type="button" className="mt-3 rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white" onClick={() => setOpen(false)}>Start shopping</button>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => void geolocate()} className="rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold">
            Use my location
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void submit()}
            className="rounded-full bg-brand-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Checking…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
