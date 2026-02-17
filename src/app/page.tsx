import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(252,118,67,0.24),transparent_68%)]" />
      <div className="pointer-events-none absolute -right-28 top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(16,15,10,0.08),transparent_70%)]" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between rounded-full border border-stone-200/70 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-sm font-semibold tracking-[0.18em] text-stone-800">EATERTAIN</p>
          <Link
            href="/app"
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black"
          >
            Try live demo
          </Link>
        </header>

        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Moment-based entertainment picker</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Tell us what
              <br />
              you&apos;re <span className="italic text-orange-500">eating</span>.
              <br />
              We pick what to <span className="italic">watch</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-stone-600">
              Zero scrolling. Three perfect picks. Eatertain maps food mode + energy into instant,
              mealtime-safe recommendations.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black"
              >
                Get my 3 picks
              </Link>
              <a
                href="#waitlist"
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-700 transition hover:border-stone-500"
              >
                Join waitlist
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Speed</p>
                <p className="mt-2 text-sm font-medium text-stone-800">Under 10s to first pick</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Flow</p>
                <p className="mt-2 text-sm font-medium text-stone-800">3 taps end-to-end</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Output</p>
                <p className="mt-2 text-sm font-medium text-stone-800">Share-ready hero card</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white/95 p-5 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.45)]">
            <div className="rounded-2xl bg-[linear-gradient(140deg,#fbf8f1_0%,#f4eee2_48%,#fff_100%)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Demo preview</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                Comfort meal + Low energy
              </h2>
              <p className="mt-2 text-sm text-stone-600">light comedy, familiar characters, easy audio</p>

              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white/85 p-4 text-sm text-stone-500">
                <p className="font-medium text-stone-800">Demo GIF placeholder</p>
                <p className="mt-1">Drop your product demo loop here before launch.</p>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["The Office", "Netflix", "22 min"],
                  ["Good Mythical Morning", "YouTube", "16 min"],
                  ["Bluey", "Disney+", "10 min"],
                ].map(([title, platform, duration]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">{title}</p>
                      <p className="text-xs text-stone-500">{platform}</p>
                    </div>
                    <span className="text-xs text-stone-500">{duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="waitlist" className="mt-12 rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-[0_24px_48px_-38px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Waitlist</p>
              <h3 className="mt-2 text-3xl font-bold text-stone-900">Get launch updates + invite drops</h3>
              <p className="mt-2 text-sm text-stone-600">
                Early members unlock extra food modes and seasonal themes first.
              </p>
            </div>

            <form className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <label htmlFor="waitlist-email" className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
              />
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              >
                Join waitlist
              </button>
              <p className="mt-3 text-xs text-stone-500">Referral queue: 284 members</p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
