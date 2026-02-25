"use client";

import { FormEvent, useEffect, useState } from "react";

type AccessRequestItem = {
  id: number;
  name: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedCode?: string;
};

export default function AccessAdminPage() {
  const [key, setKey] = useState("");
  const [items, setItems] = useState<AccessRequestItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("maistro_admin_key");
    if (saved) {
      setKey(saved);
    }
  }, []);

  async function loadRequests(adminKey: string) {
    if (!adminKey.trim()) {
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/access/admin/requests?key=${encodeURIComponent(adminKey)}`, { cache: "no-store" });
    const data = (await res.json()) as { items?: AccessRequestItem[]; message?: string };
    if (!res.ok) {
      setMessage(data.message ?? "Yetki hatasi");
      setItems([]);
      setLoading(false);
      return;
    }
    setItems(data.items ?? []);
    setLoading(false);
  }

  async function onApprove(id: number) {
    const res = await fetch("/api/access/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, key }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(data.message ?? (res.ok ? "Onaylandi." : "Islem basarisiz."));
    await loadRequests(key);
  }

  async function onReject(id: number) {
    const res = await fetch("/api/access/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, key }),
    });
    const data = (await res.json()) as { message?: string };
    setMessage(data.message ?? (res.ok ? "Reddedildi." : "Islem basarisiz."));
    await loadRequests(key);
  }

  function onLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("maistro_admin_key", key);
    void loadRequests(key);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-xl2 border border-line bg-card p-5 shadow-card">
        <h1 className="text-xl font-semibold tracking-tight">Access Admin</h1>
        <p className="mt-2 text-sm text-muted">Pending istekleri onayla ve erisim kodu uret.</p>
        <form onSubmit={onLoad} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ACCESS_ADMIN_KEY"
            className="min-w-[260px] flex-1 rounded-md border border-line px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Listeyi Yukle
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-xl2 border border-line bg-card shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-line">
              <th className="px-3 py-2 text-left">Talep</th>
              <th className="px-3 py-2 text-left">Durum</th>
              <th className="px-3 py-2 text-left">Kod</th>
              <th className="px-3 py-2 text-left">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line align-top">
                <td className="px-3 py-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-slate-600">{item.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.reason || "-"}</p>
                </td>
                <td className="px-3 py-2">{item.status}</td>
                <td className="px-3 py-2 font-mono">{item.approvedCode ?? "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(item.id)}
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(item.id)}
                      className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  {loading ? "Yukleniyor..." : "Talep yok"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

