export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Optional returnPath and inviteCode are encoded in state so the OAuth callback can redirect/validate.
export const getLoginUrl = (returnPath?: string, inviteCode?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Encode redirectUri, optional returnPath, and optional inviteCode in state
  const stateObj = {
    redirectUri,
    returnPath: returnPath || "/",
    inviteCode: inviteCode || undefined,
  };
  const state = btoa(JSON.stringify(stateObj));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
