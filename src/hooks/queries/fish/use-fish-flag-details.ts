import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

interface FishFlagDetails {
  id: string;
  flaggedForReview: boolean;
  flagReason: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
}

export const useFishFlagDetails = (fishId: string, enabled: boolean) => {
  return useQuery<FishFlagDetails>({
    queryKey: ["fishFlagDetails", fishId],
    queryFn: () =>
      api<FishFlagDetails>(`fish/${fishId}/flag`, {
        method: "GET",
      }),
    enabled: !!fishId && enabled,
    staleTime: 0,
  });
};
