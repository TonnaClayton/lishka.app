import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "./config";

const openai = createOpenAI({
  apiKey: config.VITE_OPENAI_API_KEY,
});

export async function generateTextWithAI({
  messages,
  system,
  model,
  maxTokens,
  temperature,
}: {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    attachments?: {
      url: string;
      name?: string;
      contentType?: string;
    };
  }>;
  system?: string;
  model: "gpt-3.5-turbo" | "gpt-4o" | "gpt-4o-mini" | "gpt-3.5-turbo" | "gpt-4";
  maxTokens?: number;
  temperature?: number;
}) {
  return await generateText({
    model: openai(model),
    system: system || "You are a friendly assistant!",
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
      experimental_attachments: message.attachments,
    })),
    maxOutputTokens: maxTokens,
    temperature: temperature,
  });
}
