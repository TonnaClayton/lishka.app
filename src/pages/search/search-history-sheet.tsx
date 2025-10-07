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
import { Menu, Trash2 } from "lucide-react";
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
      <SheetContent side="left" className="p-0">
        <SheetHeader className="flex flex-col items-start space-y-0 gap-1 px-6 pt-4">
          <SheetTitle>Search History</SheetTitle>
          <SheetDescription>View your search history here.</SheetDescription>
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
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md group"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">
                    {session.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, session.id)}
                    disabled={deletingIds.has(session.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
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
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
