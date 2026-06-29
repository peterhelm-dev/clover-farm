import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { nutritionRouter } from "./routers/nutrition";
import { foodLogsRouter } from "./routers/foodLogs";
import { healthInsightsRouter } from "./routers/healthInsights";
import { billingRouter } from "./routers/billing";
import { recipesRouter } from "./routers/recipes";
import { waitlistRouter } from "./routers/waitlist";
import { adminRouter } from "./routers/admin";
import { referralRouter } from "./routers/referral";
import { betaRouter } from "./routers/beta";
import { imageRouter } from "./routers/image";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  nutrition: nutritionRouter,
  foodLogs: foodLogsRouter,
  healthInsights: healthInsightsRouter,
  billing: billingRouter,
  recipes: recipesRouter,
  waitlist: waitlistRouter,
  admin: adminRouter,
  referral: referralRouter,
  beta: betaRouter,
  image: imageRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
