import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/queries/api";
import { Badge } from "@/components/ui/badge";
import {
  getFishImageUrl,
  getPlaceholderFishImage,
} from "@/lib/fish-image-service";

// Simple debounce hook for values
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface FishSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  image: string | null;
  waterType?: string | null;
  family?: string | null;
  isToxic?: boolean;
}

interface SearchResponse {
  data: FishSpecies[];
  query: string;
  count: number;
}

interface SearchErrorResponse {
  error: string;
  query: string;
}

interface FishSearchProps {
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  onFishSelect?: (fish: FishSpecies) => void;
  className?: string;
}

// Component to load fish images like FishCard does
function FishSearchImage({
  commonName,
  scientificName,
  initialImage,
}: {
  commonName: string;
  scientificName: string;
  initialImage: string | null;
}) {
  const [imageUrl, setImageUrl] = useState<string>(
    initialImage || getPlaceholderFishImage(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      // Only load if we don't have a good image
      if (
        !initialImage ||
        initialImage.includes("placeholder") ||
        initialImage.includes("unsplash")
      ) {
        try {
          const url = await getFishImageUrl(commonName, scientificName);
          setImageUrl(url);
        } catch {
          setImageUrl(getPlaceholderFishImage());
        }
      } else {
        setImageUrl(initialImage);
      }
      setIsLoading(false);
    };

    loadImage();
  }, [commonName, scientificName, initialImage]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={imageUrl}
        alt={commonName}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageUrl(getPlaceholderFishImage());
          setIsLoading(false);
        }}
      />
    </>
  );
}

export function FishSearch({
  onSearchFocus,
  onSearchBlur,
  onFishSelect,
  className,
}: FishSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FishSpecies[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query to avoid too many API calls
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 3) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      setError(null);

      try {
        const url = `fish/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`;
        console.log("[FishSearch] Fetching:", url);

        const response = await api<SearchResponse | SearchErrorResponse>(url, {
          method: "GET",
        });

        console.log("[FishSearch] Response:", response);

        // Check if response is an error
        if ("error" in response) {
          setError(response.error);
          setResults([]);
        } else {
          setResults(response.data || []);
        }
      } catch (err) {
        console.error("[FishSearch] Error:", err);
        // Show more specific error message
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to search. Please try again.";
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onSearchFocus?.();

    // Scroll input into view on mobile when keyboard opens
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 300);
  }, [onSearchFocus]);

  const handleBlur = useCallback(() => {
    // Delay blur to allow click events on results
    setTimeout(() => {
      setIsFocused(false);
      if (searchQuery.length < 3) {
        onSearchBlur?.();
      }
    }, 200);
  }, [searchQuery.length, onSearchBlur]);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    setIsFocused(false);
    onSearchBlur?.();
    inputRef.current?.blur();
  }, [onSearchBlur]);

  const handleFishClick = useCallback(
    (fish: FishSpecies) => {
      onFishSelect?.(fish);
      setSearchQuery("");
      setResults([]);
      setHasSearched(false);
      setIsFocused(false);
      onSearchBlur?.();
    },
    [onFishSelect, onSearchBlur],
  );

  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 3) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="text-lishka-blue font-semibold">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Search Input Container */}
      <div className="flex gap-2 items-center justify-center relative w-full">
        <motion.div
          className={cn(
            "bg-[rgba(25,27,31,0.05)] dark:bg-gray-800 relative rounded-xl flex-1",
          )}
          animate={{
            boxShadow: isFocused
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
              : "0 0 0 0 rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center px-3 h-11">
            <motion.div
              animate={{ scale: isFocused ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-lishka-blue animate-spin shrink-0" />
              ) : (
                <Search className="h-5 w-5 text-[rgba(25,27,31,0.4)] dark:text-gray-400 shrink-0" />
              )}
            </motion.div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Search fish species..."
              className="flex-1 ml-2 bg-transparent border-none outline-none placeholder:text-[rgba(25,27,31,0.4)] dark:placeholder:text-gray-500 text-gray-900 dark:text-white text-sm"
            />
            {/* Fixed width container for clear button to prevent height shift */}
            <div className="w-6 h-6 flex items-center justify-center">
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      setSearchQuery("");
                      setResults([]);
                      setHasSearched(false);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Close Button - Only shows when focused */}
        <AnimatePresence>
          {isFocused && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={handleClose}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {hasSearched && !isLoading && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-3 space-y-2"
          >
            {results.map((fish, index) => (
              <motion.div
                key={fish.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFishClick(fish)}
                className="bg-white dark:bg-gray-800 flex items-center gap-3 p-2 rounded-xl cursor-pointer shadow-sm"
              >
                {/* Fish Image */}
                <motion.div
                  className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <FishSearchImage
                    commonName={fish.commonName}
                    scientificName={fish.scientificName}
                    initialImage={fish.image}
                  />
                  {fish.isToxic && (
                    <Badge
                      variant="destructive"
                      className="absolute bottom-1 right-1 text-[10px] py-0 px-1.5 rounded-full bg-[#FF004D] text-white"
                    >
                      Toxic
                    </Badge>
                  )}
                </motion.div>

                {/* Fish Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {highlightMatch(fish.commonName, searchQuery)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                    {highlightMatch(fish.scientificName, searchQuery)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && searchQuery.length >= 3 && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-3 space-y-2"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 flex items-center gap-3 p-2 rounded-xl shadow-sm animate-pulse"
              >
                <div className="w-24 h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-3 p-4 text-center bg-red-50 dark:bg-red-900/20 rounded-xl"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* No Results State */}
        {hasSearched && !isLoading && !error && results.length === 0 && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-3 p-4 text-center"
          >
            <p className="text-sm text-[rgba(25,27,31,0.6)] dark:text-gray-400">
              No fish species found matching "{searchQuery}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FishSearch;
