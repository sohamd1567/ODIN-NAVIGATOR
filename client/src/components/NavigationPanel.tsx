import React, { useMemo, useState } from 'react';
import { useCombinedRisk, useMission } from '@/context/MissionContext';

export default function NavigationPanel() {
  const mission = useMission();
  const risk = useCombinedRisk();
  const showTCM = risk >= 70;
  const [confirm, setConfirm] = useState(false);
  const deltaV = 2.1; // m/s example
  const fuelMargin = 45; // ms example
  const delayMin = 20;
  return (
    <div className="p-3 rounded-lg border border-border/50 bg-background/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Navigation</h3>
        <span className="text-[11px] text-muted-foreground">Risk: {risk}%</span>
      </div>
      {showTCM ? (
        <div className="border border-yellow-500/50 rounded p-2 text-xs">
          <div className="font-semibold text-yellow-200">Prepare Low-Δv TCM</div>
          <div className="text-muted-foreground">Δv≈{deltaV} m/s, delay≈{delayMin} min, fuel margin {fuelMargin} ms</div>
          <div className="mt-2 flex gap-2">
            <button className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label="Execute TCM" onClick={() => setConfirm(true)}>Execute TCM</button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No TCM actions at current risk.</div>
      )}

      {confirm && (
        <div role="alertdialog" aria-modal="true" aria-label="Confirm Execute TCM" className="fixed inset-0 bg-black/60 grid place-items-center">
          <div className="bg-zinc-900 border border-border/60 rounded p-4 w-[360px]">
            <div className="font-semibold mb-2">Execute TCM?</div>
            <div className="text-xs text-muted-foreground mb-3">This will perform a low-Δv correction. Ensure tracking lock.</div>
            <div className="flex justify-end gap-2">
              <button className="text-[11px] px-2 py-1 rounded border border-border/50" onClick={() => setConfirm(false)} aria-label="Cancel">Cancel</button>
              <button className="text-[11px] px-2 py-1 rounded border border-red-500/60 bg-red-600/20 hover:bg-red-600/30" aria-label="Confirm execute" onClick={() => {
                const corr = crypto?.randomUUID?.() || String(Date.now());
                const id = Date.now();
                mission.addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'NAV_ACTION', severity: 'info', subsystem: 'nav', data: { action: 'TCM executed', deltaV: deltaV, preState: { r: [7000,0,0], v: [0,7.5,0] }, postState: { r: [7000,0,0], v: [0,7.505,0] }, correlationId: corr } });
                mission.addMissionEvent({ id: `tcm-${id}`, ts: Date.now(), type: 'maneuver', label: 'TCM Executed', durationMs: 2*60_000, meta: { logId: id } });
                setConfirm(false);
              }}>Execute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
