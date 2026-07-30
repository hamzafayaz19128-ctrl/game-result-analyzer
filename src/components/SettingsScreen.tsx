import React, { useState, useEffect } from 'react';
import { WheelConfig, DiceConfig, PayoutMultipliers } from '../types/game';
import {
  saveWheelConfig,
  saveDiceConfig,
  savePayoutMultipliers,
  clearGameData,
  clearAllResults,
  removeDemoData,
  seedSampleData,
  hasDemoData,
} from '../utils/storage';
import {
  Settings,
  ShieldAlert,
  Sparkles,
  Check,
  Globe,
  Sliders,
  Trash2,
  AlertTriangle,
  Database,
  Coins,
  Disc,
  CircleDot,
  Dices,
  RotateCcw,
  Percent,
  Download,
  Smartphone,
} from 'lucide-react';

interface SettingsScreenProps {
  wheelConfig: WheelConfig;
  onUpdateWheelConfig: (config: WheelConfig) => void;
  diceConfig: DiceConfig;
  onUpdateDiceConfig: (config: DiceConfig) => void;
  multipliers: PayoutMultipliers;
  onUpdateMultipliers: (m: PayoutMultipliers) => void;
  onRefresh: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  wheelConfig,
  onUpdateWheelConfig,
  diceConfig,
  onUpdateDiceConfig,
  multipliers,
  onUpdateMultipliers,
  onRefresh,
}) => {
  const [blueGreenInput, setBlueGreenInput] = useState(
    wheelConfig.blueGreenName || 'Blue/Green Diamond'
  );
  const [redSegInput, setRedSegInput] = useState<string>(
    wheelConfig.redSegments !== undefined ? wheelConfig.redSegments.toString() : '1'
  );
  const [blueSegInput, setBlueSegInput] = useState<string>(
    wheelConfig.blueSegments !== undefined ? wheelConfig.blueSegments.toString() : '1'
  );
  const [boxSegInput, setBoxSegInput] = useState<string>(
    wheelConfig.boxSegments !== undefined ? wheelConfig.boxSegments.toString() : '1'
  );

  // Multipliers Form State
  const [multState, setMultState] = useState<PayoutMultipliers>(multipliers);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'App is ready for standalone use! Select "Add to Home screen" from your browser menu.'
      );
    }
  };

  // Confirmation modal state for Data Management
  const [confirmTarget, setConfirmTarget] = useState<
    'coin' | 'roulette' | 'wheel' | 'dice' | 'all' | 'removeDemo' | null
  >(null);

  const handleSaveWheelSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WheelConfig = {
      ...wheelConfig,
      blueGreenName: blueGreenInput.trim() || 'Blue/Green Diamond',
      redSegments: parseInt(redSegInput, 10) || 0,
      blueSegments: parseInt(blueSegInput, 10) || 0,
      boxSegments: parseInt(boxSegInput, 10) || 0,
    };
    saveWheelConfig(updated);
    onUpdateWheelConfig(updated);
    showSaveToast('Wheel custom configuration saved!');
  };

  const handleSaveMultipliers = (e: React.FormEvent) => {
    e.preventDefault();
    savePayoutMultipliers(multState);
    onUpdateMultipliers(multState);
    showSaveToast('Payout multipliers saved successfully!');
  };

  const showSaveToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3500);
  };

  const handleConfirmAction = () => {
    if (!confirmTarget) return;

    if (confirmTarget === 'coin') {
      clearGameData('coin');
      showSaveToast('Coin data cleared successfully.');
    } else if (confirmTarget === 'roulette') {
      clearGameData('roulette');
      showSaveToast('Roulette data cleared successfully.');
    } else if (confirmTarget === 'wheel') {
      clearGameData('wheel');
      showSaveToast('Wheel data cleared successfully.');
    } else if (confirmTarget === 'dice') {
      clearGameData('dice');
      showSaveToast('Dice data cleared successfully.');
    } else if (confirmTarget === 'all') {
      clearAllResults();
      showSaveToast('All game data cleared successfully.');
    } else if (confirmTarget === 'removeDemo') {
      removeDemoData();
      showSaveToast('Demo data removed successfully.');
    }

    setConfirmTarget(null);
    onRefresh();
  };

  const handleLoadDemo = () => {
    seedSampleData();
    onRefresh();
    showSaveToast('Demo data loaded (35 records per game).');
  };

  const demoDataActive = hasDemoData();

  return (
    <div className="space-y-6 text-slate-100 p-4 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Application Settings & Data Management</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure game labels, manage local stored records, and review statistical guidelines.
        </p>
      </div>

      {/* PWA Install Mobile App Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-700/60 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span className="font-extrabold text-sm text-white">
              Install Standalone Mobile App
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Add to home screen for fast, offline-capable, fullscreen experience on Android.
          </p>
        </div>
        <button
          onClick={handleInstallPWA}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 shrink-0 active:scale-95 transition-all min-h-[48px]"
        >
          <Download className="w-4 h-4" />
          <span>Install App</span>
        </button>
      </div>
      {savedMessage && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{savedMessage}</span>
          </div>
          <button onClick={() => setSavedMessage(null)} className="text-emerald-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* DATA MANAGEMENT SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-400" />
            <span>Data Management</span>
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
            Local Storage Control
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Clear records for individual games or wipe all data. Every clear action prompts a confirmation dialog before deleting.
        </p>

        {/* Clear Game Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => setConfirmTarget('coin')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-800 text-slate-200 hover:text-red-300 text-xs font-semibold transition-all shadow-sm"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Clear Coin Data</span>
          </button>

          <button
            onClick={() => setConfirmTarget('roulette')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-800 text-slate-200 hover:text-red-300 text-xs font-semibold transition-all shadow-sm"
          >
            <Disc className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Clear Roulette Data</span>
          </button>

          <button
            onClick={() => setConfirmTarget('wheel')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-800 text-slate-200 hover:text-red-300 text-xs font-semibold transition-all shadow-sm"
          >
            <CircleDot className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>Clear Wheel Data</span>
          </button>

          <button
            onClick={() => setConfirmTarget('dice')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-800 text-slate-200 hover:text-red-300 text-xs font-semibold transition-all shadow-sm"
          >
            <Dices className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Clear Dice Data</span>
          </button>
        </div>

        {/* Clear All & Demo Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setConfirmTarget('all')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/70 border border-red-700/80 text-red-300 hover:bg-red-900/80 font-bold text-xs transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Clear All Data</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/80 font-bold text-xs transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Load Demo Data</span>
            </button>

            {demoDataActive && (
              <button
                onClick={() => setConfirmTarget('removeDemo')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-950/70 border border-amber-700/80 text-amber-300 hover:bg-amber-900/80 font-bold text-xs transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Remove Demo Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WHEEL CUSTOMIZATION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-pink-400" />
          <span>Wheel Custom Configuration & Segment Counts</span>
        </h3>
        <p className="text-xs text-slate-400">
          Configure custom label and segment counts to calculate accurate theoretical probabilities.
        </p>
        <form onSubmit={handleSaveWheelSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Outcome Name:
            </label>
            <input
              type="text"
              value={blueGreenInput}
              onChange={(e) => setBlueGreenInput(e.target.value)}
              placeholder="e.g. Cyan Diamond or Green Gem"
              className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Red Segments:</label>
              <input
                type="number"
                min="0"
                value={redSegInput}
                onChange={(e) => setRedSegInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Blue/Green Segments:</label>
              <input
                type="number"
                min="0"
                value={blueSegInput}
                onChange={(e) => setBlueSegInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Box Segments:</label>
              <input
                type="number"
                min="0"
                value={boxSegInput}
                onChange={(e) => setBoxSegInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
          >
            Save Wheel Config
          </button>
        </form>
      </div>

      {/* EDITABLE PAYOUT MULTIPLIERS CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-400" />
          <span>Editable Payout Multipliers (Odds & Break-Even)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Set custom payout multipliers for each game outcome to evaluate break-even probabilities and Expected Value (EV).
        </p>

        <form onSubmit={handleSaveMultipliers} className="space-y-4">
          {/* Coin multipliers */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Coin Flip Multipliers</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Red Payout (e.g. 2.0x):</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.coin.RED}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      coin: { ...multState.coin, RED: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Green Payout (e.g. 2.0x):</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.coin.GREEN}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      coin: { ...multState.coin, GREEN: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Dice multipliers */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5" />
              <span>Dice Multipliers</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Under 50 Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.dice.UNDER_50}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      dice: { ...multState.dice, UNDER_50: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Over 50 Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.dice.OVER_50}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      dice: { ...multState.dice, OVER_50: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Wheel multipliers */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-pink-300 flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5" />
              <span>Wheel Multipliers</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Red/Pink Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.wheel.RED_PINK_DIAMOND}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      wheel: {
                        ...multState.wheel,
                        RED_PINK_DIAMOND: parseFloat(e.target.value) || 3.0,
                      },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Blue/Green Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.wheel.BLUE_GREEN_DIAMOND}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      wheel: {
                        ...multState.wheel,
                        BLUE_GREEN_DIAMOND: parseFloat(e.target.value) || 3.0,
                      },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Box Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.wheel.BOX}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      wheel: { ...multState.wheel, BOX: parseFloat(e.target.value) || 3.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Roulette multipliers */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5" />
              <span>Roulette Multipliers</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Single Num (1–12):</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={multState.roulette.number}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      roulette: { ...multState.roulette, number: parseFloat(e.target.value) || 12.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Red / Black Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.roulette.color}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      roulette: { ...multState.roulette, color: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Small / Large Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.roulette.size}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      roulette: { ...multState.roulette, size: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Even / Odd Payout:</label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={multState.roulette.parity}
                  onChange={(e) =>
                    setMultState({
                      ...multState,
                      roulette: { ...multState.roulette, parity: parseFloat(e.target.value) || 2.0 },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-sm"
          >
            Save Payout Multipliers
          </button>
        </form>
      </div>

      {/* RESPONSIBLE USE NOTICE & STATISTICAL DISCLAIMER */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-3">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <span>RESPONSIBLE USE & STATISTICAL NOTICE</span>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
          <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-xl font-mono text-amber-200 font-bold">
            IMPORTANT LABEL: "Historical tendency — not a guaranteed prediction."
          </div>

          <p>
            <strong>1. Independent Probability:</strong> In fair, random game setups (such as coin flips or roulette spins), past historical results have <em>no memory</em> and strictly zero influence on future trials (Gambler's Fallacy awareness).
          </p>

          <p>
            <strong>2. Purpose of Laplace Smoothing:</strong> The statistical calculations in this app estimate smoothed sample shares purely as descriptive metrics of your recorded dataset. They do not predict, guarantee, or influence future random outcomes.
          </p>

          <p>
            <strong>3. 100% Offline & Private:</strong> This application operates entirely offline in your device local storage with no internet permissions, no external server connections, and no affiliation with external gambling operators.
          </p>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <h4 className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>Responsible Statistical Usage Guideline:</span>
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              This application is designed solely to record past outcome history and visualize descriptive statistical tendencies. No past trend or historical probability can guarantee future outcomes. Every new flip, spin, or draw remains entirely independent and random.
            </p>
          </div>
        </div>
      </div>

      {/* DATA CLEAR CONFIRMATION MODAL */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-lg">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
              <span>
                {confirmTarget === 'coin' && 'Clear Coin Data?'}
                {confirmTarget === 'roulette' && 'Clear Roulette Data?'}
                {confirmTarget === 'wheel' && 'Clear Wheel Data?'}
                {confirmTarget === 'dice' && 'Clear Dice Data?'}
                {confirmTarget === 'all' && 'Clear All Game Data?'}
                {confirmTarget === 'removeDemo' && 'Remove Demo Data?'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmTarget === 'coin' &&
                'Are you sure you want to delete all recorded Coin Flip results? This action cannot be undone.'}
              {confirmTarget === 'roulette' &&
                'Are you sure you want to delete all recorded Mini Roulette results? This action cannot be undone.'}
              {confirmTarget === 'wheel' &&
                'Are you sure you want to delete all recorded Wheel Sector results? This action cannot be undone.'}
              {confirmTarget === 'dice' &&
                'Are you sure you want to delete all recorded Dice results? This action cannot be undone.'}
              {confirmTarget === 'all' &&
                'Are you sure you want to permanently delete all game records across all games? This action cannot be undone.'}
              {confirmTarget === 'removeDemo' &&
                'Are you sure you want to remove all demo sample records? Your genuine user entries will remain safe.'}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 shadow-md transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

