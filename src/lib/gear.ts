import { Json } from "@/types/supabase";

export interface GearItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  brand?: string;
  model?: string;
  price?: string;
  condition?: string;
  purchaseDate?: string;
  imageUrl: string;
  timestamp: string;
  userConfirmed?: boolean;
  gearType?: string;
  aiConfidence?: number;
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

  versatility?: string;
  compatibleGear?: string;

  estimatedValue?: string;

  // Category-specific fields
  gearRatio?: string;
  bearings?: string;
  dragSystem?: string;
  lineCapacity?: string;
  construction?: string;
  features?: string;
  action?: string;
  power?: string;
  lineWeight?: string;
  lureWeight?: string;
  handle?: string;
  capacity?: string;
  material?: string;
  waterResistant?: string;
  compartments?: string;
  usage?: string;
  sharpness?: string;
  durability?: string;
  baitType?: string;
  scent?: string;
  color?: string;
  waterType?: string;
  season?: string;
  technique?: string;
  screenSize?: string;
  frequency?: string;
  maxDepth?: string;
  gps?: string;
  transducer?: string;
  powerSource?: string;
  mounting?: string;
  accuracy?: string;
  display?: string;
  battery?: string;
  insulation?: string;
  exterior?: string;
  iceRetention?: string;
  portability?: string;
  pockets?: string;
  fit?: string;
  // Debug information
  rawJsonResponse?: string;
  openaiPrompt?: string;
}

export const toGearItem = (item: Json | string | null) => {
  if (typeof item === "string") {
    return JSON.parse(item) as GearItem;
  }

  return item as unknown as GearItem;
};
