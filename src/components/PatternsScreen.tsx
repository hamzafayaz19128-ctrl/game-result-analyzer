import React, { useState } from 'react';
import { GameResult, GameType, WheelConfig } from '../types/game';
import {
  calculateStreaks,
  calculateTransitions,
  classifyRouletteNumber,
  getPossibleOutcomesForGame,
} from '../utils/statsEngine';
import { Last20Banner } from './Last20Banner';
import {
  GitCommit,
  Coins,
  Disc,
  CircleDot,
  Dices,
  Layers,
  Activity,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Repeat,
  RotateCcw,
} from 'lucide-react';

interface PatternsScreenProps {
  results: GameResult[];
  activeSessionId: string;
  wheelConfig: WheelConfig;
}

export const PatternsScreen: React.FC<PatternsScreenProps> = ({
  results,
  activeSessionId,
  wheelConfig,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('coin');
  const [rouletteStream, setRouletteStream] = useState<'number' | 'size' | 'parity' | 'color'>('size');

  // Filter for session
  const sessionResults = results.filter((r) => {
    if (r.gameType !== selectedGame) return false;
    if (activeSessionId) {
      return r.sessionId === activeSessionId || (!r.sessionId && activeSessionId === 'default_session_1');
    }
    return true;
  });

  const chronological = [...sessionResults].sort((a, b) => a.timestamp - b.timestamp);
  const total = sessionResults.length;

  // Derive outcomes list based on game type
  let outcomes: string[] = [];
  let possibleOutcomes = getPossibleOutcomesForGame(selectedGame, wheelConfig);

  if (selectedGame === 'roulette') {
    if (rouletteStream === 'number') {
      outcomes = chronological.map((r) => r.outcome);
      possibleOutcomes = Array.from({ length: 12 }, (_, i) => ({
        id: (i + 1).toString(),
        label: `Num ${i + 1}`,
      }));
    } else if (rouletteStream === 'size') {
      outcomes = chronological.map((r) => classifyRouletteNumber(parseInt(r.outcome, 10)).size);
      possibleOutcomes = [
        { id: 'SMALL', label: 'Small (1–6)' },
        { id: 'BIG', label: 'Big (7–12)' },
      ];
    } else if (rouletteStream === 'parity') {
      outcomes = chronological.map((r) => classifyRouletteNumber(parseInt(r.outcome, 10)).parity);
      possibleOutcomes = [
        { id: 'EVEN', label: 'Even' },
        { id: 'ODD', label: 'Odd' },
      ];
    } else if (rouletteStream === 'color') {
      outcomes = chronological.map((r) => classifyRouletteNumber(parseInt(r.outcome, 10)).color);
      possibleOutcomes = [
        { id: 'RED', label: 'Red' },
        { id: 'BLACK', label: 'Black' },
      ];
    }
  } else {
    outcomes = chronological.map((r) => r.outcome);
  }

  // Calculate Streaks & Transitions
  const streaks = calculateStreaks(outcomes);
  const transitions = calculateTransitions(outcomes, possibleOutcomes);

  // Alternating sequence analysis (e.g. ABAB pattern length)
  let currentAlternatingCount = 0;
  let maxAlternatingCount = 0;
  if (outcomes.length > 1) {
    let count = 1;
    for (let i = 1; i < outcomes.length; i++) {
      if (outcomes[i] !== outcomes[i - 1]) {
        count++;
      } else {
        if (count > maxAlternatingCount) maxAlternatingCount = count;
        count = 1;
      }
    }
    currentAlternatingCount = count;
    if (count > maxAlternatingCount) maxAlternatingCount = count;
  }

  return (
    <div className="space-y-5 text-slate-100 p-4 max-w-4xl mx-auto pb-12">
      {/* Title & Game Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <GitCommit className="w-6 h-6 text-indigo-400" />
              <span>Pattern & Transition Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze outcome streaks, transition probabilities, and sequence alternations.
            </p>
          </div>
          <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 px-3 py-1 rounded-xl text-xs font-mono font-bold">
            Records: {total}
          </span>
        </div>

        {/* Game Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          <button
            onClick={() => setSelectedGame('coin')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              selectedGame === 'coin'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>Coin</span>
          </button>
          <button
            onClick={() => setSelectedGame('roulette')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              selectedGame === 'roulette'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4 shrink-0" />
            <span>Roulette</span>
          </button>
          <button
            onClick={() => setSelectedGame('wheel')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              selectedGame === 'wheel'
                ? 'bg-pink-600 text-white shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CircleDot className="w-4 h-4 shrink-0" />
            <span>Wheel</span>
          </button>
          <button
            onClick={() => setSelectedGame('dice')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              selectedGame === 'dice'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4 shrink-0" />
            <span>Dice</span>
          </button>
        </div>

        {/* Roulette Stream Sub-selector if Roulette selected */}
        {selectedGame === 'roulette' && (
          <div className="grid grid-cols-4 gap-1 mt-2.5 pt-2 border-t border-slate-800">
            <button
              onClick={() => setRouletteStream('number')}
              className={`py-1.5 text-[11px] rounded-lg font-bold transition-all ${
                rouletteStream === 'number'
                  ? 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                  : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              1–12 Numbers
            </button>
            <button
              onClick={() => setRouletteStream('size')}
              className={`py-1.5 text-[11px] rounded-lg font-bold transition-all ${
                rouletteStream === 'size'
                  ? 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                  : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              Small / Big
            </button>
            <button
              onClick={() => setRouletteStream('parity')}
              className={`py-1.5 text-[11px] rounded-lg font-bold transition-all ${
                rouletteStream === 'parity'
                  ? 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                  : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              Even / Odd
            </button>
            <button
              onClick={() => setRouletteStream('color')}
              className={`py-1.5 text-[11px] rounded-lg font-bold transition-all ${
                rouletteStream === 'color'
                  ? 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                  : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              Red / Black
            </button>
          </div>
        )}
      </div>

      {/* Mandatory Notice */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-tight font-mono">
          Patterns and streak history show empirical trends, not predictable future outcomes.
        </p>
      </div>

      {/* Live Last 20 Banner */}
      <Last20Banner
        gameType={selectedGame}
        results={results}
        activeSessionId={activeSessionId}
        rouletteStream={selectedGame === 'roulette' ? rouletteStream : undefined}
      />

      {/* Streak Summary & Alternating Sequence */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            Current Streak
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {streaks.currentStreakCount}x {streaks.currentStreakOutcome}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Consecutive identical outcomes
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            Longest Streak
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {streaks.longestStreakCount}x {streaks.longestStreakOutcome}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Historical peak consecutive run
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Repeat className="w-3.5 h-3.5 text-indigo-400" />
            <span>Alternating Sequence</span>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {currentAlternatingCount}x <span className="text-xs font-normal text-slate-400">(Max: {maxAlternatingCount}x)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Consecutive alternating switches (A→B→A)
          </div>
        </div>
      </div>

      {/* Transition Matrices */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-indigo-400" />
          <span>Next Outcome Transition Matrix</span>
        </h3>
        <p className="text-xs text-slate-400">
          Historical probability of what immediately followed each outcome in recorded history.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {transitions.map((trans) => {
            const nextCounts = trans.nextOutcomeCounts;
            const totalNext = Object.values(nextCounts).reduce((a, b) => a + b, 0);

            return (
              <div key={trans.previousOutcome} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-700 font-bold text-xs">
                  <span className="text-indigo-300">After: {trans.previousOutcome}</span>
                  <span className="text-[10px] font-mono text-slate-400">{totalNext} transitions</span>
                </div>

                {totalNext === 0 ? (
                  <p className="text-xs text-slate-500 italic">No historical transitions recorded yet.</p>
                ) : (
                  <div className="space-y-1.5 font-mono text-xs pt-1">
                    {Object.entries(nextCounts)
                      .filter(([, count]) => count > 0)
                      .map(([nextOutcome, count]) => {
                        const pct = (count / totalNext) * 100;
                        return (
                          <div key={nextOutcome} className="flex justify-between items-center">
                            <span className="text-slate-300">→ Followed by {nextOutcome}:</span>
                            <span className="font-bold text-emerald-400">
                              {count}x ({pct.toFixed(1)}%)
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
