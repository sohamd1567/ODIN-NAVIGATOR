import React, { useMemo, useState } from 'react';
import { useMission } from '@/context/MissionContext';
import { Area, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea, Legend } from 'recharts';

function timeTick(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function CommsDiagnosticsAccordion() {
  const { commsHistory = [], hazards, addLog, addMissionEvent } = useMission();
  const [open, setOpen] = useState(false);

  const flareWindows = useMemo(() => hazards
    .filter(h => h.kind === 'solar-flare')
    .map(h => ({ start: h.startTs, end: h.endTs || h.startTs + 45*60_000, label: h.label })), [hazards]);

  const onToggle = () => {
    const next = !open; setOpen(next);
    if (next) {
      const id = Date.now();
      addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'DIAGNOSTICS_VIEW', data: { section: 'comms-24h' } });
      addMissionEvent({ id: `diag-${id}`, ts: Date.now(), type: 'note', label: 'Diagnostics Viewed', meta: { flash: true, logId: id } });
    }
  };

  // Recommendation logic
  const last = commsHistory[commsHistory.length - 1];
  let recommendation = 'Nominal. Maintain current configuration.';
  if (last) {
    const latencyMs = Math.max(last.uplinkMs, last.downlinkMs);
    if (latencyMs > 500 || last.packetLossPct > 5) {
      recommendation = 'Recommend DSN handover and enable FEC.';
    } else if ((last as any).snrDb !== undefined && (last as any).snrDb < 5) {
      recommendation = 'Increase coding gain and reduce data rate.';
    }
  }

  return (
    <div className="mt-3 border border-border/50 rounded">
      <button
        className="w-full text-left px-3 py-2 text-sm font-semibold flex items-center justify-between"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>24h Diagnostics</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-4" role="region" aria-label="Comms 24 hour diagnostics">
          {/* Latency */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Latency (ms)</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commsHistory} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <XAxis dataKey="ts" tickFormatter={timeTick} hide />
                  <YAxis domain={[0, 'auto']} width={28} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} formatter={(v: any) => [Math.round(Number(v)), 'ms']} />
                  <Legend />
                  <Line dataKey="uplinkMs" name="Uplink" stroke="#60A5FA" dot={false} strokeWidth={1.5} />
                  <Line dataKey="downlinkMs" name="Downlink" stroke="#34D399" dot={false} strokeWidth={1.5} />
                  {flareWindows.map((w, i) => (
                    <ReferenceArea key={i} x1={w.start} x2={w.end} y1={0} y2={99999} fill="#F59E0B" fillOpacity={0.08} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Loss */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Packet Loss (%)</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commsHistory} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <XAxis dataKey="ts" tickFormatter={timeTick} hide />
                  <YAxis domain={[0, 20]} width={28} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} formatter={(v: any) => [Number(v).toFixed(1), '%']} />
                  <Line dataKey="packetLossPct" stroke="#F472B6" dot={false} strokeWidth={1.5} />
                  {flareWindows.map((w, i) => (
                    <ReferenceArea key={i} x1={w.start} x2={w.end} y1={0} y2={100} fill="#F59E0B" fillOpacity={0.08} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* SNR */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">SNR (dB)</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commsHistory} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <XAxis dataKey="ts" tickFormatter={timeTick} hide />
                  <YAxis domain={[0, 'auto']} width={28} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} formatter={(v: any) => [Number(v).toFixed(1), 'dB']} />
                  <Line dataKey="snrDb" stroke="#FCD34D" dot={false} strokeWidth={1.5} />
                  {flareWindows.map((w, i) => (
                    <ReferenceArea key={i} x1={w.start} x2={w.end} y1={0} y2={99999} fill="#F59E0B" fillOpacity={0.08} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="rounded border border-border/50 p-2">
            <div className="text-xs font-semibold mb-1">Recommended Actions</div>
            <div className="text-xs">{recommendation}</div>
            <div className="text-[11px] text-muted-foreground mt-1">R-windows shaded; plan high-rate dumps outside. Link placeholder: GOES X-ray flux for future integration.</div>
          </div>
        </div>
      )}
    </div>
  );
}
