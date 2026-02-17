import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(120deg,#ead8ca_0%,#f0e6dd_45%,#f6f2ea_100%)] px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
      <Link href="/app" aria-label="Open Eatertain picker" className="mx-auto block max-w-6xl">
        <p className="text-center text-[14px] uppercase tracking-[0.38em] text-stone-600 sm:text-[18px]">
          Moment-based entertainment picker
        </p>

        <h1 className="mt-8 text-left font-display text-[82px] leading-[0.95] font-black tracking-[-0.02em] text-[#141310] sm:mt-10 sm:text-[118px] md:text-[138px] lg:text-[154px]">
          Tell us what
          <br />
          you&apos;re{" "}
          <span className="font-[var(--font-accent)] text-[#ff6b00]">eating</span>.
          <br />
          We pick what to
          <br />
          watch.
        </h1>
      </Link>
    </main>
  );
}
