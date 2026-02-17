import { beforeEach, describe, expect, it, vi } from "vitest";
import { recommend } from "@/lib/recommend";

describe("recommend", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);
  });

  it("returns exactly 3 unique picks", () => {
    const response = recommend({
      foodMode: "comfort-meal",
      energy: "low",
    });

    expect(response.items).toHaveLength(3);

    const uniqueIds = new Set(response.items.map((item) => item.id));
    expect(uniqueIds.size).toBe(3);
  });

  it("honors platform filtering", () => {
    const response = recommend({
      foodMode: "snack-break",
      energy: "high",
      platform: "YouTube",
    });

    expect(response.items.every((item) => item.platform === "YouTube")).toBe(true);
  });

  it("penalizes high intensity for low energy comfort meals", () => {
    const response = recommend({
      foodMode: "comfort-meal",
      energy: "low",
    });

    expect(response.items.every((item) => item.intensity <= 3)).toBe(true);
  });

  it("throws for unknown food mode", () => {
    expect(() => {
      recommend({
        foodMode: "unknown-mode",
      });
    }).toThrow("Unknown food mode");
  });
});
