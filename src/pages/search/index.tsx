import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, MapPin, ArrowLeft, Loader2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import FishCard from "@/components/fish-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { log } from "@/lib/logging";
import { config } from "@/lib/config";

import { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } from "@/lib/openai-toggle";
import { useImperialUnits } from "@/lib/unit-conversion";
import BottomNav from "@/components/bottom-nav";
import TextareaAutosize from "react-textarea-autosize";
import useDeviceSize from "@/hooks/use-device-size";
import useIsMobile from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { generateTextWithAI } from "@/lib/ai";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useUserLocation } from "@/hooks/queries";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  fishResults?: Fish[];
  image?: string;
}

interface Fish {
  id: string;
  name: string;
  scientificName?: string;
  image?: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  toxic: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "Fish in shallow waters?",
  "Best bait for tuna?",
  "Bass fishing from shore?",
  "Beginner techniques?",
];

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { location } = useUserLocation();

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocationContext, setUseLocationContext] = useState(true);
  const [suggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imperialUnits, setImperialUnits] =
    useState<boolean>(useImperialUnits());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const deviceSize = useDeviceSize();
  const isMobile = useIsMobile();

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, followUpQuestions, followUpLoading]);

  // Listen for units changes from settings
  useEffect(() => {
    const handleUnitsChange = () => {
      setImperialUnits(useImperialUnits());
    };

    window.addEventListener("unitsChanged", handleUnitsChange);
    return () => window.removeEventListener("unitsChanged", handleUnitsChange);
  }, []);

  // Convert image to base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Extract the API call logic to a separate function
  const processQuery = async (
    queryText: string,
    userMessage: Message,
    imageFile?: File,
  ) => {
    try {
      // Check if OpenAI is disabled
      if (!OPENAI_ENABLED) {
        log(OPENAI_DISABLED_MESSAGE);
        throw new Error(OPENAI_DISABLED_MESSAGE);
      }

      // Check if API key is available
      const apiKey = config.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "OpenAI API key is missing. Please add it in project settings.",
        );
      }

      // Prepare messages for the API call
      const unitsInstruction = imperialUnits
        ? "Always provide measurements in imperial units (inches, feet, pounds, ounces, Fahrenheit, miles) as the primary unit, with metric equivalents in parentheses when helpful."
        : "Always provide measurements in metric units (centimeters, meters, grams, kilograms, Celsius, kilometers) as the primary unit, with imperial equivalents in parentheses when helpful.";

      const systemMessage = {
        role: "system",
        content: `You are a fishing expert AI that provides helpful information about fishing techniques, fish species, and fishing locations. ${unitsInstruction} If you mention specific fish species, provide detailed information about them including name, scientific name, habitat, difficulty level, and season availability. ${useLocationContext ? "Focus on fish species and fishing techniques relevant to the user's location." : "Provide global information without focusing on any specific location."}. Make sure to close every open [FISH_DATA] tag.`,
      };

      const previousMessages = messages
        .filter((msg) => msg.id !== userMessage.id)
        .map((msg) => {
          if (msg.image) {
            return {
              role: msg.role,
              content: [
                {
                  type: "text",
                  text: msg.content,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: msg.image,
                  },
                },
              ],
            };
          }
          return {
            role: msg.role,
            content: msg.content,
          };
        });

      let userMessageContent;
      if (imageFile) {
        const base64Image = await convertImageToBase64(imageFile);
        userMessageContent = [
          {
            type: "text",
            text: `${queryText}\n\nIf your response includes specific fish species, please also include a JSON section at the end of your response in this format and do not forget to close the JSON section: [FISH_DATA]{\"fish\":[{\"name\":\"Fish Name\",\"scientificName\":\"Scientific Name\",\"habitat\":\"Habitat info\",\"difficulty\":\"Difficulty level\",\"season\":\"Season info\",\"toxic\":false}]}[/FISH_DATA]`,
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
            },
          },
        ];
      } else {
        userMessageContent = `${queryText}\n\nIf your response includes specific fish species, please also include a JSON section at the end of your response in this format and do not forget to close the JSON section: [FISH_DATA]{\"fish\":[{\"name\":\"Fish Name\",\"scientificName\":\"Scientific Name\",\"habitat\":\"Habitat info\",\"difficulty\":\"Difficulty level\",\"season\":\"Season info\",\"toxic\":false}]}[/FISH_DATA]`;
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: imageFile ? "gpt-4o" : "gpt-3.5-turbo",
            messages: [
              systemMessage,
              ...previousMessages,
              {
                role: "user",
                content: userMessageContent,
              },
            ],
            max_tokens: imageFile ? 1000 : undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      console.log("assistantResponse", assistantResponse);

      // Extract fish data if present
      let fishData: Fish[] = [];
      const fishDataMatch = assistantResponse.match(
        /\[FISH_DATA\](.+?)\[\/?FISH_DATA\]/s,
      );

      let cleanedResponse = assistantResponse;

      if (fishDataMatch && fishDataMatch[1]) {
        try {
          const parsedData = JSON.parse(fishDataMatch[1]);
          if (parsedData.fish && Array.isArray(parsedData.fish)) {
            fishData = parsedData.fish.map((fish: any, index: number) => ({
              id: `search-${Date.now()}-${index}`,
              name: fish.name,
              scientificName: fish.scientificName,
              // Don't provide image - let FishCard handle image loading
              image: undefined,
              habitat: fish.habitat,
              difficulty: fish.difficulty,
              season: fish.season,
              toxic: fish.toxic === true,
            }));
          }

          // Remove the fish data section from the displayed response
          cleanedResponse = assistantResponse.replace(
            /\[FISH_DATA\].+?\[\/?FISH_DATA\]/s,
            "",
          );
        } catch (err) {
          console.error("Error parsing fish data:", err);
        }
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: cleanedResponse.trim(),
        timestamp: new Date(),
        fishResults: fishData.length > 0 ? fishData : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error fetching response:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      // Add a fallback message when an error occurs
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error processing your request. Please try again or ask a different question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!query.trim() && !imageFile) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query || "[Image uploaded]",
      timestamp: new Date(),
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    const currentImageFile = imageFile;
    setQuery("");
    setSelectedImage(null);
    setImageFile(null);
    setLoading(true);
    setError(null);

    // Process the query with error handling
    try {
      await processQuery(
        currentQuery || "What can you tell me about this image?",
        userMessage,
        currentImageFile || undefined,
      );
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setLoading(false);
      setError("Failed to process your search. Please try again.");
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Create a user message for the clicked suggestion
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: suggestion,
      timestamp: new Date(),
    };

    // Add the message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    // Process the query directly without setting it in the textarea
    try {
      await processQuery(suggestion, userMessage);
    } catch (err) {
      console.error("Error in handleSuggestionClick:", err);
      setLoading(false);
      setError("Failed to process your search. Please try again.");
    }
  };

  // AI follow-up generation
  const fetchFollowUpQuestions = async (contextMessages: Message[]) => {
    setFollowUpLoading(true);
    try {
      // Only use the last 4 messages for context
      const context = contextMessages.slice(-4).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      const systemPrompt =
        "You are a fishing assistant AI. Given the conversation so far, suggest 3 contextually relevant follow-up questions the user might want to ask next. Respond ONLY with a JSON array of questions, e.g. ['Question 1', 'Question 2', 'Question 3']. Do not include any other text.";
      const aiResponse = await generateTextWithAI({
        messages: context,
        system: systemPrompt,
        model: "gpt-3.5-turbo",
        maxTokens: 100,
        temperature: 0.7,
      });
      let questions: string[] = [];
      try {
        // First try to parse as regular JSON
        questions = JSON.parse(aiResponse.text);
        if (!Array.isArray(questions)) throw new Error("Not an array");
      } catch (err) {
        // Try to extract array from quoted string
        try {
          const trimmedText = aiResponse.text.trim();
          // Remove outer quotes if present
          const cleanText =
            trimmedText.startsWith('"') && trimmedText.endsWith('"')
              ? trimmedText.slice(1, -1)
              : trimmedText;

          // Parse the cleaned text
          questions = JSON.parse(cleanText);
          if (!Array.isArray(questions)) throw new Error("Still not an array");
        } catch (secondErr) {
          // Final fallback: try to extract array using regex
          try {
            const match = aiResponse.text.match(/\[(.*?)\]/s);
            if (match) {
              const arrayContent = match[1];
              // Split by comma and clean up quotes
              questions = arrayContent
                .split(",")
                .map((item) => item.trim().replace(/^["']|["']$/g, ""))
                .filter((item) => item.length > 0);
            }
          } catch (thirdErr) {
            questions = [];
          }
        }
      }

      setFollowUpQuestions(
        Array.isArray(questions)
          ? questions.filter((q) => typeof q === "string" && q.length > 0)
          : [],
      );
    } catch (err) {
      setFollowUpQuestions([]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Update follow-up questions after each assistant message
  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      fetchFollowUpQuestions(messages);
    } else if (messages.length === 0) {
      setFollowUpQuestions([]);
    }
  }, [messages]);

  return (
    <div
      className="flex flex-col bg-white h-full relative dark:bg-black w-full"
      style={{ "--header-height": "64px" } as React.CSSProperties}
    >
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-4 py-3 lg:static">
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              className="mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold dark:text-white">
            Fishing Assistant
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <MapPin
            size={16}
            className={useLocationContext ? "text-blue-500" : "text-gray-400"}
          />
          <span className="text-xs text-blue-500 dark:text-blue-400">
            {useLocationContext
              ? location?.name || "Getting location..."
              : "Global search"}
          </span>
          <Switch
            checked={useLocationContext}
            onCheckedChange={setUseLocationContext}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
      </header>
      {/* Scrollable Content Area - With padding for header and input form */}

      {messages.length === 0 ? (
        <div
          className={cn(
            "flex-1 h-full",
            isMobile && deviceSize.height < 850 && "overflow-y-auto pt-16",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center space-y-6",
              !(isMobile && deviceSize.height < 850) && "h-full",
            )}
          >
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white">
              Ask me anything about fishing!
            </h2>
            <p className="text-muted-foreground dark:text-gray-400">
              Get AI advice on techniques, species identification, fishing
              spots, sonar image readings and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 w-full max-w-md">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={`suggestion-${index}`}
                  variant="outline"
                  className="text-left justify-start h-auto py-3 px-2 dark:bg-gray-800 dark:border-gray-700"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            {isMobile && deviceSize.height < 850 && (
              <div className="h-[300px] md:hidden"></div>
            )}
          </div>
        </div>
      ) : (
        <div className={cn("flex-1 overflow-y-auto h-full pt-16")}>
          <div className="p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="h-[20px] md:hidden"></div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg pt-3 w-fit max-w-[85%]",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                    )}
                  >
                    {message.image && (
                      <div className="mb-3 px-4">
                        <img
                          src={message.image}
                          alt="Uploaded image"
                          className="max-w-full h-auto rounded-lg max-h-64 object-contain"
                        />
                      </div>
                    )}
                    <div className="px-4">
                      <ReactMarkdown
                        components={{
                          ol: ({ children }) => (
                            <ol className="list-decimal">{children}</ol>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="ml-4">{children}</li>
                          ),
                          p: ({ children }) => (
                            <p className="mb-3 text-sm text-text">{children}</p>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold mb-1 dark:text-white lg:text-3xl">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-bold mb-1 dark:text-white lg:text-2xl">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-bold mb-1 dark:text-white lg:text-xl">
                              {children}
                            </h3>
                          ),
                        }}
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Display fish cards if available */}
                    {message.fishResults && message.fishResults.length > 0 && (
                      <div className="mt-4 space-y-4 w-full">
                        <h3 className="font-medium text-sm px-4">
                          Fish Species:
                        </h3>
                        <div className="flex w-full overflow-x-auto gap-4 px-4 pb-3">
                          {message.fishResults
                            .filter((fish) => {
                              // Filter out generic fish names
                              const genericNames = [
                                "generic fish",
                                "unknown fish",
                                "fish",
                                "generic",
                                "unknown",
                              ];
                              const fishName = fish.name?.toLowerCase() || "";
                              return (
                                !genericNames.includes(fishName) &&
                                fishName.trim() !== ""
                              );
                            })
                            .map((fish) => (
                              <FishCard
                                key={fish.id}
                                name={fish.name}
                                scientificName={fish.scientificName}
                                habitat={fish.habitat}
                                difficulty={fish.difficulty}
                                isToxic={fish.toxic}
                                className="w-[200px] min-h-[250px] flex-shrink-0"
                                onClick={() => {
                                  navigate(
                                    `/fish/${encodeURIComponent(fish.scientificName || fish.name)}`,
                                    { state: { fish } },
                                  );
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="pb-3 px-4"></div>
                  </div>
                </div>
              ))}

              {isMobile && (
                <div className="flex flex-col gap-2">
                  {followUpQuestions.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Follow-up questions
                    </p>
                  )}
                  <FollowUpQuestions
                    followUpQuestions={followUpQuestions}
                    followUpLoading={followUpLoading}
                    loading={loading}
                    handleSuggestionClick={handleSuggestionClick}
                  />
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Thinking...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <Card className="p-3 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-sm">
                    {error}
                  </Card>
                </div>
              )}

              <div className="h-[200px] md:hidden"></div>

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Input Form - Fixed at bottom on mobile, static on desktop */}

      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 md:static md:bottom-auto md:border-t md:w-full md:mx-auto md:mb-4">
        {/* Follow-up questions chips or loading skeleton */}

        {!isMobile && (
          <FollowUpQuestions
            followUpQuestions={followUpQuestions}
            followUpLoading={followUpLoading}
            loading={loading}
            handleSuggestionClick={handleSuggestionClick}
          />
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mx-auto relative"
        >
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img
                src={selectedImage}
                alt="Selected image"
                className="max-w-32 h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImageFile(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
          <div className="relative flex items-center overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-col pr-[2] pl-0 rounded-2xl">
            {/* Image upload button */}
            <Textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedImage ? "Ask about this image..." : "Send a message..."
              }
              className="resize-none flex-1 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent bg-transparent text-gray-900 dark:text-gray-100 border-none my-auto grow h-px shadow-none py-6 px-4 outline-none"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <div className="gap-[auto] justify-between w-full flex items-baseline px-2">
              <label htmlFor="image-upload" className="cursor-pointer px-[2px]">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // Handle image upload
                    const file = e.target.files?.[0];
                    if (file) {
                      // Create preview URL
                      const previewUrl = URL.createObjectURL(file);
                      setSelectedImage(previewUrl);
                      setImageFile(file);
                      // Reset the input to allow selecting the same file again
                      e.target.value = "";
                    }
                  }}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors my-auto text-gray-300"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </label>
              <Button
                type="submit"
                size="icon"
                disabled={(!query.trim() && !imageFile) || loading}
                className={`bg-transparent hover:bg-transparent ${query.trim() || imageFile ? "text-blue-500 dark:text-blue-400" : "text-gray-400"} hover:text-blue-500 dark:hover:text-blue-400 h-10 w-10 flex-shrink-0 p-0 flex items-center justify-center`}
                variant="ghost"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Navigation - Fixed at bottom on mobile, hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

const FollowUpQuestions = ({
  followUpQuestions,
  followUpLoading,
  loading,
  handleSuggestionClick,
}: {
  followUpQuestions: string[];
  followUpLoading: boolean;
  loading: boolean;
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  return (
    <TooltipProvider>
      {followUpLoading ? (
        <div className="flex overflow-x-auto gap-2 mb-3 w-full max-w-2xl mx-auto scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={`skeleton-chip-${i}`}
              className="rounded-full px-4 py-2 bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-32 flex-shrink-0"
            />
          ))}
        </div>
      ) : followUpQuestions.length > 0 ? (
        <div className="flex overflow-x-auto gap-2 pb-3 mb-1 w-full max-w-2xl mx-auto scrollbar-hide">
          {followUpQuestions.map((q, i) => (
            <Tooltip key={`followup-tooltip-${i}`}>
              <TooltipTrigger asChild>
                <Button
                  key={`followup-${i}`}
                  variant="outline"
                  className="rounded-full px-2 py-2 text-xs truncate justify-start flex-shrink-0 overflow-hidden whitespace-nowrap bg-[#025DFB1A] hover:bg-[#025DFB33] text-[#0251FB] hover:text-[#0251FB] shadow-none border-none"
                  onClick={() => handleSuggestionClick(q)}
                  disabled={loading}
                >
                  <span className="">{q}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{q}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : null}
    </TooltipProvider>
  );
};

export default SearchPage;
