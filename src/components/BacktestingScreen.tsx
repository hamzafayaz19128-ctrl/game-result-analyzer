import React, { useState } from 'react';
import { GameResult, GameType } from '../types/game';
import { calculateBacktestStats } from '../utils/statsEngine';
import { BarChart3, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface BacktestingScreenProps {
  results: GameResult[];
}

export const BacktestingScreen: React.FC<BacktestingScreenProps> = ({
  results,
}) => {
  const [selectedGameFilter, setSelectedGameFilter] = useState<GameType | 'all'>('all');

  const filteredResults =
    selectedGameFilter === 'all'
      ? results
      : results.filter((r) => r.gameType === selectedGameFilter);

  // Group by game type or overall
  const coinStats = calculateBacktestStats(
    results.filter((r) => r.gameType === 'coin'),
    'coin'
  );
  const rouletteStats = calculateBacktestStats(
    results.filter((r) => r.gameType === 'roulette'),
    'roulette'
  );
  const wheelStats = calculateBacktestStats(
    results.filter((r) => r.gameType === 'wheel'),
    'wheel'
  );
  const diceStats = calculateBacktestStats(
    results.filter((r) => r.gameType === 'dice'),
    'dice'
  );

  const activeStats = calculateBacktestStats(
    filteredResults,
    selectedGameFilter === 'all' ? 'coin' : selectedGameFilter
  );

  const evaluatedItems = filteredResults.filter(
    (r) => r.backtestEstimatedOutcome && r.backtestWasCorrect !== undefined
  );

  return (
    <div className="space-y-6 text-slate-100 p-4 max-w-4xl mx-auto">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Backtesting & Hit Rate Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates past Laplace-smoothed predictions against actual recorded outcomes.
          </p>
        </div>

        {/* Filter dropdown */}
        <select
          value={selectedGameFilter}
          onChange={(e) => setSelectedGameFilter(e.target.value as GameType | 'all')}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
        >
          <option value="all">All Games Combined</option>
          <option value="coin">Coin</option>
          <option value="roulette">Mini Roulette</option>
          <option value="wheel">Wheel</option>
          <option value="dice">Dice</option>
        </select>
      </div>

      {/* WARNING BANNER IF NO PREDICTIVE EDGE DETECTED */}
      {activeStats.hasNoPredictiveEdge && (
        <div className="bg-amber-950/60 border border-amber-600/60 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-amber-300">
              No predictive edge detected. Past results may not predict future outcomes.
            </h3>
            <p className="text-xs text-amber-200/80 mt-1">
              Hit rate is at or below the random chance baseline. Each trial remains strictly independent.
            </p>
          </div>
        </div>
      )}

      {/* OVERALL HIT RATE SCORECARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-xs text-slate-400">Total Backtested</span>
          <div className="text-2xl font-black text-white mt-1">
            {activeStats.totalEvaluated}
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-4 text-center">
          <span className="text-xs text-emerald-400">Correct Outcomes</span>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {activeStats.correctCount}
          </div>
        </div>

        <div className="bg-slate-900 border border-indigo-900/40 rounded-2xl p-4 text-center">
          <span className="text-xs text-indigo-300">Historical Hit Rate</span>
          <div className="text-2xl font-black text-indigo-200 mt-1">
            {activeStats.hitRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-xs text-slate-400">Random Baseline</span>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {activeStats.randomBaseline.toFixed(1)}%
          </div>
          <span className={`text-[10px] font-bold ${activeStats.differenceFromBaseline > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
            Diff: {activeStats.differenceFromBaseline > 0 ? '+' : ''}{activeStats.differenceFromBaseline.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* GAME SUMMARY BREAKDOWN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-slate-200 mb-3">
          Backtesting Performance Across All Games
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Coin */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <span className="font-bold text-slate-200 block mb-1">Coin (50% Baseline)</span>
            <div className="text-lg font-black text-indigo-300">{coinStats.hitRate.toFixed(1)}%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {coinStats.correctCount}/{coinStats.totalEvaluated} correct
            </div>
          </div>

          {/* Roulette */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <span className="font-bold text-slate-200 block mb-1">Roulette (8.33% Baseline)</span>
            <div className="text-lg font-black text-indigo-300">{rouletteStats.hitRate.toFixed(1)}%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {rouletteStats.correctCount}/{rouletteStats.totalEvaluated} correct
            </div>
          </div>

          {/* Wheel */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <span className="font-bold text-slate-200 block mb-1">Wheel (33.3% Baseline)</span>
            <div className="text-lg font-black text-indigo-300">{wheelStats.hitRate.toFixed(1)}%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {wheelStats.correctCount}/{wheelStats.totalEvaluated} correct
            </div>
          </div>

          {/* Dice */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <span className="font-bold text-slate-200 block mb-1">Dice (50% Baseline)</span>
            <div className="text-lg font-black text-indigo-300">{diceStats.hitRate.toFixed(1)}%</div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {diceStats.correctCount}/{diceStats.totalEvaluated} correct
            </div>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL BACKTEST LOG */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-slate-200 mb-3">
          Individual Backtest Log (Newest First)
        </h3>

        {evaluatedItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-6">
            No backtested predictions recorded yet. Add more results in any game tab.
          </p>
        ) : (
          <div className="space-y-2">
            {evaluatedItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  {item.backtestWasCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-slate-200 uppercase tracking-tight">
                      [{item.gameType}] Actual: {item.outcome}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Estimated Tendency Prior: {item.backtestEstimatedOutcome}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.backtestWasCorrect
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-rose-950 text-rose-300 border border-rose-700'
                    }`}
                  >
                    {item.backtestWasCorrect ? 'HIT (Correct)' : 'MISS (Incorrect)'}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
