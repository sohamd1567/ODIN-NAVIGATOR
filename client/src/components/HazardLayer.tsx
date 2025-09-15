import React from 'react';

export type Hazard = { id: string; x: number; y: number; r: number; type: 'asteroid' | 'debris' | 'solar' };

export default function HazardLayer({ hazards = [], onToggle = () => {}, enabled = true }: { hazards?: Hazard[]; onToggle?: () => void; enabled?: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <filter id="pulse"><feGaussianBlur stdDeviation="2" result="b"/></filter>
        </defs>
        {enabled && hazards.map(h => {
          if (h.type === 'asteroid') {
            return <circle key={h.id} cx={h.x} cy={h.y} r={h.r} fill="#888" opacity={0.9} />;
          }
          if (h.type === 'debris') {
            return <g key={h.id}>
              <circle cx={h.x} cy={h.y} r={Math.max(2, h.r/6)} fill="#ffd06b" opacity={0.95} />
            </g>;
          }
          return <g key={h.id}><circle cx={h.x} cy={h.y} r={h.r} fill="orange" opacity={0.12} /></g>;
        })}
      </svg>
    </div>
  );
}
