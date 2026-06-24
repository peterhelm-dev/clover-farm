/**
 * Sentry error monitoring — optional, gracefully disabled when SENTRY_DSN is not set.
 *
 * Setup:
 *   1. Create a free account at https://sentry.io
 *   2. Create a Node.js project and copy the DSN
 *   3. Add SENTRY_DSN to Settings → Secrets in the Manus Management UI
 *
 * When SENTRY_DSN is absent the helpers below are no-ops, so the app runs
 * identically in development without any Sentry account.
 */
import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] SENTRY_DSN not set — error monitoring disabled. Add it in Settings → Secrets to enable.");
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    tracesSampleRate: 0.2,
  });
  initialized = true;
  console.log("[Sentry] Error monitoring initialized.");
}

/** Capture an exception manually (e.g. from a catch block). No-op if not initialized. */
export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

/** Express error handler — must be registered AFTER all routes. No-op if not initialized. */
export function sentryErrorHandler() {
  if (!initialized) {
    // Return a plain pass-through middleware
    return (_err: unknown, _req: unknown, _res: unknown, next: (e: unknown) => void) => next(_err);
  }
  return Sentry.expressErrorHandler();
}
