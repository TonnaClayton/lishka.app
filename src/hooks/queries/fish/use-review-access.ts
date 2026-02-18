import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

interface ReviewAccessResponse {
  canReview: boolean;
}

/**
 * Checks whether the authenticated user has curator access
 * to flag fish for further investigation.
 * Cached for the entire session (rarely changes).
 */
export const useReviewAccess = () => {
  return useQuery<ReviewAccessResponse>({
    queryKey: ["reviewAccess"],
    queryFn: () =>
      api<ReviewAccessResponse>("fish/review-access", { method: "GET" }),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
};
