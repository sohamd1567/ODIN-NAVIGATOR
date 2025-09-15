import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

export function useDrilldown() {
  const [open, setOpen] = useState<null | { title: string; type: "confidence" | "severity" }>(null);
  return {
    open,
    showConfidence: () => setOpen({ title: "ODIN Confidence Details", type: "confidence" }),
    showSeverity: () => setOpen({ title: "Severity Breakdown", type: "severity" }),
    hide: () => setOpen(null),
  };
}

export function DrilldownModal({ open, onClose }: { open: null | { title: string; type: "confidence" | "severity" }; onClose: () => void }) {
  if (!open) return null;
  const now = Date.now();
  const data = Array.from({ length: 24 }, (_, i) => ({
    t: now - (24 - i) * 3600_000,
    xray: Math.random() * 10,
    confidence: 60 + Math.sin(i / 3) * 20 + Math.random() * 8,
  }));

  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{open.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Sensor Input (Soft X-ray Flux)</h4>
            <ChartContainer className="h-40" config={{ xray: { label: "Flux", color: "#f59e0b" } }}>
              <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleTimeString()} />
                <YAxis />
                <Area dataKey="xray" type="monotone" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Model Feature Contributions</h4>
            <ul className="text-sm space-y-1">
              <li>Solar Activity: +0.35</li>
              <li>Comms SNR: -0.12</li>
              <li>Trajectory Margin: +0.22</li>
              <li>Subsystem Health: +0.18</li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium mb-2">Historical {open.type === "confidence" ? "Confidence" : "Severity"} Trend</h4>
            <ChartContainer className="h-32" config={{ confidence: { label: "Confidence", color: "#10b981" } }}>
              <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleTimeString()} />
                <YAxis domain={[0, 100]} />
                <Area dataKey="confidence" type="monotone" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
