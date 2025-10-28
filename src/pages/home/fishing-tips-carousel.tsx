import React, { useState, useEffect, useMemo } from "react";
import { Fish, Cloud, Sun, CloudRain, CloudSnow } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  useFishingTips,
  useGetWeatherSummary,
  useUserLocation,
} from "@/hooks/queries";
import FishingTipsSkeleton from "./fishing-tips-skeleton";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

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

// Keywords to highlight - moved outside component for better performance
const HIGHLIGHT_PATTERNS = [
  // Measurements with units
  /(\d+(?:-\d+)?(?:\.\d+)?\s*(?:ft|feet|m|cm|inch|inches|°F|°C|mph|km\/h|knots))/g,
  // Depths and ranges
  /(\d+(?:-\d+)?\s*(?:ft|feet|m|meters)\s*(?:depth|deep))/gi,
  // Times of day
  /\b(dawn|dusk|sunrise|sunset|morning|afternoon|evening|night|early|late)\b/gi,
  // Fishing techniques
  /\b(trolling|casting|jigging|spinning|bottom fishing|fly fishing|bait fishing|lure fishing)\b/gi,
  // Bait types
  /\b(live bait|cut bait|artificial bait|dead bait|chum|worms|minnows|shrimp|squid|crab|clams|nightcrawlers|leeches|crickets|grasshoppers)\b/gi,
  // Lure types
  /\b(spoons|spinners|crankbaits|jerkbaits|topwater|soft plastics|jigs|swimbaits|plugs|poppers|spinnerbaits|buzzbaits|flies|streamers|nymphs|dry flies|wet flies)\b/gi,
  // Locations
  /\b(shallow|deep|offshore|inshore|nearshore|reef|structure|weed beds|drop-offs|flats)\b/gi,
  // Weather conditions
  /\b(cloudy|sunny|windy|calm|overcast|rainy|stormy|clear)\b/gi,
  // Water conditions
  /\b(murky|clear|warm|cold|hot|cool|choppy|flat|rough)\b/gi,
  // Seasons
  /\b(spring|summer|fall|autumn|winter)\b/gi,
  // Temperature ranges
  /(\d+(?:-\d+)?\s*degrees)/gi,
  // Fish species
  /\b(bass|trout|salmon|tuna|marlin|snapper|grouper|wahoo|mahi|dorado|tarpon|bonefish|redfish)\b/gi,
];

// Safe highlighting function that returns React nodes
const HighlightedText = ({ text }: { text: string }) => {
  if (!text) return null;

  // Create a combined regex from all patterns
  const combinedPattern = new RegExp(
    HIGHLIGHT_PATTERNS.map((p) => p.source).join("|"),
    "gi",
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  const regex = new RegExp(combinedPattern.source, combinedPattern.flags);

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add highlighted match
    parts.push(
      <span key={match.index} className="font-semibold">
        {match[0]}
      </span>,
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

const FishingTipsCarousel: React.FC<FishingTipsCarouselProps> = () => {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);
  const [current, setCurrent] = useState(0);
  const { profile } = useAuth();
  const { location: userLocation } = useUserLocation();

  const {
    data: weatherSummary,
    isLoading: loadingWeather,
    isError: errorWeather,
  } = useGetWeatherSummary({
    latitude: userLocation?.latitude,
    longitude: userLocation?.longitude,
    name: userLocation?.name,
  });

  const {
    data: fishingTips,
    isLoading: loadingFishingTips,
    isError: errorFishingTips,
    error: errorFishingTipsError,
  } = useFishingTips({
    temperature: weatherSummary?.temperature,
    windSpeed: weatherSummary?.wind_speed,
    waveHeight: weatherSummary?.wave_height,
    weatherCondition: weatherSummary?.condition,
  });

  const tips = useMemo(() => {
    if (!fishingTips) {
      return [];
    }

    return fishingTips;
  }, [fishingTips]);

  useEffect(() => {
    if (!api) {
      return;
    }

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
      <div className="mb-2 flex flex-col gap-y-3">
        <div className="flex gap-2 flex-col items-start justify-start gap-y-2">
          <h2 className="text-foreground font-bold text-2xl">
            {profile?.full_name
              ? `Welcome back, ${profile.full_name}`
              : "Today"}
          </h2>
          <p className="text-sm text-muted-foreground">{getCurrentDate()}</p>
        </div>
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
            <div className="flex items-center gap-3 px-1 gap-x-[16px]">
              {/* Weather icon based on condition */}
              <div className="flex items-center gap-x-[4px]">
                {weatherSummary.condition === "Clear" && (
                  <Sun className="w-8 h-8 text-[#FFBF00]" />
                )}
                {weatherSummary.condition === "Partly cloudy" && (
                  <Cloud className="w-8 h-8 text-lishka-blue" />
                )}
                {weatherSummary.condition === "Rainy" && (
                  <CloudRain className="w-8 h-8 text-lishka-blue" />
                )}
                {weatherSummary.condition === "Snowy" && (
                  <CloudSnow className="w-8 h-8 text-lishka-blue" />
                )}
                {!["Clear", "Partly cloudy", "Rainy", "Snowy"].includes(
                  weatherSummary.condition,
                ) && <Cloud className="w-8 h-8 text-lishka-blue" />}
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
                  className="text-[#A855F7] rotate-45 text-[20px]"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
                <span className="text-foreground text-2xl">
                  {weatherSummary.wind_speed !== null
                    ? `${weatherSummary.wind_speed} km/h`
                    : "--"}
                </span>
              </div>
              {/* Wave height with wave icon */}
              {weatherSummary.wave_height !== null && (
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
                    className="text-lishka-blue"
                  >
                    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                  </svg>
                  <span className="text-foreground text-2xl">
                    {weatherSummary.wave_height}m
                  </span>
                </div>
              )}
            </div>
          ) : errorWeather === true ? (
            <p className="text-xs text-muted-foreground italic">
              Weather unavailable
            </p>
          ) : null}
        </div>
      </div>
      {loadingFishingTips ? (
        <FishingTipsSkeleton />
      ) : (
        <>
          {errorFishingTips || tips.length === 0 ? (
            <Card className="p-6 border border-border bg-background shadow-sm">
              <div className="flex items-center justify-center py-4">
                <Fish className="h-5 w-5 text-destructive mr-2" />
                <p className="text-sm text-destructive">
                  {errorFishingTipsError instanceof Error
                    ? errorFishingTipsError.message
                    : "Unable to load fishing tips"}
                </p>
              </div>
            </Card>
          ) : (
            <>
              {" "}
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
                      <Card
                        className="overflow-hidden border bg-background rounded-[12px] border-[#191B1F1A] h-full shadow-[0_1px_2px_#0000000D]"
                        style={{
                          backgroundImage: `url(/images/fish-tips-bg.png)`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <CardContent className="p-4 pb-4 flex flex-col h-full">
                          <p className="text-2xl text-white leading-relaxed mb-4 flex-grow">
                            <HighlightedText text={tip.content} />
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                            <span className="text-sm font-medium text-white">
                              {tip.category}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="76"
                              height="20"
                              viewBox="0 0 76 20"
                              fill="none"
                            >
                              <g clipPath="url(#clip0_3763_6257)">
                                <path
                                  d="M1.74316 13.8094V6.883H3.20758V12.602H6.17701V13.8094H1.74316ZM7.11975 13.8094V8.6146H8.5605V13.8094H7.11975ZM7.84351 7.94496C7.62931 7.94496 7.44555 7.87394 7.29223 7.7319C7.14117 7.58759 7.06564 7.4151 7.06564 7.21444C7.06564 7.01603 7.14117 6.8458 7.29223 6.70375C7.44555 6.55946 7.62931 6.4873 7.84351 6.4873C8.0577 6.4873 8.24034 6.55946 8.39139 6.70375C8.54472 6.8458 8.62137 7.01603 8.62137 7.21444C8.62137 7.4151 8.54472 7.58759 8.39139 7.7319C8.24034 7.87394 8.0577 7.94496 7.84351 7.94496ZM14.0368 10.096L12.7179 10.1771C12.6953 10.0644 12.6468 9.96293 12.5724 9.87274C12.4981 9.78027 12.4 9.70703 12.2782 9.65293C12.1587 9.59655 12.0155 9.56836 11.8487 9.56836C11.6255 9.56836 11.4372 9.6157 11.2839 9.71036C11.1305 9.80284 11.0539 9.92684 11.0539 10.0824C11.0539 10.2065 11.1035 10.3112 11.2027 10.3969C11.302 10.4826 11.4722 10.5514 11.7134 10.6032L12.6536 10.7926C13.1586 10.8964 13.5352 11.0632 13.7832 11.2932C14.0312 11.5231 14.1552 11.8253 14.1552 12.1996C14.1552 12.54 14.0549 12.8387 13.8542 13.0958C13.6558 13.3528 13.383 13.5535 13.0358 13.6978C12.6908 13.8399 12.2928 13.9108 11.842 13.9108C11.1543 13.9108 10.6063 13.7677 10.1982 13.4813C9.7924 13.1927 9.55453 12.8005 9.48464 12.3044L10.9017 12.23C10.9445 12.4397 11.0483 12.5998 11.2128 12.7103C11.3775 12.8185 11.5883 12.8726 11.8453 12.8726C12.0979 12.8726 12.3007 12.8241 12.4541 12.7271C12.6097 12.628 12.6885 12.5006 12.6908 12.345C12.6885 12.2142 12.6333 12.1071 12.5251 12.0237C12.4168 11.938 12.2501 11.8726 12.0245 11.8275L11.1249 11.6483C10.6176 11.5468 10.24 11.3709 9.99195 11.1206C9.74618 10.8705 9.6233 10.5514 9.6233 10.1636C9.6233 9.82989 9.71349 9.54236 9.89387 9.30116C10.0765 9.05991 10.3324 8.8739 10.6616 8.74312C10.993 8.61235 11.3808 8.54696 11.825 8.54696C12.4811 8.54696 12.9975 8.68563 13.374 8.96295C13.7527 9.24028 13.9737 9.61798 14.0368 10.096ZM16.5032 10.8062V13.8094H15.0624V6.883H16.4626V9.53112H16.5235C16.6407 9.2245 16.8302 8.98437 17.0917 8.81076C17.3532 8.6349 17.6813 8.54696 18.0759 8.54696C18.4366 8.54696 18.7511 8.62588 19.0194 8.7837C19.29 8.93928 19.4997 9.16362 19.6485 9.45673C19.7996 9.7476 19.874 10.096 19.8717 10.5018V13.8094H18.431V10.7588C18.4332 10.4386 18.3521 10.1895 18.1875 10.0114C18.0251 9.83322 17.7974 9.74417 17.5043 9.74417C17.3082 9.74417 17.1345 9.78589 16.9835 9.86931C16.8346 9.95274 16.7174 10.0746 16.6317 10.2346C16.5483 10.3925 16.5055 10.5829 16.5032 10.8062ZM22.311 12.3146L22.3143 10.5864H22.5241L24.1881 8.6146H25.8419L23.6063 11.2255H23.2647L22.311 12.3146ZM21.0056 13.8094V6.883H22.4463V13.8094H21.0056ZM24.2523 13.8094L22.7236 11.5468L23.6842 10.5288L25.94 13.8094H24.2523ZM28.0301 13.9075C27.6986 13.9075 27.4032 13.85 27.144 13.735C26.8846 13.6178 26.6795 13.4453 26.5284 13.2176C26.3796 12.9876 26.3052 12.7012 26.3052 12.3586C26.3052 12.0699 26.3582 11.8275 26.4642 11.6314C26.5702 11.4352 26.7144 11.2774 26.897 11.1579C27.0797 11.0384 27.2871 10.9482 27.5193 10.8873C27.7539 10.8265 27.9996 10.7836 28.2566 10.7588C28.5587 10.7272 28.8022 10.698 28.9871 10.6708C29.1721 10.6416 29.3062 10.5987 29.3896 10.5424C29.473 10.486 29.5147 10.4026 29.5147 10.2921V10.2718C29.5147 10.0576 29.4471 9.89189 29.3118 9.77465C29.1788 9.65741 28.9894 9.59874 28.7437 9.59874C28.4843 9.59874 28.2781 9.65627 28.1247 9.77122C27.9714 9.88398 27.87 10.0261 27.8203 10.1974L26.4878 10.0892C26.5555 9.7735 26.6884 9.5007 26.8869 9.27072C27.0853 9.03849 27.3412 8.86036 27.6546 8.73636C27.9703 8.6101 28.3356 8.54696 28.7504 8.54696C29.039 8.54696 29.3152 8.58078 29.579 8.64843C29.845 8.71607 30.0806 8.8209 30.2859 8.96295C30.4933 9.105 30.6567 9.28763 30.7763 9.51085C30.8958 9.73179 30.9555 9.99674 30.9555 10.3056V13.8094H29.5891V13.089H29.5485C29.4651 13.2514 29.3535 13.3946 29.2138 13.5186C29.074 13.6403 28.906 13.7362 28.7098 13.806C28.5137 13.8737 28.2871 13.9075 28.0301 13.9075ZM28.4426 12.9131C28.6545 12.9131 28.8417 12.8715 29.0041 12.7881C29.1663 12.7024 29.2938 12.5874 29.3862 12.443C29.4786 12.2987 29.5249 12.1353 29.5249 11.9526V11.4014C29.4798 11.4307 29.4178 11.4578 29.3389 11.4826C29.2623 11.5051 29.1754 11.5266 29.0784 11.5468C28.9815 11.5648 28.8845 11.5818 28.7876 11.5976C28.6906 11.6111 28.6027 11.6235 28.5238 11.6347C28.3547 11.6596 28.207 11.699 28.0807 11.7531C27.9545 11.8072 27.8564 11.8806 27.7865 11.9729C27.7166 12.0631 27.6817 12.1759 27.6817 12.3111C27.6817 12.5073 27.7527 12.6572 27.8947 12.7609C28.039 12.8625 28.2217 12.9131 28.4426 12.9131ZM37.0406 8.6146V9.69684H33.9122V8.6146H37.0406ZM34.6224 7.37002H36.0632V12.2131C36.0632 12.3461 36.0835 12.4498 36.1241 12.5243C36.1646 12.5964 36.221 12.6471 36.2932 12.6765C36.3676 12.7057 36.4533 12.7204 36.5503 12.7204C36.6179 12.7204 36.6855 12.7147 36.7531 12.7035C36.8208 12.69 36.8726 12.6798 36.9087 12.673L37.1353 13.7451C37.0632 13.7677 36.9617 13.7936 36.8309 13.8229C36.7002 13.8545 36.5412 13.8737 36.3541 13.8805C36.0068 13.894 35.7024 13.8477 35.4409 13.7418C35.1816 13.6358 34.9799 13.4712 34.8355 13.248C34.6912 13.0247 34.6202 12.7429 34.6224 12.4025V7.37002ZM37.9791 13.8094V8.6146H39.4199V13.8094H37.9791ZM38.7029 7.94496C38.4887 7.94496 38.3049 7.87394 38.1516 7.7319C38.0005 7.58759 37.925 7.4151 37.925 7.21444C37.925 7.01603 38.0005 6.8458 38.1516 6.70375C38.3049 6.55946 38.4887 6.4873 38.7029 6.4873C38.9171 6.4873 39.0997 6.55946 39.2507 6.70375C39.4041 6.8458 39.4807 7.01603 39.4807 7.21444C39.4807 7.4151 39.4041 7.58759 39.2507 7.7319C39.0997 7.87394 38.9171 7.94496 38.7029 7.94496ZM40.574 15.7575V8.6146H41.9944V9.48717H42.0587C42.1219 9.34738 42.2131 9.20533 42.3326 9.06103C42.4544 8.91448 42.6122 8.79272 42.8062 8.69577C43.0022 8.59657 43.2458 8.54696 43.5366 8.54696C43.9155 8.54696 44.2649 8.64617 44.5851 8.84458C44.9053 9.04074 45.1612 9.33723 45.3528 9.73408C45.5444 10.1286 45.6402 10.6235 45.6402 11.2187C45.6402 11.7983 45.5467 12.2875 45.3596 12.6866C45.1747 13.0834 44.9222 13.3844 44.602 13.5896C44.2841 13.7925 43.9279 13.894 43.5333 13.894C43.2537 13.894 43.0158 13.8477 42.8197 13.7553C42.6258 13.6628 42.4668 13.5467 42.3428 13.4069C42.2188 13.2649 42.1241 13.1217 42.0587 12.9774H42.0147V15.7575H40.574ZM41.9843 11.212C41.9843 11.5209 42.0271 11.7904 42.1128 12.0203C42.1985 12.2503 42.3225 12.4295 42.4848 12.5581C42.6472 12.6844 42.8444 12.7474 43.0767 12.7474C43.3112 12.7474 43.5096 12.6832 43.672 12.5546C43.8342 12.4239 43.9571 12.2435 44.0405 12.0135C44.1262 11.7813 44.1691 11.5142 44.1691 11.212C44.1691 10.9122 44.1274 10.6484 44.044 10.4206C43.9605 10.1929 43.8377 10.0147 43.6753 9.88627C43.513 9.7577 43.3134 9.6935 43.0767 9.6935C42.8422 9.6935 42.6438 9.7555 42.4815 9.8795C42.3214 10.0035 42.1985 10.1793 42.1128 10.4071C42.0271 10.6348 41.9843 10.9031 41.9843 11.212ZM50.923 10.096L49.6041 10.1771C49.5815 10.0644 49.533 9.96293 49.4586 9.87274C49.3842 9.78027 49.2862 9.70703 49.1643 9.65293C49.0448 9.59655 48.9017 9.56836 48.7348 9.56836C48.5116 9.56836 48.3234 9.6157 48.1701 9.71036C48.0167 9.80284 47.9401 9.92684 47.9401 10.0824C47.9401 10.2065 47.9897 10.3112 48.0889 10.3969C48.1881 10.4826 48.3583 10.5514 48.5996 10.6032L49.5398 10.7926C50.0448 10.8964 50.4214 11.0632 50.6694 11.2932C50.9174 11.5231 51.0414 11.8253 51.0414 12.1996C51.0414 12.54 50.941 12.8387 50.7403 13.0958C50.542 13.3528 50.2692 13.5535 49.922 13.6978C49.577 13.8399 49.179 13.9108 48.7281 13.9108C48.0404 13.9108 47.4925 13.7677 47.0844 13.4813C46.6785 13.1927 46.4407 12.8005 46.3708 12.3044L47.7879 12.23C47.8307 12.4397 47.9344 12.5998 48.099 12.7103C48.2636 12.8185 48.4744 12.8726 48.7315 12.8726C48.984 12.8726 49.1869 12.8241 49.3403 12.7271C49.4958 12.628 49.5747 12.5006 49.577 12.345C49.5747 12.2142 49.5195 12.1071 49.4112 12.0237C49.303 11.938 49.1362 11.8726 48.9107 11.8275L48.0111 11.6483C47.5038 11.5468 47.1262 11.3709 46.8781 11.1206C46.6323 10.8705 46.5095 10.5514 46.5095 10.1636C46.5095 9.82989 46.5997 9.54236 46.7801 9.30116C46.9626 9.05991 47.2185 8.8739 47.5478 8.74312C47.8792 8.61235 48.267 8.54696 48.7112 8.54696C49.3673 8.54696 49.8836 8.68563 50.2602 8.96295C50.6389 9.24028 50.8599 9.61798 50.923 10.096Z"
                                  fill="white"
                                />
                                <path
                                  d="M67.7538 0.476074C71.6431 0.476074 73.5879 0.476081 74.7961 1.68422C76.0045 2.8925 76.0043 4.83735 76.0043 8.72664V10.5245C76.0043 12.8203 76.0051 13.9685 75.4639 14.9181C74.9228 15.8677 73.9349 16.4533 71.9595 17.6236L71.8256 17.7017C69.7757 18.9161 68.7509 19.5236 67.6208 19.5237C66.4905 19.5237 65.4651 18.9162 63.4151 17.7017L63.282 17.6236C61.3065 16.4533 60.3188 15.8677 59.7776 14.9181C59.2364 13.9685 59.2363 12.8204 59.2363 10.5245V8.72664C59.2363 4.83741 59.2362 2.89251 60.4444 1.68422C61.6528 0.475888 63.5982 0.476074 67.4878 0.476074H67.7538ZM66.2908 11.8703C64.2113 11.9779 63.5341 12.085 62.4459 12.3362C61.3579 12.5873 60.5842 13.341 60.4872 13.4848C60.4099 13.5997 60.3782 13.7047 60.4389 13.7722C60.6648 14.0234 61.3471 14.411 61.8693 14.5832C62.5223 14.7986 64.042 15.064 65.2752 15.0641C66.5085 15.0641 70.209 14.274 71.2247 14.0586C72.0372 13.8865 72.8045 13.9869 73.0867 14.0586L74.0949 14.2846C74.4217 14.3577 74.5851 14.3942 74.6437 14.294C74.702 14.1935 74.5951 14.0752 74.3804 13.8392C74.3388 13.7934 74.2979 13.7497 74.2577 13.7089C74.0139 13.462 73.8916 13.3388 73.8903 13.2756C73.8891 13.2123 74.0175 13.0714 74.2744 12.7901C74.3082 12.7531 74.3412 12.7148 74.373 12.6766C74.5588 12.4532 74.652 12.3416 74.5943 12.245C74.5362 12.1485 74.3833 12.1801 74.0781 12.2441C72.5213 12.5706 71.8685 12.5119 71.1039 12.4804C70.2333 12.4445 68.3706 11.7626 66.2908 11.8703ZM66.2908 7.38177C64.2113 7.48943 63.5341 7.59744 62.4459 7.84866C61.3577 8.09989 60.5839 8.85372 60.4872 8.99728C60.4099 9.11202 60.3783 9.21633 60.4389 9.28374C60.6645 9.53493 61.3469 9.92245 61.8693 10.0947C62.5222 10.3101 64.0419 10.5756 65.2752 10.5756C66.5085 10.5756 70.209 9.78646 71.2247 9.57112C72.0373 9.39891 72.8046 9.49935 73.0867 9.57112L74.0949 9.79617C74.4219 9.86931 74.5853 9.90598 74.6437 9.8055C74.7018 9.70503 74.5951 9.58674 74.3804 9.3507C74.3389 9.30503 74.2978 9.26204 74.2577 9.22143C74.0143 8.97499 73.892 8.85147 73.8903 8.78802C73.8891 8.72468 74.0173 8.58312 74.2744 8.3016C74.3081 8.2647 74.3413 8.22723 74.373 8.18905C74.5591 7.96539 74.6525 7.85319 74.5943 7.75658C74.5362 7.65998 74.3833 7.69165 74.0781 7.75565C72.5212 8.08225 71.8685 8.02342 71.1039 7.99188C70.2333 7.956 68.3706 7.27409 66.2908 7.38177ZM66.2908 2.89423C64.2113 3.00189 63.534 3.10899 62.4459 3.36019C61.358 3.61133 60.5843 4.36489 60.4872 4.50882C60.4099 4.62365 60.3782 4.72876 60.4389 4.7962C60.6647 5.04744 61.3471 5.43499 61.8693 5.60722C62.5223 5.82252 64.042 6.08802 65.2752 6.08806C66.5085 6.08806 70.209 5.29893 71.2247 5.08359C72.0373 4.91135 72.8046 5.01182 73.0867 5.08359L74.0949 5.30866C74.4217 5.38173 74.5852 5.41819 74.6437 5.31796C74.702 5.2175 74.5951 5.09924 74.3804 4.86317C74.3388 4.8174 74.2979 4.77365 74.2577 4.73296C74.0139 4.48604 73.8916 4.36287 73.8903 4.29955C73.8892 4.2362 74.0175 4.09536 74.2744 3.81406C74.3082 3.77706 74.3412 3.73887 74.373 3.70059C74.5588 3.47717 74.6521 3.36558 74.5943 3.26905C74.5362 3.17244 74.3833 3.2041 74.0781 3.26811C72.5213 3.59468 71.8685 3.53587 71.1039 3.50435C70.2333 3.46846 68.3706 2.78656 66.2908 2.89423Z"
                                  fill="white"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_3763_6257">
                                  <rect
                                    width="75.2381"
                                    height="20"
                                    fill="white"
                                    transform="translate(0.766113)"
                                  />
                                </clipPath>
                              </defs>
                            </svg>
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
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === current - 1
                          ? "bg-[#191B1F]"
                          : "bg-[#191B1F0D]",
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FishingTipsCarousel;
