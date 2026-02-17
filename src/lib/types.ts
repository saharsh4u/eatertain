export type EnergyLevel = "low" | "medium" | "high";

export type PlatformOption =
  | "YouTube"
  | "Netflix"
  | "Prime Video"
  | "Hulu"
  | "Max"
  | "Disney+";

export interface DurationWindow {
  min: number;
  max: number;
}

export interface FoodModeDefaults {
  energy: EnergyLevel;
  comfort: number;
  chaos: number;
}

export interface FoodMode {
  slug: string;
  label: string;
  emoji: string;
  defaults: FoodModeDefaults;
  durationWindow: DurationWindow;
  tagBoosts: string[];
  tagPenalties: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  platform: PlatformOption;
  url: string;
  durationMins: number;
  tags: string[];
  plotDensity: number;
  intensity: number;
  audioFollowable: boolean;
  dropInFriendly: boolean;
  familiarityScore: number;
  vibeLine: string;
}

export interface RankedItem extends ContentItem {
  score: number;
  whyThisMatch: string;
}

export interface RecommendInput {
  foodMode: string;
  energy?: EnergyLevel;
  platform?: PlatformOption;
  locale?: string;
  excludeIds?: string[];
}

export interface RecommendResult {
  items: RankedItem[];
  rationale: string;
  heroPickId: string;
  generatedAt: string;
}

export type EventType =
  | "open"
  | "like"
  | "dislike"
  | "share"
  | "regenerate"
  | "view-results";

export interface EventPayload {
  eventType: EventType;
  foodMode?: string;
  energy?: EnergyLevel;
  platform?: PlatformOption | "Any";
  itemId?: string;
  sessionId?: string;
  details?: Record<string, string | number | boolean>;
}
