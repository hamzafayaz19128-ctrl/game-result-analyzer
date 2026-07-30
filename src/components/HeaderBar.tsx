import React, { useState } from 'react';
import {
  RotateCcw,
  ShieldAlert,
  FolderPlus,
} from 'lucide-react';
import { GameSession } from '../types/game';
import { getStoredSessions, createNewSession, setActiveSessionId } from '../utils/storage';

interface HeaderBarProps {
  activeSessionId: string;
  onSessionChange: (sessionId: string) => void;
  onUndoLast: () => void;
  canUndo: boolean;
  onSeedSampleData?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeSessionId,
  onSessionChange,
  onUndoLast,
  canUndo,
}) => {
  const [sessions, setSessions] = useState<GameSession[]>(getStoredSessions());
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    const created = createNewSession(newSessionName);
    setSessions(getStoredSessions());
    onSessionChange(created.id);
    setNewSessionName('');
    setIsCreatingSession(false);
  };

  const activeSessionObj = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & App Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              GA
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none text-slate-100">
                Game Result Analyzer
              </h1>
              <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  Historical tendency — not a guaranteed prediction
                </span>
              </p>
            </div>
          </div>

          {/* Quick Undo on Mobile */}
          <button
            onClick={onUndoLast}
            disabled={!canUndo}
            title="Undo last entered result"
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Undo</span>
          </button>
        </div>

        {/* Header Controls Right Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Active Session Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1">
            <span className="text-slate-400 font-medium hidden sm:inline">
              Session:
            </span>
            <select
              value={activeSessionId}
              onChange={(e) => {
                setActiveSessionId(e.target.value);
                onSessionChange(e.target.value);
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer py-0.5"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreatingSession(true)}
              title="Start new session"
              className="text-indigo-400 hover:text-indigo-300 ml-1 p-0.5"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop Undo Button */}
          <button
            onClick={onUndoLast}
            disabled={!canUndo}
            title="Undo last entered result"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Undo Last</span>
          </button>
        </div>
      </div>

      {/* New Session Dialog Modal */}
      {isCreatingSession && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">
              Start New Session
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Starting a new session organizes your results without deleting previous session history.
            </p>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Session Name:
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Evening Session #1"
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSession(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
