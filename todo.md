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
