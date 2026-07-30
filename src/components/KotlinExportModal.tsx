import React, { useState } from 'react';
import { FULL_KOTLIN_COMPOSE_SOURCE } from '../utils/kotlinSourceCode';
import { Code2, Copy, Check, Download, ShieldCheck } from 'lucide-react';

interface KotlinExportModalProps {}

export const KotlinExportModal: React.FC<KotlinExportModalProps> = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(FULL_KOTLIN_COMPOSE_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([FULL_KOTLIN_COMPOSE_SOURCE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MainActivity.kt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-100 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-400" />
            <span>Android Jetpack Compose Source Code</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete ready-to-compile Android Studio source file with Room database and Material 3 UI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download .kt</span>
          </button>
        </div>
      </div>

      {/* Code Details Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Includes Full Architecture:</span>
        </div>
        <ul className="list-disc list-inside text-slate-300 space-y-1 font-mono text-[11px]">
          <li>Kotlin + Jetpack Compose Material 3 UI</li>
          <li>Room Database Entity, DAO, and Repository (@Entity, @Dao)</li>
          <li>MVVM Architecture with StateFlow & ViewModel</li>
          <li>Laplace Smoothing & Statistical Transition Engine</li>
          <li>Offline & zero internet permissions</li>
        </ul>
      </div>

      {/* Code Container Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800 font-mono">
          <span>com.example.gameresultanalyzer/MainActivity.kt</span>
          <span>Kotlin / Jetpack Compose</span>
        </div>
        <pre className="text-xs font-mono text-indigo-200 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed p-2">
          {FULL_KOTLIN_COMPOSE_SOURCE}
        </pre>
      </div>
    </div>
  );
};
