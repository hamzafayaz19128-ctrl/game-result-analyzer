import React, { useState } from 'react';
import { GameResult, GameType, WheelConfig, PayoutMultipliers } from '../types/game';
import {
  analyzeStreamOutcomes,
  OutcomeAnalysis,
  CandidateDecision,
  StreamBacktestSummary,
  getPossibleOutcomesForStream,
} from '../utils/chanceEngine';
import {
  Coins,
  Disc,
  CircleDot,
  Dices,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Sparkles,
  BarChart2,
  Lock,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ChanceCheckScreenProps {
  results: GameResult[];
  activeSessionId: string;
  wheelConfig: WheelConfig;
  multipliers: PayoutMultipliers;
}

export const ChanceCheckScreen: React.FC<ChanceCheckScreenProps> = ({
  results,
  activeSessionId,
  wheelConfig,
  multipliers,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('coin');
  const [rouletteStream, setRouletteStream] = useState<'number' | 'color' | 'size' | 'parity'>('color');

  // Filter results for current active session
  const sessionResults = results.filter((r) => {
    if (activeSessionId) {
      return (
        r.sessionId === activeSessionId ||
        (!r.sessionId && activeSessionId === 'default_session_1')
      );
    }
    return true;
  });

  // Calculate analysis
  const { analyses, candidateDecision, backtestSummary } = analyzeStreamOutcomes(
    sessionResults,
    selectedGame,
    wheelConfig,
    multipliers,
    rouletteStream
  );

  return (
    <div className="space-y-6 text-slate-100 p-4 max-w-4xl mx-auto pb-8">
      {/* Title Header */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span>Chance Check</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Advanced historical sequence analysis, transition patterns, and empirical probability checking.
            </p>
          </div>

          <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
            Session Records: {sessionResults.filter((r) => r.gameType === selectedGame).length}
          </span>
        </div>
      </div>

      {/* Mandatory Financial & Safety Warning */}
      <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl p-4 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>STATISTICAL & RESPONSIBLE USE WARNING</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed font-mono">
          “Past patterns may occur by chance. This analysis is not financial or betting advice.”
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-4 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setSelectedGame('coin')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selectedGame === 'coin'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Coins className="w-4 h-4 shrink-0" />
          <span>Coin</span>
        </button>

        <button
          onClick={() => setSelectedGame('roulette')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selectedGame === 'roulette'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Disc className="w-4 h-4 shrink-0" />
          <span>Roulette</span>
        </button>

        <button
          onClick={() => setSelectedGame('wheel')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selectedGame === 'wheel'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CircleDot className="w-4 h-4 shrink-0" />
          <span>Wheel</span>
        </button>

        <button
          onClick={() => setSelectedGame('dice')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            selectedGame === 'dice'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Dices className="w-4 h-4 shrink-0" />
          <span>Dice</span>
        </button>
      </div>

      {/* Roulette Category Stream Selector */}
      {selectedGame === 'roulette' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Roulette Stream Analysis Category:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'color', label: '🔴/⚫ Color (Red/Black)' },
              { id: 'size', label: '1–6 / 7–12 Small/Large' },
              { id: 'parity', label: 'Even / Odd' },
              { id: 'number', label: 'Single Numbers (1–12)' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setRouletteStream(st.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  rouletteStream === st.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NEXT-ROUND HISTORICAL CANDIDATE HIGHLIGHT CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Next-Round Historical Candidate Status</span>
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-mono">
            Empirical Evaluation
          </span>
        </div>

        <div className="pt-4">
          {candidateDecision.status === 'CANDIDATE' ? (
            <div className="bg-emerald-950/70 border border-emerald-600/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                    {candidateDecision.statusMessage}
                  </span>
                  <h4 className="text-xl font-black text-white">{candidateDecision.label}</h4>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-900/60 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-emerald-300 block mb-1">
                  Why this candidate was highlighted:
                </span>
                {candidateDecision.reasons.map((r, idx) => (
                  <p key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span className="text-emerald-400">•</span>
                    <span>{r}</span>
                  </p>
                ))}
              </div>
            </div>
          ) : candidateDecision.status === 'LEARNING_MODE' ? (
            <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4 space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-900/40 border border-amber-500/50 text-amber-400 mb-1">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-base font-extrabold text-amber-300">
                Insufficient data — record at least 30 genuine results.
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                At least 30 genuine recorded results are required before activating candidate highlights.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400 mb-1">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-base font-black text-red-400 tracking-wide uppercase">
                NO RELIABLE EDGE — historical data does not provide a reliable signal.
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No single outcome satisfies all strict empirical threshold conditions (minimum 30 results, 10 pattern matches, multi-analysis agreement, and positive expectation).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OVERDUE OUTCOME MANDATORY DISCLAIMER */}
      <div className="bg-indigo-950/40 border border-indigo-700/40 rounded-2xl p-4 space-y-1">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Overdue Outcome Rule (Gambler's Fallacy Notice):</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed pl-6">
          “Historical absence does not make an outcome due in the next round.”
        </p>
        <p className="text-[11px] text-slate-400 pl-6 pt-0.5">
          Rounds passed without an outcome appearing are recorded purely as descriptive absence. Theoretical probability remains constant for every independent trial.
        </p>
      </div>

      {/* DETAILED OUTCOME BREAKDOWN LIST */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Detailed Breakdown Per Outcome</span>
        </h3>

        {analyses.map((item) => (
          <div
            key={item.outcome}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all"
          >
            {/* Outcome Header & Primary Badges */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-black text-white">{item.label}</h4>
                <span className="bg-slate-800 border border-slate-700 text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-mono">
                  All History: {item.allHistoryCount} times ({item.allHistoryProb.toFixed(1)}%)
                </span>
              </div>

              {item.hasPositiveEdge ? (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Positive Edge
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                  No Edge
                </span>
              )}
            </div>

            {/* Probability Windows Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Theoretical Prob</span>
                <span className="text-sm font-black text-indigo-300">
                  {item.theoreticalProb !== null ? `${item.theoreticalProb.toFixed(1)}%` : 'Unknown'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Last 20 Results</span>
                <span className="text-sm font-black text-slate-200">{item.last20Prob.toFixed(1)}%</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Last 50 Results</span>
                <span className="text-sm font-black text-slate-200">{item.last50Prob.toFixed(1)}%</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Last 100 Results</span>
                <span className="text-sm font-black text-slate-200">{item.last100Prob.toFixed(1)}%</span>
              </div>
            </div>

            {/* Streak & Pattern Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Streak info */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Current Streak:</span>
                  <span className="font-bold text-slate-200">{item.currentStreak} rounds</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span>Historically followed streak: </span>
                  {Object.keys(item.whatFollowedStreak).length > 0 ? (
                    <span className="font-mono text-indigo-300 font-bold">
                      {Object.entries(item.whatFollowedStreak)
                        .map(([k, v]) => `${k}: ${v.toFixed(0)}%`)
                        .join(', ')}
                    </span>
                  ) : (
                    <span className="italic text-slate-500">No prior streak data</span>
                  )}
                </div>
              </div>

              {/* Best Matching Sequence Pattern */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Sequence Pattern Match:</span>
                  <span className="font-bold text-amber-300">
                    {item.patternMatchCount} occurrences
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span>Pattern followed by: </span>
                  {Object.keys(item.whatFollowedPattern).length > 0 ? (
                    <span className="font-mono text-emerald-300 font-bold">
                      {Object.entries(item.whatFollowedPattern)
                        .map(([k, v]) => `${k}: ${v.toFixed(0)}%`)
                        .join(', ')}
                    </span>
                  ) : (
                    <span className="italic text-slate-500">Insufficient sequence matches</span>
                  )}
                </div>
              </div>
            </div>

            {/* Overdue & Transition Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Rounds Since Last</span>
                <span className="font-black text-amber-400 text-sm">
                  {item.roundsSinceLastAppeared} rounds
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Longest Absence</span>
                <span className="font-black text-slate-300 text-sm">
                  {item.longestHistoricalAbsence} rounds
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Transition Prob</span>
                <span className="font-black text-indigo-300 text-sm">
                  {item.transitionProbFromPrevious.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Financial Odds & EV Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-2">
                <span className="text-slate-300">Payout Multiplier & Expected Value</span>
                <span className="text-indigo-400 font-mono">{item.payoutMultiplier.toFixed(2)}x Multiplier</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Break-even Prob</span>
                  <span className="font-mono font-bold">{item.breakEvenProb.toFixed(1)}%</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Expected Value (EV)</span>
                  <span
                    className={`font-mono font-bold ${
                      item.expectedValuePerUnit > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {item.expectedValuePerUnit >= 0 ? '+' : ''}
                    {item.expectedValuePerUnit.toFixed(2)} / unit
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">95% Confidence Interval</span>
                  <span className="font-mono text-[11px]">
                    [{item.ci95Lower.toFixed(1)}% – {item.ci95Upper.toFixed(1)}%]
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Backtested Hit Rate</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {item.backtestedHitRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HISTORICAL BACKTESTING PERFORMANCE SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Chance Check Backtesting Performance</span>
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-mono">
            Out-of-sample checks
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[11px] block">Total Checks</span>
            <span className="text-lg font-black text-white">{backtestSummary.totalChecks}</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[11px] block">Correct Checks</span>
            <span className="text-lg font-black text-emerald-400">{backtestSummary.correctCount}</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[11px] block">Hit Rate</span>
            <span className="text-lg font-black text-indigo-300">{backtestSummary.hitRate.toFixed(1)}%</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 text-[11px] block">Random Baseline</span>
            <span className="text-lg font-black text-slate-300">{backtestSummary.randomBaseline.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-slate-400">Difference from Baseline: </span>
            <span
              className={`font-mono font-bold ${
                backtestSummary.diffFromBaseline >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {backtestSummary.diffFromBaseline >= 0 ? '+' : ''}
              {backtestSummary.diffFromBaseline.toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-slate-400">95% CI: </span>
            <span className="font-mono">
              [{backtestSummary.ci95Lower.toFixed(1)}% – {backtestSummary.ci95Upper.toFixed(1)}%]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
