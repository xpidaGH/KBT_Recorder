import JSZip from 'jszip';
import { RecordingItem } from '../types/recorder';

export interface ZipExportOptions {
  archiveName: string;
  structure: 'flat' | 'organized';
  includeAudio: boolean;
  includeMetadataJson: boolean;
  includeManifestJson: boolean;
  includeManifestCsv: boolean;
  includeTranscripts: boolean;
}

export const DEFAULT_ZIP_OPTIONS: ZipExportOptions = {
  archiveName: `vault_recordings_${new Date().toISOString().slice(0, 10)}.zip`,
  structure: 'organized',
  includeAudio: true,
  includeMetadataJson: true,
  includeManifestJson: true,
  includeManifestCsv: true,
  includeTranscripts: true,
};

export interface ZipProgressInfo {
  percent: number;
  stage: 'fetching' | 'compressing' | 'complete';
  message: string;
  currentItem?: string;
  processedCount: number;
  totalCount: number;
}

/**
 * Sanitizes a filename so it is safe across macOS, Windows, Linux, and ZIP archive specs.
 */
export function sanitizeFileName(name: string): string {
  // Replace illegal filename characters with underscores
  const clean = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return clean || 'unnamed_audio';
}

/**
 * Formats duration in seconds to M:SS or H:MM:SS
 */
export function formatDurationSec(seconds: number): string {
  const rounded = Math.round(seconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Ensures unique file names within a ZIP folder
 */
class FileNameRegistry {
  private usedNames = new Set<string>();

  getUniqueName(desiredName: string): string {
    const clean = sanitizeFileName(desiredName);
    if (!this.usedNames.has(clean)) {
      this.usedNames.add(clean);
      return clean;
    }

    const dotIndex = clean.lastIndexOf('.');
    const base = dotIndex > 0 ? clean.substring(0, dotIndex) : clean;
    const ext = dotIndex > 0 ? clean.substring(dotIndex) : '';

    let counter = 1;
    while (this.usedNames.has(`${base} (${counter})${ext}`)) {
      counter++;
    }

    const unique = `${base} (${counter})${ext}`;
    this.usedNames.add(unique);
    return unique;
  }
}

/**
 * Helper to retrieve raw Blob from a RecordingItem (from memory or blobUrl)
 */
export async function getRecordingBlob(item: RecordingItem): Promise<Blob | null> {
  if (item.blob && item.blob.size > 0) {
    return item.blob;
  }

  if (item.blobUrl) {
    try {
      const response = await fetch(item.blobUrl);
      if (response.ok) {
        return await response.blob();
      }
    } catch (err) {
      console.warn(`Could not fetch audio blob from blobUrl for item ${item.name}:`, err);
    }
  }

  return null;
}

/**
 * Generates CSV manifest content for spreadsheet tools
 */
export function generateManifestCsv(items: RecordingItem[]): string {
  const headers = [
    'ID',
    'File Name',
    'Title',
    'Artist',
    'Album',
    'Year',
    'Genre',
    'Duration (seconds)',
    'Duration Formatted',
    'Size (Bytes)',
    'Format',
    'Sample Rate (Hz)',
    'Channels',
    'Bit Depth',
    'Created Date (ISO)',
    'Tags',
    'Location Place',
    'Latitude',
    'Longitude',
    'Encrypted',
    'Has Transcript',
    'Transcript Preview'
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((item) => {
    return [
      escapeCsv(item.id),
      escapeCsv(item.name),
      escapeCsv(item.metadata?.title || ''),
      escapeCsv(item.metadata?.artist || ''),
      escapeCsv(item.metadata?.album || ''),
      escapeCsv(item.metadata?.year || ''),
      escapeCsv(item.metadata?.genre || ''),
      escapeCsv(item.duration.toFixed(2)),
      escapeCsv(formatDurationSec(item.duration)),
      escapeCsv(item.sizeBytes),
      escapeCsv(item.format.toUpperCase()),
      escapeCsv(item.sampleRate),
      escapeCsv(item.channels === 1 ? 'Mono' : 'Stereo'),
      escapeCsv(`${item.bitDepth}-bit`),
      escapeCsv(new Date(item.timestamp).toISOString()),
      escapeCsv((item.tags || []).join('; ')),
      escapeCsv(item.location?.placeName || ''),
      escapeCsv(item.location?.latitude?.toFixed(6) || ''),
      escapeCsv(item.location?.longitude?.toFixed(6) || ''),
      escapeCsv(item.isEncrypted ? 'Yes' : 'No'),
      escapeCsv(item.transcript ? 'Yes' : 'No'),
      escapeCsv(item.transcript ? item.transcript.slice(0, 100).replace(/[\r\n]+/g, ' ') : '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates comprehensive structured JSON manifest
 */
export function generateManifestJson(items: RecordingItem[]): string {
  const totalDuration = items.reduce((acc, it) => acc + (it.duration || 0), 0);
  const totalBytes = items.reduce((acc, it) => acc + (it.sizeBytes || 0), 0);

  const manifest = {
    exportedAt: new Date().toISOString(),
    generator: 'KBT Audio Studio Vault Batch Exporter',
    summary: {
      totalRecordings: items.length,
      totalDurationSeconds: Math.round(totalDuration * 100) / 100,
      totalDurationFormatted: formatDurationSec(totalDuration),
      totalBytes,
      formatsCount: items.reduce<Record<string, number>>((acc, it) => {
        const fmt = it.format.toUpperCase();
        acc[fmt] = (acc[fmt] || 0) + 1;
        return acc;
      }, {})
    },
    recordings: items.map((item) => ({
      id: item.id,
      name: item.name,
      timestamp: item.timestamp,
      createdAtIso: new Date(item.timestamp).toISOString(),
      durationSeconds: item.duration,
      durationFormatted: formatDurationSec(item.duration),
      sizeBytes: item.sizeBytes,
      format: item.format,
      sampleRate: item.sampleRate,
      channels: item.channels,
      bitDepth: item.bitDepth,
      isEncrypted: item.isEncrypted,
      tags: item.tags || [],
      metadata: item.metadata || null,
      location: item.location || null,
      dspFilters: item.dspFilters || null,
      transcript: item.transcript || null
    }))
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Core export function: creates ZIP file containing audio files and metadata,
 * reporting live progress, and triggers user download.
 */
export async function exportRecordingsToZip(
  items: RecordingItem[],
  options: ZipExportOptions,
  onProgress?: (info: ZipProgressInfo) => void
): Promise<{ success: boolean; blob?: Blob; fileName: string; error?: string }> {
  if (items.length === 0) {
    return { success: false, fileName: options.archiveName, error: 'No recordings selected for export.' };
  }

  const zip = new JSZip();
  const nameRegistry = new FileNameRegistry();

  // Root or subdirectories based on structure preference
  const isOrganized = options.structure === 'organized';
  const audioFolder = isOrganized ? zip.folder('audio')! : zip;
  const metaFolder = isOrganized ? zip.folder('metadata')! : zip;
  const transcriptsFolder = isOrganized ? zip.folder('transcripts')! : zip;

  const total = items.length;

  try {
    // Stage 1: Gather files and metadata
    for (let i = 0; i < total; i++) {
      const item = items[i];
      const progressPercent = Math.round(((i) / (total * 2)) * 100);

      onProgress?.({
        percent: progressPercent,
        stage: 'fetching',
        message: `Packaging ${i + 1} of ${total}: ${item.name}`,
        currentItem: item.name,
        processedCount: i + 1,
        totalCount: total
      });

      // Prepare audio file name
      let baseAudioName = item.name.trim();
      const expectedExt = `.${item.format.toLowerCase()}`;
      if (!baseAudioName.toLowerCase().endsWith(expectedExt)) {
        baseAudioName += expectedExt;
      }
      const uniqueAudioName = nameRegistry.getUniqueName(baseAudioName);

      // Name stem for metadata and transcripts
      const dotIdx = uniqueAudioName.lastIndexOf('.');
      const fileStem = dotIdx > 0 ? uniqueAudioName.substring(0, dotIdx) : uniqueAudioName;

      // 1. Audio data
      if (options.includeAudio) {
        const audioBlob = await getRecordingBlob(item);
        if (audioBlob) {
          audioFolder.file(uniqueAudioName, audioBlob);
        } else {
          console.warn(`Audio data unavailable for item ${item.name}. Skipping audio payload.`);
        }
      }

      // 2. Individual Metadata JSON
      if (options.includeMetadataJson) {
        const itemMetadataPayload = {
          id: item.id,
          fileName: uniqueAudioName,
          timestamp: item.timestamp,
          createdAt: new Date(item.timestamp).toISOString(),
          durationSeconds: item.duration,
          durationFormatted: formatDurationSec(item.duration),
          sizeBytes: item.sizeBytes,
          format: item.format,
          sampleRate: item.sampleRate,
          channels: item.channels,
          bitDepth: item.bitDepth,
          isEncrypted: item.isEncrypted,
          tags: item.tags || [],
          id3Metadata: item.metadata || {
            title: item.name,
            artist: 'Unknown',
            album: 'Voice Vault',
            year: new Date(item.timestamp).getFullYear().toString()
          },
          location: item.location || null,
          dspFilters: item.dspFilters || null,
          transcript: item.transcript || null
        };

        const jsonFileName = `${fileStem}.meta.json`;
        metaFolder.file(jsonFileName, JSON.stringify(itemMetadataPayload, null, 2));
      }

      // 3. Transcript text file if present
      if (options.includeTranscripts && item.transcript && item.transcript.trim()) {
        const transcriptText = [
          `# TRANSCRIPT: ${item.name}`,
          `Recorded: ${new Date(item.timestamp).toLocaleString()}`,
          `Duration: ${formatDurationSec(item.duration)}`,
          `Speaker/Artist: ${item.metadata?.artist || 'Unknown'}`,
          `------------------------------------------------------------`,
          item.transcript.trim()
        ].join('\n\n');

        transcriptsFolder.file(`${fileStem}.transcript.txt`, transcriptText);
      }
    }

    // 4. Master Manifest JSON
    if (options.includeManifestJson) {
      zip.file('manifest.json', generateManifestJson(items));
    }

    // 5. Master Manifest CSV
    if (options.includeManifestCsv) {
      zip.file('manifest.csv', generateManifestCsv(items));
    }

    // 6. Helpful README.txt describing archive contents
    const readmeText = [
      `=================================================================`,
      `  KBT VOICE RECORDER STUDIO - VAULT BATCH EXPORT ARCHIVE`,
      `=================================================================`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Recordings: ${items.length}`,
      `Total Duration: ${formatDurationSec(items.reduce((s, it) => s + (it.duration || 0), 0))}`,
      ``,
      `ARCHIVE STRUCTURE:`,
      isOrganized
        ? `- audio/        : High-fidelity audio recordings (${items.map(i => i.format.toUpperCase()).filter((v, i, a) => a.indexOf(v) === i).join(', ')})\n- metadata/     : Individual ID3 and technical metadata JSON files\n- transcripts/  : Speech-to-text transcripts (.txt)`
        : `- All audio files and accompanying .meta.json files placed in root folder`,
      `- manifest.json : Complete structured index for programmatic parsing`,
      `- manifest.csv  : Spreadsheet-ready table for Excel, Google Sheets, or Numbers`,
      ``,
      `ID3 & METADATA INCLUDED:`,
      `All exported recordings contain embedded ID3 tags, GPS geo-stamps, sample rates,`,
      `and acoustic DSP parameters recorded during sessions.`,
      `=================================================================`
    ].join('\n');
    zip.file('README.txt', readmeText);

    // Stage 2: Compress and generate ZIP blob with JSZip progress hook
    onProgress?.({
      percent: 50,
      stage: 'compressing',
      message: 'Compressing archive with DEFLATE...',
      processedCount: total,
      totalCount: total
    });

    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      },
      (metadata) => {
        // metadata.percent is 0 to 100
        const overallPercent = Math.min(99, Math.round(50 + (metadata.percent / 2)));
        onProgress?.({
          percent: overallPercent,
          stage: 'compressing',
          message: `Compressing ZIP archive (${metadata.percent.toFixed(0)}%)...`,
          processedCount: total,
          totalCount: total
        });
      }
    );

    let finalArchiveName = options.archiveName.trim();
    if (!finalArchiveName) {
      finalArchiveName = `vault_recordings_${new Date().toISOString().slice(0, 10)}.zip`;
    }
    if (!finalArchiveName.toLowerCase().endsWith('.zip')) {
      finalArchiveName += '.zip';
    }

    onProgress?.({
      percent: 100,
      stage: 'complete',
      message: 'Export complete! Downloading archive...',
      processedCount: total,
      totalCount: total
    });

    return {
      success: true,
      blob: zipBlob,
      fileName: finalArchiveName
    };
  } catch (error: any) {
    console.error('Error creating ZIP export:', error);
    return {
      success: false,
      fileName: options.archiveName,
      error: error?.message || 'Failed to generate ZIP archive.'
    };
  }
}

/**
 * Triggers native browser download for a Blob
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
