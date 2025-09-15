import React, { useMemo } from 'react';
import { useMission } from '@/context/MissionContext';
import { activeRLevelFromHazards } from '@/types/odin';
import { scheduleDataDump } from '@/lib/ops';

export default function TelemetryScheduler() {
  const mission = useMission();
  const { hazards, scheduledDumps = [] } = mission;
  const r = useMemo(() => activeRLevelFromHazards(hazards), [hazards]);
  const inWindow = !!r; // treat any active flare as R-window for now
  const nextScheduled = scheduledDumps[scheduledDumps.length - 1];
  return (
    <div className="p-3 rounded-lg border border-border/50 bg-background/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Telemetry Scheduler</h3>
        <span className="text-[11px] text-muted-foreground">Buffer: {Math.round((mission.telemetryBufferMs||0)/1000)}s</span>
      </div>
      {inWindow ? (
        <div className="text-xs text-yellow-300 mb-2">R-window active ({r?.r}). Bulk dump deferred.</div>
      ) : (
        <div className="text-xs text-muted-foreground mb-2">No hazard window. You can start a dump.</div>
      )}
      <div className="flex items-center gap-2">
        <button
          className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5 disabled:opacity-50"
          aria-label="Start Data Dump"
          disabled={inWindow}
        >Start Data Dump</button>
        <button
          className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5"
          aria-label="Schedule next safe data dump"
          onClick={() => scheduleDataDump(mission, mission, { correlationId: crypto?.randomUUID?.() || String(Date.now()) })}
        >Schedule Next Safe Slot</button>
      </div>
      {nextScheduled ? (
        <div className="mt-2 text-[11px] text-muted-foreground">Next slot: {new Date(nextScheduled.startTs).toUTCString().slice(17,22)}–{new Date(nextScheduled.endTs).toUTCString().slice(17,22)} UTC</div>
      ) : null}
    </div>
  );
}
