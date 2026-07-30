export type GameType = 'coin' | 'roulette' | 'wheel' | 'dice';

export type CoinOutcome = 'RED' | 'GREEN';

export type RouletteNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface RouletteClassifications {
  size: 'SMALL' | 'BIG' | 'LARGE'; // Small: 1-6, Big: 7-12
  parity: 'EVEN' | 'ODD';  // Even: 2,4,6,8,10,12, Odd: 1,3,5,7,9,11
  color: 'RED' | 'BLACK';  // Red: 1,3,5,8,10,12, Black: 2,4,6,7,9,11
}

export type WheelOutcome = 'RED_PINK_DIAMOND' | 'BLUE_GREEN_DIAMOND' | 'BOX';

export type DiceOutcome = 'UNDER_50' | 'OVER_50';

export interface GameResult {
  id: string;
  gameType: GameType;
  outcome: string; // 'RED', 'GREEN', '1', 'RED_PINK_DIAMOND', 'UNDER_50', etc.
  numericValue?: number; // e.g., 1-12 for roulette, 0-100 for dice
  timestamp: number; // Date.now()
  sessionId: string;
  // Backtesting fields captured BEFORE this result was entered:
  backtestEstimatedOutcome?: string; // The outcome predicted as highest tendency prior to this entry
  backtestWasCorrect?: boolean;     // Whether actual outcome matched backtestEstimatedOutcome
  isDemo?: boolean;                  // Flag to identify demo records clearly
}

export interface GameSession {
  id: string;
  name: string;
  createdAt: number;
}

export interface WheelConfig {
  blueGreenName: string; // default: "Blue/Green Diamond"
  redSegments?: number;
  blueSegments?: number;
  boxSegments?: number;
}

export interface PayoutMultipliers {
  coin: {
    RED: number;
    GREEN: number;
  };
  dice: {
    UNDER_50: number;
    OVER_50: number;
  };
  wheel: {
    RED_PINK_DIAMOND: number;
    BLUE_GREEN_DIAMOND: number;
    BOX: number;
  };
  roulette: {
    number: number;
    color: number;
    size: number;
    parity: number;
  };
}

export interface DiceConfig {}

export interface TransitionStats {
  previousOutcome: string;
  nextOutcomeCounts: Record<string, number>;
  nextOutcomePercentages: Record<string, number>;
}

export interface BacktestStats {
  totalEvaluated: number;
  correctCount: number;
  hitRate: number; // e.g., 52.5%
  randomBaseline: number; // e.g., 50.0% for 2 choices, 33.3% for 3, 8.33% for 12
  differenceFromBaseline: number; // hitRate - randomBaseline
  hasNoPredictiveEdge: boolean;
}

export interface LaplaceEstimate {
  outcome: string;
  label: string;
  count: number;
  smoothedProbability: number; // percentage 0-100
}

export interface CategoryStreak {
  categoryName: string;
  currentStreakOutcome: string;
  currentStreakCount: number;
  longestStreakOutcome: string;
  longestStreakCount: number;
}
