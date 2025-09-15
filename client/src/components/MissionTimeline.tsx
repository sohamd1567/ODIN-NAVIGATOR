import React from 'react';
import { MissionData } from '../types/mission';

export default function MissionTimeline({ missions, onHover, onSelect }: { missions: MissionData[]; onHover: (id: string | null) => void; onSelect: (id: string) => void }) {
  const sorted = missions.slice().sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());
  return (
    <div className="p-3 bg-odin-card rounded-lg shadow-lg max-h-[560px] overflow-auto" style={{ width: 300 }}>
      <h3 className="text-lg font-bold text-odin-accent mb-2">Mission Timeline</h3>
      <div className="space-y-2">
        {sorted.map(m => (
          <div key={m.id} className="flex items-center justify-between p-2 hover:bg-odin-hover rounded cursor-pointer" onMouseEnter={() => onHover(m.id)} onMouseLeave={() => onHover(null)} onClick={() => onSelect(m.id)}>
            <div>
              <div className="font-semibold text-sm text-odin-foreground">{m.missionName}</div>
              <div className="text-xs text-odin-muted">{new Date(m.launchDate).toLocaleDateString()}</div>
            </div>
            <div className="ml-2">
              {m.outcome === 'success' ? <span className="text-green-400">✔️</span> : <span className="text-red-400">❌</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
