import React from 'react';
import { Mic, BookOpen, Download, Radio, Cloud, Code2, ShieldCheck } from 'lucide-react';

interface TopBarProps {
  activeTab: 'studio' | 'library' | 'capstone' | 'clouds';
  setActiveTab: (tab: 'studio' | 'library' | 'capstone' | 'clouds') => void;
  onOpenUserGuide: () => void;
  onOpenInstallation: () => void;
  recordingCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUserGuide,
  onOpenInstallation,
  recordingCount
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20">
          <Mic className="w-4 h-4" />
        </div>
        <button
          onClick={() => setActiveTab('studio')}
          className="text-base font-bold tracking-tight text-white hover:text-red-400 transition-colors whitespace-nowrap shrink-0 text-left"
        >
          KBT_Recorder
        </button>
        <span className="text-xs text-slate-400 hidden sm:inline">PRO STUDIO</span>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'studio' ? 'text-red-400 font-semibold' : ''
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Studio Console</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'library' ? 'text-red-400 font-semibold' : ''
          }`}
        >
          <span>Vault Library</span>
          {recordingCount > 0 && (
            <span className="text-xs text-slate-400">({recordingCount})</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clouds')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'clouds' ? 'text-red-400 font-semibold' : ''
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Cloud Dispatch</span>
        </button>

        <button
          onClick={() => setActiveTab('capstone')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'capstone' ? 'text-red-400 font-semibold' : ''
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Capstone Blueprints</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenUserGuide}
          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          title="Open multilingual user guide & TTS audio assistant"
        >
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>User Guide (22 Langs)</span>
        </button>

        <button
          onClick={onOpenInstallation}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-red-600/30"
          title="Install natively across Android, iOS, Windows and macOS"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Native Install</span>
        </button>
      </div>
    </header>
  );
};
