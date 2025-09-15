import React, { useMemo } from 'react';
import { useMission } from '@/context/MissionContext';
import { planDSNHandover } from '@/lib/ops';

export default function DSNHandoverWidget() {
  const mission = useMission();
  const { comms, commsRedundancy } = mission;
  const order = ['Canberra','Goldstone','Madrid'];
  const next = useMemo(() => {
    const idx = order.findIndex(s => (comms.dsnStation||'').toLowerCase().includes(s.toLowerCase()));
    return order[(idx + 1 + order.length) % order.length];
  }, [comms.dsnStation]);

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-background/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">DSN Handover</h3>
        <span className="text-[11px] text-muted-foreground">Current: {comms.dsnStation}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">Recommendation: {next} (10 min overlap)</div>
      <div className="flex gap-2">
        <button
          className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5"
          aria-label="Schedule DSN handover"
          onClick={() => planDSNHandover(mission, mission, { correlationId: crypto?.randomUUID?.() || String(Date.now()) })}
        >Schedule Handover</button>
      </div>
    </div>
  );
}
