import React, { useMemo, useRef, useState } from "react";
import { useMission } from "@/context/MissionContext";
import type { HazardEvent } from "@/types/odin";
import { useNotificationStore } from "@/context/NotificationContext";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from 'recharts';
import { planDSNHandover, scheduleDataDump } from "@/lib/ops";

export default function SimulationPanel() {
  const mission = useMission();
  const { simulationMode, setSimulationMode, addHazard, addMissionEvent, addLog, commsHistory = [] } = mission;
  const { addNotification } = useNotificationStore();
  const [label, setLabel] = useState("X1.2 Solar Flare");
  const [kind, setKind] = useState<HazardEvent["kind"]>("solar-flare");
  const [severity, setSeverity] = useState(5);
  const [minutes, setMinutes] = useState(10);
  const prevSim = useRef(simulationMode);
  // Scenario playback state
  const [playing, setPlaying] = useState(false);
  const [cursorTs, setCursorTs] = useState<number | null>(null);
  const [baselineOn, setBaselineOn] = useState(false);
  const baselineRef = useRef<Array<{ ts: number; uplinkMs: number; downlinkMs: number; packetLossPct: number }>>([]);

  const inject = () => {
    const now = Date.now();
    const h: HazardEvent = {
      id: Math.random().toString(36).slice(2),
      kind,
      label,
      severity: Math.min(5, Math.max(1, Number(severity))) as any,
      startTs: now + minutes * 60_000,
      details: { injected: true },
      recommendedAction: kind === "solar-flare" ? "Switch to UHF backup" : undefined,
    };
    addHazard(h);
  addNotification({ severity: 'info', title: 'Hazard injected', message: `${label} scheduled at T+${minutes}m`, source: 'simulation' });
    // Log and add a timeline marker
    const tPlus = `T+${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const entryId = Date.now();
    addLog({
      id: entryId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: "HAZARD_INJECTED",
      data: { message: `Injected '${label}' at ${tPlus}; evaluating impacts.` },
    });
    addMissionEvent({ id: `inj-${entryId}`, ts: now, type: "note", label: `Injected: ${label}`, meta: { flash: true, logId: entryId } });
  // Capture baseline just before injection for comparison overlay
  const cutoff = now - 10 * 60_000;
  baselineRef.current = commsHistory.filter(s => s.ts <= now && s.ts >= cutoff).map(s => ({ ts: s.ts, uplinkMs: s.uplinkMs, downlinkMs: s.downlinkMs, packetLossPct: s.packetLossPct }));
  };

  return (
    <div className="glass-card p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Simulation Mode</h3>
        <div className="text-sm flex items-center gap-2">
          <label htmlFor="simulation-toggle">Simulation Mode</label>
          <input
            id="simulation-toggle"
            type="checkbox"
            role="switch"
            aria-checked={simulationMode}
            aria-disabled={false}
            aria-describedby="simulation-help"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded"
            checked={simulationMode}
            onChange={(e) => {
              const next = e.target.checked;
              const prev = prevSim.current;
              prevSim.current = next;
              setSimulationMode(next);
              const tsStr = new Date().toISOString().substring(11, 16) + " UTC";
              const entryId = Date.now();
              if (!next && prev) {
                // Exiting simulation
                addLog({ id: entryId, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: "SIM_TOGGLE", data: { message: `Simulation mode disabled at ${tsStr}; resuming live mode.` } });
                addMissionEvent({ id: `sim-${entryId}`, ts: Date.now(), type: "note", label: "Exit Simulation", meta: { flash: true, logId: entryId } });
                addNotification({ severity: 'warning', title: 'Exiting Simulation Mode', message: 'Syncing to live telemetry…', source: 'system' });
              } else if (next && !prev) {
                addLog({ id: entryId, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: "SIM_TOGGLE", data: { message: `Simulation mode enabled at ${tsStr}.` } });
                addMissionEvent({ id: `sim-${entryId}`, ts: Date.now(), type: "note", label: "Enter Simulation", meta: { flash: true, logId: entryId } });
                addNotification({ severity: 'info', title: 'Simulation Mode', message: 'Simulation mode enabled', source: 'system' });
              }
            }}
          />
        </div>
      </div>
      <p id="simulation-help" className="sr-only">Toggle simulation to inject hypothetical hazards without affecting live telemetry.</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="col-span-2" htmlFor="haz-label">Label<input id="haz-label" aria-label="Hazard label" className="w-full mt-1 px-2 py-1 bg-background/30 border border-border/50 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" value={label} onChange={(e) => setLabel(e.target.value)} /></label>
        <label htmlFor="haz-kind">Kind
          <select id="haz-kind" aria-label="Hazard kind" className="w-full mt-1 px-2 py-1 bg-background/30 border border-border/50 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" value={kind} onChange={(e) => setKind(e.target.value as any)}>
            <option value="solar-flare">Solar Flare</option>
            <option value="space-debris">Space Debris</option>
            <option value="communication-loss">Comms Loss</option>
            <option value="engine-failure">Engine Failure</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label htmlFor="haz-severity">Severity
          <input id="haz-severity" aria-label="Hazard severity" aria-describedby="haz-severity-help" type="number" min={1} max={5} className="w-full mt-1 px-2 py-1 bg-background/30 border border-border/50 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} />
        </label>
        <label htmlFor="haz-start">Start in (min)
          <input id="haz-start" aria-label="Start in minutes" type="number" min={0} className="w-full mt-1 px-2 py-1 bg-background/30 border border-border/50 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </label>
      </div>
      <p id="haz-severity-help" className="sr-only">Severity ranges from 1 low to 5 extreme. TODO: tune mapping rules.</p>
      <div className="flex justify-end mt-3">
        <div className="flex gap-2">
          <button aria-label="Inject hazard" className="px-3 py-1.5 text-sm rounded border border-border/50 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={inject}>Inject Hazard</button>
          <button aria-label="Inject test flare" className="px-3 py-1.5 text-sm rounded border border-border/50 hover:bg-white/5" onClick={() => {
            setKind('solar-flare');
            setLabel('M1.0 Solar Flare');
            setSeverity(4);
            setMinutes(0);
            inject();
          }}>Inject Test Flare</button>
          <button aria-label="Run What-If analysis" className="px-3 py-1.5 text-sm rounded border border-border/50 hover:bg-white/5" onClick={() => {
            const corr = crypto?.randomUUID?.() || String(Date.now());
            // 1) FEC High
            const id1 = Date.now();
            addLog({ id: id1, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'COMMS_ACTION', severity: 'info', subsystem: 'comms', data: { action: 'Enable High FEC', automated: true, correlationId: corr } });
            addMissionEvent({ id: `wi-${id1}`, ts: Date.now(), type: 'comm', label: 'FEC High (what-if)', meta: { logId: id1 } });
            // 2) Switch to UHF
            const id2 = id1 + 1;
            addLog({ id: id2, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'COMMS_ACTION', severity: 'warning', subsystem: 'comms', actionRequired: false, data: { action: 'Switch to UHF backup (what-if)', correlationId: corr } });
            addMissionEvent({ id: `wi-${id2}`, ts: Date.now()+5_000, type: 'comm', label: 'UHF Switch (what-if)', meta: { logId: id2 } });
            // 3) DSN overlap
            planDSNHandover(mission, mission, { correlationId: corr });
            // 4) Schedule dump
            scheduleDataDump(mission, mission, { correlationId: corr, fallbackAfterMin: 20 });
          }}>Run What-If Analysis</button>
        </div>
      </div>
      {/* Scenario playback & comparison */}
      <div className="mt-4 border-t border-border/50 pt-3">
        <div className="flex items-center gap-2 text-xs mb-2">
          <button className="px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
          <button className="px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label="Step" onClick={() => setCursorTs(ts => (ts ? ts + 60_000 : (commsHistory[0]?.ts || Date.now())))}>Step</button>
          <label className="ml-2 inline-flex items-center gap-1">
            <input type="checkbox" checked={baselineOn} onChange={(e) => setBaselineOn(e.target.checked)} />
            <span>Compare pre/post</span>
          </label>
        </div>
        {/* Scrub slider */}
        <input
          type="range"
          min={commsHistory[0]?.ts || 0}
          max={commsHistory[commsHistory.length-1]?.ts || 100}
          value={cursorTs || commsHistory[commsHistory.length-1]?.ts || 0}
          onChange={(e) => {
            const ts = Number(e.target.value);
            setCursorTs(ts);
            // Dispatch to scroll the log around this time (placeholder mapping)
            const ev = new CustomEvent('odin-scroll-to-log', { detail: { logId: ts } });
            window.dispatchEvent(ev);
          }}
          className="w-full"
        />
        {/* Synchronized mini-charts */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { key: 'latency', lines: [{ k: 'uplinkMs', name: 'Uplink', color: '#60A5FA' }, { k: 'downlinkMs', name: 'Downlink', color: '#34D399' }], yfmt: 'ms' },
            { key: 'loss', lines: [{ k: 'packetLossPct', name: 'Loss', color: '#F472B6' }], yfmt: '%' },
            { key: 'confidence', lines: [{ k: 'uplinkMs', name: 'Confidence', color: '#F59E0B' }], yfmt: '%' }, // TODO: replace with true confidence series
          ].map((cfg) => (
            <div key={cfg.key} className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commsHistory} margin={{ left: 6, right: 6, top: 2, bottom: 2 }}>
                  <XAxis dataKey="ts" hide />
                  <YAxis width={24} tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : v, cfg.yfmt]} />
                  <Legend />
                  {cfg.lines.map((ln) => (
                    <Line key={ln.k} dataKey={ln.k as any} name={ln.name} stroke={ln.color} dot={false} strokeWidth={1.3} />
                  ))}
                  {baselineOn && baselineRef.current.length > 0 && (
                    <Line data={baselineRef.current as any} dataKey={cfg.lines[0].k as any} name={`${cfg.lines[0].name} (baseline)`} stroke="#999" dot={false} strokeDasharray="3 3" strokeWidth={1} />
                  )}
                  {cursorTs && <ReferenceLine x={cursorTs} stroke="#ef4444" strokeDasharray="4 2" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
