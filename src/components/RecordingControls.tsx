import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Pause, ShieldCheck, Sparkles, AlertCircle, FileAudio, MapPin } from 'lucide-react';
import { AudioConfig, GeoLocationData } from '../types/recorder';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  config: AudioConfig;
  recordedBytesEstimate: number;
  liveTranscript: string;
  onClearTranscript: () => void;
  liveLocation?: GeoLocationData | null;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  config,
  recordedBytesEstimate,
  liveTranscript,
  onClearTranscript,
  liveLocation
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (isRecording && !isPaused) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = performance.now() - elapsedMs;
      } else if (pausedTimeRef.current > 0) {
        startTimeRef.current += performance.now() - pausedTimeRef.current;
        pausedTimeRef.current = 0;
      }
      interval = setInterval(() => {
        setElapsedMs(performance.now() - startTimeRef.current);
      }, 50);
    } else if (isPaused) {
      pausedTimeRef.current = performance.now();
    } else {
      setElapsedMs(0);
      startTimeRef.current = 0;
      pausedTimeRef.current = 0;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // Format MM:SS.SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      {/* Primary Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Timer & Size Display */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">ELAPSED TIME</span>
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
              {formatTime(elapsedMs)}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400">FILE ESTIMATE</span>
            <div className="font-mono text-xl sm:text-2xl font-semibold text-slate-300 tabular-nums">
              {formatSize(recordedBytesEstimate)}
            </div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            isPaused ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-800 rounded-full text-amber-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>PAUSED</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-800 rounded-full text-red-400 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>RECORDING ACTIVE</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>STANDBY</span>
            </div>
          )}

          {config.gpsTaggingEnabled && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] font-mono">
              <MapPin className={`w-3.5 h-3.5 ${liveLocation ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span className={liveLocation ? 'text-emerald-400' : 'text-amber-400'}>
                {liveLocation
                  ? (liveLocation.placeName || `${liveLocation.latitude.toFixed(3)}°, ${liveLocation.longitude.toFixed(3)}°`)
                  : (isRecording ? 'ACQUIRING GPS...' : 'GPS ARMED')}
              </span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>WAKELOCK LOCKED</span>
          </div>
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        {!isRecording ? (
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-3 px-8 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
            <span className="text-base tracking-wide">ONE-TAP RECORD</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={onStop}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-red-600 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop & Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Live Speech-to-Text Transcription Preview Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Speech-to-Text Transcription Preview</span>
          </div>
          {liveTranscript && (
            <button
              onClick={onClearTranscript}
              className="text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="min-h-12 max-h-24 overflow-y-auto text-xs font-normal text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/60 leading-relaxed select-text">
          {liveTranscript ? (
            <span className="text-slate-100">{liveTranscript}</span>
          ) : (
            <span className="text-slate-500 italic">
              {isRecording
                ? 'Listening... Speak into microphone for live transcription preview.'
                : 'Speech-to-text transcript will appear here in real time during recording sessions.'}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Target Engine: {config.format.toUpperCase()} · {config.sampleRate}Hz · {config.channels === 1 ? 'Mono' : 'Stereo'}</span>
          <span>Local IndexedDB & Cloud Sync Queue Ready</span>
        </div>
      </div>
    </div>
  );
};
