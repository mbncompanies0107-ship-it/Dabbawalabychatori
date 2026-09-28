"use client";

import { DeliveryMap } from "@/components/map-card";
import { api } from "@/lib/client";
import { Check } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Tracking {
  number: string;
  headline: string;
  status: string;
  etaMinutes: number;
  etaLabel: string;
  store: { name: string; lat: number; lng: number } | null;
  rider: { name: string; phone: string; rating: number } | null;
  city: string;
  lat: number;
  lng: number;
  timeline: { key: string; label: string; done: boolean; current: boolean }[];
  map: {
    store: { lat: number; lng: number; label: string };
    customer: { lat: number; lng: number; label: string };
    rider: { lat: number; lng: number; label: string } | null;
  };
}

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState("");

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const data = await api<{ tracking: Tracking }>(`/api/orders/${params.id}/tracking`);
        if (!stop) setTracking(data.tracking);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    }
    void load();
    const timer = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [params.id]);

  if (error) return <p className="rounded-2xl bg-white p-8 text-red-700">{error}</p>;
  if (!tracking || !tracking.store) return <div className="h-96 animate-pulse rounded-[28px] bg-white" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Order #{tracking.number}</p>
        <h1 className="mt-2 font-display text-4xl">{tracking.headline}</h1>
        <p className="mt-2 text-lg text-brand-800">
          {tracking.status === "DELIVERED" ? "Delivered" : `Arriving in ${tracking.etaMinutes} min`}
        </p>
        <div className="mt-5">
          <DeliveryMap store={tracking.map.store} customer={tracking.map.customer} rider={tracking.map.rider} />
        </div>
      </section>
      <section className="rounded-[24px] bg-white p-5 shadow-card">
        <ol className="space-y-4">
          {tracking.timeline.map((step) => (
            <li key={step.key} className="flex gap-3">
              <span className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full text-xs ${step.done || step.current ? "bg-brand-800 text-white" : "bg-stone-100 text-stone-400"}`}>
                {step.done ? <Check className="h-3.5 w-3.5" /> : ""}
              </span>
              <span>
                <span className={`block text-sm font-semibold ${step.current ? "text-brand-800" : ""}`}>{step.label}</span>
              </span>
            </li>
          ))}
        </ol>
        {tracking.rider && (
          <div className="mt-6 rounded-2xl bg-cream p-4">
            <p className="text-sm text-stone-500">Your rider</p>
            <p className="font-semibold">{tracking.rider.name} · {tracking.rider.rating.toFixed(1)}</p>
            <div className="mt-3 flex gap-2">
              <a className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white" href={`tel:${tracking.rider.phone}`}>Call rider</a>
              <button type="button" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold" onClick={() => setSent(sent ? "" : "open")}>Message rider</button>
            </div>
            {sent && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    const result = await api<{ notice: string }>(`/api/orders/${params.id}/message`, {
                      method: "POST",
                      body: JSON.stringify({ message }),
                    });
                    setSent(result.notice);
                    setMessage("");
                  } catch (err) {
                    setSent(err instanceof Error ? err.message : "Something went wrong. Please try again.");
                  }
                }}
              >
                <input value={message} onChange={(event) => setMessage(event.target.value)} className="flex-1 rounded-xl border border-stone-200 px-3 py-2" placeholder="I'm at the side gate" aria-label="Message" />
                <button className="rounded-full bg-ink px-3 text-sm font-semibold text-white" type="submit">Send</button>
              </form>
            )}
            {sent && sent !== "open" && <p className="mt-2 text-sm text-stone-600">{sent}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
