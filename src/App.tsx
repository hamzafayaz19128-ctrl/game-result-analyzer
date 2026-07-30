import React, { useState, useEffect } from 'react';
import { GameResult, GameSession, WheelConfig, DiceConfig, PayoutMultipliers } from './types/game';
import {
  getStoredResults,
  getStoredSessions,
  getActiveSessionId,
  getWheelConfig,
  getDiceConfig,
  getPayoutMultipliers,
  undoLastResult,
  seedSampleData,
} from './utils/storage';

import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar, MainTabType } from './components/BottomNavBar';
import { RecordSection } from './components/RecordSection';
import { AnalysisSection } from './components/AnalysisSection';
import { PatternsScreen } from './components/PatternsScreen';
import { HistoryAndDataScreen } from './components/HistoryAndDataScreen';
import { SettingsScreen } from './components/SettingsScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('record');
  const [activeSessionId, setActiveSessionId] = useState<string>(getActiveSessionId());
  const [results, setResults] = useState<GameResult[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [wheelConfig, setWheelConfig] = useState<WheelConfig>(getWheelConfig());
  const [diceConfig, setDiceConfig] = useState<DiceConfig>(getDiceConfig());
  const [multipliers, setMultipliers] = useState<PayoutMultipliers>(getPayoutMultipliers());

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshState = () => {
    setResults(getStoredResults());
    setSessions(getStoredSessions());
    setActiveSessionId(getActiveSessionId());
    setWheelConfig(getWheelConfig());
    setDiceConfig(getDiceConfig());
    setMultipliers(getPayoutMultipliers());
  };

  useEffect(() => {
    refreshState();

    // Preserve app state when switching background / foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleUndo = () => {
    const undone = undoLastResult();
    refreshState();
    if (undone) {
      showToast(`Undone last result: ${undone.outcome}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Header Controls */}
      <HeaderBar
        activeSessionId={activeSessionId}
        onSessionChange={(sid) => {
          setActiveSessionId(sid);
          refreshState();
        }}
        onUndoLast={handleUndo}
        canUndo={results.length > 0}
      />

      {/* Main Container Wrapper */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-2 px-1 sm:px-4 flex justify-center">
        <div className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between my-1 relative min-h-[780px]">

          {/* Toast Notification Popup */}
          {toastMessage && (
            <div className="mx-4 mt-2 p-3 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg animate-bounce flex items-center justify-between z-30">
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-indigo-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Active Tab Screen Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'record' && (
              <RecordSection
                results={results}
                activeSessionId={activeSessionId}
                wheelConfig={wheelConfig}
                diceConfig={diceConfig}
                multipliers={multipliers}
                onUpdateWheelConfig={setWheelConfig}
                onUpdateDiceConfig={setDiceConfig}
                onRefresh={refreshState}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisSection
                results={results}
                activeSessionId={activeSessionId}
                wheelConfig={wheelConfig}
                diceConfig={diceConfig}
                multipliers={multipliers}
              />
            )}

            {activeTab === 'patterns' && (
              <PatternsScreen
                results={results}
                activeSessionId={activeSessionId}
                wheelConfig={wheelConfig}
              />
            )}

            {activeTab === 'history' && (
              <HistoryAndDataScreen
                results={results}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onRefresh={refreshState}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                wheelConfig={wheelConfig}
                onUpdateWheelConfig={setWheelConfig}
                diceConfig={diceConfig}
                onUpdateDiceConfig={setDiceConfig}
                multipliers={multipliers}
                onUpdateMultipliers={setMultipliers}
                onRefresh={refreshState}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Material 3 Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
