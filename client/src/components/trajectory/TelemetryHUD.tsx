import React from 'react';
import type { TrajectoryState } from './useTrajectorySimulation';

// Mission Control HUD in top-left with neon green text on dark background
export default function TelemetryHUD({ traj }: { traj: TrajectoryState }) {
  const nextBurn = traj.nextBurn;
  const nextBurnSeconds = nextBurn ? Math.max(0, Math.round(((nextBurn.t - traj.t) * 20))) : 0; // demo countdown

  return (
    <div style={{ position: 'absolute', left: 12, top: 12, padding: 10, background: 'rgba(6,24,48,0.6)', color: '#7CFF7C', fontFamily: 'monospace', borderRadius: 6, minWidth: 220, zIndex: 40 }}>
      <div style={{ fontSize: 12, opacity: 0.9 }}>Live Data Mode (Mission Control)</div>
      <div style={{ marginTop: 8 }}>
        <div>Distance from Earth: <strong>{traj.distanceFromEarth.toLocaleString()} km</strong></div>
        <div>Distance from Moon: <strong>{traj.distanceFromMoon.toLocaleString()} km</strong></div>
        <div>Velocity: <strong>{traj.velocity.toFixed(2)} km/s</strong></div>
        <div>Remaining Δv: <strong>{traj.remainingDeltaV.toFixed(2)} km/s</strong></div>
        <div>Next Maneuver: <strong>{nextBurn ? nextBurn.label : '—'}</strong></div>
        <div>Countdown: <strong>{nextBurn ? `${nextBurnSeconds}s` : '—'}</strong></div>
      </div>
    </div>
  );
}
