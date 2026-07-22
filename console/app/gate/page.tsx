import GateForm from "@/components/GateForm";

export const metadata = { title: "Sign in — Visa Risk Console" };

export default function GatePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5">
      <div className="flex items-baseline gap-2.5">
        <span className="visa-wordmark text-3xl" style={{ color: "var(--accent-strong)" }}>VISA</span>
        <span className="text-2xl font-semibold">Risk Console</span>
      </div>
      <p className="mt-3 text-sm text-muted">Internal tool — authorized personnel only.</p>
      <div className="mt-8 w-full max-w-xs">
        <GateForm />
      </div>
    </div>
  );
}
