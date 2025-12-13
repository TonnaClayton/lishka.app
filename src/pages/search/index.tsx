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
import BottomNav from "@/components/bottom-nav";
import useDeviceSize from "@/hooks/use-device-size";
import useIsMobile from "@/hooks/use-is-mobile";
import { cn, generateFishSlug } from "@/lib/utils";
import { error as logError } from "@/lib/logging";
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
  searchQueryKeys,
} from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import SearchPageSkeleton from "@/hooks/queries/search/skeleton";
import { SearchHistorySheet } from "./search-history-sheet";
import { useAuth } from "@/contexts/auth-context";
import LocationBtn from "@/components/location-btn";
import { captureEvent } from "@/lib/posthog";
import SearchGearCard from "./gear-card";
import { toGearItem } from "@/lib/gear";
import { toImageMetadataItem } from "@/lib/gallery-photo";
import SearchPhotoCard from "./photo-card";

interface Message {
  id: string;
  user_role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  fish_results?: Fish[];
  gear_results?: Array<{
    id: string;
  }>;
  photo_gallery_results?: Array<{
    url: string;
    timestamp: string;
    fishInfo: {
      name: string;
      estimatedSize: string;
      estimatedWeight: string;
      confidence: number;
    };
  }>;
  image?: string;
}

interface Fish {
  id: string;
  name: string;
  scientific_name?: string;
  image?: string;
  habitat: string;
  slug: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  is_toxic: boolean;
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
  const { profile } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [hasGeneratedFollowUp, setHasGeneratedFollowUp] = useState(false);
  const [clickedFollowUpQuestions, setClickedFollowUpQuestions] = useState<
    Set<string>
  >(new Set());
  const [hideFollowUpQuestions, setHideFollowUpQuestions] = useState(false);

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
          // clear the cached messages and return the cached messages
          sessionStorage.removeItem(`search_messages_${id}`);
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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { data: session, isLoading: isLoadingSession } = useGetSearchSession(
    id || "",
  );
  const {
    data: followUpQuestions,
    isLoading: followUpLoading,
    refetch: refetchFollowUpQuestions,
    isRefetching: isRefetchingFollowUpQuestions,
  } = useGetSearchSessionFollowQuestions(id);
  const { refetch: refetchSessions } = useGetSearchSessions();
  const mutation = useCreateSearchSession();

  const useImperialUnits = useMemo(() => {
    return profile?.use_imperial_units || false;
  }, [profile]);

  const deviceSize = useDeviceSize();
  const isMobile = useIsMobile();

  const fixBrokenBase64Url = (url: string | null): string | null => {
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
          images: message.metadata?.images?.map(fixBrokenBase64Url) || [],
          content: message.content,
          timestamp: new Date(message.created_at),
          fish_results: message.metadata?.fish_results || [],
          gear_results: message.metadata?.gear_results || [],
          photo_gallery_results: message.metadata?.photo_gallery_results || [],
        })) || []
      );
    }

    return messages;
  }, [session, messages, id]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    messagesMemo,
    followUpQuestions,
    isRefetchingFollowUpQuestions,
    followUpLoading,
  ]);

  // Extract the API call logic to a separate function
  const processQuery = async (
    queryText: string,
    userMessage: Message,
    imageFiles?: File[],
  ) => {
    try {
      const response = await mutation.mutateAsync({
        message: queryText,
        attachments: imageFiles,
        use_location_context: useLocationContext,
        use_imperial_units: useImperialUnits,
        session_id: id,
      });

      const content: Message = {
        id: response.id,
        user_role: "assistant",
        content: response.content,
        image: fixBrokenBase64Url(response.image),
        images: response.metadata?.images?.map(fixBrokenBase64Url) || [],
        timestamp: new Date(),
        fish_results: response.metadata?.fish_results || [],
        gear_results: response.metadata?.gear_results || [],
        photo_gallery_results: response.metadata?.photo_gallery_results || [],
      };

      if (
        id == undefined ||
        id == null ||
        id == "" ||
        (response.session_id && id != response.session_id)
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
      logError("Error fetching response:", err);
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
    if ((!query.trim() && imageFiles.length === 0) || loading) return;

    // Hide follow-up questions when user types and sends manually
    setHideFollowUpQuestions(true);
    // Reset flag to allow new follow-up questions to be generated
    setHasGeneratedFollowUp(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      user_role: "user",
      content:
        query ||
        `[${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} uploaded]`,
      timestamp: new Date(),
      images: selectedImages,
    };

    // Track search query event
    captureEvent("search_query_submitted", {
      query_length: query.length,
      has_images: imageFiles.length > 0,
      image_count: imageFiles.length,
      use_location_context: useLocationContext,
      is_new_session: !id,
    });

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    const currentImageFiles = [...imageFiles];
    setQuery("");
    setSelectedImages([]);
    setImageFiles([]);
    setLoading(true);
    setError(null);

    // Process the query with error handling
    try {
      await processQuery(
        currentQuery ||
          `What can you tell me about ${currentImageFiles.length > 1 ? "these images" : "this image"}?`,
        userMessage,
        currentImageFiles.length > 0 ? currentImageFiles : undefined,
      );

      refetchFollowUpQuestions();
    } catch (err) {
      logError("Error in handleSubmit:", err);
      setLoading(false);
      setError("Failed to process your search. Please try again.");
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Track follow-up question click
    captureEvent("search_followup_question_clicked", {
      question: suggestion,
      session_id: id,
    });

    // Add the clicked question to the set of clicked questions
    setClickedFollowUpQuestions((prev) => new Set(prev).add(suggestion));
    // Hide follow-up questions immediately when clicked
    setHideFollowUpQuestions(true);
    // Reset flag to allow new follow-up questions to be generated
    setHasGeneratedFollowUp(false);

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

      refetchFollowUpQuestions();
    } catch (err) {
      logError("Error in handleSuggestionClick:", err);
      setLoading(false);
      setError("Failed to process your search. Please try again.");
    }
  };

  // Generate follow-up questions only once after the first assistant message
  useEffect(() => {
    if (
      !hasGeneratedFollowUp &&
      messagesMemo.length > 0 &&
      messagesMemo[messagesMemo.length - 1].user_role === "assistant"
    ) {
      refetchFollowUpQuestions();
      setHasGeneratedFollowUp(true);
      setHideFollowUpQuestions(false); // Show new follow-up questions
    }
  }, [messagesMemo, hasGeneratedFollowUp, refetchFollowUpQuestions]);

  // Reset clicked questions when new follow-up questions are fetched
  useEffect(() => {
    if (followUpQuestions && followUpQuestions.length > 0) {
      setClickedFollowUpQuestions(new Set());
    }
  }, [followUpQuestions]);

  // Reset follow-up generation state when session ID changes
  useEffect(() => {
    setHasGeneratedFollowUp(false);
    setClickedFollowUpQuestions(new Set());
    setHideFollowUpQuestions(false);
  }, [id]);

  // Invalidate search session query when user leaves the page
  useEffect(() => {
    return () => {
      if (id) {
        queryClient.invalidateQueries({
          queryKey: searchQueryKeys.search(id),
        });
      }
    };
  }, [id, queryClient]);

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
                setHasGeneratedFollowUp(false);
                setHideFollowUpQuestions(false);
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
          <LocationBtn
            useLocationContext={useLocationContext}
            location={location}
          />
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
            isMobile && deviceSize.height < 850 && "overflow-y-auto pt-32",
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
                  className={cn(
                    "text-left flex justify-start items-center min-h-[88px] py-3 rounded-2xl border-0 bg-[#E6EFFF] text-lishka-blue w-[48%] shadow-none whitespace-normal hover:text-lishka-blue hover:bg-[#E6EFFF] px-8",
                    isMobile && "py-6 h-auto",
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="break-words">{suggestion}</div>
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
              {messagesMemo.map((message, index) => (
                <SearchMessageCard
                  key={index}
                  message={message}
                  setPreviewImage={setPreviewImage}
                />
              ))}

              {isMobile && (
                <div className="flex flex-col gap-2">
                  {followUpQuestions?.length > 0 && !hideFollowUpQuestions && (
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
                    clickedQuestions={clickedFollowUpQuestions}
                    hideFollowUpQuestions={hideFollowUpQuestions}
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

              <div className="h-[200px] md:h-[250px] lg:hidden"></div>

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}
      {/* Input Form - Fixed at bottom on mobile, static on desktop */}

      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 lg:static lg:bottom-auto lg:border-t md:w-full md:mx-auto lg:mb-4">
        {/* Follow-up questions chips or loading skeleton */}

        {!isMobile && (
          <FollowUpQuestions
            followUpQuestions={followUpQuestions || []}
            followUpLoading={followUpLoading || isRefetchingFollowUpQuestions}
            loading={loading}
            handleSuggestionClick={handleSuggestionClick}
            clickedQuestions={clickedFollowUpQuestions}
            hideFollowUpQuestions={hideFollowUpQuestions}
          />
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mx-auto relative"
        >
          {selectedImages.length > 0 && (
            <div className="py-2 flex overflow-x-auto md:overflow-x-visible md:flex-wrap gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={image}
                    alt={`Selected image ${index + 1}`}
                    className="max-w-32 h-auto rounded-lg border aspect-square border-gray-200 dark:border-gray-700 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Remove the image at the specific index
                      setSelectedImages((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                      setImageFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                      // Clean up the object URL to prevent memory leaks
                      URL.revokeObjectURL(image);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative flex items-center overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-col pr-[2] pl-0 rounded-2xl">
            {/* Image upload button */}
            <Textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedImages.length > 0
                  ? `Ask about ${selectedImages.length > 1 ? "these images" : "this image"}...`
                  : "Send a message..."
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
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    // Handle multiple image upload with 5 file limit
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      const remainingSlots = 5 - imageFiles.length;
                      const filesToAdd = files.slice(0, remainingSlots);

                      if (files.length > remainingSlots) {
                        alert(
                          `You can only upload up to 5 images. Only the first ${remainingSlots} images will be added.`,
                        );
                      }

                      // Create preview URLs for new files
                      const newPreviewUrls = filesToAdd.map((file) =>
                        URL.createObjectURL(file),
                      );
                      setSelectedImages((prev) => [...prev, ...newPreviewUrls]);
                      setImageFiles((prev) => [...prev, ...filesToAdd]);

                      // Reset the input to allow selecting the same files again
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
                disabled={(!query.trim() && imageFiles.length === 0) || loading}
                className={`bg-transparent hover:bg-transparent ${query.trim() || imageFiles.length > 0 ? "text-lishka-blue " : "text-[#989CA3]"} hover:text-lishka-blue h-10 w-10 flex-shrink-0 p-0 flex items-center justify-center`}
                variant="ghost"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Navigation - Fixed at bottom on mobile, hidden on desktop */}

      <BottomNav />

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-full overflow-hidden flex flex-col justify-center items-center max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="object-contain aspect-square rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-all"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SearchMessageCard = ({
  message,
  setPreviewImage,
}: {
  message: Message;
  setPreviewImage: (image: string) => void;
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { profile } = useAuth();

  const allGearItems = useMemo(() => {
    const gearItems =
      profile?.gear_items && Array.isArray(profile.gear_items)
        ? profile.gear_items.map(toGearItem)
        : [];

    return gearItems.filter((item) =>
      message.gear_results?.some((gear) => gear.id === item.id),
    );
  }, [profile?.gear_items]);

  const galleryPhotos = useMemo(() => {
    const userGalleryPhotos =
      profile?.gallery_photos && Array.isArray(profile.gallery_photos)
        ? profile.gallery_photos.map(toImageMetadataItem)
        : [];

    return userGalleryPhotos.filter((photo) =>
      message.photo_gallery_results?.some((result) => result.url === photo.url),
    );
  }, [profile?.gallery_photos]);

  return (
    <div
      key={message.id}
      className={cn(
        "flex",
        message.user_role === "user" ? "justify-end" : "justify-start",
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
        {message.images && message.images.length > 0 && (
          <div className="mb-3 px-4">
            {message.images.length === 1 ? (
              <img
                src={message.images[0]}
                alt="Uploaded image"
                className="max-w-full h-auto rounded-lg max-h-64 object-contain"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                {message.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Uploaded image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPreviewImage(image)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="px-4">
          <MemoizedContent content={message.content} />
        </div>

        {/* Display fish cards if available */}
        {message.fish_results && message.fish_results.length > 0 && (
          <div className="mt-4 space-y-4 w-full">
            <h3 className="font-medium text-sm px-4">Fish Species:</h3>
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
                    !genericNames.includes(fishName) && fishName.trim() !== ""
                  );
                })
                .map((fish) => (
                  <FishCard
                    key={fish.id}
                    name={fish.name}
                    scientificName={fish.scientific_name}
                    habitat={fish.habitat}
                    difficulty={fish.difficulty}
                    isToxic={fish.is_toxic}
                    className="w-[200px] min-h-[250px] flex-shrink-0"
                    onClick={() => {
                      const slug =
                        fish.slug ||
                        generateFishSlug(
                          fish.scientific_name || fish.name || "",
                        );
                      navigate(`/fish/${slug}`, {
                        state: { fish },
                      });
                    }}
                  />
                ))}
            </div>
          </div>
        )}

        {allGearItems && allGearItems.length > 0 && (
          <div className="mt-4 space-y-4 w-full">
            <h3 className="font-medium text-sm px-4">Gear Items:</h3>
            <div className="flex w-full overflow-x-auto gap-2 lg:gap-4 px-4 pb-3">
              {allGearItems.map((gear) => (
                <SearchGearCard key={gear.id} gear={gear} />
              ))}
            </div>
          </div>
        )}

        {galleryPhotos && galleryPhotos.length > 0 && (
          <div className="mt-4 space-y-4 w-full">
            <h3 className="font-medium text-sm px-4">Gallery Photos:</h3>
            <div className="flex w-full overflow-x-auto gap-4 px-4 pb-3">
              {galleryPhotos.map((photo) => (
                <SearchPhotoCard
                  key={photo.url}
                  url={photo.url}
                  name={photo.fishInfo?.name || ""}
                />
              ))}
            </div>
          </div>
        )}
        <div className="pb-3 px-4"></div>
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
  clickedQuestions,
  hideFollowUpQuestions,
}: {
  followUpQuestions?: string[];
  followUpLoading: boolean;
  loading: boolean;
  handleSuggestionClick: (suggestion: string) => void;
  clickedQuestions: Set<string>;
  hideFollowUpQuestions: boolean;
}) => {
  if (
    followUpQuestions == undefined ||
    followUpQuestions == null ||
    hideFollowUpQuestions
  ) {
    return null;
  }

  // Filter out clicked questions
  const visibleQuestions = followUpQuestions.filter(
    (q) => !clickedQuestions.has(q),
  );

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
      ) : visibleQuestions.length > 0 ? (
        <div className="flex overflow-x-auto gap-2 pb-3 mb-1 w-full max-w-2xl mx-auto scrollbar-hide">
          {visibleQuestions.map((q, i) => (
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
