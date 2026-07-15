import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { logEvent } from "../events";

/**
 * Client-originated events only — server-originated events (settings changes,
 * export generation) are logged directly where they happen. The whitelist
 * keeps the events table meaningful: only golden-path events that correspond
 * to shipped features, per the instrumentation spec's "don't instrument
 * features that aren't live" rule.
 */
const CLIENT_EVENT_NAMES = [
  // Onboarding funnel
  "onboarding_started",
  "goal_selected",
  "first_log_completed",
  "notification_preference_set",
  "onboarding_completed",
  // Daily logging loop
  "log_attempt_started",
  "log_attempt_succeeded",
  "log_attempt_failed",
  // Weekly export engagement
  "weekly_export_viewed",
  "weekly_export_downloaded",
  // Mood tracker
  "mood_checkin_completed",
] as const;

export const eventsRouter = router({
  track: protectedProcedure
    .input(
      z.object({
        eventName: z.enum(CLIENT_EVENT_NAMES),
        properties: z.record(z.string(), z.unknown()).default({}),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await logEvent(ctx.user.id, input.eventName, input.properties);
      return { success: true } as const;
    }),
});
