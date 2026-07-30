import React from 'react';
import {
  calculateStreaks,
  calculateTransitions,
  calculateLaplaceEstimates,
  getRecentFrequencies,
} from '../utils/statsEngine';
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Snowflake,
  BarChart2,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface PossibleOutcomeItem {
  id: string;
  label: string;
  colorClass?: string;
  bgClass?: string;
}

export interface AnalysisPanelProps {
  gameTitle?: string;
  totalResults: number;
  chronologicalOutcomes: string[]; // oldest first
  newestFirstOutcomes: string[]; // newest first
  possibleOutcomes: PossibleOutcomeItem[];
  theoreticalBaselines: Record<string, number>; // outcome id -> baseline %
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  gameTitle,
  totalResults,
  chronologicalOutcomes,
  newestFirstOutcomes,
  possibleOutcomes,
  theoreticalBaselines,
}) => {
  const k = possibleOutcomes.length;

  // Outcome Counts & Observed Percentages
  const countsMap: Record<string, number> = {};
  possibleOutcomes.forEach((p) => {
    countsMap[p.id] = 0;
  });

  chronologicalOutcomes.forEach((o) => {
    if (countsMap[o] !== undefined) {
      countsMap[o]++;
    }
  });

  const observedPercentages: Record<string, number> = {};
  possibleOutcomes.forEach((p) => {
    const c = countsMap[p.id] || 0;
    observedPercentages[p.id] = totalResults > 0 ? (c / totalResults) * 100 : 0;
  });

  // Recent Window Frequencies
  const freq10 = getRecentFrequencies(newestFirstOutcomes, 10, possibleOutcomes);
  const freq20 = getRecentFrequencies(newestFirstOutcomes, 20, possibleOutcomes);
  const freq50 = getRecentFrequencies(newestFirstOutcomes, 50, possibleOutcomes);

  // Streaks
  const streakStats = calculateStreaks(chronologicalOutcomes);

  // Transitions
  const transitions = calculateTransitions(chronologicalOutcomes, possibleOutcomes);

  // Laplace Estimates: Estimated share = (count + 1) / (total + k)
  const laplaceEstimates = calculateLaplaceEstimates(countsMap, totalResults, possibleOutcomes);

  // Highest Tendency Calculation & Tie Handling
  let highestItems: typeof laplaceEstimates = [];
  let maxProbability = 0;

  if (totalResults > 0 && laplaceEstimates.length > 0) {
    maxProbability = Math.max(...laplaceEstimates.map((i) => i.smoothedProbability));
    highestItems = laplaceEstimates.filter(
      (i) => Math.abs(i.smoothedProbability - maxProbability) < 0.0001
    );
  }

  const isTie = highestItems.length > 1;
  const isTwoOutcomeEqual = k === 2 && totalResults > 0 && highestItems.length === 2;

  // Format tied outcome labels (e.g. "Numbers 2, 3, 7 and 8" or "Red and Green")
  const formatTiedNames = (items: typeof laplaceEstimates): string => {
    if (items.length === 0) return '';
    const isRouletteNums = items.every(
      (item) => item.label.startsWith('Num ') || !isNaN(Number(item.outcome))
    );

    if (isRouletteNums) {
      const numbers = items.map((item) =>
        item.label.startsWith('Num ') ? item.label.replace('Num ', '') : item.outcome
      );
      if (numbers.length === 1) return `Number ${numbers[0]}`;
      if (numbers.length === 2) return `Numbers ${numbers[0]} and ${numbers[1]}`;
      const allButLast = numbers.slice(0, -1).join(', ');
      const last = numbers[numbers.length - 1];
      return `Numbers ${allButLast} and ${last}`;
    }

    const labels = items.map((item) => item.label);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    const allButLast = labels.slice(0, -1).join(', ');
    const last = labels[labels.length - 1];
    return `${allButLast} and ${last}`;
  };

  // Most & Least Frequent Outcomes
  const sortedByCount = [...possibleOutcomes].sort(
    (a, b) => (countsMap[b.id] || 0) - (countsMap[a.id] || 0)
  );
  const maxCount = countsMap[sortedByCount[0]?.id] || 0;
  const minCount = countsMap[sortedByCount[sortedByCount.length - 1]?.id] || 0;

  const mostFrequentItems = sortedByCount.filter(
    (p) => totalResults > 0 && countsMap[p.id] === maxCount
  );
  const leastFrequentItems = sortedByCount.filter(
    (p) => totalResults > 0 && countsMap[p.id] === minCount
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. DATA KAM HAI WARNING BANNER (If fewer than 30 results exist) */}
      {totalResults < 30 && (
        <div className="bg-amber-950/60 border border-amber-500/60 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              <span>Insufficient data — record at least 30 genuine results.</span>
            </h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Currently recorded {totalResults} results. At least 30 recorded entries are recommended for robust statistical analysis.
            </p>
          </div>
        </div>
      )}

      {/* 2. CARD NAMED "Next Historical Tendency" */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-indigo-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Next Historical Tendency</span>
                {gameTitle && (
                  <span className="text-xs font-normal text-indigo-300 font-mono">
                    ({gameTitle})
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Formula: Estimated share = (count + 1) / (total + {k})
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto text-[10px] bg-indigo-900/80 text-indigo-200 border border-indigo-600 px-2.5 py-1 rounded-full font-mono font-semibold">
            Laplace Smoothing
          </span>
        </div>

        {/* Highlighted Highest Tendency Display */}
        <div className="bg-indigo-950/70 border border-indigo-500/50 rounded-xl p-3.5 mb-4 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold block mb-0.5">
                Highest Historical Tendency:
              </span>
              <div className="text-sm sm:text-base font-black text-white">
                {totalResults === 0 ? (
                  <span className="text-slate-400 text-xs font-normal">
                    No results recorded yet — enter outcomes to calculate tendency
                  </span>
                ) : isTwoOutcomeEqual ? (
                  <span>Balanced historical tendency — 50% each.</span>
                ) : isTie ? (
                  <span>
                    Equal Highest: {formatTiedNames(highestItems)} — {maxProbability.toFixed(1)}% each.
                  </span>
                ) : (
                  <span>{highestItems[0]?.label || ''}</span>
                )}
              </div>
            </div>
          </div>
          {totalResults > 0 && (
            <div className="text-right shrink-0">
              <span className="text-xl font-black text-amber-300">
                {maxProbability.toFixed(1)}%
              </span>
              <div className="text-[10px] text-indigo-300 font-mono">
                ({highestItems[0]?.count + 1} / {totalResults + k})
              </div>
            </div>
          )}
        </div>

        {/* All Possible Outcomes with Tendency Percentages */}
        <div className="space-y-2 mb-4">
          <span className="text-xs font-bold text-slate-300 block mb-1">
            All Possible Outcomes (Historical Share Estimates):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {laplaceEstimates.map((item) => {
              const isHighest = totalResults > 0 && highestItems.some((h) => h.outcome === item.outcome);
              const outcomeMeta = possibleOutcomes.find((p) => p.id === item.outcome);
              return (
                <div
                  key={item.outcome}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isHighest
                      ? 'bg-indigo-900/60 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-white">
                      {outcomeMeta?.label || item.label}
                    </span>
                    {isHighest && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                        {isTie ? 'Equal Highest' : 'Highest'}
                      </span>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <span
                      className={`text-sm font-bold ${
                        isHighest ? 'text-amber-300 font-black' : 'text-slate-200'
                      }`}
                    >
                      {item.smoothedProbability.toFixed(1)}%
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {item.count} hits
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mandated Clear Label */}
        <div className="pt-3 border-t border-indigo-500/20 flex items-center gap-2 text-xs font-semibold text-amber-400">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Historical tendency only — not a guaranteed prediction.</span>
        </div>
      </div>

      {/* 3. TOTAL RECORDED RESULTS & STREAKS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Results */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center shadow-md">
          <span className="text-xs text-slate-400 font-medium">Total Recorded Results</span>
          <div className="text-2xl font-black text-white mt-0.5">{totalResults}</div>
        </div>

        {/* Current Streak */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 text-center shadow-md">
          <span className="text-xs text-amber-400 font-medium">Current Streak</span>
          <div className="text-lg font-black text-amber-300 mt-0.5 truncate">
            {streakStats.currentStreakCount > 0
              ? `${streakStats.currentStreakCount}x ${
                  possibleOutcomes.find((p) => p.id === streakStats.currentStreakOutcome)?.label ||
                  streakStats.currentStreakOutcome
                }`
              : 'N/A'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-3.5 text-center shadow-md">
          <span className="text-xs text-indigo-300 font-medium">Longest Streak</span>
          <div className="text-lg font-black text-indigo-200 mt-0.5 truncate">
            {streakStats.longestStreakCount > 0
              ? `${streakStats.longestStreakCount}x ${
                  possibleOutcomes.find((p) => p.id === streakStats.longestStreakOutcome)?.label ||
                  streakStats.longestStreakOutcome
                }`
              : 'N/A'}
          </div>
        </div>

        {/* Total Possible Outcomes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center shadow-md">
          <span className="text-xs text-slate-400 font-medium">Outcomes Tracked</span>
          <div className="text-2xl font-black text-slate-200 mt-0.5">{k} choices</div>
        </div>
      </div>

      {/* 4. MOST FREQUENT & LEAST FREQUENT OUTCOMES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Most Frequent */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Most Frequent Outcome</span>
          </div>

          {totalResults === 0 ? (
            <p className="text-xs text-slate-500 italic">No records yet.</p>
          ) : (
            <div className="space-y-2">
              {mostFrequentItems.map((item) => {
                const count = countsMap[item.id] || 0;
                const pct = observedPercentages[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-slate-800/60 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between"
                  >
                    <span className="font-black text-sm text-amber-200">{item.label}</span>
                    <span className="font-mono text-xs text-white font-bold">
                      {count} hits ({pct.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Least Frequent */}
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">
            <Snowflake className="w-4 h-4 text-cyan-400" />
            <span>Least Frequent Outcome</span>
          </div>

          {totalResults === 0 ? (
            <p className="text-xs text-slate-500 italic">No records yet.</p>
          ) : (
            <div className="space-y-2">
              {leastFrequentItems.map((item) => {
                const count = countsMap[item.id] || 0;
                const pct = observedPercentages[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-slate-800/60 border border-cyan-500/20 rounded-xl p-3 flex items-center justify-between"
                  >
                    <span className="font-black text-sm text-cyan-200">{item.label}</span>
                    <span className="font-mono text-xs text-white font-bold">
                      {count} hits ({pct.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. COUNT, OBSERVED PERCENTAGE & THEORETICAL BASELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-sm text-slate-200 mb-1 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>Observed Frequencies vs Fair-Game Theoretical Baseline</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Compares observed historical share with fair probability baseline.
        </p>

        <div className="space-y-3">
          {possibleOutcomes.map((p) => {
            const count = countsMap[p.id] || 0;
            const obsPct = observedPercentages[p.id] || 0;
            const theoBaseline = theoreticalBaselines[p.id] ?? (1 / k) * 100;
            const diff = obsPct - theoBaseline;

            return (
              <div
                key={p.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-black text-sm text-white">{p.label}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-200 font-bold">
                      Count: {count} ({obsPct.toFixed(1)}%)
                    </span>
                    <span className="text-indigo-300">
                      Fair Baseline: {theoBaseline.toFixed(1)}%
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      ({diff >= 0 ? '+' : ''}
                      {diff.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Comparative Visual Bars */}
                <div className="space-y-1 text-[10px]">
                  {/* Observed Bar */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400 text-right shrink-0">Observed:</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, obsPct)}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right font-mono font-bold text-slate-300">
                      {obsPct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Theoretical Baseline Bar */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400 text-right shrink-0">Baseline:</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-amber-400/80 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, theoBaseline)}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right font-mono text-amber-300">
                      {theoBaseline.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. WINDOW DISTRIBUTION TABLE (LAST 10, LAST 20, LAST 50, ALL RECORDS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-sm text-slate-200 mb-1">
          Interval Window Distribution (Last 10, 20, 50 & All Records)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Historical breakdown over recent observation windows.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="p-2.5 rounded-l-lg">Outcome</th>
                <th className="p-2.5">Last 10</th>
                <th className="p-2.5">Last 20</th>
                <th className="p-2.5">Last 50</th>
                <th className="p-2.5 rounded-r-lg">All Records ({totalResults})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {possibleOutcomes.map((p) => {
                const c10 = freq10[p.id]?.count || 0;
                const p10 = freq10[p.id]?.percentage || 0;

                const c20 = freq20[p.id]?.count || 0;
                const p20 = freq20[p.id]?.percentage || 0;

                const c50 = freq50[p.id]?.count || 0;
                const p50 = freq50[p.id]?.percentage || 0;

                const cAll = countsMap[p.id] || 0;
                const pAll = observedPercentages[p.id] || 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-bold text-white">{p.label}</td>
                    <td className="p-2.5 font-mono">
                      {c10} ({p10.toFixed(0)}%)
                    </td>
                    <td className="p-2.5 font-mono">
                      {c20} ({p20.toFixed(0)}%)
                    </td>
                    <td className="p-2.5 font-mono">
                      {c50} ({p50.toFixed(0)}%)
                    </td>
                    <td className="p-2.5 font-mono font-bold text-indigo-300">
                      {cAll} ({pAll.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. TRANSITION STATISTICS (WHAT USUALLY FOLLOWED PREVIOUS OUTCOME) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-sm text-slate-200 mb-1">
          Transition Statistics (What Usually Followed Each Outcome)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Shows historical percentage distribution of outcomes that immediately followed a previous result.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {possibleOutcomes.map((prev) => {
            const transObj = transitions.find((t) => t.previousOutcome === prev.id);
            const nextCounts = transObj?.nextOutcomeCounts || {};
            const nextPcts = transObj?.nextOutcomePercentages || {};
            const totalTrans = Object.values(nextCounts).reduce((a, b) => a + b, 0);

            return (
              <div
                key={prev.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-700">
                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                    <span>What followed</span>
                    <span className="text-white font-black">{prev.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({totalTrans} transitions)
                  </span>
                </div>

                {totalTrans === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    No transition pairs recorded yet for {prev.label}.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {possibleOutcomes.map((next) => {
                      const c = nextCounts[next.id] || 0;
                      const pct = nextPcts[next.id] || 0;

                      return (
                        <div key={next.id}>
                          <div className="flex justify-between text-slate-300 mb-0.5">
                            <span className="text-slate-300 font-medium">
                              → followed by {next.label}
                            </span>
                            <span className="font-mono font-bold text-white">
                              {c} hits ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/60 rounded-full h-1.5">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
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
