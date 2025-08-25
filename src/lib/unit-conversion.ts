/**
 * Unit conversion utilities for the app
 */

// Check if imperial units are enabled
export const useImperialUnits = (): boolean => {
  const preference = localStorage.getItem("useImperialUnits");
  return preference === "true";
};

export const getImperialUnits = (): boolean => {
  const preference = localStorage.getItem("useImperialUnits");
  return preference === "true";
};

// Convert cm to inches
export const cmToInches = (cm: number): number => {
  return cm * 0.393701;
};

// Convert inches to cm
export const inchesToCm = (inches: number): number => {
  return inches * 2.54;
};

// Convert grams to pounds
export const gramsToPounds = (grams: number): number => {
  return grams * 0.00220462;
};

// Convert pounds to grams
export const poundsToGrams = (pounds: number): number => {
  return pounds * 453.592;
};

// Format length with appropriate unit
export const formatLength = (lengthCm: number | null | undefined): string => {
  if (lengthCm === null || lengthCm === undefined) return "Unknown";

  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (useImperialUnits()) {
    const inches = cmToInches(lengthCm);
    if (inches >= 12) {
      const feet = Math.floor(inches / 12);
      const remainingInches = (inches % 12).toFixed(1);
      return `${feet}' ${remainingInches}"` + ` (${lengthCm.toFixed(1)} cm)`;
    } else {
      return `${inches.toFixed(1)}"` + ` (${lengthCm.toFixed(1)} cm)`;
    }
  } else {
    return `${lengthCm.toFixed(1)} cm`;
  }
};

// Format weight with appropriate unit
export const formatWeight = (
  weightGrams: number | null | undefined,
): string => {
  if (weightGrams === null || weightGrams === undefined) return "Unknown";

  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (useImperialUnits()) {
    const pounds = gramsToPounds(weightGrams);
    if (pounds >= 1) {
      return `${pounds.toFixed(2)} lbs` + ` (${weightGrams.toFixed(0)} g)`;
    } else {
      const ounces = pounds * 16;
      return `${ounces.toFixed(1)} oz` + ` (${weightGrams.toFixed(0)} g)`;
    }
  } else {
    if (weightGrams >= 1000) {
      return `${(weightGrams / 1000).toFixed(2)} kg`;
    } else {
      return `${weightGrams.toFixed(0)} g`;
    }
  }
};

// Format temperature with appropriate unit
export const formatTemperature = (tempC: number | null | undefined): string => {
  if (tempC === null || tempC === undefined) return "Unknown";

  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (useImperialUnits()) {
    const tempF = (tempC * 9) / 5 + 32;
    return `${Math.round(tempF)}°F` + ` (${Math.round(tempC)}°C)`;
  } else {
    return `${Math.round(tempC)}°C`;
  }
};

// Format distance with appropriate unit
export const formatDistance = (
  distanceKm: number | null | undefined,
): string => {
  if (distanceKm === null || distanceKm === undefined) return "Unknown";

  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (useImperialUnits()) {
    const miles = distanceKm * 0.621371;
    return `${miles.toFixed(1)} mi` + ` (${distanceKm.toFixed(1)} km)`;
  } else {
    return `${distanceKm.toFixed(1)} km`;
  }
};

// Format speed with appropriate unit
export const formatSpeed = (speedKmh: number | null | undefined): string => {
  if (speedKmh === null || speedKmh === undefined) return "Unknown";

  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (useImperialUnits()) {
    const mph = speedKmh * 0.621371;
    return `${Math.round(mph)} mph` + ` (${Math.round(speedKmh)} km/h)`;
  } else {
    return `${Math.round(speedKmh)} km/h`;
  }
};
