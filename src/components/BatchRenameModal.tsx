import React, { useState, useMemo } from 'react';
import { RecordingItem } from '../types/recorder';
import {
  X,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  FileAudio,
  Hash,
  Search,
  Sliders,
  AlertTriangle
} from 'lucide-react';

export type RenameMode = 'pattern' | 'prefix_suffix' | 'find_replace' | 'custom_base';

interface BatchRenameModalProps {
  isOpen: boolean;
  selectedItems: RecordingItem[];
  onClose: () => void;
  onApplyRename: (renamings: { id: string; newName: string; updateTitle: boolean }[]) => void;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  selectedItems,
  onClose,
  onApplyRename
}) => {
  if (!isOpen || selectedItems.length === 0) return null;

  const [mode, setMode] = useState<RenameMode>('pattern');

  // Mode 1: Pattern / Sequential template
  const [template, setTemplate] = useState('Take_{0n}');
  const [startNumber, setStartNumber] = useState(1);
  const [padDigits, setPadDigits] = useState(2); // 1, 2, 3

  // Mode 2: Prefix & Suffix
  const [prefix, setPrefix] = useState('Session_');
  const [suffix, setSuffix] = useState('');

  // Mode 3: Find & Replace
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Mode 4: Custom Base
  const [baseName, setBaseName] = useState('Audio_Recording');
  const [separator, setSeparator] = useState('_');

  // Global options
  const [preserveExtension, setPreserveExtension] = useState(true);
  const [updateID3Title, setUpdateID3Title] = useState(true);

  // Helper to extract base name and extension
  const splitFileName = (fullName: string) => {
    const lastDotIndex = fullName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return { base: fullName, ext: '' };
    }
    return {
      base: fullName.substring(0, lastDotIndex),
      ext: fullName.substring(lastDotIndex)
    };
  };

  // Format index with padding
  const formatIndex = (index: number, digits: number) => {
    return index.toString().padStart(digits, '0');
  };

  // Compute live previews
  const previewList = useMemo(() => {
    return selectedItems.map((item, idx) => {
      const { base: originalBase, ext } = splitFileName(item.name);
      const effectiveExt = preserveExtension ? ext || `.${item.format}` : '';
      let newBase = originalBase;

      const num = startNumber + idx;

      if (mode === 'pattern') {
        // Replace {n}, {0n}, {00n}
        newBase = template
          .replace(/\{00n\}/g, formatIndex(num, 3))
          .replace(/\{0n\}/g, formatIndex(num, 2))
          .replace(/\{n\}/g, formatIndex(num, 1))
          .replace(/\{date\}/g, new Date().toISOString().slice(0, 10))
          .replace(/\{original\}/g, originalBase);
      } else if (mode === 'prefix_suffix') {
        newBase = `${prefix}${originalBase}${suffix}`;
      } else if (mode === 'find_replace') {
        if (findText) {
          if (caseSensitive) {
            newBase = originalBase.split(findText).join(replaceText);
          } else {
            const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            newBase = originalBase.replace(regex, replaceText);
          }
        }
      } else if (mode === 'custom_base') {
        const paddedIndex = formatIndex(num, padDigits);
        newBase = `${baseName}${separator}${paddedIndex}`;
      }

      // Clean characters
      newBase = newBase.trim().replace(/[<>:"/\\|?*]/g, '_');
      if (!newBase) newBase = `recording_${num}`;

      const newFullName = `${newBase}${effectiveExt}`;

      return {
        id: item.id,
        originalName: item.name,
        newName: newFullName,
        hasChanged: item.name !== newFullName
      };
    });
  }, [
    selectedItems,
    mode,
    template,
    startNumber,
    padDigits,
    prefix,
    suffix,
    findText,
    replaceText,
    caseSensitive,
    baseName,
    separator,
    preserveExtension
  ]);

  // Check for duplicates in new names
  const duplicateWarnings = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const p of previewList) {
      if (seen.has(p.newName.toLowerCase())) {
        dupes.add(p.newName.toLowerCase());
      }
      seen.add(p.newName.toLowerCase());
    }
    return dupes;
  }, [previewList]);

  const handleApply = () => {
    const renamings = previewList.map((p) => ({
      id: p.id,
      newName: p.newName,
      updateTitle: updateID3Title
    }));
    onApplyRename(renamings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Batch Rename Vault Recordings</span>
                <span className="text-xs font-mono bg-sky-950 text-sky-400 border border-sky-800/80 px-2 py-0.5 rounded-full">
                  {selectedItems.length} selected
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bulk rename files systematically with pattern templates, sequence numbering, or find-and-replace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode('pattern')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'pattern'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Sequence Template</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('prefix_suffix')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'prefix_suffix'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Prefix & Suffix</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('find_replace')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'find_replace'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find & Replace</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('custom_base')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'custom_base'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>Base Name</span>
            </button>
          </div>

          {/* Mode Configuration Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3.5 text-xs">
            {mode === 'pattern' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Template Pattern</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Variables: {'{0n}'} (01), {'{00n}'} (001), {'{n}'} (1), {'{date}'}, {'{original}'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Field_Audio_{0n} or Interview_{00n}_{date}"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Start Number:</span>
                    <input
                      type="number"
                      min="0"
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Quick Presets:</span>
                    {[
                      { label: 'Take_{0n}', val: 'Take_{0n}' },
                      { label: 'Interview_{0n}', val: 'Interview_{0n}' },
                      { label: 'VoiceMemo_{n}', val: 'VoiceMemo_{n}' },
                      { label: '{original}_{0n}', val: '{original}_{0n}' }
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setTemplate(p.val)}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === 'prefix_suffix' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Prefix to Prepend</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                    placeholder="e.g. 2026_Fall_ or Conf_"
                  />
                  <span className="text-[10px] text-slate-500">Added to the beginning of existing filename</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Suffix to Append</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                    placeholder="e.g. _Master or _Edited"
                  />
                  <span className="text-[10px] text-slate-500">Added to the end of filename before extension</span>
                </div>
              </div>
            )}

            {mode === 'find_replace' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-slate-300">Find in Filename</label>
                    <input
                      type="text"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                      placeholder="e.g. recording_ or trimmed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-slate-300">Replace With</label>
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                      placeholder="e.g. studio_take_ or final"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="accent-sky-500 rounded cursor-pointer"
                  />
                  <span>Match case sensitive</span>
                </label>
              </div>
            )}

            {mode === 'custom_base' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="font-semibold text-slate-300">Base Name</label>
                  <input
                    type="text"
                    value={baseName}
                    onChange={(e) => setBaseName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Lecture"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Separator</label>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="_">Underscore (_)</option>
                    <option value="-">Hyphen (-)</option>
                    <option value=" ">Space ( )</option>
                    <option value="">None</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300">Number Padding</label>
                  <select
                    value={padDigits}
                    onChange={(e) => setPadDigits(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value={1}>1, 2, 3... (1 digit)</option>
                    <option value={2}>01, 02, 03... (2 digits)</option>
                    <option value={3}>001, 002, 003... (3 digits)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Global Options */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-5">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={preserveExtension}
                    onChange={(e) => setPreserveExtension(e.target.checked)}
                    className="accent-sky-500 rounded cursor-pointer"
                  />
                  <span>Preserve audio file format extension (.wav, .mp3, etc.)</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={updateID3Title}
                    onChange={(e) => setUpdateID3Title(e.target.checked)}
                    className="accent-sky-500 rounded cursor-pointer"
                  />
                  <span>Sync ID3 Track Title with new name</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Rename Preview ({previewList.length} files)</span>
              </span>
              {duplicateWarnings.size > 0 && (
                <span className="text-amber-400 flex items-center gap-1 text-[11px] font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Warning: Duplicate output filenames detected</span>
                </span>
              )}
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 max-h-56 overflow-y-auto divide-y divide-slate-800/80">
              {previewList.map((item, i) => {
                const isDupe = duplicateWarnings.has(item.newName.toLowerCase());
                return (
                  <div
                    key={item.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 font-mono w-5 shrink-0 text-right">
                        {i + 1}.
                      </span>
                      <span className="text-slate-400 truncate max-w-[220px] font-mono text-[11px]" title={item.originalName}>
                        {item.originalName}
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span
                        className={`truncate max-w-[260px] font-mono text-[11px] font-semibold ${
                          isDupe
                            ? 'text-amber-400'
                            : item.hasChanged
                            ? 'text-sky-400'
                            : 'text-slate-500'
                        }`}
                        title={item.newName}
                      >
                        {item.newName}
                      </span>
                      {item.hasChanged && (
                        <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-800/80 px-1.5 py-0.2 rounded font-mono shrink-0">
                          RENAMED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            {previewList.filter((p) => p.hasChanged).length} of {selectedItems.length} names will change
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Apply Batch Rename ({selectedItems.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
