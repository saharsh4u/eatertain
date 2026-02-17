"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import foodModesData from "@/data/food-modes.json";
import type { EnergyLevel, EventType, FoodMode, RankedItem, RecommendResult } from "@/lib/types";

const foodModes = foodModesData as FoodMode[];

type Reaction = "like" | "dislike";

function energyLabel(energy: EnergyLevel) {
  return energy.charAt(0).toUpperCase() + energy.slice(1);
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = localStorage.getItem("eatertain:sessionId");
  if (existing) {
    return existing;
  }

  const next =
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`) || "session-local";

  localStorage.setItem("eatertain:sessionId", next);
  return next;
}

export function ResultsClient() {
  const params = useSearchParams();
  const router = useRouter();

  const foodMode = params.get("foodMode") || "";
  const energy = (params.get("energy") as EnergyLevel | null) || "medium";
  const platform = params.get("platform") || undefined;

  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [shareMessage, setShareMessage] = useState<string>("");
  const [showShareCta, setShowShareCta] = useState(false);

  const selectedFoodMode = useMemo(
    () => foodModes.find((mode) => mode.slug === foodMode),
    [foodMode],
  );

  const heroPick = useMemo(() => {
    if (!result) {
      return null;
    }

    return result.items.find((item) => item.id === result.heroPickId) || result.items[0] || null;
  }, [result]);

  const fireEvent = useCallback(
    async (eventType: EventType, itemId?: string, details?: Record<string, string | number | boolean>) => {
      try {
        await fetch("/api/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventType,
            foodMode,
            energy,
            platform: platform ?? "Any",
            itemId,
            sessionId: getOrCreateSessionId(),
            details,
          }),
        });
      } catch {
        // Non-blocking analytics path.
      }
    },
    [energy, foodMode, platform],
  );

  const fetchRecommendations = useCallback(
    async (excludeIds: string[] = []) => {
      if (!foodMode) {
        router.replace("/app");
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const response = await fetch("/api/recommend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            foodMode,
            energy,
            platform,
            excludeIds,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Could not fetch recommendations");
        }

        const payload = (await response.json()) as RecommendResult;
        setResult(payload);
        setShowShareCta(false);

        if (typeof window !== "undefined") {
          localStorage.setItem("eatertain:lastResult", JSON.stringify(payload));
        }

        await fireEvent("view-results", undefined, { generatedAt: payload.generatedAt });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [energy, fireEvent, foodMode, platform, router],
  );

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowShareCta(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [result]);

  async function handleRegenerate() {
    if (!result) {
      return;
    }

    setIsRegenerating(true);
    await fireEvent("regenerate");
    await fetchRecommendations(result.items.map((item) => item.id));
    setIsRegenerating(false);
  }

  async function handleReaction(item: RankedItem, reaction: Reaction) {
    setReactions((current) => ({
      ...current,
      [item.id]: reaction,
    }));
    await fireEvent(reaction, item.id);
  }

  async function handleShare() {
    if (!heroPick || !selectedFoodMode) {
      return;
    }

    const text = `${selectedFoodMode.label} + ${energyLabel(energy)} energy -> ${heroPick.title}. ${heroPick.whyThisMatch}. What did you get on Eatertain?`;
    const sharePayload = {
      title: "My Eatertain pick",
      text,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(sharePayload);
        setShareMessage("Shared successfully.");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${sharePayload.url}`);
        setShareMessage("Share text copied to clipboard.");
      } else {
        setShareMessage("Sharing is not supported in this browser.");
      }

      await fireEvent("share", heroPick.id);
    } catch {
      setShareMessage("Share canceled.");
    }
  }

  if (!foodMode) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Missing meal context. <Link href="/app" className="underline">Go back to picker</Link>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-stone-200/70 bg-white/90 p-5 shadow-[0_22px_45px_-35px_rgba(0,0,0,0.4)] sm:p-6">
        <p className="text-xs uppercase tracking-[0.26em] text-stone-500">Matched context</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">
          {selectedFoodMode?.emoji} {selectedFoodMode?.label} + {energyLabel(energy)} energy
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {result?.rationale || "Ranking short-list picks for your meal..."}
        </p>
      </header>

      {loading && (
        <div className="grid gap-4">
          {[0, 1, 2].map((value) => (
            <div
              key={value}
              className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-stone-100"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && result && (
        <>
          <section className="grid gap-4">
            {result.items.map((item, index) => (
              <article
                key={item.id}
                className="rounded-3xl border border-stone-200/70 bg-white/95 p-5 shadow-[0_22px_45px_-35px_rgba(0,0,0,0.4)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Pick #{index + 1}</p>
                    <h2 className="mt-1 text-xl font-semibold text-stone-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-stone-500">
                      {item.platform} • {item.durationMins} min
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Score {item.score}
                  </div>
                </div>

                <p className="mt-3 text-sm text-stone-700">{item.whyThisMatch}</p>
                <p className="mt-1 text-sm text-stone-500">{item.vibeLine}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => fireEvent("open", item.id)}
                    className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleReaction(item, "like")}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      reactions[item.id] === "like"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-emerald-400"
                    }`}
                  >
                    Like
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(item, "dislike")}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      reactions[item.id] === "dislike"
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-rose-400"
                    }`}
                  >
                    Dislike
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-stone-200/70 bg-gradient-to-br from-[#f1ede5] via-white to-[#fbf8f1] p-5 shadow-[0_22px_45px_-35px_rgba(0,0,0,0.4)] sm:p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Share card</p>
            <div className="mt-3 rounded-2xl border border-stone-200/80 bg-white p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Eatertain card</p>
              <h3 className="mt-2 text-2xl font-semibold text-stone-900">
                {selectedFoodMode?.emoji} {selectedFoodMode?.label}
              </h3>
              <p className="mt-1 text-sm text-stone-600">{energyLabel(energy)} energy match</p>
              <p className="mt-4 text-lg text-stone-900">{heroPick?.title}</p>
              <p className="mt-1 text-sm text-stone-600">{heroPick?.whyThisMatch}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-stone-400">Eatertain.app</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  showShareCta
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-stone-200 text-stone-500"
                }`}
                disabled={!showShareCta}
              >
                {showShareCta ? "Share this card" : "Share unlocks in 5s"}
              </button>
              {shareMessage ? <span className="text-xs text-stone-500">{shareMessage}</span> : null}
            </div>
          </section>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-medium text-stone-800 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRegenerating ? "Regenerating..." : "Regenerate 3 picks"}
          </button>
        </>
      )}
    </div>
  );
}
