import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Fish,
  Thermometer,
  Wind,
  Waves,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "./ui/carousel";
import { OPENAI_ENABLED, OPENAI_DISABLED_MESSAGE } from "@/lib/openai-toggle";
import { cacheApiResponse, getCachedApiResponse } from "@/lib/api-helpers";
import LoadingDots from "./LoadingDots";

interface FishingTip {
  title: string;
  content: string;
  category: string;
}

interface WeatherData {
  current?: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly?: {
    temperature_2m: number[];
    weather_code?: number[];
    wind_speed_10m: number[];
  };
}

interface FishingTipsCarouselProps {
  location?: string;
  weatherData?: WeatherData;
}

// Function to highlight keywords in fishing tips
const highlightKeywords = (text: string): string => {
  if (!text) return "";

  // Define patterns for different types of keywords
  const patterns = [
    // Measurements with units (numbers followed by units)
    {
      regex:
        /(\d+(?:-\d+)?(?:\.\d+)?\s*(?:ft|feet|m|cm|inch|inches|°F|°C|mph|km\/h|knots))/g,
      replacement: "<strong>$1</strong>",
    },

    // Depths and ranges
    {
      regex: /(\d+(?:-\d+)?\s*(?:ft|feet|m|meters)\s*(?:depth|deep))/gi,
      replacement: "<strong>$1</strong>",
    },

    // Times of day
    {
      regex:
        /\b(dawn|dusk|sunrise|sunset|morning|afternoon|evening|night|early|late)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Fishing techniques
    {
      regex:
        /\b(trolling|casting|jigging|spinning|bottom fishing|fly fishing|bait fishing|lure fishing)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Bait types
    {
      regex:
        /\b(live bait|cut bait|artificial bait|dead bait|chum|worms|minnows|shrimp|squid|crab|clams|nightcrawlers|leeches|crickets|grasshoppers)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Lure types
    {
      regex:
        /\b(spoons|spinners|crankbaits|jerkbaits|topwater|soft plastics|jigs|swimbaits|plugs|poppers|spinnerbaits|buzzbaits|flies|streamers|nymphs|dry flies|wet flies)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Locations
    {
      regex:
        /\b(shallow|deep|offshore|inshore|nearshore|reef|structure|weed beds|drop-offs|flats)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Weather conditions
    {
      regex: /\b(cloudy|sunny|windy|calm|overcast|rainy|stormy|clear)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Water conditions
    {
      regex: /\b(murky|clear|warm|cold|hot|cool|choppy|flat|rough)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Seasons
    {
      regex: /\b(spring|summer|fall|autumn|winter)\b/gi,
      replacement: "<strong>$1</strong>",
    },

    // Temperature ranges
    { regex: /(\d+(?:-\d+)?\s*degrees)/gi, replacement: "<strong>$1</strong>" },

    // Specific fish species (common ones)
    {
      regex:
        /\b(bass|trout|salmon|tuna|marlin|snapper|grouper|wahoo|mahi|dorado|tarpon|bonefish|redfish)\b/gi,
      replacement: "<strong>$1</strong>",
    },
  ];

  // Apply each pattern to the text
  let result = text;
  patterns.forEach((pattern) => {
    result = result.replace(pattern.regex, pattern.replacement);
  });

  return result;
};

const FishingTipsCarousel: React.FC<FishingTipsCarouselProps> = ({
  location = "Miami Coast",
  weatherData,
}) => {
  const [tips, setTips] = useState<FishingTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [weatherSummary, setWeatherSummary] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [maxCardHeight, setMaxCardHeight] = useState<number | null>(null);
  const tipContentRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Get current season based on month
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
  };

  // Get current month name
  const getCurrentMonth = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[new Date().getMonth()];
  };

  const fetchFishingTips = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!OPENAI_ENABLED) {
        throw new Error(OPENAI_DISABLED_MESSAGE);
      }

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key is missing");
      }

      const currentSeason = getCurrentSeason();
      const currentMonth = getCurrentMonth();
      const cacheKey = `fishing_tips_${location}_${currentMonth}_${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

      // Check cache first
      const cachedData = getCachedApiResponse(cacheKey);
      if (cachedData) {
        console.log("Using cached fishing tips for", location, currentMonth);
        setTips(cachedData);
        setLoading(false);
        return;
      }

      // Get weather context if available
      const weatherContext = weatherData
        ? `Current Weather: Temperature - ${weatherData.current?.temperature_2m || "Unknown"}°C, Wind Speed - ${weatherData.current?.wind_speed_10m || "Unknown"} km/h, Wave Height - ${weatherData.current?.wave_height || "Unknown"} m.`
        : "";

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert fishing instructor. Create educational, actionable fishing guidance that teaches anglers WHY and HOW to fish effectively. Be direct, specific, and instructional. Each tip should guide the angler's decision-making with clear reasoning. You must respond with ONLY a valid JSON array. No explanations, markdown, or extra text.",
              },
              {
                role: "user",
                content: `Generate exactly 5 educational fishing tips for ${location} in ${currentSeason} (${currentMonth}). ${weatherContext}
              
              Make each tip educational and guiding - teach the angler something specific they can apply immediately. Focus on:
              - WHY certain techniques work in current conditions
              - HOW to adjust methods for weather/season
              - WHAT specific actions to take
              
              Examples of educational style:
              - "Target 5-8m depths - fish move deeper when water warms above 24°C."
              - "Use bright lures in murky water - visibility drops to 0.6m after rain."
              - "Fish dawn/dusk in summer - metabolism peaks at 20-22°C water temps."
              
              Requirements:
              - Maximum 150 characters per tip
              - Include specific numbers/measurements
              - ALWAYS use metric units (meters, degrees Celsius) for all measurements
              - Explain the reasoning behind the advice
              - Focus on current weather/seasonal conditions
              
              Format: [{"title":"Educational Tip","content":"Instructional guidance (max 100 chars)","category":"Weather|Technique|Bait|Timing|Location"}]
              
              Return only the JSON array.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      let fishingTips: FishingTip[];
      try {
        // Clean the response
        let jsonStr = content.trim();
        jsonStr = jsonStr.replace(/```json\s*|```\s*|```/g, "");
        jsonStr = jsonStr.replace(/^[^\[\{]*/, "");
        jsonStr = jsonStr.replace(/[^\]\}]*$/, "");

        const arrayStart = jsonStr.indexOf("[");
        const arrayEnd = jsonStr.lastIndexOf("]");

        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1);
        }

        console.log("Cleaned fishing tips JSON:", jsonStr);
        fishingTips = JSON.parse(jsonStr);

        if (!Array.isArray(fishingTips)) {
          throw new Error("Response is not an array");
        }

        // Validate and ensure proper structure
        fishingTips = fishingTips.map((tip, index) => ({
          title: tip.title || `Fishing Tip ${index + 1}`,
          content: tip.content || "No content available",
          category: tip.category || "General",
        }));
      } catch (e) {
        console.error("Error parsing fishing tips:", e);
        console.error("Raw response:", content);

        // Fallback tips
        fishingTips = [
          {
            title: "Early Morning Success",
            content:
              "Fish are most active during dawn and dusk when water temperatures are cooler. Plan your fishing trips around these golden hours for better results.",
            category: "Timing",
          },
          {
            title: "Weather Awareness",
            content:
              "Overcast days often provide excellent fishing conditions as fish feel more secure and venture into shallower waters to feed.",
            category: "Weather",
          },
          {
            title: "Bait Selection",
            content:
              "Match your bait to local prey species. Live bait typically outperforms artificial lures, especially when fish are being selective.",
            category: "Bait",
          },
          {
            title: "Structure Fishing",
            content:
              "Focus on underwater structures like reefs, drop-offs, and weed beds where fish congregate for shelter and feeding opportunities.",
            category: "Location",
          },
          {
            title: "Patience and Persistence",
            content:
              "Stay quiet and patient. Fish can be easily spooked by noise and sudden movements, especially in shallow or clear water.",
            category: "Technique",
          },
        ];
      }

      setTips(fishingTips);
      // Cache for 6 hours
      cacheApiResponse(cacheKey, fishingTips, 6 * 60 * 60 * 1000);
    } catch (err) {
      console.error("Error fetching fishing tips:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch fishing tips",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather data for summary
  const fetchWeatherSummary = async () => {
    if (!location) return;

    setLoadingWeather(true);
    try {
      // Get user's location coordinates
      const savedLocation = localStorage.getItem("userLocationFull");
      let coordinates = { latitude: 25.7617, longitude: -80.1918 }; // Default to Miami

      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation.latitude && parsedLocation.longitude) {
            coordinates = {
              latitude: parsedLocation.latitude,
              longitude: parsedLocation.longitude,
            };
          }
        } catch (e) {
          console.error("Error parsing location:", e);
        }
      }

      // Fetch weather and marine data from Open-Meteo
      const weatherUrl = `https://customer-api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,wind_speed_10m&timezone=auto&apikey=1g8vJZI7DhEIFDIt`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=wave_height`;

      const [weatherResponse, marineResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(marineUrl),
      ]);

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        let marineData = null;

        if (marineResponse.ok) {
          marineData = await marineResponse.json();
        }

        // Create weather summary object
        const temp = weatherData.current?.temperature_2m;
        const windSpeed = weatherData.current?.wind_speed_10m;
        const weatherCode = weatherData.current?.weather_code;
        const waveHeight = marineData?.current?.wave_height;

        let condition = "Clear";
        if (weatherCode !== undefined) {
          if (weatherCode === 0) condition = "Clear";
          else if (weatherCode <= 3) condition = "Partly cloudy";
          else if (weatherCode <= 49) condition = "Foggy";
          else if (weatherCode <= 69) condition = "Rainy";
          else if (weatherCode <= 79) condition = "Snowy";
          else if (weatherCode >= 95) condition = "Stormy";
          else condition = "Cloudy";
        }

        const summaryData = {
          temperature: temp ? Math.round(temp) : null,
          condition,
          windSpeed: windSpeed ? Math.round(windSpeed) : null,
          waveHeight: waveHeight ? parseFloat(waveHeight.toFixed(1)) : null,
        };

        setWeatherSummary(summaryData);
      }
    } catch (error) {
      console.error("Error fetching weather summary:", error);
      setWeatherSummary("Weather unavailable");
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchFishingTips();
    fetchWeatherSummary();
  }, [location]);

  // Calculate and set the maximum card height
  useEffect(() => {
    if (tips.length > 0) {
      // Reset refs array to match tips length
      tipContentRefs.current = Array(tips.length).fill(null);

      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        // Only calculate on mobile devices (or when simulating mobile in dev tools)
        if (window.innerWidth <= 768) {
          let maxHeight = 0;

          // Find the maximum height among all tip content elements
          tipContentRefs.current.forEach((ref) => {
            if (ref) {
              const height = ref.scrollHeight;
              maxHeight = Math.max(maxHeight, height);
            }
          });

          // Add some padding to the max height
          if (maxHeight > 0) {
            setMaxCardHeight(maxHeight + 16); // 16px extra for padding
          }
        } else {
          // Reset max height on larger screens
          setMaxCardHeight(null);
        }
      }, 100);
    }

    // Add resize listener to recalculate on window resize
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // Recalculate on resize for mobile
        let maxHeight = 0;
        tipContentRefs.current.forEach((ref) => {
          if (ref) {
            const height = ref.scrollHeight;
            maxHeight = Math.max(maxHeight, height);
          }
        });
        if (maxHeight > 0) {
          setMaxCardHeight(maxHeight + 16);
        }
      } else {
        // Reset max height on larger screens
        setMaxCardHeight(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tips]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Auto-advance carousel every 8 seconds
  useEffect(() => {
    if (!api || tips.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [api, tips.length]);

  if (loading) {
    return (
      <Card className="p-6 border border-border bg-background shadow-sm">
        <div className="flex items-center justify-center py-8">
          <LoadingDots />
          <p className="text-sm text-muted-foreground ml-2">
            Generating fishing tips...
          </p>
        </div>
      </Card>
    );
  }

  if (error || tips.length === 0) {
    return (
      <Card className="p-6 border border-border bg-background shadow-sm">
        <div className="flex items-center justify-center py-4">
          <Fish className="h-5 w-5 text-destructive mr-2" />
          <p className="text-sm text-destructive">
            {error || "Unable to load fishing tips"}
          </p>
        </div>
      </Card>
    );
  }

  // Get current date formatted
  const getCurrentDate = () => {
    const now = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];

    // Add ordinal suffix
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${dayName} ${day}${getOrdinalSuffix(day)} ${month}`;
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-3xl font-bold">Today</h2>
        </div>
        <p className="text-sm text-muted-foreground pt-2">{getCurrentDate()}</p>
        {/* Weather summary - only visible on mobile */}
        <div className="lg:hidden mt-2">
          {loadingWeather ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded-full animate-pulse"></div>
              <p className="text-xs text-muted-foreground">
                Loading weather...
              </p>
            </div>
          ) : weatherSummary && typeof weatherSummary === "object" ? (
            <div className="flex items-center gap-3 py-2 px-1 gap-x-[16px]">
              {/* Weather icon based on condition */}
              <div className="flex items-center gap-x-[4px]">
                {weatherSummary.condition === "Clear" && (
                  <Sun className="w-8 h-8 text-yellow-500" />
                )}
                {weatherSummary.condition === "Partly cloudy" && (
                  <Cloud className="w-8 h-8 text-blue-400" />
                )}
                {weatherSummary.condition === "Rainy" && (
                  <CloudRain className="w-8 h-8 text-blue-500" />
                )}
                {weatherSummary.condition === "Snowy" && (
                  <CloudSnow className="w-8 h-8 text-blue-300" />
                )}
                {!["Clear", "Partly cloudy", "Rainy", "Snowy"].includes(
                  weatherSummary.condition,
                ) && <Cloud className="w-8 h-8 text-blue-400" />}
                <span className="text-foreground text-2xl font-normal">
                  {weatherSummary.temperature !== null
                    ? `${weatherSummary.temperature}°`
                    : "--°"}
                </span>
              </div>
              {/* Temperature */}

              {/* Wind with arrow icon */}
              <div className="flex items-center gap-1 ml-0">
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
                  className="text-blue-500 rotate-45 text-[20px]"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
                <span className="text-foreground text-2xl">
                  {weatherSummary.windSpeed !== null
                    ? `${weatherSummary.windSpeed} km/h`
                    : "--"}
                </span>
              </div>
              {/* Wave height with wave icon */}
              {weatherSummary.waveHeight !== null && (
                <div className="flex items-center gap-1 ml-0">
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
                    className="text-purple-500"
                  >
                    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                  </svg>
                  <span className="text-foreground text-2xl">
                    {weatherSummary.waveHeight}m
                  </span>
                </div>
              )}
            </div>
          ) : weatherSummary === "Weather unavailable" ? (
            <p className="text-xs text-muted-foreground italic">
              Weather unavailable
            </p>
          ) : null}
        </div>
      </div>
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
          containScroll: "trimSnaps",
        }}
      >
        <CarouselContent>
          {tips.map((tip, index) => (
            <CarouselItem key={index}>
              <Card className="overflow-hidden border border-border bg-background shadow-sm rounded-xl">
                <CardContent className="p-4 pb-4 flex flex-col h-full">
                  <p
                    ref={(el) => (tipContentRefs.current[index] = el)}
                    className="text-2xl text-black leading-relaxed mb-4 flex-grow"
                    style={
                      maxCardHeight
                        ? { minHeight: `${maxCardHeight}px` }
                        : undefined
                    }
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywords(tip.content),
                    }}
                  ></p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      {tip.category}
                    </span>
                    <img
                      src="https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com/brand-assets/Logo-tips.svg"
                      alt="Lishka Tips"
                      className="h-5"
                    />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* Dots indicator */}
      {tips.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === current - 1 ? "bg-foreground" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FishingTipsCarousel;
