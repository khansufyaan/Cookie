import AppLogo from "@/components/AppLogo";
import { ALL_APPS } from "@/lib/apps";

/** Continuously scrolling strip of tracked-app logos. */
export default function LogoMarquee() {
  const items = [...ALL_APPS, ...ALL_APPS]; // duplicated for a seamless loop
  return (
    <div className="marquee-mask overflow-hidden" aria-label="Apps tracked by Halbrook">
      <div className="marquee flex w-max items-center gap-10 py-2">
        {items.map((a, i) => (
          <span key={`${a.id}-${i}`} className="flex items-center gap-2 text-sm text-muted whitespace-nowrap" aria-hidden={i >= ALL_APPS.length}>
            <AppLogo domain={a.domain} name={a.name} size={20} />
            {a.name}
          </span>
        ))}
      </div>
    </div>
  );
}
