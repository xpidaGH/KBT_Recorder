import React, { useEffect } from 'react';
import { X, Check, Palette, Sparkles, BookOpen, Terminal, Heart, Moon, Zap } from 'lucide-react';
import { ThemeId, ThemeConfig } from '../types/theme';
import { THEMES } from '../utils/themeManager';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'editorial':
        return <BookOpen className="w-4 h-4 text-amber-700" />;
      case 'technical':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'warm':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-lime-400" />;
      case 'vibrant':
        return <Zap className="w-4 h-4 text-fuchsia-400" />;
    }
  };

  const handleSelect = (themeId: ThemeId) => {
    onSelectTheme(themeId);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Theme Settings</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60 font-mono">
                  5 Variations
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                Choose a visual theme variation to dynamically alter backgrounds, fonts, borders, and accent colors
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3.5">
          {THEMES.map((theme: ThemeConfig) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                  isSelected
                    ? 'bg-slate-800/90 border-lime-500 shadow-md shadow-lime-950/20 ring-1 ring-lime-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                {/* Left side: Icon, Title, Description, and Typography */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                      isSelected
                        ? 'bg-lime-950/60 border-lime-500/50 text-lime-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {getThemeIcon(theme.id)}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white group-hover:text-lime-300 transition-colors">
                        {theme.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-900 text-slate-400 border border-slate-800">
                        {theme.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {theme.description}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                      <span>Typography: <span className="text-slate-200">{theme.typography}</span></span>
                    </div>
                  </div>
                </div>

                {/* Right side: Palette swatches & Select Checkmark */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 rounded-lg border border-slate-800" title="Palette preview">
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.previewColors.bg }}
                      title={`Background: ${theme.previewColors.bg}`}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.previewColors.card }}
                      title={`Card: ${theme.previewColors.card}`}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.previewColors.accent }}
                      title={`Accent: ${theme.previewColors.accent}`}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.previewColors.border }}
                      title={`Border: ${theme.previewColors.border}`}
                    />
                  </div>

                  {/* Active / Selection Badge */}
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-lime-500 text-slate-950 font-bold shadow-sm shadow-lime-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-slate-600'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Active</span>
                      </>
                    ) : (
                      <span>Select</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span>Theme choice is instantly applied and saved to local storage.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
