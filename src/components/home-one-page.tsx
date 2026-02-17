"use client";

import { FormEvent, useMemo, useState } from "react";
import foodModesData from "@/data/food-modes.json";
import type {
  EnergyLevel,
  EventType,
  FoodMode,
  PlatformOption,
  RecommendResult,
} from "@/lib/types";

const foodModes = foodModesData as FoodMode[];

const PLATFORM_OPTIONS: Array<"Any" | PlatformOption> = [
  "Any",
  "YouTube",
  "Netflix",
  "Prime Video",
  "Hulu",
  "Max",
  "Disney+",
];

function getDefaultEnergy(): EnergyLevel {
  if (typeof window === "undefined") {
    return "medium";
  }

  const hour = new Date().getHours();
  if (hour < 10) return "low";
  if (hour < 18) return "medium";
  return "high";
}

function getSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const key = "eatertain:sessionId";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, next);
  return next;
}

function prettyEnergy(energy: EnergyLevel) {
  return `${energy.slice(0, 1).toUpperCase()}${energy.slice(1)} energy`;
}

export function HomeOnePage() {
  const [foodModeSlug, setFoodModeSlug] = useState<string>(foodModes[0]?.slug ?? "");
  const [energy, setEnergy] = useState<EnergyLevel>(getDefaultEnergy);
  const [platform, setPlatform] = useState<"Any" | PlatformOption>("Any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  const selectedFoodMode = useMemo(
    () => foodModes.find((mode) => mode.slug === foodModeSlug),
    [foodModeSlug],
  );

  const heroPick = useMemo(() => {
    if (!result) return null;
    return result.items.find((item) => item.id === result.heroPickId) ?? result.items[0];
  }, [result]);

  async function trackEvent(eventType: EventType, itemId?: string) {
    try {
      await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          foodMode: foodModeSlug,
          energy,
          platform,
          itemId,
          sessionId: getSessionId(),
        }),
      });
    } catch {
      // Analytics path should not block UX.
    }
  }

  async function requestSuggestions(excludeIds: string[] = []) {
    if (!selectedFoodMode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodMode: selectedFoodMode.slug,
          energy,
          platform: platform === "Any" ? undefined : platform,
          excludeIds,
        }),
      });

      const payload = (await response.json()) as RecommendResult | { error: string };
      if (!response.ok) {
        const message = "error" in payload ? payload.error : "Failed to generate suggestions.";
        throw new Error(message);
      }

      setResult(payload as RecommendResult);
      await trackEvent("view-results");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to generate picks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestSuggestions();
  }

  async function handleRemix() {
    if (!result) return;
    await trackEvent("regenerate");
    await requestSuggestions(result.items.map((item) => item.id));
  }

  async function handleShare() {
    if (!heroPick || !selectedFoodMode) return;

    const shareText = `${selectedFoodMode.label} + ${prettyEnergy(energy)} -> ${heroPick.title} (${heroPick.platform}). ${heroPick.whyThisMatch}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "My Eatertain match",
          text: shareText,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        });
        setShareMessage("Shared");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setShareMessage("Copied");
      } else {
        setShareMessage("Sharing unavailable");
      }
      await trackEvent("share", heroPick.id);
    } catch {
      setShareMessage("Share canceled");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#fbda50]/75 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-56 h-60 w-60 rounded-full bg-[#d42213]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#a7e396]/45 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <section className="relative rounded-[2rem] border-[3px] border-[#220000] bg-[#fef9e3]/90 px-5 py-6 shadow-[10px_10px_0_0_#220000] sm:px-8 sm:py-8">
          <div className="absolute -right-3 -top-3 rotate-6 rounded-full border-[3px] border-[#220000] bg-[#fbda50] px-4 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#220000]">
            One page
          </div>

          <p className="text-center text-[11px] font-bold uppercase tracking-[0.35em] text-[#220000]/75 sm:text-[14px]">
            Moment-based entertainment picker
          </p>

          <h1 className="mt-4 text-center font-display text-[clamp(2.8rem,11vw,8.2rem)] leading-[0.9] tracking-tight text-[#220000]">
            Tell us what
            <br />
            you&apos;re <span className="font-[var(--font-accent)] text-[#d42213]">eating</span>.
            <br />
            We pick what to watch.
          </h1>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border-[3px] border-[#220000] bg-white/90 p-5 shadow-[10px_10px_0_0_#220000] sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#220000]/70">
              Set your vibe
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {foodModes.map((mode) => {
                const selected = mode.slug === foodModeSlug;
                return (
                  <button
                    key={mode.slug}
                    type="button"
                    onClick={() => setFoodModeSlug(mode.slug)}
                    className={`rounded-2xl border-[2px] px-3 py-3 text-left transition ${
                      selected
                        ? "border-[#220000] bg-[#fbda50] shadow-[4px_4px_0_0_#220000]"
                        : "border-[#220000]/30 bg-[#fef9e3] hover:border-[#220000] hover:bg-white"
                    }`}
                  >
                    <p className="text-xl leading-none">{mode.emoji}</p>
                    <p className="mt-2 text-sm font-bold text-[#220000]">{mode.label}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#220000]/70">Energy</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as EnergyLevel[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEnergy(value)}
                    className={`rounded-full border-[2px] px-3 py-2 text-sm font-bold capitalize transition ${
                      value === energy
                        ? "border-[#220000] bg-[#d42213] text-white shadow-[3px_3px_0_0_#220000]"
                        : "border-[#220000]/35 bg-white text-[#220000] hover:border-[#220000]"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#220000]/70">Platform</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPlatform(option)}
                    className={`rounded-full border-[2px] px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                      option === platform
                        ? "border-[#220000] bg-[#a7e396] text-[#220000] shadow-[3px_3px_0_0_#220000]"
                        : "border-[#220000]/30 bg-white text-[#220000] hover:border-[#220000]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-2xl border-[3px] border-[#220000] bg-[#fbda50] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#220000] shadow-[6px_6px_0_0_#220000] transition hover:translate-y-[1px] hover:shadow-[4px_4px_0_0_#220000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Matching..." : "Suggest 3 Picks"}
            </button>
          </form>

          <section className="rounded-[2rem] border-[3px] border-[#220000] bg-[#220000] p-5 text-[#fef9e3] shadow-[10px_10px_0_0_#220000] sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#fef9e3]/75">Suggested vibe</p>

            {!result && !loading && (
              <div className="mt-6 space-y-3">
                <p className="text-3xl font-display leading-[1.02] sm:text-4xl">
                  Pick your meal mood, then we&apos;ll drop three instant matches.
                </p>
                <p className="text-sm text-[#fef9e3]/85">
                  This page is the full experience: title, preferences, and recommendations in one flow.
                </p>
              </div>
            )}

            {loading && (
              <div className="mt-6 space-y-3">
                <div className="h-20 animate-pulse rounded-2xl bg-white/15" />
                <div className="h-20 animate-pulse rounded-2xl bg-white/15" />
                <div className="h-20 animate-pulse rounded-2xl bg-white/15" />
              </div>
            )}

            {result && selectedFoodMode && heroPick && (
              <div className="mt-5 rounded-2xl border-[2px] border-[#fef9e3] bg-[#fef9e3] p-4 text-[#220000]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#220000]/70">
                  Hero pick
                </p>
                <h2 className="mt-2 text-3xl font-display leading-[0.95] sm:text-4xl">{heroPick.title}</h2>
                <p className="mt-2 text-sm font-semibold">
                  {selectedFoodMode.emoji} {selectedFoodMode.label} • {prettyEnergy(energy)}
                </p>
                <p className="mt-1 text-sm">{heroPick.whyThisMatch}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRemix}
                    className="rounded-full border-[2px] border-[#220000] bg-[#fbda50] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#220000] transition hover:-translate-y-[1px]"
                  >
                    Remix picks
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-full border-[2px] border-[#220000] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#220000] transition hover:-translate-y-[1px]"
                  >
                    Share
                  </button>
                  {shareMessage ? (
                    <span className="self-center text-xs font-semibold text-[#220000]/70">{shareMessage}</span>
                  ) : null}
                </div>
              </div>
            )}

            {error ? (
              <p className="mt-4 rounded-xl border-[2px] border-[#ff8562] bg-[#ff8562]/15 px-3 py-2 text-xs text-[#fef9e3]">
                {error}
              </p>
            ) : null}
          </section>
        </div>

        {result ? (
          <section className="mt-7 grid gap-4 md:grid-cols-3">
            {result.items.map((item, index) => (
              <article
                key={item.id}
                className="rounded-[1.4rem] border-[3px] border-[#220000] bg-[#fef9e3] p-4 text-[#220000] shadow-[8px_8px_0_0_#220000]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#220000]/65">
                  Pick {index + 1}
                </p>
                <h3 className="mt-2 text-2xl font-display leading-[1]">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold">
                  {item.platform} • {item.durationMins} min
                </p>
                <p className="mt-1 text-sm">{item.whyThisMatch}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent("open", item.id)}
                  className="mt-4 inline-block rounded-full border-[2px] border-[#220000] bg-[#d42213] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white"
                >
                  Open
                </a>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
