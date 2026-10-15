import React from 'react';
import { GeoLocationData, RecordingItem } from '../types/recorder';
import { X, MapPin, Navigation, ExternalLink, Copy, Check, Compass, ShieldCheck } from 'lucide-react';
import { formatCoordinates, getMapsUrl, getOpenStreetMapUrl } from '../utils/geolocation';

interface LocationDetailsModalProps {
  item: RecordingItem | null;
  onClose: () => void;
}

export const LocationDetailsModal: React.FC<LocationDetailsModalProps> = ({
  item,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);
  if (!item || !item.location) return null;

  const loc: GeoLocationData = item.location;

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(`${loc.latitude}, ${loc.longitude}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // OpenStreetMap embed URL (safe, no billing key needed)
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.008}%2C${loc.latitude - 0.005}%2C${loc.longitude + 0.008}%2C${loc.latitude + 0.005}&layer=mapnik&marker=${loc.latitude}%2C${loc.longitude}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-white">GPS Geolocation Metadata</h2>
              <span className="text-xs text-slate-400 truncate max-w-xs">{item.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Place locality header */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-white">Recorded Location:</span>
              <span className="text-sm font-bold text-emerald-400">
                {loc.placeName || 'Field Recording Site'}
              </span>
            </div>

            <button
              onClick={handleCopyCoordinates}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy latitude & longitude"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Lat/Lon'}</span>
            </button>
          </div>

          <div className="font-mono text-xs text-slate-300">
            {formatCoordinates(loc.latitude, loc.longitude)}
          </div>
        </div>

        {/* Interactive Map Embed */}
        <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
          <iframe
            title="OpenStreetMap Location"
            src={osmEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">Latitude</span>
            <span className="font-mono font-semibold text-slate-200">{loc.latitude.toFixed(6)}°</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">Longitude</span>
            <span className="font-mono font-semibold text-slate-200">{loc.longitude.toFixed(6)}°</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">Accuracy</span>
            <span className="font-mono font-semibold text-emerald-400">
              {loc.accuracy ? `±${loc.accuracy} m` : 'Standard'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">Altitude</span>
            <span className="font-mono font-semibold text-slate-200">
              {loc.altitude ? `${loc.altitude} m` : 'Sea Level'}
            </span>
          </div>
        </div>

        {/* Navigation / External Map Links */}
        <div className="flex items-center gap-3 pt-2">
          <a
            href={getMapsUrl(loc.latitude, loc.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>

          <a
            href={getOpenStreetMapUrl(loc.latitude, loc.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open in OpenStreetMap</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
