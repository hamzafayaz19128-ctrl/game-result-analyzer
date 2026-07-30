import React, { useState, useRef } from 'react';
import { GameResult } from '../../types/game';
import { getPossibleOutcomesForGame } from '../../utils/statsEngine';
import { addResult, deleteResult, editResult } from '../../utils/storage';
import { AnalysisPanel } from '../AnalysisPanel';
import { Last20Banner } from '../Last20Banner';
import {
  Coins,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface CoinGameViewProps {
  results: GameResult[];
  activeSessionId: string;
  onRefresh: () => void;
}

export const CoinGameView: React.FC<CoinGameViewProps> = ({
  results,
  activeSessionId,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'record' | 'analysis' | 'history'>('record');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOutcome, setEditOutcome] = useState<'RED' | 'GREEN'>('RED');
  const [recordedToast, setRecordedToast] = useState<string | null>(null);

  const cooldownRef = useRef(false);

  const coinResults = results.filter((r) => r.gameType === 'coin');
  // Order outcomes chronologically (oldest first) for transitions & streaks
  const chronologicalResults = [...coinResults].sort((a, b) => a.timestamp - b.timestamp);
  const chronologicalOutcomes = chronologicalResults.map((r) => r.outcome);
  // Newest first for recent list
  const newestFirstOutcomes = coinResults.map((r) => r.outcome);

  const possible = getPossibleOutcomesForGame('coin', { blueGreenName: '' });
  const total = coinResults.length;

  const handleRecord = (outcome: 'RED' | 'GREEN') => {
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

    addResult('coin', outcome);
    setRecordedToast(outcome);
    setTimeout(() => setRecordedToast(null), 1200);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    deleteResult(id);
    onRefresh();
  };

  const handleSaveEdit = (id: string) => {
    editResult(id, editOutcome);
    setEditingId(null);
    onRefresh();
  };

  return (
    <div className="space-[#11111a] text-slate-100 p-4 max-w-4xl mx-auto">
      {/* Sub-Tabs: Record Result | Analysis | History */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 mb-6 shadow-lg">
        <button
          onClick={() => setSubTab('record')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            subTab === 'record'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Record Result
        </button>
        <button
          onClick={() => setSubTab('analysis')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            subTab === 'analysis'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            subTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          History
        </button>
      </div>

      {/* 1. RECORD RESULT TAB */}
      {subTab === 'record' && (
        <div className="space-y-6">
          <div className="text-center py-2">
            <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              <span>Coin Flip Outcome Recorder</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tap Red or Green to record the manual outcome of your coin draw.
            </p>
          </div>

          {/* LAST 20 RESULTS LIVE BANNER */}
          <Last20Banner
            gameType="coin"
            results={results}
            activeSessionId={activeSessionId}
          />

          {/* LAST 20 RESULTS LIVE BANNER */}
          <Last20Banner
            gameType="coin"
            results={results}
            activeSessionId={activeSessionId}
          />

          {/* TWO LARGE TOUCH BUTTONS: RED AND GREEN */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <button
              onClick={() => handleRecord('RED')}
              className="group relative bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white py-12 rounded-3xl font-black text-2xl shadow-xl shadow-red-900/40 border border-red-500/30 flex flex-col items-center justify-center transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                🔴
              </div>
              <span>RED</span>
              <span className="text-xs font-medium text-red-200 mt-1">
                Red Outcome
              </span>
            </button>

            <button
              onClick={() => handleRecord('GREEN')}
              className="group relative bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 active:scale-95 text-white py-12 rounded-3xl font-black text-2xl shadow-xl shadow-emerald-900/40 border border-emerald-500/30 flex flex-col items-center justify-center transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                🟢
              </div>
              <span>GREEN</span>
              <span className="text-xs font-medium text-emerald-200 mt-1">
                Green Outcome
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ANALYSIS TAB */}
      {subTab === 'analysis' && (
        <AnalysisPanel
          gameTitle="Coin Flip"
          totalResults={total}
          chronologicalOutcomes={chronologicalOutcomes}
          newestFirstOutcomes={newestFirstOutcomes}
          possibleOutcomes={possible}
          theoreticalBaselines={{ RED: 50.0, GREEN: 50.0 }}
        />
      )}

      {/* 3. HISTORY TAB */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">
              Coin Results History (Newest First)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Count: {coinResults.length}</span>
          </div>

          {coinResults.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 italic bg-slate-900 rounded-2xl border border-slate-800">
              No coin results recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {coinResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <select
                        value={editOutcome}
                        onChange={(e) => setEditOutcome(e.target.value as 'RED' | 'GREEN')}
                        className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1"
                      >
                        <option value="RED">RED</option>
                        <option value="GREEN">GREEN</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            item.outcome === 'RED' ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        ></span>
                        <span className="font-bold text-sm text-white">
                          {item.outcome}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditOutcome(item.outcome as 'RED' | 'GREEN');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                          title="Edit outcome"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                          title="Delete outcome"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
