import React from 'react';
import { Info } from 'lucide-react';

export function ModelStatusBadge({ status, etas }: { status: 'live'|'partial'|'fallback'|'idle'; etas: Record<string, number> }) {
  const color = status === 'live' ? 'text-emerald-400 border-emerald-400/50' : status === 'partial' ? 'text-yellow-300 border-yellow-300/50' : status === 'fallback' ? 'text-red-300 border-red-400/60' : 'text-muted-foreground border-border/50';
  const label = status === 'live' ? 'Live' : status === 'partial' ? 'Partial' : status === 'fallback' ? 'Fallback' : 'Idle';
  return (
    <div className={`inline-flex items-center gap-2 text-xs px-2 py-0.5 rounded border ${color}`} role="status" aria-live="polite">
      <span>{label}</span>
      <div className="relative group">
        <Info size={14} aria-hidden />
        <div role="tooltip" className="absolute right-0 top-5 hidden group-hover:block bg-black/80 text-white text-[11px] p-2 rounded shadow max-w-xs">
          <div className="font-semibold mb-1">Model Status Details</div>
          {Object.keys(etas).length ? (
            <ul className="list-disc ml-4 space-y-0.5">
              {Object.entries(etas).map(([stage, eta]) => (
                <li key={stage}>{stage}: ~{Math.max(0, Math.round(eta))}s remaining</li>
              ))}
            </ul>
          ) : (
            <div>No pending stages</div>
          )}
        </div>
      </div>
    </div>
  );
}