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
    console.error("OpenAI is disabled in configuration");
    return false;
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key is missing");
    return false;
  }

  return true;
};

// Message to show when OpenAI is disabled
export const OPENAI_DISABLED_MESSAGE =
  "OpenAI API calls are currently disabled for troubleshooting.";
