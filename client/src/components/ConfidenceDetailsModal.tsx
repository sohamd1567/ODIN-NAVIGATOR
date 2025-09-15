import React, { useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export function ConfidenceDetailsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  const factors = [
    { factor: 'Comms SNR', contribution: 24, uncertainty: 12 },
    { factor: 'Radiation Forecast', contribution: 18, uncertainty: 8 },
    { factor: 'Trajectory Dispersion', contribution: 32, uncertainty: 15 },
    { factor: 'Thermal Margins', contribution: 10, uncertainty: 5 },
  ];
  // Mock CI series
  const ci = new Array(30).fill(0).map((_, i) => ({ t: i, offsetKm: 5 + Math.sin(i/5)*2, delayH: 1 + Math.cos(i/6) }));

  return (
    <div className="fixed inset-0 z-[70] bg-black/50" role="dialog" aria-modal="true" aria-labelledby="conf-title" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full w-[520px] bg-white text-black p-4 overflow-y-auto outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 id="conf-title" className="text-base font-semibold">Confidence Details</h3>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="mb-3">
          <div className="text-xs font-semibold mb-1">Factor contributions</div>
          <table className="w-full text-xs border">
            <thead>
              <tr className="bg-gray-100"><th className="text-left p-1">Factor</th><th className="text-left p-1">Contribution %</th><th className="text-left p-1">Uncertainty %</th></tr>
            </thead>
            <tbody>
              {factors.map((f) => (
                <tr key={f.factor} className="border-t"><td className="p-1">{f.factor}</td><td className="p-1">{f.contribution}</td><td className="p-1">{f.uncertainty}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="h-32">
            <div className="text-xs mb-1">Trajectory offset (km)</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ci}>
                <XAxis dataKey="t" hide />
                <YAxis width={28} />
                <Tooltip />
                <Line dataKey="offsetKm" stroke="#0ea5e9" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-32">
            <div className="text-xs mb-1">Delay (h)</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ci}>
                <XAxis dataKey="t" hide />
                <YAxis width={28} />
                <Tooltip />
                <Line dataKey="delayH" stroke="#f59e0b" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-1">Suggested next steps</div>
          <ul className="list-disc ml-4 text-xs">
            <li>Review Trajectory Dispersion inputs</li>
            <li>Enable stronger FEC on low SNR passes</li>
            <li>Collect additional thermal data during next DSN window</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
