import React, { useState, useMemo } from 'react';
import { RecordingItem } from '../types/recorder';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Lock,
  Unlock,
  Cloud,
  Scissors,
  Repeat,
  FileAudio,
  Calendar,
  Clock,
  HardDrive,
  FileCheck2,
  Sparkles,
  MapPin,
  Tag,
  Music,
  User,
  Hash,
  Bookmark,
  Check,
  CheckSquare,
  Square,
  MinusSquare,
  Edit3,
  Search,
  Filter,
  X,
  Plus
} from 'lucide-react';
import { BatchRenameModal } from './BatchRenameModal';

interface RecordingsListProps {
  recordings: RecordingItem[];
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdate?: (items: RecordingItem[]) => void;
  onOpenSyncModal: (item: RecordingItem) => void;
  onOpenEditorModal: (item: RecordingItem) => void;
  onOpenDSPEditor?: (item: RecordingItem) => void;
  onOpenMetadataEditor?: (item: RecordingItem) => void;
  onOpenConverterModal: (item: RecordingItem) => void;
  onOpenCryptoModal: (item: RecordingItem) => void;
  onAnalyzeWithGemini: (item: RecordingItem) => void;
  onOpenLocationModal: (item: RecordingItem) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDelete,
  onBulkDelete,
  onBulkUpdate,
  onOpenSyncModal,
  onOpenEditorModal,
  onOpenDSPEditor,
  onOpenMetadataEditor,
  onOpenConverterModal,
  onOpenCryptoModal,
  onAnalyzeWithGemini,
  onOpenLocationModal
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchRenameOpen, setIsBatchRenameOpen] = useState(false);
  const [isBulkTagOpen, setIsBulkTagOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Playback control
  const handlePlayPause = (item: RecordingItem) => {
    if (item.isEncrypted) {
      onOpenCryptoModal(item);
      return;
    }

    if (!item.blobUrl) return;

    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(item.blobUrl);
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(item.id);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Filter recordings by search term
  const filteredRecordings = useMemo(() => {
    if (!searchFilter.trim()) return recordings;
    const q = searchFilter.toLowerCase();
    return recordings.filter((r) => {
      const matchName = r.name.toLowerCase().includes(q);
      const matchTags = r.tags?.some((t) => t.toLowerCase().includes(q));
      const matchArtist = r.metadata?.artist?.toLowerCase().includes(q);
      const matchAlbum = r.metadata?.album?.toLowerCase().includes(q);
      const matchTitle = r.metadata?.title?.toLowerCase().includes(q);
      const matchFormat = r.format.toLowerCase().includes(q);
      return matchName || matchTags || matchArtist || matchAlbum || matchTitle || matchFormat;
    });
  }, [recordings, searchFilter]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRecordings.length && filteredRecordings.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecordings.map((r) => r.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk Delete
  const handleExecuteBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmMsg = `Are you sure you want to permanently delete ${count} selected recording${count > 1 ? 's' : ''}?`;
    if (!confirm(confirmMsg)) return;

    const idsToDelete = Array.from(selectedIds);
    if (onBulkDelete) {
      onBulkDelete(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDelete(id));
    }

    setSelectedIds(new Set());
    setActionFeedback(`Deleted ${count} recording${count > 1 ? 's' : ''}`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Bulk Rename apply callback
  const handleApplyBatchRename = (
    renamings: { id: string; newName: string; updateTitle: boolean }[]
  ) => {
    const renameMap = new Map(renamings.map((r) => [r.id, r]));
    const updatedItems: RecordingItem[] = [];

    recordings.forEach((rec) => {
      const match = renameMap.get(rec.id);
      if (match) {
        const nextMetadata = match.updateTitle
          ? { ...rec.metadata, title: match.newName.replace(/\.[^/.]+$/, '') }
          : rec.metadata;

        updatedItems.push({
          ...rec,
          name: match.newName,
          metadata: nextMetadata
        });
      }
    });

    if (onBulkUpdate && updatedItems.length > 0) {
      onBulkUpdate(updatedItems);
      setActionFeedback(`Batch renamed ${updatedItems.length} recording${updatedItems.length > 1 ? 's' : ''}!`);
      setTimeout(() => setActionFeedback(null), 3500);
    }

    setSelectedIds(new Set());
  };

  // Bulk Tag apply
  const handleApplyBulkTag = () => {
    const cleanedTag = bulkTagInput.trim().replace(/^#/, '');
    if (!cleanedTag || selectedIds.size === 0) return;

    const updatedItems: RecordingItem[] = [];
    recordings.forEach((rec) => {
      if (selectedIds.has(rec.id)) {
        const existingTags = rec.tags || [];
        if (!existingTags.includes(cleanedTag)) {
          updatedItems.push({
            ...rec,
            tags: [...existingTags, cleanedTag]
          });
        }
      }
    });

    if (onBulkUpdate && updatedItems.length > 0) {
      onBulkUpdate(updatedItems);
      setActionFeedback(`Added tag #${cleanedTag} to ${updatedItems.length} recording${updatedItems.length > 1 ? 's' : ''}!`);
      setTimeout(() => setActionFeedback(null), 3000);
    }

    setBulkTagInput('');
    setIsBulkTagOpen(false);
  };

  const selectedRecordingsList = useMemo(() => {
    return recordings.filter((r) => selectedIds.has(r.id));
  }, [recordings, selectedIds]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (recordings.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
        <FileAudio className="w-12 h-12 text-slate-600 stroke-1" />
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-200">Vault Library is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Press the One-Tap Record button above to capture studio audio. Recordings are saved locally in IndexedDB with zero-knowledge encryption options.
          </p>
        </div>
      </div>
    );
  }

  const isAllSelected = filteredRecordings.length > 0 && selectedIds.size === filteredRecordings.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredRecordings.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Toast Feedback Banner */}
      {actionFeedback && (
        <div className="bg-sky-950/90 border border-sky-800 text-sky-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-sky-400" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-sky-400 hover:text-sky-200 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Controls: Search Filter & Playback Speed Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 px-1">
        {/* Search Filter Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search recordings by name, tag, speaker, format..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span>Speed:</span>
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                playbackSpeed === rate ? 'bg-red-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Master Selection Toolbar Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          {/* Master Select All Checkbox */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium select-none"
            title={isAllSelected ? 'Deselect all' : 'Select all recordings'}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isAllSelected
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : isPartiallySelected
                  ? 'bg-sky-950 border-sky-600 text-sky-400'
                  : 'bg-slate-800 border-slate-700 text-transparent'
              }`}
            >
              {isAllSelected ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : isPartiallySelected ? (
                <div className="w-2 h-0.5 bg-sky-400 rounded" />
              ) : null}
            </div>
            <span>
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${filteredRecordings.length} selected`
                : `Select All (${filteredRecordings.length})`}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Clear Selection
              </button>

              {/* Batch Rename Button */}
              <button
                type="button"
                onClick={() => setIsBatchRenameOpen(true)}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Batch rename selected recordings"
              >
                <Edit3 className="w-3 h-3" />
                <span>Batch Rename ({selectedIds.size})</span>
              </button>

              {/* Bulk Tag Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBulkTagOpen(!isBulkTagOpen)}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Add tag to selected recordings"
                >
                  <Tag className="w-3 h-3" />
                  <span>Bulk Tag</span>
                </button>

                {/* Bulk Tag Popover */}
                {isBulkTagOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-40 flex flex-col gap-2 animate-fadeIn">
                    <span className="text-[11px] font-semibold text-slate-200">
                      Add tag to {selectedIds.size} recordings:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono text-xs">#</span>
                      <input
                        type="text"
                        value={bulkTagInput}
                        onChange={(e) => setBulkTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyBulkTag();
                        }}
                        placeholder="Tag name..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkTag}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['Master', 'Reviewed', 'Confidential', 'Archived'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setBulkTagInput(s);
                          }}
                          className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 px-1.5 py-0.5 rounded border border-slate-800 cursor-pointer"
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Delete Button */}
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/80 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Delete all selected recordings"
              >
                <Trash2 className="w-3 h-3 text-red-300" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            </div>
          ) : (
            <span className="text-slate-500 font-mono text-[11px]">
              {filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'} total
            </span>
          )}
        </div>
      </div>

      {/* Floating Sticky Bulk Actions Bar when scrolled & selections exist */}
      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-30 bg-slate-900/95 backdrop-blur-md border border-sky-500/50 p-2.5 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold text-white">
              {selectedIds.size} recording{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-slate-200 underline text-[11px] ml-1 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchRenameOpen(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Batch Rename</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkTagOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Bulk Tag</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteBulkDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Recordings List Cards */}
      <div className="flex flex-col gap-2.5">
        {filteredRecordings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
            No recordings match &ldquo;{searchFilter}&rdquo;. Try another search term.
          </div>
        ) : (
          filteredRecordings.map((rec) => {
            const isCurrentPlaying = playingId === rec.id;
            const isSelected = selectedIds.has(rec.id);

            return (
              <div
                key={rec.id}
                className={`border rounded-xl p-4 transition-all flex flex-col gap-3 ${
                  isSelected
                    ? 'border-sky-500/70 bg-slate-900/95 ring-1 ring-sky-500/40 shadow-lg shadow-sky-950/20'
                    : isCurrentPlaying
                    ? 'bg-slate-900 border-red-500/50 shadow-md shadow-red-950/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row with Checkbox, Play button, and Titles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Individual Multi-Select Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(rec.id);
                      }}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-transparent'
                      }`}
                      title={isSelected ? 'Deselect recording' : 'Select recording for bulk action'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    {/* Play/Pause Button */}
                    <button
                      onClick={() => handlePlayPause(rec)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        rec.isEncrypted
                          ? 'bg-amber-900/50 text-amber-400 border border-amber-800'
                          : isCurrentPlaying
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                      title={rec.isEncrypted ? 'Locked - Enter passphrase to decrypt' : isCurrentPlaying ? 'Pause' : 'Play'}
                    >
                      {rec.isEncrypted ? (
                        <Lock className="w-4 h-4" />
                      ) : isCurrentPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>

                    {/* Filename, badges, and timestamps */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100 truncate max-w-md" title={rec.name}>
                          {rec.name}
                        </span>
                        {rec.isEncrypted ? (
                          <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded shrink-0">
                            AES-256-GCM
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded shrink-0">
                            {rec.format.toUpperCase()} · {rec.sampleRate}Hz
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDuration(rec.duration)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatSize(rec.sizeBytes)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.channels === 1 ? 'Mono' : 'Stereo'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cloud, Crypto & GPS Status Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {rec.location && (
                      <button
                        onClick={() => onOpenLocationModal(rec)}
                        className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded hover:bg-emerald-900/40 transition-colors cursor-pointer"
                        title="View GPS Geolocation & Map"
                      >
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="truncate max-w-[130px]">
                          {rec.location.placeName || `${rec.location.latitude.toFixed(2)}°, ${rec.location.longitude.toFixed(2)}°`}
                        </span>
                      </button>
                    )}

                    {rec.syncHistory && rec.syncHistory.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded">
                        <Cloud className="w-3 h-3" />
                        <span>Synced ({rec.syncHistory[rec.syncHistory.length - 1].provider})</span>
                      </div>
                    )}

                    <button
                      onClick={() => onOpenCryptoModal(rec)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      title={rec.isEncrypted ? 'Encrypted - Click to Unlock' : 'Unencrypted - Click to Lock'}
                    >
                      {rec.isEncrypted ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* ID3 Metadata Display if present */}
                {rec.metadata && (rec.metadata.artist || rec.metadata.album || rec.metadata.title) && (
                  <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                    <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="flex items-center gap-1.5 truncate text-[11px]">
                      {rec.metadata.title && <span className="text-white font-semibold truncate">{rec.metadata.title}</span>}
                      {rec.metadata.artist && <span className="text-slate-300 truncate">· {rec.metadata.artist}</span>}
                      {rec.metadata.album && <span className="text-slate-400 italic truncate">· {rec.metadata.album}</span>}
                      {rec.metadata.year && <span className="text-slate-500 font-mono">({rec.metadata.year})</span>}
                    </div>
                    {rec.metadata.genre && (
                      <span className="text-[10px] bg-slate-800 text-amber-400/90 border border-slate-700/80 px-1.5 py-0.2 rounded font-mono ml-auto shrink-0">
                        {rec.metadata.genre}
                      </span>
                    )}
                  </div>
                )}

                {/* Custom Tags & DSP Chips Display */}
                {((rec.tags && rec.tags.length > 0) || (rec.dspFilters && !rec.dspFilters.bypassAll && (rec.dspFilters.highPass.enabled || rec.dspFilters.lowPass.enabled || rec.dspFilters.noiseReduction.enabled))) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {/* DSP Filter Chain Indicator Pill */}
                    {rec.dspFilters && !rec.dspFilters.bypassAll && (rec.dspFilters.highPass.enabled || rec.dspFilters.lowPass.enabled || rec.dspFilters.noiseReduction.enabled) && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/90 px-2 py-0.5 rounded-md font-mono font-medium shadow-2xs"
                        title="Acoustic DSP filters active"
                      >
                        <Filter className="w-2.5 h-2.5 text-cyan-400" />
                        <span>DSP</span>
                        {rec.dspFilters.highPass.enabled && <span>HP:{rec.dspFilters.highPass.frequency}Hz</span>}
                        {rec.dspFilters.lowPass.enabled && <span>LP:{rec.dspFilters.lowPass.frequency >= 1000 ? `${(rec.dspFilters.lowPass.frequency / 1000).toFixed(1)}k` : `${rec.dspFilters.lowPass.frequency}Hz`}</span>}
                        {rec.dspFilters.noiseReduction.enabled && <span>NR:{rec.dspFilters.noiseReduction.thresholdDb}dB</span>}
                      </span>
                    )}

                    {rec.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 text-[10px] bg-slate-800/90 text-emerald-300 border border-slate-700/80 px-2 py-0.5 rounded-md font-medium"
                      >
                        <span className="text-emerald-500/80 font-mono">#</span>
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Mini Peak Waveform Display */}
                {rec.waveformPeakData && rec.waveformPeakData.length > 0 && (
                  <div className="h-6 w-full flex items-center gap-0.5 px-2 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                    {rec.waveformPeakData.map((peak, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-sm transition-all ${
                          isCurrentPlaying ? 'bg-red-500' : isSelected ? 'bg-sky-500' : 'bg-slate-600'
                        }`}
                        style={{ height: `${Math.max(12, peak * 100)}%` }}
                      />
                    ))}
                  </div>
                )}

                {/* Transcript Preview if available */}
                {rec.transcript && (
                  <div className="text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded border border-slate-800 line-clamp-2 select-text">
                    <span className="text-slate-500 font-semibold mr-1.5">Transcript:</span>
                    {rec.transcript}
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* GPS Map */}
                    {rec.location && (
                      <button
                        onClick={() => onOpenLocationModal(rec)}
                        className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Open GPS Geolocation Map"
                      >
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>GPS Map</span>
                      </button>
                    )}

                    {/* Cloud Sync */}
                    <button
                      onClick={() => onOpenSyncModal(rec)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Cloud className="w-3 h-3 text-sky-400" />
                      <span>Cloud Sync</span>
                    </button>

                    {/* Tags & ID3 Metadata Editor */}
                    <button
                      onClick={() => (onOpenMetadataEditor ? onOpenMetadataEditor(rec) : onOpenEditorModal(rec))}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Edit ID3 Metadata (Artist, Album, Year) and Custom Tags"
                    >
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>Tags & ID3</span>
                    </button>

                    {/* DSP Filters */}
                    <button
                      onClick={() => (onOpenDSPEditor ? onOpenDSPEditor(rec) : onOpenEditorModal(rec))}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Apply Noise Reduction, Low-Pass, and High-Pass DSP Filters"
                    >
                      <Filter className="w-3 h-3 text-cyan-400" />
                      <span>DSP Filters</span>
                    </button>

                    {/* Audio Editor / Waveform Scrubbing */}
                    <button
                      onClick={() => onOpenEditorModal(rec)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scissors className="w-3 h-3 text-amber-400" />
                      <span>Trim / Edit</span>
                    </button>

                    {/* Format Converter */}
                    <button
                      onClick={() => onOpenConverterModal(rec)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Repeat className="w-3 h-3 text-purple-400" />
                      <span>Transcode</span>
                    </button>

                    {/* AI Audio Analysis */}
                    <button
                      onClick={() => onAnalyzeWithGemini(rec)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Analyze conversation markers and summary via Gemini AI"
                    >
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span>AI Insights</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Download */}
                    {rec.blobUrl && !rec.isEncrypted && (
                      <a
                        href={rec.blobUrl}
                        download={rec.name}
                        className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 rounded-md border border-slate-700 transition-colors cursor-pointer"
                        title="Download file directly"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(rec.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-md border border-slate-700 transition-colors cursor-pointer"
                      title="Delete recording"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Batch Rename Modal */}
      <BatchRenameModal
        isOpen={isBatchRenameOpen}
        selectedItems={selectedRecordingsList}
        onClose={() => setIsBatchRenameOpen(false)}
        onApplyRename={handleApplyBatchRename}
      />
    </div>
  );
};
