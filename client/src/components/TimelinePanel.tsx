import React from 'react';

// TimelinePanel.tsx
// - Simple chronological list of missions (clicking emits selection)

type MissionBrief = {
  id: string;
  name: string;
  date: string;
  outcome?: string;
};

export default function TimelinePanel({ missions, onSelectMission }: { missions: MissionBrief[]; onSelectMission: (id: string) => void }) {
  const sorted = missions.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return (
    <div style={{ maxHeight: 260, overflow: 'auto' }}>
      {sorted.map(m => (
        <div key={m.id} style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => onSelectMission(m.id)}>
            <div style={{ fontWeight: 700 }}>{m.name}</div>
            <div style={{ fontSize: 12, color: '#9aa3ad' }}>{m.date}</div>
          </div>
          <div style={{ fontSize: 12, color: m.outcome && m.outcome.toLowerCase().includes('fail') ? '#ff4b4b' : '#6bff88' }}>{m.outcome}</div>
        </div>
      ))}
    </div>
  );
}
 