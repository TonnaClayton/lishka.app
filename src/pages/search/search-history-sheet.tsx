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
import { useGetSearchSessions } from "@/hooks/queries";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export function SearchHistorySheet() {
  const { data, isLoading } = useGetSearchSessions();
  return (
    <Sheet>
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
        <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground mt-4 flex h-[calc(100vh-150px)] flex-col gap-3 overflow-y-auto px-4">
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
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session.title}
                  </p>
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
