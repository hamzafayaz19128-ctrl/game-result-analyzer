import React, { useState } from 'react';
import { GameResult, WheelConfig } from '../../types/game';
import { getPossibleOutcomesForGame } from '../../utils/statsEngine';
import { addResult, deleteResult, editResult, saveWheelConfig } from '../../utils/storage';
import { AnalysisPanel } from '../AnalysisPanel';
import { Last20Banner } from '../Last20Banner';
import {
  CircleDot,
  Settings2,
  Check,
  Trash2,
  Edit2,
} from 'lucide-react';

interface WheelGameViewProps {
  results: GameResult[];
  activeSessionId: string;
  wheelConfig: WheelConfig;
  onUpdateWheelConfig: (config: WheelConfig) => void;
  onRefresh: () => void;
}

export const WheelGameView: React.FC<WheelGameViewProps> = ({
  results,
  activeSessionId,
  wheelConfig,
  onUpdateWheelConfig,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'record' | 'analysis' | 'history'>('record');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOutcome, setEditOutcome] = useState<string>('RED_PINK_DIAMOND');

  // Segment inputs state
  const [redSegInput, setRedSegInput] = useState<string>(wheelConfig.redSegments?.toString() || '');
  const [blueSegInput, setBlueSegInput] = useState<string>(wheelConfig.blueSegments?.toString() || '');
  const [boxSegInput, setBoxSegInput] = useState<string>(wheelConfig.boxSegments?.toString() || '');
  const [showSegmentSettings, setShowSegmentSettings] = useState(false);

  const wheelResults = results.filter((r) => r.gameType === 'wheel');
  const chronological = [...wheelResults].sort((a, b) => a.timestamp - b.timestamp);
  const chronologicalOutcomes = chronological.map((r) => r.outcome);
  const total = wheelResults.length;

  const possible = getPossibleOutcomesForGame('wheel', wheelConfig);

  const redCount = wheelResults.filter((r) => r.outcome === 'RED_PINK_DIAMOND').length;
  const blueCount = wheelResults.filter((r) => r.outcome === 'BLUE_GREEN_DIAMOND').length;
  const boxCount = wheelResults.filter((r) => r.outcome === 'BOX').length;

  const redPct = total > 0 ? (redCount / total) * 100 : 0;
  const bluePct = total > 0 ? (blueCount / total) * 100 : 0;
  const boxPct = total > 0 ? (boxCount / total) * 100 : 0;

  // Theoretical probability calculations if segments are set
  const redSeg = parseInt(redSegInput, 10) || 0;
  const blueSeg = parseInt(blueSegInput, 10) || 0;
  const boxSeg = parseInt(boxSegInput, 10) || 0;
  const totalSegments = redSeg + blueSeg + boxSeg;

  const hasSegments = totalSegments > 0;
  const redTheoPct = hasSegments ? (redSeg / totalSegments) * 100 : 0;
  const blueTheoPct = hasSegments ? (blueSeg / totalSegments) * 100 : 0;
  const boxTheoPct = hasSegments ? (boxSeg / totalSegments) * 100 : 0;

  const cooldownRef = React.useRef(false);
  const [recordedToast, setRecordedToast] = useState<string | null>(null);

  const handleRecord = (outcome: string) => {
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

    addResult('wheel', outcome);
    setRecordedToast(outcome);
    setTimeout(() => setRecordedToast(null), 1200);
    onRefresh();
  };

  const handleSaveSegments = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: WheelConfig = {
      ...wheelConfig,
      redSegments: redSeg > 0 ? redSeg : undefined,
      blueSegments: blueSeg > 0 ? blueSeg : undefined,
      boxSegments: boxSeg > 0 ? boxSeg : undefined,
    };
    saveWheelConfig(newConfig);
    onUpdateWheelConfig(newConfig);
    setShowSegmentSettings(false);
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
              <CircleDot className="w-6 h-6 text-pink-400" />
              <span>Wheel Outcome Recorder</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select the wheel landing sector.
            </p>
          </div>

          {/* LAST 20 RESULTS LIVE BANNER */}
          <Last20Banner
            gameType="wheel"
            results={results}
            activeSessionId={activeSessionId}
            wheelConfig={wheelConfig}
          />

          {/* THREE RESULT BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
            {/* Red / Pink Diamond */}
            <button
              onClick={() => handleRecord('RED_PINK_DIAMOND')}
              className="group relative bg-gradient-to-br from-pink-600 to-rose-700 hover:from-pink-500 hover:to-rose-600 active:scale-95 text-white py-10 px-4 rounded-3xl font-black text-xl shadow-xl shadow-pink-900/40 border border-pink-400/30 flex flex-col items-center justify-center transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                ♦️
              </div>
              <span>Red/Pink Diamond</span>
            </button>

            {/* Blue / Green Diamond */}
            <button
              onClick={() => handleRecord('BLUE_GREEN_DIAMOND')}
              className="group relative bg-gradient-to-br from-cyan-600 to-teal-700 hover:from-cyan-500 hover:to-teal-600 active:scale-95 text-white py-10 px-4 rounded-3xl font-black text-xl shadow-xl shadow-cyan-900/40 border border-cyan-400/30 flex flex-col items-center justify-center transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                🔷
              </div>
              <span>{wheelConfig.blueGreenName || 'Blue/Green Diamond'}</span>
            </button>

            {/* Box */}
            <button
              onClick={() => handleRecord('BOX')}
              className="group relative bg-gradient-to-br from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 active:scale-95 text-white py-10 px-4 rounded-3xl font-black text-xl shadow-xl shadow-amber-900/40 border border-amber-400/30 flex flex-col items-center justify-center transition-all duration-150"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                📦
              </div>
              <span>Box</span>
            </button>
          </div>

          {/* Segment Configuration Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-200">
                  Wheel Segment Counts (Optional)
                </span>
              </div>
              <button
                onClick={() => setShowSegmentSettings(!showSegmentSettings)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {showSegmentSettings ? 'Close' : 'Configure Segments'}
              </button>
            </div>

            {hasSegments ? (
              <p className="text-xs text-emerald-400 font-medium">
                Theoretical Probabilities Active: Red ({redTheoPct.toFixed(1)}%), Blue (
                {blueTheoPct.toFixed(1)}%), Box ({boxTheoPct.toFixed(1)}%).
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Segment counts unknown. Displaying purely historical observed percentages.
              </p>
            )}

            {showSegmentSettings && (
              <form onSubmit={handleSaveSegments} className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Red/Pink Segments:</label>
                    <input
                      type="number"
                      min="0"
                      value={redSegInput}
                      onChange={(e) => setRedSegInput(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {wheelConfig.blueGreenName || 'Blue/Green'}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={blueSegInput}
                      onChange={(e) => setBlueSegInput(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Box Segments:</label>
                    <input
                      type="number"
                      min="0"
                      value={boxSegInput}
                      onChange={(e) => setBoxSegInput(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                  >
                    Save Segments
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. ANALYSIS TAB */}
      {subTab === 'analysis' && (
        <AnalysisPanel
          gameTitle="Wheel Sectors"
          totalResults={total}
          chronologicalOutcomes={chronologicalOutcomes}
          newestFirstOutcomes={wheelResults.map((r) => r.outcome)}
          possibleOutcomes={possible}
          theoreticalBaselines={
            hasSegments
              ? {
                  RED_PINK_DIAMOND: redTheoPct,
                  BLUE_GREEN_DIAMOND: blueTheoPct,
                  BOX: boxTheoPct,
                }
              : {
                  RED_PINK_DIAMOND: 33.33,
                  BLUE_GREEN_DIAMOND: 33.33,
                  BOX: 33.33,
                }
          }
        />
      )}

      {/* 3. HISTORY TAB */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">
              Wheel History (Newest First)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Count: {wheelResults.length}</span>
          </div>

          {wheelResults.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 italic bg-slate-900 rounded-2xl border border-slate-800">
              No wheel results recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {wheelResults.map((item) => (
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
                        <option value="RED_PINK_DIAMOND">Red/Pink Diamond</option>
                        <option value="BLUE_GREEN_DIAMOND">
                          {wheelConfig.blueGreenName || 'Blue/Green Diamond'}
                        </option>
                        <option value="BOX">Box</option>
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
                          {item.outcome === 'RED_PINK_DIAMOND'
                            ? '♦️ Red/Pink'
                            : item.outcome === 'BLUE_GREEN_DIAMOND'
                            ? `🔷 ${wheelConfig.blueGreenName || 'Blue/Green'}`
                            : '📦 Box'}
                        </span>
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
