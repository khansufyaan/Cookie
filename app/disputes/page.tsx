"use client";

import { useState } from "react";

const DISPUTES_EMAIL = "khansufyaan@gmail.com"; // TODO: move to disputes@ once the domain exists

export default function DisputesPage() {
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");

  const mailto = `mailto:${DISPUTES_EMAIL}?subject=${encodeURIComponent(`Rating dispute — ${address || "[wallet address]"}`)}&body=${encodeURIComponent(
    `Wallet address: ${address}\n\nWhat is inaccurate:\n${reason}\n\nEvidence (tx hashes, links):\n`,
  )}`;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-14">
      <h1 className="text-3xl font-bold tracking-tight">Dispute a rating</h1>
      <p className="mt-3 text-muted leading-relaxed">
        A rating you can&apos;t challenge is an accusation, not an assessment. If you believe a Halbrook rating is
        inaccurate — missed activity, a wrongly matched transaction, a sanctions false positive — file a dispute and
        a human reviews it.
      </p>

      <div className="mt-8 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-semibold text-sm">How disputes work</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted list-decimal pl-5">
          <li>File with the wallet address, what&apos;s wrong, and any evidence (transaction hashes help).</li>
          <li>We acknowledge within 2 business days and re-run the rating against source data.</li>
          <li>You receive the outcome and reasoning. Corrections republish the rating and annotate its history.</li>
          <li>Sanctions-flag disputes are prioritized and reviewed against the current OFAC SDN list.</li>
        </ol>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface p-6">
        <label className="block text-sm font-medium">Wallet address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x… or Solana address"
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-line-strong bg-surface px-4 py-2.5 font-mono text-sm placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <label className="mt-4 block text-sm font-medium">What&apos;s inaccurate?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Describe the issue — which factor, which period, which transactions."
          className="mt-2 w-full rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <a
          href={mailto}
          className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors"
        >
          File dispute
        </a>
        <p className="mt-3 text-xs text-faint">
          Opens your mail client addressed to the disputes desk with your details pre-filled.
        </p>
      </div>
    </div>
  );
}
