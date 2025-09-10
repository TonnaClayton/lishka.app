import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Database, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { log, error as logError } from "@/lib/logging";
import { ImageMetadata } from "@/lib/image-metadata";
import { toImageMetadataItem } from "@/lib/gallery-photo";

const DatabaseDebugger: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    profileExists: boolean;
    profileData: any;
    galleryPhotosField: boolean;
    galleryPhotosValue: ImageMetadata[] | null;
    databaseError: string | null;
    testUpdateResult: any;
  } | null>(null);

  const runDatabaseTests = async () => {
    if (!user?.id) {
      alert("No user logged in");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      log("[DatabaseDebugger] Starting database tests for user:", user.id);

      // Test 1: Check if profile exists and get raw data
      log("[DatabaseDebugger] Test 1: Fetching profile data...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      log("[DatabaseDebugger] Profile fetch result:", {
        data: profileData,
        error: profileError,
      });

      // Test 2: Try to update gallery_photos with a test array
      log("[DatabaseDebugger] Test 2: Testing gallery_photos update...");
      const testPhotos = [
        "https://example.com/test1.jpg",
        "https://example.com/test2.jpg",
      ];

      const { data: updateData, error: updateError } = await supabase
        .from("profiles")
        .update({ gallery_photos: testPhotos })
        .eq("id", user.id)
        .select()
        .single();

      log("[DatabaseDebugger] Update test result:", {
        data: updateData,
        error: updateError,
      });

      // Test 3: Fetch the updated data to verify
      log("[DatabaseDebugger] Test 3: Verifying update...");
      const { data: verifyData, error: verifyError } = await supabase
        .from("profiles")
        .select("gallery_photos")
        .eq("id", user.id)
        .single();

      log("[DatabaseDebugger] Verification result:", {
        data: verifyData,
        error: verifyError,
      });

      const galleryPhotosValue = verifyData?.gallery_photos.map((photo) => {
        try {
          const photoItem = toImageMetadataItem(photo);
          return photoItem;
        } catch {
          return null;
        }
      });

      // Compile results
      setResults({
        profileExists: !!profileData && !profileError,
        profileData: profileData,
        galleryPhotosField: profileData && "gallery_photos" in profileData,
        galleryPhotosValue: galleryPhotosValue,
        databaseError:
          profileError?.message ||
          updateError?.message ||
          verifyError?.message ||
          null,
        testUpdateResult: {
          updateSuccess: !!updateData && !updateError,
          verifySuccess: !!verifyData && !verifyError,
          finalGalleryPhotos: verifyData?.gallery_photos,
        },
      });
    } catch (err) {
      logError("[DatabaseDebugger] Test error:", err);
      setResults({
        profileExists: false,
        profileData: null,
        galleryPhotosField: false,
        galleryPhotosValue: null,
        databaseError: err instanceof Error ? err.message : "Unknown error",
        testUpdateResult: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTestData = async () => {
    if (!user?.id) return;

    try {
      log("[DatabaseDebugger] Clearing test data...");
      const { error } = await supabase
        .from("profiles")
        .update({
          gallery_photos: profile?.gallery_photos || [],
        })
        .eq("id", user.id);

      if (error) {
        logError("[DatabaseDebugger] Error clearing test data:", error);
      } else {
        log("[DatabaseDebugger] Test data cleared successfully");
        // Re-run tests to show current state
        await runDatabaseTests();
      }
    } catch (err) {
      logError("[DatabaseDebugger] Exception clearing test data:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Gallery Photos Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={runDatabaseTests}
              disabled={loading || !user}
              className="flex-1"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run Database Tests"
              )}
            </Button>
            {results && (
              <Button
                onClick={clearTestData}
                variant="outline"
                disabled={loading}
              >
                Clear Test Data
              </Button>
            )}
          </div>

          {!user && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                No user logged in. Please log in first.
              </AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              {/* Profile Status */}
              <Alert
                variant={results.profileExists ? "default" : "destructive"}
              >
                {results.profileExists ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>Profile Exists:</strong>{" "}
                      {results.profileExists ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Gallery Photos Field Exists:</strong>{" "}
                      {results.galleryPhotosField ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Current Gallery Photos:</strong>{" "}
                      {JSON.stringify(results.galleryPhotosValue)}
                    </p>
                    {results.databaseError && (
                      <p className="text-red-600 dark:text-red-400">
                        <strong>Database Error:</strong> {results.databaseError}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Test Update Results */}
              {results.testUpdateResult && (
                <Alert
                  variant={
                    results.testUpdateResult.updateSuccess
                      ? "default"
                      : "destructive"
                  }
                >
                  {results.testUpdateResult.updateSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>Test Update Results:</strong>
                      </p>
                      <p>
                        • Update Success:{" "}
                        {results.testUpdateResult.updateSuccess ? "Yes" : "No"}
                      </p>
                      <p>
                        • Verify Success:{" "}
                        {results.testUpdateResult.verifySuccess ? "Yes" : "No"}
                      </p>
                      <p>
                        • Final Gallery Photos:{" "}
                        {JSON.stringify(
                          results.testUpdateResult.finalGalleryPhotos,
                        )}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Raw Profile Data */}
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm">Raw Profile Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(results.profileData, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Current Context Data */}
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Current Context Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>User ID:</strong> {user?.id}
                    </p>
                    <p>
                      <strong>Profile Gallery Photos:</strong>{" "}
                      {JSON.stringify(profile?.gallery_photos)}
                    </p>
                    <p>
                      <strong>Profile Full Name:</strong> {profile?.full_name}
                    </p>
                    <p>
                      <strong>Profile Created At:</strong> {profile?.created_at}
                    </p>
                    <p>
                      <strong>Profile Updated At:</strong> {profile?.updated_at}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseDebugger;
