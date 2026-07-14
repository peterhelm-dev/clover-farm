import { protectedProcedure, router } from "../_core/trpc";
import { logEvent } from "../events";
import { analyzePatterns, buildReport, latestCompletedPeriod } from "../weekly-export";

export const weeklyExportRouter = router({
  /**
   * The weekly compassionate export for the user's most recent completed
   * 7-day period (periods are anchored on signup date, matching D14 windows).
   * Computed on demand — no stored artifacts needed at beta scale.
   */
  getReport: protectedProcedure.query(async ({ ctx }) => {
    const period = latestCompletedPeriod(ctx.user.createdAt);

    if (!period.available) {
      return {
        available: false as const,
        firstReportAt: period.firstReportAt,
      };
    }

    const patterns = await analyzePatterns(ctx.user.id, period.periodStart, period.periodEnd);
    void logEvent(ctx.user.id, "weekly_export_generated", {
      goal: ctx.user.primaryGoal,
      days_logged: patterns.daysLogged,
    });
    return buildReport(ctx.user, patterns, {
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    });
  }),
});
