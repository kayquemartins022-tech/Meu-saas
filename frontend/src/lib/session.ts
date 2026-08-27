import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

export const SESSION_KEY = ["auth", "session"] as const;

/**
 * Auth state is a three-way answer, not a boolean:
 *  - "authenticated"   the server returned a user
 *  - "unauthenticated" the server explicitly said "nobody" (null body or 401)
 *  - "error"           we could not ask (offline, 5xx, cold start)
 *
 * Only "unauthenticated" may redirect to /login. Treating "error" as logged-out is
 * what makes a valid session bounce straight back to the login screen.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

async function fetchSession(): Promise<UserPublic | null> {
  try {
    return await apiGet<UserPublic | null>("/auth/session");
  } catch (err) {
    // A 401/403 is a definitive "not logged in" — anything else is a transport problem
    // and must surface as an error so we don't discard a perfectly valid session.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    // Retry transport failures: one blip must never look like a logout.
    retry: 2,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 2000),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/** Collapses the react-query flags into the four states above. */
export function useAuthStatus(): { status: AuthStatus; user: UserPublic | null } {
  const { data, isPending, isError } = useSession();

  if (isPending) return { status: "loading", user: null };
  if (isError) return { status: "error", user: null };
  if (data) return { status: "authenticated", user: data };
  return { status: "unauthenticated", user: null };
}

export function useSessionActions() {
  const qc = useQueryClient();

  /**
   * Called right after a successful login/signup. Seeds the cache synchronously so the
   * next render is already authenticated, then refreshes app data in the background.
   * Nothing here is awaited by the caller's navigation — a failing refetch must not
   * strand the user on the login screen.
   */
  const beginSession = (user: UserPublic) => {
    qc.setQueryData(SESSION_KEY, user);
    // Drop any data cached for a previous account, but keep the fresh session entry.
    void qc.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== "auth",
    });
  };

  /** Every sign-out control must route through here — it clears server + client state. */
  const endSession = async () => {
    try {
      await apiPost("/auth/logout");
    } catch {
      // Even if the network call fails, drop local state so the UI reflects the intent.
    } finally {
      // Drop the previous account's data first, then flip the session to "nobody" LAST:
      // setQueryData notifies the mounted guards so they re-render and redirect.
      // (queryClient.clear() would remove the entry *and* its observers, leaving the
      // guard rendering stale data and never redirecting.)
      qc.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
      qc.setQueryData(SESSION_KEY, null);
    }
  };

  /** Force a re-read of the session (used by the "try again" affordance). */
  const refreshSession = () => qc.invalidateQueries({ queryKey: SESSION_KEY });

  return { beginSession, endSession, refreshSession };
}
