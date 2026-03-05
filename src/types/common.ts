/**
 * Common shared types used across the application
 */

// Fish related types
export interface Fish {
  id: string;
  name: string;
  scientific_name?: string;
  image?: string;
  habitat: string;
  slug: string;
  difficulty: "Easy" | "Intermediate" | "Hard" | "Advanced" | "Expert";
  season: string;
  is_toxic: boolean;
  risk_badge?: string | null;
}

// Location related types
export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
  address?: string;
}

// Image metadata types
export interface FishInfo {
  name: string;
  confidence: number;
  estimatedSize: string;
  estimatedWeight: string;
}

export interface ImageMetadata {
  url: string;
  timestamp: string;
  fishInfo?: FishInfo;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Message/Chat types
export interface Message {
  id: string;
  user_role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  fish_results?: Fish[];
  gear_results?: Array<{
    id: string;
  }>;
  image?: string;
}

// Weather types
export interface WeatherData {
  temperature: number;
  wind_speed: number;
  wave_height?: number;
  swell_wave_height?: number;
  swell_wave_period?: number;
  condition: string;
}

// Upload status types
export enum UploadStepStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface UploadPhotoStreamData {
  data: {
    message: string;
    type?: string;
    confidence?: number;
    classifying?: UploadStepStatus;
    analyzeResult?: string;
    analyzing: UploadStepStatus;
    uploading: UploadStepStatus;
    saved: UploadStepStatus;
    errors: string[];
    processedFiles: number;
    totalFiles: number;
    uploadStatus?: UploadStepStatus;
    classificationResult?: {
      type: "fish" | "gear";
      confidence: number;
      reasoning?: string;
    };
  };
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  timestamp: number;
  retryable?: boolean;
}

export interface UploadError extends AppError {
  type: "classification" | "upload" | "network" | "timeout";
}
