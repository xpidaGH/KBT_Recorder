/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AudioConfig, GeoLocationData, RecordingItem } from './types/recorder';
import { ProAudioEngine } from './utils/audioEngine';
import { getCurrentGPSPosition } from './utils/geolocation';
import {
  saveRecordingToDB,
  getAllRecordingsFromDB,
  deleteRecordingFromDB,
  deleteMultipleRecordingsFromDB,
  updateRecordingInDB,
  updateMultipleRecordingsInDB
} from './utils/storage';

import { TopBar } from './components/TopBar';
import { VisualizerPanel } from './components/VisualizerPanel';
import { AudioSettingsPanel } from './components/AudioSettingsPanel';
import { RecordingControls } from './components/RecordingControls';
import { RecordingsList } from './components/RecordingsList';
import { AudioEditorModal } from './components/AudioEditorModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { FormatConverterModal } from './components/FormatConverterModal';
import { CryptoModal } from './components/CryptoModal';
import { UserGuideModal } from './components/UserGuideModal';
import { InstallationModal } from './components/InstallationModal';
import { CapstoneExplorer } from './components/CapstoneExplorer';
import { CloudHubView } from './components/CloudHubView';
import { GeminiAnalysisModal } from './components/GeminiAnalysisModal';
import { LocationDetailsModal } from './components/LocationDetailsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'capstone' | 'clouds'>('studio');

  // Audio Engine Configuration
  const [config, setConfig] = useState<AudioConfig>({
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    format: 'wav',
    gain: 1.0,
    agc: true,
    vadEnabled: true,
    vadThreshold: -42,
    vadDuration: 1200,
    inputDeviceId: '',
    gpsTaggingEnabled: true
  });

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBytesEstimate, setRecordedBytesEstimate] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveLocation, setLiveLocation] = useState<GeoLocationData | null>(null);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);

  // Real-time Meter Data
  const [meterData, setMeterData] = useState({
    leftDb: -60,
    rightDb: -60,
    rmsDb: -60,
    isClipping: false,
    isSpeaking: false
  });

  // Modals state
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [syncModalItem, setSyncModalItem] = useState<RecordingItem | null>(null);
  const [editorModalItem, setEditorModalItem] = useState<RecordingItem | null>(null);
  const [editorModalInitialTab, setEditorModalInitialTab] = useState<'audio' | 'dsp' | 'metadata'>('audio');
  const [converterModalItem, setConverterModalItem] = useState<RecordingItem | null>(null);
  const [cryptoModalItem, setCryptoModalItem] = useState<RecordingItem | null>(null);
  const [geminiModalItem, setGeminiModalItem] = useState<RecordingItem | null>(null);
  const [locationModalItem, setLocationModalItem] = useState<RecordingItem | null>(null);

  // References
  const audioEngineRef = useRef<ProAudioEngine | null>(null);
  const meterIntervalRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any | null>(null);

  // Load recordings from IndexedDB on startup
  useEffect(() => {
    async function loadRecordings() {
      try {
        const stored = await getAllRecordingsFromDB();
        setRecordings(stored);
      } catch (err) {
        console.error('Failed to load recordings from IndexedDB:', err);
      }
    }
    loadRecordings();
  }, []);

  // Update audio engine settings dynamically when gain/AGC change
  const handleChangeConfig = (newConfig: Partial<AudioConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (audioEngineRef.current) {
        audioEngineRef.current.updateConfig(updated);
      }
      return updated;
    });
  };

  // Start Recording
  const handleStartRecording = async () => {
    try {
      const engine = new ProAudioEngine(config);
      await engine.start();
      audioEngineRef.current = engine;

      setIsRecording(true);
      setIsPaused(false);
      setLiveTranscript('');
      setRecordedBytesEstimate(0);

      // Acquire GPS position if geolocation tagging is enabled
      if (config.gpsTaggingEnabled) {
        getCurrentGPSPosition()
          .then((loc) => setLiveLocation(loc))
          .catch((err) => {
            console.warn('GPS location acquisition error:', err.message);
          });
      } else {
        setLiveLocation(null);
      }

      // Start Real-time VU meter polling
      meterIntervalRef.current = window.setInterval(() => {
        if (audioEngineRef.current) {
          const meters = audioEngineRef.current.getMeterData();
          setMeterData(meters);

          // Estimate bytes recorded
          const sampleCount = audioEngineRef.current.getRecordedSampleCount();
          const bytes = sampleCount * config.channels * (config.bitDepth / 8);
          setRecordedBytesEstimate(bytes);
        }
      }, 50);

      // Initialize Web Speech API for real-time speech preview if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            setLiveTranscript(current);
          };

          recognition.onerror = (e: any) => {
            console.warn('Speech recognition interim warning:', e.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (err) {
          console.warn('Speech recognition not available or denied:', err);
        }
      }
    } catch (err: any) {
      alert(`Could not start audio recording: ${err.message || 'Microphone access denied'}`);
      setIsRecording(false);
    }
  };

  // Pause Recording
  const handlePauseRecording = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.pause();
      setIsPaused(true);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (err) {
          // ignore
        }
      }
    }
  };

  // Resume Recording
  const handleResumeRecording = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.resume();
      setIsPaused(false);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch (err) {
          // ignore
        }
      }
    }
  };

  // Stop Recording and Save
  const handleStopRecording = async () => {
    if (!audioEngineRef.current) return;

    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    try {
      const { blob, duration, sampleRate, channels, peakData } =
        await audioEngineRef.current.stop();

      const id = crypto.randomUUID();
      const timestamp = Date.now();
      const dateStr = new Date(timestamp)
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      const name = `KBT_${dateStr}.${config.format}`;

      const locationToAttach = config.gpsTaggingEnabled ? (liveLocation || undefined) : undefined;
      const tags = [config.format.toUpperCase(), `${sampleRate}Hz`];
      if (locationToAttach) {
        tags.push('GPS Tagged');
        if (locationToAttach.placeName) {
          tags.push(locationToAttach.placeName.split(',')[0]);
        }
      }

      const newItem: RecordingItem = {
        id,
        name,
        timestamp,
        duration,
        sizeBytes: blob.size,
        format: config.format,
        sampleRate,
        channels,
        bitDepth: config.bitDepth,
        blob,
        blobUrl: URL.createObjectURL(blob),
        waveformPeakData: peakData,
        isEncrypted: false,
        transcript: liveTranscript || undefined,
        tags,
        syncHistory: [],
        location: locationToAttach
      };

      await saveRecordingToDB(newItem);
      setRecordings((prev) => [newItem, ...prev]);

      setIsRecording(false);
      setIsPaused(false);
      audioEngineRef.current = null;
      setLiveLocation(null);
      setMeterData({ leftDb: -60, rightDb: -60, rmsDb: -60, isClipping: false, isSpeaking: false });
    } catch (err: any) {
      alert(`Error finalizing audio file: ${err.message}`);
      setIsRecording(false);
      audioEngineRef.current = null;
    }
  };

  // Delete Recording
  const handleDeleteRecording = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;
    try {
      await deleteRecordingFromDB(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete recording:', err);
    }
  };

  // Bulk Delete Recordings
  const handleBulkDelete = async (ids: string[]) => {
    try {
      await deleteMultipleRecordingsFromDB(ids);
      setRecordings((prev) => prev.filter((r) => !ids.includes(r.id)));
    } catch (err) {
      console.error('Failed to bulk delete recordings:', err);
    }
  };

  // Update a recording (e.g. after encryption/decryption or cloud sync)
  const handleUpdateRecording = async (updated: RecordingItem) => {
    try {
      await updateRecordingInDB(updated);
      setRecordings((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (err) {
      console.error('Failed to update recording:', err);
    }
  };

  // Bulk update multiple recordings (e.g. after batch renaming or bulk tagging)
  const handleBulkUpdate = async (updatedItems: RecordingItem[]) => {
    try {
      await updateMultipleRecordingsInDB(updatedItems);
      const updateMap = new Map(updatedItems.map((item) => [item.id, item]));
      setRecordings((prev) =>
        prev.map((r) => (updateMap.has(r.id) ? updateMap.get(r.id)! : r))
      );
    } catch (err) {
      console.error('Failed to bulk update recordings:', err);
    }
  };

  // Add trimmed or transcoded item
  const handleAddRecording = async (newItem: RecordingItem) => {
    try {
      await saveRecordingToDB(newItem);
      setRecordings((prev) => [newItem, ...prev]);
    } catch (err) {
      console.error('Failed to save new recording item:', err);
    }
  };

  // Visualizer callback for canvas 60 FPS animation
  const getVisualizerData = useCallback(() => {
    if (audioEngineRef.current) {
      return audioEngineRef.current.getVisualizerData();
    }
    return {
      waveform: new Float32Array(0),
      frequency: new Uint8Array(0)
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* 3-Zone Top Bar Contract */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        onOpenInstallation={() => setIsInstallOpen(true)}
        recordingCount={recordings.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {activeTab === 'studio' && (
          <div className="flex flex-col gap-6">
            {/* Visualizer Panel (Oscilloscope, FFT, Stereo VU Meter) */}
            <VisualizerPanel
              isRecording={isRecording}
              meterData={meterData}
              getVisualizerData={getVisualizerData}
              vadEnabled={config.vadEnabled}
              silenceThresholdDb={config.vadThreshold}
            />

            {/* Transport & Recording Controls */}
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              onStart={handleStartRecording}
              onPause={handlePauseRecording}
              onResume={handleResumeRecording}
              onStop={handleStopRecording}
              config={config}
              recordedBytesEstimate={recordedBytesEstimate}
              liveTranscript={liveTranscript}
              onClearTranscript={() => setLiveTranscript('')}
              liveLocation={liveLocation}
            />

            {/* Pro Audio Hardware & DSP Settings */}
            <AudioSettingsPanel
              config={config}
              onChangeConfig={handleChangeConfig}
              disabled={isRecording}
            />

            {/* Quick Vault Preview (Most Recent Recordings) */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">Recent Session Vault</h3>
                <button
                  onClick={() => setActiveTab('library')}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  View All Recordings ({recordings.length}) →
                </button>
              </div>

              <RecordingsList
                recordings={recordings.slice(0, 3)}
                onDelete={handleDeleteRecording}
                onOpenSyncModal={(item) => setSyncModalItem(item)}
                onOpenEditorModal={(item) => setEditorModalItem(item)}
                onOpenConverterModal={(item) => setConverterModalItem(item)}
                onOpenCryptoModal={(item) => setCryptoModalItem(item)}
                onAnalyzeWithGemini={(item) => setGeminiModalItem(item)}
                onOpenLocationModal={(item) => setLocationModalItem(item)}
              />
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Encrypted Vault & Audio Library</h2>
                <span className="text-xs text-slate-400">
                  Offline IndexedDB storage · Zero-Knowledge AES-256-GCM encryption · GPS Geotagged Field Audio
                </span>
              </div>
              <button
                onClick={() => setActiveTab('studio')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                + New Studio Recording
              </button>
            </div>

            <RecordingsList
              recordings={recordings}
              onDelete={handleDeleteRecording}
              onBulkDelete={handleBulkDelete}
              onBulkUpdate={handleBulkUpdate}
              onOpenSyncModal={(item) => setSyncModalItem(item)}
              onOpenEditorModal={(item) => {
                setEditorModalInitialTab('audio');
                setEditorModalItem(item);
              }}
              onOpenDSPEditor={(item) => {
                setEditorModalInitialTab('dsp');
                setEditorModalItem(item);
              }}
              onOpenMetadataEditor={(item) => {
                setEditorModalInitialTab('metadata');
                setEditorModalItem(item);
              }}
              onOpenConverterModal={(item) => setConverterModalItem(item)}
              onOpenCryptoModal={(item) => setCryptoModalItem(item)}
              onAnalyzeWithGemini={(item) => setGeminiModalItem(item)}
              onOpenLocationModal={(item) => setLocationModalItem(item)}
            />
          </div>
        )}

        {activeTab === 'clouds' && (
          <CloudHubView
            recordings={recordings}
            onOpenSyncModal={(item) => setSyncModalItem(item)}
          />
        )}

        {activeTab === 'capstone' && <CapstoneExplorer />}
      </main>

      {/* Interactive Modals */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />

      <InstallationModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      <CloudSyncModal
        item={syncModalItem}
        onClose={() => setSyncModalItem(null)}
        onSyncCompleted={(updated) => {
          handleUpdateRecording(updated);
          setSyncModalItem(null);
        }}
      />

      <AudioEditorModal
        item={editorModalItem}
        onClose={() => setEditorModalItem(null)}
        onSaveTrimmed={(newItem) => {
          handleAddRecording(newItem);
          setEditorModalItem(null);
        }}
        onUpdateItem={(updated) => {
          handleUpdateRecording(updated);
          setEditorModalItem(updated);
        }}
        initialTab={editorModalInitialTab}
      />

      <FormatConverterModal
        item={converterModalItem}
        onClose={() => setConverterModalItem(null)}
        onConversionCompleted={(newItem) => {
          handleAddRecording(newItem);
          setConverterModalItem(null);
        }}
      />

      <CryptoModal
        item={cryptoModalItem}
        onClose={() => setCryptoModalItem(null)}
        onUpdateItem={(updated) => {
          handleUpdateRecording(updated);
          setCryptoModalItem(null);
        }}
      />

      <GeminiAnalysisModal
        item={geminiModalItem}
        onClose={() => setGeminiModalItem(null)}
      />

      <LocationDetailsModal
        item={locationModalItem}
        onClose={() => setLocationModalItem(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <span>
          KBT_Recorder Pro Architecture Ecosystem · Inspired by RecForge II & Voice Record Pro · Apache 2.0 License
        </span>
      </footer>
    </div>
  );
}
