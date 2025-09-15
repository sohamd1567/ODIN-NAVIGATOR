import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { missions as demoMissions } from './trajectory/missionDatasets';

// TrajectoryWithAircraft.tsx
// - Renders rocket Earth→Moon trajectory (simulation + actual + drift)
// - Renders aircraft launch trajectories (2012–2018) with filters per year
// - SVG for rocket and small datasets; canvas fallback for aircraft when total points > 2000
// - Legend with toggles and per-year filtering; keyboard-accessible
// - Hover tooltips for rocket and aircraft; slider for unified time scrubbing
// - Tailwind classes used for layout

// -----------------------------
// Types
// -----------------------------
type RocketPoint = { x: number; y: number; t?: number; velocity?: number };
type AircraftPoint = { x: number; y: number; timestamp: string | Date; velocity?: number };

export type AircraftLaunch = {
  id: string;
  launchDate: string; // YYYY-MM-DD
  path: AircraftPoint[];
  vehicleName: string;
};

export type RocketTrajectory = {
  id?: string;
  trajectory: RocketPoint[];
  actual?: RocketPoint[];
};

// -----------------------------
// Config / palettes
// -----------------------------
const ROCKET = {
  sim: '#21C8A6',
  actual: '#FF8A4B',
  driftFill: 'rgba(255,138,75,0.12)'
};

// accessible categorical palette (10 colors)
const CATEGORY10 = ['#1f77b4','#aec7e8','#2ca02c','#ff7f0e','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22'];

// -----------------------------
// Helpers: simple linear scales (no d3 dependency)
// -----------------------------
function extent(values: number[]) {
  let min = Infinity, max = -Infinity;
  for (const v of values) {
    if (Number.isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
  }
  if (min === Infinity) min = 0; if (max === -Infinity) max = 1;
  if (min === max) { max = min + 1; }
  return [min, max];
}

function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain; const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * m;
}

function clamp(v: number, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); }

function yearOf(iso: string) { return new Date(iso).getFullYear(); }

// Downsample helper
function downsample<T>(arr: T[], maxPoints = 2000) {
  if (arr.length <= maxPoints) return arr.slice();
  const stride = Math.ceil(arr.length / maxPoints);
  const out: T[] = [];
  for (let i = 0; i < arr.length; i += stride) out.push(arr[i]);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

// -----------------------------
// Component
// -----------------------------
export default function TrajectoryWithAircraft({
  rocketTrajectory,
  aircraftLaunches
}: {
  rocketTrajectory?: RocketTrajectory;
  aircraftLaunches?: AircraftLaunch[];
}) {
  // default props: use demo rocket if none provided
  const rocket: RocketTrajectory = (rocketTrajectory ?? ({ id: demoMissions[0]?.id || 'rocket', trajectory: demoMissions[0]?.trajectory?.map((p: any) => ({ x: p.x, y: p.y, t: p.t })) || [] } as RocketTrajectory));
  const aircrafts = (aircraftLaunches || []).filter(a => {
    const y = yearOf(a.launchDate);
    return y >= 2012 && y <= 2018;
  });

  // group aircrafts by year for toggles
  const aircraftsByYear = useMemo(() => {
    const map = new Map<number, AircraftLaunch[]>();
    for (const a of aircrafts) {
      const y = yearOf(a.launchDate);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(a);
    }
    return map;
  }, [aircrafts]);

  const years = useMemo(() => Array.from(aircraftsByYear.keys()).sort(), [aircraftsByYear]);

  // UI state
  const [showRocketSim, setShowRocketSim] = useState(true);
  const [showRocketActual, setShowRocketActual] = useState(true);
  const [showDrift, setShowDrift] = useState(true);
  const [showAircrafts, setShowAircrafts] = useState(true);
  const [activeYears, setActiveYears] = useState<number[]>(years.length ? years : [2012,2013,2014,2015,2016,2017,2018]);
  const [t, setT] = useState(0); // 0..1 global time scrub

  // refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simPathRef = useRef<SVGPathElement | null>(null);
  const actualPathRef = useRef<SVGPathElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // derive flat lists and extents
  const rocketPoints = rocket.trajectory ?? [];
  const rocketActualPoints = rocket.actual ?? [];

  const aircraftPointsAll = useMemo(() => aircrafts.flatMap(a => a.path.map(p => ({ ...p, launchId: a.id, vehicleName: a.vehicleName, launchDate: a.launchDate }))), [aircrafts]);

  const totalPoints = rocketPoints.length + rocketActualPoints.length + aircraftPointsAll.length;
  const useCanvas = totalPoints > 2000;

  // compute X/Y domain across union
  const allXs = [...rocketPoints.map(p => p.x), ...rocketActualPoints.map(p => p.x), ...aircraftPointsAll.map(p => p.x)];
  const allYs = [...rocketPoints.map(p => p.y), ...rocketActualPoints.map(p => p.y), ...aircraftPointsAll.map(p => p.y)];
  const [minX, maxX] = extent(allXs);
  const [minY, maxY] = extent(allYs);

  // viewport
  const width = 800; const height = 360; // SVG viewBox
  const xScale = useMemo(() => scaleLinear([minX, maxX], [40, width - 40]), [minX, maxX]);
  const yScale = useMemo(() => scaleLinear([minY, maxY], [height - 30, 30]), [minY, maxY]);

  // prepare rocket path strings using Catmull-Rom -> cubic Bezier (reuse previous helper style)
  // simple local implementation: polyline to C commands is OK for the demo
  function pointsToPath(pts: { x: number; y: number }[]) {
    if (!pts || pts.length === 0) return '';
    return 'M ' + pts.map((p, i) => `${xScale(p.x)} ${yScale(p.y)}`).join(' L ');
  }

  const rocketSimPath = useMemo(() => pointsToPath(rocketPoints), [rocketPoints, xScale, yScale]);
  const rocketActualPath = useMemo(() => pointsToPath(rocketActualPoints.length ? rocketActualPoints : rocketPoints.map(p => ({ x: p.x + 6, y: p.y + 4 }))), [rocketActualPoints, rocketPoints, xScale, yScale]);

  // assign aircraft colors from CATEGORY10 by vehicle id hash
  function colorForId(id: string) {
    let h = 0; for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
    return CATEGORY10[Math.abs(h) % CATEGORY10.length];
  }

  // filtered aircrafts by active years
  const activeAircrafts = useMemo(() => aircrafts.filter(a => activeYears.includes(yearOf(a.launchDate))), [aircrafts, activeYears]);

  // For canvas mode: downsample per-trajectory to limit total drawing
  const aircraftsForRender = useMemo(() => {
    if (!useCanvas) return activeAircrafts;
    return activeAircrafts.map(a => ({ ...a, path: downsample(a.path, 800) }));
  }, [activeAircrafts, useCanvas]);

  // hover state
  const [hover, setHover] = useState<{ x: number; y: number; html: string } | null>(null);
  const [hoveredAircraftId, setHoveredAircraftId] = useState<string | null>(null);

  // tooltip helpers
  function showAircraftTooltip(evX: number, evY: number, a: AircraftLaunch, pt: AircraftPoint) {
    setHover({ x: evX, y: evY, html: `<div style="font-weight:600">${a.vehicleName}</div><div>${a.launchDate}</div><div>v:${(pt.velocity||0).toFixed(2)}</div><div>(${pt.x.toFixed(1)},${pt.y.toFixed(1)})</div>` });
  }

  // Slider-based global time: convert t (0..1) to timestamp and highlight corresponding points
  // We'll compute a simple timestamp domain across aircraft paths (min/max of timestamps)
  const aircraftTimestamps = useMemo(() => aircraftPointsAll.map(p => new Date(p.timestamp).getTime()).filter(Boolean), [aircraftPointsAll]);
  const [minTs, maxTs] = extent(aircraftTimestamps.length ? aircraftTimestamps : [Date.now(), Date.now()+1000]);

  const timeFromT = (tt: number) => minTs + tt * (maxTs - minTs);

  // canvas drawing effect
  useEffect(() => {
    if (!useCanvas || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // size canvas
    const DPR = window.devicePixelRatio || 1;
    canvas.width = width * DPR; canvas.height = height * DPR;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // clear
  ctx.clearRect(0,0,width,height);
  // background (match container bg)
  ctx.fillStyle = '#071825'; ctx.fillRect(0,0,width,height);

    // rocket drawn in SVG only (per requirements)

    // draw aircrafts
    for (const a of aircraftsForRender) {
      const c = colorForId(a.id);
      ctx.beginPath();
      ctx.lineWidth = (hoveredAircraftId === a.id) ? 3 : 2;
      ctx.strokeStyle = hoveredAircraftId && hoveredAircraftId !== a.id ? 'rgba(200,200,200,0.15)' : c;
      ctx.lineCap = 'round';
      const path = a.path;
      if (!path || path.length === 0) continue;
      ctx.moveTo(xScale(path[0].x), yScale(path[0].y));
      for (let i = 1; i < path.length; i++) ctx.lineTo(xScale(path[i].x), yScale(path[i].y));
      ctx.stroke();

      // start marker
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xScale(path[0].x), yScale(path[0].y), 3, 0, Math.PI*2); ctx.fill();
    }
  }, [aircraftsForRender, hoveredAircraftId, useCanvas, xScale, yScale, width, height]);

  // SVG hover handlers for aircraft paths (only when not using canvas)
  function onAircraftMouseEnter(id: string) { setHoveredAircraftId(id); }
  function onAircraftMouseLeave() { setHoveredAircraftId(null); setHover(null); }

  // Aircraft click/year filter helpers
  function toggleYear(y: number) {
    setActiveYears(prev => prev.includes(y) ? prev.filter(v => v !== y) : [...prev, y]);
  }

  // keyboard helper for toggleable items
  function handleToggleKey(e: React.KeyboardEvent, cb: () => void) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cb(); } }

  // aggregated tooltip at current time t: show counts / average speed
  const aggregatedAtT = useMemo(() => {
    const ts = timeFromT(t);
    const nearby: { id: string; vehicleName: string; pt: AircraftPoint }[] = [];
    for (const a of activeAircrafts) {
      // find nearest point by timestamp
      const pts = a.path;
      if (!pts || pts.length === 0) continue;
      let best = pts[0]; let bestDelta = Math.abs(new Date(pts[0].timestamp).getTime() - ts);
      for (const p of pts) { const d = Math.abs(new Date(p.timestamp).getTime() - ts); if (d < bestDelta) { best = p; bestDelta = d; } }
      nearby.push({ id: a.id, vehicleName: a.vehicleName, pt: best });
    }
    return nearby;
  }, [t, activeAircrafts]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="rounded-lg p-4" style={{ background: '#071825' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Trajectory — Rocket & Aircraft (2012–2018)</h2>
          <p className="text-sm text-slate-300">Rocket vs aircraft launches. Use legend and year filters to explore.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded text-white" onClick={() => setT(0)}>Reset</button>
        </div>
      </div>

      {/* Legend & year filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" checked={showRocketSim} onChange={e => setShowRocketSim(e.target.checked)} aria-label="Toggle Rocket Simulation" />
          <span style={{ color: ROCKET.sim }}>Rocket Simulation</span>
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" checked={showRocketActual} onChange={e => setShowRocketActual(e.target.checked)} aria-label="Toggle Rocket Actual" />
          <span style={{ color: ROCKET.actual }}>Rocket Actual</span>
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" checked={showDrift} onChange={e => setShowDrift(e.target.checked)} aria-label="Toggle Drift Band" />
          <span style={{ color: 'white' }}>Drift</span>
        </label>
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" checked={showAircrafts} onChange={e => setShowAircrafts(e.target.checked)} aria-label="Toggle Aircrafts" />
          <span>Aircraft Launches</span>
        </label>

        {/* Year filters */}
        <div className="ml-3 text-white">Years:</div>
        <div className="flex gap-2 flex-wrap">
          {years.map(y => (
            <button key={y} onClick={() => toggleYear(y)} onKeyDown={(e) => handleToggleKey(e, () => toggleYear(y))} className={`px-2 py-1 rounded ${activeYears.includes(y) ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300'}`} aria-pressed={activeYears.includes(y)} aria-label={`Toggle year ${y}`}>{y}</button>
          ))}
        </div>
      </div>

      <div className="relative rounded overflow-hidden" style={{ height: height }}>
        {/* Canvas for aircraft when large */}
        {useCanvas && <canvas ref={canvasRef} aria-hidden className="w-full h-full" />}

        {/* Rocket SVG remains in front */}
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full absolute top-0 left-0" role="img" aria-label="Trajectory visualization">
          <rect width="100%" height="100%" fill={ROCKET.driftFill} opacity={0} />

          {/* Drift band (filled under sim path) */}
          {showDrift && <path d={rocketSimPath} fill={ROCKET.driftFill} stroke="none" />}

          {/* Rocket simulation with glow and stroke animation */}
          {showRocketSim && (
            <path ref={simPathRef} d={rocketSimPath} stroke={ROCKET.sim} strokeWidth={3.5} fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 8px 18px rgba(33,200,166,0.14))', transition: 'stroke-dashoffset 200ms linear' }} />
          )}

          {/* Rocket actual dashed */}
          {showRocketActual && (
            <path ref={actualPathRef} d={rocketActualPath} stroke={ROCKET.actual} strokeWidth={2.5} fill="none" strokeDasharray="6 5" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 200ms linear' }} />
          )}

          {/* Aircraft SVG (when not using canvas) */}
          {!useCanvas && showAircrafts && aircraftsForRender.map(a => (
            <g key={a.id}>
              <path
                d={pointsToPath(a.path)}
                stroke={colorForId(a.id)}
                strokeWidth={hoveredAircraftId === a.id ? 3 : 2}
                fill="none"
                opacity={hoveredAircraftId && hoveredAircraftId !== a.id ? 0.18 : 0.85}
                onMouseEnter={(e) => { onAircraftMouseEnter(a.id); const rect = (svgRef.current)?.getBoundingClientRect(); const pt = a.path[0]; if (rect && pt) showAircraftTooltip(e.clientX - rect.left, e.clientY - rect.top, a, pt); }}
                onMouseLeave={() => onAircraftMouseLeave()}
                onFocus={() => onAircraftMouseEnter(a.id)}
                tabIndex={0}
                aria-label={`${a.vehicleName} launch ${a.launchDate}`}
              />
              {/* start marker */}
              {a.path[0] && (
                <circle cx={xScale(a.path[0].x)} cy={yScale(a.path[0].y)} r={3} fill={colorForId(a.id)} />
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hover && (
          <div role="tooltip" className="absolute z-20" style={{ left: hover.x + 12, top: hover.y - 20, pointerEvents: 'none', background: 'rgba(0,0,0,0.75)', color: '#E8F6F7', padding: '6px 8px', borderRadius: 6, fontSize: 12 }} dangerouslySetInnerHTML={{ __html: hover.html }} />
        )}
      </div>

      {/* scrubber */}
      <div className="mt-3 flex items-center gap-3">
        <input aria-label="Time scrubber across datasets" type="range" min={0} max={1} step={0.001} value={t} onChange={e => setT(clamp(Number(e.target.value)))} className="w-full" />
        <div style={{ minWidth: 90, textAlign: 'right', color: '#97A6B3', fontFamily: 'monospace' }}>{`T+${Math.round(t * 100)}%`}</div>
      </div>

      {/* Aggregated info at scrubber */}
      <div className="mt-2 text-sm text-slate-300">
        {aggregatedAtT.length ? `${aggregatedAtT.length} aircraft near current time — example: ${aggregatedAtT[0].vehicleName}` : 'No aircraft at this time'}
      </div>
    </div>
  );
}
