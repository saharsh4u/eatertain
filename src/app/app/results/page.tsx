import Link from "next/link";
import { Suspense } from "react";
import { ResultsClient } from "@/components/results-client";

export default function ResultsPage() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-stone-700">
            EATERTAIN
          </Link>
          <Link
            href="/app"
            className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-600 transition hover:border-stone-500"
          >
            Change meal mode
          </Link>
        </header>

        <Suspense
          fallback={
            <div className="rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
              Building your picks...
            </div>
          }
        >
          <ResultsClient />
        </Suspense>
      </div>
    </main>
  );
}
