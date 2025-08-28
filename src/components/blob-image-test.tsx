import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { getBlobStorageStatus } from "@/lib/blob-storage";
import {
  getFishImageUrl,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";
import { log } from "@/lib/logging";

const BlobImageTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    storageStatus: any;
    imageTests: Array<{
      name: string;
      scientificName: string;
      imageUrl: string;
      accessible: boolean;
      error?: string;
    }>;
  } | null>(null);

  const testImages = [
    { name: "Bluefin Tuna", scientificName: "Thunnus thynnus" },
    { name: "Atlantic Salmon", scientificName: "Salmo salar" },
    { name: "European Seabass", scientificName: "Dicentrarchus labrax" },
    { name: "Gilthead Seabream", scientificName: "Sparus aurata" },
    { name: "Acanthuridae", scientificName: "Acanthuridae" }, // Test dynamic URL generation
    { name: "Unknown Fish", scientificName: "Unknown species" },
  ];

  const runTests = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Test blob storage configuration
      const storageStatus = getBlobStorageStatus();
      log("[BlobImageTest] Storage status:", storageStatus);

      // Test fish image loading
      const imageTests = [];

      for (const fish of testImages) {
        try {
          log(`[BlobImageTest] Testing ${fish.name} (${fish.scientificName})`);
          const imageUrl = await getFishImageUrl(
            fish.name,
            fish.scientificName,
          );

          // Test if image is accessible using Image object
          let accessible = false;
          let error = undefined;

          try {
            const testImage = new Image();
            const imageLoadPromise = new Promise<boolean>((resolve, reject) => {
              testImage.onload = () => resolve(true);
              testImage.onerror = () =>
                reject(new Error("Image failed to load"));
              testImage.src = imageUrl;
            });

            accessible = await imageLoadPromise;
          } catch (fetchError) {
            accessible = false;
            error =
              fetchError instanceof Error
                ? fetchError.message
                : "Image load error";
          }

          imageTests.push({
            name: fish.name,
            scientificName: fish.scientificName,
            imageUrl,
            accessible,
            error,
          });
        } catch (err) {
          imageTests.push({
            name: fish.name,
            scientificName: fish.scientificName,
            imageUrl: "Error loading",
            accessible: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      setResults({
        storageStatus,
        imageTests,
      });
    } catch (err) {
      console.error("[BlobImageTest] Test error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run tests on component mount
  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Fish Image & Blob Storage Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This test checks if Vercel Blob storage is working correctly and if
            fish images are loading properly.
          </p>

          <Button onClick={runTests} disabled={loading} className="w-full">
            {loading ? "Running Tests..." : "Run Tests"}
          </Button>

          {results && (
            <div className="space-y-6">
              {/* Storage Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Blob Storage Status
                </h3>
                <Alert
                  variant={
                    results.storageStatus.configured ? "default" : "destructive"
                  }
                >
                  {results.storageStatus.configured ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <strong>Configured:</strong>{" "}
                        {results.storageStatus.configured ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Has Token:</strong>{" "}
                        {results.storageStatus.hasToken ? "Yes" : "No"}
                      </p>
                      {results.storageStatus.tokenLength && (
                        <p>
                          <strong>Token Length:</strong>{" "}
                          {results.storageStatus.tokenLength} characters
                        </p>
                      )}
                      {results.storageStatus.error && (
                        <p className="text-red-600 dark:text-red-400">
                          <strong>Error:</strong> {results.storageStatus.error}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Image Tests */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Fish Image Tests</h3>
                <div className="space-y-3">
                  {results.imageTests.map((test, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium">{test.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                              {test.scientificName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
                              {test.imageUrl}
                            </p>
                            {test.error && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Error: {test.error}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            {test.accessible ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="text-xs">
                              {test.accessible ? "Accessible" : "Failed"}
                            </span>
                            {test.accessible &&
                              test.imageUrl !== getPlaceholderFishImage() && (
                                <img
                                  src={test.imageUrl}
                                  alt={test.name}
                                  className="w-16 h-16 object-cover rounded border"
                                  onError={(e) => {
                                    console.error(
                                      `Failed to load preview for ${test.name}`,
                                    );
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {results.imageTests.filter((t) => t.accessible).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Images Accessible
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {results.imageTests.filter((t) => !t.accessible).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Images Failed
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-lishka-blue">
                        {
                          results.imageTests.filter(
                            (t) => t.imageUrl === getPlaceholderFishImage(),
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Using Placeholder
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlobImageTest;
