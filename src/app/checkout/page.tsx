"use client";

import { useCart, useLocation, useToast } from "@/components/providers";
import { api } from "@/lib/client";
import { formatMoney } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const steps = ["Delivery address", "Delivery time", "Payment", "Review"];

export default function CheckoutPage() {
  const { cart, refresh } = useCart();
  const { location } = useLocation();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [when, setWhen] = useState<"asap" | "later">("asap");
  const [method, setMethod] = useState<"card" | "apple_pay" | "google_pay">("card");
  const [form, setForm] = useState({
    name: location?.name ?? "",
    phone: location?.phone ?? "",
    line1: location?.line1 ?? "",
    line2: location?.line2 ?? "",
    city: location?.city ?? "",
    eircode: location?.eircode ?? "",
    instructions: location?.instructions ?? "",
  });

  useEffect(() => {
    if (!location) return;
    setForm((current) => current.line1 ? current : {
      name: location.name,
      phone: location.phone,
      line1: location.line1,
      line2: location.line2,
      city: location.city,
      eircode: location.eircode,
      instructions: location.instructions,
    });
  }, [location]);

  if (!cart) return <div className="h-80 animate-pulse rounded-[28px] bg-white" />;
  if (!cart.items.length) {
    return <p className="rounded-2xl bg-white p-8">Your basket is empty. <a className="font-semibold text-brand-800" href="/shop">Return to the shop</a></p>;
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function place() {
    setPending(true);
    setError("");
    try {
      const result = await api<{ order: { number: string } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...form, paymentMethod: method, slot: when }),
      });
      await refresh();
      router.push(`/order/${result.order.number}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast(message, "err");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Checkout</h1>
      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Checkout steps">
        {steps.map((label, index) => (
          <li key={label} className={`rounded-full px-3 py-1 text-xs font-semibold ${index === step ? "bg-brand-800 text-white" : index < step ? "bg-brand-50 text-brand-800" : "bg-white text-stone-500"}`}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-[24px] bg-white p-5 shadow-card">
        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(value) => set("name", value)} />
            <Field label="Phone" value={form.phone} onChange={(value) => set("phone", value)} hint="+353" />
            <Field label="Address" value={form.line1} onChange={(value) => set("line1", value)} className="sm:col-span-2" />
            <Field label="Apartment / house details" value={form.line2} onChange={(value) => set("line2", value)} />
            <Field label="City" value={form.city} onChange={(value) => set("city", value)} />
            <Field label="Eircode" value={form.eircode} onChange={(value) => set("eircode", value)} />
            <Field label="Delivery instructions" value={form.instructions} onChange={(value) => set("instructions", value)} className="sm:col-span-2" />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-3">
            <Choice selected={when === "asap"} onClick={() => setWhen("asap")} title="ASAP" body={cart.etaLabel ?? "25–35 min"} />
            <Choice selected={when === "later"} onClick={() => setWhen("later")} title="Scheduled delivery" body="This evening, 18:00–19:00" />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3">
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm">Demo payment. Nothing is charged and card numbers are not stored.</p>
            <Choice selected={method === "card"} onClick={() => setMethod("card")} title="Card" body="Visa ending 4242 · demo" />
            <Choice selected={method === "apple_pay"} onClick={() => setMethod("apple_pay")} title="Apple Pay" body="Demo wallet" />
            <Choice selected={method === "google_pay"} onClick={() => setMethod("google_pay")} title="Google Pay" body="Demo wallet" />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-2 text-sm">
            <p><span className="text-stone-500">Deliver to</span> {form.name}, {form.line1}, {form.city}, {form.eircode}</p>
            <p><span className="text-stone-500">When</span> {when === "asap" ? cart.etaLabel : "18:00–19:00"}</p>
            <p><span className="text-stone-500">Payment</span> {method === "card" ? "Card · demo" : method === "apple_pay" ? "Apple Pay · demo" : "Google Pay · demo"}</p>
            <p><span className="text-stone-500">Store</span> {cart.store?.name}</p>
            <p className="text-lg font-semibold">Total {cart.totalCents != null ? formatMoney(cart.totalCents) : "—"}</p>
            <ul className="text-stone-600">
              {cart.items.map((item) => (
                <li key={item.id}>{item.quantity} × {item.name}</li>
              ))}
            </ul>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-between">
          <button type="button" className="rounded-full px-4 py-2 text-sm" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>
          {step < 3 ? (
            <button type="button" className="rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white" onClick={() => setStep((value) => value + 1)}>Continue</button>
          ) : (
            <button type="button" disabled={pending} className="rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void place()}>
              {pending ? "Placing order…" : "Place order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint, className }: { label: string; value: string; onChange: (value: string) => void; hint?: string; className?: string }) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className={className} htmlFor={id}>
      <span className="text-sm font-medium">{label}</span>
      <input id={id} value={value} placeholder={hint} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" />
    </label>
  );
}

function Choice({ selected, onClick, title, body }: { selected: boolean; onClick: () => void; title: string; body: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border px-4 py-3 text-left ${selected ? "border-brand-800 bg-brand-50" : "border-stone-200"}`} aria-pressed={selected}>
      <span className="block font-semibold">{title}</span>
      <span className="text-sm text-stone-600">{body}</span>
    </button>
  );
}
