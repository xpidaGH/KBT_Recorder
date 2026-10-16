import React, { useState, useMemo } from 'react';
import { RecordingItem } from '../types/recorder';
import {
  X,
  Archive,
  Download,
  FileAudio,
  FolderArchive,
  FileJson,
  FileSpreadsheet,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Clock,
  Music,
  Tag,
  FolderTree,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import {
  ZipExportOptions,
  DEFAULT_ZIP_OPTIONS,
  ZipProgressInfo,
  exportRecordingsToZip,
  triggerBlobDownload,
  formatDurationSec
} from '../utils/zipExport';

interface BatchExportModalProps {
  isOpen: boolean;
  selectedItems: RecordingItem[];
  onClose: () => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  selectedItems,
  onClose
}) => {
  if (!isOpen || selectedItems.length === 0) return null;

  const [options, setOptions] = useState<ZipExportOptions>(() => ({
    ...DEFAULT_ZIP_OPTIONS,
    archiveName: `vault_export_${new Date().toISOString().slice(0, 10)}.zip`
  }));

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ZipProgressInfo | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    blob: Blob;
    fileName: string;
    sizeFormatted: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute summary stats
  const totalDuration = useMemo(
    () => selectedItems.reduce((acc, it) => acc + (it.duration || 0), 0),
    [selectedItems]
  );
  const totalSizeBytes = useMemo(
    () => selectedItems.reduce((acc, it) => acc + (it.sizeBytes || 0), 0),
    [selectedItems]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setCompletedResult(null);

    const result = await exportRecordingsToZip(
      selectedItems,
      options,
      (info) => {
        setProgress(info);
      }
    );

    setIsExporting(false);

    if (result.success && result.blob) {
      triggerBlobDownload(result.blob, result.fileName);
      setCompletedResult({
        blob: result.blob,
        fileName: result.fileName,
        sizeFormatted: formatSize(result.blob.size)
      });
    } else {
      setErrorMessage(result.error || 'Failed to generate ZIP archive.');
    }
  };

  const handleReDownload = () => {
    if (completedResult) {
      triggerBlobDownload(completedResult.blob, completedResult.fileName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/30 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-inner">
              <FolderArchive className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Batch Export ZIP Archive</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                  {selectedItems.length} {selectedItems.length === 1 ? 'recording' : 'recordings'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Package selected audio recordings, embedded ID3 tags, and metadata into a single compressed download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <FileAudio className="w-3.5 h-3.5 text-sky-400" /> Selected Items
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100">
                {selectedItems.length} Tracks
              </span>
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800 pl-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Total Duration
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100">
                {formatDurationSec(totalDuration)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800 pl-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Uncompressed Size
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100">
                {formatSize(totalSizeBytes)}
              </span>
            </div>
          </div>

          {/* Success Banner if export finished */}
          {completedResult && (
            <div className="bg-emerald-950/80 border border-emerald-700/80 p-4 rounded-xl flex items-center justify-between gap-3 text-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-white text-xs">
                    ZIP Archive Created & Downloaded Successfully!
                  </span>
                  <span className="text-[11px] text-emerald-300 font-mono">
                    {completedResult.fileName} ({completedResult.sizeFormatted})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReDownload}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Re-Download</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-950/80 border border-red-700/80 p-3 rounded-xl flex items-center gap-2.5 text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Bar (when active) */}
          {isExporting && progress && (
            <div className="bg-slate-950 p-4 rounded-xl border border-sky-900/60 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-sky-300">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>{progress.message}</span>
                </div>
                <span className="font-mono text-sky-400 font-bold">{progress.percent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Stage: {progress.stage.toUpperCase()}</span>
                <span>
                  Track {progress.processedCount} of {progress.totalCount}
                </span>
              </div>
            </div>
          )}

          {/* Options Section */}
          <div className="flex flex-col gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800/80 pb-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span>Archive Configuration</span>
            </div>

            {/* Archive Filename */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium">Archive Output Filename</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={isExporting}
                  value={options.archiveName}
                  onChange={(e) => setOptions({ ...options, archiveName: e.target.value })}
                  placeholder="vault_recordings_export.zip"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() =>
                    setOptions({
                      ...options,
                      archiveName: `vault_recordings_${new Date().toISOString().slice(0, 10)}.zip`
                    })
                  }
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
                  title="Reset to default timestamp name"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Folder Structure Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                <span>Archive Directory Structure</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setOptions({ ...options, structure: 'organized' })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    options.structure === 'organized'
                      ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-white">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Organized Subfolders (Recommended)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Audio in <code>audio/</code>, metadata in <code>metadata/</code>, transcripts in <code>transcripts/</code>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setOptions({ ...options, structure: 'flat' })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    options.structure === 'flat'
                      ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-white">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Flat Structure
                  </span>
                  <span className="text-[11px] text-slate-400">
                    All audio and metadata JSON files placed side-by-side in root folder
                  </span>
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium">Included Package Contents:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Audio files */}
                <label className="flex items-center gap-2.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={isExporting}
                    checked={options.includeAudio}
                    onChange={(e) => setOptions({ ...options, includeAudio: e.target.checked })}
                    className="accent-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <FileAudio className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-slate-200">Raw Audio Files</span>
                  </div>
                </label>

                {/* Individual JSON Metadata */}
                <label className="flex items-center gap-2.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={isExporting}
                    checked={options.includeMetadataJson}
                    onChange={(e) => setOptions({ ...options, includeMetadataJson: e.target.checked })}
                    className="accent-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-slate-200">Individual ID3/JSON Meta</span>
                  </div>
                </label>

                {/* Master CSV Manifest */}
                <label className="flex items-center gap-2.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={isExporting}
                    checked={options.includeManifestCsv}
                    onChange={(e) => setOptions({ ...options, includeManifestCsv: e.target.checked })}
                    className="accent-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-slate-200">Catalog Sheet (manifest.csv)</span>
                  </div>
                </label>

                {/* Transcripts */}
                <label className="flex items-center gap-2.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={isExporting}
                    checked={options.includeTranscripts}
                    onChange={(e) => setOptions({ ...options, includeTranscripts: e.target.checked })}
                    className="accent-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-slate-200">Speech Transcripts (.txt)</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Selected Recordings Preview Accordion / Table */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-400 font-medium">Included Recordings Preview:</span>
            <div className="max-h-40 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800/80 divide-y divide-slate-800/60 font-mono text-[11px]">
              {selectedItems.map((item, idx) => (
                <div key={item.id} className="py-1.5 px-2 flex items-center justify-between gap-3 text-slate-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 w-5 text-right">{idx + 1}.</span>
                    <span className="truncate font-sans font-medium text-slate-200">{item.name}</span>
                    {item.metadata?.artist && (
                      <span className="text-slate-400 truncate text-[10px] hidden sm:inline">
                        ({item.metadata.artist})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[10px]">
                    <span className="bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                      {item.format.toUpperCase()}
                    </span>
                    <span>{formatDurationSec(item.duration)}</span>
                    <span className="text-slate-500">{formatSize(item.sizeBytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            {completedResult ? 'Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExporting || (!options.includeAudio && !options.includeMetadataJson && !options.includeManifestCsv && !options.includeManifestJson)}
              onClick={handleStartExport}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Packaging ZIP ({progress?.percent || 0}%)...</span>
                </>
              ) : completedResult ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Export Again</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Generate & Download ZIP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
