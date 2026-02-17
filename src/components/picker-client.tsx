"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EnergyLevel, FoodMode, PlatformOption } from "@/lib/types";

const PLATFORM_OPTIONS: Array<"Any" | PlatformOption> = [
  "Any",
  "YouTube",
  "Netflix",
  "Prime Video",
  "Hulu",
  "Max",
  "Disney+",
];

interface PickerClientProps {
  foodModes: FoodMode[];
}

function isEnergyLevel(value: string | null): value is EnergyLevel {
  return value === "low" || value === "medium" || value === "high";
}

function getTimeDefaultEnergy(): EnergyLevel {
  if (typeof window === "undefined") {
    return "medium";
  }

  const hour = new Date().getHours();

  if (hour < 10) {
    return "low";
  }

  if (hour < 16) {
    return "medium";
  }

  if (hour < 22) {
    return "high";
  }

  return "low";
}

function getStoredString(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function persistValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(key, value);
}

function getInitialFoodMode(foodModes: FoodMode[]) {
  const savedFoodMode = getStoredString("eatertain:lastFoodMode");

  if (savedFoodMode && foodModes.some((mode) => mode.slug === savedFoodMode)) {
    return savedFoodMode;
  }

  return foodModes[0]?.slug;
}

function getInitialEnergy() {
  const savedEnergy = getStoredString("eatertain:lastEnergy");
  return isEnergyLevel(savedEnergy) ? savedEnergy : getTimeDefaultEnergy();
}

function getInitialPlatform() {
  const savedPlatform = getStoredString("eatertain:lastPlatform") as
    | "Any"
    | PlatformOption
    | null;
  return savedPlatform ?? "Any";
}

export function PickerClient({ foodModes }: PickerClientProps) {
  const router = useRouter();

  const firstFoodMode = foodModes[0];
  const [foodMode, setFoodMode] = useState(() => getInitialFoodMode(foodModes));
  const [energy, setEnergy] = useState<EnergyLevel>(getInitialEnergy);
  const [platform, setPlatform] = useState<"Any" | PlatformOption>(getInitialPlatform);

  const selectedFoodMode = useMemo(
    () => foodModes.find((mode) => mode.slug === foodMode) || firstFoodMode,
    [firstFoodMode, foodMode, foodModes],
  );

  const canSubmit = Boolean(selectedFoodMode);

  function handleFoodModeSelect(mode: FoodMode) {
    setFoodMode(mode.slug);
    persistValue("eatertain:lastFoodMode", mode.slug);
  }

  function handleEnergySelect(nextEnergy: EnergyLevel) {
    setEnergy(nextEnergy);
    persistValue("eatertain:lastEnergy", nextEnergy);
  }

  function handlePlatformSelect(nextPlatform: "Any" | PlatformOption) {
    setPlatform(nextPlatform);
    persistValue("eatertain:lastPlatform", nextPlatform);
  }

  function handleSubmit() {
    if (!selectedFoodMode) {
      return;
    }

    const params = new URLSearchParams({
      foodMode: selectedFoodMode.slug,
      energy,
    });

    if (platform !== "Any") {
      params.set("platform", platform);
    }

    router.push(`/app/results?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-stone-200/70 bg-white/90 p-5 shadow-[0_22px_45px_-35px_rgba(0,0,0,0.4)] backdrop-blur sm:p-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Step 1</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">Pick your food mode</h2>
          </div>
          <p className="text-xs text-stone-500">2 taps left</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {foodModes.map((mode) => {
            const selected = mode.slug === selectedFoodMode?.slug;
            return (
              <button
                key={mode.slug}
                type="button"
                onClick={() => handleFoodModeSelect(mode)}
                className={`group rounded-2xl border px-3 py-4 text-left transition ${
                  selected
                    ? "border-orange-500 bg-orange-50 shadow-[0_8px_28px_-16px_rgba(251,146,60,0.7)]"
                    : "border-stone-200 bg-stone-50 hover:border-orange-300 hover:bg-orange-50/40"
                }`}
              >
                <p className="text-2xl leading-none">{mode.emoji}</p>
                <p className="mt-2 text-sm font-medium text-stone-900">{mode.label}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {mode.durationWindow.min}-{mode.durationWindow.max} min
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/70 bg-white/90 p-5 shadow-[0_22px_45px_-35px_rgba(0,0,0,0.4)] backdrop-blur sm:p-7">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Step 2</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">Set your mealtime energy</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["low", "medium", "high"] as EnergyLevel[]).map((value) => {
            const selected = value === energy;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleEnergySelect(value)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium capitalize transition ${
                  selected
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-stone-500">
          Auto-default is based on time of day, but you can override anytime.
        </p>
      </section>

      <section className="rounded-3xl border border-stone-200/70 bg-white/90 p-5 shadow-[0_22px_45px_-35px_rgba(0,0,0,0.4)] backdrop-blur sm:p-7">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Optional</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">Platform filter</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((option) => {
            const selected = option === platform;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handlePlatformSelect(option)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selected
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-emerald-400"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-stone-900 px-5 py-4 text-sm font-semibold tracking-wide text-white shadow-[0_16px_38px_-20px_rgba(0,0,0,0.7)] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        Get My 3 Picks
      </button>
    </div>
  );
}
