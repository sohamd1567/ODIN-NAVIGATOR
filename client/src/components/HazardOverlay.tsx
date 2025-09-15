import React from 'react';

// HazardOverlay.tsx
// - Placeholder component that shows a list of hazards and allows adding a simple hazard

export default function HazardOverlay({ hazards = [], onAdd = () => {}, onClear = () => {} }: { hazards?: any[]; onAdd?: (h: any) => void; onClear?: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button className="button-odin" onClick={() => onAdd({ x: 300, y: 80, r: 60, type: 'danger' })}>Add Asteroid</button>
        <button className="button-odin" onClick={() => onAdd({ x: 220, y: 180, r: 80, type: 'caution' })}>Add Debris</button>
        <button className="button-odin" onClick={() => onClear()}>Clear</button>
      </div>
      <div style={{ fontSize: 13 }}>
        {hazards.length === 0 ? <div style={{ color: '#9aa3ad' }}>No hazards placed</div> : hazards.map((h, i) => (<div key={i}>• {h.type} at ({Math.round(h.x)},{Math.round(h.y)}) r={h.r}</div>))}
      </div>
    </div>
  );
}
 
