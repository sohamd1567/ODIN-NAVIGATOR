import React from 'react';

// ConfidenceMeter.tsx
// - Simple circular gauge that shows a 0-100 value

export default function ConfidenceMeter({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={64} height={64} viewBox="0 0 64 64">
        <g transform="translate(32,32)">
          <circle r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
          <circle r={r} fill="none" stroke="#00ffd5" strokeWidth={6} strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90)" style={{ transition: 'stroke-dasharray 300ms' }} />
          <text x={0} y={6} textAnchor="middle" fill="#dff" fontSize={12} fontWeight={700}>{pct}%</text>
        </g>
      </svg>
      <div style={{ fontSize: 12, color: '#9aa3ad' }}>ODIN Confidence</div>
    </div>
  );
}
 