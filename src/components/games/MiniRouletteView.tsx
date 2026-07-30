import React, { useState } from 'react';
import { GameResult, WheelConfig, PayoutMultipliers } from '../../types/game';
import {
  classifyRouletteNumber,
  calculateStreaks,
  calculateTransitions,
  calculateLaplaceEstimates,
  getRecentFrequencies,
} from '../../utils/statsEngine';
import { analyzeStreamOutcomes } from '../../utils/chanceEngine';
import { addResult, deleteResult, editResult } from '../../utils/storage';
import { Last20Banner } from '../Last20Banner';
import {
  Disc,
  Flame,
  Snowflake,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
} from 'lucide-react';

interface MiniRouletteViewProps {
  results: GameResult[];
  activeSessionId: string;
  wheelConfig?: WheelConfig;
  multipliers?: PayoutMultipliers;
  onRefresh: () => void;
}

export const MiniRouletteView: React.FC<MiniRouletteViewProps> = ({
  results,
  activeSessionId,
  wheelConfig = { blueGreenName: 'Blue/Green Diamond' },
  multipliers = {
    coin: {
      RED: 2,
      GREEN: 2,
    },
    dice: {
      UNDER_50: 2,
      OVER_50: 2,
    },
    wheel: {
      RED_PINK_DIAMOND: 3,
      BLUE_GREEN_DIAMOND: 3,
      BOX: 6,
    },
    roulette: {
      number: 12,
      color: 2,
      size: 2,
      parity: 2,
    },
  },
  onRefresh,
}) => {
  // Main stream tabs: 'numbers' | 'small_big' | 'even_odd' | 'red_black'
  const [streamTab, setStreamTab] = useState<'numbers' | 'small_big' | 'even_odd' | 'red_black'>('numbers');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNum, setEditNum] = useState<number>(1);

  // Filter roulette results for active session
  const sessionResults = results.filter((r) => {
    if (r.gameType !== 'roulette') return false;
    if (activeSessionId) {
      return (
        r.sessionId === activeSessionId ||
        (!r.sessionId && activeSessionId === 'default_session_1')
      );
    }
    return true;
  });

  const rouletteResults = sessionResults; // newest first by default from storage if ordered
  // Chronological order (oldest to newest)
  const chronological = [...rouletteResults].sort((a, b) => a.timestamp - b.timestamp);
  const total = rouletteResults.length;

  const cooldownRef = React.useRef(false);
  const [recordedToast, setRecordedToast] = useState<string | null>(null);

  // Manual record handler
  const handleRecord = (num: number) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 300);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // Safe fallback
      }
    }

    addResult('roulette', num.toString(), num);
    setRecordedToast(`Number ${num}`);
    setTimeout(() => setRecordedToast(null), 1200);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    deleteResult(id);
    onRefresh();
  };

  const handleUndo = () => {
    if (rouletteResults.length > 0) {
      // Find latest result by highest timestamp
      const latest = [...rouletteResults].sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latest) {
        deleteResult(latest.id);
        onRefresh();
      }
    }
  };

  const handleSaveEdit = (id: string) => {
    editResult(id, editNum.toString(), editNum);
    setEditingId(null);
    onRefresh();
  };

  // --- DERIVED DATA STREAMS ---
  // Numbers 1-12 counts
  const numberCounts: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) numberCounts[i] = 0;
  chronological.forEach((r) => {
    const n = parseInt(r.outcome, 10);
    if (n >= 1 && n <= 12) numberCounts[n]++;
  });

  // Numbers absence statistics (rounds since last appearance & longest absence)
  const numberAbsenceStats: Record<number, { roundsSince: number; longestAbsence: number }> = {};
  for (let n = 1; n <= 12; n++) {
    const indices: number[] = [];
    chronological.forEach((r, idx) => {
      if (parseInt(r.outcome, 10) === n) indices.push(idx);
    });

    if (indices.length === 0) {
      numberAbsenceStats[n] = { roundsSince: total, longestAbsence: total };
    } else {
      const lastIdx = indices[indices.length - 1];
      const roundsSince = total - 1 - lastIdx;

      let maxAbsence = indices[0]; // gap before first appearance
      for (let i = 1; i < indices.length; i++) {
        const gap = indices[i] - indices[i - 1] - 1;
        if (gap > maxAbsence) maxAbsence = gap;
      }
      const endGap = total - 1 - lastIdx;
      if (endGap > maxAbsence) maxAbsence = endGap;

      numberAbsenceStats[n] = { roundsSince, longestAbsence: maxAbsence };
    }
  }

  // Derived binary streams
  const sizeOutcomes = chronological.map((r) =>
    classifyRouletteNumber(parseInt(r.outcome, 10)).size
  ); // 'SMALL' or 'BIG'
  const parityOutcomes = chronological.map((r) =>
    classifyRouletteNumber(parseInt(r.outcome, 10)).parity
  ); // 'EVEN' or 'ODD'
  const colorOutcomes = chronological.map((r) =>
    classifyRouletteNumber(parseInt(r.outcome, 10)).color
  ); // 'RED' or 'BLACK'

  // Counts for binary streams
  const smallCount = sizeOutcomes.filter((s) => s === 'SMALL').length;
  const bigCount = sizeOutcomes.filter((s) => s === 'BIG').length;

  const evenCount = parityOutcomes.filter((p) => p === 'EVEN').length;
  const oddCount = parityOutcomes.filter((p) => p === 'ODD').length;

  const redCount = colorOutcomes.filter((c) => c === 'RED').length;
  const blackCount = colorOutcomes.filter((c) => c === 'BLACK').length;

  // Streaks for each stream
  const numberOutcomesStr = chronological.map((r) => r.outcome);
  const numberStreaks = calculateStreaks(numberOutcomesStr);
  const sizeStreaks = calculateStreaks(sizeOutcomes);
  const parityStreaks = calculateStreaks(parityOutcomes);
  const colorStreaks = calculateStreaks(colorOutcomes);

  // Transitions for binary streams
  const sizePossible = [
    { id: 'SMALL', label: 'Small (1–6)' },
    { id: 'BIG', label: 'Big (7–12)' },
  ];
  const parityPossible = [
    { id: 'EVEN', label: 'Even' },
    { id: 'ODD', label: 'Odd' },
  ];
  const colorPossible = [
    { id: 'RED', label: 'Red' },
    { id: 'BLACK', label: 'Black' },
  ];
  const numberPossible = Array.from({ length: 12 }, (_, i) => ({
    id: (i + 1).toString(),
    label: `Num ${i + 1}`,
  }));

  const sizeTransitions = calculateTransitions(sizeOutcomes, sizePossible);
  const parityTransitions = calculateTransitions(parityOutcomes, parityPossible);
  const colorTransitions = calculateTransitions(colorOutcomes, colorPossible);
  const numberTransitions = calculateTransitions(numberOutcomesStr, numberPossible);

  // Helper for previous results after current streak
  const getOutcomeAfterCurrentStreak = (outcomes: string[], currentOutcome: string, streakCount: number) => {
    if (outcomes.length <= streakCount) return { countA: 0, countB: 0, totalAfter: 0 };
    let followA = 0;
    let followB = 0;

    for (let i = streakCount - 1; i < outcomes.length - 1; i++) {
      // Check if past streak match ended at i
      let isMatch = true;
      for (let k = 0; k < streakCount; k++) {
        if (outcomes[i - k] !== currentOutcome) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        const next = outcomes[i + 1];
        if (next === outcomes[outcomes.length - 1]) followA++;
        else followB++;
      }
    }
    return { countA: followA, countB: followB, totalAfter: followA + followB };
  };

  return (
    <div className="space-y-6 text-slate-100 p-4 max-w-4xl mx-auto pb-12">
      {/* 1. TOP HEADER & MANDATORY WARNING */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Disc className="w-6 h-6 text-indigo-400" />
              <span>Mini Roulette Analyzer (Numbers 1 to 12)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Record any number 1 to 12. All derived categories (Small/Big, Even/Odd, Red/Black) update automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={rouletteResults.length === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                rouletteResults.length > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 shadow-sm cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Undo last recorded result"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 px-3 py-1 rounded-xl text-xs font-mono font-bold">
              Total Records: {total}
            </span>
          </div>
        </div>

        {/* Responsible Use Notice */}
        <div className="mt-3 bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-normal font-mono">
            Historical tendencies do not guarantee the next result. Use statistical analysis responsibly.
          </p>
        </div>

        {/* 2. MANUAL NUMBER RECORDING GRID (1 TO 12) */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tap a Number to Record Result (1 to 12):
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Auto-derives all categories</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
              const cls = classifyRouletteNumber(num);
              const isRed = cls.color === 'RED';
              return (
                <button
                  key={num}
                  onClick={() => handleRecord(num)}
                  className={`group relative py-3.5 px-2 rounded-xl font-black shadow-md border transition-all duration-150 active:scale-95 flex flex-col items-center justify-center ${
                    isRed
                      ? 'bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-red-400/40 text-white'
                      : 'bg-gradient-to-br from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 border-slate-600/40 text-white'
                  }`}
                >
                  <span className="text-2xl font-black font-mono">{num}</span>
                  <div className="flex items-center gap-1 mt-0.5 text-[9px] font-medium text-slate-300/90 uppercase">
                    <span>{cls.size}</span> • <span>{cls.parity}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. FOUR CLEARLY SEPARATED ANALYSIS STREAM TABS */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-lg overflow-x-auto">
        <button
          onClick={() => setStreamTab('numbers')}
          className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            streamTab === 'numbers'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Disc className="w-4 h-4 shrink-0" />
          <span>1. Numbers 1–12</span>
        </button>
        <button
          onClick={() => setStreamTab('small_big')}
          className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            streamTab === 'small_big'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>2. Small / Big</span>
        </button>
        <button
          onClick={() => setStreamTab('even_odd')}
          className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            streamTab === 'even_odd'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>3. Even / Odd</span>
        </button>
        <button
          onClick={() => setStreamTab('red_black')}
          className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            streamTab === 'red_black'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>4. Red / Black</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STREAM TAB 1: NUMBERS 1–12 */}
      {/* ========================================================================= */}
      {streamTab === 'numbers' && (
        <div className="space-y-6">
          {/* Last 20 Numbers Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-indigo-400" />
                <span>Last 20 Numbers Live Banner</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Stream: Exact Numbers (1–12)</span>
            </div>
            <Last20Banner
              gameType="roulette"
              results={results}
              activeSessionId={activeSessionId}
              rouletteStream="number"
            />
          </div>

          {/* Numbers Tendency Summary Banner */}
          {(() => {
            const laplaceList = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
              const count = numberCounts[n];
              const smoothedProb = ((count + 1) / (total + 12)) * 100; // Laplace: (count + 1)/(total + 12)
              return { num: n, count, smoothedProb };
            });
            const maxProb = total > 0 ? Math.max(...laplaceList.map((item) => item.smoothedProb)) : 0;
            const topNumbers = total > 0 ? laplaceList.filter((item) => Math.abs(item.smoothedProb - maxProb) < 0.0001) : [];

            return (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2 mb-3">
                  <h3 className="font-extrabold text-sm text-indigo-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Highest Number Historical Tendency</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono">
                    Formula: (count + 1) / (total + 12)
                  </span>
                </div>

                {total === 0 ? (
                  <p className="text-xs text-slate-400 italic">No numbers recorded yet. Tap 1 to 12 above.</p>
                ) : topNumbers.length > 1 ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-300">
                      Equal highest tendency — Numbers {topNumbers.map((t) => t.num).join(', ')} ({maxProb.toFixed(2)}% each)
                    </p>
                    <p className="text-xs text-slate-300">
                      Tied across {topNumbers.length} numbers with count {topNumbers[0].count} each out of {total} total results.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Top Candidate Number:</span>
                      <h4 className="text-xl font-black text-white">Number {topNumbers[0]?.num}</h4>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-lg font-bold text-emerald-400">{topNumbers[0]?.smoothedProb.toFixed(2)}%</span>
                      <span className="block text-[10px] text-slate-400">Laplace Smoothed</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Detailed Numbers Breakdown Table: Counts, Raw %, Laplace, Baselines & Absences */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Numbers 1–12 Complete Frequency & Absence Analysis</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Baseline: 1/12 = 8.33%</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Number</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Count & Raw %</th>
                    <th className="p-2.5">Laplace Est.</th>
                    <th className="p-2.5">Fair Baseline</th>
                    <th className="p-2.5">Streak (Cur/Max)</th>
                    <th className="p-2.5 rounded-r-lg">Rounds Since / Longest Absence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                    const c = numberCounts[n];
                    const rawPct = total > 0 ? (c / total) * 100 : 0;
                    const laplacePct = ((c + 1) / (total + 12)) * 100;
                    const theo = 8.33;
                    const cls = classifyRouletteNumber(n);
                    const isRed = cls.color === 'RED';

                    const nOutcomes = chronological.map((r) => (r.outcome === n.toString() ? 'HIT' : 'MISS'));
                    const nStreaks = calculateStreaks(nOutcomes);
                    const absence = numberAbsenceStats[n];

                    return (
                      <tr key={n} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono border ${
                              isRed
                                ? 'bg-red-950/80 border-red-700/80 text-red-300'
                                : 'bg-slate-800 border-slate-700 text-slate-200'
                            }`}
                          >
                            #{n}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-400">
                          {cls.size} • {cls.parity} • {cls.color}
                        </td>
                        <td className="p-2.5 font-mono">
                          <span className="font-bold text-white">{c}</span> ({rawPct.toFixed(1)}%)
                        </td>
                        <td className="p-2.5 font-mono font-bold text-indigo-300">
                          {laplacePct.toFixed(2)}%
                        </td>
                        <td className="p-2.5 font-mono text-amber-300">{theo.toFixed(2)}%</td>
                        <td className="p-2.5 font-mono">
                          {nStreaks.currentStreakOutcome === 'HIT' ? nStreaks.currentStreakCount : 0}x / {nStreaks.longestStreakCount}x
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">
                          <span className={absence.roundsSince > 10 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {absence.roundsSince === total ? 'Never' : `${absence.roundsSince} rounds ago`}
                          </span>
                          <span className="text-slate-500 ml-1.5">(Max: {absence.longestAbsence})</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exact-Number Pattern & Transition Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <span>Exact-Number Transitions & Sequence Analysis</span>
            </h3>
            <p className="text-xs text-slate-400">
              Shows what numbers immediately followed each exact number in historical records.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {numberPossible.map((prev) => {
                const transObj = numberTransitions.find((t) => t.previousOutcome === prev.id);
                const nextCounts = transObj?.nextOutcomeCounts || {};
                const totalTrans = Object.values(nextCounts).reduce((a, b) => a + b, 0);

                return (
                  <div key={prev.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex justify-between items-center font-bold pb-1 border-b border-slate-700">
                      <span className="text-indigo-300">After Number #{prev.id}:</span>
                      <span className="text-[10px] text-slate-400 font-mono">{totalTrans} transitions</span>
                    </div>

                    {totalTrans === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No transitions after Number #{prev.id} yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(nextCounts)
                          .filter(([, cnt]) => cnt > 0)
                          .map(([nextNum, cnt]) => (
                            <span key={nextNum} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 font-mono text-[11px]">
                              → #{nextNum}: <strong className="text-emerald-400">{cnt}x</strong> ({(((cnt / totalTrans) * 100)).toFixed(0)}%)
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Embedded Chance Check for Numbers Stream */}
          <EmbeddedChanceCard
            sessionResults={sessionResults}
            wheelConfig={wheelConfig}
            multipliers={multipliers}
            rouletteStream="number"
            streamTitle="Numbers 1–12 Chance Check"
          />

          {/* Complete History List for Numbers */}
          <RouletteHistoryList
            results={rouletteResults}
            editingId={editingId}
            editNum={editNum}
            onEditStart={(id, num) => {
              setEditingId(id);
              setEditNum(num);
            }}
            onEditCancel={() => setEditingId(null)}
            onEditSave={handleSaveEdit}
            onDelete={handleDelete}
            onSelectEditNum={setEditNum}
            streamType="numbers"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREAM TAB 2: SMALL / BIG */}
      {/* ========================================================================= */}
      {streamTab === 'small_big' && (
        <div className="space-y-6">
          {/* Last 20 Small/Big Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Last 20 Small / Big Live Banner</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Stream: Small (1–6) vs Big (7–12)</span>
            </div>
            <Last20Banner
              gameType="roulette"
              results={results}
              activeSessionId={activeSessionId}
              rouletteStream="size"
            />
          </div>

          {/* Small / Big Tendency Summary Card */}
          {(() => {
            const smallLaplace = ((smallCount + 1) / (total + 2)) * 100;
            const bigLaplace = ((bigCount + 1) / (total + 2)) * 100;

            return (
              <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <h3 className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Small / Big Historical Tendency & Laplace Estimation</span>
                  </h3>
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-mono">
                    Formula: (category count + 1) / (total + 2)
                  </span>
                </div>

                {/* Tendency Status Banner */}
                <div className="p-3.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-sm font-bold text-white">
                  {total === 0 ? (
                    <span className="text-slate-400 text-xs font-normal">No results recorded yet.</span>
                  ) : smallCount === bigCount ? (
                    <span className="text-amber-300">Balanced historical tendency — 50% Small and 50% Big.</span>
                  ) : smallCount > bigCount ? (
                    <span>
                      Highest Tendency: <strong className="text-indigo-400 font-black">Small (1–6)</strong> — {smallLaplace.toFixed(1)}% (Laplace) vs {bigLaplace.toFixed(1)}% Big
                    </span>
                  ) : (
                    <span>
                      Highest Tendency: <strong className="text-purple-400 font-black">Big (7–12)</strong> — {bigLaplace.toFixed(1)}% (Laplace) vs {smallLaplace.toFixed(1)}% Small
                    </span>
                  )}
                </div>

                {/* Side-by-Side Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Small */}
                  <div className="bg-slate-800/60 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-indigo-300 text-sm">Small (1, 2, 3, 4, 5, 6)</span>
                      <span className="font-mono text-xs text-slate-400">Baseline: 50%</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {smallCount} <span className="text-xs font-normal text-slate-400">hits ({total > 0 ? ((smallCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-indigo-300 pt-1 border-t border-slate-700/60">
                      <span>Laplace Estimate:</span>
                      <span className="font-bold">{smallLaplace.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Big */}
                  <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-purple-300 text-sm">Big (7, 8, 9, 10, 11, 12)</span>
                      <span className="font-mono text-xs text-slate-400">Baseline: 50%</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {bigCount} <span className="text-xs font-normal text-slate-400">hits ({total > 0 ? ((bigCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-purple-300 pt-1 border-t border-slate-700/60">
                      <span>Laplace Estimate:</span>
                      <span className="font-bold">{bigLaplace.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Streaks & Following Results */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Current Streak:</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {sizeStreaks.currentStreakCount}x {sizeStreaks.currentStreakOutcome}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Longest Streak: {sizeStreaks.longestStreakCount}x {sizeStreaks.longestStreakOutcome}
                    </span>
                  </div>

                  {(() => {
                    const follow = getOutcomeAfterCurrentStreak(
                      sizeOutcomes,
                      sizeStreaks.currentStreakOutcome,
                      sizeStreaks.currentStreakCount
                    );
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-0.5">Previous Results After Current Streak:</span>
                        {follow.totalAfter === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No prior identical streaks.</span>
                        ) : (
                          <span className="font-bold text-slate-200 text-xs font-mono">
                            Same: {follow.countA}x ({(((follow.countA / follow.totalAfter) * 100)).toFixed(0)}%) • Opposite: {follow.countB}x ({(((follow.countB / follow.totalAfter) * 100)).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Small/Big Transitions & Alternating Pattern Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-400" />
              <span>Small / Big Transitions & Sequence Alternation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sizeTransitions.map((t) => (
                <div key={t.previousOutcome} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-purple-300 pb-1 border-b border-slate-700 flex justify-between">
                    <span>After {t.previousOutcome === 'SMALL' ? 'Small (1–6)' : 'Big (7–12)'}:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {Object.values(t.nextOutcomeCounts).reduce((a, b) => a + b, 0)} transitions
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span>→ Followed by Small:</span>
                      <span className="font-bold text-indigo-300">
                        {t.nextOutcomeCounts['SMALL'] || 0} hits ({((t.nextOutcomePercentages['SMALL'] || 0)).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>→ Followed by Big:</span>
                      <span className="font-bold text-purple-300">
                        {t.nextOutcomeCounts['BIG'] || 0} hits ({((t.nextOutcomePercentages['BIG'] || 0)).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Embedded Chance Check for Small/Big Stream */}
          <EmbeddedChanceCard
            sessionResults={sessionResults}
            wheelConfig={wheelConfig}
            multipliers={multipliers}
            rouletteStream="size"
            streamTitle="Small / Big Chance Check"
          />

          {/* Complete Derived History List for Small/Big */}
          <RouletteHistoryList
            results={rouletteResults}
            editingId={editingId}
            editNum={editNum}
            onEditStart={(id, num) => {
              setEditingId(id);
              setEditNum(num);
            }}
            onEditCancel={() => setEditingId(null)}
            onEditSave={handleSaveEdit}
            onDelete={handleDelete}
            onSelectEditNum={setEditNum}
            streamType="small_big"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREAM TAB 3: EVEN / ODD */}
      {/* ========================================================================= */}
      {streamTab === 'even_odd' && (
        <div className="space-y-6">
          {/* Last 20 Even/Odd Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Last 20 Even / Odd Live Banner</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Stream: Even (2,4,6,8,10,12) vs Odd (1,3,5,7,9,11)</span>
            </div>
            <Last20Banner
              gameType="roulette"
              results={results}
              activeSessionId={activeSessionId}
              rouletteStream="parity"
            />
          </div>

          {/* Even / Odd Tendency Summary Card */}
          {(() => {
            const evenLaplace = ((evenCount + 1) / (total + 2)) * 100;
            const oddLaplace = ((oddCount + 1) / (total + 2)) * 100;

            return (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <h3 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Even / Odd Historical Tendency & Laplace Estimation</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
                    Formula: (category count + 1) / (total + 2)
                  </span>
                </div>

                {/* Tendency Status Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-sm font-bold text-white">
                  {total === 0 ? (
                    <span className="text-slate-400 text-xs font-normal">No results recorded yet.</span>
                  ) : evenCount === oddCount ? (
                    <span className="text-amber-300">Balanced historical tendency — 50% Even and 50% Odd.</span>
                  ) : evenCount > oddCount ? (
                    <span>
                      Highest Tendency: <strong className="text-emerald-400 font-black">Even</strong> — {evenLaplace.toFixed(1)}% (Laplace) vs {oddLaplace.toFixed(1)}% Odd
                    </span>
                  ) : (
                    <span>
                      Highest Tendency: <strong className="text-teal-400 font-black">Odd</strong> — {oddLaplace.toFixed(1)}% (Laplace) vs {evenLaplace.toFixed(1)}% Even
                    </span>
                  )}
                </div>

                {/* Side-by-Side Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Even */}
                  <div className="bg-slate-800/60 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-emerald-300 text-sm">Even (2, 4, 6, 8, 10, 12)</span>
                      <span className="font-mono text-xs text-slate-400">Baseline: 50%</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {evenCount} <span className="text-xs font-normal text-slate-400">hits ({total > 0 ? ((evenCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-emerald-300 pt-1 border-t border-slate-700/60">
                      <span>Laplace Estimate:</span>
                      <span className="font-bold">{evenLaplace.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Odd */}
                  <div className="bg-slate-800/60 border border-teal-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-teal-300 text-sm">Odd (1, 3, 5, 7, 9, 11)</span>
                      <span className="font-mono text-xs text-slate-400">Baseline: 50%</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {oddCount} <span className="text-xs font-normal text-slate-400">hits ({total > 0 ? ((oddCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-teal-300 pt-1 border-t border-slate-700/60">
                      <span>Laplace Estimate:</span>
                      <span className="font-bold">{oddLaplace.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Streaks & Following Results */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Current Streak:</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {parityStreaks.currentStreakCount}x {parityStreaks.currentStreakOutcome}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Longest Streak: {parityStreaks.longestStreakCount}x {parityStreaks.longestStreakOutcome}
                    </span>
                  </div>

                  {(() => {
                    const follow = getOutcomeAfterCurrentStreak(
                      parityOutcomes,
                      parityStreaks.currentStreakOutcome,
                      parityStreaks.currentStreakCount
                    );
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-0.5">Previous Results After Current Streak:</span>
                        {follow.totalAfter === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No prior identical streaks.</span>
                        ) : (
                          <span className="font-bold text-slate-200 text-xs font-mono">
                            Same: {follow.countA}x ({(((follow.countA / follow.totalAfter) * 100)).toFixed(0)}%) • Opposite: {follow.countB}x ({(((follow.countB / follow.totalAfter) * 100)).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Even/Odd Transitions & Alternating Pattern Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span>Even / Odd Transitions & Sequence Alternation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parityTransitions.map((t) => (
                <div key={t.previousOutcome} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-emerald-300 pb-1 border-b border-slate-700 flex justify-between">
                    <span>After {t.previousOutcome}:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {Object.values(t.nextOutcomeCounts).reduce((a, b) => a + b, 0)} transitions
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span>→ Followed by Even:</span>
                      <span className="font-bold text-emerald-300">
                        {t.nextOutcomeCounts['EVEN'] || 0} hits ({((t.nextOutcomePercentages['EVEN'] || 0)).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>→ Followed by Odd:</span>
                      <span className="font-bold text-teal-300">
                        {t.nextOutcomeCounts['ODD'] || 0} hits ({((t.nextOutcomePercentages['ODD'] || 0)).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Embedded Chance Check for Even/Odd Stream */}
          <EmbeddedChanceCard
            sessionResults={sessionResults}
            wheelConfig={wheelConfig}
            multipliers={multipliers}
            rouletteStream="parity"
            streamTitle="Even / Odd Chance Check"
          />

          {/* Complete Derived History List for Even/Odd */}
          <RouletteHistoryList
            results={rouletteResults}
            editingId={editingId}
            editNum={editNum}
            onEditStart={(id, num) => {
              setEditingId(id);
              setEditNum(num);
            }}
            onEditCancel={() => setEditingId(null)}
            onEditSave={handleSaveEdit}
            onDelete={handleDelete}
            onSelectEditNum={setEditNum}
            streamType="even_odd"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STREAM TAB 4: RED / BLACK (OPTIONAL 4TH SEPARATE TAB) */}
      {/* ========================================================================= */}
      {streamTab === 'red_black' && (
        <div className="space-y-6">
          {/* Last 20 Red/Black Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span>Last 20 Red / Black Live Banner</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Stream: Red (1,3,5,8,10,12) vs Black (2,4,6,7,9,11)</span>
            </div>
            <Last20Banner
              gameType="roulette"
              results={results}
              activeSessionId={activeSessionId}
              rouletteStream="color"
            />
          </div>

          {/* Red / Black Tendency Summary Card */}
          {(() => {
            const redLaplace = ((redCount + 1) / (total + 2)) * 100;
            const blackLaplace = ((blackCount + 1) / (total + 2)) * 100;

            return (
              <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                  <h3 className="font-extrabold text-sm text-red-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <span>Red / Black Historical Tendency & Laplace Estimation</span>
                  </h3>
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2.5 py-0.5 rounded-full font-mono">
                    Formula: (category count + 1) / (total + 2)
                  </span>
                </div>

                {/* Tendency Status Banner */}
                <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-sm font-bold text-white">
                  {total === 0 ? (
                    <span className="text-slate-400 text-xs font-normal">No results recorded yet.</span>
                  ) : redCount === blackCount ? (
                    <span className="text-amber-300">Balanced historical tendency — 50% Red and 50% Black.</span>
                  ) : redCount > blackCount ? (
                    <span>
                      Highest Tendency: <strong className="text-red-400 font-black">Red</strong> — {redLaplace.toFixed(1)}% (Laplace) vs {blackLaplace.toFixed(1)}% Black
                    </span>
                  ) : (
                    <span>
                      Highest Tendency: <strong className="text-slate-200 font-black">Black</strong> — {blackLaplace.toFixed(1)}% (Laplace) vs {redLaplace.toFixed(1)}% Red
                    </span>
                  )}
                </div>

                {/* Side-by-Side Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Red */}
                  <div className="bg-slate-800/60 border border-red-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-red-300 text-sm">Red (1, 3, 5, 8, 10, 12)</span>
                      <span className="font-mono text-xs text-slate-400">Baseline: 50%</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {redCount} <span className="text-xs font-normal text-slate-400">hits ({total > 0 ? ((redCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-red-300 pt-1 border-t border-slate-700/60">
                      <span>Laplace Estimate:</span>
                      <span className="font-bold">{redLaplace.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Black */}
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-slate-200 text-sm">Black (2, 4, 6, 7, 9, 11)</span>
                      <span className="font-mono text-xs text-slate-400">Baseline: 50%</span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {blackCount} <span className="text-xs font-normal text-slate-400">hits ({total > 0 ? ((blackCount / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-700/60">
                      <span>Laplace Estimate:</span>
                      <span className="font-bold">{blackLaplace.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Streaks & Following Results */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Current Streak:</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {colorStreaks.currentStreakCount}x {colorStreaks.currentStreakOutcome}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Longest Streak: {colorStreaks.longestStreakCount}x {colorStreaks.longestStreakOutcome}
                    </span>
                  </div>

                  {(() => {
                    const follow = getOutcomeAfterCurrentStreak(
                      colorOutcomes,
                      colorStreaks.currentStreakOutcome,
                      colorStreaks.currentStreakCount
                    );
                    return (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block mb-0.5">Previous Results After Current Streak:</span>
                        {follow.totalAfter === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No prior identical streaks.</span>
                        ) : (
                          <span className="font-bold text-slate-200 text-xs font-mono">
                            Same: {follow.countA}x ({(((follow.countA / follow.totalAfter) * 100)).toFixed(0)}%) • Opposite: {follow.countB}x ({(((follow.countB / follow.totalAfter) * 100)).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Red/Black Transitions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-red-400" />
              <span>Red / Black Transitions & Sequence Alternation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {colorTransitions.map((t) => (
                <div key={t.previousOutcome} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-red-300 pb-1 border-b border-slate-700 flex justify-between">
                    <span>After {t.previousOutcome}:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {Object.values(t.nextOutcomeCounts).reduce((a, b) => a + b, 0)} transitions
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span>→ Followed by Red:</span>
                      <span className="font-bold text-red-300">
                        {t.nextOutcomeCounts['RED'] || 0} hits ({((t.nextOutcomePercentages['RED'] || 0)).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>→ Followed by Black:</span>
                      <span className="font-bold text-slate-200">
                        {t.nextOutcomeCounts['BLACK'] || 0} hits ({((t.nextOutcomePercentages['BLACK'] || 0)).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Embedded Chance Check for Red/Black Stream */}
          <EmbeddedChanceCard
            sessionResults={sessionResults}
            wheelConfig={wheelConfig}
            multipliers={multipliers}
            rouletteStream="color"
            streamTitle="Red / Black Chance Check"
          />

          {/* Complete Derived History List for Red/Black */}
          <RouletteHistoryList
            results={rouletteResults}
            editingId={editingId}
            editNum={editNum}
            onEditStart={(id, num) => {
              setEditingId(id);
              setEditNum(num);
            }}
            onEditCancel={() => setEditingId(null)}
            onEditSave={handleSaveEdit}
            onDelete={handleDelete}
            onSelectEditNum={setEditNum}
            streamType="red_black"
          />
        </div>
      )}
    </div>
  );
};

// =========================================================================
// EMBEDDED CHANCE CHECK CARD COMPONENT
// =========================================================================
interface EmbeddedChanceCardProps {
  sessionResults: GameResult[];
  wheelConfig: WheelConfig;
  multipliers: PayoutMultipliers;
  rouletteStream: 'number' | 'size' | 'parity' | 'color';
  streamTitle: string;
}

const EmbeddedChanceCard: React.FC<EmbeddedChanceCardProps> = ({
  sessionResults,
  wheelConfig,
  multipliers,
  rouletteStream,
  streamTitle,
}) => {
  const { candidateDecision } = analyzeStreamOutcomes(
    sessionResults,
    'roulette',
    wheelConfig,
    multipliers,
    rouletteStream
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{streamTitle}</span>
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">Separate Stream Chance Check</span>
      </div>

      <div>
        {candidateDecision.status === 'CANDIDATE' ? (
          <div className="bg-emerald-950/70 border border-emerald-600/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                  {candidateDecision.statusMessage}
                </span>
                <h5 className="text-base font-black text-white">{candidateDecision.label}</h5>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-0.5 pl-7">
              {candidateDecision.reasons.map((r, idx) => (
                <p key={idx} className="text-[11px] text-slate-300">
                  • {r}
                </p>
              ))}
            </div>
          </div>
        ) : candidateDecision.status === 'LEARNING_MODE' ? (
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-amber-300">
                Learning mode — insufficient data (At least 100 entries needed for active signals).
              </h5>
              <p className="text-[10px] text-slate-400">Current record count: {sessionResults.length}</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-black text-red-400 uppercase tracking-wide">
                NO RELIABLE EDGE — no statistical highlight
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Empirical threshold conditions (minimum 30 entries, multi-analysis agreement, positive expectation) not satisfied for this stream.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// ROULETTE HISTORY LIST COMPONENT
// =========================================================================
interface RouletteHistoryListProps {
  results: GameResult[];
  editingId: string | null;
  editNum: number;
  onEditStart: (id: string, num: number) => void;
  onEditCancel: () => void;
  onEditSave: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectEditNum: (num: number) => void;
  streamType: 'numbers' | 'small_big' | 'even_odd' | 'red_black';
}

const RouletteHistoryList: React.FC<RouletteHistoryListProps> = ({
  results,
  editingId,
  editNum,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onSelectEditNum,
  streamType,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-200">
          Roulette Complete History (Newest First — Total: {results.length})
        </h3>
        <span className="text-xs text-slate-500 font-mono">Derived from Recorded Numbers</span>
      </div>

      {results.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6 italic bg-slate-950/60 rounded-xl border border-slate-800">
          No numbers recorded yet. Tap 1 to 12 above to add entries.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {results.map((item) => {
            const num = parseInt(item.outcome, 10);
            const cls = classifyRouletteNumber(num);
            const isEditing = editingId === item.id;

            let displayPrimary = `#${num}`;
            if (streamType === 'small_big') displayPrimary = cls.size;
            else if (streamType === 'even_odd') displayPrimary = cls.parity;
            else if (streamType === 'red_black') displayPrimary = cls.color;

            return (
              <div
                key={item.id}
                className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <select
                      value={editNum}
                      onChange={(e) => onSelectEditNum(parseInt(e.target.value, 10))}
                      className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 font-mono text-xs"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          Num {n} ({classifyRouletteNumber(n).size}, {classifyRouletteNumber(n).parity})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditSave(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={onEditCancel}
                        className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono border ${
                          cls.color === 'RED'
                            ? 'bg-red-950/80 border-red-700/80 text-red-300'
                            : 'bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        {displayPrimary}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200">
                          Number #{num} ({cls.size}, {cls.parity}, {cls.color})
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditStart(item.id, num)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit recorded number"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
