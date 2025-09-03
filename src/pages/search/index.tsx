import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Send, MapPin, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import FishCard from "@/components/fish-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getImperialUnits } from "@/lib/unit-conversion";
import BottomNav from "@/components/bottom-nav";
import useDeviceSize from "@/hooks/use-device-size";
import useIsMobile from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  useCreateSearchSession,
  useGetSearchSession,
  useGetSearchSessionFollowQuestions,
  useGetSearchSessions,
  useUserLocation,
} from "@/hooks/queries";
import SearchPageSkeleton from "@/hooks/queries/search/skeleton";
import { SearchHistorySheet } from "./search-history-sheet";

interface Message {
  id: string;
  user_role: "user" | "assistant";
  content: string;
  timestamp: Date;
  fish_results?: Fish[];
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
  const routerLocation = useLocation();
  const { location } = useUserLocation();
  const { id } = useParams<{ id?: string }>();
  const [isSuggestedQuestionClicked, setIsSuggestedQuestionClicked] =
    useState(false);

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    const stateMessages = (routerLocation.state?.messages as Message[]) || null;
    if (stateMessages && stateMessages.length > 0) {
      return stateMessages;
    }
    if (id) {
      try {
        const cached = sessionStorage.getItem(`search_messages_${id}`);
        if (cached) {
          return JSON.parse(cached) as Message[];
        }
      } catch {
        // do nothing
      }

      sessionStorage.removeItem(`search_messages_${id}`);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocationContext, setUseLocationContext] = useState(true);
  const [suggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imperialUnits, setImperialUnits] =
    useState<boolean>(getImperialUnits());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { data: session, isLoading: isLoadingSession } = useGetSearchSession(
    id || "",
  );
  const {
    data: followUpQuestions,
    isLoading: followUpLoading,
    // refetch: refetchFollowUpQuestions,
    isRefetching: isRefetchingFollowUpQuestions,
  } = useGetSearchSessionFollowQuestions(id);
  const { refetch: refetchSessions } = useGetSearchSessions();
  const mutation = useCreateSearchSession();
  // const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  // const [followUpLoading, setFollowUpLoading] = useState(false);

  const deviceSize = useDeviceSize();
  const isMobile = useIsMobile();

  const fixBrokenBase64Url = (url: string | null) => {
    if (url != null && url != "") {
      if (
        url.startsWith("data:image/jpeg;base64,") ||
        url.startsWith("data:image/png;base64,")
      ) {
        return url;
      }

      // check if url does not start with data:image/jpeg;base64, or data:image/png;base64,
      // then return null
      if (
        !url.startsWith("data:image/jpeg;base64,") &&
        !url.startsWith("data:image/png;base64,")
      ) {
        return `data:image/jpeg;base64,${url}`;
      }
    }

    return null;
  };

  const messagesMemo: Message[] = useMemo(() => {
    if (id == undefined || id == null) {
      return messages;
    }

    if (id && session && messages.length == 0) {
      return (
        session?.messages.map((message) => ({
          id: message.id,
          user_role: message.user_role,
          image: fixBrokenBase64Url(message.image),
          content: message.content,
          timestamp: new Date(message.created_at),
          fish_results: message.metadata?.fish_results || [],
        })) || []
      );
    }

    return messages;
  }, [session, messages, id]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMemo]);

  // Listen for units changes from settings
  useEffect(() => {
    // const handleUnitsChange = () => {
    //   setImperialUnits(getImperialUnits());
    // };
    // window.addEventListener("unitsChanged", handleUnitsChange);
    // return () => window.removeEventListener("unitsChanged", handleUnitsChange);
  }, []);

  // Convert image to base64
  // const convertImageToBase64 = (file: File): Promise<string> => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = () => resolve(reader.result as string);
  //     reader.onerror = reject;
  //     reader.readAsDataURL(file);
  //   });
  // };

  // Extract the API call logic to a separate function
  const processQuery = async (
    queryText: string,
    userMessage: Message,
    imageFile?: File,
  ) => {
    try {
      const response = await mutation.mutateAsync({
        message: queryText,
        attachment: imageFile,
        use_location_context: useLocationContext,
        use_imperial_units: imperialUnits,
        session_id: id,
      });

      const content: Message = {
        id: response.id,
        user_role: "assistant",
        content: response.content,
        timestamp: new Date(),
        fish_results: response.metadata?.fish_results || [],
      };

      if (
        id == undefined ||
        id == null ||
        id == "" ||
        id != response.session_id
      ) {
        // Cache the initial two messages so they persist across navigation
        try {
          sessionStorage.setItem(
            `search_messages_${response.session_id}`,
            JSON.stringify([userMessage, content]),
          );
        } catch {
          //
        }

        refetchSessions();
        // Update local state so both messages render immediately before navigation
        setMessages([userMessage, content]);
        // Navigate to the canonical session URL without relying on router state
        navigate(`/search/${response.session_id}`, {
          replace: true,
        });
      } else {
        setMessages((prev) => {
          if (prev.length == 0) {
            return [...messagesMemo, content];
          }

          return [...prev, content];
        });
      }
    } catch (err) {
      console.error("Error fetching response:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      // Add a fallback message when an error occurs
      const errorMessage: Message = {
        id: Date.now().toString(),
        user_role: "assistant",
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
      user_role: "user",
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
    setIsSuggestedQuestionClicked(true);
    // Create a user message for the clicked suggestion
    const userMessage: Message = {
      id: Date.now().toString(),
      user_role: "user",
      content: suggestion,
      timestamp: new Date(),
    };

    // Add the message to the chat
    //setMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => {
      if (prev.length == 0) {
        return [...messagesMemo, userMessage];
      }

      return [...prev, userMessage];
    });
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

  // Update follow-up questions after each assistant message
  useEffect(() => {
    if (
      messagesMemo.length > 0 &&
      messagesMemo[messagesMemo.length - 1].user_role === "assistant"
    ) {
      //fetchFollowUpQuestions(messages);
      //refetchFollowUpQuestions();
    } else if (messagesMemo.length === 0) {
      //setFollowUpQuestions([]);
    }
  }, []);

  // Show skeleton while loading session only if we don't have messages from router state
  if (isLoadingSession && messages.length === 0) {
    return <SearchPageSkeleton />;
  }

  return (
    <div
      className="flex flex-col bg-white h-full relative dark:bg-black w-full"
      style={{ "--header-height": "64px" } as React.CSSProperties}
    >
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-4 lg:static py-4">
        <div className="flex items-center gap-2">
          {messagesMemo.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMessages([]);
                setError(null);
                navigate("/search");
              }}
              className="mr-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <SearchHistorySheet />
          )}

          <h1 className="text-lg font-semibold dark:text-white">
            Fishing Assistant
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <MapPin
            size={16}
            className={
              useLocationContext ? "text-lishka-blue" : "text-gray-400"
            }
          />
          <span className="text-xs text-lishka-blue">
            {useLocationContext
              ? location?.name || "Getting location..."
              : "Global search"}
          </span>
          <Switch
            checked={useLocationContext}
            onCheckedChange={setUseLocationContext}
            className="data-[state=checked]:bg-lishka-blue"
          />
        </div>
      </header>
      {/* Scrollable Content Area - With padding for header and input form */}

      {messagesMemo.length === 0 ? (
        <div
          className={cn(
            "flex-1 h-full",
            isMobile && deviceSize.height < 850 && "overflow-y-auto pt-24",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center space-y-6",
              !(isMobile && deviceSize.height < 850) && "h-full",
            )}
          >
            <div className="rounded-full bg-[#E6EFFF] p-3">
              <MapPin className="h-8 w-8 text-lishka-blue" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white">
              Ask me anything about fishing!
            </h2>
            <p className="text-muted-foreground dark:text-gray-400 text-sm mt-0 my-0">
              Get AI advice on techniques, species identification, fishing
              spots, sonar image readings and more.
            </p>
            <div className="flex justify-center gap-2 w-full max-w-md flex-wrap">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={`suggestion-${index}`}
                  variant="outline"
                  className="text-left h-auto py-3 px-2 dark:bg-gray-800 dark:border-gray-700 rounded-2xl border-0 bg-[#E6EFFF] text-lishka-blue justify-center items-center w-[48%]"
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
              {messagesMemo.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.user_role === "user"
                      ? "justify-end"
                      : "justify-start",
                  )}
                >
                  <div
                    // className={`max-w-[85%] rounded-lg px-4 py-3 ${message.role === "user" ? "text-white" : "dark:bg-gray-800 text-gray-900 dark:text-gray-100 bg-blue-500 bg-gray-100"}`}
                    className={cn(
                      "rounded-[16px] pt-3 w-fit max-w-[85%]",
                      isMobile && "max-w-[95%]",
                      message.user_role === "user"
                        ? "bg-lishka-blue text-white"
                        : "bg-[#F7F7F7] text-[#191B1F]",
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
                      <MemoizedContent content={message.content} />
                    </div>

                    {/* Display fish cards if available */}
                    {message.fish_results &&
                      message.fish_results.length > 0 && (
                        <div className="mt-4 space-y-4 w-full">
                          <h3 className="font-medium text-sm px-4">
                            Fish Species:
                          </h3>
                          <div className="flex w-full overflow-x-auto gap-4 px-4 pb-3">
                            {message.fish_results
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

              {isMobile && !isSuggestedQuestionClicked && (
                <div className="flex flex-col gap-2">
                  {followUpQuestions?.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Follow-up questions
                    </p>
                  )}
                  <FollowUpQuestions
                    followUpQuestions={followUpQuestions}
                    followUpLoading={
                      followUpLoading || isRefetchingFollowUpQuestions
                    }
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

        {!isMobile && !isSuggestedQuestionClicked && (
          <FollowUpQuestions
            followUpQuestions={followUpQuestions || []}
            followUpLoading={followUpLoading || isRefetchingFollowUpQuestions}
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
              className="resize-none flex-1 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent bg-transparent text-gray-900 dark:text-gray-100 border-none my-auto grow shadow-none px-4 outline-none py-4 h-[100px]"
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
                  className="hover:text-lishka-blue transition-colors my-auto text-[#989CA3]"
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
                className={`bg-transparent hover:bg-transparent ${query.trim() || imageFile ? "text-lishka-blue " : "text-[#989CA3]"} hover:text-lishka-blue h-10 w-10 flex-shrink-0 p-0 flex items-center justify-center`}
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

const MemoizedContent = React.memo(({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      components={{
        ol: ({ children }) => <ol className="list-decimal">{children}</ol>,
        ul: ({ children }) => <ul className="list-disc">{children}</ul>,
        li: ({ children }) => <li className="ml-4">{children}</li>,
        p: ({ children }) => (
          <p className="mb-0.5 text-sm text-text">{children}</p>
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
      {content}
    </ReactMarkdown>
  );
});

const FollowUpQuestions = ({
  followUpQuestions,
  followUpLoading,
  loading,
  handleSuggestionClick,
}: {
  followUpQuestions?: string[];
  followUpLoading: boolean;
  loading: boolean;
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  if (followUpQuestions == undefined || followUpQuestions == null) {
    return null;
  }

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
                  className="rounded-full px-2 py-2 text-xs truncate justify-start flex-shrink-0 overflow-hidden whitespace-nowrap bg-[#0251FB1A] hover:bg-[#0251FB33] text-lishka-blue hover:text-lishka-blue shadow-none border-none"
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
