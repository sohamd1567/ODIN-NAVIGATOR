import React from 'react';
import type { TransferMode } from './useTrajectorySimulation';

export default function TransferModeToggle({ mode, onChange }: { mode: TransferMode; onChange: (m: TransferMode) => void }) {
  return (
    <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 40 }}>
      <div style={{ background: 'rgba(8,20,36,0.6)', padding: 8, borderRadius: 6, color: '#9FF29F', fontFamily: 'monospace' }}>
        <div style={{ fontSize: 12 }}>Trajectory Mode</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button onClick={() => onChange('direct')} style={{ background: mode === 'direct' ? '#0b6623' : '#083048', color: '#9FF29F', border: 'none', padding: '6px 8px', borderRadius: 4 }}>Direct</button>
          <button onClick={() => onChange('hohmann')} style={{ background: mode === 'hohmann' ? '#0b6623' : '#083048', color: '#9FF29F', border: 'none', padding: '6px 8px', borderRadius: 4 }}>Hohmann</button>
          <button onClick={() => onChange('low-energy')} style={{ background: mode === 'low-energy' ? '#0b6623' : '#083048', color: '#9FF29F', border: 'none', padding: '6px 8px', borderRadius: 4 }}>Low-E</button>
        </div>
      </div>
    </div>
  );
}
