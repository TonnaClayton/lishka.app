import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { ImageMetadata } from "@/lib/image-metadata";
import { Database, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface MigrationResult {
  totalPhotos: number;
  migratedPhotos: number;
  alreadyCorrect: number;
  errors: string[];
}

const PhotoDataMigrationUtility: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzePhotoData = () => {
    if (!profile?.gallery_photos) {
      return {
        totalPhotos: 0,
        stringPhotos: 0,
        objectPhotos: 0,
        validMetadata: 0,
        invalidMetadata: 0,
        photosWithFishInfo: 0,
      };
    }

    let stringPhotos = 0;
    let objectPhotos = 0;
    let validMetadata = 0;
    let invalidMetadata = 0;
    let photosWithFishInfo = 0;

    profile.gallery_photos.forEach((photo, index) => {
      if (typeof photo === "string") {
        stringPhotos++;
        // Try to parse if it's a JSON string
        const photoString = photo as string;
        if (photoString.startsWith("{") && photoString.includes('"url"')) {
          try {
            const parsed = JSON.parse(photoString);
            if (parsed.url && parsed.timestamp) {
              validMetadata++;
              if (parsed.fishInfo && parsed.fishInfo.name !== "Unknown") {
                photosWithFishInfo++;
              }
            } else {
              invalidMetadata++;
            }
          } catch {
            invalidMetadata++;
          }
        } else {
          invalidMetadata++;
        }
      } else {
        objectPhotos++;
        if (
          photo &&
          typeof photo === "object" &&
          photo.url &&
          photo.timestamp
        ) {
          validMetadata++;
          if (photo.fishInfo && photo.fishInfo.name !== "Unknown") {
            photosWithFishInfo++;
          }
        } else {
          invalidMetadata++;
        }
      }
    });

    return {
      totalPhotos: profile.gallery_photos.length,
      stringPhotos,
      objectPhotos,
      validMetadata,
      invalidMetadata,
      photosWithFishInfo,
    };
  };

  const migratePhotoData = async () => {
    if (!profile?.gallery_photos) {
      setError("No photos to migrate");
      return;
    }

    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      const migratedPhotos: ImageMetadata[] = [];
      const errors: string[] = [];
      let migratedCount = 0;
      let alreadyCorrectCount = 0;

      for (let i = 0; i < profile.gallery_photos.length; i++) {
        const photo = profile.gallery_photos[i];

        try {
          if (typeof photo === "string") {
            // Handle string photos
            const photoString = photo as string;
            if (photoString.startsWith("{") && photoString.includes('"url"')) {
              // Parse JSON string
              try {
                const parsed = JSON.parse(photoString);
                // Ensure it has the correct structure
                const migratedPhoto: ImageMetadata = {
                  url: parsed.url || photo,
                  timestamp: parsed.timestamp || new Date().toISOString(),
                  originalFileName: parsed.originalFileName || undefined,
                  fishInfo: parsed.fishInfo || {
                    name: "Unknown",
                    estimatedSize: "Unknown",
                    estimatedWeight: "Unknown",
                    confidence: 0,
                  },
                  location: parsed.location || undefined,
                };
                migratedPhotos.push(migratedPhoto);
                migratedCount++;
              } catch (parseError) {
                // Create minimal metadata for unparseable JSON
                const migratedPhoto: ImageMetadata = {
                  url: photo,
                  timestamp: new Date().toISOString(),
                  fishInfo: {
                    name: "Unknown",
                    estimatedSize: "Unknown",
                    estimatedWeight: "Unknown",
                    confidence: 0,
                  },
                };
                migratedPhotos.push(migratedPhoto);
                migratedCount++;
                errors.push(
                  `Photo ${i + 1}: Failed to parse JSON, created minimal metadata`,
                );
              }
            } else {
              // Plain URL string - create metadata
              const migratedPhoto: ImageMetadata = {
                url: photo,
                timestamp: new Date().toISOString(),
                fishInfo: {
                  name: "Unknown",
                  estimatedSize: "Unknown",
                  estimatedWeight: "Unknown",
                  confidence: 0,
                },
              };
              migratedPhotos.push(migratedPhoto);
              migratedCount++;
            }
          } else {
            // Already an object - validate and fix if needed
            if (photo && typeof photo === "object" && photo.url) {
              const migratedPhoto: ImageMetadata = {
                url: photo.url,
                timestamp: photo.timestamp || new Date().toISOString(),
                originalFileName: photo.originalFileName || undefined,
                fishInfo: photo.fishInfo || {
                  name: "Unknown",
                  estimatedSize: "Unknown",
                  estimatedWeight: "Unknown",
                  confidence: 0,
                },
                location: photo.location || undefined,
              };
              migratedPhotos.push(migratedPhoto);
              alreadyCorrectCount++;
            } else {
              errors.push(`Photo ${i + 1}: Invalid object structure, skipped`);
            }
          }
        } catch (photoError) {
          errors.push(
            `Photo ${i + 1}: ${photoError instanceof Error ? photoError.message : String(photoError)}`,
          );
        }
      }

      // Update the profile with migrated data
      const { error: updateError } = await updateProfile({
        gallery_photos: migratedPhotos,
      });

      if (updateError) {
        throw new Error(`Failed to save migrated data: ${updateError.message}`);
      }

      setResult({
        totalPhotos: profile.gallery_photos.length,
        migratedPhotos: migratedCount,
        alreadyCorrect: alreadyCorrectCount,
        errors,
      });
    } catch (err) {
      console.error("Migration error:", err);
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  const analysis = analyzePhotoData();

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-auto">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Database className="w-6 h-6" />
            Photo Data Migration Utility
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            This utility fixes data structure inconsistencies in your photo
            gallery that may prevent AI fish info from displaying correctly.
          </p>
        </div>

        {/* Analysis Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Current Data Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.totalPhotos}
                </div>
                <div className="text-sm text-gray-600">Total Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.stringPhotos}
                </div>
                <div className="text-sm text-gray-600">String Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.objectPhotos}
                </div>
                <div className="text-sm text-gray-600">Object Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.validMetadata}
                </div>
                <div className="text-sm text-gray-600">Valid Metadata</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analysis.invalidMetadata}
                </div>
                <div className="text-sm text-gray-600">Invalid Metadata</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.photosWithFishInfo}
                </div>
                <div className="text-sm text-gray-600">With Fish Info</div>
              </div>
            </div>

            {analysis.stringPhotos > 0 || analysis.invalidMetadata > 0 ? (
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Migration Recommended:</strong> You have{" "}
                  {analysis.stringPhotos} string photos and{" "}
                  {analysis.invalidMetadata} invalid metadata entries that
                  should be migrated to ensure proper AI info display.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Data Structure Good:</strong> All your photos have
                  proper metadata structure. No migration needed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Migration Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Migration Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={migratePhotoData}
                disabled={migrating || analysis.totalPhotos === 0}
                className="w-full"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Migrating Photos...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Migrate Photo Data
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                This will standardize all photo data to use the ImageMetadata
                structure, ensuring AI fish info displays correctly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Migration Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalPhotos}
                  </div>
                  <div className="text-sm text-gray-600">Total Photos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.migratedPhotos}
                  </div>
                  <div className="text-sm text-gray-600">Migrated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.alreadyCorrect}
                  </div>
                  <div className="text-sm text-gray-600">Already Correct</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Migration Warnings:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-orange-600">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Migration completed successfully! Your photo data is now
                  standardized and AI fish info should display correctly.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Close Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="px-8"
          >
            Close Utility
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoDataMigrationUtility;
