import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useToast } from "@/components/ui/use-toast";

interface FlagFishParams {
  fishId: string;
  flagged: boolean;
  reason?: string;
}

interface FlagFishResponse {
  id: string;
  flaggedForReview: boolean;
  flagReason: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
}

/**
 * Mutation hook to flag or unflag a fish for investigation.
 * Only available to curators (backend enforces this).
 */
export const useFlagFish = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<FlagFishResponse, Error, FlagFishParams>({
    mutationFn: ({ fishId, flagged, reason }) =>
      api<FlagFishResponse>(`fish/${fishId}/flag`, {
        method: "PATCH",
        body: JSON.stringify({ flagged, reason }),
      }),
    onSuccess: (data) => {
      const action = data.flaggedForReview ? "flagged" : "unflagged";
      toast({
        title: `Fish ${action}`,
        description: data.flaggedForReview
          ? "This fish has been marked for further investigation."
          : "The investigation flag has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["browseFish"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update fish flag. Please try again.",
        variant: "destructive",
      });
    },
  });
};
