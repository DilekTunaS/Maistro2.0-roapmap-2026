"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { IdeaRecord } from "@/lib/types";

type DraftIdea = {
  title: string;
  description: string;
  category: string;
  pinned: boolean;
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftIdea | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    const res = await fetch("/api/ideas", { cache: "no-store" });
    const data = (await res.json()) as { items: IdeaRecord[] };
    setIdeas(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  const pinned = useMemo(() => ideas.filter((idea) => idea.pinned), [ideas]);
  const rest = useMemo(() => ideas.filter((idea) => !idea.pinned), [ideas]);

  async function addIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setMessage("Title is required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category }),
      });

      if (!res.ok) {
        setMessage("Idea could not be added.");
        return;
      }

      const data = (await res.json()) as { item?: IdeaRecord };
      if (data.item) {
        setIdeas((prev) => [data.item!, ...prev]);
      } else {
        await load();
      }

      setTitle("");
      setDescription("");
      setCategory("General");
      setMessage("Idea added.");
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(id: number) {
    const res = await fetch(`/api/ideas/${id}/vote`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { item?: IdeaRecord };
      if (data.item) {
        setIdeas((prev) =>
          prev
            .map((idea) => (idea.id === id ? data.item! : idea))
            .sort((a, b) => b.votes - a.votes),
        );
      } else {
        await load();
      }
    }
  }

  function startEdit(idea: IdeaRecord) {
    setEditingId(idea.id);
    setDraft({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      pinned: idea.pinned,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: number) {
    if (!draft) {
      return;
    }

    setSavingEdit(true);
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (res.ok) {
      const data = (await res.json()) as { item?: IdeaRecord };
      if (data.item) {
        setIdeas((prev) =>
          prev
            .map((idea) => (idea.id === id ? data.item! : idea))
            .sort((a, b) => b.votes - a.votes),
        );
      } else {
        await load();
      }
      cancelEdit();
      setMessage("Idea updated.");
    } else {
      setMessage("Update failed.");
    }

    setSavingEdit(false);
  }

  async function deleteIdea(id: number) {
    const approved = window.confirm("Delete this idea?");
    if (!approved) {
      return;
    }

    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      setMessage("Idea deleted.");
    } else {
      setMessage("Delete failed.");
    }
  }

  function card(idea: IdeaRecord) {
    const isEditing = editingId === idea.id;

    return (
      <article
        key={idea.id}
        className="flex flex-col gap-3 rounded-lg border border-slate-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          {isEditing && draft ? (
            <div className="space-y-2">
              <input
                value={draft.title}
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                }
                className="h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft((prev) => (prev ? { ...prev, category: e.target.value } : prev))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.pinned}
                    onChange={(e) =>
                      setDraft((prev) => (prev ? { ...prev, pinned: e.target.checked } : prev))
                    }
                  />
                  Pinned
                </label>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">{idea.category}</p>
              <h3 className="text-lg font-semibold">{idea.title}</h3>
              <p className="text-sm text-slate-600">{idea.description}</p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <p className="text-2xl font-semibold text-slate-800">{idea.votes}</p>
          <button
            onClick={() => vote(idea.id)}
            className="rounded-full border border-teal-500 px-4 py-1 text-sm font-semibold text-teal-700 hover:bg-teal-50"
          >
            VOTE
          </button>
          {isEditing ? (
            <>
              <button
                onClick={() => saveEdit(idea.id)}
                disabled={savingEdit}
                className="rounded-md border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => startEdit(idea)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => deleteIdea(idea.id)}
            className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            Delete
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="-mx-4 bg-[#d6e7f7] px-4 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-xl border border-slate-300 bg-[#f5f7fa] p-3 shadow-card sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-300 bg-white p-4">
            <form onSubmit={addIdea} className="space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "ADDING..." : "+ ADD A NEW IDEA"}
              </button>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Idea title"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {message ? <p className="text-xs text-slate-600">{message}</p> : null}
            </form>
            <div className="mt-5 space-y-1 text-sm text-slate-600">
              <p>My ideas: {ideas.length}</p>
              <p>Total votes: {ideas.reduce((sum, item) => sum + item.votes, 0)}</p>
            </div>
          </aside>

          <section className="min-w-0 space-y-5">
            <div>
              <h2 className="text-2xl font-semibold">Pinned ideas</h2>
              <div className="mt-3 space-y-3">
                {pinned.length === 0 ? (
                  <p className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-500">
                    No pinned idea.
                  </p>
                ) : (
                  pinned.map((idea) => card(idea))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold">All ideas</h2>
              <div className="mt-3 space-y-3">{rest.map((idea) => card(idea))}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}