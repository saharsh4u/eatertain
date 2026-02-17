import { NextResponse } from "next/server";
import { getEventSummary, recordEvent } from "@/lib/event-store";
import type { EventPayload } from "@/lib/types";

const VALID_EVENT_TYPES = new Set([
  "open",
  "like",
  "dislike",
  "share",
  "save",
  "regenerate",
  "view-results",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventPayload;

    if (!body?.eventType || !VALID_EVENT_TYPES.has(body.eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    const event = recordEvent(body);
    return NextResponse.json({ ok: true, event }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ summary: getEventSummary() });
}
