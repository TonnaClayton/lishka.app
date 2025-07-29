import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { overlayService } from "@/lib/overlay-service";
import { ImageMetadata } from "@/lib/image-metadata";
import FishInfoOverlay from "./fish-info-overlay";
import { Smartphone, Monitor, Fish, MapPin } from "lucide-react";

const MobileOverlayDebugger: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [testMetadata, setTestMetadata] = useState<ImageMetadata | null>(null);
  const [overlayDecision, setOverlayDecision] = useState<any>(null);
  const [showTestOverlay, setShowTestOverlay] = useState(false);

  useEffect(() => {
    const info = overlayService.getDeviceInfo();
    setDeviceInfo(info);

    // Create test metadata with fish info
    const testData: ImageMetadata = {
      url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
      timestamp: new Date().toISOString(),
      fishInfo: {
        name: "Test Bass",
        estimatedSize: "45 cm",
        estimatedWeight: "2.5 kg",
        confidence: 0.85,
      },
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        address: "New York, NY, USA",
      },
    };
    setTestMetadata(testData);

    // Test overlay decision
    const decision = {
      shouldShowOverlay: overlayService.shouldShowOverlay(testData, true),
      hasFishInfo: overlayService.hasFishInformation(testData),
      hasLocation: overlayService.hasLocationInformation(testData),
      isMobile: overlayService.isMobileDevice(),
    };
    setOverlayDecision(decision);
  }, []);

  const runOverlayTest = () => {
    setShowTestOverlay(true);
    setTimeout(() => setShowTestOverlay(false), 5000);
  };

  if (!deviceInfo || !testMetadata || !overlayDecision) {
    return <div>Loading debug info...</div>;
  }

  return (
    <div className="bg-white min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {deviceInfo.isMobile ? (
                <Smartphone className="w-6 h-6" />
              ) : (
                <Monitor className="w-6 h-6" />
              )}
              Mobile Overlay Debugger
              <Badge variant={deviceInfo.isMobile ? "default" : "secondary"}>
                {deviceInfo.isMobile ? "Mobile" : "Desktop"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Device Information</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Is Mobile:</strong>{" "}
                    {deviceInfo.isMobile ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>User Agent:</strong>{" "}
                    {deviceInfo.userAgent.substring(0, 50)}...
                  </p>
                  <p>
                    <strong>Platform:</strong> {deviceInfo.platform}
                  </p>
                  <p>
                    <strong>Connection:</strong>{" "}
                    {deviceInfo.connection?.effectiveType || "Unknown"}
                  </p>
                  <p>
                    <strong>Viewport:</strong> {window.innerWidth}x
                    {window.innerHeight}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Overlay Decision</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Should Show Overlay:</strong>
                    <Badge
                      variant={
                        overlayDecision.shouldShowOverlay
                          ? "default"
                          : "destructive"
                      }
                    >
                      {overlayDecision.shouldShowOverlay ? "Yes" : "No"}
                    </Badge>
                  </p>
                  <p>
                    <strong>Has Fish Info:</strong>
                    <Badge
                      variant={
                        overlayDecision.hasFishInfo ? "default" : "secondary"
                      }
                    >
                      {overlayDecision.hasFishInfo ? "Yes" : "No"}
                    </Badge>
                  </p>
                  <p>
                    <strong>Has Location:</strong>
                    <Badge
                      variant={
                        overlayDecision.hasLocation ? "default" : "secondary"
                      }
                    >
                      {overlayDecision.hasLocation ? "Yes" : "No"}
                    </Badge>
                  </p>
                  <p>
                    <strong>Is Mobile Device:</strong>
                    <Badge
                      variant={
                        overlayDecision.isMobile ? "default" : "secondary"
                      }
                    >
                      {overlayDecision.isMobile ? "Yes" : "No"}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Fish className="w-4 h-4" />
                  Fish Information
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Name:</strong> {testMetadata.fishInfo?.name}
                  </p>
                  <p>
                    <strong>Size:</strong>{" "}
                    {testMetadata.fishInfo?.estimatedSize}
                  </p>
                  <p>
                    <strong>Weight:</strong>{" "}
                    {testMetadata.fishInfo?.estimatedWeight}
                  </p>
                  <p>
                    <strong>Confidence:</strong>{" "}
                    {Math.round((testMetadata.fishInfo?.confidence || 0) * 100)}
                    %
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Information
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Address:</strong> {testMetadata.location?.address}
                  </p>
                  <p>
                    <strong>Coordinates:</strong>{" "}
                    {testMetadata.location?.latitude},{" "}
                    {testMetadata.location?.longitude}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overlay Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runOverlayTest} className="w-full">
                Test Overlay Rendering (5 seconds)
              </Button>

              <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={testMetadata.url}
                  alt="Test fish"
                  className="w-full h-full object-cover"
                />

                {showTestOverlay && <FishInfoOverlay metadata={testMetadata} />}

                {!showTestOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    Click "Test Overlay Rendering" to see overlay
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Console</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs bg-gray-100 p-4 rounded-lg font-mono max-h-64 overflow-y-auto">
              <p>Open browser console to see detailed debug logs.</p>
              <p>
                Look for logs starting with "🔍 [OVERLAY SERVICE]" and "🔍 [FISH
                INFO OVERLAY]"
              </p>
              <p className="mt-2 text-blue-600">Expected behavior on mobile:</p>
              <p>- shouldShowOverlay should be TRUE</p>
              <p>- Overlay should render and be visible</p>
              <p>- Fish info and location should display</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileOverlayDebugger;
