"use client";

import { useState } from "react";

export default function GateForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Wrong password.");
        setBusy(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        className="w-full rounded-full border border-line-strong bg-surface px-5 py-3 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
        aria-label="Console password"
      />
      <button
        type="submit"
        disabled={busy || !password}
        className="mt-3 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60"
      >
        {busy ? "Checking…" : "Enter"}
      </button>
      {error && <p className="mt-3 text-center text-sm" style={{ color: "var(--risk-high)" }}>{error}</p>}
    </form>
  );
}
