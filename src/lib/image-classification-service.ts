import { OPENAI_ENABLED, validateOpenAIConfig } from "./openai-toggle";

export interface ClassificationResult {
  type: "fish" | "gear" | "unknown";
  confidence: number;
  reasoning?: string;
}

/**
 * Classify an image as fish, gear, or unknown using OpenAI Vision API
 */
export const classifyImage = async (
  imageFile: File,
): Promise<ClassificationResult> => {
  console.log("🔍 [IMAGE CLASSIFICATION] Starting classification:", {
    fileName: imageFile.name,
    fileSize: imageFile.size,
    fileType: imageFile.type,
  });

  try {
    // Check OpenAI configuration
    if (!OPENAI_ENABLED || !validateOpenAIConfig()) {
      console.warn("❌ [IMAGE CLASSIFICATION] OpenAI not available");
      return {
        type: "unknown",
        confidence: 0,
        reasoning: "OpenAI not configured",
      };
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ [IMAGE CLASSIFICATION] No API key");
      return {
        type: "unknown",
        confidence: 0,
        reasoning: "No API key available",
      };
    }

    // Check if image needs compression before base64 conversion
    let processedFile = imageFile;
    const isLargeFile = imageFile.size > 3 * 1024 * 1024; // 3MB threshold

    if (isLargeFile) {
      console.log(
        "🗜️ [IMAGE CLASSIFICATION] Large file detected, compressing before AI:",
        {
          originalSize: `${(imageFile.size / (1024 * 1024)).toFixed(2)}MB`,
          fileName: imageFile.name,
        },
      );

      try {
        // Import compression function
        const { compressImage } = await import("./image-metadata");

        const compressionResult = await Promise.race([
          compressImage(imageFile, 800, 800, 0.7),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error("Compression timeout"));
            }, 10000);
          }),
        ]);

        processedFile = compressionResult.compressedFile;

        console.log("✅ [IMAGE CLASSIFICATION] Compression completed:", {
          originalSize: `${(imageFile.size / (1024 * 1024)).toFixed(2)}MB`,
          compressedSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
          compressionRatio: `${compressionResult.compressionInfo.compressionRatio.toFixed(1)}%`,
        });
      } catch (compressionError) {
        console.warn(
          "⚠️ [IMAGE CLASSIFICATION] Compression failed, using original:",
          {
            error: compressionError.message,
            willUseOriginalFile: true,
          },
        );
        // Continue with original file
      }
    }

    // Convert image to base64
    console.log("📷 [IMAGE CLASSIFICATION] Converting to base64...", {
      fileSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
      wasCompressed: processedFile !== imageFile,
    });
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reject(new Error("Image conversion timeout"));
      }, 20000); // Increased timeout

      reader.onload = () => {
        clearTimeout(timeout);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to read image"));
      };
      reader.readAsDataURL(processedFile);
    });

    console.log("🚀 [IMAGE CLASSIFICATION] Calling OpenAI...");

    const prompt = `Analyze this image and determine if it primarily contains:
1. FISH - Any fish species, whether caught, in water, or being held
2. GEAR - Fishing equipment like rods, reels, lures, tackle, bait, or accessories
3. UNKNOWN - Neither fish nor fishing gear, or unclear content

Respond with ONLY a JSON object in this exact format:
{
  "type": "fish" | "gear" | "unknown",
  "confidence": 0.85,
  "reasoning": "Brief explanation of what you see"
}

Be decisive - if you see a fish (even if there's also gear in the image), classify as "fish". If you see only gear with no fish, classify as "gear".`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
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
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ [IMAGE CLASSIFICATION] API error:",
        response.status,
        errorText,
      );
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    console.log("📥 [IMAGE CLASSIFICATION] Raw response:", {
      content,
      usage: data.usage,
    });

    if (!content) {
      console.error("❌ [IMAGE CLASSIFICATION] Empty response");
      return {
        type: "unknown",
        confidence: 0,
        reasoning: "Empty response from AI",
      };
    }

    // Parse JSON response
    let result: ClassificationResult;
    try {
      // Clean content - remove any markdown or extra text
      let cleanContent = content;
      cleanContent = cleanContent.replace(/```json\s*|```\s*/g, "");
      cleanContent = cleanContent.trim();

      // Extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
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

      console.log("🧹 [IMAGE CLASSIFICATION] Cleaned JSON:", cleanContent);

      const parsed = JSON.parse(cleanContent);

      // Validate and clean the result
      result = {
        type: ["fish", "gear", "unknown"].includes(parsed.type)
          ? parsed.type
          : "unknown",
        confidence:
          typeof parsed.confidence === "number"
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0,
        reasoning:
          typeof parsed.reasoning === "string"
            ? parsed.reasoning
            : "No reasoning provided",
      };

      console.log("✅ [IMAGE CLASSIFICATION] Parsed successfully:", result);
    } catch (parseError) {
      console.error(
        "❌ [IMAGE CLASSIFICATION] Parse failed:",
        parseError.message,
      );
      console.error("❌ [IMAGE CLASSIFICATION] Content was:", content);

      // Fallback: try to extract type from text
      const lowerContent = content.toLowerCase();
      let fallbackType: "fish" | "gear" | "unknown" = "unknown";

      if (lowerContent.includes("fish")) {
        fallbackType = "fish";
      } else if (
        lowerContent.includes("gear") ||
        lowerContent.includes("rod") ||
        lowerContent.includes("reel") ||
        lowerContent.includes("lure")
      ) {
        fallbackType = "gear";
      }

      result = {
        type: fallbackType,
        confidence: 0.5,
        reasoning: "Fallback classification due to parse error",
      };
    }

    console.log("🎉 [IMAGE CLASSIFICATION] Final result:", result);
    return result;
  } catch (error) {
    console.error("💥 [IMAGE CLASSIFICATION] Failed:", {
      error: error instanceof Error ? error.message : String(error),
      fileName: imageFile.name,
    });

    return {
      type: "unknown",
      confidence: 0,
      reasoning: `Classification failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
