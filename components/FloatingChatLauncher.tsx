"use client";

import { useState } from "react";
import { BacklogChat } from "@/components/BacklogChat";

export function FloatingChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div className="fixed bottom-5 right-5 z-50 h-[70vh] w-[min(92vw,420px)]">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
            >
              Close chat
            </button>
          </div>
          <div className="h-[calc(100%-40px)]">
            <BacklogChat />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-sky-300 bg-sky-500 text-2xl text-white shadow-lg"
        aria-label="Open chat"
        title="Open chat"
      >
        💬
      </button>
    </>
  );
}
