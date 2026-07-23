import GateForm from "@/components/GateForm";

export const metadata = { title: "Private preview — Visa Wallet Rating" };

export default function GatePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center">
      <div className="flex items-baseline gap-2.5 tracking-tight">
        <span className="visa-wordmark text-2xl" style={{ color: "var(--accent)" }}>VISA</span>
        <span className="font-semibold text-xl">Wallet Rating</span>
      </div>
      <p className="mt-3 text-sm uppercase tracking-widest text-faint">Private preview</p>
      <p className="mt-4 text-muted max-w-xs">Enter the password to view this preview.</p>
      <div className="mt-8 flex justify-center">
        <GateForm />
      </div>
    </div>
  );
}
