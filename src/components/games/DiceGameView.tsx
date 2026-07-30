import React, { useState } from 'react';
import { GameResult, DiceConfig } from '../../types/game';
import {
  classifyDiceValue,
  getPossibleOutcomesForGame,
} from '../../utils/statsEngine';
import { addResult, deleteResult, editResult } from '../../utils/storage';
import { AnalysisPanel } from '../AnalysisPanel';
import { Last20Banner } from '../Last20Banner';
import {
  Dices,
  Trash2,
  Edit2,
  Check,
  Hash,
} from 'lucide-react';

interface DiceGameViewProps {
  results: GameResult[];
  activeSessionId: string;
  diceConfig: DiceConfig;
  onRefresh: () => void;
}

export const DiceGameView: React.FC<DiceGameViewProps> = ({
  results,
  activeSessionId,
  diceConfig,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'record' | 'analysis' | 'history'>('record');
  const [numericValueInput, setNumericValueInput] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOutcome, setEditOutcome] = useState<string>('UNDER_50');

  const diceResults = results.filter((r) => r.gameType === 'dice');
  const chronological = [...diceResults].sort((a, b) => a.timestamp - b.timestamp);
  const chronologicalOutcomes = chronological.map((r) => r.outcome);
  const total = diceResults.length;

  const possible = getPossibleOutcomesForGame('dice', { blueGreenName: '' });

  const cooldownRef = React.useRef(false);
  const [recordedToast, setRecordedToast] = useState<string | null>(null);

  const handleRecordDirect = (outcome: string) => {
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

    addResult('dice', outcome);
    setRecordedToast(outcome);
    setTimeout(() => setRecordedToast(null), 1200);
    onRefresh();
  };

  const handleRecordNumeric = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericValueInput === '') return;
    const num = parseFloat(numericValueInput);
    if (isNaN(num)) return;

    const classified = classifyDiceValue(num);
    addResult('dice', classified, num);
    setNumericValueInput('');
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
      {/* Sub-Tabs */}
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
          <div className="text-center py-1">
            <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
              <Dices className="w-6 h-6 text-amber-400" />
              <span>Dice Outcome Recorder (Under / Over 50)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct outcome buttons or type exact numeric score.
            </p>
          </div>

          {/* LAST 20 RESULTS LIVE BANNER */}
          <Last20Banner
            gameType="dice"
            results={results}
            activeSessionId={activeSessionId}
          />

          {/* TWO LARGE DIRECT ENTRY BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            <button
              onClick={() => handleRecordDirect('UNDER_50')}
              className="bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 active:scale-95 text-white py-12 rounded-3xl font-black text-2xl shadow-xl shadow-indigo-900/40 border border-indigo-400/30 flex flex-col items-center justify-center transition-all"
            >
              <span className="text-3xl mb-1">⬇️</span>
              <span>Under 50</span>
            </button>

            <button
              onClick={() => handleRecordDirect('OVER_50')}
              className="bg-gradient-to-br from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 active:scale-95 text-white py-12 rounded-3xl font-black text-2xl shadow-xl shadow-purple-900/40 border border-purple-400/30 flex flex-col items-center justify-center transition-all"
            >
              <span className="text-3xl mb-1">⬆️</span>
              <span>Over 50</span>
            </button>
          </div>

          {/* OPTIONAL NUMERIC FIELD INPUT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-bold text-xs text-slate-200 mb-2 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-indigo-400" />
              <span>
                Or Enter Exact Numeric Score (0 - 100):
              </span>
            </h3>
            <form onSubmit={handleRecordNumeric} className="flex gap-2">
              <input
                type="number"
                step="any"
                value={numericValueInput}
                onChange={(e) => setNumericValueInput(e.target.value)}
                placeholder="e.g. 42.5 or 78"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
              >
                Record Score
              </button>
            </form>
            <p className="text-[11px] text-slate-500 mt-2">
              Rule: Score &lt; 50 = Under 50, Score &ge; 50 = Over 50.
            </p>
          </div>
        </div>
      )}

      {/* 2. ANALYSIS TAB */}
      {subTab === 'analysis' && (
        <AnalysisPanel
          gameTitle="Dice (Under / Over 50)"
          totalResults={total}
          chronologicalOutcomes={chronologicalOutcomes}
          newestFirstOutcomes={diceResults.map((r) => r.outcome)}
          possibleOutcomes={possible}
          theoreticalBaselines={{
            UNDER_50: 50.0,
            OVER_50: 50.0,
          }}
        />
      )}

      {/* 3. HISTORY TAB */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">
              Dice History (Newest First)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Count: {diceResults.length}</span>
          </div>

          {diceResults.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 italic bg-slate-900 rounded-2xl border border-slate-800">
              No dice results recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {diceResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <select
                        value={editOutcome}
                        onChange={(e) => setEditOutcome(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1"
                      >
                        <option value="UNDER_50">Under 50</option>
                        <option value="OVER_50">Over 50</option>
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
                        <span className="font-bold text-sm text-white">
                          {item.outcome === 'UNDER_50' ? '⬇️ Under 50' : '⬆️ Over 50'}
                        </span>
                        {item.numericValue !== undefined && (
                          <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-mono">
                            Score: {item.numericValue}
                          </span>
                        )}
                        <span className="text-slate-500 text-[11px] font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditOutcome(item.outcome);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
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
