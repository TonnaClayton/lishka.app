export const formatTime = (timeString: number | string): string => {
  try {
    const date =
      typeof timeString === "number"
        ? new Date(timeString * 1000)
        : new Date(timeString);
    if (isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    console.error("Error formatting time:", err);
    return "--:--";
  }
};

export const getWindDirection = (degrees: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export const getDirectionArrow = (degrees: number): JSX.Element => {
  return (
    <div className="inline-flex items-center justify-center">
      <div
        className="text-[#0251FB] transform"
        style={{ transform: `rotate(${degrees}deg)` }}
      >
        ↑
      </div>
    </div>
  );
};

export const getFishingConditionsRating = (
  waveHeight: number | null,
  windSpeed: number | null,
  swellWavePeriod: number | null,
): string => {
  if (waveHeight === null || windSpeed === null) {
    return "Unknown";
  }

  let score = 0;
  let factorsUsed = 0;

  if (waveHeight !== null) {
    factorsUsed++;
    if (waveHeight < 0.3) score += 5;
    else if (waveHeight < 0.7) score += 4;
    else if (waveHeight < 1.2) score += 3;
    else if (waveHeight < 2) score += 2;
    else if (waveHeight < 3) score += 1;
  }

  if (windSpeed !== null) {
    factorsUsed++;
    if (windSpeed < 5) score += 3;
    else if (windSpeed < 15) score += 5;
    else if (windSpeed < 25) score += 3;
    else if (windSpeed < 35) score += 1;
  }

  if (swellWavePeriod !== null) {
    factorsUsed++;
    if (swellWavePeriod > 10) score += 5;
    else if (swellWavePeriod > 8) score += 4;
    else if (swellWavePeriod > 6) score += 3;
    else if (swellWavePeriod > 4) score += 2;
    else score += 1;
  }

  if (factorsUsed === 0) return "Unknown";

  const totalScore = score / factorsUsed;

  if (totalScore >= 4.5) return "Excellent";
  if (totalScore >= 3.5) return "Good";
  if (totalScore >= 2.5) return "Fair";
  return "Poor";
};

export const getMarineAdvice = (
  waveHeight: number | null,
  windSpeed: number | null,
): string => {
  if (waveHeight === null && windSpeed === null) {
    return "Marine data not available";
  }

  let advice = "";

  if (waveHeight !== null && typeof waveHeight === "number") {
    if (waveHeight < 0.5) {
      advice += "Calm seas with minimal waves. Excellent for small vessels. ";
    } else if (waveHeight < 1.0) {
      advice += "Light chop with small waves. Good for most boats. ";
    } else if (waveHeight < 2.0) {
      advice += "Moderate waves. Use caution with smaller vessels. ";
    } else if (waveHeight < 3.0) {
      advice += "Rough seas with significant waves. Small craft advisory. ";
    } else {
      advice += "Dangerous wave conditions. Consider postponing trip. ";
    }
  }

  if (windSpeed !== null && typeof windSpeed === "number") {
    if (windSpeed < 10) {
      advice += "Light winds favorable for fishing. ";
    } else if (windSpeed < 20) {
      advice += "Moderate winds may affect casting and boat positioning. ";
    } else if (windSpeed < 30) {
      advice += "Strong winds will make fishing challenging. ";
    } else {
      advice += "High winds create unsafe boating conditions. ";
    }
  }

  return advice.trim();
};

export const findCurrentHourIndex = (
  hourlyTimes: (number | string)[],
): number => {
  if (!hourlyTimes || hourlyTimes.length === 0) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  let closestIndex = 0;
  let smallestDiff = Infinity;

  hourlyTimes.forEach((time, index) => {
    const timeValue =
      typeof time === "string"
        ? Math.floor(new Date(time).getTime() / 1000)
        : time;
    const diff = Math.abs(timeValue - now);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestIndex = index;
    }
  });

  return closestIndex;
};
