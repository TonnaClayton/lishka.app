import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFlagFish } from "@/hooks/queries/fish/use-flag-fish";
import { useFishFlagDetails } from "@/hooks/queries/fish/use-fish-flag-details";
import { Flag, Loader2 } from "lucide-react";

const flagFormSchema = z.object({
  reason: z
    .string()
    .max(500, "Reason must be 500 characters or less")
    .optional()
    .or(z.literal("")),
});

type FlagFormValues = z.infer<typeof flagFormSchema>;

interface FlagFishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fishId: string;
  fishName: string;
  currentlyFlagged: boolean;
  onSuccess?: (flagged: boolean) => void;
}

export function FlagFishDialog({
  open,
  onOpenChange,
  fishId,
  fishName,
  currentlyFlagged,
  onSuccess,
}: FlagFishDialogProps) {
  const { mutate: flagFish, isPending } = useFlagFish();

  const { data: flagDetails, isLoading: isLoadingDetails } = useFishFlagDetails(
    fishId,
    open && currentlyFlagged,
  );

  const form = useForm<FlagFormValues>({
    resolver: zodResolver(flagFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  useEffect(() => {
    if (flagDetails?.flagReason && currentlyFlagged) {
      form.reset({ reason: flagDetails.flagReason });
    } else if (!currentlyFlagged) {
      form.reset({ reason: "" });
    }
  }, [flagDetails, currentlyFlagged, form]);

  const onSubmit = (values: FlagFormValues) => {
    const isFlagging = !currentlyFlagged;
    flagFish(
      {
        fishId,
        flagged: true,
        reason: values.reason || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSuccess?.(isFlagging || true);
        },
      },
    );
  };

  const handleUnflag = () => {
    flagFish(
      { fishId, flagged: false },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSuccess?.(false);
        },
      },
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (currentlyFlagged) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-500 fill-amber-500" />
              Flagged for Investigation
            </DialogTitle>
            <DialogDescription>
              &ldquo;{fishName}&rdquo; has been flagged for further
              investigation.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                {flagDetails?.flaggedBy && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Flagged by:
                    </span>{" "}
                    {flagDetails.flaggedBy}
                  </p>
                )}
                {flagDetails?.flaggedAt && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Date:</span>{" "}
                    {formatDate(flagDetails.flaggedAt)}
                  </p>
                )}
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="No reason provided"
                            className="resize-none"
                            rows={3}
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <FormMessage />
                          <span className="text-xs text-muted-foreground ml-auto">
                            {field.value?.length || 0}/500
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUnflag}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Remove Flag
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Flag
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            Flag for Investigation
          </DialogTitle>
          <DialogDescription>
            Flag &ldquo;{fishName}&rdquo; for further investigation. You can
            provide an optional reason below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Wrong category, is_toxic seems incorrect, missing habitat data..."
                      className="resize-none"
                      rows={3}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {field.value?.length || 0}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Flag Fish
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
