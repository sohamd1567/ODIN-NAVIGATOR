import React from 'react';

export default function SpacecraftSVG({ x, y, firing = false }: { x: number; y: number; firing?: boolean }) {
  // Simple Chandrayaan-style SVG: central bus + payload, with small thruster flame when firing
  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
      <g transform="translate(-12,-12)">
        <rect x={0} y={0} width={24} height={18} rx={3} fill="#e6e6e6" stroke="#bbb" strokeWidth={0.6} />
        <circle cx={6} cy={9} r={3} fill="#c9c9c9" />
        <rect x={14} y={3} width={6} height={12} rx={2} fill="#d6d6d6" />
        {/* ISRO-style payload domes */}
        <circle cx={4} cy={3} r={1.6} fill="#fff" opacity={0.8} />
        <circle cx={8} cy={15} r={1.2} fill="#fff" opacity={0.9} />
        {/* Thruster flame */}
        {firing && (
          <g transform="translate(6,18)">
            <path d="M0 0 C-3 6, 3 6, 0 0" fill="orange" opacity={0.9}>
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="0.3s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="scale" values="1;1.4;1" dur="0.3s" repeatCount="indefinite" />
            </path>
          </g>
        )}
      </g>
    </g>
  );
}
