-- Backfill logMethod for pre-migration rows.
-- Photo logs are inferable (imageUrl is set). Voice vs typed is NOT
-- distinguishable in historical data (both land in rawSpeech), so non-photo
-- rows intentionally stay null per the D14 spec's backfill rule.
UPDATE "foodLogs" SET "logMethod" = 'photo' WHERE "imageUrl" IS NOT NULL AND "logMethod" IS NULL;
--> statement-breakpoint

-- View: user_d14_retention
-- Computes D14 retention status per user: logged food on >= 4 of the 7 days
-- between day 8 and day 14 after signup (inclusive).
--
-- Adapted from clover-d14-retention-spec.md section 4 for this schema:
--   * camelCase quoted identifiers ("foodLogs", "loggedAt", "userId", "createdAt")
--   * users.id is integer (serial), not uuid
--   * timestamps are `timestamp without time zone` storing UTC values, so the
--     tz conversion is `(col AT TIME ZONE 'UTC') AT TIME ZONE tz` — the spec's
--     single `AT TIME ZONE tz` would misinterpret naive timestamps.
--   * users.timezone is not yet populated by the app; coalesce to UTC is the
--     spec's documented approximation until it is.
CREATE OR REPLACE VIEW user_d14_retention AS
WITH user_signup AS (
  SELECT
    id AS user_id,
    "createdAt" AS signup_at,
    COALESCE(timezone, 'UTC') AS tz
  FROM users
),
window_bounds AS (
  SELECT
    user_id,
    signup_at,
    tz,
    (signup_at + INTERVAL '8 days') AS window_start,
    (signup_at + INTERVAL '14 days' + INTERVAL '1 day') AS window_end -- exclusive upper bound
  FROM user_signup
),
logged_days AS (
  SELECT
    fl."userId" AS user_id,
    date_trunc('day', (fl."loggedAt" AT TIME ZONE 'UTC') AT TIME ZONE wb.tz) AS log_day
  FROM "foodLogs" fl
  JOIN window_bounds wb ON wb.user_id = fl."userId"
  WHERE fl.status = 'success'
    AND fl."loggedAt" >= wb.window_start
    AND fl."loggedAt" < wb.window_end
  GROUP BY fl."userId", date_trunc('day', (fl."loggedAt" AT TIME ZONE 'UTC') AT TIME ZONE wb.tz)
),
day_counts AS (
  SELECT
    user_id,
    count(*) AS days_logged_in_window
  FROM logged_days
  GROUP BY user_id
)
SELECT
  wb.user_id,
  wb.signup_at,
  wb.window_end,
  COALESCE(dc.days_logged_in_window, 0) AS days_logged_in_window,
  (COALESCE(dc.days_logged_in_window, 0) >= 4) AS d14_retained,
  ((now() AT TIME ZONE 'UTC') >= wb.window_end) AS window_complete -- only trust d14_retained once this is true
FROM window_bounds wb
LEFT JOIN day_counts dc ON dc.user_id = wb.user_id;
