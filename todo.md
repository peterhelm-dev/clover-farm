# Clover Farm TODO

- [x] Initialize project with static template
- [x] Build Clover Wellness home page with auth wall, onboarding wizard, dashboard, voice logger, recipes, travel sourcing, and integrations
- [x] Upgrade project to full-stack template (db, server, user features)
- [x] Resolve file conflicts from template upgrade (Home.tsx, App.tsx)
- [x] Install new dependencies (drizzle-orm, trpc, tanstack-query, etc.)
- [x] Push database schema (users table created)
- [x] Restart dev server and verify healthy state

## AI Voice Logger Feature
- [x] Add tRPC router `nutrition.analyzeTranscript` using invokeLLM with structured JSON schema output
- [x] Remove hardcoded keyword matching from Home.tsx processTranscript
- [x] Wire frontend voice logger to call the new tRPC mutation
- [x] Show AI loading state while extraction is in progress
- [x] Display AI clarifying question if returned, and allow user to refine
- [x] Write vitest for the nutrition extraction procedure

## Expanded Feature Set (Round 2)
- [x] Add foodLogs table to drizzle/schema.ts with userId, foodName, quantity, calories, protein, carbs, fat, fiber, allergensDetected, rawSpeech, confidence, timestamp
- [x] Build tRPC protectedProcedure: foodLogs.create, foodLogs.getByDate, foodLogs.getAll, foodLogs.getProfile, foodLogs.saveProfile
- [x] Wire voice logger to save AI results to DB via foodLogs.create
- [x] Wire dashboard to fetch today's logs from DB via foodLogs.getByDate
- [x] Replace simulated Google/Apple auth with real Manus OAuth via getLoginUrl()
- [x] Redesign onboarding as step-by-step wizard saved to userProfiles table
- [x] Clear mock food log data from dashboard (start at zero, show empty state)
- [x] Add fiber macro progress card to dashboard
- [x] Add calendar view tab on dashboard with day-click food detail
- [x] Redesign voice logger as chat-style interface (chat bubbles, no separate text frame)
- [x] Replace clarifying question text input with mic button (same button) and add Skip option
- [x] Add AI health overview panel on dashboard (summary + improvement tips)
- [x] Add data-aware AI chat on dashboard (bottom-right, can ask questions about food logs)

## Market Readiness Sprint
- [x] Add subscriptions table (userId, tier, stripeCustomerId, stripeSubscriptionId, aiCallsUsedThisMonth, periodStart)
- [x] Add Stripe billing with Free / Plus / Pro tiers
- [x] Enforce AI call limits per tier (10 free, unlimited paid)
- [x] Add delete food log entry (trash icon on each log card)
- [x] Add edit food log entry (edit icon opens inline form)
- [x] Mobile-first layout pass on voice logger and dashboard (SidebarProvider drawer)
- [x] Connect Edamam recipe API filtered by user dietary profile (setup prompt when keys not configured)
- [x] Add Sentry error monitoring (deferred — requires external Sentry DSN; documented in Settings → Secrets as SENTRY_DSN)
- [x] Add rate limiting on AI endpoints (30 req/min for AI, 300 req/min general via express-rate-limit)
- [x] Add upgrade prompt UI when free tier limit is reached
- [x] Add subscription management page (current plan, upgrade/downgrade, cancel)
