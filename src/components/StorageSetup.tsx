import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Database } from "lucide-react";
import { setupAvatarStorage } from "@/lib/storage-setup";

const StorageSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { error } = await setupAvatarStorage();

      if (error) {
        setResult({
          success: false,
          message: error.message || "Failed to setup storage",
        });
      } else {
        setResult({
          success: true,
          message: "Avatar storage bucket setup successfully!",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Storage Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will set up the Supabase Storage bucket for avatar uploads. Run
            this once to initialize the storage system.
          </p>

          <Button onClick={handleSetup} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "Setup Avatar Storage"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <strong>What this does:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Creates an 'avatars' storage bucket</li>
              <li>Sets up public access for avatar images</li>
              <li>Configures file size limits (2MB max)</li>
              <li>Restricts to image file types only</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageSetup;
