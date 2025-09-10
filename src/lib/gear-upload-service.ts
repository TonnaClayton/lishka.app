import { getBlobStorageStatus, uploadImage } from "./blob-storage";
import {
  getSupabaseStorageStatus,
  uploadImageToSupabase,
} from "./supabase-storage";
import { OPENAI_ENABLED, validateOpenAIConfig } from "./openai-toggle";
import { error as logError, log, warn as warnLog } from "./logging";
import { config } from "@/lib/config";

export interface GearInfo {
  name: string;
  type: string; // rod, reel, lure, bait, etc.
  brand?: string;
  model?: string;
  confidence: number;
  // Enhanced fields for detailed gear information
  size?: string;
  weight?: string;
  targetFish?: string;
  fishingTechnique?: string;
  weatherConditions?: string;
  waterConditions?: string;
  seasonalUsage?: string;
  colorPattern?: string;
  actionType?: string;
  depthRange?: string;
  // Additional comprehensive fields
  material?: string;
  durability?: string;
  priceRange?: string;
  skillLevel?: string;
  waterType?: string; // freshwater, saltwater, both
  hookSize?: string;
  lineWeight?: string;
  retrieveSpeed?: string;
  vibration?: string;
  buoyancy?: string; // floating, sinking, suspending
  visibility?: string; // high, medium, low visibility conditions
  noiseLevel?: string; // silent, moderate, loud
  versatility?: string;
  maintenanceLevel?: string;
  storageRequirements?: string;
  compatibleGear?: string;
  fishingLocation?: string; // shore, boat, pier, etc.
  timeOfDay?: string; // dawn, day, dusk, night
  currentConditions?: string; // still, slow, fast current
  structureType?: string; // open water, weeds, rocks, etc.
  // Debug information
  rawJsonResponse?: string;
  openaiPrompt?: string;
}

export interface GearMetadata {
  url: string;
  gearInfo?: GearInfo;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  originalFileName?: string;
  userConfirmed?: boolean;
}

export interface GearUploadResult {
  success: boolean;
  metadata?: GearMetadata;
  photoUrl?: string;
  url?: string;
  error?: string;
}

/**
 * Identify fishing gear using OpenAI Vision API - COMPLETELY REWRITTEN
 */
export const identifyGearFromImage = async (
  imageFile: File,
  userLocation: string,
): Promise<GearInfo | null> => {
  const startTime = Date.now();
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  log("🎣 [GEAR ID] Starting identification:", {
    fileName: imageFile.name,
    fileSize: imageFile.size,
    fileType: imageFile.type,
    isMobile,
  });

  // Create appropriate prompt based on detected type
  let promptText = "";

  try {
    // Check OpenAI configuration
    if (!OPENAI_ENABLED || !validateOpenAIConfig()) {
      logError("❌ [GEAR ID] OpenAI not available");
      return {
        name: "Unknown Gear",
        type: "unknown",
        confidence: 0,
        rawJsonResponse: "OpenAI not available",
        openaiPrompt: "OpenAI not configured",
      };
    }

    const apiKey = config.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      logError("❌ [GEAR ID] No API key");
      return {
        name: "Unknown Gear",
        type: "unknown",
        confidence: 0,
        rawJsonResponse: "No API key configured",
        openaiPrompt: "No API key available",
      };
    }

    // Convert image to base64 - SIMPLIFIED
    log("📷 [GEAR ID] Converting to base64...");
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      const timeout = setTimeout(() => {
        reject(new Error("Image conversion timeout"));
      }, 30000);

      reader.onload = () => {
        clearTimeout(timeout);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to read image"));
      };
      reader.readAsDataURL(imageFile);
    });

    log("🚀 [GEAR ID] Calling OpenAI...");

    // Get user location for targeted fish recommendations

    // First, do a quick analysis to determine gear type
    const typeDetectionPrompt = `Analyze this fishing gear image and determine the primary type. Return ONLY one word: "rod", "reel", "combo", "lure", "jig", "bait", "chum", "accessory", "electronics", or "other".`;

    const typeResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: typeDetectionPrompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
                  },
                },
              ],
            },
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      },
    );

    let detectedType = "other";
    if (typeResponse.ok) {
      const typeData = await typeResponse.json();
      const typeContent = typeData.choices[0]?.message?.content
        ?.trim()
        .toLowerCase();
      if (
        typeContent &&
        [
          "rod",
          "reel",
          "combo",
          "lure",
          "jig",
          "bait",
          "chum",
          "accessory",
          "electronics",
          "other",
        ].includes(typeContent)
      ) {
        detectedType = typeContent;
      }
    }

    log("🎯 [GEAR ID] Detected type:", detectedType);

    if (detectedType === "accessory") {
      // Fishing Accessories specific prompt
      promptText = `You are an expert fishing gear analyst. Analyze this fishing accessory image and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty – provide your best analysis based on what you can see.

IMPORTANT NOTES:
- DO NOT estimate size in centimeters for items like hooks or swivels – use standard size codes (e.g., '#4', '2/0', 'Size 8') where applicable
- Weights must include grams and oz when relevant
- Materials and function must be clearly explained

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When specifying target use or species, prioritize fishing styles and species common in or near this location.`
    : ""
}

{
  "name": "specific accessory name (e.g., 'Offset Worm Hook', 'Barrel Swivel with Snap')",
  "type": "accessory category (hook, swivel, clip, sinker, leader, float, rigging component, etc.)",
  "brand": "manufacturer name if visible or identifiable",
  "model": "model name or product line",
  "confidence": 0.85,
  "size": "standardized gear size (e.g., '#6', '1/0', 'Size 3 swivel')",
  "weight": "if applicable, in grams and oz (e.g., '10g (3/8 oz)')",
  "material": "construction material (e.g., 'High carbon steel', 'Brass', 'Lead')",
  "coating": "finish or anti-corrosion layer (e.g., 'Nickel-plated', 'Teflon coated')",
  "function": "primary use (e.g., 'Secure bait presentation', 'Prevent line twist')",
  "targetUse": "${
    userLocation
      ? `styles and species in ${userLocation}`
      : "intended fishing application"
  } (e.g., 'Light tackle shore fishing, seabream')",
  "fishingTechnique": "suitable fishing styles (e.g., 'Bottom fishing, trolling, jigging')",
  "riggingCompatibility": "works best with (e.g., 'Fluorocarbon leaders, soft baits')",
  "durability": "build quality (e.g., 'High tensile strength, corrosion-resistant')",
  "weatherResistance": "performance in elements (e.g., 'Saltwater safe, rust-resistant')",
  "waterType": "Freshwater, Saltwater, or Both",
  "storageRequirements": "how it should be stored (e.g., 'Keep dry, avoid tangle')",
  "maintenanceLevel": "care needs (e.g., 'Rinse after saltwater use')",
  "priceRange": "estimated cost (e.g., '$2-5 per pack', 'Mid-range')",
  "skillLevel": "user suitability (e.g., 'All-levels', 'Beginner-friendly')",
  "versatility": "flexibility of use (e.g., 'Suitable for many rigs and species')",
  "bestConditions": "ideal usage scenario (e.g., 'Calm to moderate current, clear water')",
  "fishingLocation": "common usage zones${
    userLocation ? ` around ${userLocation}` : ""
  } (e.g., 'Reef edges, rocky bottom, piers')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Return ONLY the JSON object with no additional text.`;
    } else if (detectedType === "bait" || detectedType === "chum") {
      // Bait & Chum specific prompt
      promptText = `You are an expert fishing gear and bait analyst. Analyze this image of bait or chum and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty – provide your best analysis based on what you can see.

IMPORTANT MEASUREMENT REQUIREMENTS:
- ALL sizes must be in centimeters (cm)
- ALL weights must include grams and oz
- Temperatures should be in Celsius (°C)
- Storage details should include shelf life or refrigeration needs

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When specifying target fish, prioritize species commonly found in or near this location. Consider local fishing regulations and seasonal availability for this area.`
    : ""
}

{
  "name": "specific bait name (e.g., 'Frozen Sardine Chum Block')",
  "type": "live bait, dead bait, frozen bait, artificial bait, paste, oil, groundbait, etc.",
  "brand": "brand or supplier if identifiable",
  "sourceSpecies": "animal or source species (e.g., 'Sardine', 'Mackerel', 'Shrimp')",
  "confidence": 0.85,
  "form": "presentation form (e.g., 'Whole', 'Cut', 'Minced', 'Block', 'Pellets')",
  "size": "approximate dimensions in cm (e.g., '15 cm', '3 cm chunks')",
  "weight": "in grams and oz (e.g., '500g (17.6 oz)')",
  "targetFish": "${
    userLocation ? `key species in ${userLocation}` : "target fish species"
  } (e.g., 'Grouper, Amberjack, Tuna')",
  "fishingTechnique": "best suited technique (e.g., 'Drift fishing with chum slick', 'Bottom fishing with cut bait')",
  "applicationMethod": "how it is used (e.g., 'Hooked through nose', 'Chummed from boat')",
  "weatherConditions": "best weather (e.g., 'Calm seas, warm temperatures')",
  "waterConditions": "ideal water clarity and temp (e.g., 'Clear to stained, 18–26°C')",
  "seasonalUsage": "best times${
    userLocation ? ` in ${userLocation}` : ""
  } (e.g., 'Spring and summer')",
  "scentStrength": "odor intensity (e.g., 'Strong oily scent', 'Mild natural smell')",
  "color": "natural or dyed (e.g., 'Natural silver', 'Bright red')",
  "storageRequirements": "storage needs (e.g., 'Keep frozen', 'Refrigerate after opening')",
  "shelfLife": "usable lifespan (e.g., 'Up to 12 months frozen', '1 day after thawing')",
  "environmentalImpact": "eco rating or notes (e.g., 'Biodegradable', 'Avoid in marine parks')",
  "priceRange": "approximate cost (e.g., '$3-6 per pack', 'Low-cost')",
  "skillLevel": "user suitability (e.g., 'Beginner-friendly', 'Expert baiting technique')",
  "waterType": "Freshwater, Saltwater, or Both",
  "visibility": "visibility effect in water (e.g., 'Clouds water with scent trail')",
  "chumEffectiveness": "for chum only (e.g., 'High oil content, strong dispersal')",
  "legalNotes": "if any regulation considerations (e.g., 'Check local rules for live bait')",
  "fishingLocation": "ideal locations${
    userLocation ? ` around ${userLocation}` : ""
  } (e.g., 'Reefs, piers, drop-offs')",
  "timeOfDay": "best timing (e.g., 'Early morning, dusk')",
  "currentConditions": "best current use (e.g., 'Slow drift', 'Anchored with slick')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Return ONLY the JSON object with no additional text.`;
    } else if (
      detectedType === "rod" ||
      detectedType === "reel" ||
      detectedType === "combo"
    ) {
      // Rod & Reel specific prompt
      promptText = `You are an expert fishing gear analyst. Analyze this fishing gear image and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty - provide your best analysis based on what you can see.

IMPORTANT MEASUREMENT REQUIREMENTS:
- ALL sizes must be in centimeters (cm) - convert from inches if needed
- ALL weights should include both metric (grams) and imperial (oz) when possible
- Line capacity and drag should include both metric and imperial values

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When specifying target fish, prioritize species commonly found in or near this location. Consider local fishing regulations and seasonal availability for this area.`
    : ""
}

{
  "name": "specific gear name (e.g., 'Shimano Stradic FL Spinning Combo')",
  "type": "rod, reel, or combo",
  "brand": "manufacturer name if visible or identifiable",
  "model": "model name, series, or product line",
  "confidence": 0.85,
  "rodLength": "length in cm (e.g., '213 cm', '180 cm')",
  "rodPower": "power rating (e.g., 'Ultra Light', 'Medium Heavy')",
  "rodAction": "action type (e.g., 'Fast', 'Moderate', 'Slow')",
  "rodMaterial": "rod blank material (e.g., 'Graphite', 'Carbon composite')",
  "rodPieces": "number of rod sections (e.g., '2-piece', '1-piece')",
  "reelType": "spinning, baitcasting, spincast, conventional, etc.",
  "reelSize": "reel size rating (e.g., '2500', '4000')",
  "gearRatio": "gear ratio (e.g., '6.2:1')",
  "lineCapacity": "line capacity for mono/braid in both metric and imperial (e.g., '150m/6kg, 165yd/12lb')",
  "dragSystem": "type and strength (e.g., 'Front drag, max 8kg/17.6lb')",
  "bearingCount": "number of ball bearings (e.g., '6+1 BB')",
  "weight": "weight in grams and oz (e.g., '270g (9.5 oz)')",
  "targetFish": "${
    userLocation
      ? `common species in ${userLocation}`
      : "primary target species"
  } (e.g., 'Sea bass, snapper, trout')",
  "fishingTechnique": "typical technique (e.g., 'Bottom fishing, casting, jigging')",
  "weatherConditions": "best suited conditions (e.g., 'Calm to moderate wind, overcast')",
  "waterConditions": "best water type (e.g., 'Clear, brackish, or murky')",
  "seasonalUsage": "best seasons${
    userLocation ? ` for ${userLocation}` : ""
  } (e.g., 'Year-round, peak in spring and summer')",
  "priceRange": "estimated price category (e.g., '$100-150', 'Mid-range', 'High-end')",
  "skillLevel": "user suitability (e.g., 'Beginner', 'All-levels', 'Advanced anglers')",
  "waterType": "Freshwater, Saltwater, or Both",
  "versatility": "versatility rating (e.g., 'Highly versatile across techniques')",
  "durability": "build quality and longevity (e.g., 'Corrosion-resistant, saltwater-safe')",
  "maintenanceLevel": "care requirements (e.g., 'Rinse after saltwater, check drag')",
  "storageRequirements": "storage advice (e.g., 'Use rod sleeve, avoid humidity')",
  "compatibleLine": "recommended line type and rating (e.g., 'Braid 10-20 lb, Mono 8-12 lb')",
  "compatibleLureWeight": "lure weight range (e.g., '5-20g')",
  "fishingLocation": "best suited locations${
    userLocation ? ` near ${userLocation}` : ""
  } (e.g., 'Shoreline, reef, kayak, offshore')",
  "timeOfDay": "optimal timing (e.g., 'Morning and dusk')",
  "structureType": "ideal structural zones (e.g., 'Rocky bottom, reefs, open water')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Return ONLY the JSON object with no additional text.`;
    } else if (detectedType === "electronics") {
      // Electronics specific prompt
      promptText = `You are an expert in marine electronics and fishing gear. Analyze this image of a marine electronic device and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty – provide your best analysis based on what you can see.

IMPORTANT NOTES:
- Screen size must be in inches and cm
- Frequencies in kHz
- Depth ranges in meters (m)
- Power in volts (V) and thrust in pounds (lb) for trolling motors
- Include control types and key features

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When describing use and target fish, consider fishing practices and species common near this location.`
    : ""
}

{
  "name": "device name (e.g., 'Garmin Force Trolling Motor', 'Lowrance HDS LIVE 12')",
  "type": "device category (e.g., 'MFD', 'Fishfinder', 'GPS', 'Transducer', 'Trolling Motor')",
  "brand": "manufacturer (e.g., 'Garmin', 'Simrad', 'Minn Kota')",
  "model": "model or product line",
  "confidence": 0.85,
  "screenSize": "if applicable, in inches and cm (e.g., '9-inch (22.9 cm)')",
  "resolution": "screen resolution (e.g., '1280x800 pixels')",
  "frequency": "supported sonar frequencies (e.g., 'CHIRP 83/200 kHz, SideScan 455/800 kHz')",
  "sonarType": "supported sonar types (e.g., 'CHIRP, SideScan, DownScan, LiveScope')",
  "depthRange": "maximum depth in meters (e.g., '300m')",
  "gps": "GPS capability (e.g., 'Internal GPS with anchor lock')",
  "chartCompatibility": "supported charts (e.g., 'Navionics+, C-MAP Reveal')",
  "touchscreen": "whether it's touch-enabled (e.g., 'Yes', 'No')",
  "connectivity": "connections available (e.g., 'Wi-Fi, Bluetooth, NMEA 2000, Ethernet')",
  "mountType": "mounting option (e.g., 'Flush mount', 'Bow mount', 'Transom mount')",
  "transducerIncluded": "if a transducer is included (e.g., 'Yes, 3-in-1')",

  // Trolling Motor Specific Fields
  "thrust": "motor power in pounds (e.g., '55 lb thrust')",
  "voltage": "operating voltage (e.g., '24V DC')",
  "shaftLength": "shaft length in inches and cm (e.g., '50 inch (127 cm)')",
  "controlType": "control interface (e.g., 'Foot pedal, remote control, mobile app')",
  "features": "notable features (e.g., 'Anchor lock, autopilot, sonar built-in')",

  "targetFish": "${
    userLocation ? `species targeted in ${userLocation}` : "target species"
  } (e.g., 'Dentex, Tuna, Grouper')",
  "fishingTechnique": "fishing styles it supports (e.g., 'Trolling, vertical jigging, live sonar')",
  "waterType": "Freshwater, Saltwater, or Both",
  "weatherResistance": "rating (e.g., 'IPX7 waterproof')",
  "powerSource": "power input (e.g., '12V DC, 1.5A')",
  "integration": "system compatibility (e.g., 'Autopilot, radar, engine data, trolling motor')",
  "priceRange": "estimated price (e.g., '$1200-2000', 'Premium')",
  "skillLevel": "user level (e.g., 'Advanced', 'Beginner-friendly')",
  "versatility": "range of use cases (e.g., 'Kayak to offshore boat setups')",
  "maintenanceLevel": "maintenance needs (e.g., 'Flush connectors after salt use')",
  "storageRequirements": "care instructions (e.g., 'Remove and store dry after trip')",
  "fishingLocation": "common use zones${
    userLocation ? ` in ${userLocation}` : ""
  } (e.g., 'Drop-offs, reefs, trolling lanes')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Return ONLY the JSON object with no additional text.`;
    } else if (detectedType === "other") {
      // Other/Miscellaneous gear specific prompt
      promptText = `You are an expert fishing gear analyst. Analyze this image of miscellaneous fishing-related gear and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty – provide your best educated analysis based on what you can observe.

IMPORTANT NOTES:
- Use metric units where applicable (cm, g, °C)
- If the item isn't used directly for fishing, describe its relevance to the fishing experience
- Be adaptive – this category covers bags, clothing, safety gear, tools, lights, coolers, measuring tools, and more

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When relevant, consider the location's climate, common fishing techniques, and species when describing use.`
    : ""
}

{
  "name": "item name (e.g., 'Waterproof Gear Bag', 'Digital Fish Scale')",
  "type": "type or category (e.g., 'Cooler', 'Rain Jacket', 'Bait Knife', 'UV Buff', 'Dry Bag')",
  "brand": "brand or manufacturer if identifiable",
  "model": "model or product line",
  "confidence": 0.85,
  "size": "dimensions in cm (e.g., '40x25x20 cm')",
  "weight": "in grams and oz (e.g., '500g (17.6 oz)')",
  "material": "main material or fabric (e.g., 'PVC-coated nylon', 'Stainless steel')",
  "purpose": "primary use (e.g., 'Keeps bait cold', 'Protects from wind and spray')",
  "targetUse": "${
    userLocation
      ? `for fishing around ${userLocation}`
      : "general fishing application"
  } (e.g., 'Boat storage, offshore safety, shoreline comfort')",
  "weatherSuitability": "climate performance (e.g., 'Waterproof and wind-resistant', 'Breathable for hot days')",
  "durability": "construction quality (e.g., 'Heavy-duty stitching, corrosion-resistant')",
  "storageCapacity": "if applicable (e.g., '20L bag', 'Holds 4 tackle boxes')",
  "powerSource": "if electronic (e.g., 'USB rechargeable, 2xAA batteries')",
  "waterType": "Freshwater, Saltwater, or Both",
  "maintenanceLevel": "care instructions (e.g., 'Wipe clean, air dry')",
  "storageRequirements": "best way to store it (e.g., 'Keep dry, avoid prolonged sun exposure')",
  "priceRange": "approximate retail value (e.g., '$10-25', 'Mid-range')",
  "skillLevel": "user suitability (e.g., 'All levels', 'Pro-level utility')",
  "versatility": "other possible uses (e.g., 'Camping, boating, general outdoor use')",
  "fishingLocation": "best use zones${
    userLocation ? ` around ${userLocation}` : ""
  } (e.g., 'Onboard storage, shore setup, kayak deck')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Return ONLY the JSON object with no additional text.`;
    } else if (detectedType === "lure" || detectedType === "jig") {
      // Lure/Jig specific prompt
      promptText = `You are an expert fishing gear analyst. Analyze this fishing gear image and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty - provide your best analysis based on what you can see.

IMPORTANT MEASUREMENT REQUIREMENTS:
- ALL sizes must be in centimeters (cm) - convert from inches if needed
- ALL depths must be in meters (m) - convert from feet if needed
- ALL weights should include both metric (grams) and imperial (oz) when possible

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When specifying target fish, prioritize species commonly found in or near this location. Consider local fishing regulations and seasonal availability for this area.`
    : ""
}

{
  "name": "specific gear name (e.g., 'Rapala Original Floating Minnow')",
  "type": "specific type (lure/jig/spoon/crankbait/rod/reel/hook/sinker/etc)",
  "brand": "manufacturer name if visible or identifiable",
  "model": "model name, series, or product line",
  "confidence": 0.85,
  "size": "precise measurement in cm (e.g., '8.9 cm', '12.7 cm')",
  "weight": "weight specification in grams and oz (e.g., '7g (1/4 oz)', '14g (1/2 oz)')",
  "targetFish": "${
    userLocation
      ? `primary fish species for ${userLocation} area`
      : "primary fish species this targets"
  } (e.g., 'Bass, Pike, Walleye')",
  "fishingTechnique": "detailed technique description (e.g., 'Cast and steady retrieve with occasional pauses')",
  "weatherConditions": "optimal weather (e.g., 'Overcast skies, light wind')",
  "waterConditions": "best water conditions (e.g., 'Clear to slightly stained water')",
  "seasonalUsage": "best seasons and months${
    userLocation ? ` for ${userLocation}` : ""
  } (e.g., 'Spring through fall, peak in summer')",
  "colorPattern": "detailed color description (e.g., 'Silver body with blue back and red accents')",
  "actionType": "movement characteristics (e.g., 'Tight wobbling action with flash')",
  "depthRange": "operating depth in meters (e.g., '0.6-1.8m', 'Surface to 1m')",
  "material": "construction material (e.g., 'Hard plastic body with metal lip')",
  "durability": "durability assessment (e.g., 'High durability, chip-resistant finish')",
  "priceRange": "estimated price category (e.g., '$8-12', 'Budget', 'Mid-range', 'Premium')",
  "skillLevel": "user skill requirement (e.g., 'Beginner-friendly', 'Intermediate', 'Advanced')",
  "waterType": "water compatibility (e.g., 'Freshwater', 'Saltwater', 'Both')",
  "hookSize": "hook specifications if applicable (e.g., '#6 treble hooks')",
  "lineWeight": "recommended line weight (e.g., '3.6-5.4kg (8-12 lb test)')",
  "retrieveSpeed": "optimal retrieve speed (e.g., 'Slow to medium', 'Variable')",
  "vibration": "vibration characteristics (e.g., 'Strong vibration', 'Subtle vibration')",
  "buoyancy": "buoyancy type (e.g., 'Floating', 'Sinking', 'Suspending')",
  "visibility": "visibility conditions (e.g., 'High visibility water', 'Stained water')",
  "noiseLevel": "sound production (e.g., 'Silent', 'Moderate rattle', 'Loud popper')",
  "versatility": "versatility rating - REQUIRED FIELD (e.g., 'Highly versatile for multiple species', 'Specialized for specific conditions')",
  "maintenanceLevel": "maintenance needs (e.g., 'Low maintenance', 'Rinse after saltwater use')",
  "storageRequirements": "storage needs (e.g., 'Store in tackle box, avoid extreme heat')",
  "compatibleGear": "compatible equipment - REQUIRED FIELD (e.g., 'Medium action rods, spinning reels', 'Heavy tackle for big fish')",
  "fishingLocation": "best locations${
    userLocation ? ` near ${userLocation}` : ""
  } (e.g., 'Shore casting, boat trolling, pier fishing')",
  "timeOfDay": "optimal timing (e.g., 'Dawn and dusk, overcast days')",
  "currentConditions": "current preferences (e.g., 'Still to slow current')",
  "structureType": "structure compatibility (e.g., 'Open water, around cover, weed edges')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Remember to use metric measurements (cm for size, meters for depth) and consider the user's location for target fish recommendations. Return ONLY the JSON object with no additional text.`;
    } else {
      // Generic gear prompt for other types
      promptText = `You are an expert fishing gear analyst. Analyze this fishing gear image and return ONLY a JSON object with ALL these fields filled with specific, detailed information. Never use "Unknown", "N/A", or leave fields empty - provide your best analysis based on what you can see.

IMPORTANT MEASUREMENT REQUIREMENTS:
- ALL sizes must be in centimeters (cm) - convert from inches if needed
- ALL depths must be in meters (m) - convert from feet if needed
- ALL weights should include both metric (grams) and imperial (oz) when possible

${
  userLocation
    ? `USER LOCATION: ${userLocation}
When specifying target fish, prioritize species commonly found in or near this location. Consider local fishing regulations and seasonal availability for this area.`
    : ""
}

{
  "name": "specific gear name (e.g., 'Rapala Original Floating Minnow')",
  "type": "specific type (lure/jig/spoon/crankbait/rod/reel/hook/sinker/etc)",
  "brand": "manufacturer name if visible or identifiable",
  "model": "model name, series, or product line",
  "confidence": 0.85,
  "size": "precise measurement in cm (e.g., '8.9 cm', '12.7 cm')",
  "weight": "weight specification in grams and oz (e.g., '7g (1/4 oz)', '14g (1/2 oz)')",
  "targetFish": "${
    userLocation
      ? `primary fish species for ${userLocation} area`
      : "primary fish species this targets"
  } (e.g., 'Bass, Pike, Walleye')",
  "fishingTechnique": "detailed technique description (e.g., 'Cast and steady retrieve with occasional pauses')",
  "weatherConditions": "optimal weather (e.g., 'Overcast skies, light wind')",
  "waterConditions": "best water conditions (e.g., 'Clear to slightly stained water')",
  "seasonalUsage": "best seasons and months${
    userLocation ? ` for ${userLocation}` : ""
  } (e.g., 'Spring through fall, peak in summer')",
  "colorPattern": "detailed color description (e.g., 'Silver body with blue back and red accents')",
  "actionType": "movement characteristics (e.g., 'Tight wobbling action with flash')",
  "depthRange": "operating depth in meters (e.g., '0.6-1.8m', 'Surface to 1m')",
  "material": "construction material (e.g., 'Hard plastic body with metal lip')",
  "durability": "durability assessment (e.g., 'High durability, chip-resistant finish')",
  "priceRange": "estimated price category (e.g., '$8-12', 'Budget', 'Mid-range', 'Premium')",
  "skillLevel": "user skill requirement (e.g., 'Beginner-friendly', 'Intermediate', 'Advanced')",
  "waterType": "water compatibility (e.g., 'Freshwater', 'Saltwater', 'Both')",
  "hookSize": "hook specifications if applicable (e.g., '#6 treble hooks')",
  "lineWeight": "recommended line weight (e.g., '3.6-5.4kg (8-12 lb test)')",
  "retrieveSpeed": "optimal retrieve speed (e.g., 'Slow to medium', 'Variable')",
  "vibration": "vibration characteristics (e.g., 'Strong vibration', 'Subtle vibration')",
  "buoyancy": "buoyancy type (e.g., 'Floating', 'Sinking', 'Suspending')",
  "visibility": "visibility conditions (e.g., 'High visibility water', 'Stained water')",
  "noiseLevel": "sound production (e.g., 'Silent', 'Moderate rattle', 'Loud popper')",
  "versatility": "versatility rating - REQUIRED FIELD (e.g., 'Highly versatile for multiple species', 'Specialized for specific conditions')",
  "maintenanceLevel": "maintenance needs (e.g., 'Low maintenance', 'Rinse after saltwater use')",
  "storageRequirements": "storage needs (e.g., 'Store in tackle box, avoid extreme heat')",
  "compatibleGear": "compatible equipment - REQUIRED FIELD (e.g., 'Medium action rods, spinning reels', 'Heavy tackle for big fish')",
  "fishingLocation": "best locations${
    userLocation ? ` near ${userLocation}` : ""
  } (e.g., 'Shore casting, boat trolling, pier fishing')",
  "timeOfDay": "optimal timing (e.g., 'Dawn and dusk, overcast days')",
  "currentConditions": "current preferences (e.g., 'Still to slow current')",
  "structureType": "structure compatibility (e.g., 'Open water, around cover, weed edges')"
}

Analyze the image carefully and provide detailed, specific information for every field. Use your expertise to make educated assessments even if some details aren't perfectly clear. Remember to use metric measurements (cm for size, meters for depth) and consider the user's location for target fish recommendations. Return ONLY the JSON object with no additional text.`;
    }

    // Main analysis request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert fishing gear analyst. You MUST return a complete JSON object with ALL requested fields filled. Never leave fields empty or use 'Unknown' - provide your best analysis. The 'versatility' and 'compatibleGear' fields are MANDATORY and must always be included with meaningful content.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText,
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError("❌ [GEAR ID] API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    log("📥 [GEAR ID] Raw response:", {
      content,
      usage: data.usage,
      finishReason: data.choices[0]?.finish_reason,
    });

    if (!content) {
      logError("❌ [GEAR ID] Empty response");
      return {
        name: "Unknown Gear",
        type: "unknown",
        confidence: 0,
        rawJsonResponse: content || "Error occurred during identification",
        openaiPrompt:
          promptText || "Error occurred before prompt could be sent",
      };
    }

    // SIMPLIFIED JSON PARSING
    let gearInfo;
    try {
      // Clean content - remove any markdown or extra text
      let cleanContent = content;

      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*|```\s*/g, "");

      // Extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      gearInfo = JSON.parse(cleanContent);
      log("✅ [GEAR ID] Parsed successfully:", gearInfo);
    } catch (parseError) {
      logError("❌ [GEAR ID] Parse failed:", parseError.message);
      logError("❌ [GEAR ID] Content was:", content);

      return {
        name: "Unknown Gear",
        type: "unknown",
        confidence: 0,
        rawJsonResponse: content || "No response from OpenAI",
        openaiPrompt: promptText,
      };
    }

    // VALIDATE AND CLEAN RESPONSE
    const cleanField = (value: any): string | undefined => {
      if (!value || typeof value !== "string") return undefined;
      const cleaned = value.trim();
      if (
        cleaned === "" ||
        cleaned.toLowerCase() === "unknown" ||
        cleaned.toLowerCase() === "n/a"
      ) {
        return undefined;
      }
      return cleaned;
    };

    const finalGearInfo: GearInfo = {
      name: cleanField(gearInfo.name) || "Unknown Gear",
      type: cleanField(gearInfo.type) || "unknown",
      brand: cleanField(gearInfo.brand),
      model: cleanField(gearInfo.model),
      confidence:
        typeof gearInfo.confidence === "number"
          ? Math.max(0, Math.min(1, gearInfo.confidence))
          : 0,
      size: cleanField(gearInfo.size),
      weight: cleanField(gearInfo.weight),
      targetFish: cleanField(gearInfo.targetFish),
      fishingTechnique: cleanField(gearInfo.fishingTechnique),
      weatherConditions: cleanField(gearInfo.weatherConditions),
      waterConditions: cleanField(gearInfo.waterConditions),
      seasonalUsage: cleanField(gearInfo.seasonalUsage),
      colorPattern: cleanField(gearInfo.colorPattern),
      actionType: cleanField(gearInfo.actionType),
      depthRange: cleanField(gearInfo.depthRange),
      // Additional comprehensive fields
      material: cleanField(gearInfo.material),
      durability: cleanField(gearInfo.durability),
      priceRange: cleanField(gearInfo.priceRange),
      skillLevel: cleanField(gearInfo.skillLevel),
      waterType: cleanField(gearInfo.waterType),
      hookSize: cleanField(gearInfo.hookSize),
      lineWeight: cleanField(gearInfo.lineWeight),
      retrieveSpeed: cleanField(gearInfo.retrieveSpeed),
      vibration: cleanField(gearInfo.vibration),
      buoyancy: cleanField(gearInfo.buoyancy),
      visibility: cleanField(gearInfo.visibility),
      noiseLevel: cleanField(gearInfo.noiseLevel),
      // CRITICAL: These fields must NEVER be undefined - provide fallbacks
      versatility:
        cleanField(gearInfo.versatility) ||
        "Versatile fishing gear suitable for various conditions",
      maintenanceLevel: cleanField(gearInfo.maintenanceLevel),
      storageRequirements: cleanField(gearInfo.storageRequirements),
      compatibleGear:
        cleanField(gearInfo.compatibleGear) ||
        "Compatible with standard fishing equipment",
      fishingLocation: cleanField(gearInfo.fishingLocation),
      timeOfDay: cleanField(gearInfo.timeOfDay),
      currentConditions: cleanField(gearInfo.currentConditions),
      structureType: cleanField(gearInfo.structureType),
      // Debug information - ALWAYS PRESERVE
      rawJsonResponse: content,
      openaiPrompt: promptText,
    };

    const enhancedFieldsCount = [
      finalGearInfo.size,
      finalGearInfo.weight,
      finalGearInfo.targetFish,
      finalGearInfo.fishingTechnique,
      finalGearInfo.weatherConditions,
      finalGearInfo.waterConditions,
      finalGearInfo.seasonalUsage,
      finalGearInfo.colorPattern,
      finalGearInfo.actionType,
      finalGearInfo.depthRange,
      finalGearInfo.material,
      finalGearInfo.durability,
      finalGearInfo.priceRange,
      finalGearInfo.skillLevel,
      finalGearInfo.waterType,
      finalGearInfo.hookSize,
      finalGearInfo.lineWeight,
      finalGearInfo.retrieveSpeed,
      finalGearInfo.vibration,
      finalGearInfo.buoyancy,
      finalGearInfo.visibility,
      finalGearInfo.noiseLevel,
      finalGearInfo.versatility,
      finalGearInfo.maintenanceLevel,
      finalGearInfo.storageRequirements,
      finalGearInfo.compatibleGear,
      finalGearInfo.fishingLocation,
      finalGearInfo.timeOfDay,
      finalGearInfo.currentConditions,
      finalGearInfo.structureType,
    ].filter(Boolean).length;

    const totalTime = Date.now() - startTime;
    log("🎉 [GEAR ID] Success!", {
      finalGearInfo,
      enhancedFieldsCount,
      totalTime,
      dataQuality:
        enhancedFieldsCount >= 15
          ? "EXCELLENT"
          : enhancedFieldsCount >= 10
            ? "VERY GOOD"
            : enhancedFieldsCount >= 5
              ? "GOOD"
              : "BASIC",
      hasRawJsonResponse: !!finalGearInfo.rawJsonResponse,
      hasOpenaiPrompt: !!finalGearInfo.openaiPrompt,
      rawJsonLength: finalGearInfo.rawJsonResponse?.length || 0,
      promptLength: finalGearInfo.openaiPrompt?.length || 0,
    });

    return finalGearInfo;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logError("💥 [GEAR ID] Failed:", {
      error: error instanceof Error ? error.message : String(error),
      totalTime,
    });

    return {
      name: "Unknown Gear",
      type: "unknown",
      confidence: 0,
      rawJsonResponse: `Error during AI identification: ${
        error instanceof Error ? error.message : String(error)
      }`,
      openaiPrompt: promptText || "Error occurred before prompt could be sent",
    };
  }
};

/**
 * Upload and process a gear image
 */
export const uploadGearImage = async (
  file: File,
  userLocation?: string,
): Promise<GearUploadResult> => {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  log("🔍 [GEAR UPLOAD] Starting:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    isMobile,
  });

  try {
    // Validate file
    if (file.size > 15 * 1024 * 1024) {
      return {
        success: false,
        error: `Image must be less than 15MB (current: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(1)}MB)`,
      };
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Please select an image file" };
    }

    // Use Supabase storage as primary (avoids CSP issues)
    let photoUrl: string;
    const supabaseStatus = getSupabaseStorageStatus();

    log("🔍 [GEAR UPLOAD] Storage status check:", {
      supabaseConfigured: supabaseStatus.configured,
      supabaseUrl: !!config.VITE_SUPABASE_URL,
      supabaseKey: !!config.VITE_SUPABASE_ANON_KEY,
    });

    if (supabaseStatus.configured) {
      log("📤 [GEAR UPLOAD] Using Supabase storage (primary)...");
      try {
        photoUrl = await uploadImageToSupabase(file, "gear-images");
        log("✅ [GEAR UPLOAD] Supabase upload successful:", photoUrl);
      } catch (supabaseError) {
        warnLog(
          "⚠️ [GEAR UPLOAD] Supabase failed, trying Vercel Blob fallback:",
          supabaseError,
        );

        // Fallback to Vercel Blob
        const blobStatus = getBlobStorageStatus();
        if (!blobStatus.configured) {
          return {
            success: false,
            error: `Both storage options failed. Supabase: ${
              supabaseError instanceof Error
                ? supabaseError.message
                : String(supabaseError)
            }. Blob: ${blobStatus.error || "Not configured"}`,
          };
        }

        photoUrl = await uploadImage(file);
        log("✅ [GEAR UPLOAD] Vercel Blob fallback successful:", photoUrl);
      }
    } else {
      // Fallback to Vercel Blob if Supabase not configured
      log("📤 [GEAR UPLOAD] Supabase not configured, using Vercel Blob...");
      const blobStatus = getBlobStorageStatus();
      if (!blobStatus.configured) {
        return {
          success: false,
          error: `No storage configured. Supabase: ${
            supabaseStatus.hasSupabaseUrl ? "URL OK" : "No URL"
          }, ${supabaseStatus.hasSupabaseKey ? "Key OK" : "No Key"}. Blob: ${
            blobStatus.error || "Not configured"
          }`,
        };
      }

      photoUrl = await uploadImage(file);
      log("✅ [GEAR UPLOAD] Vercel Blob upload successful:", photoUrl);
    }

    // Identify gear
    log("🤖 [GEAR UPLOAD] Identifying gear...");
    const gearInfo = await identifyGearFromImage(file, userLocation).catch(
      (error) => {
        warnLog("⚠️ [GEAR UPLOAD] AI failed, using fallback:", error);
        return {
          name: "Unknown Gear",
          type: "unknown",
          confidence: 0,
          rawJsonResponse: `Error during AI identification: ${
            error instanceof Error ? error.message : String(error)
          }`,
          openaiPrompt: "Error occurred before prompt could be sent",
        };
      },
    );
    log("✅ [GEAR UPLOAD] Gear identified:", gearInfo);

    // Create metadata
    const metadata: GearMetadata = {
      url: photoUrl,
      gearInfo,
      timestamp: new Date().toISOString(),
      originalFileName: file.name,
      userConfirmed: false,
    };

    log("🎉 [GEAR UPLOAD] Complete!", {
      hasGearInfo: !!gearInfo,
      gearName: gearInfo?.name,
      gearType: gearInfo?.type,
    });

    return {
      success: true,
      metadata,
      photoUrl,
      url: photoUrl,
    };
  } catch (error) {
    error("❌ [GEAR UPLOAD] Failed:", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      fileName: file.name,
      fileSize: file.size,
      isMobile,
      stack: error instanceof Error ? error.stack : undefined,
    });

    let errorMsg = "Failed to upload gear image. Please try again.";
    let errorCategory = "UNKNOWN";

    if (error instanceof Error) {
      if (
        error.message.includes("timeout") ||
        error.message.includes("took too long")
      ) {
        errorMsg =
          "Upload timed out. This may be due to a slow connection or database issue. Please try again.";
        errorCategory = "TIMEOUT";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorMsg =
          "Network error during upload. Please check your connection and try again.";
        errorCategory = "NETWORK";
      } else if (
        error.message.includes("database") ||
        error.message.includes("Database")
      ) {
        errorMsg =
          "Database error during gear upload. Please try again or contact support.";
        errorCategory = "DATABASE";
      } else if (
        error.message.includes("storage") ||
        error.message.includes("blob")
      ) {
        errorMsg =
          "File storage error. Please try again with a different image.";
        errorCategory = "STORAGE";
      } else {
        errorMsg = error.message;
      }
    }

    error("[GEAR UPLOAD] 🏷️ Error categorized as:", {
      category: errorCategory,
      message: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
};
