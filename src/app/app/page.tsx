import Link from "next/link";
import foodModesData from "@/data/food-modes.json";
import { PickerClient } from "@/components/picker-client";
import type { FoodMode } from "@/lib/types";

const foodModes = foodModesData as FoodMode[];

export default function PickerPage() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-stone-700">
            EATERTAIN
          </Link>
          <p className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-600">
            3-tap flow
          </p>
        </header>

        <section className="mb-7 rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-[0_24px_48px_-38px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Eatertain picker</p>
          <h1 className="mt-2 text-4xl font-black leading-[0.98] text-stone-900 sm:text-5xl">
            What are you eating right now?
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-stone-600">
            Choose your food mode, adjust energy, and get three mealtime-perfect picks with rationale.
          </p>
        </section>

        <PickerClient foodModes={foodModes} />
      </div>
    </main>
  );
}
