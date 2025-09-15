import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMission } from "@/context/MissionContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, CartesianGrid, ComposedChart, ReferenceArea, ReferenceDot, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Item = { ts: number; risks: number; label?: string; id?: string };

export default function InteractiveMissionTimeline() {
  const { missionEvents, riskBands, simulationMode } = useMission();
  const [domain, setDomain] = useState<{ left: number; right: number } | null>(null);
  const [modal, setModal] = useState<{ title: string; body: string } | null>(null);
  const prevSim = useRef(simulationMode);

  const now = Date.now();
  const start = now - 2 * 3600_000;
  const end = now + 6 * 3600_000;

  const data: Item[] = useMemo(() => {
    const step = 10 * 60_000; // 10 min
    const items: Item[] = [];
    for (let t = start; t <= end; t += step) {
      // Sum overlapping risk bands as a simple numeric band (1-5)
      const overlapping = riskBands.filter((r) => t >= r.startTs && t <= r.endTs);
      const risks = overlapping.reduce((acc, r) => Math.max(acc, r.severity), 0);
      items.push({ ts: t, risks });
    }
    return items;
  }, [riskBands]);

  const onBrush = (e: any) => {
    if (!e) return;
    const left = Math.min(e.startIndex, e.endIndex);
    const right = Math.max(e.startIndex, e.endIndex);
    const l = data[left]?.ts;
    const r = data[right]?.ts;
    if (l && r) setDomain({ left: l, right: r });
  };

  const handleClick = (payload: any) => {
    if (!payload || !payload.activeLabel) return;
    const ts = Number(payload.activeLabel);
    const events = missionEvents.filter((e) => Math.abs(e.ts - ts) <= 15 * 60_000);
    // If clicking near an event that has an associated logId, scroll Decision Log to it
    const withLog = events.find((e) => e.meta?.logId);
    if (withLog?.meta?.logId) {
      window.dispatchEvent(new CustomEvent("odin-scroll-to-log", { detail: { logId: withLog.meta.logId } }));
      return;
    }
    const risks = riskBands.filter((r) => ts >= r.startTs && ts <= r.endTs);
    const title = events[0]?.label || risks[0]?.label || "Timeline Detail";
    const body = [
      events.length ? `Event: ${events.map((e) => e.label).join(", ")}` : null,
      risks.length ? `Risks: ${risks.map((r) => `${r.label || "Risk"} (S${r.severity})`).join(", ")}` : null,
      "Mitigation: Adjust burn timing, switch comms bands, or replan trajectory.",
    ]
      .filter(Boolean)
      .join("\n");
    setModal({ title, body });
  };

  const xDomain: [number, number] = domain ? [domain.left, domain.right] : [start, end];

  // Animate syncing back to live when exiting simulation
  useEffect(() => {
    if (prevSim.current && !simulationMode) {
      // Smoothly interpolate from current domain to live
      const from = domain ? [domain.left, domain.right] : [start, end];
      const to: [number, number] = [start, end];
      const duration = 600; // ms
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        const left = from[0] + (to[0] - from[0]) * ease;
        const right = from[1] + (to[1] - from[1]) * ease;
        setDomain({ left, right });
        if (p < 1) requestAnimationFrame(tick);
        else setDomain(null); // finalize at live window
      };
      requestAnimationFrame(tick);
    }
    prevSim.current = simulationMode;
  }, [simulationMode]);

  return (
    <div className="p-3 bg-odin-card rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-odin-accent mb-2">Mission Timeline</h3>
      <ChartContainer
        className="h-56 w-full"
        config={{ risks: { label: "Risk Level", color: "#ef4444" } }}
      >
        <ComposedChart data={data} onClick={handleClick} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={xDomain}
            tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          />
          <YAxis domain={[0, 5]} tickCount={6} />
          <Area dataKey="risks" type="monotone" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
          {/* Render mission events as dots */}
          {missionEvents.map((e) => (
            <ReferenceDot key={e.id} x={e.ts} y={5} r={e.meta?.flash ? 5 : 3} fill={e.meta?.flash ? "#fbbf24" : "#60a5fa"} stroke="#93c5fd" />
          ))}
          {/* Risk windows as reference areas */}
          {riskBands.map((r) => (
            <ReferenceArea key={r.id} x1={r.startTs} x2={r.endTs} y1={0} y2={5} fill={"#f59e0b"} fillOpacity={0.08} />
          ))}
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
        </ComposedChart>
      </ChartContainer>

      <div className="flex items-center gap-2 justify-end mt-2 text-xs text-muted-foreground">
        <button aria-label="Reset timeline zoom" className="px-2 py-1 rounded border border-border/50 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => setDomain(null)}>Reset Zoom</button>
      </div>

      <Dialog open={!!modal} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal?.title}</DialogTitle>
            <DialogDescription>Mitigation recommendations</DialogDescription>
          </DialogHeader>
          <pre className="text-sm whitespace-pre-wrap">{modal?.body}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
