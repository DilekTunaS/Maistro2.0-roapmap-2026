"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InitiativeRecord } from "@/lib/types";

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function InitiativeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [item, setItem] = useState<InitiativeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState("");

  const [notesDraft, setNotesDraft] = useState("");
  const [docLinksDraft, setDocLinksDraft] = useState("");
  const [demoLinksDraft, setDemoLinksDraft] = useState("");

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }

    let active = true;

    async function run() {
      const res = await fetch(`/api/initiatives/${id}`, { cache: "no-store" });
      if (!res.ok) {
        if (active) {
          setLoading(false);
        }
        return;
      }
      const data = (await res.json()) as { item: InitiativeRecord };
      if (active) {
        setItem(data.item);
        setNotesDraft(data.item.notes.join("\n"));
        setDocLinksDraft(data.item.docLinks.join("\n"));
        setDemoLinksDraft(data.item.demoLinks.join("\n"));
        setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [id]);

  function update<K extends keyof InitiativeRecord>(key: K, value: InitiativeRecord[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function uploadFile(file: File, target: "doc" | "demo") {
    const formData = new FormData();
    formData.append("file", file);

    if (target === "doc") {
      setUploadingDoc(true);
    } else {
      setUploadingVideo(true);
    }

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        setMessage("Upload failed.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        setMessage("Upload failed.");
        return;
      }
      const url = data.url;

      if (target === "doc") {
        setDocLinksDraft((prev) => (prev ? `${prev}\n${url}` : url));
      } else {
        setDemoLinksDraft((prev) => (prev ? `${prev}\n${url}` : url));
      }

      setMessage("File uploaded. Click Save to persist.");
    } finally {
      if (target === "doc") {
        setUploadingDoc(false);
      } else {
        setUploadingVideo(false);
      }
    }
  }

  async function save() {
    if (!item) {
      return;
    }

    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/initiatives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        notes: splitLines(notesDraft),
        docLinks: splitLines(docLinksDraft),
        demoLinks: splitLines(demoLinksDraft),
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { item: InitiativeRecord };
      setItem(data.item);
      setNotesDraft(data.item.notes.join("\n"));
      setDocLinksDraft(data.item.docLinks.join("\n"));
      setDemoLinksDraft(data.item.demoLinks.join("\n"));
      setMessage("Saved.");
    } else {
      setMessage("Save failed.");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="rounded-xl border border-line bg-card p-8">Loading...</div>;
  }

  if (!item) {
    return (
      <div className="rounded-xl border border-line bg-card p-8">
        Initiative not found. <Link href="/roadmap" className="underline">Back roadmap</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>
        <div className="flex items-center gap-2">
          <Link href="/roadmap" className="rounded-md border border-line px-3 py-2 text-sm">Back</Link>
          <button onClick={save} disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Epic"><input value={item.epic} onChange={(e) => update("epic", e.target.value)} className="input" /></Field>
        <Field label="Quarter"><input value={item.quarter} onChange={(e) => update("quarter", e.target.value)} className="input" /></Field>
        <Field label="Lead"><input value={item.lead} onChange={(e) => update("lead", e.target.value)} className="input" /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Status"><input value={item.status} onChange={(e) => update("status", e.target.value)} className="input" /></Field>
        <Field label="Progress %"><input type="number" min={0} max={100} value={item.progress} onChange={(e) => update("progress", Number(e.target.value))} className="input" /></Field>
        <Field label="Target Date"><input value={item.targetDate} onChange={(e) => update("targetDate", e.target.value)} className="input" /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Customer"><input value={item.customer} onChange={(e) => update("customer", e.target.value)} className="input" /></Field>
        <Field label="ROI Metric"><input value={item.roiMetric} onChange={(e) => update("roiMetric", e.target.value)} className="input" /></Field>
        <Field label="ROI Value"><input value={item.roiValue} onChange={(e) => update("roiValue", e.target.value)} className="input" /></Field>
      </div>

      <Field label="Detail"><textarea value={item.detail} onChange={(e) => update("detail", e.target.value)} className="input h-24" /></Field>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-semibold">Product docs</p>
          <label className="mt-2 inline-flex cursor-pointer rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm">
            {uploadingDoc ? "Uploading..." : "Upload document"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void uploadFile(file, "doc");
                }
              }}
            />
          </label>
          <textarea value={docLinksDraft} onChange={(e) => setDocLinksDraft(e.target.value)} className="input mt-3 h-28" placeholder="Paste documentation links, one per line" />
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-700">
            {splitLines(docLinksDraft).map((url) => (
              <li key={url}><a href={url} target="_blank" rel="noreferrer" className="text-sky-700 underline">{url}</a></li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-semibold">Demo videos / links</p>
          <label className="mt-2 inline-flex cursor-pointer rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm">
            {uploadingVideo ? "Uploading..." : "Upload video"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void uploadFile(file, "demo");
                }
              }}
            />
          </label>
          <textarea value={demoLinksDraft} onChange={(e) => setDemoLinksDraft(e.target.value)} className="input mt-3 h-28" placeholder="Paste demo video links, one per line" />
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-700">
            {splitLines(demoLinksDraft).map((url) => (
              <li key={url}><a href={url} target="_blank" rel="noreferrer" className="text-sky-700 underline">{url}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <Field label="Notes (one bullet per line)"><textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} className="input h-32" /></Field>
      <Field label="Completion criteria"><textarea value={item.completionCriteria} onChange={(e) => update("completionCriteria", e.target.value)} className="input h-24" /></Field>
      <Field label="Constraints"><textarea value={item.constraints} onChange={(e) => update("constraints", e.target.value)} className="input h-24" /></Field>
      <Field label="What problem does this solve?"><textarea value={item.solution} onChange={(e) => update("solution", e.target.value)} className="input h-24" /></Field>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
