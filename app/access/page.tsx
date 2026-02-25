"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccessPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/");
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingRequest(true);
    setMessage("");
    try {
      const res = await fetch("/api/access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, reason }),
      });
      const data = (await res.json()) as { message?: string };
      setMessage(data.message ?? (res.ok ? "Talep alindi." : "Talep gonderilemedi."));
      if (res.ok) {
        setReason("");
      }
    } finally {
      setLoadingRequest(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingCode(true);
    setMessage("");
    try {
      const res = await fetch("/api/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Kod dogrulanamadi.");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } finally {
      setLoadingCode(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 lg:grid-cols-2">
      <section className="rounded-xl2 border border-line bg-card p-5 shadow-card">
        <h1 className="text-xl font-semibold tracking-tight">Erisim Talebi</h1>
        <p className="mt-2 text-sm text-muted">
          Backlog ekrani kapali. Erisim icin talep birak, onaylandiginda kod verilir.
        </p>
        <form onSubmit={submitRequest} className="mt-4 space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad soyad"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Kurumsal e-posta"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Neden erisim istiyorsun?"
            className="h-24 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loadingRequest}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loadingRequest ? "Gonderiliyor..." : "Talep Gonder"}
          </button>
        </form>
      </section>

      <section className="rounded-xl2 border border-line bg-card p-5 shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">Onay Kodu ile Giris</h2>
        <p className="mt-2 text-sm text-muted">
          Onaylandiktan sonra yoneticiden aldigin kodu gir.
        </p>
        <form onSubmit={submitCode} className="mt-4 space-y-3">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MAI-XXXXXX"
            className="w-full rounded-md border border-line px-3 py-2 text-sm uppercase"
          />
          <button
            type="submit"
            disabled={loadingCode}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loadingCode ? "Dogrulaniyor..." : "Kodu Dogrula"}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>
    </div>
  );
}
