import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, MapPin, ArrowLeft, Loader2, Image } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import FishCard from "./fish-card";
import {
  getPlaceholderFishImage,
  getFishImageUrlSync,
  handleFishImageError,
} from "@/lib/fish-image-service";
import { log } from "@/lib/logging";
import { config } from "@/lib/config";

import { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } from "@/lib/openai-toggle";
import { useImperialUnits } from "@/lib/unit-conversion";
import BottomNav from "./bottom-nav";
import TextareaAutosize from "react-textarea-autosize";
import { useAuth } from "@/contexts/auth-context";

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
  const { profile } = useAuth();

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
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get user location from multiple sources
  useEffect(() => {
    const getUserLocation = () => {
      // First try profile location
      if (profile?.location && profile.location.trim()) {
        setCurrentLocation(profile.location);
        return;
      }

      // Then try localStorage location
      try {
        const savedLocation = localStorage.getItem("userLocationFull");
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation?.name) {
            setCurrentLocation(parsedLocation.name);
            return;
          }
        }
      } catch (error) {
        console.error("Error parsing saved location:", error);
      }

      // Fallback to default
      setCurrentLocation("Malta");
    };

    getUserLocation();

    // Listen for location changes
    const handleLocationChange = () => {
      getUserLocation();
    };

    window.addEventListener("storage", handleLocationChange);
    window.addEventListener("locationChanged", handleLocationChange);

    return () => {
      window.removeEventListener("storage", handleLocationChange);
      window.removeEventListener("locationChanged", handleLocationChange);
    };
  }, [profile?.location]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    imageFile?: File
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
          "OpenAI API key is missing. Please add it in project settings."
        );
      }

      // Prepare messages for the API call
      const unitsInstruction = imperialUnits
        ? "Always provide measurements in imperial units (inches, feet, pounds, ounces, Fahrenheit, miles) as the primary unit, with metric equivalents in parentheses when helpful."
        : "Always provide measurements in metric units (centimeters, meters, grams, kilograms, Celsius, kilometers) as the primary unit, with imperial equivalents in parentheses when helpful.";

      const systemMessage = {
        role: "system",
        content: `You are a fishing expert AI that provides helpful information about fishing techniques, fish species, and fishing locations. ${unitsInstruction} If you mention specific fish species, provide detailed information about them including name, scientific name, habitat, difficulty level, and season availability. ${useLocationContext ? "Focus on fish species and fishing techniques relevant to the user's location." : "Provide global information without focusing on any specific location."}`,
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
            text: `${queryText}\n\nIf your response includes specific fish species, please also include a JSON section at the end of your response in this format: [FISH_DATA]{\"fish\":[{\"name\":\"Fish Name\",\"scientificName\":\"Scientific Name\",\"habitat\":\"Habitat info\",\"difficulty\":\"Difficulty level\",\"season\":\"Season info\",\"toxic\":false}]}[/FISH_DATA]`,
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
            },
          },
        ];
      } else {
        userMessageContent = `${queryText}\n\nIf your response includes specific fish species, please also include a JSON section at the end of your response in this format: [FISH_DATA]{\"fish\":[{\"name\":\"Fish Name\",\"scientificName\":\"Scientific Name\",\"habitat\":\"Habitat info\",\"difficulty\":\"Difficulty level\",\"season\":\"Season info\",\"toxic\":false}]}[/FISH_DATA]`;
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
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      // Extract fish data if present
      let fishData: Fish[] = [];
      const fishDataMatch = assistantResponse.match(
        /\[FISH_DATA\](.+?)\[\/FISH_DATA\]/s
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
            /\[FISH_DATA\].+?\[\/FISH_DATA\]/s,
            ""
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
        currentImageFile || undefined
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
              ? currentLocation || "Getting location..."
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
      <div className="flex-1 overflow-y-auto h-full  pt-16">
        <div className="p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center space-y-6">
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
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={`suggestion-${index}`}
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4 dark:bg-gray-800 dark:border-gray-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="h-[20px] md:hidden"></div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}
                  >
                    {message.image && (
                      <div className="mb-3">
                        <img
                          src={message.image}
                          alt="Uploaded image"
                          className="max-w-full h-auto rounded-lg max-h-64 object-contain"
                        />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Display fish cards if available */}
                    {message.fishResults && message.fishResults.length > 0 && (
                      <div className="mt-4 space-y-4">
                        <h3 className="font-medium text-sm">Fish Species:</h3>
                        <div className="grid grid-cols-1 gap-4">
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
                                onClick={() => {
                                  navigate(
                                    `/fish/${encodeURIComponent(fish.scientificName || fish.name)}`,
                                    { state: { fish } }
                                  );
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

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
          )}
        </div>
      </div>
      {/* Input Form - Fixed at bottom on mobile, static on desktop */}
      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 md:static md:bottom-auto md:border-t md:w-full md:mx-auto md:mb-4">
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

export default SearchPage;
