import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { UserPublic } from "@/lib/types";

export const SESSION_KEY = ["auth", "session"] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => apiGet<UserPublic | null>("/auth/session"),
    retry: false,
    staleTime: 30_000,
  });
}

export function useSessionActions() {
  const qc = useQueryClient();

  // Called after a successful login/signup: repopulate the session cache.
  const beginSession = async (user: UserPublic) => {
    qc.setQueryData(SESSION_KEY, user);
    await qc.invalidateQueries();
  };

  // Every sign-out control routes through here so no cached data leaks.
  const endSession = async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      qc.setQueryData(SESSION_KEY, null);
      qc.clear();
    }
  };

  return { beginSession, endSession };
}
