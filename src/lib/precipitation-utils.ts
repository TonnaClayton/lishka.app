interface PrecipitationForecast {
  chance: number;
  amount: number;
  hourByHour: Array<{
    hour: number;
    probability: number;
    amount: number;
  }>;
}

interface WeatherData {
  hourly?: {
    precipitation_probability?: (number | null)[];
    precipitation?: (number | null)[];
    time?: string[] | number[];
  };
}

export const calculatePrecipitationForecast = (
  weatherData: WeatherData | null | undefined,
  currentHourIndex: number,
): PrecipitationForecast => {
  const emptyForecast: PrecipitationForecast = {
    chance: 0,
    amount: 0,
    hourByHour: [],
  };

  const probsAll = weatherData?.hourly?.precipitation_probability ?? [];
  const amtsAll = weatherData?.hourly?.precipitation ?? [];
  if (!probsAll.length || !amtsAll.length) return emptyForecast;

  // Slice strictly to the next 6 hours from "now"
  const sliceEnd = Math.min(currentHourIndex + 6, probsAll.length);
  const probs = probsAll.slice(currentHourIndex, sliceEnd);
  const amts = amtsAll.slice(currentHourIndex, sliceEnd);

  if (!probs.length || !amts.length) return emptyForecast;

  // Chance = max probability within the 6h window
  const validProbs = probs.filter((p) => p !== null && p !== undefined);
  const chance = validProbs.length ? Math.max(...validProbs) : 0;

  // Weighted amount over the same window (normalize if <6 hours remain)
  // Weights prioritize near-term precipitation (next 1-2 hours most heavily)
  const baseWeights = [0.35, 0.25, 0.15, 0.1, 0.1, 0.05];
  const weights = baseWeights.slice(0, amts.length);
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

  let weighted = 0;
  for (let i = 0; i < amts.length; i++) {
    const val = amts[i] ?? 0;
    weighted += val * weights[i];
  }
  const amount = parseFloat((weighted / weightSum).toFixed(1));

  const hourByHour = amts.map((val, i) => ({
    hour: currentHourIndex + i,
    probability: probs[i] ?? 0,
    amount: val ?? 0,
  }));

  return { chance, amount, hourByHour };
};
