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
}

export function FlagFishDialog({
  open,
  onOpenChange,
  fishId,
  fishName,
  currentlyFlagged,
}: FlagFishDialogProps) {
  const { mutate: flagFish, isPending } = useFlagFish();

  const form = useForm<FlagFormValues>({
    resolver: zodResolver(flagFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit = (values: FlagFormValues) => {
    flagFish(
      {
        fishId,
        flagged: !currentlyFlagged,
        reason: values.reason || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  };

  const handleUnflag = () => {
    flagFish(
      { fishId, flagged: false },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            {currentlyFlagged ? "Remove Flag" : "Flag for Investigation"}
          </DialogTitle>
          <DialogDescription>
            {currentlyFlagged
              ? `Remove the investigation flag from "${fishName}"?`
              : `Flag "${fishName}" for further investigation. You can provide an optional reason below.`}
          </DialogDescription>
        </DialogHeader>

        {currentlyFlagged ? (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleUnflag}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Flag
            </Button>
          </DialogFooter>
        ) : (
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
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Flag Fish
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
