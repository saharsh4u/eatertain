import type { EventPayload } from "@/lib/types";

interface StoredEvent extends EventPayload {
  createdAt: string;
}

const MAX_EVENTS = 3000;
const eventStore: StoredEvent[] = [];

export function recordEvent(payload: EventPayload): StoredEvent {
  const event = {
    ...payload,
    createdAt: new Date().toISOString(),
  };

  eventStore.push(event);

  if (eventStore.length > MAX_EVENTS) {
    eventStore.shift();
  }

  return event;
}

export function getEventSummary() {
  const byType: Record<string, number> = {};
  const byFoodMode: Record<string, number> = {};

  for (const event of eventStore) {
    byType[event.eventType] = (byType[event.eventType] ?? 0) + 1;

    if (event.foodMode) {
      byFoodMode[event.foodMode] = (byFoodMode[event.foodMode] ?? 0) + 1;
    }
  }

  return {
    total: eventStore.length,
    byType,
    byFoodMode,
  };
}
