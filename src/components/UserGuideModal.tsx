import React, { useEffect, useState } from 'react';
import { LANGUAGE_GUIDES, LanguageGuide } from '../data/translations';
import {
  X,
  BookOpen,
  Volume2,
  Play,
  Pause,
  Square,
  Globe,
  Sliders,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);

  const guide: LanguageGuide = LANGUAGE_GUIDES[selectedLang] || LANGUAGE_GUIDES.en;

  // Load available system voices for speech synthesis
  useEffect(() => {
    function loadVoices() {
      if ('speechSynthesis' in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      }
    }

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // When language changes, find the closest matching voice
  useEffect(() => {
    if (voices.length > 0) {
      const langPrefix = guide.bcp47.split('-')[0].toLowerCase();
      const matched = voices.find(
        (v) => v.lang.toLowerCase() === guide.bcp47.toLowerCase()
      ) || voices.find(
        (v) => v.lang.toLowerCase().startsWith(langPrefix)
      ) || voices[0];

      setSelectedVoice(matched || null);
    }

    // Stop speaking if playing when language changes
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [selectedLang, voices, guide.bcp47]);

  // Clean up speech synthesis when modal closes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // TTS Controls
  const handlePlayTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('SpeechSynthesis is not supported in this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(guide.ttsSpeechText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.lang = guide.bcp47;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseTTS = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const handleStopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Filter voices that match the selected language
  const filteredVoices = voices.filter((v) => {
    const langPrefix = guide.bcp47.split('-')[0].toLowerCase();
    return v.lang.toLowerCase().startsWith(langPrefix);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-white">Interactive User Guide & TTS Assistant</h2>
              <span className="text-xs text-slate-400">Available across 22 International Languages</span>
            </div>
          </div>

          <button
            onClick={() => {
              handleStopTTS();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selector & TTS Player Bar */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Language Dropdown */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Language:</span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {Object.values(LANGUAGE_GUIDES).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nativeName} ({g.name})
                </option>
              ))}
            </select>
          </div>

          {/* TTS Player Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {!isSpeaking || isPaused ? (
                <button
                  onClick={handlePlayTTS}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Speak Guide Aloud (TTS)"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPaused ? 'Resume TTS' : 'Listen (TTS)'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseTTS}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Pause Speech"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleStopTTS}
                disabled={!isSpeaking && !isPaused}
                className="p-1.5 text-slate-400 hover:text-white rounded disabled:opacity-30 transition-colors cursor-pointer"
                title="Stop Speech"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speaking visualizer */}
            {isSpeaking && (
              <div className="flex items-center gap-1 px-2">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] font-mono text-red-400 ml-1">VOICE ACTIVE</span>
              </div>
            )}

            {/* Voice Details */}
            {filteredVoices.length > 0 && (
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const v = voices.find((vox) => vox.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="hidden lg:block bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 max-w-[180px] truncate"
              >
                {filteredVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scrollable Guide Content */}
        <div
          className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6"
          dir={guide.dir}
        >
          {/* Header Title */}
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {guide.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              {guide.summary}
            </p>
          </div>

          {/* Guide Sections */}
          <div className="grid grid-cols-1 gap-6">
            {guide.sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 flex flex-col gap-2"
              >
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>{section.title}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pl-3.5">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Cross-Browser Support Note */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex flex-col gap-1.5">
            <span className="font-semibold text-slate-200">Native Audio & Browser Compatibility:</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              KBT_Recorder utilizes native browser Web Audio API, ScriptProcessor / AudioWorklet buffers, and Web Speech Synthesis. Audio playback and recording maintain continuous execution in background tabs and mobile webviews when screen wake-lock is acquired.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>Language: {guide.nativeName} ({guide.bcp47})</span>
          <button
            onClick={() => {
              handleStopTTS();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
