import contentItemsData from "@/data/content-items.json";
import foodModesData from "@/data/food-modes.json";
import type {
  ContentItem,
  EnergyLevel,
  FoodMode,
  RankedItem,
  RecommendInput,
  RecommendResult,
} from "@/lib/types";

const contentItems = contentItemsData as ContentItem[];
const foodModes = foodModesData as FoodMode[];

const ENERGY_TO_TAGS: Record<EnergyLevel, string[]> = {
  low: ["cozy", "calm", "familiar", "rewatch", "feel-good"],
  medium: ["dialogue", "episodic", "food", "travel", "light-comedy"],
  high: ["upbeat", "sketch", "standup", "high-chaos", "short-form"],
};

const DEFAULT_DURATION_WINDOW = { min: 10, max: 35 };

export function getFoodModes(): FoodMode[] {
  return foodModes;
}

export function recommend(input: RecommendInput): RecommendResult {
  const foodMode = foodModes.find((mode) => mode.slug === input.foodMode);

  if (!foodMode) {
    throw new Error("Unknown food mode");
  }

  const energy = input.energy ?? foodMode.defaults.energy;
  const excludeIds = new Set(input.excludeIds ?? []);

  let candidates = filterCandidates({
    platform: input.platform,
    minDuration: foodMode.durationWindow.min,
    maxDuration: foodMode.durationWindow.max,
    excludeIds,
  });

  if (candidates.length < 3) {
    candidates = filterCandidates({
      platform: undefined,
      minDuration: foodMode.durationWindow.min - 4,
      maxDuration: foodMode.durationWindow.max + 10,
      excludeIds,
    });
  }

  if (candidates.length < 3) {
    candidates = filterCandidates({
      platform: undefined,
      minDuration: DEFAULT_DURATION_WINDOW.min,
      maxDuration: DEFAULT_DURATION_WINDOW.max + 8,
      excludeIds: new Set<string>(),
    });
  }

  const ranked = candidates
    .map((item) => rankItem(item, foodMode, energy))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (ranked.length < 3) {
    throw new Error("Not enough content items to recommend");
  }

  const heroPickId = ranked[0].id;

  return {
    items: ranked,
    rationale: buildRationale(foodMode, energy),
    heroPickId,
    generatedAt: new Date().toISOString(),
  };
}

function filterCandidates({
  platform,
  minDuration,
  maxDuration,
  excludeIds,
}: {
  platform?: string;
  minDuration: number;
  maxDuration: number;
  excludeIds: Set<string>;
}) {
  return contentItems.filter((item) => {
    if (platform && item.platform !== platform) {
      return false;
    }

    if (item.durationMins < minDuration || item.durationMins > maxDuration) {
      return false;
    }

    if (excludeIds.has(item.id)) {
      return false;
    }

    return true;
  });
}

function rankItem(item: ContentItem, foodMode: FoodMode, energy: EnergyLevel): RankedItem {
  const boostSet = new Set(foodMode.tagBoosts);
  const penaltySet = new Set(foodMode.tagPenalties);
  const energyTags = new Set(ENERGY_TO_TAGS[energy]);

  let score = 50;

  const durationCenter = (foodMode.durationWindow.min + foodMode.durationWindow.max) / 2;
  score -= Math.abs(item.durationMins - durationCenter) * 1.1;

  let modeTagMatches = 0;
  for (const tag of item.tags) {
    if (boostSet.has(tag)) {
      score += 8;
      modeTagMatches += 1;
    }

    if (penaltySet.has(tag)) {
      score -= 10;
    }

    if (energyTags.has(tag)) {
      score += 4;
    }
  }

  score -= item.plotDensity * 4.5;
  score -= item.intensity > 3 ? item.intensity * 4 : item.intensity * 2;

  if (item.audioFollowable) {
    score += 8;
  } else {
    score -= 7;
  }

  if (item.dropInFriendly) {
    score += 6;
  } else {
    score -= 5;
  }

  score += item.familiarityScore * foodMode.defaults.comfort;
  score += (foodMode.defaults.chaos - 0.5) * (item.tags.includes("high-chaos") ? 6 : -2);

  if (energy === "low" && item.intensity >= 4) {
    score -= 12;
  }

  if (energy === "high" && item.tags.includes("short-form")) {
    score += 5;
  }

  score += Math.random() * 3;

  return {
    ...item,
    score: Number(score.toFixed(2)),
    whyThisMatch: buildWhyMatch(item, foodMode, energy, modeTagMatches),
  };
}

function buildWhyMatch(
  item: ContentItem,
  foodMode: FoodMode,
  energy: EnergyLevel,
  modeTagMatches: number,
): string {
  const reasons: string[] = [];

  if (item.durationMins <= 20) {
    reasons.push("fits a short meal window");
  }

  if (item.audioFollowable) {
    reasons.push("easy to follow while eating");
  }

  if (item.plotDensity <= 2) {
    reasons.push("low plot density");
  }

  if (modeTagMatches > 0) {
    reasons.push(`aligned with ${foodMode.label.toLowerCase()} vibe`);
  }

  if (reasons.length < 2) {
    reasons.push(`${energy} energy pacing`);
  }

  return reasons.slice(0, 2).join(" • ");
}

function buildRationale(foodMode: FoodMode, energy: EnergyLevel): string {
  const energyLabel = energy.charAt(0).toUpperCase() + energy.slice(1);
  return `${foodMode.label} + ${energyLabel} energy: zero-scroll picks optimized for mealtime attention.`;
}
