import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RecordingItem, AudioID3Metadata, DSPSettings } from '../types/recorder';
import {
  X,
  Play,
  Pause,
  Scissors,
  Volume2,
  Save,
  RotateCcw,
  FastForward,
  Rewind,
  Clock,
  Tag,
  Music,
  User,
  Calendar,
  FileText,
  Check,
  Plus,
  Sliders,
  CheckCircle2,
  Bookmark,
  Layers,
  Sparkles,
  Hash,
  Trash2,
  ArrowRight,
  Disc,
  Filter,
  VolumeX,
  Wand2
} from 'lucide-react';
import { encodeWAV } from '../utils/audioEngine';
import { DSPFilterPanel } from './DSPFilterPanel';
import { DEFAULT_DSP_SETTINGS, renderDSPAudioBuffer } from '../utils/dspEngine';

interface AudioEditorModalProps {
  item: RecordingItem | null;
  onClose: () => void;
  onSaveTrimmed: (newItem: RecordingItem) => void;
  onUpdateItem?: (updatedItem: RecordingItem) => void;
  initialTab?: 'audio' | 'dsp' | 'metadata';
}

export const AudioEditorModal: React.FC<AudioEditorModalProps> = ({
  item,
  onClose,
  onSaveTrimmed,
  onUpdateItem,
  initialTab = 'audio'
}) => {
  if (!item || !item.blob) return null;

  const [activeTab, setActiveTab] = useState<'audio' | 'dsp' | 'metadata'>(initialTab);

  // Audio Playback & Trim States
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Current scrubbed playhead position (seconds)
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(item.duration);
  const [gainBoostDb, setGainBoostDb] = useState(0); // -12 to +12 dB
  const [isProcessing, setIsProcessing] = useState(false);

  // Hover and dragging states for interactive scrubbing
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Metadata & Tagging States
  const [editFileName, setEditFileName] = useState(item.name);
  const [title, setTitle] = useState(item.metadata?.title || item.name.replace(/\.[^/.]+$/, ''));
  const [artist, setArtist] = useState(item.metadata?.artist || '');
  const [album, setAlbum] = useState(item.metadata?.album || '');
  const [year, setYear] = useState(item.metadata?.year || new Date().getFullYear().toString());
  const [genre, setGenre] = useState(item.metadata?.genre || 'Speech');
  const [track, setTrack] = useState(item.metadata?.track || '1');
  const [comment, setComment] = useState(item.metadata?.comment || '');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [metadataFeedback, setMetadataFeedback] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // DSP Filter Settings State
  const [dspSettings, setDspSettings] = useState<DSPSettings>(item.dspFilters || DEFAULT_DSP_SETTINGS);
  const [isPlayingCleanPreview, setIsPlayingCleanPreview] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const cleanPreviewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveHpFilterRef = useRef<BiquadFilterNode | null>(null);
  const liveLpFilterRef = useRef<BiquadFilterNode | null>(null);
  const liveGainRef = useRef<GainNode | null>(null);
  const playheadAnimRef = useRef<number | null>(null);
  const playbackStartCtxTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);

  // Sync state if item or initialTab changes
  useEffect(() => {
    if (item) {
      setEditFileName(item.name);
      setTitle(item.metadata?.title || item.name.replace(/\.[^/.]+$/, ''));
      setArtist(item.metadata?.artist || '');
      setAlbum(item.metadata?.album || '');
      setYear(item.metadata?.year || new Date().getFullYear().toString());
      setGenre(item.metadata?.genre || 'Speech');
      setTrack(item.metadata?.track || '1');
      setComment(item.metadata?.comment || '');
      setTags(item.tags || []);
      setNewTagInput('');
      setMetadataFeedback(null);
      setHasUnsavedChanges(false);
      setDspSettings(item.dspFilters || DEFAULT_DSP_SETTINGS);
    }
  }, [item]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Format MM:SS.ss
  const formatTime = (seconds: number) => {
    const clamped = Math.max(0, seconds);
    const mins = Math.floor(clamped / 60);
    const secs = Math.floor(clamped % 60);
    const centis = Math.floor((clamped % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  // Decode audio blob into AudioBuffer
  useEffect(() => {
    let cancelled = false;
    async function decode() {
      if (!item?.blob) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      try {
        const arrayBuf = await item.blob.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuf);
        if (!cancelled) {
          setAudioBuffer(decoded);
          setStartSec(0);
          setEndSec(decoded.duration);
          setCurrentTime(0);
        }
      } catch (err) {
        console.error('Failed to decode audio data:', err);
      }
    }
    decode();
    return () => {
      cancelled = true;
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (e) { /* ignore */ }
      }
      if (cleanPreviewSourceRef.current) {
        try { cleanPreviewSourceRef.current.stop(); } catch (e) { /* ignore */ }
      }
      if (playheadAnimRef.current) cancelAnimationFrame(playheadAnimRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [item]);

  // Real-time playhead animation loop when playing
  useEffect(() => {
    if (!isPlaying || !audioBuffer || !audioContextRef.current) {
      if (playheadAnimRef.current) {
        cancelAnimationFrame(playheadAnimRef.current);
        playheadAnimRef.current = null;
      }
      return;
    }

    const ctx = audioContextRef.current;
    const startOffset = playbackStartOffsetRef.current;
    const startCtxTime = playbackStartCtxTimeRef.current;

    const tick = () => {
      const elapsed = ctx.currentTime - startCtxTime;
      const current = startOffset + elapsed;

      if (current >= endSec || current >= audioBuffer.duration) {
        setCurrentTime(endSec);
        setIsPlaying(false);
        if (activeSourceRef.current) {
          try { activeSourceRef.current.stop(); } catch (e) { /* ignore */ }
          activeSourceRef.current = null;
        }
        return;
      }

      setCurrentTime(current);
      playheadAnimRef.current = requestAnimationFrame(tick);
    };

    playheadAnimRef.current = requestAnimationFrame(tick);
    return () => {
      if (playheadAnimRef.current) cancelAnimationFrame(playheadAnimRef.current);
    };
  }, [isPlaying, endSec, audioBuffer]);

  // Draw Waveform and Playhead on Canvas
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const totalDuration = audioBuffer.duration;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // Draw grid horizontal center line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Draw waveform bars
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Highlight active trim selection [startSec to endSec]
    const startX = (startSec / totalDuration) * width;
    const endX = (endSec / totalDuration) * width;

    // Dim regions outside selection
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

    // Subtle tint over active selection
    ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.fillRect(startX, 0, endX - startX, height);

    // Draw Start Marker [A (Red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // Start flag handle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX + 10, 0);
    ctx.lineTo(startX, 12);
    ctx.fill();

    // Draw End Marker B] (Green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // End flag handle
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX - 10, 0);
    ctx.lineTo(endX, 12);
    ctx.fill();

    // Draw Scrubbing Playhead (Bright Amber Needle)
    const playheadX = (currentTime / totalDuration) * width;
    ctx.strokeStyle = '#fbbf24'; // Amber-400
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Playhead diamond handle at top
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX + 6, 7);
    ctx.lineTo(playheadX, 14);
    ctx.lineTo(playheadX - 6, 7);
    ctx.closePath();
    ctx.fill();

    // Draw Hover Marker if hovering
    if (hoverX !== null && hoverTime !== null) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [audioBuffer, startSec, endSec, currentTime, hoverX, hoverTime]);

  // Draw Timeline Ruler with precise time marks
  useEffect(() => {
    if (!audioBuffer || !timelineCanvasRef.current) return;
    const canvas = timelineCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const totalDuration = audioBuffer.duration;

    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Choose tick interval based on duration
    let majorInterval = 1; // 1s default
    if (totalDuration > 60) majorInterval = 10;
    else if (totalDuration > 30) majorInterval = 5;
    else if (totalDuration > 10) majorInterval = 2;
    else if (totalDuration > 5) majorInterval = 1;
    else majorInterval = 0.5;

    const minorInterval = majorInterval / 5;

    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    // Top border line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.stroke();

    // Minor ticks
    for (let t = 0; t <= totalDuration; t += minorInterval) {
      const x = (t / totalDuration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 4);
      ctx.stroke();
    }

    // Major ticks & labels
    for (let t = 0; t <= totalDuration; t += majorInterval) {
      const x = (t / totalDuration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 9);
      ctx.stroke();

      const label = `${Math.floor(t / 60)}:${(t % 60).toFixed(0).padStart(2, '0')}`;
      ctx.fillText(label, Math.max(14, Math.min(width - 14, x)), 20);
    }

    // Playhead indicator needle on timeline ruler
    const playheadX = (currentTime / totalDuration) * width;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(playheadX - 5, 0);
    ctx.lineTo(playheadX + 5, 0);
    ctx.lineTo(playheadX, 8);
    ctx.closePath();
    ctx.fill();
  }, [audioBuffer, currentTime]);

  // Live parameter modulation: when dspSettings or gainBoostDb change during playback, update live nodes
  useEffect(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (liveHpFilterRef.current) {
      const targetHp = dspSettings.highPass.enabled && !dspSettings.bypassAll ? dspSettings.highPass.frequency : 10;
      liveHpFilterRef.current.frequency.setTargetAtTime(targetHp, now, 0.02);
      liveHpFilterRef.current.Q.setTargetAtTime(dspSettings.highPass.q, now, 0.02);
    }

    if (liveLpFilterRef.current) {
      const targetLp = dspSettings.lowPass.enabled && !dspSettings.bypassAll ? dspSettings.lowPass.frequency : 22050;
      liveLpFilterRef.current.frequency.setTargetAtTime(targetLp, now, 0.02);
      liveLpFilterRef.current.Q.setTargetAtTime(dspSettings.lowPass.q, now, 0.02);
    }

    if (liveGainRef.current) {
      const totalGainDb = gainBoostDb + (dspSettings.bypassAll ? 0 : dspSettings.outputGainDb);
      liveGainRef.current.gain.setTargetAtTime(Math.pow(10, totalGainDb / 20), now, 0.02);
    }
  }, [dspSettings, gainBoostDb]);

  // Audio start helper connecting source -> HP filter -> LP filter -> Output gain -> destination
  const startLivePlayback = useCallback((offsetSec: number) => {
    if (!audioBuffer || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) { /* ignore */ }
      activeSourceRef.current = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // High-pass filter
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    const hpFreq = dspSettings.highPass.enabled && !dspSettings.bypassAll ? dspSettings.highPass.frequency : 10;
    hp.frequency.setValueAtTime(hpFreq, ctx.currentTime);
    hp.Q.setValueAtTime(dspSettings.highPass.q, ctx.currentTime);

    // Low-pass filter
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const lpFreq = dspSettings.lowPass.enabled && !dspSettings.bypassAll ? dspSettings.lowPass.frequency : 22050;
    lp.frequency.setValueAtTime(lpFreq, ctx.currentTime);
    lp.Q.setValueAtTime(dspSettings.lowPass.q, ctx.currentTime);

    // Master Gain
    const gainNode = ctx.createGain();
    const totalGainDb = gainBoostDb + (dspSettings.bypassAll ? 0 : dspSettings.outputGainDb);
    gainNode.gain.setValueAtTime(Math.pow(10, totalGainDb / 20), ctx.currentTime);

    source.connect(hp);
    hp.connect(lp);
    lp.connect(gainNode);
    gainNode.connect(ctx.destination);

    liveHpFilterRef.current = hp;
    liveLpFilterRef.current = lp;
    liveGainRef.current = gainNode;

    const remainingDuration = Math.max(0.05, endSec - offsetSec);
    source.start(0, offsetSec, remainingDuration);
    activeSourceRef.current = source;

    playbackStartOffsetRef.current = offsetSec;
    playbackStartCtxTimeRef.current = ctx.currentTime;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      activeSourceRef.current = null;
      liveHpFilterRef.current = null;
      liveLpFilterRef.current = null;
      liveGainRef.current = null;
    };
  }, [audioBuffer, dspSettings, endSec, gainBoostDb]);

  // Jump to specific timestamp
  const jumpToTime = useCallback((targetSec: number) => {
    if (!audioBuffer) return;
    const clamped = Math.max(0, Math.min(audioBuffer.duration, targetSec));
    setCurrentTime(clamped);

    // If currently playing, restart source from new scrubbed offset with live DSP
    if (isPlaying) {
      startLivePlayback(clamped);
    }
  }, [audioBuffer, isPlaying, startLivePlayback]);

  // Handle Canvas Scrubbing Drag & Click
  const handleScrubPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const targetTime = ratio * audioBuffer.duration;
    jumpToTime(targetTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const time = ratio * audioBuffer.duration;
    setHoverX(x);
    setHoverTime(time);

    if (isDraggingPlayhead) {
      jumpToTime(time);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setHoverTime(null);
    setIsDraggingPlayhead(false);
  };

  // Play / Pause from scrub position
  const handleTogglePlay = () => {
    if (!audioBuffer || !audioContextRef.current) return;

    if (isPlaying) {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (e) { /* ignore */ }
        activeSourceRef.current = null;
      }
      setIsPlaying(false);
      liveHpFilterRef.current = null;
      liveLpFilterRef.current = null;
      liveGainRef.current = null;
      return;
    }

    // If current playhead is at or past end, wrap to startSec
    let startFrom = currentTime;
    if (startFrom >= endSec || startFrom < startSec) {
      startFrom = startSec;
      setCurrentTime(startSec);
    }

    startLivePlayback(startFrom);
  };

  // Add Custom Tag (supports multiple if comma-separated)
  const handleAddTag = (rawInput?: string) => {
    const inputToAdd = rawInput !== undefined ? rawInput : newTagInput;
    if (!inputToAdd.trim()) return;

    const parts = inputToAdd
      .split(/[,，]/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    if (parts.length === 0) return;

    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.includes(p)) {
          next.push(p);
        }
      }
      return next;
    });
    setNewTagInput('');
    setHasUnsavedChanges(true);
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  // Clear All Tags
  const handleClearAllTags = () => {
    setTags([]);
    setHasUnsavedChanges(true);
  };

  // Reset to original item metadata
  const handleResetMetadata = () => {
    if (!item) return;
    setEditFileName(item.name);
    setTitle(item.metadata?.title || item.name.replace(/\.[^/.]+$/, ''));
    setArtist(item.metadata?.artist || '');
    setAlbum(item.metadata?.album || '');
    setYear(item.metadata?.year || new Date().getFullYear().toString());
    setGenre(item.metadata?.genre || 'Speech');
    setTrack(item.metadata?.track || '1');
    setComment(item.metadata?.comment || '');
    setTags(item.tags || []);
    setNewTagInput('');
    setHasUnsavedChanges(false);
    setMetadataFeedback('Reverted all fields to originally saved values');
    setTimeout(() => setMetadataFeedback(null), 2500);
  };

  // Build ID3 metadata payload
  const buildMetadataPayload = (): AudioID3Metadata => ({
    title: title.trim() || undefined,
    artist: artist.trim() || undefined,
    album: album.trim() || undefined,
    year: year.trim() || undefined,
    genre: genre.trim() || undefined,
    comment: comment.trim() || undefined,
    track: track.trim() || undefined
  });

  // Save Metadata & Tags Directly to Item
  const handleSaveMetadataOnly = () => {
    const id3 = buildMetadataPayload();

    let finalName = editFileName.trim();
    if (!finalName) {
      finalName = item.name;
    } else if (!finalName.includes('.')) {
      finalName = `${finalName}.${item.format}`;
    }

    const updated: RecordingItem = {
      ...item,
      name: finalName,
      tags,
      metadata: id3,
      dspFilters: dspSettings
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
      setHasUnsavedChanges(false);
      setMetadataFeedback('Metadata, tags & DSP settings saved successfully to Vault!');
      setTimeout(() => setMetadataFeedback(null), 3000);
    }
  };

  // Preview / Audition Spectral Subtraction Clean Audio
  const handlePreviewSpectralClean = async () => {
    if (!audioBuffer || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    // If currently playing preview, stop it
    if (isPlayingCleanPreview) {
      if (cleanPreviewSourceRef.current) {
        try { cleanPreviewSourceRef.current.stop(); } catch (e) { /* ignore */ }
        cleanPreviewSourceRef.current = null;
      }
      setIsPlayingCleanPreview(false);
      return;
    }

    // Stop standard playback if running
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) { /* ignore */ }
      activeSourceRef.current = null;
      setIsPlaying(false);
    }

    setIsProcessing(true);
    try {
      const rendered = await renderDSPAudioBuffer(audioBuffer, dspSettings);
      const source = ctx.createBufferSource();
      source.buffer = rendered;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);

      const offset = Math.max(0, Math.min(currentTime, audioBuffer.duration));
      const dur = Math.max(0.1, (endSec || audioBuffer.duration) - offset);
      source.start(0, offset, dur);

      cleanPreviewSourceRef.current = source;
      setIsPlayingCleanPreview(true);
      setIsProcessing(false);

      source.onended = () => {
        setIsPlayingCleanPreview(false);
        cleanPreviewSourceRef.current = null;
      };
    } catch (err) {
      console.error('Failed to preview spectral clean audio:', err);
      setIsProcessing(false);
      setIsPlayingCleanPreview(false);
    }
  };

  // Permanently apply spectral subtraction / DSP cleaning to active audio buffer in editor
  const handleApplyCleanToActiveAudio = async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);

    try {
      const renderedBuffer = await renderDSPAudioBuffer(audioBuffer, dspSettings);
      const sampleRate = renderedBuffer.sampleRate;
      const numChannels = renderedBuffer.numberOfChannels;
      const length = renderedBuffer.length;
      const channelsData: Float32Array[] = [];

      for (let ch = 0; ch < numChannels; ch++) {
        channelsData.push(renderedBuffer.getChannelData(ch));
      }

      const id3 = buildMetadataPayload();
      const newBlob = encodeWAV(channelsData, sampleRate, item.bitDepth || 16, id3);

      // Recompute waveform peak data
      const peakData: number[] = [];
      const step = Math.max(1, Math.floor(length / 64));
      for (let p = 0; p < 64; p++) {
        let max = 0;
        const sStart = p * step;
        const sEnd = Math.min(sStart + step, length);
        for (let s = sStart; s < sEnd; s++) {
          const v = Math.abs(channelsData[0][s]);
          if (v > max) max = v;
        }
        peakData.push(Number(max.toFixed(3)));
      }

      setAudioBuffer(renderedBuffer);

      const updatedItem: RecordingItem = {
        ...item,
        blob: newBlob,
        blobUrl: URL.createObjectURL(newBlob),
        sizeBytes: newBlob.size,
        duration: length / sampleRate,
        waveformPeakData: peakData,
        dspFilters: dspSettings
      };

      if (onUpdateItem) {
        onUpdateItem(updatedItem);
      }

      setIsProcessing(false);
      setMetadataFeedback('Background noise successfully removed using spectral subtraction!');
      setTimeout(() => setMetadataFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to apply spectral clean to audio buffer:', err);
      setIsProcessing(false);
    }
  };

  // Export Full Audio Processed through Active DSP Chain
  const handleExportDSPCopy = async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);

    try {
      const renderedBuffer = await renderDSPAudioBuffer(audioBuffer, dspSettings);
      const sampleRate = renderedBuffer.sampleRate;
      const numChannels = renderedBuffer.numberOfChannels;
      const length = renderedBuffer.length;
      const channelsData: Float32Array[] = [];

      for (let ch = 0; ch < numChannels; ch++) {
        channelsData.push(renderedBuffer.getChannelData(ch));
      }

      const id3 = buildMetadataPayload();
      const newBlob = encodeWAV(channelsData, sampleRate, item.bitDepth || 16, id3);
      const newDuration = length / sampleRate;

      // Peak summary for mini-waveform rendering
      const peakData: number[] = [];
      const step = Math.max(1, Math.floor(length / 64));
      for (let p = 0; p < 64; p++) {
        let max = 0;
        const sStart = p * step;
        const sEnd = Math.min(sStart + step, length);
        for (let s = sStart; s < sEnd; s++) {
          const v = Math.abs(channelsData[0][s]);
          if (v > max) max = v;
        }
        peakData.push(Number(max.toFixed(3)));
      }

      const baseName = editFileName.replace(/\.[^/.]+$/, '');
      const finalFilteredName = `${baseName}_dsp_filtered.wav`;

      const tagsToAdd = ['DSP Filtered'];
      const combinedTags = [...tagsToAdd, ...tags.filter((t) => !tagsToAdd.includes(t))];

      const newItem: RecordingItem = {
        id: crypto.randomUUID(),
        name: finalFilteredName,
        timestamp: Date.now(),
        duration: newDuration,
        sizeBytes: newBlob.size,
        format: 'wav',
        sampleRate,
        channels: numChannels,
        bitDepth: item.bitDepth || 16,
        blob: newBlob,
        blobUrl: URL.createObjectURL(newBlob),
        waveformPeakData: peakData,
        isEncrypted: false,
        tags: combinedTags,
        syncHistory: [],
        location: item.location,
        metadata: id3,
        dspFilters: dspSettings
      };

      onSaveTrimmed(newItem);
      setIsProcessing(false);
      setMetadataFeedback('Exported new DSP filtered audio recording to Vault!');
      setTimeout(() => setMetadataFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to export DSP filtered audio:', err);
      setIsProcessing(false);
    }
  };

  // Apply Trim and Export with DSP Filters & Metadata embedded
  const handleApplyTrimAndSave = async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);

    try {
      // Render through full DSP chain (High-Pass, Low-Pass, Noise Reduction, Gain)
      const renderedBuffer = await renderDSPAudioBuffer(audioBuffer, dspSettings, { startSec, endSec });
      const sampleRate = renderedBuffer.sampleRate;
      const numChannels = renderedBuffer.numberOfChannels;
      const length = renderedBuffer.length;
      const channelsData: Float32Array[] = [];

      for (let ch = 0; ch < numChannels; ch++) {
        channelsData.push(renderedBuffer.getChannelData(ch));
      }

      const id3 = buildMetadataPayload();

      // Encode RIFF WAV with embedded LIST INFO chunks
      const newBlob = encodeWAV(channelsData, sampleRate, item.bitDepth || 16, id3);
      const newDuration = length / sampleRate;

      // Peak summary for mini-waveform rendering
      const peakData: number[] = [];
      const step = Math.max(1, Math.floor(length / 64));
      for (let p = 0; p < 64; p++) {
        let max = 0;
        const sStart = p * step;
        const sEnd = Math.min(sStart + step, length);
        for (let s = sStart; s < sEnd; s++) {
          const v = Math.abs(channelsData[0][s]);
          if (v > max) max = v;
        }
        peakData.push(Number(max.toFixed(3)));
      }

      const trimmedBase = editFileName.replace(/\.[^/.]+$/, '');
      const hasDsp =
        !dspSettings.bypassAll &&
        (dspSettings.highPass.enabled || dspSettings.lowPass.enabled || dspSettings.noiseReduction.enabled);
      const finalTrimmedName = `${trimmedBase}_edited.${item.format}`;

      const tagsToAdd = ['Trimmed'];
      if (hasDsp) tagsToAdd.push('DSP Filtered');
      const combinedTags = [...tagsToAdd, ...tags.filter((t) => !tagsToAdd.includes(t))];

      const newItem: RecordingItem = {
        id: crypto.randomUUID(),
        name: finalTrimmedName,
        timestamp: Date.now(),
        duration: newDuration,
        sizeBytes: newBlob.size,
        format: 'wav',
        sampleRate,
        channels: numChannels,
        bitDepth: item.bitDepth || 16,
        blob: newBlob,
        blobUrl: URL.createObjectURL(newBlob),
        waveformPeakData: peakData,
        isEncrypted: false,
        tags: combinedTags,
        syncHistory: [],
        location: item.location,
        metadata: id3,
        dspFilters: dspSettings
      };

      onSaveTrimmed(newItem);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error('Failed to process DSP and trim:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Audio Studio Editor, DSP & Metadata</h2>
              <span className="text-xs text-slate-400 truncate max-w-sm block">{editFileName || item.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Waveform & Scrubbing</span>
          </button>

          <button
            onClick={() => setActiveTab('dsp')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dsp'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>DSP Audio Filters & FX</span>
            {(dspSettings.highPass.enabled || dspSettings.lowPass.enabled || dspSettings.noiseReduction.enabled) && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  dspSettings.bypassAll
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                }`}
              >
                {dspSettings.bypassAll ? 'BYPASS' : 'ACTIVE'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>ID3 Metadata & Tags</span>
            {tags.length > 0 && (
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded-full font-mono">
                {tags.length}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes pending" />
            )}
          </button>
        </div>

        {metadataFeedback && (
          <div className="bg-emerald-950/80 border border-emerald-800 p-3 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2 animate-fadeIn shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{metadataFeedback}</span>
            </div>
            <button
              onClick={() => setMetadataFeedback(null)}
              className="text-emerald-400 hover:text-emerald-200 text-[11px] font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Waveform & Scrubbing Timeline */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-5">
            {/* Quick Metadata Summary Bar on Audio Tab */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">{title || item.name}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 truncate">{artist || 'Unknown Artist'}</span>
                {album && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 italic truncate">{album}</span>
                  </>
                )}
                {year && <span className="text-slate-500 font-mono">({year})</span>}
              </div>

              <div className="flex items-center gap-2">
                {tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                        #{t}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{tags.length - 3}</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('metadata')}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded border border-slate-700/80 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>Edit Metadata & Tags</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Quick DSP Status Bar */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-200">Acoustic DSP Chain:</span>
                <span className="font-mono text-slate-400">
                  HP: {dspSettings.highPass.enabled ? `${dspSettings.highPass.frequency}Hz` : 'Off'} · LP:{' '}
                  {dspSettings.lowPass.enabled
                    ? dspSettings.lowPass.frequency >= 1000
                      ? `${(dspSettings.lowPass.frequency / 1000).toFixed(1)}kHz`
                      : `${dspSettings.lowPass.frequency}Hz`
                    : 'Off'}{' '}
                  · NR:{' '}
                  {dspSettings.noiseReduction.enabled ? `${dspSettings.noiseReduction.thresholdDb}dB` : 'Off'}
                </span>
                {dspSettings.bypassAll && (
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-mono">
                    Bypassed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDspSettings((prev) => ({ ...prev, bypassAll: !prev.bypassAll }))}
                  className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    dspSettings.bypassAll
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Toggle DSP bypass"
                >
                  {dspSettings.bypassAll ? 'Bypassed (Clean)' : 'DSP Active'}
                </button>

                <button
                  onClick={() => setActiveTab('dsp')}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700/80 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Filter className="w-3 h-3 text-cyan-400" />
                  <span>Configure DSP Filters</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Current Scrubbed Timestamp Header & Metrics */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PLAYHEAD / SCRUB POSITION</span>
                  </span>
                  <span className="font-mono text-2xl font-bold text-amber-400 tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                </div>

                <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-400">TOTAL DURATION</span>
                  <span className="font-mono text-base font-semibold text-slate-300 tabular-nums">
                    {formatTime(audioBuffer?.duration || item.duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-red-400">START [A: {formatTime(startSec)}</span>
                  <span className="text-[11px] text-emerald-400">END B]: {formatTime(endSec)}</span>
                </div>
                <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-sky-400 font-semibold">
                  TRIM SPAN: {formatTime(Math.max(0, endSec - startSec))}
                </div>
              </div>
            </div>

            {/* Interactive Waveform Canvas + Timeline Ruler Container */}
            <div className="flex flex-col gap-0 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
              {/* Waveform Viewport with Interactive Scrubbing Pointer */}
              <div
                className="h-36 w-full relative cursor-crosshair select-none"
                onClick={handleScrubPointer}
                onMouseDown={() => setIsDraggingPlayhead(true)}
                onMouseUp={() => setIsDraggingPlayhead(false)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={144}
                  className="w-full h-full block"
                />

                {/* Floating Tooltip at Cursor Hover Timestamp */}
                {hoverX !== null && hoverTime !== null && (
                  <div
                    className="absolute top-2 pointer-events-none -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow border border-slate-700"
                    style={{ left: `${hoverX}px` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>

              {/* Visual Timeline Ruler (Time Ticks & Subdivisions) */}
              <div
                className="h-7 w-full relative cursor-pointer border-t border-slate-800 select-none bg-slate-900"
                onClick={handleScrubPointer}
              >
                <canvas
                  ref={timelineCanvasRef}
                  width={720}
                  height={28}
                  className="w-full h-full block"
                />
              </div>
            </div>

            {/* Precision Scrubbing & Quick Jump Control Strip */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Micro-Stepping Jumps */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Precision Jump:</span>
                <button
                  onClick={() => jumpToTime(currentTime - 1.0)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono text-[11px] transition-colors cursor-pointer"
                  title="Jump back 1 second"
                >
                  -1.0s
                </button>
                <button
                  onClick={() => jumpToTime(currentTime - 0.1)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono text-[11px] transition-colors cursor-pointer"
                  title="Jump back 100 milliseconds"
                >
                  -0.1s
                </button>
                <button
                  onClick={() => jumpToTime(currentTime + 0.1)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono text-[11px] transition-colors cursor-pointer"
                  title="Jump forward 100 milliseconds"
                >
                  +0.1s
                </button>
                <button
                  onClick={() => jumpToTime(currentTime + 1.0)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono text-[11px] transition-colors cursor-pointer"
                  title="Jump forward 1 second"
                >
                  +1.0s
                </button>
              </div>

              {/* Quick Marker Snap Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => jumpToTime(startSec)}
                  className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/80 rounded font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Jump scrub playhead directly to Start Marker [A"
                >
                  <Rewind className="w-3 h-3 text-red-400" />
                  <span>Go to [A</span>
                </button>

                <button
                  onClick={() => setStartSec(currentTime)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium text-[11px] transition-colors cursor-pointer"
                  title="Set Start Marker [A to current playhead position"
                >
                  Set [A at Playhead
                </button>

                <button
                  onClick={() => setEndSec(currentTime)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium text-[11px] transition-colors cursor-pointer"
                  title="Set End Marker B] to current playhead position"
                >
                  Set B] at Playhead
                </button>

                <button
                  onClick={() => jumpToTime(endSec)}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 rounded font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Jump scrub playhead directly to End Marker B]"
                >
                  <span>Go to B]</span>
                  <FastForward className="w-3 h-3 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Dual Range Sliders for Trimming */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-red-400 font-medium">Start Marker [A</span>
                  <span className="font-mono text-slate-200">{formatTime(startSec)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={endSec - 0.1}
                  step="0.05"
                  value={startSec}
                  onChange={(e) => setStartSec(parseFloat(e.target.value))}
                  className="accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-emerald-400 font-medium">End Marker B]</span>
                  <span className="font-mono text-slate-200">{formatTime(endSec)}</span>
                </div>
                <input
                  type="range"
                  min={startSec + 0.1}
                  max={audioBuffer?.duration || item.duration}
                  step="0.05"
                  value={endSec}
                  onChange={(e) => setEndSec(parseFloat(e.target.value))}
                  className="accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>
            </div>

            {/* Post-Gain Amplification */}
            <div className="flex flex-col gap-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <span>Gain Amplification / Attenuation</span>
                </div>
                <span className="font-mono text-slate-300">
                  {gainBoostDb > 0 ? `+${gainBoostDb}` : gainBoostDb} dB
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={gainBoostDb}
                onChange={(e) => setGainBoostDb(parseFloat(e.target.value))}
                className="accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-12 dB (Attenuate)</span>
                <span>0 dB (Original)</span>
                <span>+12 dB (Boost)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DSP Audio Filters & FX Panel */}
        {activeTab === 'dsp' && (
          <DSPFilterPanel
            settings={dspSettings}
            onChange={(newSettings) => {
              setDspSettings(newSettings);
              setHasUnsavedChanges(true);
            }}
            onApplyAndExport={handleExportDSPCopy}
            isProcessing={isProcessing}
            audioBuffer={audioBuffer}
            selectionRange={{ startSec, endSec }}
            onPreviewToggle={handlePreviewSpectralClean}
            isPreviewPlaying={isPlayingCleanPreview}
            onApplyCleanToEditor={handleApplyCleanToActiveAudio}
          />
        )}

        {/* Tab 3: ID3 Metadata & Custom Tags */}
        {activeTab === 'metadata' && (
          <div className="flex flex-col gap-5 text-xs">
            {/* Header info & Standard badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Disc className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-xs">Acoustic ID3v2 & RIFF-INFO Metadata Editor</h3>
                  <span className="text-[10px] text-slate-400">
                    Embed standardized artist, album, take info, and custom taxonomy tags
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-slate-900 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded">
                  RIFF-LIST · ID3v2.4
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] text-amber-400 font-medium">Unsaved Edits</span>
                )}
              </div>
            </div>

            {/* Section 1: File Storage Identifier & Track Title */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>File Storage & Track Title</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Format: {item.format.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-slate-300 flex items-center justify-between">
                    <span>File Storage Name</span>
                    <span className="text-[10px] text-slate-500">Auto-appends .{item.format}</span>
                  </label>
                  <input
                    type="text"
                    value={editFileName}
                    onChange={(e) => {
                      setEditFileName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. keynote_speech_01"
                  />
                  <span className="text-[10px] text-slate-500">File identifier stored on disk and synced across cloud providers</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-amber-400" />
                      <span>ID3 Track Title (INAM / TIT2)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const base = editFileName.replace(/\.[^/.]+$/, '');
                        setTitle(base);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                    >
                      Copy from filename
                    </button>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Global Tech Keynote - Morning Session"
                  />
                  <span className="text-[10px] text-slate-500">Human-readable audio track title embedded in RIFF metadata</span>
                </div>
              </div>
            </div>

            {/* Section 2: ID3 Core Metadata: Artist, Album, Year, Genre, Track */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Core ID3-Style Metadata (Artist, Album, Year, Genre, Take)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Standard Chunks: IART · IPRD · ICRD · IGNR</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Artist / Speaker */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Artist / Speaker (IART)</span>
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => {
                      setArtist(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Dr. Jane Doe"
                  />
                </div>

                {/* Album / Project */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-slate-400" />
                    <span>Album / Project (IPRD)</span>
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => {
                      setAlbum(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. AI Research Symposium"
                  />
                </div>

                {/* Year with quick current year button */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Year (ICRD)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setYear(new Date().getFullYear().toString());
                        setHasUnsavedChanges(true);
                      }}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Current ({new Date().getFullYear()})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    placeholder="2026"
                  />
                </div>

                {/* Genre Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Genre / Category (IGNR)</span>
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => {
                      setGenre(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Speech">Speech / Spoken Word</option>
                    <option value="Interview">Interview</option>
                    <option value="Lecture">Lecture / Academic</option>
                    <option value="Field Recording">Field Recording</option>
                    <option value="Podcast">Podcast</option>
                    <option value="Meeting">Meeting / Conference</option>
                    <option value="Voice Memo">Voice Memo</option>
                    <option value="Music">Music / Acoustic</option>
                    <option value="Journalism">Journalism</option>
                    <option value="Medical">Medical / Dictation</option>
                    <option value="Legal">Legal / Deposition</option>
                  </select>
                </div>

                {/* Track / Take # */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Take / Track # (ITRK)</span>
                  </label>
                  <input
                    type="text"
                    value={track}
                    onChange={(e) => {
                      setTrack(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    placeholder="1 or 01/10"
                  />
                </div>

                {/* Bitrate & Sample Rate Readout */}
                <div className="flex flex-col gap-1.5 justify-center bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1.5">
                  <span className="text-[10px] text-slate-400">Audio Hardware Profile</span>
                  <span className="font-mono text-slate-200 text-xs font-semibold">
                    {item.sampleRate}Hz · {item.channels === 1 ? 'Mono' : 'Stereo'} · {item.bitDepth || 16}-bit
                  </span>
                </div>
              </div>

              {/* Notes & Comments */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="font-medium text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Session Notes & Comments (ICMT)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
                  placeholder="Equipment used, microphone placement, ambient conditions, or transcription notes..."
                />
              </div>
            </div>

            {/* Section 3: Custom Tags & Taxonomy Manager */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200 text-xs">Custom Categorization Tags</span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                    {tags.length} active
                  </span>
                </div>

                {tags.length > 0 && (
                  <button
                    onClick={handleClearAllTags}
                    className="text-[11px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Tag Input Field */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">#</span>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Type tag name and press Enter (or separate multiple with commas)..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Tag Chips Display */}
              <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 items-center">
                {tags.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic">
                    No custom tags attached. Add custom tags for fast vault search and automated cloud folder classification.
                  </span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-slate-800/90 hover:bg-slate-800 text-emerald-300 border border-emerald-900/80 px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm transition-colors"
                    >
                      <Hash className="w-3 h-3 text-emerald-400/70" />
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-400 ml-1 transition-colors cursor-pointer"
                        title={`Remove tag #${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Quick Tag Recommendations */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                <span className="text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Quick Add:</span>
                </span>
                {[
                  'Interview',
                  'Lecture',
                  'Field Note',
                  'Meeting',
                  'Master',
                  'Confidential',
                  'Podcast',
                  'Voice Memo',
                  'Draft',
                  'Approved'
                ].map((sugg) => {
                  const isAlreadyAdded = tags.includes(sugg);
                  return (
                    <button
                      key={sugg}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddTag(sugg)}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-slate-900 text-slate-600 cursor-default line-through'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800'
                      }`}
                    >
                      +{sugg}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {activeTab === 'audio' || activeTab === 'dsp' ? (
              <>
                <button
                  onClick={handleTogglePlay}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                  <span>{isPlaying ? 'Pause Playback' : activeTab === 'dsp' ? 'Audition with DSP Filters' : 'Play from Scrub Needle'}</span>
                </button>

                <button
                  onClick={() => jumpToTime(0)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title="Rewind to beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Needle</span>
                </button>

                {activeTab === 'dsp' && (
                  <button
                    type="button"
                    onClick={handleExportDSPCopy}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    title="Export full recording with current DSP filters applied as a new WAV file"
                  >
                    <Disc className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Processing...' : 'Export Filtered Copy'}</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetMetadata}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Revert all metadata changes to saved record values"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Revert Changes</span>
                </button>

                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  Catalog: {artist || 'Unknown'} · {album || 'Default'} ({year})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Save Metadata & DSP Button */}
            {onUpdateItem && (
              <button
                onClick={handleSaveMetadataOnly}
                className="px-4 py-2 bg-amber-600/90 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                title="Save updated metadata, tags, and DSP settings directly to Vault record"
              >
                <Check className="w-4 h-4" />
                <span>Save Metadata & DSP</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleApplyTrimAndSave}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              title="Export trimmed PCM audio with active DSP filters and updated ID3 metadata embedded"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'Processing PCM...' : 'Save Trimmed Clip & Filters'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
