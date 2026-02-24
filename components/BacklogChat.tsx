"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const suggestedQuestions = [
  "Find initiatives planned for Q2, 2026",
  "What initiatives are at risk?",
  "Summarize key initiatives for current quarter",
];

export function BacklogChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "How can I help? Ask anything about the backlog.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim()) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as { answer?: string; mode?: string };

      const answer = data.answer ?? "No answer available.";
      const mode = data.mode ? `\n\n(${data.mode} mode)` : "";

      setMessages((prev) => [...prev, { role: "assistant", text: `${answer}${mode}` }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Request failed." }]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = input;
    setInput("");
    await ask(q);
  }

  return (
    <aside className="flex h-full flex-col rounded-xl border border-slate-300 bg-white shadow-card">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-lg font-semibold text-slate-900">New chat</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-700">Recommended</p>
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="block w-full border-b border-slate-100 py-2 text-left text-sm text-slate-600 hover:text-slate-900"
              onClick={() => ask(question)}
            >
              {question}
            </button>
          ))}
        </div>

        {messages.map((message, idx) => (
          <div
            key={`${message.role}-${idx}`}
            className={`rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
              message.role === "user"
                ? "ml-8 bg-sky-100 text-sky-900"
                : "mr-8 border border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-200 p-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="h-20 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Ask anything..."
        />
        <button
          disabled={loading}
          className="mt-2 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>
    </aside>
  );
}
