"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import foodModesData from "@/data/food-modes.json";
import type {
  EnergyLevel,
  EventType,
  FoodMode,
  PlatformOption,
  RankedItem,
  RecommendInput,
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

const ENERGY_OPTIONS: EnergyLevel[] = ["low", "medium", "high"];

const SAVED_PAIRS_KEY = "eatertain:saved-pairs";
const RECENT_PAIRS_KEY = "eatertain:recent-pairs";

type QuickPresetId =
  | "ten-minutes"
  | "eating-alone"
  | "with-kids"
  | "background-noise";

interface QuickPreset {
  id: QuickPresetId;
  label: string;
  subtitle: string;
}

interface SuggestionContext {
  foodModeSlug: string;
  energy: EnergyLevel;
  platform: "Any" | PlatformOption;
  preset: QuickPresetId | null;
}

interface SavedPair {
  id: string;
  title: string;
  platform: PlatformOption;
  url: string;
  whyThisMatch: string;
  savedAt: string;
  foodModeLabel: string;
  energy: EnergyLevel;
}

interface RecentPairing {
  id: string;
  createdAt: string;
  foodModeLabel: string;
  energy: EnergyLevel;
  heroTitle: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "ten-minutes",
    label: "I have 10 minutes",
    subtitle: "Fast, short picks",
  },
  {
    id: "eating-alone",
    label: "I'm eating alone",
    subtitle: "Calm solo vibe",
  },
  {
    id: "with-kids",
    label: "I'm with kids",
    subtitle: "Family-safe choices",
  },
  {
    id: "background-noise",
    label: "Background noise only",
    subtitle: "Audio-friendly content",
  },
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

function getPresetDefaults(preset: QuickPresetId): Partial<SuggestionContext> {
  switch (preset) {
    case "ten-minutes":
      return {
        foodModeSlug: "snack-break",
        energy: "high",
        platform: "YouTube",
      };
    case "eating-alone":
      return {
        foodModeSlug: "healthy-meal",
        energy: "low",
        platform: "Any",
      };
    case "with-kids":
      return {
        foodModeSlug: "family-dinner",
        energy: "medium",
      };
    case "background-noise":
      return {
        energy: "low",
      };
    default:
      return {};
  }
}

function getPresetConstraints(preset: QuickPresetId | null): Partial<RecommendInput> {
  if (!preset) {
    return {};
  }

  switch (preset) {
    case "ten-minutes":
      return {
        maxDurationMins: 15,
        maxPlotDensity: 2,
        preferredTags: ["short-form", "upbeat", "standup", "sketch"],
      };
    case "eating-alone":
      return {
        maxIntensity: 3,
        preferredTags: ["docu", "educational", "calm", "travel"],
      };
    case "with-kids":
      return {
        maxIntensity: 2,
        maxPlotDensity: 2,
        requiredTags: ["feel-good", "familiar", "episodic"],
        preferredTags: ["feel-good", "familiar", "episodic"],
      };
    case "background-noise":
      return {
        requireAudioFollowable: true,
        requireDropInFriendly: true,
        maxIntensity: 3,
        maxPlotDensity: 2,
        preferredTags: ["dialogue", "cozy", "rewatch"],
      };
    default:
      return {};
  }
}

function readStoredArray<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function HomeOnePage() {
  const [foodModeSlug, setFoodModeSlug] = useState<string>(foodModes[0]?.slug ?? "");
  const [energy, setEnergy] = useState<EnergyLevel>(getDefaultEnergy);
  const [platform, setPlatform] = useState<"Any" | PlatformOption>("Any");
  const [quickPreset, setQuickPreset] = useState<QuickPresetId | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const [savedPairs, setSavedPairs] = useState<SavedPair[]>([]);
  const [recentPairs, setRecentPairs] = useState<RecentPairing[]>([]);
  const [activeContext, setActiveContext] = useState<SuggestionContext | null>(null);

  const activeFoodMode = useMemo(() => {
    const modeSlug = activeContext?.foodModeSlug ?? foodModeSlug;
    return foodModes.find((mode) => mode.slug === modeSlug);
  }, [activeContext, foodModeSlug]);

  const heroPick = useMemo(() => {
    if (!result) return null;
    return result.items.find((item) => item.id === result.heroPickId) ?? result.items[0];
  }, [result]);

  useEffect(() => {
    setSavedPairs(readStoredArray<SavedPair>(SAVED_PAIRS_KEY));
    setRecentPairs(readStoredArray<RecentPairing>(RECENT_PAIRS_KEY));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(SAVED_PAIRS_KEY, JSON.stringify(savedPairs.slice(0, 20)));
  }, [savedPairs]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(RECENT_PAIRS_KEY, JSON.stringify(recentPairs.slice(0, 10)));
  }, [recentPairs]);

  function getCurrentContext(): SuggestionContext {
    return {
      foodModeSlug,
      energy,
      platform,
      preset: quickPreset,
    };
  }

  function buildPayload(context: SuggestionContext, excludeIds: string[]) {
    const presetConstraints = getPresetConstraints(context.preset);

    return {
      foodMode: context.foodModeSlug,
      energy: context.energy,
      platform: context.platform === "Any" ? undefined : context.platform,
      excludeIds,
      ...presetConstraints,
    };
  }

  async function trackEvent(
    eventType: EventType,
    itemId?: string,
    details?: Record<string, string | number | boolean>,
    contextOverride?: SuggestionContext,
  ) {
    try {
      const context = contextOverride ?? activeContext ?? getCurrentContext();
      await fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          foodMode: context.foodModeSlug,
          energy: context.energy,
          platform: context.platform,
          itemId,
          sessionId: getSessionId(),
          details,
        }),
      });
    } catch {
      // Analytics path should not block UX.
    }
  }

  function pushRecentPair(payload: RecommendResult, context: SuggestionContext) {
    const modeLabel = foodModes.find((mode) => mode.slug === context.foodModeSlug)?.label || "Meal";
    const heroTitle = payload.items[0]?.title ?? "Untitled";

    const entry: RecentPairing = {
      id: `${Date.now()}-${heroTitle}`,
      createdAt: new Date().toISOString(),
      foodModeLabel: modeLabel,
      energy: context.energy,
      heroTitle,
    };

    setRecentPairs((current) => [entry, ...current].slice(0, 10));
  }

  async function requestSuggestions(context: SuggestionContext, excludeIds: string[] = []) {
    const mode = foodModes.find((item) => item.slug === context.foodModeSlug);
    if (!mode) {
      setError("Select a meal mode to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setActionMessage("");

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(context, excludeIds)),
      });

      const payload = (await response.json()) as RecommendResult | { error: string };
      if (!response.ok) {
        const message = "error" in payload ? payload.error : "Failed to generate suggestions.";
        throw new Error(message);
      }

      const recommendation = payload as RecommendResult;
      setResult(recommendation);
      setActiveContext(context);
      pushRecentPair(recommendation, context);

      await trackEvent("view-results", undefined, {
        preset: context.preset ?? "none",
      }, context);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to generate picks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestSuggestions(getCurrentContext());
  }

  async function handleRemix() {
    if (!result) return;
    const context = activeContext ?? getCurrentContext();
    await trackEvent("regenerate", undefined, { trigger: "remix" }, context);
    await requestSuggestions(
      context,
      result.items.map((item) => item.id),
    );
  }

  async function handleSurpriseMe() {
    const randomContext: SuggestionContext = {
      foodModeSlug: foodModes[Math.floor(Math.random() * foodModes.length)]?.slug ?? "snack-break",
      energy: ENERGY_OPTIONS[Math.floor(Math.random() * ENERGY_OPTIONS.length)] ?? "medium",
      platform: PLATFORM_OPTIONS[Math.floor(Math.random() * PLATFORM_OPTIONS.length)] ?? "Any",
      preset: null,
    };

    setQuickPreset(null);
    setFoodModeSlug(randomContext.foodModeSlug);
    setEnergy(randomContext.energy);
    setPlatform(randomContext.platform);

    await trackEvent("regenerate", undefined, { trigger: "surprise" }, randomContext);
    await requestSuggestions(randomContext);
  }

  async function handleShare() {
    if (!heroPick || !activeFoodMode) return;

    const context = activeContext ?? getCurrentContext();
    const shareText = `${activeFoodMode.label} + ${prettyEnergy(context.energy)} -> ${heroPick.title} (${heroPick.platform}). ${heroPick.whyThisMatch}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "My Eatertain match",
          text: shareText,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        });
        setActionMessage("Shared");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setActionMessage("Copied to clipboard");
      } else {
        setActionMessage("Sharing unavailable");
      }
      await trackEvent("share", heroPick.id);
    } catch {
      setActionMessage("Share canceled");
    }
  }

  async function handleSaveForLater(item: RankedItem) {
    const context = activeContext ?? getCurrentContext();
    const modeLabel = foodModes.find((mode) => mode.slug === context.foodModeSlug)?.label || "Meal";

    const saved: SavedPair = {
      id: item.id,
      title: item.title,
      platform: item.platform,
      url: item.url,
      whyThisMatch: item.whyThisMatch,
      savedAt: new Date().toISOString(),
      foodModeLabel: modeLabel,
      energy: context.energy,
    };

    setSavedPairs((current) => [saved, ...current.filter((entry) => entry.id !== item.id)].slice(0, 20));
    setActionMessage("Saved for later");
    await trackEvent("save", item.id);
  }

  function applyQuickPreset(preset: QuickPresetId) {
    const defaults = getPresetDefaults(preset);

    setQuickPreset(preset);
    if (defaults.foodModeSlug) setFoodModeSlug(defaults.foodModeSlug);
    if (defaults.energy) setEnergy(defaults.energy);
    if (defaults.platform) setPlatform(defaults.platform);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(255,193,156,0.35),transparent_32%),radial-gradient(circle_at_88%_16%,rgba(250,214,146,0.3),transparent_28%),linear-gradient(180deg,#fffaf2_0%,#fff6e9_52%,#fffaf4_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#ffe3cf] blur-[110px]" />
      <div className="pointer-events-none absolute -right-12 top-12 h-72 w-72 rounded-full bg-[#ffd9b0] blur-[110px]" />

      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[2.2rem] border border-[#e8d8c4] bg-white/85 px-6 py-6 shadow-[0_24px_58px_-34px_rgba(87,60,36,0.28)] backdrop-blur sm:px-9 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#7a6351] sm:text-[13px]">
              Moment-based entertainment picker
            </p>
            <span className="rounded-full border border-[#edd7b4] bg-[#fff5dd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a2f]">
              Cozy mode
            </span>
          </div>

          <h1 className="mt-4 text-center font-display text-[clamp(1.75rem,4.9vw,3.95rem)] leading-[1.02] tracking-tight text-[#2d1f14]">
            Tell us what you&apos;re <span className="font-[var(--font-accent)] text-[#e7682f]">eating</span>.
            <br />
            We pick what to watch.
          </h1>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[#e7d8c7] bg-white/92 p-5 shadow-[0_22px_52px_-34px_rgba(87,60,36,0.26)] sm:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7e6858]">Set your vibe</p>
              {quickPreset ? (
                <button
                  type="button"
                  onClick={() => setQuickPreset(null)}
                  className="rounded-full border border-[#ead8c3] bg-[#fff7ed] px-3 py-1 text-[11px] font-semibold text-[#7e6858] transition hover:bg-[#ffefdc]"
                >
                  Clear preset
                </button>
              ) : null}
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b7564]">Quick presets</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {QUICK_PRESETS.map((preset) => {
                  const selected = preset.id === quickPreset;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyQuickPreset(preset.id)}
                      className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-[#f2c790] bg-[#fff4e6] shadow-[0_10px_24px_-20px_rgba(194,109,40,0.45)]"
                          : "border-[#eadcca] bg-[#fffdf9] hover:border-[#f2cfaa] hover:bg-[#fff8ef]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#3c2b1d]">{preset.label}</p>
                      <p className="mt-0.5 text-xs text-[#7f6a5a]">{preset.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {foodModes.map((mode) => {
                const selected = mode.slug === foodModeSlug;
                return (
                  <button
                    key={mode.slug}
                    type="button"
                    onClick={() => setFoodModeSlug(mode.slug)}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-[#efcc9f] bg-[#fff4e7] shadow-[0_12px_26px_-22px_rgba(194,109,40,0.5)]"
                        : "border-[#eadcca] bg-[#fffdf8] hover:border-[#f0cfaa] hover:bg-[#fff8ef]"
                    }`}
                  >
                    <p className="text-lg leading-none">{mode.emoji}</p>
                    <p className="mt-2 text-sm font-semibold text-[#352418]">{mode.label}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7564]">Energy</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ENERGY_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEnergy(value)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold capitalize transition ${
                      value === energy
                        ? "border-[#efc48f] bg-[#fff3e3] text-[#3c2b1d]"
                        : "border-[#e7d8c8] bg-white text-[#6a5647] hover:border-[#efcc9f]"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7564]">Platform</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPlatform(option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                      option === platform
                        ? "border-[#efc48f] bg-[#fff3e3] text-[#3b2a1d]"
                        : "border-[#e7d8c8] bg-white text-[#6a5647] hover:border-[#efcc9f]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-[linear-gradient(135deg,#ffcf96_0%,#ffc07a_100%)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#3a2819] shadow-[0_16px_34px_-26px_rgba(194,109,40,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Matching..." : "Suggest 3 Picks"}
              </button>
              <button
                type="button"
                onClick={handleSurpriseMe}
                disabled={loading}
                className="rounded-2xl border border-[#f0cfa9] bg-[#fff8ef] px-4 py-3 text-sm font-semibold text-[#5f4836] shadow-[0_14px_30px_-26px_rgba(87,60,36,0.45)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                🎲 Surprise Me
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-[#e7d8c7] bg-[linear-gradient(180deg,#fff8ef_0%,#fff5e8_100%)] p-5 shadow-[0_22px_52px_-34px_rgba(87,60,36,0.26)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#836f5f]">Suggested vibe</p>

            {!result && !loading && (
              <div className="mt-5 space-y-2">
                <p className="text-3xl font-display leading-[1.08] text-[#2d1f14] sm:text-4xl">
                  Meal companion mode: quick, cozy, and context-first.
                </p>
                <p className="text-sm text-[#736152]">
                  Choose a preset or customize preferences, then get three tailored picks instantly.
                </p>
              </div>
            )}

            {loading && (
              <div className="mt-5 space-y-3">
                <div className="h-20 animate-pulse rounded-2xl bg-[#f8ead7]" />
                <div className="h-20 animate-pulse rounded-2xl bg-[#f8ead7]" />
                <div className="h-20 animate-pulse rounded-2xl bg-[#f8ead7]" />
              </div>
            )}

            {result && activeFoodMode && heroPick && activeContext && (
              <div className="mt-5 rounded-2xl border border-[#eadac7] bg-white p-4 shadow-[0_14px_30px_-24px_rgba(87,60,36,0.24)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#866f5d]">Hero pick</p>
                <h2 className="mt-1 text-3xl font-display leading-[1] text-[#2f1f13] sm:text-4xl">
                  {heroPick.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-[#4e3b2d]">
                  {activeFoodMode.emoji} {activeFoodMode.label} • {prettyEnergy(activeContext.energy)}
                </p>
                <p className="mt-1 text-sm text-[#6b5647]">{heroPick.whyThisMatch}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRemix}
                    className="rounded-full border border-[#efcfa9] bg-[#fff6ea] px-3 py-1.5 text-xs font-semibold text-[#5f4836] transition hover:-translate-y-0.5"
                  >
                    Remix picks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveForLater(heroPick)}
                    className="rounded-full border border-[#efcfa9] bg-[#fff6ea] px-3 py-1.5 text-xs font-semibold text-[#5f4836] transition hover:-translate-y-0.5"
                  >
                    Save for later
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-full border border-[#efcfa9] bg-[#fff6ea] px-3 py-1.5 text-xs font-semibold text-[#5f4836] transition hover:-translate-y-0.5"
                  >
                    Share
                  </button>
                </div>
              </div>
            )}

            {actionMessage ? <p className="mt-3 text-xs text-[#7a6555]">{actionMessage}</p> : null}

            {error ? (
              <p className="mt-4 rounded-xl border border-[#ffd2c4] bg-[#ffece7] px-3 py-2 text-xs text-[#8f3d28]">
                {error}
              </p>
            ) : null}
          </section>
        </div>

        {result ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {result.items.map((item, index) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[#e7d9c8] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(87,60,36,0.3)] transition hover:-translate-y-0.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7666]">Pick {index + 1}</p>
                <h3 className="mt-2 text-2xl font-display leading-[1.03] text-[#2f2013]">{item.title}</h3>
                <p className="mt-1 text-sm font-semibold text-[#564234]">
                  {item.platform} • {item.durationMins} min
                </p>
                <p className="mt-1 text-sm text-[#6a5647]">{item.whyThisMatch}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackEvent("open", item.id)}
                    className="rounded-full bg-[linear-gradient(135deg,#ffcf96_0%,#ffc07a_100%)] px-3 py-1.5 text-xs font-semibold text-[#3c2b1d] shadow-[0_10px_22px_-16px_rgba(194,109,40,0.58)]"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleSaveForLater(item)}
                    className="rounded-full border border-[#efcfa9] bg-[#fff6ea] px-3 py-1.5 text-xs font-semibold text-[#5f4836]"
                  >
                    Save for later
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#e7d9c8] bg-white/90 p-4 shadow-[0_16px_36px_-30px_rgba(87,60,36,0.3)]">
            <h3 className="text-lg font-display text-[#2f2013]">Save for later</h3>
            {savedPairs.length === 0 ? (
              <p className="mt-2 text-sm text-[#6a5647]">
                Save picks to build your cozy watchlist for future meals.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {savedPairs.slice(0, 5).map((pair) => (
                  <li
                    key={`${pair.id}-${pair.savedAt}`}
                    className="rounded-2xl border border-[#f0e3d3] bg-[#fffdf8] px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-[#3a2a1d]">{pair.title}</p>
                    <p className="mt-0.5 text-xs text-[#7a6555]">
                      {pair.foodModeLabel} • {prettyEnergy(pair.energy)} • {pair.platform}
                    </p>
                    <a
                      href={pair.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-[#c26d28] hover:underline"
                    >
                      Open saved pick
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-[#e7d9c8] bg-white/90 p-4 shadow-[0_16px_36px_-30px_rgba(87,60,36,0.3)]">
            <h3 className="text-lg font-display text-[#2f2013]">Recently paired meals</h3>
            {recentPairs.length === 0 ? (
              <p className="mt-2 text-sm text-[#6a5647]">
                Your recent pairings will show up here once you generate your first match.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {recentPairs.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-[#f0e3d3] bg-[#fffdf8] px-3 py-2 text-sm text-[#4a392c]"
                  >
                    <p className="font-semibold text-[#3a2a1d]">{entry.heroTitle}</p>
                    <p className="mt-0.5 text-xs text-[#7a6555]">
                      {entry.foodModeLabel} • {prettyEnergy(entry.energy)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
