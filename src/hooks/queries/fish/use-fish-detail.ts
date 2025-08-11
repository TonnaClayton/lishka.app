import { useQuery } from "@tanstack/react-query";
import { generateTextWithAI } from "@/lib/ai";
import {
    getFishImageUrl as getFishImageUrlFromService,
    getPlaceholderFishImage,
} from "@/lib/fish-image-service";
import { config } from "@/lib/config";
import { log } from "@/lib/logging";

// Types for fish details
export interface FishingGear {
    rods?: string;
    reels?: string;
    line?: string;
    leader?: string;
    bait?: string[];
    lures?: string[];
    depth?: string;
    jigType?: string;
    jigWeight?: string;
    jigColor?: string;
    rodType?: string;
    reelType?: string;
    hookSize?: string;
    rigType?: string;
    weight?: string;
    lureType?: string;
    lureSize?: string;
    lureColor?: string;
    trollingSpeed?: string;
    [key: string]: any;
}

export interface FishingMethod {
    title?: string;
    method?: string;
    description?: string;
    gear?: FishingGear;
    proTip?: string;
    [key: string]: any;
}

export interface FishingRegulations {
    sizeLimit: {
        value: string;
        source: string;
        confidence: string;
    };
    bagLimit: {
        value: string;
        source: string;
        confidence: string;
    };
    seasonDates: {
        value: string;
        source: string;
        confidence: string;
    };
    licenseRequired: {
        value: string;
        source: string;
        confidence: string;
    };
    additionalRules: Array<{
        rule: string;
        source: string;
        confidence: string;
    }>;
    penalties: {
        value: string;
        source: string;
        confidence: string;
    };
    lastUpdated: string;
    validationFlags?: {
        suspiciousSourcesDetected: boolean;
        genericSourcesReplaced: boolean;
        confidenceDowngraded: boolean;
    };
    lastValidated?: string;
}

export interface FishingSeasons {
    inSeason: string[];
    traditionalSeason: string[];
    conservationConcerns: string;
    regulations: string;
    notInSeason: string[];
    reasoning: string;
}

export interface FishDetails {
    name: string;
    scientificName: string;
    description: string;
    image?: string;
    fishingMethods?: FishingMethod[];
    fishingSeasons?: FishingSeasons;
    fishingRegulations?: FishingRegulations;
    allRoundGear?: FishingGear;
    localNames?: string[];
    currentSeasonStatus?: string;
    officialSeasonDates?: string;
    fishingLocation?: string;
    isToxic?: boolean;
    dangerType?: string;
}

// Main fetch function for fish details
const fetchFishDetails = async (
    fishName: string,
    location: string,
    initialData?: any,
): Promise<FishDetails> => {
    const apiKey = config.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key is missing");

    const userLocation = location || "Unknown Location";

    // Get initial data from navigation state or create default
    const fishNameFormatted = fishName.replace(/-/g, " ");
    const fishData = initialData || {
        name: fishNameFormatted,
        scientificName: "Unknown",
        image: getPlaceholderFishImage(),
    };

    // For API calls, we'll use both common and scientific names for better accuracy
    const fishIdentifier =
        fishData.scientificName && fishData.scientificName !== "Unknown"
            ? `${fishData.name} (${fishData.scientificName})`
            : fishData.name;

    // First API call for general fishing information
    const { text } = await generateTextWithAI({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content:
                    `You are a professional fishing guide with deep knowledge of fish species, seasonal patterns, and fishing methods. Provide accurate, verifiable information only.`,
            },
            {
                role: "user",
                content:
                    `Provide detailed fishing information for ${fishIdentifier} in ${userLocation}. Return only valid JSON with fishing methods, seasons, and gear recommendations.`,
            },
        ],
        temperature: 0.0,
    });

    let result: any;
    try {
        const cleanContent = text.replace(/```json\n?|```\n?/g, "").trim();
        result = JSON.parse(cleanContent);
    } catch (parseError) {
        console.error("JSON parse error:", parseError);
        result = {
            name: fishData.name,
            scientificName: fishData.scientificName,
            description: "No description available.",
            fishingMethods: [],
            fishingSeasons: {
                inSeason: [],
                traditionalSeason: [],
                conservationConcerns: "",
                regulations: "",
                notInSeason: [],
                reasoning: "",
            },
            allRoundGear: null,
            localNames: [],
            currentSeasonStatus: "Status unknown",
            officialSeasonDates: "Dates not available",
            fishingLocation: userLocation,
        };
    }

    // Second API call for regulations
    let regulationsResult: any;
    try {
        const { text: regulationsText } = await generateTextWithAI({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content:
                        `You are a fishing regulations expert. Provide ONLY verifiable regulatory information. When uncertain, default to "Check with local authorities".`,
                },
                {
                    role: "user",
                    content:
                        `Provide fishing regulations for ${fishIdentifier} in ${userLocation}. Return only valid JSON with size limits, bag limits, and penalties.`,
                },
            ],
            temperature: 0.0,
        });

        const cleanRegulationsContent = regulationsText
            .replace(/```json\n?|```\n?/g, "")
            .trim();
        regulationsResult = JSON.parse(cleanRegulationsContent);
    } catch (error) {
        console.error("Regulations API error:", error);
        regulationsResult = {
            sizeLimit: {
                value: "Check with local authorities",
                source: "Contact local authority",
                confidence: "Low",
            },
            bagLimit: {
                value: "Check with local authorities",
                source: "Contact local authority",
                confidence: "Low",
            },
            seasonDates: {
                value: "Check local regulations",
                source: "Contact local authority",
                confidence: "Low",
            },
            licenseRequired: {
                value: "Check local requirements",
                source: "Contact local authority",
                confidence: "Low",
            },
            additionalRules: [],
            penalties: {
                value: "Contact local authorities",
                source: "Contact local authority",
                confidence: "Low",
            },
            lastUpdated: "Unknown",
        };
    }

    const fishDetailsData: FishDetails = {
        ...fishData,
        description: result.description || "No description available.",
        fishingMethods: result.fishingMethods || [],
        allRoundGear: result.allRoundGear,
        fishingSeasons: result.fishingSeasons,
        fishingRegulations: regulationsResult,
        localNames: result.localNames || [],
        currentSeasonStatus: result.currentSeasonStatus || "Status unknown",
        officialSeasonDates: result.officialSeasonDates ||
            "Dates not available",
        fishingLocation: result.fishingLocation || userLocation,
    };

    return fishDetailsData;
};

// React Query hook for fish details
export const useFishDetails = (
    fishName: string,
    location: string,
    initialData?: any,
    enabled: boolean = true,
) => {
    return useQuery({
        queryKey: ["fishDetails", fishName, location],
        queryFn: () => fetchFishDetails(fishName, location, initialData),
        enabled: enabled && !!fishName && !!location,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

// React Query hook for fish image
export const useFishImage = (
    fishName: string,
    scientificName: string,
    enabled: boolean = true,
) => {
    return useQuery({
        queryKey: ["fishImage", fishName, scientificName],
        queryFn: async () => {
            try {
                const imageUrl = await getFishImageUrlFromService(
                    fishName,
                    scientificName,
                );
                return imageUrl;
            } catch (error) {
                console.error(`Error loading fish image:`, error);
                return getPlaceholderFishImage();
            }
        },
        enabled: enabled && !!fishName,
        staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
        retry: 1,
    });
};
