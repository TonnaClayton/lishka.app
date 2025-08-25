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
}

export const toGearItem = (item: Json | string | null) => {
  let gearItem: GearItem | null = null;

  if (typeof item === "string") {
    gearItem = JSON.parse(item);
  }

  return gearItem;
};
