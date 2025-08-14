export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
  state?: string;
  city?: string;
  _timestamp?: number;
}

export const locationQueryKeys = {
  userLocation: () => ["location", "user"] as const,
  savedLocation: () => ["location", "saved"] as const,
  currentWeatherData: () => ["weather", "current"] as const,
};
