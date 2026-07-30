import React, { useState } from 'react';
import { GameResult, GameSession, GameType } from '../types/game';
import {
  deleteResult,
  editResult,
  exportResultsAsCSV,
  exportResultsAsJSON,
  importResultsFromJSON,
  resetAllData,
  createNewSession,
  getStoredSessions,
} from '../utils/storage';
import {
  History,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Edit2,
  Filter,
  Check,
  AlertTriangle,
  BarChart2,
  Calendar,
  FolderPlus,
} from 'lucide-react';

interface HistoryAndDataScreenProps {
  results: GameResult[];
  sessions: GameSession[];
  activeSessionId: string;
  onRefresh: () => void;
}

export const HistoryAndDataScreen: React.FC<HistoryAndDataScreenProps> = ({
  results,
  sessions,
  activeSessionId,
  onRefresh,
}) => {
  // Filters
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOutcome, setEditOutcome] = useState<string>('');

  // Confirmation dialogs
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // New Session Creator
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionNameInput, setNewSessionNameInput] = useState('');

  // Filtered results
  const filteredResults = results.filter((r) => {
    if (gameFilter !== 'all' && r.gameType !== gameFilter) return false;
    if (sessionFilter !== 'all' && r.sessionId !== sessionFilter) return false;
    if (
      searchQuery &&
      !r.outcome.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.gameType.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Newest first
  const sortedFiltered = [...filteredResults].sort((a, b) => b.timestamp - a.timestamp);

  const handleDeleteItem = (id: string) => {
    deleteResult(id);
    onRefresh();
  };

  const handleSaveEditItem = (id: string) => {
    if (!editOutcome.trim()) return;
    editResult(id, editOutcome.trim());
    setEditingId(null);
    onRefresh();
  };

  const handleResetConfirm = () => {
    if (resetConfirmText.toLowerCase() === 'reset') {
      resetAllData();
      setShowResetModal(false);
      setResetConfirmText('');
      onRefresh();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importResultsFromJSON(content);
        setImportStatus(res.message);
        onRefresh();
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionNameInput.trim()) return;
    createNewSession(newSessionNameInput.trim());
    setNewSessionNameInput('');
    setShowNewSessionModal(false);
    onRefresh();
  };

  // Distribution chart counts for current view
  const gameCounts = {
    coin: results.filter((r) => r.gameType === 'coin').length,
    roulette: results.filter((r) => r.gameType === 'roulette').length,
    wheel: results.filter((r) => r.gameType === 'wheel').length,
    dice: results.filter((r) => r.gameType === 'dice').length,
  };
  const maxGameCount = Math.max(1, ...Object.values(gameCounts));

  return (
    <div className="space-y-6 text-slate-100 p-4 max-w-4xl mx-auto">
      {/* Header & Session Creator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <span>Master History & Data Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Local persistent storage manager. Filter, export, import, or manage sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* VISUAL BAR CHART SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-xs text-slate-300 mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>Game Volume Distribution Overview</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Coin */}
          <div className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Coin</span>
              <span className="font-mono font-bold text-slate-200">{gameCounts.coin}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full"
                style={{ width: `${(gameCounts.coin / maxGameCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Roulette */}
          <div className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Roulette</span>
              <span className="font-mono font-bold text-slate-200">{gameCounts.roulette}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-indigo-400 h-2 rounded-full"
                style={{ width: `${(gameCounts.roulette / maxGameCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Wheel */}
          <div className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Wheel</span>
              <span className="font-mono font-bold text-slate-200">{gameCounts.wheel}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-pink-400 h-2 rounded-full"
                style={{ width: `${(gameCounts.wheel / maxGameCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Dice */}
          <div className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Dice</span>
              <span className="font-mono font-bold text-slate-200">{gameCounts.dice}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-purple-400 h-2 rounded-full"
                style={{ width: `${(gameCounts.dice / maxGameCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & EXPORT ACTIONS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Game Filter */}
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value as GameType | 'all')}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 flex-1 focus:outline-none"
            >
              <option value="all">All Games</option>
              <option value="coin">Coin</option>
              <option value="roulette">Mini Roulette</option>
              <option value="wheel">Wheel</option>
              <option value="dice">Dice</option>
            </select>

            {/* Session Filter */}
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 flex-1 focus:outline-none"
            >
              <option value="all">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by outcome..."
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none min-w-[160px]"
          />
        </div>

        {/* DATA EXPORT & IMPORT ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportResultsAsCSV(sortedFiltered)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => exportResultsAsJSON(results, sessions)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset All Data Button */}
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900/60 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Reset All Data</span>
          </button>
        </div>

        {/* Import Status Message Banner */}
        {importStatus && (
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700 text-indigo-200 text-xs font-medium">
            {importStatus}
          </div>
        )}
      </div>

      {/* RECORDED RESULTS TABLE / LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-200">
            Recorded Outcomes ({sortedFiltered.length})
          </h3>
          <span className="text-xs text-slate-500">Newest first</span>
        </div>

        {sortedFiltered.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-8">
            No history records found for current filters.
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sortedFiltered.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <input
                      type="text"
                      value={editOutcome}
                      onChange={(e) => setEditOutcome(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveEditItem(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium"
                      >
                        <Check className="w-3.5 h-3.5 inline" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] uppercase font-bold">
                        {item.gameType}
                      </span>
                      {item.isDemo && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] uppercase font-black tracking-wider">
                          DEMO
                        </span>
                      )}
                      <span className="font-black text-sm text-white">{item.outcome}</span>
                      {item.numericValue !== undefined && (
                        <span className="text-slate-400 font-mono">({item.numericValue})</span>
                      )}
                      <span className="text-slate-500 text-[10px] font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditOutcome(item.outcome);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg"
                        title="Edit outcome"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
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

      {/* RESET DOUBLE CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold text-lg mb-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span>Confirm Permanent Data Reset</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This action will permanently wipe all local session records and results stored on this device.
            </p>
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Type <span className="text-red-400 font-mono font-bold">RESET</span> below to confirm:
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Type RESET"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={resetConfirmText.toLowerCase() !== 'reset'}
                className="px-4 py-2 rounded-xl bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold hover:bg-red-500"
              >
                Wipe Data Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SESSION MODAL */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-2">Start New Session</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter a name for the session. Old history will remain saved safely.
            </p>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <input
                type="text"
                value={newSessionNameInput}
                onChange={(e) => setNewSessionNameInput(e.target.value)}
                placeholder="e.g. Session #2"
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
