import React, { useMemo } from "react";
import { useMission, useCombinedRisk } from "@/context/MissionContext";

function actionFor(kind: string): string {
  switch (kind) {
    case "solar-flare":
      return "Switch to UHF backup and enable radiation shielding";
    case "space-debris":
      return "Schedule avoidance burn and raise attitude control priority";
    case "engine-failure":
      return "Engage backup thrusters and reduce burn aggressiveness";
    case "communication-loss":
      return "Fallback to low-gain antenna and increase FEC";
    default:
      return "Review ODIN recommendations and confirm with FDO";
  }
}

export default function MultiHazardPanel() {
  const { hazards } = useMission();
  const risk = useCombinedRisk();

  const prioritized = useMemo(() => [...hazards].sort((a, b) => b.severity - a.severity), [hazards]);

  return (
    <div className="glass-card p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Active Hazards</h3>
        <div className="text-sm text-muted-foreground">Combined Risk: <span className="font-mono text-primary">{risk}</span></div>
      </div>
      <ul className="space-y-2">
        {prioritized.map((h) => (
          <li key={h.id} className="border border-border/40 rounded p-2 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{h.label} <span className="ml-2 text-xs text-muted-foreground">S{h.severity}</span></div>
              <div className="text-xs text-muted-foreground">{new Date(h.startTs).toLocaleTimeString()}</div>
            </div>
            <div className="text-xs max-w-sm opacity-90">{h.recommendedAction || actionFor(h.kind)}</div>
          </li>
        ))}
        {!prioritized.length && (
          <li className="text-sm text-muted-foreground">No active hazards</li>
        )}
      </ul>
    </div>
  );
}
