import React, { useState, useRef } from "react";
import { processImageUpload, ImageMetadata } from "@/lib/image-metadata";
import { getBlobStorageStatus } from "@/lib/blob-storage";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Fish,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { config } from "@/lib/config";
import { log } from "@/lib/logging";

interface ImageDebugResult {
  file: File;
  metadata: ImageMetadata | null;
  error: string | null;
  processingTime: number;
  overlayWouldShow: boolean;
  debugInfo: {
    hasMetadata: boolean;
    hasFishInfo: boolean;
    hasLocation: boolean;
    fishName: string;
    fishSize: string;
    fishWeight: string;
    fishConfidence: number;
    locationAddress: string;
    userConfirmed: boolean;
  };
}

const ImageDebugTest = () => {
  const [workingImage, setWorkingImage] = useState<ImageDebugResult | null>(
    null,
  );
  const [nonWorkingImage, setNonWorkingImage] =
    useState<ImageDebugResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<{
    working: boolean;
    nonWorking: boolean;
  }>({
    working: false,
    nonWorking: false,
  });
  const [envStatus, setEnvStatus] = useState<any>(null);

  const workingFileRef = useRef<HTMLInputElement>(null);
  const nonWorkingFileRef = useRef<HTMLInputElement>(null);

  // Check environment status
  React.useEffect(() => {
    const checkEnvStatus = () => {
      const blobStatus = getBlobStorageStatus();
      const status = {
        blob: blobStatus,
        openai: {
          hasKey: !!config.VITE_OPENAI_API_KEY,
          keyLength: config.VITE_OPENAI_API_KEY?.length || 0,
          keyPrefix: config.VITE_OPENAI_API_KEY?.substring(0, 7) || "N/A",
        },
        supabase: {
          hasUrl: !!config.VITE_SUPABASE_URL,
          hasKey: !!config.VITE_SUPABASE_ANON_KEY,
        },
      };
      setEnvStatus(status);
    };
    checkEnvStatus();
  }, []);

  // Function to determine if overlay would show based on metadata
  const shouldShowOverlay = (metadata: ImageMetadata | null): boolean => {
    if (!metadata) return false;

    const hasFishInfo =
      metadata.fishInfo &&
      (metadata.fishInfo.name !== "Unknown" ||
        metadata.fishInfo.estimatedSize !== "Unknown" ||
        metadata.fishInfo.estimatedWeight !== "Unknown");
    const hasLocation = metadata.location && metadata.location.address;

    return Boolean(hasFishInfo || hasLocation);
  };

  // Process image and extract debug information
  const processImage = async (file: File, type: "working" | "nonWorking") => {
    const startTime = Date.now();

    setIsProcessing((prev) => ({
      ...prev,
      [type === "working" ? "working" : "nonWorking"]: true,
    }));

    try {
      log(`🔍 [IMAGE DEBUG] Processing ${type} image:`, file.name);

      const metadata = await processImageUpload(file);
      const processingTime = Date.now() - startTime;
      const overlayWouldShow = shouldShowOverlay(metadata);

      const debugInfo = {
        hasMetadata: !!metadata,
        hasFishInfo: !!metadata?.fishInfo,
        hasLocation: !!metadata?.location,
        fishName: metadata?.fishInfo?.name || "N/A",
        fishSize: metadata?.fishInfo?.estimatedSize || "N/A",
        fishWeight: metadata?.fishInfo?.estimatedWeight || "N/A",
        fishConfidence: metadata?.fishInfo?.confidence || 0,
        locationAddress: metadata?.location?.address || "N/A",
        userConfirmed: metadata?.userConfirmed || false,
      };

      const result: ImageDebugResult = {
        file,
        metadata,
        error: null,
        processingTime,
        overlayWouldShow,
        debugInfo,
      };

      log(`✅ [IMAGE DEBUG] ${type} image processed successfully:`, result);

      if (type === "working") {
        setWorkingImage(result);
      } else {
        setNonWorkingImage(result);
      }
    } catch (error) {
      console.error(`❌ [IMAGE DEBUG] Error processing ${type} image:`, error);

      const result: ImageDebugResult = {
        file,
        metadata: null,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime: Date.now() - startTime,
        overlayWouldShow: false,
        debugInfo: {
          hasMetadata: false,
          hasFishInfo: false,
          hasLocation: false,
          fishName: "N/A",
          fishSize: "N/A",
          fishWeight: "N/A",
          fishConfidence: 0,
          locationAddress: "N/A",
          userConfirmed: false,
        },
      };

      if (type === "working") {
        setWorkingImage(result);
      } else {
        setNonWorkingImage(result);
      }
    } finally {
      setIsProcessing((prev) => ({
        ...prev,
        [type === "working" ? "working" : "nonWorking"]: false,
      }));
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "working" | "nonWorking",
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file, type);
    }
  };

  const renderImageResult = (
    result: ImageDebugResult | null,
    title: string,
  ) => {
    if (!result) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No image selected</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Image Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <ImageIcon className="w-8 h-8 text-gray-600" />
          <div>
            <p className="font-medium">{result.file.name}</p>
            <p className="text-sm text-gray-500">
              {(result.file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
              {result.file.type}
            </p>
          </div>
        </div>

        {/* Processing Status */}
        <div className="flex items-center gap-2">
          {result.error ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          <span className={result.error ? "text-red-600" : "text-green-600"}>
            {result.error ? "Processing Failed" : "Processing Successful"}
          </span>
          <Badge variant="outline">{result.processingTime}ms</Badge>
        </div>

        {/* Error Display */}
        {result.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}

        {/* Overlay Status */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {result.overlayWouldShow ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">
              Overlay Would {result.overlayWouldShow ? "Show" : "NOT Show"}
            </span>
          </div>
        </div>

        {/* Debug Information */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Fish className="w-4 h-4" />
            Fish Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Has Fish Info:</span>
              <Badge
                variant={result.debugInfo.hasFishInfo ? "default" : "secondary"}
              >
                {result.debugInfo.hasFishInfo ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Fish Name:</span>
              <span className="font-mono text-xs">
                {result.debugInfo.fishName}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Size:</span>
              <span className="font-mono text-xs">
                {result.debugInfo.fishSize}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Weight:</span>
              <span className="font-mono text-xs">
                {result.debugInfo.fishWeight}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-mono text-xs">
                {(result.debugInfo.fishConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>User Confirmed:</span>
              <Badge
                variant={
                  result.debugInfo.userConfirmed ? "default" : "secondary"
                }
              >
                {result.debugInfo.userConfirmed ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          <Separator />

          <h4 className="font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Information
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Has Location:</span>
              <Badge
                variant={result.debugInfo.hasLocation ? "default" : "secondary"}
              >
                {result.debugInfo.hasLocation ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Address:</span>
              <span className="font-mono text-xs break-all">
                {result.debugInfo.locationAddress}
              </span>
            </div>
          </div>

          {/* Raw Metadata */}
          <Separator />
          <details className="space-y-2">
            <summary className="font-medium cursor-pointer hover:text-blue-600">
              Raw Metadata (Click to expand)
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(result.metadata, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!workingImage || !nonWorkingImage) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Upload both images to see comparison</p>
        </div>
      );
    }

    const differences = [];

    // Compare overlay status
    if (workingImage.overlayWouldShow !== nonWorkingImage.overlayWouldShow) {
      differences.push({
        field: "Overlay Display",
        working: workingImage.overlayWouldShow ? "Shows" : "Hidden",
        nonWorking: nonWorkingImage.overlayWouldShow ? "Shows" : "Hidden",
        critical: true,
      });
    }

    // Compare fish info
    if (
      workingImage.debugInfo.hasFishInfo !==
      nonWorkingImage.debugInfo.hasFishInfo
    ) {
      differences.push({
        field: "Has Fish Info",
        working: workingImage.debugInfo.hasFishInfo ? "Yes" : "No",
        nonWorking: nonWorkingImage.debugInfo.hasFishInfo ? "Yes" : "No",
        critical: true,
      });
    }

    if (
      workingImage.debugInfo.fishName !== nonWorkingImage.debugInfo.fishName
    ) {
      differences.push({
        field: "Fish Name",
        working: workingImage.debugInfo.fishName,
        nonWorking: nonWorkingImage.debugInfo.fishName,
        critical: false,
      });
    }

    // Compare location info
    if (
      workingImage.debugInfo.hasLocation !==
      nonWorkingImage.debugInfo.hasLocation
    ) {
      differences.push({
        field: "Has Location",
        working: workingImage.debugInfo.hasLocation ? "Yes" : "No",
        nonWorking: nonWorkingImage.debugInfo.hasLocation ? "Yes" : "No",
        critical: true,
      });
    }

    // Compare processing success
    if (!!workingImage.error !== !!nonWorkingImage.error) {
      differences.push({
        field: "Processing Status",
        working: workingImage.error ? "Failed" : "Success",
        nonWorking: nonWorkingImage.error ? "Failed" : "Success",
        critical: true,
      });
    }

    return (
      <div className="space-y-4">
        {differences.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No significant differences found between the two images. Both
              should behave similarly.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert
              variant={
                differences.some((d) => d.critical) ? "destructive" : "default"
              }
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {differences.length} difference(s) between the images.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {differences.map((diff, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    diff.critical
                      ? "border-red-200 bg-red-50"
                      : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    {diff.critical ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    {diff.field}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">
                        Working Image:
                      </span>
                      <div className="font-mono">{diff.working}</div>
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">
                        Non-Working Image:
                      </span>
                      <div className="font-mono">{diff.nonWorking}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Image Overlay Debug System
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload a working image and a non-working image to compare their
          metadata and identify why the overlay isn't showing.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Test</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Working Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-green-600">
                    Working Image
                  </h3>
                  <Button
                    onClick={() => workingFileRef.current?.click()}
                    disabled={isProcessing.working}
                    variant="outline"
                    size="sm"
                  >
                    {isProcessing.working ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing.working ? "Processing..." : "Upload"}
                  </Button>
                  <input
                    ref={workingFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "working")}
                    className="hidden"
                  />
                </div>
                {renderImageResult(workingImage, "Working Image")}
              </div>

              {/* Non-Working Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-red-600">
                    Non-Working Image
                  </h3>
                  <Button
                    onClick={() => nonWorkingFileRef.current?.click()}
                    disabled={isProcessing.nonWorking}
                    variant="outline"
                    size="sm"
                  >
                    {isProcessing.nonWorking ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing.nonWorking ? "Processing..." : "Upload"}
                  </Button>
                  <input
                    ref={nonWorkingFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "nonWorking")}
                    className="hidden"
                  />
                </div>
                {renderImageResult(nonWorkingImage, "Non-Working Image")}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <h3 className="text-lg font-semibold">Image Comparison</h3>
            {renderComparison()}
          </TabsContent>

          <TabsContent value="environment" className="space-y-4">
            <h3 className="text-lg font-semibold">Environment Status</h3>
            {envStatus && (
              <div className="space-y-4">
                {/* Blob Storage */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Blob Storage</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Configured:</span>
                      <Badge
                        variant={
                          envStatus.blob.configured ? "default" : "destructive"
                        }
                      >
                        {envStatus.blob.configured ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Has Token:</span>
                      <Badge
                        variant={
                          envStatus.blob.hasToken ? "default" : "destructive"
                        }
                      >
                        {envStatus.blob.hasToken ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {envStatus.blob.tokenLength && (
                      <div className="flex justify-between">
                        <span>Token Length:</span>
                        <span>{envStatus.blob.tokenLength}</span>
                      </div>
                    )}
                    {envStatus.blob.error && (
                      <div className="text-red-600 text-xs">
                        {envStatus.blob.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* OpenAI */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">OpenAI</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Has API Key:</span>
                      <Badge
                        variant={
                          envStatus.openai.hasKey ? "default" : "destructive"
                        }
                      >
                        {envStatus.openai.hasKey ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Key Length:</span>
                      <span>{envStatus.openai.keyLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Key Prefix:</span>
                      <span className="font-mono">
                        {envStatus.openai.keyPrefix}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supabase */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Supabase</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Has URL:</span>
                      <Badge
                        variant={
                          envStatus.supabase.hasUrl ? "default" : "destructive"
                        }
                      >
                        {envStatus.supabase.hasUrl ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Has Key:</span>
                      <Badge
                        variant={
                          envStatus.supabase.hasKey ? "default" : "destructive"
                        }
                      >
                        {envStatus.supabase.hasKey ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImageDebugTest;
