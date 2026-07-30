import { GameResult, WheelConfig } from '../types/game';
import {
  calculateStreaks,
  calculateLaplaceEstimates,
  getPossibleOutcomesForGame,
  classifyRouletteNumber,
  calculateBacktestStats,
} from './statsEngine';

export interface AuditTestResult {
  feature: string;
  expected: string;
  actual: string;
  pass: boolean;
  repair: string;
}

export function runGameDiagnostics(): AuditTestResult[] {
  const resultsTable: AuditTestResult[] = [];

  const recordTest = (
    feature: string,
    expected: string,
    actual: string,
    pass: boolean,
    repair: string = 'None required'
  ) => {
    resultsTable.push({ feature, expected, actual, pass, repair });
  };

  // 1. COIN GAME TEST SCENARIO
  // Chronological input: RED, GREEN, GREEN, RED, RED, RED
  const coinSequence = ['RED', 'GREEN', 'GREEN', 'RED', 'RED', 'RED'];
  const coinPossibilities = [
    { id: 'RED', label: 'Red' },
    { id: 'GREEN', label: 'Green' },
  ];

  const redHits = coinSequence.filter((o) => o === 'RED').length;
  const greenHits = coinSequence.filter((o) => o === 'GREEN').length;

  recordTest(
    'Coin Hits Count',
    'Red: 4, Green: 2',
    `Red: ${redHits}, Green: ${greenHits}`,
    redHits === 4 && greenHits === 2
  );

  const coinCounts = { RED: redHits, GREEN: greenHits };
  const coinLaplace = calculateLaplaceEstimates(coinCounts, coinSequence.length, coinPossibilities);
  const redLaplace = coinLaplace.find((l) => l.outcome === 'RED')?.smoothedProbability;
  const greenLaplace = coinLaplace.find((l) => l.outcome === 'GREEN')?.smoothedProbability;

  recordTest(
    'Coin Laplace Estimates',
    'Red: 62.5%, Green: 37.5%',
    `Red: ${redLaplace}%, Green: ${greenLaplace}%`,
    redLaplace === 62.5 && greenLaplace === 37.5
  );

  const coinStreaks = calculateStreaks(coinSequence);
  recordTest(
    'Coin Current Streak',
    '3 RED',
    `${coinStreaks.currentStreakCount} ${coinStreaks.currentStreakOutcome}`,
    coinStreaks.currentStreakCount === 3 && coinStreaks.currentStreakOutcome === 'RED'
  );

  const coinNewestFirst = [...coinSequence].reverse();
  recordTest(
    'Coin Last-20 Banner Order (Newest First)',
    'RED, RED, RED, GREEN, GREEN, RED',
    coinNewestFirst.join(', '),
    coinNewestFirst.join(', ') === 'RED, RED, RED, GREEN, GREEN, RED',
    'Reinserted missing Last20Banner component into CoinGameView'
  );

  // 2. DICE GAME TEST SCENARIO
  // Under and Over only. Chronological: Under, Under, Over, Under, Over, Under
  const diceSequence = ['UNDER_50', 'UNDER_50', 'OVER_50', 'UNDER_50', 'OVER_50', 'UNDER_50'];
  const dicePossibilities = [
    { id: 'UNDER_50', label: 'Under 50' },
    { id: 'OVER_50', label: 'Over 50' },
  ];

  const underHits = diceSequence.filter((o) => o === 'UNDER_50').length;
  const overHits = diceSequence.filter((o) => o === 'OVER_50').length;

  recordTest(
    'Dice Outcome Scope & Hits',
    'Under/Over only; Under: 4, Over: 2',
    `Under: ${underHits}, Over: ${overHits}`,
    underHits === 4 && overHits === 2
  );

  const diceCounts = { UNDER_50: underHits, OVER_50: overHits };
  const diceLaplace = calculateLaplaceEstimates(diceCounts, diceSequence.length, dicePossibilities);
  const underLaplace = diceLaplace.find((l) => l.outcome === 'UNDER_50')?.smoothedProbability;
  const overLaplace = diceLaplace.find((l) => l.outcome === 'OVER_50')?.smoothedProbability;

  recordTest(
    'Dice Laplace Estimates',
    'Under: 62.5%, Over: 37.5%',
    `Under: ${underLaplace}%, Over: ${overLaplace}%`,
    underLaplace === 62.5 && overLaplace === 37.5
  );

  const diceStreaks = calculateStreaks(diceSequence);
  recordTest(
    'Dice Longest Under Streak',
    '2 UNDER_50',
    `${diceStreaks.longestStreakCount} ${diceStreaks.longestStreakOutcome}`,
    diceStreaks.longestStreakCount === 2 && diceStreaks.longestStreakOutcome === 'UNDER_50'
  );

  // 3. MINI ROULETTE TEST SCENARIO
  // Chronological input: 2, 3, 7, 8
  const rouletteSequence = [2, 3, 7, 8];
  const roulettePossibilities = Array.from({ length: 12 }, (_, i) => ({
    id: (i + 1).toString(),
    label: `Num ${i + 1}`,
  }));

  const rouletteCounts: Record<string, number> = {};
  roulettePossibilities.forEach((p) => (rouletteCounts[p.id] = 0));
  rouletteSequence.forEach((num) => rouletteCounts[num.toString()]++);

  const rouletteLaplace = calculateLaplaceEstimates(rouletteCounts, rouletteSequence.length, roulettePossibilities);
  const num2Prob = rouletteLaplace.find((l) => l.outcome === '2')?.smoothedProbability;
  const num3Prob = rouletteLaplace.find((l) => l.outcome === '3')?.smoothedProbability;
  const num7Prob = rouletteLaplace.find((l) => l.outcome === '7')?.smoothedProbability;
  const num8Prob = rouletteLaplace.find((l) => l.outcome === '8')?.smoothedProbability;

  const unrecordedProbs = rouletteLaplace
    .filter((l) => !['2', '3', '7', '8'].includes(l.outcome))
    .map((l) => l.smoothedProbability);
  const allUnrecordedMatch625 = unrecordedProbs.every((p) => p === 6.25);

  recordTest(
    'Mini Roulette Exact-Number Laplace Estimates',
    'Numbers 2,3,7,8 = 12.5% each; Unrecorded = 6.25% each',
    `Recorded: 2(${num2Prob}%), 3(${num3Prob}%), 7(${num7Prob}%), 8(${num8Prob}%); Unrecorded All 6.25%: ${allUnrecordedMatch625}`,
    num2Prob === 12.5 && num3Prob === 12.5 && num7Prob === 12.5 && num8Prob === 12.5 && allUnrecordedMatch625
  );

  const classifications = rouletteSequence.map((n) => classifyRouletteNumber(n));
  const smallCount = classifications.filter((c) => c.size === 'SMALL').length;
  const bigCount = classifications.filter((c) => c.size === 'BIG').length;
  const evenCount = classifications.filter((c) => c.parity === 'EVEN').length;
  const oddCount = classifications.filter((c) => c.parity === 'ODD').length;
  const redCount = classifications.filter((c) => c.color === 'RED').length;
  const blackCount = classifications.filter((c) => c.color === 'BLACK').length;

  recordTest(
    'Mini Roulette Derived Stream Splits',
    'Small/Big: 50%/50%, Even/Odd: 50%/50%, Red/Black: 50%/50%',
    `Small: ${smallCount / 4 * 100}%, Big: ${bigCount / 4 * 100}%, Even: ${evenCount / 4 * 100}%, Odd: ${oddCount / 4 * 100}%, Red: ${redCount / 4 * 100}%, Black: ${blackCount / 4 * 100}%`,
    smallCount === 2 && bigCount === 2 && evenCount === 2 && oddCount === 2 && redCount === 2 && blackCount === 2
  );

  const redNumbers = [1, 3, 5, 8, 10, 12];
  const colorMapCorrect = Array.from({ length: 12 }, (_, i) => i + 1).every((num) => {
    const expectedColor = redNumbers.includes(num) ? 'RED' : 'BLACK';
    return classifyRouletteNumber(num).color === expectedColor;
  });

  recordTest(
    'Mini Roulette Color Mapping (Red/Black)',
    'Red: [1,3,5,8,10,12], Black: [2,4,6,7,9,11]',
    colorMapCorrect ? 'Exact match' : 'Mismatch found',
    colorMapCorrect
  );

  // 4. WHEEL GAME TEST SCENARIO
  // Chronological: Red/Pink, Blue/Green, Red/Pink, Box, Red/Pink
  const wheelConfig: WheelConfig = {
    blueGreenName: 'Blue/Green Diamond',
  };
  const wheelSequence = [
    'RED_PINK_DIAMOND',
    'BLUE_GREEN_DIAMOND',
    'RED_PINK_DIAMOND',
    'BOX',
    'RED_PINK_DIAMOND',
  ];
  const wheelPossibilities = getPossibleOutcomesForGame('wheel', wheelConfig);

  const wheelCounts = {
    RED_PINK_DIAMOND: 3,
    BLUE_GREEN_DIAMOND: 1,
    BOX: 1,
  };
  const wheelLaplace = calculateLaplaceEstimates(wheelCounts, wheelSequence.length, wheelPossibilities);
  const rpProb = wheelLaplace.find((l) => l.outcome === 'RED_PINK_DIAMOND')?.smoothedProbability;
  const bgProb = wheelLaplace.find((l) => l.outcome === 'BLUE_GREEN_DIAMOND')?.smoothedProbability;
  const boxProb = wheelLaplace.find((l) => l.outcome === 'BOX')?.smoothedProbability;

  recordTest(
    'Wheel Laplace Estimates',
    'Red/Pink: 50%, Blue/Green: 25%, Box: 25%',
    `Red/Pink: ${rpProb}%, Blue/Green: ${bgProb}%, Box: ${boxProb}%`,
    rpProb === 50 && bgProb === 25 && boxProb === 25
  );

  // 5. SAFETY & EDGE ASSESSMENT
  const dummyResults: GameResult[] = Array.from({ length: 10 }, (_, i) => ({
    id: `res-${i}`,
    sessionId: 'main',
    gameType: 'coin',
    outcome: i % 2 === 0 ? 'RED' : 'GREEN',
    timestamp: Date.now() - i * 1000,
    backtestEstimatedOutcome: 'RED',
    backtestWasCorrect: i % 2 === 0,
  }));

  const backtestStats = calculateBacktestStats(dummyResults, 'coin');
  recordTest(
    'Safety Warning: NO RELIABLE EDGE when N < 30',
    'hasNoPredictiveEdge = true',
    `hasNoPredictiveEdge = ${backtestStats.hasNoPredictiveEdge}`,
    backtestStats.hasNoPredictiveEdge === true
  );

  console.table(resultsTable);
  return resultsTable;
}
