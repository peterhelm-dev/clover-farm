// First-party event logging (clover-instrumentation-spec.md).
// Fire-and-forget by design: instrumentation must never break a user-facing
// flow, so failures are logged and swallowed.
import { events } from "../drizzle/schema";
import { getDb } from "./db";

export async function logEvent(
  userId: number | null,
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(events).values({ userId, eventName, properties });
  } catch (err) {
    console.warn(`[Events] Failed to log '${eventName}':`, err);
  }
}
