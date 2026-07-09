import Link from "next/link";
import { notFound } from "next/navigation";
import AppLogo from "@/components/AppLogo";
import LookupForm from "@/components/LookupForm";
import { ALL_APPS, APP_BY_ID, contractsForApp } from "@/lib/apps";

export const revalidate = 3600;

export function generateStaticParams() {
  return ALL_APPS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = APP_BY_ID.get(id);
  return { title: app ? `${app.name} — tracked contracts — Visa Wallet Rating` : "App — Visa Wallet Rating" };
}

function explorerUrl(chain: string, address: string): string {
  if (chain === "Solana") return `https://solscan.io/account/${address}`;
  if (chain === "Polygon") return `https://polygonscan.com/address/${address}`;
  return `https://etherscan.io/address/${address}`;
}

export default async function AppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = APP_BY_ID.get(id);
  if (!app) notFound();

  const contracts = contractsForApp(app);
  const term = app.family === "solana" ? "program" : "contract";

  return (
    <div className="mx-auto max-w-3xl px-5 pt-16 pb-8">
      <Link href="/methodology#apps" className="text-sm text-accent hover:text-accent-strong">
        ← All tracked apps
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <AppLogo domain={app.domain} name={app.name} size={56} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {app.category} · {app.chain}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-sm text-muted leading-relaxed">
          <strong className="text-foreground">
            Every wallet that transacts with the {term}s below is being monitored and rated.
          </strong>{" "}
          These are {app.name}&apos;s canonical on-chain entry points — the addresses users actually send
          transactions to. Activity here counts toward Usage, Magnitude, and Reach, and {app.name} counts as one of
          the apps for the Full-Stack boost. The set is recalibrated quarterly as the protocol deploys new entry
          points.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Monitored {term}s <span className="text-faint font-normal text-base">({contracts.length})</span>
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                <th className="px-4 py-3">{term === "program" ? "Program" : "Contract"}</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.address} className="border-b border-line last:border-0 bg-surface">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{c.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted break-all">{c.address}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={explorerUrl(app.chain, c.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent-strong whitespace-nowrap"
                    >
                      View ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {app.id === "polymarket" && (
          <p className="mt-3 text-xs text-faint">
            Polymarket settles on Polygon; its indexer connection is in progress, so activity here is listed but not
            yet counted.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-semibold">Used {app.name}? Your wallet already has a rating.</h2>
        <p className="mt-1 text-sm text-muted">Look it up — free, live from chain data.</p>
        <div className="mt-4 flex justify-center">
          <LookupForm compact />
        </div>
      </section>
    </div>
  );
}
