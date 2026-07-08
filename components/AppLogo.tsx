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
      src={`/api/logo/${domain}`}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-[4px] shrink-0"
    />
  );
}
