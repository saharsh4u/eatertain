import { NextResponse } from "next/server";
import { recommend } from "@/lib/recommend";
import type { EnergyLevel, PlatformOption, RecommendInput } from "@/lib/types";

const VALID_ENERGY: EnergyLevel[] = ["low", "medium", "high"];
const VALID_PLATFORMS: PlatformOption[] = [
  "YouTube",
  "Netflix",
  "Prime Video",
  "Hulu",
  "Max",
  "Disney+",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendInput;

    if (!body?.foodMode || typeof body.foodMode !== "string") {
      return NextResponse.json(
        { error: "foodMode is required" },
        { status: 400 },
      );
    }

    if (body.energy && !VALID_ENERGY.includes(body.energy)) {
      return NextResponse.json(
        { error: "energy must be one of low|medium|high" },
        { status: 400 },
      );
    }

    if (body.platform && !VALID_PLATFORMS.includes(body.platform)) {
      return NextResponse.json(
        { error: "unsupported platform" },
        { status: 400 },
      );
    }

    const response = recommend(body);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Unknown food mode")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
