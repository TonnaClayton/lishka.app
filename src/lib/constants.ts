/**
 * Global constants for the Lishka application
 * Centralized location for magic numbers, colors, timeouts, and configuration values
 */

// Z-Index layers
export const Z_INDEX = {
  DROPDOWN: 50,
  STICKY_HEADER: 50,
  BOTTOM_NAV: 50,
  UPLOAD_BAR: 60,
  MODAL: 100,
  TOAST: 200,
  TOOLTIP: 300,
} as const;

// Brand Colors
export const COLORS = {
  BRAND_BLUE: "#0251FB",
  BRAND_BLUE_LIGHT: "#0251FB0D",
  BRAND_BLUE_MEDIUM: "#0251FB1A",
  BRAND_BLUE_HOVER: "#0251FB33",
  TEXT_PRIMARY: "#191B1F",
  TEXT_SECONDARY: "#65758B",
  BACKGROUND_LIGHT: "#F7F7F7",
  BORDER_LIGHT: "#191B1F1A",
  SUCCESS_GREEN: "#10B981",
  ERROR_RED: "#EF4444",
  WARNING_YELLOW: "#F59E0B",
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  DEBOUNCE_DEFAULT: 300,
  DEBOUNCE_SEARCH: 500,
  CAROUSEL_AUTO_ADVANCE: 8000,
  TOAST_DEFAULT: 3000,
  TOAST_SUCCESS: 5000,
  ERROR_MESSAGE_DISPLAY: 5000,
  UPLOAD_TIMEOUT: 45000,
  API_REQUEST_TIMEOUT: 30000,
} as const;

// File Upload Constraints
export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_GEAR_ITEMS_BATCH: 10,
  MAX_IMAGES_BATCH: 5,
  LARGE_FILE_THRESHOLD: 3 * 1024 * 1024, // 3MB
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
} as const;

// Validation Constraints
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  FULL_NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 500,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  GEAR_ITEMS_PER_PAGE: 20,
  SEARCH_RESULTS_PER_PAGE: 10,
} as const;

// Layout Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  DEFAULT: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "lishka_auth_token",
  USER_PREFERENCES: "lishka_user_preferences",
  THEME: "lishka_theme",
  EDIT_INFO_DIALOG: "lishka_editInfoDialog_dontShowAgain",
  CACHED_LOCATION: "lishka_cached_location",
} as const;

// API Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: {
    LAT: 35.8997,
    LNG: 14.5146,
  },
  COORDINATE_PRECISION: 6,
} as const;

// Queue Configuration
export const QUEUE_CONFIG = {
  MAX_UPLOAD_QUEUE_SIZE: 5,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
} as const;

// Image Crop Configuration
export const CROP_CONFIG = {
  DEFAULT_ASPECT_RATIO: 1, // Square
  DEFAULT_CROP_WIDTH_PERCENT: 90,
  DEFAULT_CROP_HEIGHT_PERCENT: 90,
  DEFAULT_CROP_X_PERCENT: 5,
  DEFAULT_CROP_Y_PERCENT: 10,
  JPEG_QUALITY: 0.95,
} as const;
