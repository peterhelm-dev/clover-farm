export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Where a pending beta-invite code is stashed between the OAuth redirect and the first authenticated request. */
export const INVITE_CODE_STORAGE_KEY = "clover-farm-invite-code";

// Builds a Supabase Auth (GitHub OAuth) sign-in URL. Kept synchronous/URL-based
// (rather than calling supabase.auth.signInWithOAuth directly) so it can be
// used as both a plain <a href> and a window.location.href redirect target.
export const getLoginUrl = (returnPath?: string, inviteCode?: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const redirectTarget = new URL(returnPath || "/", window.location.origin);
  if (inviteCode) {
    redirectTarget.searchParams.set("inviteCode", inviteCode);
  }

  const url = new URL("/auth/v1/authorize", supabaseUrl);
  url.searchParams.set("provider", "github");
  url.searchParams.set("redirect_to", redirectTarget.toString());

  return url.toString();
};
