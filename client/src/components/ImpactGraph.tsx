import React, { useMemo, useState } from 'react';
import { Graph } from '@visx/network';
import { ParentSize } from '@visx/responsive';
import { useMission } from '@/context/MissionContext';

export type ImpactNode = { id: string; label: string; type: 'hazard'|'subsystem'|'metric'; delta?: number };
export type ImpactLink = { source: string; target: string; weight?: number };

function colorFor(type: ImpactNode['type']) {
  return type === 'hazard' ? '#F59E0B' : type === 'subsystem' ? '#60A5FA' : '#F43F5E';
}

export default function ImpactGraph({ nodes, links }: { nodes: ImpactNode[]; links: ImpactLink[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { addLog } = useMission();

  const data = useMemo(() => ({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ source: l.source, target: l.target })) }), [nodes, links]);

  const outgoingPath = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>();
    const adj: Record<string, string[]> = {};
    links.forEach(l => { (adj[l.source] = adj[l.source] || []).push(l.target); });
    const dfs = (u: string) => {
      (adj[u] || []).forEach(v => { const key = `${u}->${v}`; if (!set.has(key)) { set.add(key); dfs(v); } });
    };
    dfs(selected);
    return set;
  }, [selected, links]);

  const onSelect = (id: string) => {
    setSelected(id);
    // Compute simple mock metrics along outgoing path
    let confDelta = 0, delayH = 0, fuel = 0;
    links.forEach(l => {
      if (id === l.source) { confDelta -= (l.weight || 1) * 0.5; delayH += (l.weight || 1) * 0.2; fuel += (l.weight || 1) * 3; }
    });
    const entryId = Date.now();
    addLog({ id: entryId, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'IMPACT_GRAPH_INSPECT', data: { node: id, confDelta, delayH, fuel }, subsystem: 'analysis', permalink: `#log-${entryId}` });
  };

  return (
    <div className="p-3 rounded border border-border/50 bg-background/30">
      <div className="text-sm font-semibold mb-2">Causal Impact Graph</div>
      <ParentSize className="h-[280px]">
        {({ width, height }) => (
          <svg width={width} height={height} className="bg-black/20 rounded">
            {/* draw links */}
            {links.map((l, i) => {
              const src = nodes.find(n => n.id === l.source);
              const tgt = nodes.find(n => n.id === l.target);
              if (!src || !tgt) return null;
              // simple layout: hazards left, subsystems middle, metrics right
              const col = (t: ImpactNode['type']) => (t === 'hazard' ? 0.2 : t === 'subsystem' ? 0.5 : 0.8);
              const row = (id: string, type: ImpactNode['type']) => {
                const siblings = nodes.filter(n => n.type === type);
                const idx = siblings.findIndex(n => n.id === id);
                return (idx + 1) / (siblings.length + 1);
              };
              const x1 = width * col(src.type), y1 = height * row(src.id, src.type);
              const x2 = width * col(tgt.type), y2 = height * row(tgt.id, tgt.type);
              const active = selected ? outgoingPath.has(`${selected}->${l.target}`) || l.source === selected : true;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6EE7B7" strokeWidth={l.weight ? Math.max(1, l.weight) : 1.5} opacity={active ? 0.95 : 0.25} />;
            })}
            {/* draw nodes */}
            {nodes.map((n, i) => {
              const col = (t: ImpactNode['type']) => (t === 'hazard' ? 0.2 : t === 'subsystem' ? 0.5 : 0.8);
              const siblings = nodes.filter(x => x.type === n.type);
              const idx = siblings.findIndex(x => x.id === n.id);
              const row = (idx + 1) / (siblings.length + 1);
              const x = width * col(n.type); const y = height * row;
              const active = !selected || selected === n.id;
              return (
                <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r={14} fill={colorFor(n.type)} opacity={active ? 0.95 : 0.5} />
                  <text x={x} y={y - 20} fill="#fff" fontSize={11} textAnchor="middle">{n.label}</text>
                  {typeof n.delta === 'number' && (
                    <text x={x} y={y + 4} fill="#CFEFE2" fontSize={10} textAnchor="middle">Δ{n.delta.toFixed(1)}</text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </ParentSize>
      {selected && (
        <div className="mt-2 text-xs">
          <div className="font-semibold">Details</div>
          <div>Node: {selected}</div>
          <div className="text-[11px] text-muted-foreground">Path highlighted; metrics logged to Decision Log.</div>
        </div>
      )}
    </div>
  );
}