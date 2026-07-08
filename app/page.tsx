const FLAVORS = [
  {
    name: "Brown Butter Chip",
    description:
      "The classic, upgraded. Nutty brown butter, pooled dark chocolate, flaky sea salt.",
    price: "$4.50",
    base: "#e0a35c",
    chips: "#4a2c1a",
    tag: "Best seller",
  },
  {
    name: "Double Cocoa Crackle",
    description:
      "Fudgy center, crackled top, 70% single-origin cocoa. Basically a brownie in disguise.",
    price: "$4.75",
    base: "#5a3a26",
    chips: "#2c1a0e",
    tag: null,
  },
  {
    name: "Salted Caramel Core",
    description:
      "A molten caramel heart inside a buttery shell. Eat warm. Thank us later.",
    price: "$5.00",
    base: "#d98c3f",
    chips: "#8a5420",
    tag: "Staff pick",
  },
  {
    name: "Lemon Sugar Cloud",
    description:
      "Pillowy sugar cookie with fresh lemon zest and a crackly sugar crust.",
    price: "$4.25",
    base: "#f2d98c",
    chips: "#e0b93f",
    tag: null,
  },
  {
    name: "Oat & Toasted Coconut",
    description:
      "Chewy oats, toasted coconut, and a whisper of cinnamon. The sleeper hit.",
    price: "$4.50",
    base: "#caa06a",
    chips: "#8a6a42",
    tag: null,
  },
  {
    name: "Midnight Espresso",
    description:
      "Dark roast espresso, cocoa nibs, and a chocolate drizzle. For the night owls.",
    price: "$4.75",
    base: "#6b4a30",
    chips: "#3b2417",
    tag: "New",
  },
];

const REVIEWS = [
  {
    quote:
      "I ordered one box to try and three more before the first one arrived. These are dangerous.",
    name: "Maya R.",
    detail: "Ordered the Classic Dozen",
  },
  {
    quote:
      "The salted caramel core should be illegal. Warm it for ten seconds and cancel your plans.",
    name: "Devon K.",
    detail: "Subscriber since 2024",
  },
  {
    quote:
      "Sent a box to my sister across the country. She called me crying. Happy tears, allegedly.",
    name: "Priya S.",
    detail: "Gift box regular",
  },
];

const TICKER_ITEMS = [
  "Brown butter",
  "48-hour dough",
  "Flaky sea salt",
  "Single-origin cocoa",
  "Baked to order",
  "Small batch",
];

function CookieMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="18" fill="#e0a35c" />
      <circle cx="20" cy="20" r="18" fill="none" stroke="#3b2417" strokeWidth="2.5" />
      <circle cx="13" cy="15" r="3" fill="#3b2417" />
      <circle cx="26" cy="13" r="2.5" fill="#3b2417" />
      <circle cx="22" cy="24" r="3.5" fill="#3b2417" />
      <circle cx="12" cy="26" r="2.5" fill="#3b2417" />
      <circle cx="29" cy="27" r="2" fill="#3b2417" />
    </svg>
  );
}

function HeroCookie() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full max-w-md drop-shadow-[0_24px_40px_rgba(59,36,23,0.25)]"
      role="img"
      aria-label="Illustration of a chocolate chip cookie with a bite taken out"
    >
      <path
        d="M200 20c48 0 90 18 120 48 8 8 4 20-4 26 12 4 22 14 22 30 0 10-6 18-14 24 26 32 36 64 36 92 0 88-72 140-160 140S40 328 40 240C40 118 112 20 200 20Z"
        fill="#e0a35c"
        stroke="#3b2417"
        strokeWidth="6"
      />
      <path
        d="M316 68c10 10 4 22-4 26 12 4 22 14 22 30 0 10-6 18-14 24"
        fill="#fdf6ec"
        stroke="#3b2417"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="140" cy="130" r="20" fill="#4a2c1a" />
      <circle cx="230" cy="110" r="14" fill="#4a2c1a" />
      <circle cx="180" cy="210" r="24" fill="#4a2c1a" />
      <circle cx="270" cy="200" r="16" fill="#4a2c1a" />
      <circle cx="110" cy="240" r="14" fill="#4a2c1a" />
      <circle cx="230" cy="290" r="18" fill="#4a2c1a" />
      <circle cx="130" cy="320" r="12" fill="#4a2c1a" />
      <circle cx="300" cy="280" r="10" fill="#4a2c1a" />
      <path
        d="M96 172c8-6 18-6 26 0M250 246c8-6 18-6 26 0"
        stroke="#3b2417"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function StampBadge() {
  return (
    <div className="absolute -right-2 -top-6 hidden sm:block md:-right-8">
      <svg viewBox="0 0 120 120" className="spin-slow h-28 w-28" aria-hidden="true">
        <defs>
          <path
            id="badge-circle"
            d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
          />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#f4c866" stroke="#3b2417" strokeWidth="3" />
        <circle cx="60" cy="60" r="30" fill="#fdf6ec" stroke="#3b2417" strokeWidth="2" />
        <text fontSize="12.5" fontWeight="700" fill="#3b2417" letterSpacing="2.5">
          <textPath href="#badge-circle">BAKED FRESH · SMALL BATCH ·</textPath>
        </text>
        <text
          x="60"
          y="66"
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fill="#3b2417"
        >
          EST.
        </text>
      </svg>
    </div>
  );
}

function FlavorCard({ flavor }: { flavor: (typeof FLAVORS)[number] }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border-2 border-cocoa bg-white transition-transform duration-200 hover:-translate-y-1.5">
      <div
        className="relative flex h-44 items-center justify-center"
        style={{ backgroundColor: flavor.base }}
      >
        <svg
          viewBox="0 0 120 120"
          className="h-28 w-28 transition-transform duration-300 group-hover:rotate-6"
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r="52" fill="rgba(253,246,236,0.35)" />
          <circle cx="60" cy="60" r="44" fill={flavor.base} stroke="#3b2417" strokeWidth="4" />
          <circle cx="44" cy="46" r="7" fill={flavor.chips} />
          <circle cx="76" cy="42" r="5" fill={flavor.chips} />
          <circle cx="66" cy="70" r="8" fill={flavor.chips} />
          <circle cx="42" cy="74" r="5" fill={flavor.chips} />
          <circle cx="82" cy="66" r="4" fill={flavor.chips} />
        </svg>
        {flavor.tag && (
          <span className="absolute left-4 top-4 rounded-full border-2 border-cocoa bg-butter px-3 py-1 text-xs font-bold uppercase tracking-wide text-cocoa">
            {flavor.tag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t-2 border-cocoa p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-xl font-semibold">{flavor.name}</h3>
          <span className="font-display text-lg font-semibold text-caramel">
            {flavor.price}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-cocoa-soft">{flavor.description}</p>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b-2 border-cocoa bg-cream/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <CookieMark />
            <span className="font-display text-2xl font-bold tracking-tight">
              Cookie.
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#menu" className="transition-colors hover:text-caramel">
              Menu
            </a>
            <a href="#story" className="transition-colors hover:text-caramel">
              Our story
            </a>
            <a href="#reviews" className="transition-colors hover:text-caramel">
              Reviews
            </a>
          </div>
          <a
            href="#order"
            className="rounded-full border-2 border-cocoa bg-caramel px-5 py-2 text-sm font-bold text-cream shadow-[3px_3px_0_0_var(--cocoa)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_var(--cocoa)]"
          >
            Order a box
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:pt-24">
          <div>
            <p className="mb-4 inline-block rounded-full border-2 border-cocoa bg-cream-deep px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              Fresh out of the oven
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Ridiculously good cookies, baked the{" "}
              <span className="text-caramel">slow way</span>.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cocoa-soft">
              Brown butter. Single-origin chocolate. Dough chilled for 48 hours
              because patience tastes better. Baked to order, shipped warm-ish.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#order"
                className="rounded-full border-2 border-cocoa bg-caramel px-7 py-3.5 font-bold text-cream shadow-[4px_4px_0_0_var(--cocoa)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--cocoa)]"
              >
                Order a box
              </a>
              <a
                href="#menu"
                className="rounded-full border-2 border-cocoa bg-cream px-7 py-3.5 font-bold shadow-[4px_4px_0_0_var(--cocoa)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--cocoa)]"
              >
                See the menu
              </a>
            </div>
          </div>
          <div className="relative flex justify-center">
            <StampBadge />
            <HeroCookie />
          </div>
        </section>

        {/* Ticker */}
        <div
          className="overflow-hidden border-y-2 border-cocoa bg-butter py-3"
          aria-hidden="true"
        >
          <div className="marquee-track flex w-max gap-8">
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map(
              (item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-8 whitespace-nowrap text-sm font-bold uppercase tracking-widest"
                >
                  {item} <span className="text-caramel">✦</span>
                </span>
              )
            )}
          </div>
        </div>

        {/* Menu */}
        <section id="menu" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-caramel">
                The lineup
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Six flavors. Zero misses.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-cocoa-soft">
              Every cookie is scooped by hand and baked the day it ships. Mix
              and match any six for a box.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLAVORS.map((flavor) => (
              <FlavorCard key={flavor.name} flavor={flavor} />
            ))}
          </div>
        </section>

        {/* Story */}
        <section
          id="story"
          className="scroll-mt-24 border-y-2 border-cocoa bg-cocoa text-cream"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-butter">
                Our story
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                It started with one very stubborn recipe.
              </h2>
              <p className="mt-6 leading-relaxed text-cream/80">
                Two hundred and fourteen test batches. That&apos;s how many it
                took to land on a chocolate chip cookie we&apos;d actually brag
                about — brown butter for depth, a two-day chill for chew, and
                sea salt because balance is everything.
              </p>
              <p className="mt-4 leading-relaxed text-cream/80">
                We still bake every batch the same way: small, slow, and never
                before you order. No warehouses, no preservatives, no shortcuts.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6">
              {[
                { stat: "214", label: "Test batches before batch one" },
                { stat: "48h", label: "Every dough is chilled, minimum" },
                { stat: "6", label: "Flavors, perfected one at a time" },
                { stat: "0", label: "Preservatives, ever" },
              ].map(({ stat, label }) => (
                <div
                  key={label}
                  className="rounded-3xl border-2 border-cream/25 bg-cream/5 p-6"
                >
                  <dd className="font-display text-4xl font-bold text-butter">
                    {stat}
                  </dd>
                  <dt className="mt-2 text-sm leading-snug text-cream/70">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <p className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-caramel">
            Word of mouth
          </p>
          <h2 className="text-center font-display text-4xl font-bold tracking-tight sm:text-5xl">
            People have feelings about these.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((review) => (
              <figure
                key={review.name}
                className="flex flex-col justify-between gap-6 rounded-3xl border-2 border-cocoa bg-white p-8"
              >
                <blockquote className="font-display text-lg leading-relaxed">
                  “{review.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <CookieMark size={36} />
                  <div>
                    <div className="font-bold">{review.name}</div>
                    <div className="text-sm text-cocoa-soft">{review.detail}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Order CTA */}
        <section id="order" className="scroll-mt-24 px-6 pb-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border-2 border-cocoa bg-caramel px-6 py-16 text-center text-cream shadow-[8px_8px_0_0_var(--cocoa)] sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Warm cookies are one box away.
            </h2>
            <p className="mx-auto mt-4 max-w-lg leading-relaxed text-cream/90">
              Pick any six flavors, and we&apos;ll bake them the day they ship.
              First box comes with a seventh cookie on the house — consider it a
              handshake.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#menu"
                className="rounded-full border-2 border-cocoa bg-cream px-8 py-4 font-bold text-cocoa shadow-[4px_4px_0_0_var(--cocoa)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--cocoa)]"
              >
                Build your box
              </a>
              <a
                href="#menu"
                className="rounded-full border-2 border-cocoa bg-cocoa px-8 py-4 font-bold text-cream transition-colors hover:bg-chip"
              >
                Gift a box
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-cocoa bg-cream-deep">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <a href="#" className="flex items-center gap-2.5">
            <CookieMark />
            <span className="font-display text-xl font-bold tracking-tight">
              Cookie.
            </span>
          </a>
          <p className="text-sm text-cocoa-soft">
            Baked with patience. © {new Date().getFullYear()} Cookie.
          </p>
          <div className="flex gap-6 text-sm font-medium">
            <a href="#menu" className="transition-colors hover:text-caramel">
              Menu
            </a>
            <a href="#story" className="transition-colors hover:text-caramel">
              Story
            </a>
            <a href="#order" className="transition-colors hover:text-caramel">
              Order
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
