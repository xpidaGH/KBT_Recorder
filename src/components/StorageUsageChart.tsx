import React, { useState, useMemo } from 'react';
import { RecordingItem } from '../types/recorder';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  HardDrive,
  Lock,
  Unlock,
  FileAudio,
  PieChart as PieIcon,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Percent,
  Layers,
  Sparkles,
  ShieldCheck,
  Disc
} from 'lucide-react';

interface StorageUsageChartProps {
  recordings: RecordingItem[];
  onFilterByFormat?: (format: string) => void;
  activeFormatFilter?: string;
}

type MetricMode = 'format' | 'encryption';
type ChartStyle = 'donut' | 'bar';

const FORMAT_COLORS: Record<string, string> = {
  wav: '#06b6d4', // cyan-500
  mp3: '#10b981', // emerald-500
  ogg: '#f59e0b', // amber-500
  webm: '#8b5cf6', // violet-500
  flac: '#3b82f6', // blue-500
  aac: '#ec4899', // pink-500
  m4a: '#f97316', // orange-500
  pcm: '#14b8a6', // teal-500
  other: '#64748b' // slate-500
};

const ENCRYPTION_COLORS = {
  encrypted: '#f59e0b', // amber-500
  unencrypted: '#0ea5e9' // sky-500
};

export const StorageUsageChart: React.FC<StorageUsageChartProps> = ({
  recordings,
  onFilterByFormat,
  activeFormatFilter
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('format');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('donut');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const rounded = Math.round(seconds);
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    return `${mins}m ${secs}s`;
  };

  // Aggregated stats
  const totalSizeBytes = useMemo(
    () => recordings.reduce((sum, r) => sum + (r.sizeBytes || 0), 0),
    [recordings]
  );

  const totalDurationSec = useMemo(
    () => recordings.reduce((sum, r) => sum + (r.duration || 0), 0),
    [recordings]
  );

  // By Audio Format Data
  const formatData = useMemo(() => {
    const map = new Map<string, { sizeBytes: number; count: number; duration: number }>();

    for (const r of recordings) {
      const fmt = (r.format || 'other').toLowerCase();
      const existing = map.get(fmt) || { sizeBytes: 0, count: 0, duration: 0 };
      existing.sizeBytes += r.sizeBytes || 0;
      existing.count += 1;
      existing.duration += r.duration || 0;
      map.set(fmt, existing);
    }

    const items = Array.from(map.entries()).map(([format, data]) => {
      const percentage = totalSizeBytes > 0 ? (data.sizeBytes / totalSizeBytes) * 100 : 0;
      const sizeMB = Number((data.sizeBytes / (1024 * 1024)).toFixed(3));
      return {
        key: format,
        name: format.toUpperCase(),
        label: `${format.toUpperCase()} Audio`,
        sizeBytes: data.sizeBytes,
        sizeMB,
        sizeFormatted: formatSize(data.sizeBytes),
        count: data.count,
        durationFormatted: formatDuration(data.duration),
        percentage: Number(percentage.toFixed(1)),
        color: FORMAT_COLORS[format] || FORMAT_COLORS.other
      };
    });

    // Sort by largest space consumption
    return items.sort((a, b) => b.sizeBytes - a.sizeBytes);
  }, [recordings, totalSizeBytes]);

  // By Encryption Status Data
  const encryptionData = useMemo(() => {
    let encryptedSize = 0;
    let encryptedCount = 0;
    let encryptedDuration = 0;

    let unencryptedSize = 0;
    let unencryptedCount = 0;
    let unencryptedDuration = 0;

    for (const r of recordings) {
      if (r.isEncrypted) {
        encryptedSize += r.sizeBytes || 0;
        encryptedCount += 1;
        encryptedDuration += r.duration || 0;
      } else {
        unencryptedSize += r.sizeBytes || 0;
        unencryptedCount += 1;
        unencryptedDuration += r.duration || 0;
      }
    }

    const items = [
      {
        key: 'encrypted',
        name: 'Encrypted (AES-GCM)',
        label: 'Encrypted Vault Records',
        sizeBytes: encryptedSize,
        sizeMB: Number((encryptedSize / (1024 * 1024)).toFixed(3)),
        sizeFormatted: formatSize(encryptedSize),
        count: encryptedCount,
        durationFormatted: formatDuration(encryptedDuration),
        percentage: totalSizeBytes > 0 ? Number(((encryptedSize / totalSizeBytes) * 100).toFixed(1)) : 0,
        color: ENCRYPTION_COLORS.encrypted
      },
      {
        key: 'unencrypted',
        name: 'Plain / Studio PCM',
        label: 'Unencrypted Audio',
        sizeBytes: unencryptedSize,
        sizeMB: Number((unencryptedSize / (1024 * 1024)).toFixed(3)),
        sizeFormatted: formatSize(unencryptedSize),
        count: unencryptedCount,
        durationFormatted: formatDuration(unencryptedDuration),
        percentage: totalSizeBytes > 0 ? Number(((unencryptedSize / totalSizeBytes) * 100).toFixed(1)) : 0,
        color: ENCRYPTION_COLORS.unencrypted
      }
    ];

    return items;
  }, [recordings, totalSizeBytes]);

  const activeChartData = metricMode === 'format' ? formatData : encryptionData;

  const encryptedPercent = useMemo(() => {
    const enc = encryptionData.find((d) => d.key === 'encrypted');
    return enc ? enc.percentage : 0;
  }, [encryptionData]);

  const topFormat = useMemo(() => {
    return formatData[0] || null;
  }, [formatData]);

  if (recordings.length === 0) return null;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs text-slate-200 min-w-[210px] animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-bold text-white text-xs">{data.name}</span>
            </div>
            <span className="font-mono text-sky-400 font-bold bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800 text-[11px]">
              {data.percentage}%
            </span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Storage:</span>
              <span className="font-mono font-semibold text-slate-100">{data.sizeFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Recording Count:</span>
              <span className="font-mono font-semibold text-slate-100">
                {data.count} {data.count === 1 ? 'file' : 'files'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Audio Duration:</span>
              <span className="font-mono text-slate-200">{data.durationFormatted}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
      {/* Top Header & Collapsible Toggle Bar */}
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Vault Storage Distribution
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                {formatSize(totalSizeBytes)} total
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive storage ratio visualization across audio encoding formats and encryption status.
            </p>
          </div>
        </div>

        {/* View Mode & Collapse Controls */}
        <div className="flex items-center gap-2">
          {/* Dimension Selector: Format vs. Encryption */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMetricMode('format')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'format'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileAudio className="w-3 h-3" />
              <span>By Format</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('encryption')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'encryption'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>By Encryption</span>
            </button>
          </div>

          {/* Chart Type Toggle: Donut vs. Bar */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartStyle('donut')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                chartStyle === 'donut'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Donut Chart View"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('bar')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                chartStyle === 'bar'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Bar Chart View"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand storage chart' : 'Collapse storage chart'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Chart Content */}
      {!isCollapsed && (
        <div className="p-4 flex flex-col gap-4 animate-fadeIn">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-sky-400" /> Space Utilized
              </span>
              <span className="font-mono text-sm font-bold text-slate-100">
                {formatSize(totalSizeBytes)}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Disc className="w-3 h-3 text-emerald-400" /> Leading Format
              </span>
              <span className="font-mono text-sm font-bold text-slate-100 truncate">
                {topFormat ? `${topFormat.name} (${topFormat.percentage}%)` : 'None'}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" /> Encrypted Ratio
              </span>
              <span className="font-mono text-sm font-bold text-amber-300">
                {encryptedPercent}% Encrypted
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" /> Avg Track Size
              </span>
              <span className="font-mono text-sm font-bold text-slate-100">
                {recordings.length > 0 ? formatSize(totalSizeBytes / recordings.length) : '0 B'}
              </span>
            </div>
          </div>

          {/* Recharts Visualization Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {/* Chart Area */}
            <div className="md:col-span-7 h-56 w-full flex items-center justify-center">
              {chartStyle === 'donut' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={activeChartData}
                      dataKey="sizeBytes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="#0f172a"
                      strokeWidth={2}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                          className="transition-opacity duration-200 cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `${val > 1024 * 1024 ? (val / (1024 * 1024)).toFixed(1) + 'MB' : (val / 1024).toFixed(0) + 'KB'}`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="sizeBytes"
                      radius={[0, 4, 4, 0]}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Interactive Legend List */}
            <div className="md:col-span-5 flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                {metricMode === 'format' ? 'Encoding Format Breakdown' : 'Cryptographic Status Breakdown'}
              </span>

              <div className="flex flex-col gap-1.5">
                {activeChartData.map((item, idx) => {
                  const isHovered = activeIndex === idx;
                  const isSelectedFilter = activeFormatFilter?.toLowerCase() === item.key.toLowerCase();

                  return (
                    <div
                      key={item.key}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onClick={() => {
                        if (metricMode === 'format' && onFilterByFormat) {
                          onFilterByFormat(isSelectedFilter ? '' : item.key);
                        }
                      }}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs cursor-pointer select-none ${
                        isSelectedFilter
                          ? 'bg-sky-950/80 border-sky-500 shadow-md ring-1 ring-sky-500'
                          : isHovered
                          ? 'bg-slate-800/90 border-slate-700'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-100 truncate text-[11px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.count} {item.count === 1 ? 'track' : 'tracks'} · {item.durationFormatted}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 font-mono">
                        <span className="text-[11px] font-bold text-slate-200">
                          {item.sizeFormatted}
                        </span>
                        <span className="text-[10px] text-sky-400 font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
