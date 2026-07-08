"use client";

import { useState } from "react";

/** Email opt-in form posting to /api/v1/subscribe. */
export default function EmailCapture({
  source,
  cta,
  placeholder = "you@company.com",
  wallet,
}: {
  source: "research" | "claim";
  cta: string;
  placeholder?: string;
  wallet?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/v1/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source, wallet }),
      });
      const json = await res.json();
      if (res.ok) {
        setState("done");
      } else {
        setState("error");
        setMessage(json.error ?? "Something went wrong — try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error — try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm font-medium" style={{ color: "var(--grade-a)" }}>
        ✓ You&apos;re on the list. Watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {state === "busy" ? "…" : cta}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-sm" style={{ color: "var(--grade-c)" }}>{message}</p>}
    </form>
  );
}
