/* eslint-disable @next/next/no-img-element */

/** Project logo via favicon lookup — replaced by first-party brand assets later. */
export default function AppLogo({
  domain,
  name,
  size = 20,
}: {
  domain: string;
  name: string;
  size?: number;
}) {
  return (
    <img
      src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size >= 32 ? 64 : 32}`}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-[4px] shrink-0"
    />
  );
}
