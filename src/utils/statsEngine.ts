import {
  GameResult,
  GameType,
  RouletteClassifications,
  WheelConfig,
  DiceConfig,
  TransitionStats,
  LaplaceEstimate,
  BacktestStats,
} from '../types/game';

// Classification rules for Mini Roulette (1 to 12)
export function classifyRouletteNumber(num: number): RouletteClassifications {
  const size = num <= 6 ? 'SMALL' : 'BIG';
  const parity = num % 2 === 0 ? 'EVEN' : 'ODD';
  const redNumbers = [1, 3, 5, 8, 10, 12];
  const color = redNumbers.includes(num) ? 'RED' : 'BLACK';

  return { size, parity, color };
}

// Classification rules for Dice
export function classifyDiceValue(val: number): string {
  if (val < 50) return 'UNDER_50';
  return 'OVER_50';
}

// Possible outcomes per game type
export function getPossibleOutcomesForGame(
  gameType: GameType,
  wheelConfig: WheelConfig
): { id: string; label: string }[] {
  switch (gameType) {
    case 'coin':
      return [
        { id: 'RED', label: 'Red' },
        { id: 'GREEN', label: 'Green' },
      ];
    case 'roulette':
      return Array.from({ length: 12 }, (_, i) => ({
        id: (i + 1).toString(),
        label: `Num ${i + 1}`,
      }));
    case 'wheel':
      return [
        { id: 'RED_PINK_DIAMOND', label: 'Red/Pink Diamond' },
        { id: 'BLUE_GREEN_DIAMOND', label: wheelConfig.blueGreenName || 'Blue/Green Diamond' },
        { id: 'BOX', label: 'Box' },
      ];
    case 'dice':
      return [
        { id: 'UNDER_50', label: 'Under 50' },
        { id: 'OVER_50', label: 'Over 50' },
      ];
  }
}

// Calculate streaks (Current and Longest)
export function calculateStreaks(outcomes: string[]): {
  currentStreakOutcome: string;
  currentStreakCount: number;
  longestStreakOutcome: string;
  longestStreakCount: number;
} {
  if (outcomes.length === 0) {
    return {
      currentStreakOutcome: 'N/A',
      currentStreakCount: 0,
      longestStreakOutcome: 'N/A',
      longestStreakCount: 0,
    };
  }

  // outcomes are chronologically ordered (oldest first) for streak calculations
  let currentOutcome = outcomes[0];
  let currentCount = 1;

  let longestOutcome = outcomes[0];
  let longestCount = 1;

  for (let i = 1; i < outcomes.length; i++) {
    if (outcomes[i] === currentOutcome) {
      currentCount++;
    } else {
      if (currentCount > longestCount) {
        longestCount = currentCount;
        longestOutcome = currentOutcome;
      }
      currentOutcome = outcomes[i];
      currentCount = 1;
    }
  }

  if (currentCount > longestCount) {
    longestCount = currentCount;
    longestOutcome = currentOutcome;
  }

  // Current streak is based on the LAST item in chronological list
  const lastIndex = outcomes.length - 1;
  const lastOutcome = outcomes[lastIndex];
  let activeStreak = 0;
  for (let i = lastIndex; i >= 0; i--) {
    if (outcomes[i] === lastOutcome) {
      activeStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreakOutcome: lastOutcome,
    currentStreakCount: activeStreak,
    longestStreakOutcome: longestOutcome,
    longestStreakCount: longestCount,
  };
}

// Calculate transition matrix
export function calculateTransitions(
  outcomesChronological: string[],
  possibleOutcomes: { id: string; label: string }[]
): TransitionStats[] {
  const outcomeIds = possibleOutcomes.map((p) => p.id);
  const counts: Record<string, Record<string, number>> = {};

  outcomeIds.forEach((from) => {
    counts[from] = {};
    outcomeIds.forEach((to) => {
      counts[from][to] = 0;
    });
  });

  for (let i = 0; i < outcomesChronological.length - 1; i++) {
    const from = outcomesChronological[i];
    const to = outcomesChronological[i + 1];
    if (counts[from] && counts[from][to] !== undefined) {
      counts[from][to]++;
    }
  }

  return possibleOutcomes.map((prev) => {
    const nextCounts = counts[prev.id] || {};
    const totalTransitions = Object.values(nextCounts).reduce((a, b) => a + b, 0);
    const nextPercentages: Record<string, number> = {};

    outcomeIds.forEach((to) => {
      const c = nextCounts[to] || 0;
      nextPercentages[to] = totalTransitions > 0 ? (c / totalTransitions) * 100 : 0;
    });

    return {
      previousOutcome: prev.id,
      nextOutcomeCounts: nextCounts,
      nextOutcomePercentages: nextPercentages,
    };
  });
}

// Laplace smoothing calculation:
// Estimated Share = (count + 1) / (total + k)
export function calculateLaplaceEstimates(
  counts: Record<string, number>,
  total: number,
  possibleOutcomes: { id: string; label: string }[]
): LaplaceEstimate[] {
  const k = possibleOutcomes.length;
  if (k === 0) return [];

  return possibleOutcomes.map((item) => {
    const c = counts[item.id] || 0;
    const smoothedProb = (c + 1) / (total + k);
    return {
      outcome: item.id,
      label: item.label,
      count: c,
      smoothedProbability: smoothedProb * 100,
    };
  });
}

// Calculate backtesting performance stats
export function calculateBacktestStats(
  resultsChronological: GameResult[],
  gameType: GameType
): BacktestStats {
  const evaluatedResults = resultsChronological.filter(
    (r) => r.backtestEstimatedOutcome && r.backtestWasCorrect !== undefined
  );

  const totalEvaluated = evaluatedResults.length;
  const correctCount = evaluatedResults.filter((r) => r.backtestWasCorrect).length;
  const hitRate = totalEvaluated > 0 ? (correctCount / totalEvaluated) * 100 : 0;

  // Random baseline by game type
  let randomBaseline = 50.0;
  if (gameType === 'roulette') randomBaseline = (1 / 12) * 100; // 8.33%
  else if (gameType === 'wheel') randomBaseline = (1 / 3) * 100; // 33.33%
  else if (gameType === 'dice') randomBaseline = 50.0; // 50% Under/Over
  else if (gameType === 'coin') randomBaseline = 50.0; // 50%

  const diff = hitRate - randomBaseline;
  const hasNoPredictiveEdge = totalEvaluated < 30 || diff <= 0;

  return {
    totalEvaluated,
    correctCount,
    hitRate,
    randomBaseline,
    differenceFromBaseline: diff,
    hasNoPredictiveEdge,
  };
}

// Filter recent results window (e.g. last 10, last 20, last 50)
export function getRecentFrequencies(
  outcomesNewestFirst: string[],
  windowSize: number,
  possibleOutcomes: { id: string; label: string }[]
): Record<string, { count: number; percentage: number }> {
  const windowed = outcomesNewestFirst.slice(0, windowSize);
  const total = windowed.length;
  const counts: Record<string, number> = {};

  possibleOutcomes.forEach((p) => (counts[p.id] = 0));
  windowed.forEach((o) => {
    if (counts[o] !== undefined) counts[o]++;
  });

  const res: Record<string, { count: number; percentage: number }> = {};
  possibleOutcomes.forEach((p) => {
    const c = counts[p.id] || 0;
    res[p.id] = {
      count: c,
      percentage: total > 0 ? (c / total) * 100 : 0,
    };
  });

  return res;
}
