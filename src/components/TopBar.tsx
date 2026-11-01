import React from 'react';
import { BookOpen, Download, Radio, Cloud, Code2, Palette } from 'lucide-react';
import { KbtBrandLogo } from './KbtBrandLogo';
import { ThemeId } from '../types/theme';

interface TopBarProps {
  activeTab: 'studio' | 'library' | 'capstone' | 'clouds';
  setActiveTab: (tab: 'studio' | 'library' | 'capstone' | 'clouds') => void;
  onOpenUserGuide: () => void;
  onOpenInstallation: () => void;
  onOpenThemeSettings: () => void;
  recordingCount: number;
  currentTheme?: ThemeId;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUserGuide,
  onOpenInstallation,
  onOpenThemeSettings,
  recordingCount,
  currentTheme = 'dark'
}) => {
  return (
    <header className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none">
      {/* Zone 1: Brand Logo & Wordmark (Web Header Bar Use Case) */}
      <div className="flex items-center gap-3 shrink-0">
        <KbtBrandLogo
          useCase="web-header"
          onClick={() => setActiveTab('studio')}
          altText="KBT_Recorder Web Header Brand Logo"
        />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('studio')}
              className="text-base font-bold tracking-tight text-white hover:text-lime-400 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
            >
              KBT_Recorder
            </button>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-lime-950/80 text-lime-400 border border-lime-800/80 font-mono font-medium hidden sm:inline">
              PRO STUDIO
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            Multi-Platform Audio & DSP Architecture
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'studio' ? 'text-lime-400 font-semibold' : ''
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Studio Console</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'library' ? 'text-lime-400 font-semibold' : ''
          }`}
        >
          <span>Vault Library</span>
          {recordingCount > 0 && (
            <span className="text-xs text-slate-400 font-mono">({recordingCount})</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clouds')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'clouds' ? 'text-lime-400 font-semibold' : ''
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Cloud Dispatch</span>
        </button>

        <button
          onClick={() => setActiveTab('capstone')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'capstone' ? 'text-lime-400 font-semibold' : ''
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Capstone Blueprints</span>
        </button>
      </nav>

      {/* Zone 3: Actions Cluster with Theme Settings Button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Settings Button */}
        <button
          onClick={onOpenThemeSettings}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/90 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs group"
          title="Change UI Theme Variation (5 Variations)"
        >
          <Palette className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Theme Settings</span>
          <span className="sm:hidden">Theme</span>
          <span className="text-[10px] text-slate-400 font-mono capitalize hidden md:inline">
            ({currentTheme})
          </span>
        </button>

        <button
          onClick={onOpenUserGuide}
          className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 items-center gap-1.5 cursor-pointer"
          title="Open multilingual user guide & TTS audio assistant"
        >
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>User Guide</span>
        </button>

        <button
          onClick={onOpenInstallation}
          className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
          title="Install natively across Android, iOS, Windows and macOS"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Native Install</span>
        </button>
      </div>
    </header>
  );
};
