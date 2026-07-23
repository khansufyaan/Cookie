"use client";

import { useState } from "react";

/** Self-serve free-tier API key issuance. The key is displayed exactly once. */
export default function KeyGenerator() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setKey(json.data.key);
        setState("done");
      } else {
        setState("error");
        setMessage(json.error ?? "Something went wrong.");
      }
    } catch {
      setState("error");
      setMessage("Network error — try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="text-left">
        <p className="text-sm font-medium" style={{ color: "var(--grade-a)" }}>✓ Your key — shown exactly once, store it now:</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs">{key}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(key); setCopied(true); }}
            className="rounded-lg border border-line-strong px-3 py-2.5 text-xs font-medium hover:border-accent"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs text-faint">Use it as <code className="font-mono">Authorization: Bearer {"<key>"}</code> — 1,000 requests/day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="w-full min-w-0 rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
        aria-label="Email for API key"
      />
      <button
        type="submit"
        disabled={state === "busy"}
        className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60"
      >
        {state === "busy" ? "…" : "Get free key"}
      </button>
      {state === "error" && <p className="text-sm text-left" style={{ color: "var(--grade-c)" }}>{message}</p>}
    </form>
  );
}
