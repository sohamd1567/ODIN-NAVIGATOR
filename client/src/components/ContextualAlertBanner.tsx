import React, { useMemo } from "react";
import { useMission } from "@/context/MissionContext";
import { solarClassToRScale } from "@/types/odin";
import { Button } from "@/components/ui/button";

function severityColor(level: 1 | 2 | 3 | 4 | 5) {
  return [
    "bg-emerald-700/30 border-emerald-500/50",
    "bg-yellow-700/30 border-yellow-500/50",
    "bg-orange-700/30 border-orange-500/50",
    "bg-red-700/40 border-red-500/60",
    "bg-fuchsia-800/40 border-fuchsia-500/70",
  ][level - 1];
}

export default function ContextualAlertBanner() {
  const { hazards } = useMission();

  const latest = useMemo(() =>
    [...hazards].sort((a, b) => b.startTs - a.startTs)[0], [hazards]
  );

  if (!latest) return null;

  // Try to derive R-scale from label like "M1.0 Solar Flare"
  const clsMatch = /\b([ABCMX])\s*\d*(?:\.\d+)?/i.exec(latest.label || "");
  const cls = clsMatch ? clsMatch[1].toUpperCase() : latest.details?.class;
  const r = cls ? solarClassToRScale(String(cls)).r : ("R" + latest.severity) as any;

  return (
    <div className={`w-full border ${severityColor(latest.severity)} text-foreground px-4 py-3 rounded-md shadow flex items-center justify-between gap-4`} role="alert" aria-live="assertive">
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden>⚠️</span>
        <div>
          <div className="font-semibold tracking-wide">
            {latest.label}
            {latest.kind === "solar-flare" && (
              <span className="ml-2 text-xs font-mono text-muted-foreground">({r} radio blackout)</span>
            )}
          </div>
          {latest.details?.sourceRegion && (
            <div className="text-xs text-muted-foreground">Region {latest.details.sourceRegion}</div>
          )}
        </div>
      </div>
      {latest.recommendedAction && (
        <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90">
          {latest.recommendedAction}
        </Button>
      )}
    </div>
  );
}
