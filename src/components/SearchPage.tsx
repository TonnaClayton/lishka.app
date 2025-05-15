import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowRight, Search, MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import BottomNav from "./BottomNav";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import FishCard from "./FishCard";
import LoadingDots from "./LoadingDots";
import { getFishImageUrl } from "@/lib/fishbase-api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  fishResults?: Fish[];
  followUpQuestions?: string[];
  fishingTechniques?: string[];
}

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    dispatchTechniqueClick?: (technique: string) => void;
  }
}

interface Fish {
  id: string;
  name: string;
  scientificName?: string;
  image: string;
  habitat: string;
  difficulty: "Easy" | "Intermediate" | "Advanced" | "Expert";
  season: string;
  toxic: boolean;
}

// Default suggestions as fallback
const DEFAULT_SUGGESTIONS = [
  "What fish can I catch in shallow waters?",
  "Best bait for tuna fishing?",
  "How to fish for bass from shore?",
  "Fishing techniques for beginners",
  "What's the best time to catch salmon?",
  "Offshore fishing safety tips",
  "How to identify toxic fish species?",
  "Best fishing spots near me",
];

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocationContext, setUseLocationContext] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [location, setLocation] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsInitialized = useRef<boolean>(false);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up global event handler for technique clicks and initialize suggestions
  useEffect(() => {
    // Create a global function to handle technique clicks
    window.dispatchTechniqueClick = (technique) => {
      handleSuggestionClick(technique);
    };

    return () => {
      // Clean up when component unmounts
      delete window.dispatchTechniqueClick;
    };
  }, []); // Empty dependency array means this runs once on mount

  // Initialize suggestions with default values only once on mount
  useEffect(() => {
    // Set default suggestions immediately on mount
    setSuggestions(DEFAULT_SUGGESTIONS);
    // Mark as initialized to prevent further updates
    suggestionsInitialized.current = true;
  }, []);

  // Get location from localStorage and generate location-based suggestions
  // This effect should only run once after the component is mounted
  useEffect(() => {
    // Skip if we've already initialized suggestions
    if (suggestionsInitialized.current) return;
    const generateLocationBasedSuggestions = async (locationName: string) => {
      if (!locationName) return;

      try {
        // Check if API key is available
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          console.error("OpenAI API key is missing");
          return;
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
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `You are a fishing expert AI. Generate 4 short, specific fishing-related questions or search queries that would be relevant for someone fishing in ${locationName}. Focus on local fish species, techniques, and spots. Keep each suggestion under 50 characters. Return ONLY a JSON array of strings with no additional text.`,
                },
              ],
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
          // Try to parse the response as JSON
          const parsedSuggestions = JSON.parse(content);
          if (
            Array.isArray(parsedSuggestions) &&
            parsedSuggestions.length > 0
          ) {
            // Only update if we have valid suggestions and they're different from current ones
            const currentSuggestions = suggestions.slice(0, 4).join(",");
            const newSuggestions = parsedSuggestions.slice(0, 4).join(",");
            if (currentSuggestions !== newSuggestions) {
              setSuggestions(parsedSuggestions);
            }
            return;
          }
        } catch (err) {
          // If parsing fails, try to extract array from the text
          const match = content.match(/\[([^\]]*)\]/);
          if (match && match[1]) {
            try {
              const extractedArray = JSON.parse(`[${match[1]}]`);
              if (Array.isArray(extractedArray) && extractedArray.length > 0) {
                // Only update if we have valid suggestions and they're different from current ones
                const currentSuggestions = suggestions.slice(0, 4).join(",");
                const newSuggestions = extractedArray.slice(0, 4).join(",");
                if (currentSuggestions !== newSuggestions) {
                  setSuggestions(extractedArray);
                }
                return;
              }
            } catch (e) {
              console.error("Failed to extract suggestions array", e);
            }
          }
        }
      } catch (err) {
        console.error("Error generating suggestions:", err);
      }
    };

    // Get location from localStorage instead of requesting it
    const getLocationFromStorage = () => {
      if (useLocationContext) {
        try {
          const savedLocation = localStorage.getItem("userLocation");
          if (savedLocation) {
            const parsedLocation = JSON.parse(savedLocation);

            let locationName;

            // Check if the location is coordinates (for sea locations)
            if (
              parsedLocation.name &&
              parsedLocation.name.includes(",") &&
              !isNaN(parseFloat(parsedLocation.name.split(",")[0].trim()))
            ) {
              // It's coordinates, keep as is
              locationName = parsedLocation.name;
            }
            // Check if it's a country sea
            else if (
              parsedLocation.name &&
              parsedLocation.name.toLowerCase().includes("sea")
            ) {
              // It's already a country sea, keep as is
              locationName = parsedLocation.name;
            }
            // Otherwise extract just the country
            else if (parsedLocation.name && parsedLocation.name.includes(",")) {
              // Extract country from "City, Country" format
              const parts = parsedLocation.name.split(",");
              locationName = parts[parts.length - 1].trim();
            } else {
              // Use as is or default
              locationName = parsedLocation.name || "your area";
            }

            setLocation(locationName);
            generateLocationBasedSuggestions(locationName);
          } else {
            setLocation("your area");
          }
        } catch (error) {
          console.error("Error getting location from storage:", error);
          setLocation("your area");
        }
      } else {
        // If location context is disabled, use general fishing suggestions
        // Only update if current suggestions aren't already DEFAULT_SUGGESTIONS
        if (suggestions !== DEFAULT_SUGGESTIONS) {
          setSuggestions(DEFAULT_SUGGESTIONS);
        }
        setLocation("");
      }
    };

    getLocationFromStorage();
  }, []); // Empty dependency array ensures this only runs once

  // Extract the API call logic to a separate function
  const processQuery = async (queryText: string, userMessage: Message) => {
    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "OpenAI API key is missing. Please add it in project settings.",
        );
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
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a fishing expert AI that provides helpful information about fishing techniques, fish species, and fishing locations. If you mention specific fish species, provide detailed information about them including name, scientific name, habitat, difficulty level, and season availability. ${useLocationContext ? "Focus on fish species and fishing techniques relevant to the user's location." : "Provide global information without focusing on any specific location."}`,
              },
              ...messages
                .filter((msg) => msg.id !== userMessage.id)
                .map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
              {
                role: "user",
                content: `${queryText}\n\nIf your response includes specific fish species, please also include a JSON section at the end of your response in this format: [FISH_DATA]{\"fish\":[{\"name\":\"Fish Name\",\"scientificName\":\"Scientific Name\",\"habitat\":\"Habitat info\",\"difficulty\":\"Difficulty level\",\"season\":\"Season info\",\"toxic\":false}]}[/FISH_DATA]\n\nAlso include 2-3 very short, concise follow-up questions (max 20 characters each) that the user might want to ask next. Keep them direct and to the point. Format them as: [FOLLOW_UP_QUESTIONS][\"Short Q1?\", \"Short Q2?\", \"Short Q3?\"][/FOLLOW_UP_QUESTIONS]\n\nAdditionally, if you mention any fishing techniques or methods (like jigging, trolling, fly fishing, etc.), list them in a separate section: [FISHING_TECHNIQUES][\"Technique 1\", \"Technique 2\", \"Technique 3\"][/FISHING_TECHNIQUES]`,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      // Extract fish data if present
      let fishData: Fish[] = [];
      const fishDataMatch = assistantResponse.match(
        /\[FISH_DATA\](.+?)\[\/FISH_DATA\]/s,
      );

      // Extract follow-up questions if present
      let followUpQuestions: string[] = [];
      const followUpMatch = assistantResponse.match(
        /\[FOLLOW_UP_QUESTIONS\](.+?)\[\/FOLLOW_UP_QUESTIONS\]/s,
      );

      // Extract fishing techniques if present
      let fishingTechniques: string[] = [];
      const techniquesMatch = assistantResponse.match(
        /\[FISHING_TECHNIQUES\](.+?)\[\/FISHING_TECHNIQUES\]/s,
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
              image: getFishImageUrl(fish.name, fish.scientificName),
              habitat: fish.habitat,
              difficulty: fish.difficulty,
              season: fish.season,
              toxic: fish.toxic === true,
            }));
          }

          // Remove the fish data section from the displayed response
          cleanedResponse = assistantResponse.replace(
            /\[FISH_DATA\].+?\[\/FISH_DATA\]/s,
            "",
          );
        } catch (err) {
          console.error("Error parsing fish data:", err);
        }
      }

      // Process follow-up questions if present
      if (followUpMatch && followUpMatch[1]) {
        try {
          // First try to parse as JSON
          try {
            followUpQuestions = JSON.parse(followUpMatch[1]);
          } catch (jsonErr) {
            // If JSON parsing fails, try to extract questions from the text
            const questionText = followUpMatch[1];

            // Check if it contains quoted strings
            const quotedMatches = questionText.match(/"([^"]+)"/g);
            if (quotedMatches) {
              followUpQuestions = quotedMatches.map((q) => q.replace(/"/g, ""));
            } else {
              // Split by commas or line breaks if no quotes
              followUpQuestions = questionText
                .split(/[,\n]+/)
                .map((q) => q.trim())
                .filter(
                  (q) => q.length > 0 && !q.includes("[") && !q.includes("]"),
                );
            }
          }

          // Remove the follow-up questions section from the displayed response
          cleanedResponse = cleanedResponse.replace(
            /\[FOLLOW_UP_QUESTIONS\].+?\[\/FOLLOW_UP_QUESTIONS\]/s,
            "",
          );

          // Also remove any other follow-up questions text that might be displayed
          cleanedResponse = cleanedResponse.replace(
            /\*\*Follow-up questions:\*\*/g,
            "",
          );
          cleanedResponse = cleanedResponse.replace(
            /Follow-up questions:/g,
            "",
          );
        } catch (err) {
          console.error("Error processing follow-up questions:", err);
        }
      }

      // Process fishing techniques if present
      if (techniquesMatch && techniquesMatch[1]) {
        try {
          // First try to parse as JSON
          try {
            fishingTechniques = JSON.parse(techniquesMatch[1]);
          } catch (jsonErr) {
            // If JSON parsing fails, try to extract techniques from the text
            const techniquesText = techniquesMatch[1];

            // Check if it contains quoted strings
            const quotedMatches = techniquesText.match(/"([^"]+)"/g);
            if (quotedMatches) {
              fishingTechniques = quotedMatches.map((t) => t.replace(/"/g, ""));
            } else {
              // Split by commas or line breaks if no quotes
              fishingTechniques = techniquesText
                .split(/[,\n]+/)
                .map((t) => t.trim())
                .filter(
                  (t) => t.length > 0 && !t.includes("[") && !t.includes("]"),
                );
            }
          }

          // Remove the fishing techniques section from the displayed response
          cleanedResponse = cleanedResponse.replace(
            /\[FISHING_TECHNIQUES\].+?\[\/FISHING_TECHNIQUES\]/s,
            "",
          );
        } catch (err) {
          console.error("Error processing fishing techniques:", err);
        }
      }

      // Clean up any remaining tags or markers
      cleanedResponse = cleanedResponse.replace(/\[FOLLOW_UP_QUESTIONS\]/g, "");
      cleanedResponse = cleanedResponse.replace(
        /\[\/FOLLOW_UP_QUESTIONS\]/g,
        "",
      );

      // Clean up fishing techniques markers
      cleanedResponse = cleanedResponse.replace(/\[FISHING_TECHNIQUES\]/g, "");
      cleanedResponse = cleanedResponse.replace(
        /\[\/FISHING_TECHNIQUES\]/g,
        "",
      );

      // Replace **Technique Name** with styled bold text
      cleanedResponse = cleanedResponse.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>",
      );

      // Handle the case where techniques are listed with dashes/bullets
      // This pattern matches lines starting with - or • followed by a technique name
      const bulletPointPattern = /(^|\n)[-•]\s*([^\n]+)/g;
      cleanedResponse = cleanedResponse.replace(
        bulletPointPattern,
        (match, prefix, techniqueName) => {
          if (
            fishingTechniques &&
            fishingTechniques.includes(techniqueName.trim())
          ) {
            const technique = techniqueName.trim();
            return `${prefix}- <span class='inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' onclick='window.dispatchTechniqueClick && window.dispatchTechniqueClick("${technique.replace(/"/g, "&quot;")}")'>${technique}</span>`;
          }
          return match;
        },
      );

      // Style fishing techniques inline within the text
      if (fishingTechniques && fishingTechniques.length > 0) {
        // Replace each fishing technique mention in the text with a styled version
        fishingTechniques.forEach((technique) => {
          // Create a regex that matches the technique as a whole word
          const regex = new RegExp(`\\b${technique}\\b`, "gi");

          // Replace with styled and clickable version
          cleanedResponse = cleanedResponse.replace(
            regex,
            `<span class='inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' onclick='window.dispatchTechniqueClick && window.dispatchTechniqueClick("${technique.replace(/"/g, "&quot;")}")'>${technique}</span>`,
          );
        });
      }

      // Handle "Fishing Techniques:" section specifically
      const fishingTechniquesHeaderPattern =
        /(Fishing Techniques:|Fishing Techniques)\s*([\s\S]*?)(?=\n\n|$)/gi;
      cleanedResponse = cleanedResponse.replace(
        fishingTechniquesHeaderPattern,
        (match, header, techniquesList) => {
          if (!fishingTechniques || fishingTechniques.length === 0)
            return match;

          // Process each line in the techniques list
          const processedTechniquesList = techniquesList
            .split("\n")
            .map((line) => {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine.startsWith("<span class="))
                return line;

              // Check if line contains a fishing technique
              for (const technique of fishingTechniques) {
                if (
                  trimmedLine.includes(technique) &&
                  !trimmedLine.includes("onclick=")
                ) {
                  // Make the whole line or just the technique clickable
                  const dashPart = trimmedLine.startsWith("-") ? "- " : "";
                  const techniquePart = technique;
                  return `${dashPart}<span class='inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' onclick='window.dispatchTechniqueClick && window.dispatchTechniqueClick("${technique.replace(/"/g, "&quot;")}")'>${techniquePart}</span>`;
                }
              }
              return line;
            })
            .join("\n");

          return `${header}${processedTechniquesList}`;
        },
      );

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: cleanedResponse.trim(),
        timestamp: new Date(),
        fishResults: fishData.length > 0 ? fishData : undefined,
        followUpQuestions:
          followUpQuestions.length > 0 ? followUpQuestions : undefined,
        fishingTechniques:
          fishingTechniques.length > 0 ? fishingTechniques : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error fetching response:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);
    setError(null);

    // Process the query
    await processQuery(query, userMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Set query and immediately submit without waiting for state update
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: suggestion,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);
    setError(null);

    // Process the suggestion directly
    processQuery(suggestion, userMessage);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-background gap-y-0 lg:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-card p-4 w-full lg:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center">
              <img
                src="/logo.svg"
                alt="Fishing AI Logo"
                className="h-8 w-auto dark:hidden"
              />
              <img
                src="/logo-dark.svg"
                alt="Fishing AI Logo"
                className="h-8 w-auto hidden dark:block"
              />
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-3xl">
            <h1 className="text-xl font-semibold dark:text-white">Search</h1>
          </div>
          <div className="flex items-center">
            <img
              src="https://storage.googleapis.com/tempo-public-images/github%7C43638385-1746801732510-image.png"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto pb-32 lg:pb-16 lg:max-w-3xl lg:mx-auto">
        <div className="lg:max-w-3xl lg:mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-8 max-w-xl">
                <Search size={48} className="mx-auto mb-4 text-blue-500" />
                <h2 className="text-2xl font-bold mb-2 dark:text-white lg:text-3xl">
                  Ask me anything about fishing
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-3 lg:text-lg">
                  Get expert advice on fishing techniques, species
                  identification, and more
                </p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={16}
                      className={
                        useLocationContext ? "text-blue-500" : "text-gray-400"
                      }
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {useLocationContext
                        ? `Location-based results${location ? ` (${location})` : ""}`
                        : "Global results"}
                    </span>
                    <Switch
                      checked={useLocationContext}
                      onCheckedChange={setUseLocationContext}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full max-w-xl px-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Try asking about:
                </h3>
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <Button
                      key={`suggestion-${index}-${suggestion.substring(0, 10)}`}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer bg-gray-50 dark:bg-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors h-auto px-4 py-2 text-sm rounded-full border-gray-200 dark:border-gray-600 max-w-[90%] break-words"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="line-clamp-2 text-left">
                        {suggestion}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] lg:max-w-[90%] rounded-lg px-4 py-3 ${message.role === "user" ? "bg-primary text-white" : "bg-white dark:bg-card dark:text-gray-200 shadow"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-bold">
                            AI
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Fishing Assistant
                        </span>
                      </div>
                    )}
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    ></div>

                    {/* Display fish cards in carousel if available */}
                    {message.fishResults && message.fishResults.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium text-sm mb-3 dark:text-white">
                          Fish Species:
                        </h3>
                        <Carousel className="w-full">
                          <CarouselContent className="-ml-4">
                            {message.fishResults.map((fish) => (
                              <CarouselItem
                                key={fish.id}
                                className="pl-4 md:basis-1/2 lg:basis-1/3 basis-[85%]"
                              >
                                <FishCard
                                  name={fish.name}
                                  scientificName={fish.scientificName}
                                  image={fish.image}
                                  habitat={fish.habitat}
                                  difficulty={fish.difficulty}
                                  season={fish.season}
                                  isToxic={fish.toxic}
                                  onClick={() => {
                                    navigate(
                                      `/fish/${encodeURIComponent(fish.name)}`,
                                      {
                                        state: { image: fish.image },
                                      },
                                    );
                                  }}
                                />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                        </Carousel>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} className="h-4" />

              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-white dark:bg-card shadow">
                    <LoadingDots color="#0251FB" size={6} />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <Card className="p-3 bg-destructive/10 border-destructive/50 text-destructive text-sm">
                    {error}
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {/* Follow-up Questions as Carousel */}
      {messages.length > 0 &&
        messages[messages.length - 1].role === "assistant" &&
        messages[messages.length - 1].followUpQuestions &&
        messages[messages.length - 1].followUpQuestions.length > 0 && (
          <div
            className="fixed bottom-[120px] lg:bottom-[80px] left-0 right-0 px-4 py-3 bg-white dark:bg-card border-t border-gray-200 dark:border-border/30 z-10"
            style={{ minHeight: "64px" }}
          >
            <div className="flex flex-wrap gap-2 justify-start items-center w-full lg:max-w-3xl lg:mx-auto">
              {messages[messages.length - 1].followUpQuestions?.map(
                (question, idx) => (
                  <Button
                    key={`q-${idx}-${question.substring(0, 10)}`}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer bg-gray-50 dark:bg-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors h-auto px-4 py-2 text-sm rounded-full border-gray-200 dark:border-gray-600 max-w-[90%] break-words"
                    onClick={() => handleSuggestionClick(question)}
                  >
                    <span className="line-clamp-2 text-left">{question}</span>
                  </Button>
                ),
              )}
            </div>
          </div>
        )}
      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-[56px] lg:bottom-0 left-0 right-0 px-4 py-3 bg-white dark:bg-card border-t border-gray-200 dark:border-border/30 shadow-lg flex justify-center items-center z-10 lg:pl-64"
      >
        <div className="flex items-center gap-2 max-w-3xl w-full mx-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about fishing techniques, species, or locations..."
            className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400 rounded-full py-6"
            disabled={loading}
            style={{ fontSize: "16px" }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || loading}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full h-12 w-12 flex-shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default SearchPage;
