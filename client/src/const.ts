export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const AUTH_RETURN_PATH_KEY = "oh_auth_return_path";
const AUTH_ATTEMPT_KEY = "oh_auth_attempt_started_at";
const AUTH_RETURN_MAX_AGE_MS = 30 * 60 * 1000;

function normalizeReturnPath(candidate?: string | null) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  if (candidate.startsWith("/api/") || candidate.startsWith("/auth/recovery")) return "/";
  return candidate;
}

export function getStoredAuthReturnPath() {
  if (typeof window === "undefined") return "/";
  try {
    const attemptedAt = Number(sessionStorage.getItem(AUTH_ATTEMPT_KEY) || 0);
    if (attemptedAt && Date.now() - attemptedAt > AUTH_RETURN_MAX_AGE_MS) {
      sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
      sessionStorage.removeItem(AUTH_ATTEMPT_KEY);
      return "/";
    }
    return normalizeReturnPath(sessionStorage.getItem(AUTH_RETURN_PATH_KEY));
  } catch {
    return "/";
  }
}

export function consumeAuthReturnPath() {
  const path = getStoredAuthReturnPath();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
      sessionStorage.removeItem(AUTH_ATTEMPT_KEY);
    } catch {
      // Private browsing or embedded contexts may reject session storage.
    }
  }
  return path;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
// The OAuth provider keeps the callback address stable; the intended in-app
// destination is persisted locally so it survives the external login handoff.
export const getLoginUrl = (returnPath?: string) => {
  if (typeof window === "undefined") {
    // SSR / test context — return a safe fallback
    return "/";
  }
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  try {
    sessionStorage.setItem(AUTH_RETURN_PATH_KEY, normalizeReturnPath(returnPath ?? currentPath));
    sessionStorage.setItem(AUTH_ATTEMPT_KEY, String(Date.now()));
  } catch {
    // Login still works when session storage is unavailable; only deep-link restoration is skipped.
  }
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
