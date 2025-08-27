interface PrecipitationForecast {
  chance: number;
  amount: number;
  hourByHour: Array<{
    hour: number;
    probability: number;
    amount: number;
  }>;
}

export const calculatePrecipitationForecast = (
  weatherData: any,
  currentHourIndex: number,
): PrecipitationForecast => {
  const emptyForecast: PrecipitationForecast = {
    chance: 0,
    amount: 0,
    hourByHour: [],
  };

  if (
    !weatherData?.hourly?.precipitation_probability ||
    !weatherData?.hourly?.precipitation
  ) {
    return emptyForecast;
  }

  const probabilities =
    weatherData?.hourly?.precipitation_probability?.slice(
      currentHourIndex,
      currentHourIndex + 6,
    ) || [];
  const amounts =
    weatherData?.hourly?.precipitation?.slice(
      currentHourIndex,
      currentHourIndex + 6,
    ) || [];

  if (!probabilities.length || !amounts.length) {
    return emptyForecast;
  }

  const maxProbability = Math.max(...probabilities.filter((p) => p !== null));

  const weights = [0.35, 0.25, 0.15, 0.1, 0.1, 0.05];
  let weightedAmount = 0;
  let validWeightSum = 0;

  for (let i = 0; i < 6; i++) {
    if (amounts[i] !== null && amounts[i] !== undefined) {
      weightedAmount += amounts[i] * weights[i];
      validWeightSum += weights[i];
    }
  }

  const finalAmount = validWeightSum > 0 ? weightedAmount / validWeightSum : 0;

  const hourByHour = [];
  for (let i = 0; i < 6; i++) {
    if (probabilities[i] !== null && probabilities[i] !== undefined) {
      hourByHour.push({
        hour: i,
        probability: probabilities[i],
        amount: amounts[i] !== null ? amounts[i] : 0,
      });
    }
  }

  return {
    chance: maxProbability || 0,
    amount: parseFloat(finalAmount.toFixed(1)),
    hourByHour,
  };
};
