import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Fish,
  MapPin,
  Ruler,
  Weight,
  Camera,
} from "lucide-react";
import { getBlobStorageStatus, uploadImage } from "@/lib/blob-storage";
import { processImageUpload, ImageMetadata } from "@/lib/image-metadata";
import { log } from "@/lib/logging";

interface UploadState {
  loading: boolean;
  error: string | null;
  success: string | null;
  imageUrl: string | null;
  metadata: ImageMetadata | null;
}

const ImageUploadDebugger: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    loading: false,
    error: null,
    success: null,
    imageUrl: null,
    metadata: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check system status
  const storageStatus = getBlobStorageStatus();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setUploadState({
      loading: false,
      error: null,
      success: null,
      imageUrl: null,
      metadata: null,
    });

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setUploadState((prev) => ({
        ...prev,
        error: "File must be less than 10MB",
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadState((prev) => ({
        ...prev,
        error: "Please select an image file",
      }));
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState({
      loading: true,
      error: null,
      success: null,
      imageUrl: null,
      metadata: null,
    });

    try {
      log("🚀 [ImageUploadDebugger] Starting upload process...");

      // Check storage configuration
      if (!storageStatus.configured) {
        throw new Error(storageStatus.error || "Blob storage not configured");
      }

      // Process image metadata (includes fish identification)
      log("📊 [ImageUploadDebugger] Processing metadata...");
      const metadata = await processImageUpload(selectedFile);
      log("✅ [ImageUploadDebugger] Metadata processed:", metadata);

      // Upload image to blob storage
      log("☁️ [ImageUploadDebugger] Uploading to blob storage...");
      const imageUrl = await uploadImage(selectedFile);
      log("✅ [ImageUploadDebugger] Upload successful:", imageUrl);

      // Update metadata with final URL
      const finalMetadata = { ...metadata, url: imageUrl };

      setUploadState({
        loading: false,
        error: null,
        success: "Image uploaded successfully!",
        imageUrl,
        metadata: finalMetadata,
      });

      log("🎉 [ImageUploadDebugger] Upload process completed successfully");
    } catch (error) {
      console.error("❌ [ImageUploadDebugger] Upload failed:", error);
      setUploadState({
        loading: false,
        error: error instanceof Error ? error.message : "Upload failed",
        success: null,
        imageUrl: null,
        metadata: null,
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadState({
      loading: false,
      error: null,
      success: null,
      imageUrl: null,
      metadata: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white dark:bg-gray-900">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Camera className="w-6 h-6 text-blue-600" />
            Image Upload Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Test image upload functionality with logo and fish information
            overlays.
          </p>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Test Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-12"
              disabled={uploadState.loading}
            >
              {selectedFile
                ? `Selected: ${selectedFile.name}`
                : "Choose Image File"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              Supported: JPEG, PNG, GIF, WebP • Max size: 10MB
            </p>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Name:</strong> {selectedFile.name}
                </div>
                <div>
                  <strong>Size:</strong>{" "}
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>
                <div>
                  <strong>Type:</strong> {selectedFile.type}
                </div>
                <div>
                  <strong>Modified:</strong>{" "}
                  {new Date(selectedFile.lastModified).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploadState.loading || !storageStatus.configured}
                className="flex-1"
              >
                {uploadState.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload & Test"
                )}
              </Button>
              <Button onClick={resetUpload} variant="outline">
                Reset
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {uploadState.error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{uploadState.error}</AlertDescription>
            </Alert>
          )}

          {uploadState.success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>{uploadState.success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {uploadState.imageUrl && uploadState.metadata && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Upload Results & Overlay Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Compression Info */}
            {uploadState.metadata.compressionInfo && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">C</span>
                  </div>
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    Image Compression
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Original Size
                    </p>
                    <p className="font-medium">
                      {(
                        uploadState.metadata.compressionInfo.originalSize /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Compressed Size
                    </p>
                    <p className="font-medium">
                      {(
                        uploadState.metadata.compressionInfo.compressedSize /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Compression Ratio
                    </p>
                    <p className="font-medium text-green-600">
                      {uploadState.metadata.compressionInfo.compressionRatio.toFixed(
                        1
                      )}
                      % saved
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Quality</p>
                    <p className="font-medium">
                      {(
                        uploadState.metadata.compressionInfo.quality * 100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 dark:text-gray-400">
                      Dimensions
                    </p>
                    <p className="font-medium">
                      {
                        uploadState.metadata.compressionInfo.originalDimensions
                          .width
                      }
                      ×
                      {
                        uploadState.metadata.compressionInfo.originalDimensions
                          .height
                      }{" "}
                      →{" "}
                      {
                        uploadState.metadata.compressionInfo
                          .compressedDimensions.width
                      }
                      ×
                      {
                        uploadState.metadata.compressionInfo
                          .compressedDimensions.height
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Fish className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Fish Detection
                  </span>
                </div>
                {uploadState.metadata.fishInfo &&
                uploadState.metadata.fishInfo.name !== "Unknown" ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>{uploadState.metadata.fishInfo.name}</strong>
                    </p>
                    <p>
                      Confidence:{" "}
                      {Math.round(
                        uploadState.metadata.fishInfo.confidence * 100
                      )}
                      %
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No fish detected</p>
                )}
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Location
                  </span>
                </div>
                {uploadState.metadata.location ? (
                  <p className="text-sm">
                    {uploadState.metadata.location.address ||
                      `${uploadState.metadata.location.latitude.toFixed(4)}, ${uploadState.metadata.location.longitude.toFixed(4)}`}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">No location data</p>
                )}
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">
                    Upload Info
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Status: ✅ Success</p>
                  <p>
                    Time:{" "}
                    {new Date(
                      uploadState.metadata.timestamp
                    ).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview with Overlays */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Preview with Logo & Fish Info Overlay
              </h3>

              <div className="relative inline-block max-w-full">
                {/* Main Image */}
                <img
                  src={uploadState.imageUrl}
                  alt="Uploaded test image"
                  className="max-w-full max-h-96 object-contain rounded-lg border shadow-lg"
                  onError={(e) => {
                    console.error("Failed to load uploaded image");
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Logo Overlay - Top Left */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
                  <img
                    src="/logo-light.svg"
                    alt="Lishka Logo"
                    className="w-10 h-10 dark:hidden"
                    onError={(e) => {
                      // Try dark logo
                      e.currentTarget.src = "/logo-dark.svg";
                      e.currentTarget.onerror = () => {
                        // Fallback to text
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<div class="text-sm font-bold text-blue-600 px-2 py-1">LISHKA</div>';
                        }
                      };
                    }}
                  />
                  <img
                    src="/logo-dark.svg"
                    alt="Lishka Logo"
                    className="w-10 h-10 hidden dark:block"
                    onError={(e) => {
                      // Fallback to text
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div class="text-sm font-bold text-blue-600 px-2 py-1">LISHKA</div>';
                      }
                    }}
                  />
                </div>

                {/* Fish Info Overlay - Bottom */}
                {uploadState.metadata.fishInfo &&
                  uploadState.metadata.fishInfo.name !== "Unknown" && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none rounded-lg">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        {/* Fish Name and Confidence */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Fish className="w-5 h-5" />
                              <span className="font-bold text-xl">
                                {uploadState.metadata.fishInfo.name}
                              </span>
                            </div>
                            {uploadState.metadata.fishInfo.confidence > 0 && (
                              <div className="bg-white/25 backdrop-blur-sm text-white border border-white/30 text-sm px-3 py-1 rounded-full">
                                {Math.round(
                                  uploadState.metadata.fishInfo.confidence * 100
                                )}
                                % confident
                              </div>
                            )}
                          </div>

                          {/* Size and Weight */}
                          <div className="flex items-center gap-6 text-sm">
                            {uploadState.metadata.fishInfo.estimatedSize &&
                              uploadState.metadata.fishInfo.estimatedSize !==
                                "Unknown" && (
                                <div className="flex items-center gap-2">
                                  <Ruler className="w-4 h-4" />
                                  <span className="font-medium">
                                    {
                                      uploadState.metadata.fishInfo
                                        .estimatedSize
                                    }
                                  </span>
                                </div>
                              )}

                            {uploadState.metadata.fishInfo.estimatedWeight &&
                              uploadState.metadata.fishInfo.estimatedWeight !==
                                "Unknown" && (
                                <div className="flex items-center gap-2">
                                  <Weight className="w-4 h-4" />
                                  <span className="font-medium">
                                    {
                                      uploadState.metadata.fishInfo
                                        .estimatedWeight
                                    }
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* Location */}
                          {uploadState.metadata.location && (
                            <div className="flex items-center gap-2 text-sm opacity-90">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {uploadState.metadata.location.address ||
                                  `${uploadState.metadata.location.latitude.toFixed(4)}, ${uploadState.metadata.location.longitude.toFixed(4)}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Processing Statistics */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Processing Statistics:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Image upload: Successful</span>
                  </div>
                  {uploadState.metadata.compressionInfo ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>
                        Image compression:{" "}
                        {uploadState.metadata.compressionInfo.compressionRatio.toFixed(
                          1
                        )}
                        % size reduction
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>Image compression: Not applied</span>
                    </div>
                  )}
                  {uploadState.metadata.fishInfo &&
                  uploadState.metadata.fishInfo.name !== "Unknown" ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>
                        AI fish identification:{" "}
                        {Math.round(
                          uploadState.metadata.fishInfo.confidence * 100
                        )}
                        % confidence
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>AI fish identification: No fish detected</span>
                    </div>
                  )}
                  {uploadState.metadata.location ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Location data: Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>Location data: Not available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Overlay Status */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Overlay Status:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Logo overlay: Active (top-left corner)</span>
                  </div>
                  {uploadState.metadata.fishInfo &&
                  uploadState.metadata.fishInfo.name !== "Unknown" ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Fish info overlay: Active (bottom gradient)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>
                        Fish info overlay: Inactive (no fish detected)
                      </span>
                    </div>
                  )}
                  {uploadState.metadata.location ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Location overlay: Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>Location overlay: Inactive (no location data)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Select an image file (preferably containing a fish for best
              results)
            </li>
            <li>
              Click &quot;Upload & Test&quot; to process and upload the image
            </li>
            <li>View the preview with logo and fish information overlays</li>
            <li>Check the overlay status to see which overlays are active</li>
          </ol>
          <p className="mt-3 text-xs">
            <strong>Note:</strong> Images are automatically compressed before AI
            analysis to reduce costs and improve performance. Fish
            identification requires OpenAI API key. Location data comes from
            image EXIF or browser geolocation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUploadDebugger;
