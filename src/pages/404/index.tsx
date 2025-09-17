import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Page404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        onClick={() => window.history.back()}
        variant="outline"
        className="flex items-center gap-2"
      >
        Go Back
      </Button>
    </div>
  );
}
