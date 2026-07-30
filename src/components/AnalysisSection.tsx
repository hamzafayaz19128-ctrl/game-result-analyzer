import React, { useState } from 'react';
import { GameResult, GameSession, GameType, WheelConfig, DiceConfig, PayoutMultipliers } from '../types/game';
import { getPossibleOutcomesForGame, classifyRouletteNumber } from '../utils/statsEngine';
import { AnalysisPanel } from './AnalysisPanel';
import { ChanceCheckScreen } from './ChanceCheckScreen';
import { BacktestingScreen } from './BacktestingScreen';
import {
  BarChart2,
  Sparkles,
  TrendingUp,
  Coins,
  Disc,
  CircleDot,
  Dices,
  ShieldAlert,
} from 'lucide-react';

interface AnalysisSectionProps {
  results: GameResult[];
  activeSessionId: string;
  wheelConfig: WheelConfig;
  diceConfig: DiceConfig;
  multipliers: PayoutMultipliers;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  results,
  activeSessionId,
  wheelConfig,
  diceConfig,
  multipliers,
}) => {
  const [analysisTab, setAnalysisTab] = useState<'statistics' | 'chance_check' | 'backtest'>('statistics');
  const [activeGame, setActiveGame] = useState<GameType>('coin');

  // Filter session results for active game
  const sessionResults = results.filter((r) => {
    if (r.gameType !== activeGame) return false;
    if (activeSessionId) {
      return r.sessionId === activeSessionId || (!r.sessionId && activeSessionId === 'default_session_1');
    }
    return true;
  });

  const chronologicalResults = [...sessionResults].sort((a, b) => a.timestamp - b.timestamp);
  const chronologicalOutcomes = chronologicalResults.map((r) => r.outcome);
  const newestFirstOutcomes = sessionResults.map((r) => r.outcome);
  const totalResults = sessionResults.length;

  const possibleOutcomes = getPossibleOutcomesForGame(activeGame, wheelConfig);
  const k = possibleOutcomes.length;
  const equalBaseline = k > 0 ? 100 / k : 0;
  const theoreticalBaselines: Record<string, number> = {};
  possibleOutcomes.forEach((p) => {
    theoreticalBaselines[p.id] = equalBaseline;
  });

  return (
    <div className="space-y-4 text-slate-100 p-4 max-w-4xl mx-auto pb-12">
      {/* Analysis Section Header & Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-400" />
              <span>Analysis & Intelligence Hub</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete statistical analysis, Chance Check predictions & historical backtesting.
            </p>
          </div>
        </div>

        {/* 3 Sub-Nav Items inside Analysis: Statistics | Chance Check | Backtest */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 mt-3 gap-1">
          <button
            onClick={() => setAnalysisTab('statistics')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              analysisTab === 'statistics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            <span>Detailed Stats</span>
          </button>
          <button
            onClick={() => setAnalysisTab('chance_check')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              analysisTab === 'chance_check'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Chance Check</span>
          </button>
          <button
            onClick={() => setAnalysisTab('backtest')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              analysisTab === 'backtest'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Backtest</span>
          </button>
        </div>

        {/* Game selector inside Statistics view */}
        {analysisTab === 'statistics' && (
          <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveGame('coin')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeGame === 'coin'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5 shrink-0" />
              <span>Coin</span>
            </button>
            <button
              onClick={() => setActiveGame('roulette')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeGame === 'roulette'
                  ? 'bg-indigo-600 text-white shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5 shrink-0" />
              <span>Roulette</span>
            </button>
            <button
              onClick={() => setActiveGame('wheel')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeGame === 'wheel'
                  ? 'bg-pink-600 text-white shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 shrink-0" />
              <span>Wheel</span>
            </button>
            <button
              onClick={() => setActiveGame('dice')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                activeGame === 'dice'
                  ? 'bg-purple-600 text-white shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-3.5 h-3.5 shrink-0" />
              <span>Dice</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tab 1: Detailed Statistics & Laplace Estimates */}
      {analysisTab === 'statistics' && (
        <AnalysisPanel
          gameTitle={activeGame.toUpperCase()}
          totalResults={totalResults}
          chronologicalOutcomes={chronologicalOutcomes}
          newestFirstOutcomes={newestFirstOutcomes}
          possibleOutcomes={possibleOutcomes}
          theoreticalBaselines={theoreticalBaselines}
        />
      )}

      {/* Sub-Tab 2: Chance Check */}
      {analysisTab === 'chance_check' && (
        <ChanceCheckScreen
          results={results}
          activeSessionId={activeSessionId}
          wheelConfig={wheelConfig}
          multipliers={multipliers}
        />
      )}

      {/* Sub-Tab 3: Backtest Strategy Simulator */}
      {analysisTab === 'backtest' && (
        <BacktestingScreen
          results={results}
        />
      )}
    </div>
  );
};
