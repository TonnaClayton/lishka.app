/**
 * OpenAI API Toggle
 *
 * This module provides a way to disable all OpenAI API calls
 */

import { error as logError, log } from "./logging";
import { config } from "@/lib/config";

// Set this to true to enable OpenAI API calls
export const OPENAI_ENABLED = true;

// Set this to true to enable only the fishing tip API call
export const FISHING_TIP_ENABLED = true;

// Helper function to validate OpenAI configuration
export const validateOpenAIConfig = () => {
  if (!OPENAI_ENABLED) {
    log("[OpenAI] OpenAI is disabled");
    return false;
  }

  const apiKey = config.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    logError(
      "[OpenAI] API key is missing - check VITE_OPENAI_API_KEY environment variable",
    );
    return false;
  }

  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    logError("[OpenAI] API key is invalid - empty or wrong type");
    return false;
  }

  if (!apiKey.startsWith("sk-")) {
    logError("[OpenAI] API key format is invalid - should start with 'sk-'");
    return false;
  }

  if (apiKey.length < 20) {
    logError("[OpenAI] API key appears to be too short");
    return false;
  }

  log("[OpenAI] ✅ Configuration is valid", {
    hasKey: true,
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 7) + "...",
  });
  return true;
};

// Message to show when OpenAI is disabled
export const OPENAI_DISABLED_MESSAGE =
  "OpenAI API calls are currently disabled for troubleshooting.";
