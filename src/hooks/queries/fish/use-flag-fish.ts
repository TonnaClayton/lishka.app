import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { api } from "../api";
import { useToast } from "@/components/ui/use-toast";
import type { BrowseFishItem } from "./use-browse-fish";

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

export const useFlagFish = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    FlagFishResponse,
    Error,
    FlagFishParams,
    {
      previousBrowseData: [
        unknown,
        InfiniteData<BrowseFishItem[]> | undefined,
      ][];
    }
  >({
    mutationFn: ({ fishId, flagged, reason }) =>
      api<FlagFishResponse>(`fish/${fishId}/flag`, {
        method: "PATCH",
        body: JSON.stringify({ flagged, reason }),
      }),
    onMutate: async ({ fishId, flagged }) => {
      await queryClient.cancelQueries({ queryKey: ["browseFish"] });

      const previousBrowseData = queryClient.getQueriesData<
        InfiniteData<BrowseFishItem[]>
      >({ queryKey: ["browseFish"] });

      queryClient.setQueriesData<InfiniteData<BrowseFishItem[]>>(
        { queryKey: ["browseFish"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((fish) =>
                fish.id === fishId
                  ? { ...fish, flaggedForReview: flagged }
                  : fish,
              ),
            ),
          };
        },
      );

      return { previousBrowseData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousBrowseData) {
        for (const [queryKey, data] of context.previousBrowseData) {
          queryClient.setQueryData(queryKey as readonly unknown[], data);
        }
      }
      toast({
        title: "Error",
        description:
          error.message || "Failed to update fish flag. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, { fishId }) => {
      const action = data.flaggedForReview ? "flagged" : "unflagged";
      toast({
        title: `Fish ${action}`,
        description: data.flaggedForReview
          ? "This fish has been marked for further investigation."
          : "The investigation flag has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["browseFish"] });
      queryClient.invalidateQueries({
        queryKey: ["fishFlagDetails", fishId],
      });
    },
  });
};
