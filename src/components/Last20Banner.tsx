import React, { useState } from 'react';
import { GameResult, GameType, WheelConfig } from '../types/game';
import {
  Sparkles,
  Grid,
  X,
  Clock,
  Hash,
  Diamond,
  Box,
  Coins,
  Disc,
  CircleDot,
  Dices,
  ChevronRight,
} from 'lucide-react';

interface Last20BannerProps {
  gameType: GameType;
  results: GameResult[];
  activeSessionId: string;
  wheelConfig?: WheelConfig;
  rouletteStream?: 'number' | 'size' | 'parity' | 'color';
}

export const Last20Banner: React.FC<Last20BannerProps> = ({
  gameType,
  results,
  activeSessionId,
  wheelConfig,
  rouletteStream = 'number',
}) => {
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [showGridModal, setShowGridModal] = useState(false);

  // Filter for currently selected game and current session
  const sessionResults = results.filter((r) => {
    if (r.gameType !== gameType) return false;
    if (activeSessionId) {
      return (
        r.sessionId === activeSessionId ||
        (!r.sessionId && activeSessionId === 'default_session_1')
      );
    }
    return true;
  });

  // Sort by timestamp descending (newest first on left)
  const sortedNewestFirst = [...sessionResults].sort((a, b) => b.timestamp - a.timestamp);

  // Take latest 20
  const last20 = sortedNewestFirst.slice(0, 20);
  const totalCount = last20.length;

  const selectedItem = selectedResultIndex !== null ? last20[selectedResultIndex] : null;

  // Formatting helpers
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to render individual outcome chip visual
  const renderChip = (item: GameResult, isLatest: boolean, size: 'normal' | 'large' = 'normal') => {
    const chipBase = `relative flex items-center justify-center shrink-0 rounded-full font-black select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer border shadow-md ${
      size === 'large' ? 'w-14 h-14 text-base' : 'w-11 h-11 text-xs sm:w-12 sm:h-12 sm:text-sm'
    }`;

    // Highlights latest result with bright border & animation
    const highlightEffect = isLatest
      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-amber-500/40 animate-pulse border-amber-300'
      : '';

    if (item.gameType === 'coin') {
      const isRed = item.outcome === 'RED';
      return (
        <div
          className={`${chipBase} ${
            isRed
              ? 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-white'
          } ${highlightEffect}`}
          title={isRed ? 'Red (R)' : 'Green (G)'}
        >
          <span>{isRed ? 'R' : 'G'}</span>
        </div>
      );
    }

    if (item.gameType === 'roulette') {
      const numStr = item.numericValue !== undefined ? item.numericValue.toString() : item.outcome;
      const num = parseInt(numStr, 10);
      const isRed = [1, 3, 5, 8, 10, 12].includes(num);

      if (rouletteStream === 'size') {
        const isSmall = num >= 1 && num <= 6;
        return (
          <div
            className={`relative flex items-center justify-center shrink-0 rounded-2xl font-black select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer border shadow-md ${
              size === 'large'
                ? 'px-4 py-2.5 text-sm min-w-[70px] text-center'
                : 'px-2.5 py-1.5 text-[11px] min-w-[56px] text-center'
            } ${
              isSmall
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-400 text-white'
                : 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 text-white'
            } ${highlightEffect}`}
            title={isSmall ? `Small (${numStr})` : `Big (${numStr})`}
          >
            <span>{isSmall ? 'Small' : 'Big'}</span>
          </div>
        );
      }

      if (rouletteStream === 'parity') {
        const isEven = num % 2 === 0;
        return (
          <div
            className={`relative flex items-center justify-center shrink-0 rounded-2xl font-black select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer border shadow-md ${
              size === 'large'
                ? 'px-4 py-2.5 text-sm min-w-[70px] text-center'
                : 'px-2.5 py-1.5 text-[11px] min-w-[56px] text-center'
            } ${
              isEven
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-400 text-white'
                : 'bg-gradient-to-br from-teal-600 to-teal-800 border-teal-400 text-white'
            } ${highlightEffect}`}
            title={isEven ? `Even (${numStr})` : `Odd (${numStr})`}
          >
            <span>{isEven ? 'Even' : 'Odd'}</span>
          </div>
        );
      }

      if (rouletteStream === 'color') {
        return (
          <div
            className={`relative flex items-center justify-center shrink-0 rounded-2xl font-black select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer border shadow-md ${
              size === 'large'
                ? 'px-4 py-2.5 text-sm min-w-[70px] text-center'
                : 'px-2.5 py-1.5 text-[11px] min-w-[56px] text-center'
            } ${
              isRed
                ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-400 text-white'
                : 'bg-gradient-to-br from-slate-800 to-slate-950 border-slate-600 text-slate-100'
            } ${highlightEffect}`}
            title={isRed ? `Red (${numStr})` : `Black (${numStr})`}
          >
            <span>{isRed ? 'Red' : 'Black'}</span>
          </div>
        );
      }

      return (
        <div
          className={`${chipBase} ${
            isRed
              ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-400 text-white'
              : 'bg-gradient-to-br from-slate-800 to-slate-950 border-slate-600 text-slate-100'
          } ${highlightEffect}`}
          title={`Number ${numStr}`}
        >
          <span>{numStr}</span>
        </div>
      );
    }

    if (item.gameType === 'wheel') {
      if (item.outcome === 'RED_PINK_DIAMOND') {
        return (
          <div
            className={`${chipBase} bg-gradient-to-br from-pink-500 to-rose-700 border-pink-300 text-white ${highlightEffect}`}
            title="Red/Pink Diamond"
          >
            <Diamond className={size === 'large' ? 'w-6 h-6 fill-white' : 'w-5 h-5 fill-white'} />
          </div>
        );
      }
      if (item.outcome === 'BLUE_GREEN_DIAMOND') {
        return (
          <div
            className={`${chipBase} bg-gradient-to-br from-cyan-500 to-blue-700 border-cyan-300 text-white ${highlightEffect}`}
            title={wheelConfig?.blueGreenName || 'Blue/Green Diamond'}
          >
            <Diamond className={size === 'large' ? 'w-6 h-6 fill-white' : 'w-5 h-5 fill-white'} />
          </div>
        );
      }
      // BOX
      return (
        <div
          className={`${chipBase} bg-gradient-to-br from-amber-400 to-amber-600 border-amber-200 text-slate-950 ${highlightEffect}`}
          title="Box"
        >
          <Box className={size === 'large' ? 'w-6 h-6 fill-slate-950' : 'w-5 h-5 fill-slate-950'} />
        </div>
      );
    }

    if (item.gameType === 'dice') {
      const isUnder = item.outcome === 'UNDER_50';
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 rounded-2xl font-black select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer border shadow-md ${
            size === 'large'
              ? 'px-4 py-2.5 text-sm min-w-[70px] text-center'
              : 'px-2.5 py-1.5 text-[11px] min-w-[56px] text-center'
          } ${
            isUnder
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400 text-white'
              : 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 text-white'
          } ${highlightEffect}`}
          title={isUnder ? 'Under 50' : 'Over 50'}
        >
          <span>{isUnder ? 'Under' : 'Over'}</span>
        </div>
      );
    }

    return null;
  };

  // Detailed descriptions for popup modal
  const getOutcomeDetails = (item: GameResult) => {
    if (item.gameType === 'coin') {
      return item.outcome === 'RED'
        ? { title: 'Red (R)', subtitle: 'Coin Flip Outcome' }
        : { title: 'Green (G)', subtitle: 'Coin Flip Outcome' };
    }
    if (item.gameType === 'roulette') {
      const numStr = item.numericValue !== undefined ? item.numericValue.toString() : item.outcome;
      const num = parseInt(numStr, 10);
      const isRed = [1, 3, 5, 8, 10, 12].includes(num);
      const isSmall = num >= 1 && num <= 6;
      const isEven = num % 2 === 0;

      return {
        title: `Number ${numStr}`,
        subtitle: 'Mini Roulette Outcome',
        tags: [
          isRed ? '🔴 Red' : '⚫ Black',
          isSmall ? 'Small (1–6)' : 'Large (7–12)',
          isEven ? 'Even' : 'Odd',
        ],
      };
    }
    if (item.gameType === 'wheel') {
      if (item.outcome === 'RED_PINK_DIAMOND')
        return { title: 'Red / Pink Diamond', subtitle: 'Wheel Outcome' };
      if (item.outcome === 'BLUE_GREEN_DIAMOND')
        return {
          title: wheelConfig?.blueGreenName || 'Blue / Green Diamond',
          subtitle: 'Wheel Outcome',
        };
      return { title: 'Box Segment', subtitle: 'Wheel Outcome' };
    }
    if (item.gameType === 'dice') {
      const isUnder = item.outcome === 'UNDER_50';
      return {
        title: isUnder ? 'Under 50' : 'Over 50',
        subtitle: 'Dice Outcome',
        score: item.numericValue !== undefined ? `Exact score: ${item.numericValue}` : undefined,
      };
    }
    return { title: item.outcome, subtitle: '' };
  };

  return (
    <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-3 mb-5 shadow-xl backdrop-blur-md">
      {/* Banner Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
            <span>Last 20 Results</span>
            <span className="text-slate-400 font-normal text-[11px] sm:text-xs font-mono">
              (Results: {totalCount}/20)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Direction Indicator */}
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span>Latest</span>
            <ChevronRight className="w-2.5 h-2.5 text-amber-400" />
            <span>Older</span>
          </span>

          {/* View All Grid Button */}
          <button
            onClick={() => setShowGridModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-200 transition-colors shrink-0 active:scale-95"
            title="View all 20 results in grid"
          >
            <Grid className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">View All</span>
          </button>
        </div>
      </div>

      {/* Main Horizontal Scrollable Strip */}
      {totalCount === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 italic">
          No results recorded in this session yet — enter a result to view strip.
        </div>
      ) : (
        <div className="flex items-center gap-2.5 overflow-x-auto py-2.5 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {last20.map((item, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={item.id || `l20_${idx}_${item.timestamp}`}
                onClick={() => setSelectedResultIndex(idx)}
                className="flex flex-col items-center gap-1 group shrink-0"
              >
                {/* Visual Chip */}
                {renderChip(item, isLatest)}

                {/* Index / Position Tag */}
                <span
                  className={`text-[9px] font-mono font-bold px-1 rounded ${
                    isLatest
                      ? 'bg-amber-400 text-slate-950 uppercase font-black tracking-wider'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {isLatest ? '#1 New' : `#${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL / POPUP ON ITEM CLICK */}
      {selectedItem !== null && selectedResultIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setSelectedResultIndex(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Position Header */}
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {selectedResultIndex === 0
                  ? '#1 (Latest Result)'
                  : `#${selectedResultIndex + 1} of ${totalCount}`}
              </span>
            </div>

            {/* Large Visual Representation */}
            <div className="flex items-center gap-4 py-2 border-y border-slate-800">
              {renderChip(selectedItem, selectedResultIndex === 0, 'large')}

              <div>
                <h4 className="text-lg font-black text-white">
                  {getOutcomeDetails(selectedItem).title}
                </h4>
                <p className="text-xs text-indigo-300">
                  {getOutcomeDetails(selectedItem).subtitle}
                </p>

                {getOutcomeDetails(selectedItem).score && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {getOutcomeDetails(selectedItem).score}
                  </p>
                )}
              </div>
            </div>

            {/* Roulette Categories Tag Badge */}
            {getOutcomeDetails(selectedItem).tags && (
              <div className="flex flex-wrap gap-1.5">
                {getOutcomeDetails(selectedItem).tags?.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Timestamp Info */}
            <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Recorded Time:
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {formatTime(selectedItem.timestamp)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span>Date:</span>
                <span className="font-mono text-slate-300">
                  {formatDate(selectedItem.timestamp)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedResultIndex(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* COMPACT GRID VIEW ALL 20 MODAL */}
      {showGridModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Last 20 Results ({totalCount}/20)
                </h3>
              </div>
              <button
                onClick={() => setShowGridModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Latest recorded results (Newest first at top left). Tap any item for full details.
            </p>

            {totalCount === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No results recorded yet.</div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-3 p-1">
                {last20.map((item, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={`grid_${item.id || idx}`}
                      onClick={() => {
                        setShowGridModal(false);
                        setSelectedResultIndex(idx);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      {renderChip(item, isLatest)}
                      <span className="text-[10px] font-mono text-slate-400 mt-1 font-bold">
                        {isLatest ? '#1 New' : `#${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowGridModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 transition-colors"
            >
              Close Grid
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
