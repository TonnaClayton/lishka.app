import EXIF from "exif-js";
import { OPENAI_ENABLED, validateOpenAIConfig } from "./openai-toggle";

export interface ImageMetadata {
  url: string;
  fishInfo?: {
    name: string;
    estimatedSize: string;
    estimatedWeight: string;
    confidence: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  originalFileName?: string;
}

/**
 * Extract EXIF data from an image file
 */
export const extractImageMetadata = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    EXIF.getData(file as any, function () {
      const exifData = EXIF.getAllTags(this);
      console.log("[ImageMetadata] Extracted EXIF data:", exifData);
      resolve(exifData);
    });
  });
};

/**
 * Extract GPS coordinates from EXIF data
 */
export const extractGPSFromEXIF = (
  exifData: any,
): { latitude: number; longitude: number } | null => {
  try {
    const lat = exifData.GPSLatitude;
    const lon = exifData.GPSLongitude;
    const latRef = exifData.GPSLatitudeRef;
    const lonRef = exifData.GPSLongitudeRef;

    if (!lat || !lon) {
      console.log("[ImageMetadata] No GPS data found in EXIF");
      return null;
    }

    // Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
    const convertDMSToDD = (dms: number[], ref: string): number => {
      let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
      if (ref === "S" || ref === "W") {
        dd = dd * -1;
      }
      return dd;
    };

    const latitude = convertDMSToDD(lat, latRef);
    const longitude = convertDMSToDD(lon, lonRef);

    console.log("[ImageMetadata] Extracted GPS coordinates:", {
      latitude,
      longitude,
    });
    return { latitude, longitude };
  } catch (error) {
    console.error("[ImageMetadata] Error extracting GPS from EXIF:", error);
    return null;
  }
};

/**
 * Get current user location as fallback
 */
export const getCurrentLocation = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("[ImageMetadata] Geolocation error:", error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  });
};

/**
 * Convert coordinates to address using reverse geocoding
 */
export const coordinatesToAddress = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    // Extract meaningful location parts
    const address = data.address || {};
    const locationParts = [];

    if (address.city || address.town || address.village) {
      locationParts.push(address.city || address.town || address.village);
    }
    if (address.state) {
      locationParts.push(address.state);
    }
    if (address.country) {
      locationParts.push(address.country);
    }

    return locationParts.join(", ") || "Unknown Location";
  } catch (error) {
    console.error(
      "[ImageMetadata] Error converting coordinates to address:",
      error,
    );
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Identify fish using OpenAI Vision API with timeout
 */
export const identifyFishFromImage = async (
  imageFile: File,
): Promise<{
  name: string;
  estimatedSize: string;
  estimatedWeight: string;
  confidence: number;
} | null> => {
  const startTime = Date.now();
  console.log("🐟 [OPENAI DEBUG] Starting fish identification process", {
    fileName: imageFile.name,
    fileSize: imageFile.size,
    fileType: imageFile.type,
    timestamp: new Date().toISOString(),
  });

  try {
    // Check if OpenAI is enabled and configured
    console.log("🔧 [OPENAI DEBUG] Checking OpenAI configuration", {
      OPENAI_ENABLED,
      hasApiKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      apiKeyLength: import.meta.env.VITE_OPENAI_API_KEY?.length || 0,
    });

    if (!OPENAI_ENABLED || !validateOpenAIConfig()) {
      console.error("❌ [OPENAI DEBUG] OpenAI is disabled or not configured", {
        OPENAI_ENABLED,
        configValid: validateOpenAIConfig(),
      });
      return null;
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ [OPENAI DEBUG] OpenAI API key is missing");
      return null;
    }

    console.log(
      "✅ [OPENAI DEBUG] OpenAI configuration valid, proceeding with request",
    );

    // Convert image to base64 with timeout
    console.log("📷 [OPENAI DEBUG] Converting image to base64...");
    const base64ConversionStart = Date.now();

    const base64Image = await Promise.race([
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log("✅ [OPENAI DEBUG] Image converted to base64", {
            conversionTime: Date.now() - base64ConversionStart,
            base64Length: (reader.result as string).length,
          });
          resolve(reader.result as string);
        };
        reader.onerror = (error) => {
          console.error("❌ [OPENAI DEBUG] Base64 conversion failed:", error);
          reject(error);
        };
        reader.readAsDataURL(imageFile);
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error("⏰ [OPENAI DEBUG] Base64 conversion timeout");
          reject(new Error("File reading timeout"));
        }, 10000);
      }),
    ]);

    console.log("🚀 [OPENAI DEBUG] Making request to OpenAI Vision API...", {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o",
      requestTime: new Date().toISOString(),
    });

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error("⏰ [OPENAI DEBUG] OpenAI request timeout (30s)");
      controller.abort();
    }, 30000); // 30 second timeout

    const requestStart = Date.now();

    try {
      const requestBody = {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a marine biology expert specializing in fish identification. Analyze the image and provide fish identification with size and weight estimates. Respond ONLY with a JSON object in this exact format:
{
  "name": "Fish species name",
  "estimatedSize": "Size with units (e.g., '45 cm' or '18 inches')",
  "estimatedWeight": "Weight with units (e.g., '2.5 kg' or '5.5 lbs')",
  "confidence": 0.85
}

If no fish is clearly visible, respond with: {"name": "Unknown", "estimatedSize": "Unknown", "estimatedWeight": "Unknown", "confidence": 0}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please identify the fish in this image and estimate its size and weight.",
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      };

      console.log("📤 [OPENAI DEBUG] Request payload prepared", {
        messageCount: requestBody.messages.length,
        hasImageContent: requestBody.messages[1].content.some(
          (c: any) => c.type === "image_url",
        ),
        maxTokens: requestBody.max_tokens,
        temperature: requestBody.temperature,
      });

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      const requestTime = Date.now() - requestStart;

      console.log("📥 [OPENAI DEBUG] Received response from OpenAI", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        requestTime,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [OPENAI DEBUG] OpenAI API error response", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("📋 [OPENAI DEBUG] OpenAI response data", {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        usage: data.usage,
        model: data.model,
      });

      const content = data.choices[0].message.content.trim();
      console.log("🎯 [OPENAI DEBUG] Raw OpenAI response content:", content);

      // Parse the JSON response
      let fishInfo;
      try {
        fishInfo = JSON.parse(content);
        console.log(
          "✅ [OPENAI DEBUG] Successfully parsed JSON response",
          fishInfo,
        );
      } catch (parseError) {
        console.error("❌ [OPENAI DEBUG] Failed to parse JSON response", {
          content,
          parseError: parseError.message,
        });
        return null;
      }

      // Validate the response structure
      const isValid =
        fishInfo.name &&
        fishInfo.estimatedSize &&
        fishInfo.estimatedWeight &&
        typeof fishInfo.confidence === "number";

      console.log("🔍 [OPENAI DEBUG] Response validation", {
        isValid,
        hasName: !!fishInfo.name,
        hasSize: !!fishInfo.estimatedSize,
        hasWeight: !!fishInfo.estimatedWeight,
        hasConfidence: typeof fishInfo.confidence === "number",
        fishInfo,
      });

      if (isValid) {
        const totalTime = Date.now() - startTime;
        console.log("🎉 [OPENAI DEBUG] Fish identification successful!", {
          fishInfo,
          totalTime,
          requestTime,
        });
        return fishInfo;
      } else {
        console.warn(
          "⚠️ [OPENAI DEBUG] Invalid fish identification response structure",
          {
            fishInfo,
            expectedFields: [
              "name",
              "estimatedSize",
              "estimatedWeight",
              "confidence",
            ],
          },
        );
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const totalTime = Date.now() - startTime;

      if (fetchError.name === "AbortError") {
        console.error(
          "⏰ [OPENAI DEBUG] Fish identification request timed out",
          {
            totalTime,
            timeout: "30 seconds",
          },
        );
        throw new Error("Fish identification timed out");
      }

      console.error("❌ [OPENAI DEBUG] Network/fetch error", {
        error: fetchError.message,
        errorName: fetchError.name,
        totalTime,
      });
      throw fetchError;
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("💥 [OPENAI DEBUG] Complete fish identification failure", {
      error: error.message,
      errorType: error.constructor.name,
      totalTime,
      stack: error.stack,
    });
    return null;
  }
};

/**
 * Process uploaded image and extract all metadata with timeout
 */
export const processImageUpload = async (
  file: File,
): Promise<ImageMetadata> => {
  console.log("[ImageMetadata] Processing image upload:", file.name);

  const metadata: ImageMetadata = {
    url: "", // Will be set after upload
    timestamp: new Date().toISOString(),
    originalFileName: file.name,
  };

  // Set overall timeout for metadata processing
  const processingTimeout = new Promise<ImageMetadata>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Metadata processing timeout"));
    }, 45000); // 45 second total timeout
  });

  const processingPromise = (async (): Promise<ImageMetadata> => {
    try {
      // Extract EXIF data with timeout
      const exifData = await Promise.race([
        extractImageMetadata(file),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("EXIF extraction timeout")), 5000);
        }),
      ]);

      // Try to get location from EXIF first
      let location = extractGPSFromEXIF(exifData);

      // If no GPS in EXIF, try to get current location with timeout
      if (!location) {
        try {
          console.log(
            "[ImageMetadata] No GPS in EXIF, trying current location...",
          );
          location = await Promise.race([
            getCurrentLocation(),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Location timeout")), 10000);
            }),
          ]);
        } catch (error) {
          console.log(
            "[ImageMetadata] Could not get current location:",
            error.message,
          );
        }
      }

      // Convert coordinates to address if we have location
      if (location) {
        try {
          const address = await Promise.race([
            coordinatesToAddress(location.latitude, location.longitude),
            new Promise<string>((_, reject) => {
              setTimeout(() => reject(new Error("Geocoding timeout")), 10000);
            }),
          ]);
          metadata.location = {
            ...location,
            address,
          };
          console.log("[ImageMetadata] Location extracted:", metadata.location);
        } catch (error) {
          console.error("[ImageMetadata] Error getting address:", error);
          metadata.location = location;
        }
      }

      // Identify fish using OpenAI Vision API with timeout
      try {
        console.log(
          "🔍 [METADATA DEBUG] Starting fish identification process...",
        );
        const fishIdentificationStart = Date.now();

        const fishInfo = await Promise.race([
          identifyFishFromImage(file),
          new Promise<null>((_, reject) => {
            setTimeout(() => {
              console.error(
                "⏰ [METADATA DEBUG] Fish identification timeout (30s)",
              );
              reject(new Error("Fish identification timeout"));
            }, 30000);
          }),
        ]);

        const fishIdentificationTime = Date.now() - fishIdentificationStart;
        console.log("⏱️ [METADATA DEBUG] Fish identification completed", {
          time: fishIdentificationTime,
          hasFishInfo: !!fishInfo,
          fishName: fishInfo?.name,
          confidence: fishInfo?.confidence,
        });

        if (fishInfo && fishInfo.name !== "Unknown") {
          metadata.fishInfo = fishInfo;
          console.log(
            "🎉 [METADATA DEBUG] Fish identification successful - adding to metadata",
            {
              fishInfo,
              metadataHasFishInfo: !!metadata.fishInfo,
            },
          );
        } else {
          console.log(
            "ℹ️ [METADATA DEBUG] No fish identified or low confidence",
            {
              fishInfo,
              reason:
                fishInfo?.name === "Unknown"
                  ? "Unknown fish"
                  : "No fish info returned",
            },
          );
        }
      } catch (error) {
        console.error("❌ [METADATA DEBUG] Fish identification failed", {
          error: error.message,
          errorType: error.constructor.name,
          willContinueWithoutFishInfo: true,
        });
        // Don't fail the entire process if fish identification fails
      }
    } catch (error) {
      console.error("[ImageMetadata] Error processing image metadata:", error);
      // Return partial metadata even if some processing fails
    }

    console.log("[ImageMetadata] Final metadata:", metadata);
    return metadata;
  })();

  try {
    return await Promise.race([processingPromise, processingTimeout]);
  } catch (error) {
    console.error(
      "[ImageMetadata] Metadata processing failed or timed out:",
      error,
    );
    // Return basic metadata if processing fails
    return metadata;
  }
};
