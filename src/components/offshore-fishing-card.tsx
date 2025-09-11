import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Anchor, Waves, Target } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const fishingIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="white" stroke-width="2"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

interface OffshoreFishingCardProps {
  name?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  userCoordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number;
  depth?: string;
  seabedType?: string;
  structures?: string[];
  probabilityScore?: number;
  description?: string;
  mapImageUrl?: string;
  searchRadius?: number;
  actualDepth?: number | null;
  aiAnalysis?: string;
  topographicFeatures?: string[];
  onClick?: () => void;
}

const OffshoreFishingCard = ({
  name = "Fishing Spot Alpha",
  coordinates,
  userCoordinates,
  distance = 2.3,
  depth = "15-45m",
  seabedType = "Rocky with sand patches",
  structures = ["Artificial reef", "Drop-off"],
  probabilityScore = 0.85,
  description = "Prime fishing location with excellent structure",
  searchRadius = 10,
  actualDepth = null,
  aiAnalysis,
  topographicFeatures,
  onClick = () => {},
}: OffshoreFishingCardProps) => {
  const [showLocationDebug, setShowLocationDebug] = useState<boolean>(false);
  const [showOffshoreFishingDebug, setShowOffshoreFishingDebug] =
    useState<boolean>(false);

  useEffect(() => {
    // Get debug preferences from localStorage
    const debugPreference = localStorage.getItem("showLocationDebug");
    if (debugPreference !== null) {
      setShowLocationDebug(debugPreference === "true");
    }

    const offshoreFishingDebugPreference = localStorage.getItem(
      "showOffshoreFishingDebug",
    );
    if (offshoreFishingDebugPreference !== null) {
      setShowOffshoreFishingDebug(offshoreFishingDebugPreference === "true");
    }

    // Listen for debug setting changes
    const handleDebugChange = () => {
      const newDebugPreference = localStorage.getItem("showLocationDebug");
      if (newDebugPreference !== null) {
        setShowLocationDebug(newDebugPreference === "true");
      }
    };

    const handleOffshoreFishingDebugChange = () => {
      const newOffshoreFishingDebugPreference = localStorage.getItem(
        "showOffshoreFishingDebug",
      );
      if (newOffshoreFishingDebugPreference !== null) {
        setShowOffshoreFishingDebug(
          newOffshoreFishingDebugPreference === "true",
        );
      }
    };

    window.addEventListener("locationDebugChanged", handleDebugChange);
    window.addEventListener(
      "offshoreFishingDebugChanged",
      handleOffshoreFishingDebugChange,
    );

    return () => {
      window.removeEventListener("locationDebugChanged", handleDebugChange);
      window.removeEventListener(
        "offshoreFishingDebugChanged",
        handleOffshoreFishingDebugChange,
      );
    };
  }, []);

  // Ensure we have valid coordinates - if not provided, don't render the card
  if (!coordinates || !userCoordinates) {
    console.warn("OffshoreFishingCard: Missing required coordinates");
    return null;
  }

  // Calculate the center point between user and fishing spot
  const centerLat = (coordinates.lat + userCoordinates.lat) / 2;
  const centerLng = (coordinates.lng + userCoordinates.lng) / 2;

  // Calculate the distance between points to determine appropriate zoom
  const latDiff = Math.abs(coordinates.lat - userCoordinates.lat);
  const lngDiff = Math.abs(coordinates.lng - userCoordinates.lng);
  const maxDiff = Math.max(latDiff, lngDiff);

  // Determine zoom level based on distance between points
  let zoom = 10;
  if (maxDiff > 0.1) zoom = 8;
  else if (maxDiff > 0.05) zoom = 9;
  else if (maxDiff > 0.02) zoom = 10;
  else if (maxDiff > 0.01) zoom = 11;
  else zoom = 12;

  // Create polyline coordinates for the connection line
  const polylinePositions: [number, number][] = [
    [userCoordinates.lat, userCoordinates.lng],
    [coordinates.lat, coordinates.lng],
  ];

  // Convert nautical miles to meters for the circle radius
  // 1 nautical mile = 1852 meters
  const radiusInMeters = searchRadius * 1852;

  // Get probability color and label
  const getProbabilityInfo = () => {
    if (probabilityScore >= 0.8) {
      return {
        color: "bg-green-500",
        label: "Excellent",
        textColor: "text-green-700",
      };
    } else if (probabilityScore >= 0.6) {
      return {
        color: "bg-yellow-500",
        label: "Good",
        textColor: "text-yellow-700",
      };
    } else {
      return {
        color: "bg-orange-500",
        label: "Fair",
        textColor: "text-orange-700",
      };
    }
  };

  const probabilityInfo = getProbabilityInfo();

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col h-full border-0 shadow bg-white rounded-xl w-72 flex-shrink-0"
      onClick={onClick}
    >
      {/* Interactive Map */}
      <div className="relative w-full h-32 overflow-hidden">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          className="rounded-t-2xl"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Search radius circle */}
          <Circle
            center={[userCoordinates.lat, userCoordinates.lng]}
            radius={radiusInMeters}
            pathOptions={{
              color: "#3b82f6",
              weight: 2,
              opacity: 0.4,
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              dashArray: "5, 5",
            }}
          />

          {/* Connection line between points */}
          <Polyline
            positions={polylinePositions}
            color="#3b82f6"
            weight={2}
            opacity={0.8}
            dashArray="5, 5"
          />

          {/* User location marker */}
          <Marker
            position={[userCoordinates.lat, userCoordinates.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-xs">
                <strong>Your Location</strong>
                <br />
                {userCoordinates.lat.toFixed(4)}°,{" "}
                {userCoordinates.lng.toFixed(4)}°
              </div>
            </Popup>
          </Marker>

          {/* Fishing spot marker */}
          <Marker
            position={[coordinates.lat, coordinates.lng]}
            icon={fishingIcon}
          >
            <Popup>
              <div className="text-xs">
                <strong>{name}</strong>
                <br />
                {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
                <br />
                <span className="text-muted-foreground">{description}</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Probability Badge */}
        <div className="absolute top-2 right-2 z-[1000]">
          <Badge
            className={`${probabilityInfo.color} text-white text-xs px-2 py-1 rounded-full shadow-lg`}
          >
            {Math.round(probabilityScore * 100)}%
          </Badge>
        </div>

        {/* Distance Badge */}
        <div className="absolute bottom-2 left-2 z-[1000]">
          <Badge
            variant="secondary"
            className="bg-black/70 text-white text-xs px-2 py-1 rounded-full shadow-lg"
          >
            {distance} NM
          </Badge>
        </div>
      </div>

      <CardContent className="p-3 flex flex-col flex-1">
        {/* Location Name and Coordinates */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">
            {name}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            <span>
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </span>
          </div>
        </div>

        {/* Key Information */}
        <div className="space-y-2 mb-2">
          {/* Depth */}
          <div className="flex items-center text-xs">
            <Waves className="h-3 w-3 text-lishka-lue mr-2 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-foreground">{depth}</span>
              {actualDepth !== null && (
                <span className="text-xs text-muted-foreground">
                  GEBCO: {actualDepth.toFixed(0)}m
                </span>
              )}
            </div>
          </div>

          {/* Seabed Type */}
          <div className="flex items-center text-xs">
            <Anchor className="h-3 w-3 text-gray-600 mr-2 flex-shrink-0" />
            <span className="text-foreground line-clamp-1">{seabedType}</span>
          </div>

          {/* Probability */}
          <div className="flex items-center text-xs">
            <Target className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
            <span className={`font-medium ${probabilityInfo.textColor}`}>
              {probabilityInfo.label} chance
            </span>
          </div>
        </div>

        {/* Structures */}
        {structures && structures.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {structures.slice(0, 2).map((structure, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 rounded-full border-blue-200 text-lishka-blue bg-blue-50"
                >
                  {structure}
                </Badge>
              ))}
              {structures.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 rounded-full border-gray-200 text-gray-600 bg-gray-50"
                >
                  +{structures.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* AI Analysis (if available) */}
        {aiAnalysis && (
          <div className="mb-2">
            <div className="text-xs font-medium text-lishka-blue  mb-1 flex items-center gap-1">
              🤖 AI Analysis
            </div>
            <p className="text-xs text-lishka-blue  line-clamp-2 bg-blue-50 /20 p-2 rounded">
              {aiAnalysis}
            </p>
          </div>
        )}

        {/* Topographic Features (if available) */}
        {topographicFeatures && topographicFeatures.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
              🌊 Topographic Features
            </div>
            <div className="flex flex-wrap gap-1">
              {topographicFeatures.slice(0, 3).map((feature, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 rounded-full border-green-200 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-900/20"
                >
                  {feature}
                </Badge>
              ))}
              {topographicFeatures.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 rounded-full border-gray-200 text-gray-600 bg-gray-50"
                >
                  +{topographicFeatures.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
          {description}
        </p>

        {/* Debug Section - Location Coordinates */}
        {showLocationDebug && coordinates && userCoordinates && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-lishka-blue ">
                    Your Location:
                  </span>
                </div>
                <div className="font-mono text-xs text-gray-600 dark:text-gray-400 ml-3">
                  {userCoordinates.lat.toFixed(6)}°,{" "}
                  {userCoordinates.lng.toFixed(6)}°
                </div>
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    Fishing Spot:
                  </span>
                </div>
                <div className="font-mono text-xs text-gray-600 dark:text-gray-400 ml-3">
                  {coordinates.lat.toFixed(6)}°, {coordinates.lng.toFixed(6)}°
                </div>
              </div>
              <div className="text-xs">
                <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Map Info:
                </div>
                <div className="font-mono text-xs text-gray-500 dark:text-gray-500 ml-3">
                  Center: {centerLat.toFixed(6)}°, {centerLng.toFixed(6)}°
                </div>
                <div className="font-mono text-xs text-gray-500 dark:text-gray-500 ml-3">
                  Zoom: {zoom}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Section - Offshore Fishing Data */}
        {showOffshoreFishingDebug && coordinates && (
          <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-yellow-700 dark:text-yellow-400 text-xs">
                  Raw Location Data:
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Name:</strong> {name}
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Coordinates:</strong> {coordinates.lat.toFixed(6)}°,{" "}
                  {coordinates.lng.toFixed(6)}°
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Depth:</strong> {depth}
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Distance:</strong> {distance} NM
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Calculated Distance:</strong>{" "}
                  {(() => {
                    const R = 3440.065; // Earth's radius in nautical miles
                    const dLat =
                      ((coordinates.lat - userCoordinates.lat) * Math.PI) / 180;
                    const dLng =
                      ((coordinates.lng - userCoordinates.lng) * Math.PI) / 180;
                    const a =
                      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos((userCoordinates.lat * Math.PI) / 180) *
                        Math.cos((coordinates.lat * Math.PI) / 180) *
                        Math.sin(dLng / 2) *
                        Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const calculatedDistance = R * c;
                    return calculatedDistance.toFixed(2);
                  })()}{" "}
                  NM (Real-time)
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Seabed:</strong> {seabedType}
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Probability:</strong> {probabilityScore.toFixed(2)} (
                  {Math.round(probabilityScore * 100)}%)
                </div>
                <div className="font-mono text-yellow-800 dark:text-yellow-300">
                  <strong>Structures:</strong> {structures.join(", ")}
                </div>
                {actualDepth !== null && (
                  <div className="font-mono text-yellow-800 dark:text-yellow-300">
                    <strong>GEBCO Depth:</strong> {actualDepth.toFixed(1)}m
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                {actualDepth !== null
                  ? "✅ Depth data from GEBCO bathymetric database"
                  : "⚠️ Could not fetch depth from GEBCO database"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OffshoreFishingCard;
