import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteSearchSession, useGetSearchSessions } from "@/hooks/queries";
import { Menu, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { captureEvent } from "@/lib/posthog";

export function SearchHistorySheet() {
  const { data, isLoading } = useGetSearchSessions();
  const deleteSession = useDeleteSearchSession();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple clicks on the same item
    if (deletingIds.has(sessionId)) {
      return;
    }

    // Add to deleting set
    setDeletingIds((prev) => new Set(prev).add(sessionId));

    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        toast({
          title: "Search deleted",
          description: "Your search conversation has been deleted.",
        });
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
        captureEvent("search_history_deleted", {
          sessionId,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description:
            "Failed to delete search conversation. Please try again.",
          variant: "destructive",
        });
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      captureEvent("search_history_closed");
    } else {
      captureEvent("search_history_opened");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0" hideCloseButton={true}>
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#191B1F1A] gap-1 mx-6 pb-2 pt-4">
          <div>
            <SheetTitle className="text-base font-bold text-black">
              Search History
            </SheetTitle>
            <SheetDescription></SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-fit w-fit"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4 stroke-[2] text-[#191B1F]" />
          </Button>
        </SheetHeader>
        <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 mt-4 flex h-[calc(100vh-150px)] flex-col gap-3 overflow-y-auto px-4">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`session-skel-${i}`}
                  className="p-2 rounded-md bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.length > 0 ? (
            data.map((session) => (
              <Link
                to={`/search/${session.id}`}
                key={session.id}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 border flex items-center border-[#191B1F0D] rounded-[8px] px-4 h-[44px] group"
              >
                <div className="flex items-center gap-2 w-full">
                  <p className="text-xs font-semibold text-[#191B1FB2] dark:text-[#191B1FB2] w-full flex-1 truncate max-w-[85%]">
                    {session.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-opacity flex-shrink-0 ml-auto"
                    onClick={(e) => handleDelete(e, session.id)}
                    disabled={deletingIds.has(session.id)}
                  >
                    <Trash2 className="h-4 w-4 text-[#E8E8E9] group-hover:text-red-500" />
                  </Button>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center py-8">
              <div className="text-center px-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No search history yet.
                </p>
                <div className="mt-3">
                  <SheetClose asChild>
                    <Button variant="outline" asChild>
                      <Link to="/search">Start your first search</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </div>
          )}
        </div>
        <SheetFooter className="w-full px-6">
          <SheetClose asChild>
            <Button className="w-full shadow-none bg-[#025DFB1A] text-lishka-blue rounded-[24px] h-[46px] hover:bg-[#025DFB33] hover:text-lishka-blue">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
