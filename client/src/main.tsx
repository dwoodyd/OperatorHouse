import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { SpectreProvider } from "@/contexts/SpectreContext";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch when user clicks back into the tab — keeps pipeline/tasks always fresh
      refetchOnWindowFocus: true,
      // Data older than 60s is considered stale and will be refetched on next mount/focus
      staleTime: 60_000,
      // Keep unused data in cache for 5 minutes before garbage collection
      gcTime: 5 * 60_000,
      // Retry failed queries up to 2 times with exponential backoff
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});

const LOGIN_REDIRECT_KEY = "oh_last_login_redirect";
const LOGIN_REDIRECT_COOLDOWN_MS = 15_000;
const PUBLIC_ENTRY_PATHS = [
  "/",
  "/apply",
  "/redeem",
  "/billing-setup",
  "/pricing",
  "/about",
  "/audit",
  "/privacy",
  "/terms",
  "/auth/recovery",
];

function isPublicEntryPath(pathname: string) {
  return PUBLIC_ENTRY_PATHS.includes(pathname)
    || pathname.startsWith("/invite/")
    || pathname.startsWith("/book/")
    || pathname.startsWith("/f/")
    || pathname.startsWith("/portal/")
    || pathname.startsWith("/sign/")
    || pathname.startsWith("/review/");
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  // Marketing, legal, recovery, and public-booking pages are allowed to load
  // in visitor mode. Redirecting because a background protected query happens
  // to fire here turns a recoverable unauthenticated state into a login loop.
  if (isPublicEntryPath(window.location.pathname)) {
    console.info("[Auth] Visitor-mode unauthorized response suppressed on public route.");
    return;
  }

  // Loop guard: if we redirected to login very recently and STILL get an
  // unauthorized error, the session cookie isn't sticking (misconfigured
  // APP_ID/JWT_SECRET on the server, blocked cookie, etc.). Bouncing again
  // would trap the user in an infinite app -> Manus -> app loop, which is
  // exactly the "onboarding cuts off and goes to Manus" symptom. Stop here so
  // the app can render in visitor mode instead of looping.
  try {
    const last = Number(sessionStorage.getItem(LOGIN_REDIRECT_KEY) || 0);
    if (Date.now() - last < LOGIN_REDIRECT_COOLDOWN_MS) {
      console.error(
        "[Auth] Suppressed repeat login redirect — session did not persist after sign-in. " +
        "Check server APP_ID/JWT_SECRET and that the cookie is being set on this origin."
      );
      window.location.assign("/auth/recovery?reason=session");
      return;
    }
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode / embedded webview) — fall
    // through and redirect once.
  }

  const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(getLoginUrl(returnPath));
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <SpectreProvider>
        <CommandPaletteProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </CommandPaletteProvider>
      </SpectreProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
