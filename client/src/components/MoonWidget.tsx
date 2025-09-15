import React from 'react';

interface MoonWidgetProps {
  phase?: string;
  illumination?: number; // 0..1
  distance_km?: number;
  loading?: boolean;
  error?: string | null;
}

export default function MoonWidget({ phase = 'Unknown', illumination = 0, distance_km = 384400, loading = false, error = null }: MoonWidgetProps) {
  const ill = Math.max(0, Math.min(1, Number(illumination) || 0));
  const radius = 40;
  // offset controls the crescent shape; map illumination 0..1 to offset -radius..+radius
  const offset = (1 - ill) * radius * 1.6 - radius * 0.8;

  return (
    <div className="flex items-center space-x-3">
      <svg width="64" height="64" viewBox="0 0 100 100" className="rounded-full">
        <defs>
          <clipPath id="moon-clip">
            <circle cx="50" cy="50" r="45" />
          </clipPath>
        </defs>
        <g clipPath="url(#moon-clip)">
          {/* base disk */}
          <circle cx="50" cy="50" r="45" fill="#f8fafc" stroke="#cbd5e1" />
          {/* shadow circle to form crescent; position varies with illumination */}
          <circle cx={50 + offset} cy="50" r="45" fill="#0f172a" opacity="0.95" />
          {/* subtle rim */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </g>
      </svg>
      <div className="text-sm">
        <div className="font-medium">Moon</div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-xs text-red-400">{error}</div>
        ) : (
          <div className="text-xs text-muted-foreground">{phase} · {Math.round(ill * 100)}% · {Math.round(distance_km).toLocaleString()} km</div>
        )}
      </div>
    </div>
  );
}
