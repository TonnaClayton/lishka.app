/**
 * Centralized type definitions for gear recommendations
 */

export interface GearRecommendation {
  date: string;
  score: number;
  reasoning: string;
  confidence: number;
  match_type: string;
  method_tags: string[];
  suitability_for_conditions?: string;
}

export interface AIRecommendation {
  gear_id: string;
  score: number;
  reasoning: string;
  suitability_for_conditions?: string;
  method_tags?: string[];
  match_type?: string;
  confidence?: number;
}
