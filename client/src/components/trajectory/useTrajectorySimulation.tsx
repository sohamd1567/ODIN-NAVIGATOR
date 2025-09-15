import { useEffect, useRef, useState } from 'react';

export type TransferMode = 'direct' | 'hohmann' | 'low-energy';

export interface BurnPoint {
  id: string;
  label: string;
  t: number; // normalized position along path 0..1
  deltaV: number; // km/s
}

export interface TrajectoryState {
  t: number; // normalized time 0..1
  pathD: string; // SVG path for actual (solid)
  predictedD: string; // SVG path for predicted (dotted)
  burns: BurnPoint[];
  points?: { p0: { x: number; y: number }; p1: { x: number; y: number }; p2: { x: number; y: number } };
  distanceFromEarth: number; // km
  distanceFromMoon: number; // km
  velocity: number; // km/s
  remainingDeltaV: number; // km/s
  nextBurn?: BurnPoint;
  lagrange: { L1: { x: number; y: number }; L2: { x: number; y: number } };
}

// Helper to create quadratic path from control points
function quadPath(p0: any, p1: any, p2: any) {
  return `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
}

// Synthesize trajectories for demo purposes
export function synthesizeForMode(mode: TransferMode) {
  // control points are normalized to the 400x200 SVG viewBox used in the app
  const earth = { x: 70, y: 100 };
  const moon = { x: 330, y: 80 };

  if (mode === 'direct') {
    const mid = { x: 200, y: 70 };
    const path = { p0: earth, p1: mid, p2: moon };
    const burns: BurnPoint[] = [
      { id: 'tli', label: 'TLI Burn', t: 0.02, deltaV: 3.2 },
      { id: 'mcc', label: 'Mid-Course Correction', t: 0.5, deltaV: 0.2 },
      { id: 'loi', label: 'LOI Burn', t: 0.98, deltaV: 2.6 }
    ];
    return { path, burns, travelDays: 3.5 };
  }

  if (mode === 'hohmann') {
    const mid = { x: 200, y: 50 };
    const path = { p0: earth, p1: mid, p2: moon };
    const burns: BurnPoint[] = [
      { id: 'tli', label: 'TLI Burn', t: 0.03, deltaV: 2.4 },
      { id: 'mcc', label: 'Mid-Course Correction', t: 0.6, deltaV: 0.15 },
      { id: 'loi', label: 'LOI Burn', t: 0.97, deltaV: 1.9 }
    ];
    return { path, burns, travelDays: 5.2 };
  }

  // low-energy
  const mid = { x: 200, y: 120 };
  const path = { p0: earth, p1: mid, p2: moon };
  const burns: BurnPoint[] = [
    { id: 'tli', label: 'TLI Burn', t: 0.05, deltaV: 1.6 },
    { id: 'mcc', label: 'Mid-Course Correction', t: 0.5, deltaV: 0.05 },
    { id: 'loi', label: 'LOI Burn', t: 0.95, deltaV: 1.2 }
  ];
  return { path, burns, travelDays: 12.0 };
}

export function useTrajectorySimulation(initialMode: TransferMode = 'direct') {
  const [mode, setMode] = useState<TransferMode>(initialMode);
  const [state, setState] = useState<TrajectoryState>(() => {
    const { path, burns, travelDays } = synthesizeForMode(initialMode);
    const pathD = quadPath(path.p0, path.p1, path.p2);
    const predictedD = pathD;
    return {
      t: 0,
      pathD,
      predictedD,
      burns,
      distanceFromEarth: 384400,
      distanceFromMoon: 0,
      velocity: 10,
      remainingDeltaV: burns.reduce((s, b) => s + b.deltaV, 0) + 0.5,
      nextBurn: burns[0],
      lagrange: { L1: { x: 260, y: 90 }, L2: { x: 360, y: 80 } }
    } as TrajectoryState;
  });

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // re-synthesize when mode changes
    const { path, burns, travelDays } = synthesizeForMode(mode);
    const pathD = quadPath(path.p0, path.p1, path.p2);
    setState((s) => ({ ...s, predictedD: pathD, burns, points: { p0: path.p0, p1: path.p1, p2: path.p2 }, remainingDeltaV: burns.reduce((x, b) => x + b.deltaV, 0) + 0.5 }));
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    // run a demo sim loop using RAF
    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - (startRef.current || ts)) / 1000; // seconds
      // loop every 20s for demo
      const period = 20;
      const t = (elapsed % period) / period;

      // velocity oscillates mildly
      const baseVel = 10; // km/s nominal
      const vel = baseVel + Math.sin(t * Math.PI * 2) * 0.8;

      // distances move from Earth to Moon roughly
      const distEarth = 384400 * (1 - t);
      const distMoon = 384400 * t;

      // update remaining delta-v: subtract burns as t crosses their threshold
      let remaining = state.remainingDeltaV;
      const burns = state.burns;
      const passed = burns.filter(b => t >= b.t);
      remaining = burns.reduce((s, b) => s + b.deltaV, 0) + 0.5 - passed.reduce((s, b) => s + b.deltaV, 0);

      // path morph between predictedD and a slight perturbation
      const pathD = state.predictedD; // for demo keep same; UI will animate changes

      const nextBurn = burns.find(b => t < b.t) || burns[burns.length - 1];

      if (mounted) {
        setState(s => ({ ...s, t, pathD, velocity: Number(vel.toFixed(3)), distanceFromEarth: Math.round(distEarth), distanceFromMoon: Math.round(distMoon), remainingDeltaV: Number(remaining.toFixed(3)), nextBurn }));
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); startRef.current = null; };
  }, [mode]);

  return { state, setMode, mode } as { state: TrajectoryState; setMode: (m: TransferMode) => void; mode: TransferMode };
}
