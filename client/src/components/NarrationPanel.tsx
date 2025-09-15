import React from 'react';

// NarrationPanel.tsx
// - Shows a short scrolling narration list describing ODIN decisions

export default function NarrationPanel({ lines = [] }: { lines?: string[] }) {
  return (
    <div style={{ maxHeight: 160, overflow: 'auto' }}>
      {lines.length === 0 ? <div style={{ color: '#9aa3ad' }}>No narration yet</div> : lines.slice().reverse().map((l, i) => (<div key={i} style={{ padding: 6, borderBottom: '1px dashed rgba(255,255,255,0.02)' }}>{l}</div>))}
    </div>
  );
}
 