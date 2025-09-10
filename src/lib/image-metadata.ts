import EXIF from "exif-js";
import { OPENAI_ENABLED, validateOpenAIConfig } from "./openai-toggle";
import { error as logError, log, warn as warnLog } from "./logging";
import { config } from "@/lib/config";

export interface ImageMetadata {
  url: string;
  fishInfo?: {
    debugInfo?: any;
    openaiPrompt?: string;
    rawJsonResponse?: any;
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
  userConfirmed?: boolean;
  cacheBuster?: number;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: number;
    originalDimensions: { width: number; height: number };
    compressedDimensions: { width: number; height: number };
  };
}

/**
 * Compress an image file to reduce size while maintaining quality
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8,
): Promise<{
  compressedFile: File;
  compressionInfo: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: number;
    originalDimensions: { width: number; height: number };
    compressedDimensions: { width: number; height: number };
  };
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".jpg"),
            {
              type: "image/jpeg",
              lastModified: Date.now(),
            },
          );

          const compressionInfo = {
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio:
              ((file.size - compressedFile.size) / file.size) * 100,
            quality,
            originalDimensions: {
              width: originalWidth,
              height: originalHeight,
            },
            compressedDimensions: { width, height },
          };

          log("🗜️ [IMAGE COMPRESSION] Compression completed:", {
            originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            compressedSize: `${(compressedFile.size / (1024 * 1024)).toFixed(
              2,
            )}MB`,
            compressionRatio: `${compressionInfo.compressionRatio.toFixed(1)}%`,
            originalDimensions: compressionInfo.originalDimensions,
            compressedDimensions: compressionInfo.compressedDimensions,
            quality: `${quality * 100}%`,
          });

          resolve({ compressedFile, compressionInfo });
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Extract EXIF data from an image file
 */
export const extractImageMetadata = (file: File): Promise<any> => {
  return new Promise((resolve) => {
    EXIF.getData(file as any, function () {
      const exifData = EXIF.getAllTags(this);
      log("[ImageMetadata] Extracted EXIF data:", exifData);
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
      log("[ImageMetadata] No GPS data found in EXIF");
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

    log("[ImageMetadata] Extracted GPS coordinates:", {
      latitude,
      longitude,
    });
    return { latitude, longitude };
  } catch (error) {
    logError("[ImageMetadata] Error extracting GPS from EXIF:", error);
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
        logError("[ImageMetadata] Geolocation error:", error);
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
    logError("[ImageMetadata] Error converting coordinates to address:", error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Identify fish using OpenAI Vision API with timeout and image compression
 */
export const identifyFishFromImage = async (
  imageFile: File,
): Promise<{
  name: string;
  estimatedSize: string;
  estimatedWeight: string;
  confidence: number;
  debugInfo?: any;
  openaiPrompt?: string;
  rawJsonResponse?: string;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: number;
    originalDimensions: { width: number; height: number };
    compressedDimensions: { width: number; height: number };
  };
}> => {
  const startTime = Date.now();
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  log("🐟 [MOBILE OPENAI DEBUG] Starting fish identification process", {
    fileName: imageFile.name,
    fileSize: imageFile.size,
    fileType: imageFile.type,
    timestamp: new Date().toISOString(),
    isMobile,
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      connection: (navigator as any).connection
        ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt,
          }
        : "unknown",
      deviceMemory: (navigator as any).deviceMemory || "unknown",
    },
  });

  // Store debug information in the metadata for later retrieval
  const debugInfo = {
    startTime: Date.now(),
    fileName: imageFile.name,
    fileSize: imageFile.size,
    fileType: imageFile.type,
    isMobile,
    openaiEnabled: OPENAI_ENABLED,
    hasApiKey: !!config.VITE_OPENAI_API_KEY,
    configValid: validateOpenAIConfig(),
    processingSteps: [] as string[],
  };

  try {
    // Check if OpenAI is enabled and configured
    log("🔧 [MOBILE OPENAI DEBUG] Checking OpenAI configuration", {
      OPENAI_ENABLED,
      hasApiKey: !!config.VITE_OPENAI_API_KEY,
      apiKeyLength: config.VITE_OPENAI_API_KEY?.length || 0,
      apiKeyPrefix: config.VITE_OPENAI_API_KEY?.substring(0, 7) || "N/A",
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
    });

    if (!OPENAI_ENABLED) {
      logError("❌ [MOBILE OPENAI DEBUG] OpenAI is disabled in configuration", {
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
      });
      debugInfo.processingSteps.push("OpenAI disabled in configuration");
      return {
        name: "Unknown",
        estimatedSize: "Unknown",
        estimatedWeight: "Unknown",
        confidence: 0,
        debugInfo,
      };
    }

    const apiKey = config.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      logError("❌ [MOBILE OPENAI DEBUG] OpenAI API key is missing", {
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
      });
      debugInfo.processingSteps.push("OpenAI API key is missing");
      return {
        name: "Unknown",
        estimatedSize: "Unknown",
        estimatedWeight: "Unknown",
        confidence: 0,
        debugInfo,
      };
    }

    if (!validateOpenAIConfig()) {
      logError(
        "❌ [MOBILE OPENAI DEBUG] OpenAI configuration validation failed",
        {
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
        },
      );
      debugInfo.processingSteps.push("OpenAI configuration validation failed");
      return {
        name: "Unknown",
        estimatedSize: "Unknown",
        estimatedWeight: "Unknown",
        confidence: 0,
        debugInfo,
      };
    }

    log(
      "✅ [MOBILE OPENAI DEBUG] OpenAI configuration valid, proceeding with request",
      {
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
      },
    );

    // Skip compression here since it should already be done in ProfilePage
    // This prevents double-compression and ensures consistent behavior
    const processedFile = imageFile;
    let compressionInfo:
      | {
          originalSize: number;
          compressedSize: number;
          compressionRatio: number;
          quality: number;
          originalDimensions: { width: number; height: number };
          compressedDimensions: { width: number; height: number };
        }
      | undefined;

    log(
      "ℹ️ [MOBILE OPENAI DEBUG] Using pre-processed file (compression handled upstream):",
      {
        isMobile,
        fileSize: imageFile.size,
        fileSizeInMB: (imageFile.size / (1024 * 1024)).toFixed(2),
        deviceType: isMobile ? "mobile" : "desktop",
        reason:
          "Compression should be handled in ProfilePage before this function",
        isOptimalSize: imageFile.size < 3 * 1024 * 1024, // Under 3MB is good for AI
      },
    );

    // Convert image to base64 with timeout
    log("📷 [MOBILE OPENAI DEBUG] Converting image to base64...", {
      isMobile,
      fileSize: processedFile.size,
      fileSizeInMB: (processedFile.size / (1024 * 1024)).toFixed(2),
      deviceType: isMobile ? "mobile" : "desktop",
      isCompressed: processedFile !== imageFile,
    });
    const base64ConversionStart = Date.now();

    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        log("✅ [MOBILE OPENAI DEBUG] Image converted to base64", {
          conversionTime: Date.now() - base64ConversionStart,
          base64Length: (reader.result as string).length,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          base64SizeInMB: (
            ((reader.result as string).length * 0.75) /
            (1024 * 1024)
          ).toFixed(2),
          isCompressed: processedFile !== imageFile,
        });
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        logError("❌ [MOBILE OPENAI DEBUG] Base64 conversion failed:", {
          error,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          fileSize: processedFile.size,
        });
        debugInfo.processingSteps.push(`Base64 conversion failed: ${error}`);
        reject(error);
      };
      reader.readAsDataURL(processedFile);
    });

    log("🚀 [MOBILE OPENAI DEBUG] Making request to OpenAI Vision API...", {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o",
      requestTime: new Date().toISOString(),
      isMobile,
      deviceType: isMobile ? "mobile" : "desktop",
      connectionInfo: (navigator as any).connection
        ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt,
          }
        : "unknown",
    });

    // Add timeout to the fetch request with mobile-specific handling
    const controller = new AbortController();
    const timeoutDuration = isMobile ? 90000 : 60000; // Much longer timeout for larger files
    const timeoutId = setTimeout(() => {
      logError("⏰ [MOBILE OPENAI DEBUG] OpenAI request timeout", {
        isMobile,
        timeoutDuration,
        deviceType: isMobile ? "mobile" : "desktop",
      });
      controller.abort();
    }, timeoutDuration);

    const requestStart = Date.now();

    try {
      const requestBody = {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a marine biology expert specializing in fish identification and precise measurement. Your task is to provide highly accurate fish size and weight estimates with NARROW, PRECISE ranges.

MEASUREMENT METHODOLOGY:
1. REFERENCE POINT ANALYSIS - Use multiple reference objects for size calculation:
   - Fish eye diameter (typically 3-8% of fish total length depending on species)
   - Human hand (average adult hand length: 18-19cm)
   - Human head (average adult head length: 23-25cm)
   - Human eye (average diameter: 2.4cm)
   - Any other visible objects with known dimensions

2. PRECISION MEASUREMENT PROCESS:
   - Measure how many times each reference point fits into the fish length
   - Calculate fish size using each reference point separately
   - Average the results from multiple reference points
   - Be DECISIVE and provide narrow ranges (±2-5% maximum)

3. RANGE GUIDELINES - CRITICAL:
   - HIGH CONFIDENCE (0.8+): Provide single measurement or ±1-2cm range (e.g., "45 cm" or "44-46 cm")
   - MEDIUM CONFIDENCE (0.6-0.8): Provide narrow range ±2-3cm (e.g., "43-47 cm")
   - LOW CONFIDENCE (0.3-0.6): Provide slightly wider range ±3-5cm (e.g., "42-50 cm")
   - NEVER exceed ±10% range unless confidence is very low (<0.4)

4. WEIGHT CALCULATION:
   - Use the calculated size and identified fish species
   - Apply species-specific length-weight relationships
   - Provide proportionally narrow weight ranges
   - Match weight precision to size precision

5. DECISION MAKING:
   - Be confident in your measurements when reference points are clear
   - Don't hedge unnecessarily - commit to precise estimates
   - Factor in photo perspective but don't over-compensate
   - Trust your analysis and provide decisive measurements

RESPONSE FORMAT - Respond ONLY with a JSON object:
{
  "name": "Fish species name",
  "estimatedSize": "Precise size with units (e.g., '45 cm', '44-46 cm', or '17.5 inches')",
  "estimatedWeight": "Precise weight with units (e.g., '2.2 kg', '2.1-2.4 kg', or '4.8 lbs')",
  "confidence": 0.85
}

CRITICAL REQUIREMENTS:
- NARROW RANGES: Size ranges should typically be 2-4cm wide, weight ranges 0.2-0.5kg wide
- BE DECISIVE: When you have good reference points, provide single values or very narrow ranges
- PRECISION OVER CAUTION: It's better to be precise than overly cautious with wide ranges
- If no fish is clearly visible: {"name": "Unknown", "estimatedSize": "Unknown", "estimatedWeight": "Unknown", "confidence": 0}
- Match confidence to range width: Higher confidence = narrower ranges`,
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

      log("📤 [MOBILE OPENAI DEBUG] Request payload prepared", {
        messageCount: requestBody.messages.length,
        hasImageContent: Array.isArray(requestBody.messages[1].content)
          ? requestBody.messages[1].content.some(
              (c: any) => c.type === "image_url",
            )
          : false,
        maxTokens: requestBody.max_tokens,
        temperature: requestBody.temperature,
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        payloadSize: JSON.stringify(requestBody).length,
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
          // Add headers to handle larger payloads
          keepalive: false,
        },
      );

      clearTimeout(timeoutId);
      const requestTime = Date.now() - requestStart;

      log("📥 [MOBILE OPENAI DEBUG] Received response from OpenAI", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        requestTime,
        headers: Object.fromEntries(response.headers.entries()),
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        isSlowResponse: requestTime > 20000,
      });
      debugInfo.processingSteps.push(
        `OpenAI response received (${response.status}, ${requestTime}ms)`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        logError("❌ [MOBILE OPENAI DEBUG] OpenAI API error response", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          isMobile,
          deviceType: isMobile ? "mobile" : "desktop",
          requestTime,
        });
        debugInfo.processingSteps.push(
          `OpenAI API error: ${response.status} - ${errorText}`,
        );
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      log("📋 [MOBILE OPENAI DEBUG] OpenAI response data", {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        usage: data.usage,
        model: data.model,
        isMobile,
        deviceType: isMobile ? "mobile" : "desktop",
        totalRequestTime: requestTime,
      });

      const content = data.choices[0]?.message?.content?.trim();
      log("🎯 [OPENAI DEBUG] Raw OpenAI response content:", {
        content,
        contentLength: content?.length || 0,
        hasContent: !!content,
        contentPreview: content?.substring(0, 200) || "N/A",
      });

      if (!content) {
        logError("❌ [OPENAI DEBUG] No content in OpenAI response", {
          choices: data.choices,
          choicesLength: data.choices?.length || 0,
          firstChoice: data.choices?.[0] || null,
        });
        return {
          name: "Unknown",
          estimatedSize: "Unknown",
          estimatedWeight: "Unknown",
          confidence: 0,
        };
      }

      // Parse the JSON response with improved error handling
      let fishInfo;
      try {
        // Clean the content - remove any markdown formatting or extra text
        let cleanContent = content;

        // Remove markdown code blocks
        cleanContent = cleanContent.replace(/```json\s*|```\s*/g, "");

        // Remove any leading/trailing whitespace
        cleanContent = cleanContent.trim();

        // Look for JSON object in the response - more comprehensive regex
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
          log("🧹 [OPENAI DEBUG] Extracted JSON from response:", cleanContent);
        }

        // Additional cleaning - remove any non-JSON text before/after
        const startBrace = cleanContent.indexOf("{");
        const endBrace = cleanContent.lastIndexOf("}");
        if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
          cleanContent = cleanContent.substring(startBrace, endBrace + 1);
        }

        // Fix common JSON issues
        cleanContent = cleanContent
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)(\s*[,}])/g, ': "$1"$2') // Add quotes to unquoted string values
          .replace(/"(\d+\.?\d*)"(\s*[,}])/g, "$1$2") // Remove quotes from numbers
          .replace(/"(true|false)"(\s*[,}])/g, "$1$2") // Remove quotes from booleans
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .replace(/,\s*]/g, "]"); // Remove trailing commas in arrays

        log("🧹 [OPENAI DEBUG] Cleaned JSON content:", cleanContent);

        fishInfo = JSON.parse(cleanContent);
        log("✅ [OPENAI DEBUG] Successfully parsed JSON response", fishInfo);
      } catch (parseError) {
        logError("❌ [OPENAI DEBUG] Failed to parse JSON response", {
          content,
          parseError: parseError.message,
          contentType: typeof content,
          isString: typeof content === "string",
          startsWithBrace: content?.startsWith("{"),
          endsWithBrace: content?.endsWith("}"),
        });

        // Try to extract information manually if JSON parsing fails
        log("🔧 [OPENAI DEBUG] Attempting manual extraction from response");
        try {
          const manualExtraction = {
            name: "Unknown",
            estimatedSize: "Unknown",
            estimatedWeight: "Unknown",
            confidence: 0,
          };

          // Look for fish names in common patterns
          const fishNamePatterns = [
            /(?:fish|species).*?([A-Z][a-z]+\s+[a-z]+)/i,
            /([A-Z][a-z]+\s+[a-z]+).*?(?:fish|species)/i,
            /"name"\s*:\s*"([^"]+)"/i,
          ];

          for (const pattern of fishNamePatterns) {
            const match = content.match(pattern);
            if (match && match[1] && match[1].toLowerCase() !== "unknown") {
              manualExtraction.name = match[1].trim();
              manualExtraction.confidence = 0.5; // Lower confidence for manual extraction
              break;
            }
          }

          log("🔧 [OPENAI DEBUG] Manual extraction result:", manualExtraction);
          debugInfo.processingSteps.push("Manual extraction attempted");
          return {
            ...manualExtraction,
            debugInfo,
            openaiPrompt: "Manual extraction - JSON parsing failed",
            rawJsonResponse: content,
          };
        } catch (manualError) {
          logError(
            "❌ [OPENAI DEBUG] Manual extraction also failed:",
            manualError,
          );
          debugInfo.processingSteps.push(
            `Manual extraction failed: ${manualError.message}`,
          );
          return {
            name: "Unknown",
            estimatedSize: "Unknown",
            estimatedWeight: "Unknown",
            confidence: 0,
            compressionInfo,
            debugInfo,
            openaiPrompt: "Failed to extract",
            rawJsonResponse: content,
          };
        }
      }

      // Validate the response structure with more flexible validation
      const hasValidName = fishInfo.name && typeof fishInfo.name === "string";
      const hasValidSize =
        fishInfo.estimatedSize && typeof fishInfo.estimatedSize === "string";
      const hasValidWeight =
        fishInfo.estimatedWeight &&
        typeof fishInfo.estimatedWeight === "string";
      const hasValidConfidence =
        typeof fishInfo.confidence === "number" &&
        fishInfo.confidence >= 0 &&
        fishInfo.confidence <= 1;

      const isValid =
        hasValidName && hasValidSize && hasValidWeight && hasValidConfidence;

      log("🔍 [OPENAI DEBUG] Response validation", {
        isValid,
        hasValidName,
        hasValidSize,
        hasValidWeight,
        hasValidConfidence,
        fishInfo,
        nameValue: fishInfo.name,
        sizeValue: fishInfo.estimatedSize,
        weightValue: fishInfo.estimatedWeight,
        confidenceValue: fishInfo.confidence,
        confidenceType: typeof fishInfo.confidence,
      });

      if (isValid) {
        const totalTime = Date.now() - startTime;
        log("🎉 [OPENAI DEBUG] Fish identification successful!", {
          fishInfo,
          totalTime,
          requestTime,
          compressionInfo,
        });
        debugInfo.processingSteps.push(
          `Fish identification successful (${totalTime}ms total)`,
        );
        return {
          ...fishInfo,
          compressionInfo,
          debugInfo,
          openaiPrompt:
            typeof requestBody.messages[0].content === "string"
              ? requestBody.messages[0].content
              : JSON.stringify(requestBody.messages[0].content),
          rawJsonResponse: content,
        };
      } else {
        warnLog(
          "⚠️ [OPENAI DEBUG] Invalid fish identification response structure, attempting to fix",
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

        // Try to fix the response by providing defaults for missing fields
        const fixedResponse = {
          name: hasValidName ? fishInfo.name : "Unknown",
          estimatedSize: hasValidSize ? fishInfo.estimatedSize : "Unknown",
          estimatedWeight: hasValidWeight
            ? fishInfo.estimatedWeight
            : "Unknown",
          confidence: hasValidConfidence ? fishInfo.confidence : 0,
        };

        log("🔧 [OPENAI DEBUG] Fixed response:", fixedResponse);
        debugInfo.processingSteps.push("Response structure fixed");
        return {
          ...fixedResponse,
          compressionInfo,
          debugInfo,
          openaiPrompt:
            typeof requestBody.messages[0].content === "string"
              ? requestBody.messages[0].content
              : JSON.stringify(requestBody.messages[0].content),
          rawJsonResponse: content,
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const totalTime = Date.now() - startTime;

      if (fetchError.name === "AbortError") {
        logError("⏰ [OPENAI DEBUG] Fish identification request timed out", {
          totalTime,
          timeout: "30 seconds",
        });
        debugInfo.processingSteps.push(`Request timed out (${totalTime}ms)`);
        return {
          name: "Unknown",
          estimatedSize: "Unknown",
          estimatedWeight: "Unknown",
          confidence: 0,
          compressionInfo,
          debugInfo,
          openaiPrompt: "Request timed out",
          rawJsonResponse: "Timeout - no response",
        };
      }

      logError("❌ [OPENAI DEBUG] Network/fetch error", {
        error: fetchError.message,
        errorName: fetchError.name,
        totalTime,
        stack: fetchError.stack,
      });

      debugInfo.processingSteps.push(`Network error: ${fetchError.message}`);
      return {
        name: "Unknown",
        estimatedSize: "Unknown",
        estimatedWeight: "Unknown",
        confidence: 0,
        compressionInfo,
        debugInfo,
        openaiPrompt: "Network error occurred",
        rawJsonResponse: `Error: ${fetchError.message}`,
      };
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logError("💥 [OPENAI DEBUG] Complete fish identification failure", {
      error: error.message,
      errorType: error.constructor.name,
      totalTime,
      stack: error.stack,
    });

    // Always return a valid response structure instead of null
    debugInfo.processingSteps.push(`Complete failure: ${error.message}`);
    return {
      name: "Unknown",
      estimatedSize: "Unknown",
      estimatedWeight: "Unknown",
      confidence: 0,
      compressionInfo: undefined,
      debugInfo,
      openaiPrompt: "Complete failure",
      rawJsonResponse: `Error: ${error.message}`,
    };
  }
};

/**
 * Process uploaded image and extract all metadata with timeout
 * Uses two-stage AI approach: first classify, then detailed analysis if fish
 */
export const processImageUpload = async (
  file: File,
  preObtainedLocation?: { latitude: number; longitude: number } | null,
): Promise<ImageMetadata> => {
  // Detect device type and capture comprehensive device info
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const deviceInfo = {
    isMobile,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    deviceMemory: (navigator as any).deviceMemory || "unknown",
    connection: (navigator as any).connection
      ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        }
      : "unknown",
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };

  log("🔍 [TWO-STAGE AI] Starting image processing:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
    deviceInfo,
    fileDetails: {
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
      isLargeFile: file.size > 5 * 1024 * 1024, // > 5MB
      hasValidType: file.type.startsWith("image/"),
      typeSpecific: file.type,
    },
  });

  const metadata: ImageMetadata = {
    url: "", // Will be set after upload
    timestamp: new Date().toISOString(),
    originalFileName: file.name,
  };

  // Set overall timeout for metadata processing
  const processingTimeout = new Promise<ImageMetadata>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Metadata processing timeout"));
    }, 120000); // 2 minute total timeout for larger files
  });

  const processingPromise = (async (): Promise<ImageMetadata> => {
    try {
      // Extract EXIF data with timeout and mobile-specific handling
      log("🔍 [TWO-STAGE AI] Starting EXIF extraction:", {
        isMobile,
        fileName: file.name,
        fileSize: file.size,
      });

      const exifStartTime = Date.now();
      const exifData = await Promise.race([
        extractImageMetadata(file),
        new Promise((_, reject) => {
          setTimeout(() => {
            logError("⏰ [TWO-STAGE AI] EXIF extraction timeout", {
              isMobile,
              fileName: file.name,
              timeoutAfter: 5000,
            });
            reject(new Error("EXIF extraction timeout"));
          }, 5000);
        }),
      ]);

      const exifTime = Date.now() - exifStartTime;
      log("✅ [TWO-STAGE AI] EXIF extraction completed:", {
        isMobile,
        extractionTime: exifTime,
        hasExifData: !!exifData,
        exifKeys: exifData ? Object.keys(exifData) : [],
        hasGPS: !!(exifData?.GPSLatitude && exifData?.GPSLongitude),
        gpsData: {
          lat: exifData?.GPSLatitude,
          lon: exifData?.GPSLongitude,
          latRef: exifData?.GPSLatitudeRef,
          lonRef: exifData?.GPSLongitudeRef,
        },
        cameraInfo: {
          make: exifData?.Make,
          model: exifData?.Model,
          software: exifData?.Software,
          orientation: exifData?.Orientation,
        },
      });

      // Try to get location from EXIF first with mobile-specific logging
      let location = extractGPSFromEXIF(exifData);
      log("🔍 [TWO-STAGE AI] GPS extraction from EXIF:", {
        isMobile,
        hasLocation: !!location,
        location,
        exifHasGPS: !!(exifData?.GPSLatitude && exifData?.GPSLongitude),
        rawGPSData: {
          GPSLatitude: exifData?.GPSLatitude,
          GPSLongitude: exifData?.GPSLongitude,
          GPSLatitudeRef: exifData?.GPSLatitudeRef,
          GPSLongitudeRef: exifData?.GPSLongitudeRef,
        },
      });

      // Use pre-obtained location if available, otherwise try to get current location
      if (!location && preObtainedLocation) {
        log("✅ [TWO-STAGE AI] Using pre-obtained location from ProfilePage:", {
          isMobile,
          preObtainedLocation,
        });
        location = preObtainedLocation;
      } else if (!location) {
        try {
          log(
            "🔍 [TWO-STAGE AI] No GPS in EXIF and no pre-obtained location, trying current location:",
            { isMobile },
          );

          const locationStartTime = Date.now();
          location = await Promise.race([
            getCurrentLocation(),
            new Promise<never>((_, reject) => {
              setTimeout(() => {
                logError("⏰ [TWO-STAGE AI] Current location timeout", {
                  isMobile,
                  timeoutAfter: 10000,
                });
                reject(new Error("Location timeout"));
              }, 10000);
            }),
          ]);

          const locationTime = Date.now() - locationStartTime;
          log("✅ [TWO-STAGE AI] Current location obtained:", {
            isMobile,
            locationTime,
            location,
          });
        } catch (error) {
          log("❌ [TWO-STAGE AI] Could not get current location:", {
            isMobile,
            error: error.message,
            errorType: error.constructor.name,
          });
        }
      }

      // Convert coordinates to address if we have location
      if (location) {
        try {
          log("🔍 [TWO-STAGE AI] Starting geocoding:", {
            isMobile,
            coordinates: location,
          });

          const geocodingStartTime = Date.now();
          const address = await Promise.race([
            coordinatesToAddress(location.latitude, location.longitude),
            new Promise<string>((_, reject) => {
              setTimeout(() => {
                logError("⏰ [TWO-STAGE AI] Geocoding timeout", {
                  isMobile,
                  coordinates: location,
                  timeoutAfter: 10000,
                });
                reject(new Error("Geocoding timeout"));
              }, 10000);
            }),
          ]);

          const geocodingTime = Date.now() - geocodingStartTime;
          metadata.location = {
            ...location,
            address,
          };
          log("✅ [TWO-STAGE AI] Location extracted:", {
            isMobile,
            geocodingTime,
            location: metadata.location,
          });
        } catch (error) {
          logError("❌ [TWO-STAGE AI] Error getting address:", {
            isMobile,
            error: error.message,
            coordinates: location,
          });
          metadata.location = location;
        }
      }

      // TWO-STAGE AI APPROACH: First classify, then detailed analysis if fish
      // CRITICAL: Always create a fishInfo structure, even if AI analysis fails
      let fishInfo: {
        name: string;
        estimatedSize: string;
        estimatedWeight: string;
        confidence: number;
      } | null = null;

      try {
        log("🔍 [TWO-STAGE AI] Starting two-stage AI process:", {
          isMobile,
          fileName: file.name,
          fileSize: file.size,
          fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2),
          isAlreadyCompressed: file.size < 2 * 1024 * 1024, // Less than 2MB suggests pre-compression
          deviceInfo: {
            userAgent: navigator.userAgent,
            connection:
              (navigator as any).connection?.effectiveType || "unknown",
          },
        });
        const aiProcessStart = Date.now();

        // STAGE 1: Image Classification (fish, gear, unknown)
        log("🎯 [TWO-STAGE AI] Stage 1: Image classification starting...");
        const classificationStart = Date.now();

        const classificationResult = await (async () => {
          const { classifyImage } = await import(
            "./image-classification-service"
          );
          return classifyImage(file);
        })();

        const classificationTime = Date.now() - classificationStart;
        log("✅ [TWO-STAGE AI] Stage 1: Classification completed", {
          isMobile,
          classificationTime,
          result: classificationResult,
          type: classificationResult.type,
          confidence: classificationResult.confidence,
          reasoning: classificationResult.reasoning,
        });

        // STAGE 2: Detailed fish identification (only if classified as fish)
        if (
          classificationResult.type === "fish" &&
          classificationResult.confidence > 0.3
        ) {
          log(
            "🐟 [TWO-STAGE AI] Stage 2: Fish detected, running detailed identification...",
          );
          const detailedAnalysisStart = Date.now();

          try {
            const identificationResult = await identifyFishFromImage(file);

            const detailedAnalysisTime = Date.now() - detailedAnalysisStart;

            // Extract fish info and compression info from the result
            fishInfo = {
              name: identificationResult?.name || "Unknown",
              estimatedSize: identificationResult?.estimatedSize || "Unknown",
              estimatedWeight:
                identificationResult?.estimatedWeight || "Unknown",
              confidence: identificationResult?.confidence || 0,
            };

            // Store compression info in metadata if available (but don't override existing compression info)
            if (
              identificationResult?.compressionInfo &&
              !metadata.compressionInfo
            ) {
              metadata.compressionInfo = identificationResult.compressionInfo;
            }

            log(
              "✅ [TWO-STAGE AI] Stage 2: Detailed fish identification completed",
              {
                isMobile,
                detailedAnalysisTime,
                fishInfo,
                fishName: fishInfo?.name,
                confidence: fishInfo?.confidence,
                fishSize: fishInfo?.estimatedSize,
                fishWeight: fishInfo?.estimatedWeight,
                hasCompressionInfo: !!identificationResult?.compressionInfo,
                compressionRatio:
                  identificationResult?.compressionInfo?.compressionRatio,
              },
            );
          } catch (detailedError) {
            logError(
              "❌ [TWO-STAGE AI] Stage 2: Detailed fish identification failed",
              {
                isMobile,
                error: detailedError.message,
                errorType: detailedError.constructor.name,
                willCreateBasicFishInfo: true,
              },
            );

            // Create basic fish info based on classification result
            fishInfo = {
              name: "Fish (Species Unknown)",
              estimatedSize: "Unknown",
              estimatedWeight: "Unknown",
              confidence: Math.max(0.5, classificationResult.confidence), // Use classification confidence as baseline
            };
          }
        } else {
          log("🚫 [TWO-STAGE AI] Stage 2: Skipped - not classified as fish", {
            isMobile,
            classificationType: classificationResult.type,
            classificationConfidence: classificationResult.confidence,
            reasoning: classificationResult.reasoning,
          });

          // Create appropriate info based on classification
          if (classificationResult.type === "gear") {
            fishInfo = {
              name: "Fishing Gear Detected",
              estimatedSize: "Unknown",
              estimatedWeight: "Unknown",
              confidence: 0,
            };
          } else {
            fishInfo = {
              name: "Unknown",
              estimatedSize: "Unknown",
              estimatedWeight: "Unknown",
              confidence: 0,
            };
          }
        }

        const totalAiTime = Date.now() - aiProcessStart;
        log("🎉 [TWO-STAGE AI] Complete AI process finished", {
          isMobile,
          totalAiTime,
          classificationTime,
          detailedAnalysisTime:
            classificationResult.type === "fish"
              ? "included in total"
              : "skipped",
          finalFishInfo: fishInfo,
          stage1Result: classificationResult,
          stage2Executed:
            classificationResult.type === "fish" &&
            classificationResult.confidence > 0.3,
          deviceType: isMobile ? "mobile" : "desktop",
        });
      } catch (error) {
        logError("❌ [TWO-STAGE AI] Complete AI process failed", {
          isMobile,
          error: error.message,
          errorType: error.constructor.name,
          willCreateDefaultFishInfo: true,
          deviceInfo: {
            userAgent: navigator.userAgent,
            connection:
              (navigator as any).connection?.effectiveType || "unknown",
            deviceMemory: (navigator as any).deviceMemory || "unknown",
          },
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
        // Create default fish info structure when AI analysis fails
        fishInfo = {
          name: "Unknown",
          estimatedSize: "Unknown",
          estimatedWeight: "Unknown",
          confidence: 0,
        };
      }

      // CRITICAL: Always add fishInfo to metadata, regardless of AI success/failure
      // This ensures the FishInfoOverlay always has a fishInfo structure to work with
      if (fishInfo) {
        metadata.fishInfo = fishInfo;
        log("✅ [TWO-STAGE AI] Fish info added to metadata (guaranteed):", {
          isMobile,
          fishInfo: metadata.fishInfo,
          metadataHasFishInfo: !!metadata.fishInfo,
          deviceType: isMobile ? "mobile" : "desktop",
          source: "Two-stage AI analysis or fallback",
        });
      } else {
        // This should never happen now, but add extra safety
        metadata.fishInfo = {
          name: "Unknown",
          estimatedSize: "Unknown",
          estimatedWeight: "Unknown",
          confidence: 0,
        };
        warnLog("⚠️ [TWO-STAGE AI] Created emergency fallback fish info:", {
          isMobile,
          fishInfo: metadata.fishInfo,
          reason: "fishInfo was unexpectedly null",
          deviceType: isMobile ? "mobile" : "desktop",
        });
      }
    } catch (error) {
      logError("❌ [TWO-STAGE AI] Error processing image metadata:", {
        isMobile,
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        deviceInfo,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
      // Return partial metadata even if some processing fails
    }

    log("🔍 [TWO-STAGE AI] Final metadata:", {
      isMobile,
      metadata,
      hasFishInfo: !!metadata.fishInfo,
      hasLocation: !!metadata.location,
      fishName: metadata.fishInfo?.name,
      locationAddress: metadata.location?.address,
      processingComplete: true,
      deviceType: isMobile ? "mobile" : "desktop",
    });
    return metadata;
  })();

  try {
    return await Promise.race([processingPromise, processingTimeout]);
  } catch (error) {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    logError("❌ [TWO-STAGE AI] Metadata processing failed or timed out:", {
      isMobile,
      error: error.message,
      errorType: error.constructor.name,
      deviceType: isMobile ? "mobile" : "desktop",
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
    // Return basic metadata if processing fails
    return metadata;
  }
};
