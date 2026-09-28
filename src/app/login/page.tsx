"use client";

import { useAuth, useToast } from "@/components/providers";
import { api, type SessionUser } from "@/lib/client";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

const accounts = [
  ["Admin", "admin@miniindia.ie", "/admin"],
  ["Store", "store@miniindia.ie", "/store"],
  ["Rider", "rider@miniindia.ie", "/rider"],
  ["Customer", "customer@example.com", "/account"],
];

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function finish(user: SessionUser) {
    await refresh();
    const next = params.get("next");
    const fallback = user.role === "ADMIN" ? "/admin" : user.role === "STORE_OPERATOR" ? "/store" : user.role === "RIDER" ? "/rider" : "/account";
    router.push(next || fallback);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{ user: SessionUser }>(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          name: data.get("name"),
          phone: data.get("phone"),
        }),
      });
      toast(mode === "login" ? "Signed in" : "Account created", "ok");
      await finish(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="rounded-[28px] bg-white p-6 shadow-card">
        <h1 className="font-display text-4xl">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-stone-600">Demo environment. These passwords are not for production.</p>
        {mode === "register" && (
          <>
            <label className="mt-4 block text-sm">Name<input name="name" required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
            <label className="mt-3 block text-sm">Phone<input name="phone" placeholder="+353 87 000 0000" className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
          </>
        )}
        <label className="mt-4 block text-sm">Email<input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="mt-3 block text-sm">Password<input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={pending} className="mt-4 rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white" type="submit">{pending ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}</button>
        <button type="button" className="mt-3 block text-sm font-semibold text-brand-800" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
      </form>
      <aside className="rounded-[28px] bg-brand-900 p-6 text-cream">
        <h2 className="font-display text-3xl">Demo accounts</h2>
        <p className="mt-2 text-sm text-cream/80">Password for every demo account: <span className="font-semibold text-white">MiniIndiaDemo!</span></p>
        <ul className="mt-4 space-y-3 text-sm">
          {accounts.map(([label, email, href]) => (
            <li key={email}>
              <p className="font-semibold">{label}</p>
              <p>{email}</p>
              <button
                type="button"
                className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-900"
                onClick={async () => {
                  setPending(true);
                  try {
                    const result = await api<{ user: SessionUser }>("/api/auth/login", {
                      method: "POST",
                      body: JSON.stringify({ email, password: "MiniIndiaDemo!" }),
                    });
                    await finish({ ...result.user });
                    if (!params.get("next")) router.push(href);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Enter as {label.toLowerCase()}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
