import React, { useState, useRef } from 'react';
import { GameResult, GameType, WheelConfig, DiceConfig, PayoutMultipliers } from '../types/game';
import { CoinGameView } from './games/CoinGameView';
import { MiniRouletteView } from './games/MiniRouletteView';
import { WheelGameView } from './games/WheelGameView';
import { DiceGameView } from './games/DiceGameView';
import { undoLastResult } from '../utils/storage';
import {
  Coins,
  Disc,
  CircleDot,
  Dices,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RecordSectionProps {
  results: GameResult[];
  activeSessionId: string;
  wheelConfig: WheelConfig;
  diceConfig: DiceConfig;
  multipliers: PayoutMultipliers;
  onUpdateWheelConfig: (config: WheelConfig) => void;
  onUpdateDiceConfig: (config: DiceConfig) => void;
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const RecordSection: React.FC<RecordSectionProps> = ({
  results,
  activeSessionId,
  wheelConfig,
  diceConfig,
  multipliers,
  onUpdateWheelConfig,
  onUpdateDiceConfig,
  onRefresh,
  onShowToast,
}) => {
  const [activeGame, setActiveGame] = useState<GameType>('coin');

  const handleUndo = () => {
    const undone = undoLastResult();
    onRefresh();
    if (undone) {
      onShowToast(`Undone last result: ${undone.outcome}`);
    }
  };

  return (
    <div className="space-y-4 text-slate-100 p-3 sm:p-4 max-w-4xl mx-auto pb-12">
      {/* Top Compact Game Selector & Global Undo Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl sticky top-0 z-20 backdrop-blur-md bg-slate-900/90">
        <div className="flex items-center justify-between gap-2">
          {/* Game Selector Tabs */}
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            <button
              onClick={() => setActiveGame('coin')}
              className={`py-2 px-2 min-h-[48px] rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 ${
                activeGame === 'coin'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4 mb-0.5" />
              <span>Coin</span>
            </button>

            <button
              onClick={() => setActiveGame('roulette')}
              className={`py-2 px-2 min-h-[48px] rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 ${
                activeGame === 'roulette'
                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Disc className="w-4 h-4 mb-0.5" />
              <span>Roulette</span>
            </button>

            <button
              onClick={() => setActiveGame('wheel')}
              className={`py-2 px-2 min-h-[48px] rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 ${
                activeGame === 'wheel'
                  ? 'bg-pink-600 text-white font-black shadow-md shadow-pink-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-4 h-4 mb-0.5" />
              <span>Wheel</span>
            </button>

            <button
              onClick={() => setActiveGame('dice')}
              className={`py-2 px-2 min-h-[48px] rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 ${
                activeGame === 'dice'
                  ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-4 h-4 mb-0.5" />
              <span>Dice</span>
            </button>
          </div>

          {/* Undo Last Button */}
          <button
            onClick={handleUndo}
            disabled={results.length === 0}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center shrink-0 transition-all ${
              results.length > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 shadow-sm cursor-pointer active:scale-95'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title="Undo last recorded result"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] font-mono mt-0.5">Undo</span>
          </button>
        </div>
      </div>

      {/* Render Active Game Entry Screen */}
      {activeGame === 'coin' && (
        <CoinGameView
          results={results}
          activeSessionId={activeSessionId}
          onRefresh={onRefresh}
        />
      )}

      {activeGame === 'roulette' && (
        <MiniRouletteView
          results={results}
          activeSessionId={activeSessionId}
          wheelConfig={wheelConfig}
          multipliers={multipliers}
          onRefresh={onRefresh}
        />
      )}

      {activeGame === 'wheel' && (
        <WheelGameView
          results={results}
          activeSessionId={activeSessionId}
          wheelConfig={wheelConfig}
          onUpdateWheelConfig={onUpdateWheelConfig}
          onRefresh={onRefresh}
        />
      )}

      {activeGame === 'dice' && (
        <DiceGameView
          results={results}
          activeSessionId={activeSessionId}
          diceConfig={diceConfig}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
