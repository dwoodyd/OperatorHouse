import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { SpectreProvider } from "@/contexts/SpectreContext";
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

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
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
          <App />
        </CommandPaletteProvider>
      </SpectreProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
