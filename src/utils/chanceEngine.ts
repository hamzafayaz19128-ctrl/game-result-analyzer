import { GameResult, GameType, WheelConfig, PayoutMultipliers } from '../types/game';

export interface OutcomeAnalysis {
  outcome: string;
  label: string;
  theoreticalProb: number | null; // percentage 0-100 or null if unknown
  allHistoryCount: number;
  allHistoryProb: number; // percentage
  last20Prob: number;
  last50Prob: number;
  last100Prob: number;
  currentStreak: number;
  whatFollowedStreak: Record<string, number>; // outcome -> percentage
  bestPattern: string[]; // sequence e.g. ['RED', 'GREEN']
  patternMatchCount: number;
  whatFollowedPattern: Record<string, number>; // outcome -> percentage
  roundsSinceLastAppeared: number;
  longestHistoricalAbsence: number;
  transitionProbFromPrevious: number; // percentage of following previous outcome
  backtestedHitRate: number; // percentage
  payoutMultiplier: number;
  breakEvenProb: number; // percentage (1/multiplier * 100)
  expectedValuePerUnit: number; // (prob/100 * multiplier) - 1
  ci95Lower: number; // percentage
  ci95Upper: number; // percentage
  hasPositiveEdge: boolean;
}

export interface CandidateDecision {
  outcome: string | null;
  label: string | null;
  status: 'CANDIDATE' | 'NO_EDGE' | 'LEARNING_MODE';
  statusMessage: string;
  reasons: string[];
}

export interface StreamBacktestSummary {
  totalChecks: number;
  correctCount: number;
  hitRate: number; // percentage
  randomBaseline: number; // percentage
  breakEvenRate: number; // percentage
  diffFromBaseline: number;
  ci95Lower: number;
  ci95Upper: number;
  isLearningMode: boolean;
}

// Map Roulette numbers 1-12 to stream values
export function getRouletteStreamValue(num: number, stream: 'number' | 'color' | 'size' | 'parity'): string {
  if (stream === 'number') return num.toString();
  if (stream === 'color') {
    return [1, 3, 5, 8, 10, 12].includes(num) ? 'RED' : 'BLACK';
  }
  if (stream === 'size') {
    return num >= 1 && num <= 6 ? 'SMALL' : 'BIG';
  }
  if (stream === 'parity') {
    return num % 2 === 0 ? 'EVEN' : 'ODD';
  }
  return num.toString();
}

// Convert game results to the target stream outcomes
export function extractOutcomesForStream(
  results: GameResult[],
  gameType: GameType,
  rouletteStream: 'number' | 'color' | 'size' | 'parity' = 'color'
): { id: string; outcome: string; timestamp: number }[] {
  const filtered = results
    .filter((r) => r.gameType === gameType)
    .sort((a, b) => a.timestamp - b.timestamp);

  return filtered.map((r) => {
    let outcomeStr = r.outcome;
    if (gameType === 'roulette' && r.numericValue !== undefined) {
      outcomeStr = getRouletteStreamValue(r.numericValue, rouletteStream);
    }
    return {
      id: r.id,
      outcome: outcomeStr,
      timestamp: r.timestamp,
    };
  });
}

// Get possible outcomes list for stream
export function getPossibleOutcomesForStream(
  gameType: GameType,
  wheelConfig: WheelConfig,
  rouletteStream: 'number' | 'color' | 'size' | 'parity' = 'color'
): { id: string; label: string; defaultTheoretical: number | null }[] {
  if (gameType === 'coin') {
    return [
      { id: 'RED', label: 'Red (R)', defaultTheoretical: 50.0 },
      { id: 'GREEN', label: 'Green (G)', defaultTheoretical: 50.0 },
    ];
  }
  if (gameType === 'dice') {
    return [
      { id: 'UNDER_50', label: 'Under 50', defaultTheoretical: 50.0 },
      { id: 'OVER_50', label: 'Over 50', defaultTheoretical: 50.0 },
    ];
  }
  if (gameType === 'wheel') {
    const red = wheelConfig.redSegments ?? 0;
    const blue = wheelConfig.blueSegments ?? 0;
    const box = wheelConfig.boxSegments ?? 0;
    const total = red + blue + box;

    const blueLabel = wheelConfig.blueGreenName || 'Blue/Green Diamond';

    if (total > 0 && red !== undefined && blue !== undefined && box !== undefined) {
      return [
        { id: 'RED_PINK_DIAMOND', label: 'Red/Pink Diamond', defaultTheoretical: (red / total) * 100 },
        { id: 'BLUE_GREEN_DIAMOND', label: blueLabel, defaultTheoretical: (blue / total) * 100 },
        { id: 'BOX', label: 'Box Segment', defaultTheoretical: (box / total) * 100 },
      ];
    }
    return [
      { id: 'RED_PINK_DIAMOND', label: 'Red/Pink Diamond', defaultTheoretical: null },
      { id: 'BLUE_GREEN_DIAMOND', label: blueLabel, defaultTheoretical: null },
      { id: 'BOX', label: 'Box Segment', defaultTheoretical: null },
    ];
  }
  if (gameType === 'roulette') {
    if (rouletteStream === 'number') {
      return Array.from({ length: 12 }, (_, i) => ({
        id: (i + 1).toString(),
        label: `Number ${i + 1}`,
        defaultTheoretical: (1 / 12) * 100,
      }));
    }
    if (rouletteStream === 'color') {
      return [
        { id: 'RED', label: '🔴 Red', defaultTheoretical: 50.0 },
        { id: 'BLACK', label: '⚫ Black', defaultTheoretical: 50.0 },
      ];
    }
    if (rouletteStream === 'size') {
      return [
        { id: 'SMALL', label: 'Small (1–6)', defaultTheoretical: 50.0 },
        { id: 'BIG', label: 'Big (7–12)', defaultTheoretical: 50.0 },
      ];
    }
    if (rouletteStream === 'parity') {
      return [
        { id: 'EVEN', label: 'Even Numbers', defaultTheoretical: 50.0 },
        { id: 'ODD', label: 'Odd Numbers', defaultTheoretical: 50.0 },
      ];
    }
  }

  return [];
}

// Helper: Calculate 95% Confidence Interval for a sample proportion
export function calculate95CI(count: number, total: number): { lower: number; upper: number } {
  if (total <= 0) return { lower: 0, upper: 0 };
  const p = count / total;
  const se = Math.sqrt((p * (1 - p)) / total);
  const lower = Math.max(0, p - 1.96 * se) * 100;
  const upper = Math.min(1, p + 1.96 * se) * 100;
  return { lower, upper };
}

// Compute comprehensive outcome statistics for a game & stream
export function analyzeStreamOutcomes(
  results: GameResult[],
  gameType: GameType,
  wheelConfig: WheelConfig,
  multipliers: PayoutMultipliers,
  rouletteStream: 'number' | 'color' | 'size' | 'parity' = 'color'
): {
  analyses: OutcomeAnalysis[];
  candidateDecision: CandidateDecision;
  backtestSummary: StreamBacktestSummary;
} {
  const streamData = extractOutcomesForStream(results, gameType, rouletteStream);
  const possibleOutcomes = getPossibleOutcomesForStream(gameType, wheelConfig, rouletteStream);
  const totalCount = streamData.length;
  const sequence = streamData.map((d) => d.outcome);

  // Get payout multiplier mapping for current stream
  const getMultiplier = (outcomeId: string): number => {
    if (gameType === 'coin') {
      return (multipliers.coin as any)[outcomeId] || 2.0;
    }
    if (gameType === 'dice') {
      return (multipliers.dice as any)[outcomeId] || 2.0;
    }
    if (gameType === 'wheel') {
      return (multipliers.wheel as any)[outcomeId] || 3.0;
    }
    if (gameType === 'roulette') {
      if (rouletteStream === 'number') return multipliers.roulette.number || 12.0;
      if (rouletteStream === 'color') return multipliers.roulette.color || 2.0;
      if (rouletteStream === 'size') return multipliers.roulette.size || 2.0;
      if (rouletteStream === 'parity') return multipliers.roulette.parity || 2.0;
    }
    return 2.0;
  };

  // 1. Current streak calculation
  let currentStreakOutcome = '';
  let currentStreakCount = 0;
  if (totalCount > 0) {
    currentStreakOutcome = sequence[totalCount - 1];
    for (let i = totalCount - 1; i >= 0; i--) {
      if (sequence[i] === currentStreakOutcome) {
        currentStreakCount++;
      } else {
        break;
      }
    }
  }

  // 2. What historically followed current streak
  const whatFollowedStreak: Record<string, number> = {};
  if (currentStreakCount > 0 && totalCount > currentStreakCount) {
    let matchTimes = 0;
    const streakTally: Record<string, number> = {};

    for (let i = 0; i <= totalCount - currentStreakCount - 1; i++) {
      let isMatch = true;
      for (let k = 0; k < currentStreakCount; k++) {
        if (sequence[i + k] !== currentStreakOutcome) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        const next = sequence[i + currentStreakCount];
        streakTally[next] = (streakTally[next] || 0) + 1;
        matchTimes++;
      }
    }
    if (matchTimes > 0) {
      for (const [out, cnt] of Object.entries(streakTally)) {
        whatFollowedStreak[out] = (cnt / matchTimes) * 100;
      }
    }
  }

  // 3. Best Pattern Matching
  let bestPattern: string[] = [];
  let patternMatchCount = 0;
  const whatFollowedPattern: Record<string, number> = {};

  if (totalCount >= 2) {
    // Try lengths 4 down to 1
    for (let len = Math.min(4, totalCount - 1); len >= 1; len--) {
      const pat = sequence.slice(totalCount - len);
      const matches: string[] = [];

      for (let i = 0; i <= totalCount - len - 1; i++) {
        let isMatch = true;
        for (let k = 0; k < len; k++) {
          if (sequence[i + k] !== pat[k]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          matches.push(sequence[i + len]);
        }
      }

      if (matches.length >= 2 || (len === 1 && matches.length > 0)) {
        bestPattern = pat;
        patternMatchCount = matches.length;
        const tally: Record<string, number> = {};
        matches.forEach((m) => {
          tally[m] = (tally[m] || 0) + 1;
        });
        Object.entries(tally).forEach(([out, cnt]) => {
          whatFollowedPattern[out] = (cnt / matches.length) * 100;
        });
        break;
      }
    }
  }

  // 4. Transition analysis from previous outcome
  const previousOutcome = totalCount > 0 ? sequence[totalCount - 1] : '';
  const transitionTally: Record<string, number> = {};
  let transitionTotal = 0;
  if (previousOutcome) {
    for (let i = 0; i < totalCount - 1; i++) {
      if (sequence[i] === previousOutcome) {
        const next = sequence[i + 1];
        transitionTally[next] = (transitionTally[next] || 0) + 1;
        transitionTotal++;
      }
    }
  }

  // 5. Backtesting walk-through across history
  let backtestCorrect = 0;
  let backtestTotal = 0;
  const perOutcomeBacktestHits: Record<string, number> = {};
  const perOutcomeBacktestTotal: Record<string, number> = {};

  for (let i = 1; i < totalCount; i++) {
    const subSeq = sequence.slice(0, i);
    const actualNext = sequence[i];

    // Predict based on pattern match / transition on subSeq
    const prev = subSeq[subSeq.length - 1];
    let predicted: string | null = null;
    let maxPatternCount = 0;

    // Pattern on subSeq
    for (let len = Math.min(3, subSeq.length - 1); len >= 1; len--) {
      const pat = subSeq.slice(subSeq.length - len);
      const tally: Record<string, number> = {};
      let matches = 0;

      for (let j = 0; j <= subSeq.length - len - 1; j++) {
        let ok = true;
        for (let k = 0; k < len; k++) {
          if (subSeq[j + k] !== pat[k]) {
            ok = false;
            break;
          }
        }
        if (ok) {
          const nxt = subSeq[j + len];
          tally[nxt] = (tally[nxt] || 0) + 1;
          matches++;
        }
      }

      if (matches > maxPatternCount) {
        maxPatternCount = matches;
        let bestOut: string | null = null;
        let maxC = -1;
        for (const [o, c] of Object.entries(tally)) {
          if (c > maxC) {
            maxC = c;
            bestOut = o;
          }
        }
        predicted = bestOut;
        break;
      }
    }

    // Fallback to transition if no pattern match
    if (!predicted && prev) {
      const transTally: Record<string, number> = {};
      for (let j = 0; j < subSeq.length - 1; j++) {
        if (subSeq[j] === prev) {
          const nxt = subSeq[j + 1];
          transTally[nxt] = (transTally[nxt] || 0) + 1;
        }
      }
      let bestOut: string | null = null;
      let maxC = -1;
      for (const [o, c] of Object.entries(transTally)) {
        if (c > maxC) {
          maxC = c;
          bestOut = o;
        }
      }
      predicted = bestOut;
    }

    if (predicted) {
      backtestTotal++;
      perOutcomeBacktestTotal[predicted] = (perOutcomeBacktestTotal[predicted] || 0) + 1;
      if (predicted === actualNext) {
        backtestCorrect++;
        perOutcomeBacktestHits[predicted] = (perOutcomeBacktestHits[predicted] || 0) + 1;
      }
    }
  }

  // Baseline probability
  let randomBaseline = 50.0;
  if (gameType === 'roulette') {
    randomBaseline = rouletteStream === 'number' ? (1 / 12) * 100 : 50.0;
  } else if (gameType === 'wheel') {
    const totalSegs =
      (wheelConfig.redSegments ?? 0) +
      (wheelConfig.blueSegments ?? 0) +
      (wheelConfig.boxSegments ?? 0);
    randomBaseline = totalSegs > 0 ? (1 / 3) * 100 : (1 / 3) * 100;
  }

  const backtestHitRate = backtestTotal > 0 ? (backtestCorrect / backtestTotal) * 100 : 0;
  const backtestCI = calculate95CI(backtestCorrect, backtestTotal);

  const backtestSummary: StreamBacktestSummary = {
    totalChecks: backtestTotal,
    correctCount: backtestCorrect,
    hitRate: backtestHitRate,
    randomBaseline,
    breakEvenRate: (1 / (multipliers.roulette?.color || 2.0)) * 100,
    diffFromBaseline: backtestHitRate - randomBaseline,
    ci95Lower: backtestCI.lower,
    ci95Upper: backtestCI.upper,
    isLearningMode: backtestTotal < 100,
  };

  // Compile detailed metrics for each possible outcome
  const analyses: OutcomeAnalysis[] = possibleOutcomes.map((po) => {
    const outcomeId = po.id;
    const theoreticalProb = po.defaultTheoretical;

    // Counts in windows
    const allHistoryCount = sequence.filter((s) => s === outcomeId).length;
    const allHistoryProb = totalCount > 0 ? (allHistoryCount / totalCount) * 100 : 0;

    const last20Seq = sequence.slice(Math.max(0, totalCount - 20));
    const last20Count = last20Seq.filter((s) => s === outcomeId).length;
    const last20Prob = last20Seq.length > 0 ? (last20Count / last20Seq.length) * 100 : 0;

    const last50Seq = sequence.slice(Math.max(0, totalCount - 50));
    const last50Count = last50Seq.filter((s) => s === outcomeId).length;
    const last50Prob = last50Seq.length > 0 ? (last50Count / last50Seq.length) * 100 : 0;

    const last100Seq = sequence.slice(Math.max(0, totalCount - 100));
    const last100Count = last100Seq.filter((s) => s === outcomeId).length;
    const last100Prob = last100Seq.length > 0 ? (last100Count / last100Seq.length) * 100 : 0;

    // Rounds since last appeared
    let roundsSinceLastAppeared = totalCount;
    for (let i = totalCount - 1; i >= 0; i--) {
      if (sequence[i] === outcomeId) {
        roundsSinceLastAppeared = totalCount - 1 - i;
        break;
      }
    }

    // Longest historical absence
    let maxAbsence = 0;
    let currentAbsence = 0;
    for (let i = 0; i < totalCount; i++) {
      if (sequence[i] === outcomeId) {
        if (currentAbsence > maxAbsence) maxAbsence = currentAbsence;
        currentAbsence = 0;
      } else {
        currentAbsence++;
      }
    }
    if (currentAbsence > maxAbsence) maxAbsence = currentAbsence;

    // Transition probability
    const transCount = transitionTally[outcomeId] || 0;
    const transitionProbFromPrevious = transitionTotal > 0 ? (transCount / transitionTotal) * 100 : 0;

    // Outcome backtest hit rate
    const obTotal = perOutcomeBacktestTotal[outcomeId] || 0;
    const obHits = perOutcomeBacktestHits[outcomeId] || 0;
    const outcomeBacktestHitRate = obTotal > 0 ? (obHits / obTotal) * 100 : allHistoryProb;

    // Financial & odds calculation
    const mult = getMultiplier(outcomeId);
    const breakEvenProb = mult > 0 ? (1 / mult) * 100 : 50;
    const estimatedProb = allHistoryProb; // empirical share
    const expectedValuePerUnit = (estimatedProb / 100) * mult - 1;

    const ci = calculate95CI(allHistoryCount, totalCount);
    const hasPositiveEdge = ci.lower > breakEvenProb && totalCount >= 30;

    return {
      outcome: outcomeId,
      label: po.label,
      theoreticalProb,
      allHistoryCount,
      allHistoryProb,
      last20Prob,
      last50Prob,
      last100Prob,
      currentStreak: outcomeId === currentStreakOutcome ? currentStreakCount : 0,
      whatFollowedStreak,
      bestPattern,
      patternMatchCount,
      whatFollowedPattern,
      roundsSinceLastAppeared,
      longestHistoricalAbsence: maxAbsence,
      transitionProbFromPrevious,
      backtestedHitRate: outcomeBacktestHitRate,
      payoutMultiplier: mult,
      breakEvenProb,
      expectedValuePerUnit,
      ci95Lower: ci.lower,
      ci95Upper: ci.upper,
      hasPositiveEdge,
    };
  });

  // Evaluate candidate recommendation
  const candidateDecision = determineCandidateOutcome(
    analyses,
    totalCount,
    patternMatchCount,
    whatFollowedPattern,
    transitionTally,
    transitionTotal,
    backtestTotal,
    randomBaseline,
    gameType,
    wheelConfig
  );

  return {
    analyses,
    candidateDecision,
    backtestSummary,
  };
}

// Function to determine if one outcome satisfies all 5 strict candidate conditions
function determineCandidateOutcome(
  analyses: OutcomeAnalysis[],
  totalCount: number,
  patternMatchCount: number,
  whatFollowedPattern: Record<string, number>,
  transitionTally: Record<string, number>,
  transitionTotal: number,
  backtestTotal: number,
  randomBaseline: number,
  gameType: GameType,
  wheelConfig: WheelConfig
): CandidateDecision {
  // Condition 0: Learning mode if backtest checks < 100
  if (backtestTotal < 100) {
    return {
      outcome: null,
      label: null,
      status: 'LEARNING_MODE',
      statusMessage: 'Learning mode — abhi reliable decision ke liye data kam hai.',
      reasons: [
        `Backtest checks recorded: ${backtestTotal}/100 minimum required.`,
        'Needs at least 100 genuine backtested checks to activate candidate highlighting.',
      ],
    };
  }

  // Condition 1: Total results >= 30
  if (totalCount < 30) {
    return {
      outcome: null,
      label: null,
      status: 'NO_EDGE',
      statusMessage: 'NO RELIABLE EDGE — paisa lagane ke liye reliable signal nahi.',
      reasons: [
        `Total results: ${totalCount}/30 minimum required.`,
        'Insufficient historical records for pattern confidence.',
      ],
    };
  }

  // Condition 2: Wheel theoretical known
  if (gameType === 'wheel') {
    const totalSegs =
      (wheelConfig.redSegments ?? 0) +
      (wheelConfig.blueSegments ?? 0) +
      (wheelConfig.boxSegments ?? 0);
    if (totalSegs === 0) {
      return {
        outcome: null,
        label: null,
        status: 'NO_EDGE',
        statusMessage: 'NO RELIABLE EDGE — paisa lagane ke liye reliable signal nahi.',
        reasons: ['Wheel segment counts not configured in settings.'],
      };
    }
  }

  // Condition 3: Pattern match count >= 10
  if (patternMatchCount < 10) {
    return {
      outcome: null,
      label: null,
      status: 'NO_EDGE',
      statusMessage: 'NO RELIABLE EDGE — paisa lagane ke liye reliable signal nahi.',
      reasons: [`Matched pattern count: ${patternMatchCount}/10 minimum required.`],
    };
  }

  // Find outcome supported by pattern match
  let patternCandidate: string | null = null;
  let maxPatternPct = 0;
  for (const [out, pct] of Object.entries(whatFollowedPattern)) {
    if (pct > maxPatternPct) {
      maxPatternPct = pct;
      patternCandidate = out;
    }
  }

  // Find outcome supported by transition analysis
  let transitionCandidate: string | null = null;
  let maxTransPct = 0;
  if (transitionTotal > 0) {
    for (const [out, cnt] of Object.entries(transitionTally)) {
      const pct = (cnt / transitionTotal) * 100;
      if (pct > maxTransPct) {
        maxTransPct = pct;
        transitionCandidate = out;
      }
    }
  }

  // Find outcome supported by backtest hit rate / positive edge
  let bestAnalysis: OutcomeAnalysis | null = null;
  for (const a of analyses) {
    if (
      patternCandidate === a.outcome &&
      (transitionCandidate === a.outcome || a.backtestedHitRate > randomBaseline)
    ) {
      // Condition 4: Performance > random baseline
      if (a.allHistoryProb > randomBaseline || a.backtestedHitRate > randomBaseline) {
        // Condition 5: Must NOT be based solely on overdue
        if (a.roundsSinceLastAppeared <= a.longestHistoricalAbsence + 2) {
          bestAnalysis = a;
          break;
        }
      }
    }
  }

  if (bestAnalysis) {
    return {
      outcome: bestAnalysis.outcome,
      label: bestAnalysis.label,
      status: 'CANDIDATE',
      statusMessage: 'Most supported historical outcome',
      reasons: [
        `Matched sequence pattern occurred ${patternMatchCount} times.`,
        `Sequence pattern predicts ${bestAnalysis.label} with ${maxPatternPct.toFixed(1)}% probability.`,
        `Historical hit rate (${bestAnalysis.allHistoryProb.toFixed(1)}%) exceeds baseline (${randomBaseline.toFixed(1)}%).`,
      ],
    };
  }

  return {
    outcome: null,
    label: null,
    status: 'NO_EDGE',
    statusMessage: 'NO RELIABLE EDGE — paisa lagane ke liye reliable signal nahi.',
    reasons: [
      'No single outcome satisfied all 5 agreement criteria simultaneously.',
      'Statistical variance remains within standard random distribution.',
    ],
  };
}
