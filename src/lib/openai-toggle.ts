/**
 * OpenAI API Toggle
 *
 * This module provides a way to disable all OpenAI API calls
 */

// Set this to true to enable OpenAI API calls
export const OPENAI_ENABLED = true;

// Set this to true to enable only the fishing tip API call
export const FISHING_TIP_ENABLED = true;

// Helper function to validate OpenAI configuration
export const validateOpenAIConfig = () => {
  if (!OPENAI_ENABLED) {
    console.log("[OpenAI] OpenAI is disabled");
    return false;
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "[OpenAI] API key is missing - check VITE_OPENAI_API_KEY environment variable",
    );
    return false;
  }

  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    console.error("[OpenAI] API key is invalid - empty or wrong type");
    return false;
  }

  if (!apiKey.startsWith("sk-")) {
    console.error(
      "[OpenAI] API key format is invalid - should start with 'sk-'",
    );
    return false;
  }

  if (apiKey.length < 20) {
    console.error("[OpenAI] API key appears to be too short");
    return false;
  }

  console.log("[OpenAI] ✅ Configuration is valid", {
    hasKey: true,
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 7) + "...",
  });
  return true;
};

// Message to show when OpenAI is disabled
export const OPENAI_DISABLED_MESSAGE =
  "OpenAI API calls are currently disabled for troubleshooting.";
