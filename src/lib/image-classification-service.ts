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

    // Convert image to base64
    console.log("📷 [IMAGE CLASSIFICATION] Converting to base64...");
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reject(new Error("Image conversion timeout"));
      }, 15000);

      reader.onload = () => {
        clearTimeout(timeout);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to read image"));
      };
      reader.readAsDataURL(imageFile);
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

      // Extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

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
