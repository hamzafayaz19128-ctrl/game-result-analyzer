import { GameResult, GameSession, WheelConfig, DiceConfig, GameType, PayoutMultipliers } from '../types/game';
import { classifyDiceValue, calculateLaplaceEstimates, getPossibleOutcomesForGame } from './statsEngine';

const STORAGE_KEYS = {
  RESULTS: 'gra_results_v1',
  SESSIONS: 'gra_sessions_v1',
  ACTIVE_SESSION: 'gra_active_session_v1',
  WHEEL_CONFIG: 'gra_wheel_config_v1',
  DICE_CONFIG: 'gra_dice_config_v1',
  PAYOUT_MULTIPLIERS: 'gra_payout_multipliers_v1',
  SETTINGS: 'gra_settings_v1',
};

export const DEFAULT_PAYOUT_MULTIPLIERS: PayoutMultipliers = {
  coin: { RED: 2.0, GREEN: 2.0 },
  dice: { UNDER_50: 2.0, OVER_50: 2.0 },
  wheel: { RED_PINK_DIAMOND: 3.0, BLUE_GREEN_DIAMOND: 3.0, BOX: 3.0 },
  roulette: { number: 12.0, color: 2.0, size: 2.0, parity: 2.0 },
};

export function getPayoutMultipliers(): PayoutMultipliers {
  const data = localStorage.getItem(STORAGE_KEYS.PAYOUT_MULTIPLIERS);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return {
        coin: { ...DEFAULT_PAYOUT_MULTIPLIERS.coin, ...parsed.coin },
        dice: { ...DEFAULT_PAYOUT_MULTIPLIERS.dice, ...parsed.dice },
        wheel: { ...DEFAULT_PAYOUT_MULTIPLIERS.wheel, ...parsed.wheel },
        roulette: { ...DEFAULT_PAYOUT_MULTIPLIERS.roulette, ...parsed.roulette },
      };
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_PAYOUT_MULTIPLIERS;
}

export function savePayoutMultipliers(multipliers: PayoutMultipliers): void {
  localStorage.setItem(STORAGE_KEYS.PAYOUT_MULTIPLIERS, JSON.stringify(multipliers));
}

// Initial default sessions
export function getStoredSessions(): GameSession[] {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse sessions', e);
    }
  }
  const defaultSession: GameSession = {
    id: 'default_session_1',
    name: 'Main Session',
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([defaultSession]));
  return [defaultSession];
}

export function getActiveSessionId(): string {
  const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  if (active) return active;
  const sessions = getStoredSessions();
  const firstId = sessions[0]?.id || 'default_session_1';
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, firstId);
  return firstId;
}

export function setActiveSessionId(sessionId: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sessionId);
}

export function createNewSession(name: string): GameSession {
  const sessions = getStoredSessions();
  const newSession: GameSession = {
    id: `session_${Date.now()}`,
    name: name.trim() || `Session #${sessions.length + 1}`,
    createdAt: Date.now(),
  };
  const updated = [newSession, ...sessions];
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
  setActiveSessionId(newSession.id);
  return newSession;
}

// Configs
export function getWheelConfig(): WheelConfig {
  const data = localStorage.getItem(STORAGE_KEYS.WHEEL_CONFIG);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return {
    blueGreenName: 'Blue/Green Diamond',
  };
}

export function saveWheelConfig(config: WheelConfig): void {
  localStorage.setItem(STORAGE_KEYS.WHEEL_CONFIG, JSON.stringify(config));
}

export function getDiceConfig(): DiceConfig {
  const data = localStorage.getItem(STORAGE_KEYS.DICE_CONFIG);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return {
    exact50Rule: 'push',
  };
}

export function saveDiceConfig(config: DiceConfig): void {
  localStorage.setItem(STORAGE_KEYS.DICE_CONFIG, JSON.stringify(config));
}

// Results Storage
export function getStoredResults(): GameResult[] {
  const data = localStorage.getItem(STORAGE_KEYS.RESULTS);
  if (data) {
    try {
      const parsed: GameResult[] = JSON.parse(data);
      // Clean legacy Exactly 50 / Push records from Dice
      const cleaned = parsed.filter((r) => {
        if (r.gameType === 'dice') {
          const o = (r.outcome || '').toLowerCase();
          if (
            r.outcome === 'EXACTLY_50_PUSH' ||
            o.includes('push') ||
            o.includes('exactly') ||
            o.includes('equal')
          ) {
            return false;
          }
        }
        return true;
      });
      if (cleaned.length !== parsed.length) {
        saveResults(cleaned);
      }
      return cleaned;
    } catch (e) {
      console.error('Failed to parse results', e);
    }
  }
  return [];
}

export function saveResults(results: GameResult[]): void {
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
}

// Get highest historical tendency prior to inserting a new result
export function getHighestHistoricalTendency(
  gameType: GameType,
  allResults: GameResult[],
  wheelConfig: WheelConfig,
  diceConfig: DiceConfig
): string | undefined {
  const filtered = allResults.filter((r) => r.gameType === gameType);
  if (filtered.length < 5) return undefined; // Need at least 5 previous records to have a meaningful tendency estimate

  const possible = getPossibleOutcomesForGame(gameType, wheelConfig);
  const counts: Record<string, number> = {};
  possible.forEach((p) => (counts[p.id] = 0));

  filtered.forEach((r) => {
    if (counts[r.outcome] !== undefined) counts[r.outcome]++;
  });

  const laplace = calculateLaplaceEstimates(counts, filtered.length, possible);
  if (laplace.length === 0) return undefined;

  laplace.sort((a, b) => b.smoothedProbability - a.smoothedProbability);
  return laplace[0].outcome;
}

// Add a new result with automatic backtesting calculation
export function addResult(
  gameType: GameType,
  outcome: string,
  numericValue?: number
): GameResult {
  const allResults = getStoredResults();
  const activeSessionId = getActiveSessionId();
  const wheelConfig = getWheelConfig();
  const diceConfig = getDiceConfig();

  // Handle dice value auto-classification if numeric value supplied
  let finalOutcome = outcome;
  if (gameType === 'dice' && numericValue !== undefined) {
    finalOutcome = classifyDiceValue(numericValue);
  }

  // Determine backtest prediction BEFORE saving this entry
  const highestTendencyBefore = getHighestHistoricalTendency(
    gameType,
    allResults,
    wheelConfig,
    diceConfig
  );

  let backtestWasCorrect: boolean | undefined = undefined;
  if (highestTendencyBefore) {
    backtestWasCorrect = highestTendencyBefore === finalOutcome;
  }

  const newRecord: GameResult = {
    id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    gameType,
    outcome: finalOutcome,
    numericValue,
    timestamp: Date.now(),
    sessionId: activeSessionId,
    backtestEstimatedOutcome: highestTendencyBefore,
    backtestWasCorrect,
  };

  const updated = [newRecord, ...allResults];
  saveResults(updated);
  return newRecord;
}

// Undo last result
export function undoLastResult(): GameResult | null {
  const allResults = getStoredResults();
  if (allResults.length === 0) return null;
  const removed = allResults[0];
  const updated = allResults.slice(1);
  saveResults(updated);
  return removed;
}

// Delete specific result
export function deleteResult(id: string): void {
  const allResults = getStoredResults();
  const updated = allResults.filter((r) => r.id !== id);
  saveResults(updated);
}

// Edit specific result
export function editResult(id: string, newOutcome: string, numericValue?: number): void {
  const allResults = getStoredResults();
  const updated = allResults.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        outcome: newOutcome,
        numericValue,
      };
    }
    return r;
  });
  saveResults(updated);
}

// Reset all data
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

// Clear data for a specific game type only
export function clearGameData(gameType: GameType): void {
  const current = getStoredResults();
  const updated = current.filter((r) => r.gameType !== gameType);
  saveResults(updated);
}

// Clear all results only (retaining session configs if desired)
export function clearAllResults(): void {
  saveResults([]);
}

// Remove only demo records (isDemo === true)
export function removeDemoData(): void {
  const current = getStoredResults();
  const updated = current.filter((r) => !r.isDemo);
  saveResults(updated);
}

// Check if demo data exists
export function hasDemoData(): boolean {
  const current = getStoredResults();
  return current.some((r) => r.isDemo === true);
}

// Seed / Load sample demo data for testing statistical features (35 records per game)
export function seedSampleData(): void {
  const currentResults = getStoredResults();
  // Filter out previous demo data if any, so we don't multiply demo data endlessly
  const userResultsOnly = currentResults.filter((r) => !r.isDemo);

  const activeSessionId = getActiveSessionId();
  const now = Date.now();
  const sampleResults: GameResult[] = [];

  // Coin samples (20 Red, 15 Green)
  const coinOutcomes = [
    'RED', 'RED', 'GREEN', 'RED', 'RED', 'RED', 'GREEN', 'GREEN', 'RED', 'GREEN',
    'RED', 'RED', 'GREEN', 'RED', 'GREEN', 'RED', 'RED', 'RED', 'GREEN', 'GREEN',
    'RED', 'GREEN', 'RED', 'RED', 'GREEN', 'RED', 'RED', 'GREEN', 'GREEN', 'RED',
    'GREEN', 'RED', 'RED', 'GREEN', 'RED'
  ];
  coinOutcomes.forEach((o, i) => {
    sampleResults.push({
      id: `demo_coin_${now}_${i}`,
      gameType: 'coin',
      outcome: o,
      timestamp: now - (35 - i) * 120000,
      sessionId: activeSessionId,
      backtestEstimatedOutcome: i > 5 ? (i % 2 === 0 ? 'RED' : 'GREEN') : undefined,
      backtestWasCorrect: i > 5 ? (o === (i % 2 === 0 ? 'RED' : 'GREEN')) : undefined,
      isDemo: true,
    });
  });

  // Roulette samples (1 to 12)
  const rouletteNums = [
    3, 8, 1, 12, 5, 2, 9, 7, 10, 4, 11, 6,
    1, 3, 8, 10, 12, 5, 2, 7, 9, 4, 11, 6,
    3, 8, 1, 12, 5, 10, 2, 7, 9, 4, 12
  ];
  rouletteNums.forEach((num, i) => {
    sampleResults.push({
      id: `demo_roulette_${now}_${i}`,
      gameType: 'roulette',
      outcome: num.toString(),
      numericValue: num,
      timestamp: now - (35 - i) * 110000,
      sessionId: activeSessionId,
      isDemo: true,
    });
  });

  // Wheel samples
  const wheelOutcomes = [
    'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND', 'BOX',
    'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND', 'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND',
    'RED_PINK_DIAMOND', 'BOX', 'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND',
    'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND', 'RED_PINK_DIAMOND', 'BOX',
    'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND',
    'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND', 'BOX', 'RED_PINK_DIAMOND',
    'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND', 'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND',
    'BOX', 'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND', 'RED_PINK_DIAMOND',
    'RED_PINK_DIAMOND', 'BLUE_GREEN_DIAMOND', 'BOX'
  ];
  wheelOutcomes.forEach((o, i) => {
    sampleResults.push({
      id: `demo_wheel_${now}_${i}`,
      gameType: 'wheel',
      outcome: o,
      timestamp: now - (35 - i) * 105000,
      sessionId: activeSessionId,
      isDemo: true,
    });
  });

  // Dice samples
  const diceVals = [
    25, 78, 12, 88, 42, 65, 33, 91, 18, 72,
    45, 82, 30, 60, 15, 95, 40, 55, 22, 80,
    48, 62, 10, 85, 38, 70, 28, 90, 44, 76,
    32, 19, 81, 27, 84
  ];
  diceVals.forEach((val, i) => {
    sampleResults.push({
      id: `demo_dice_${now}_${i}`,
      gameType: 'dice',
      outcome: val < 50 ? 'UNDER_50' : 'OVER_50',
      numericValue: val,
      timestamp: now - (35 - i) * 100000,
      sessionId: activeSessionId,
      isDemo: true,
    });
  });

  const combined = [...sampleResults, ...userResultsOnly].sort((a, b) => b.timestamp - a.timestamp);
  saveResults(combined);
}

// CSV Export
export function exportResultsAsCSV(results: GameResult[]): void {
  const headers = ['ID', 'Game Type', 'Outcome', 'Numeric Value', 'Timestamp', 'Formatted Date', 'Session ID'];
  const rows = results.map((r) => [
    r.id,
    r.gameType,
    r.outcome,
    r.numericValue !== undefined ? r.numericValue : '',
    r.timestamp,
    new Date(r.timestamp).toLocaleString(),
    r.sessionId,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `game_results_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// JSON Export
export function exportResultsAsJSON(results: GameResult[], sessions: GameSession[]): void {
  const exportObject = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sessions,
    results,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `game_results_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// JSON Import
export function importResultsFromJSON(
  fileContent: string
): { success: boolean; message: string; count?: number } {
  try {
    const data = JSON.parse(fileContent);
    if (!data.results || !Array.isArray(data.results)) {
      return { success: false, message: 'Invalid JSON format: missing results array.' };
    }

    const currentResults = getStoredResults();
    const existingIds = new Set(currentResults.map((r) => r.id));

    let importedCount = 0;
    const mergedResults = [...currentResults];

    data.results.forEach((r: any) => {
      if (r.id && r.gameType && r.outcome && r.timestamp) {
        // Skip legacy Dice outcomes
        if (r.gameType === 'dice') {
          const o = String(r.outcome || '').toLowerCase();
          if (
            r.outcome === 'EXACTLY_50_PUSH' ||
            o.includes('push') ||
            o.includes('exactly') ||
            o.includes('equal')
          ) {
            return;
          }
        }
        if (!existingIds.has(r.id)) {
          mergedResults.push({
            id: r.id,
            gameType: r.gameType,
            outcome: r.outcome,
            numericValue: r.numericValue,
            timestamp: r.timestamp,
            sessionId: r.sessionId || 'imported_session',
            backtestEstimatedOutcome: r.backtestEstimatedOutcome,
            backtestWasCorrect: r.backtestWasCorrect,
          });
          importedCount++;
        }
      }
    });

    mergedResults.sort((a, b) => b.timestamp - a.timestamp);
    saveResults(mergedResults);

    // Import sessions if present
    if (data.sessions && Array.isArray(data.sessions)) {
      const currentSessions = getStoredSessions();
      const currentSessionIds = new Set(currentSessions.map((s) => s.id));
      const mergedSessions = [...currentSessions];

      data.sessions.forEach((s: any) => {
        if (s.id && s.name && !currentSessionIds.has(s.id)) {
          mergedSessions.push(s);
        }
      });
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(mergedSessions));
    }

    return {
      success: true,
      message: `Successfully imported ${importedCount} results!`,
      count: importedCount,
    };
  } catch (err) {
    return { success: false, message: 'Error reading JSON file. Please check file formatting.' };
  }
}
