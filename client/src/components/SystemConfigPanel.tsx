import React, { useEffect, useState } from 'react';
import { useMission } from '@/context/MissionContext';

export default function SystemConfigPanel() {
  const { telemetryBufferMs = 30000, setTelemetryBuffer, fecLevel = 'Medium', setFecLevel, scheduledDumps = [], scheduleDump, commsHistory = [], addLog } = useMission();
  const [buf, setBuf] = useState(telemetryBufferMs);

  useEffect(() => {
    setBuf(telemetryBufferMs);
  }, [telemetryBufferMs]);

  // Automate FEC changes based on last SNR
  useEffect(() => {
    const last = commsHistory[commsHistory.length - 1];
    if (!last || last.snrDb === undefined) return;
    if (last.snrDb < 5 && fecLevel !== 'High') {
      setFecLevel('High');
      const id = Date.now();
      addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'FEC_UPGRADE', data: { from: fecLevel, to: 'High', reason: 'Low SNR' }, subsystem: 'comms' });
    }
  }, [commsHistory, fecLevel, setFecLevel]);

  return (
    <div className="glass-card p-3 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Dynamic System Configuration</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col">
          <span>Telemetry Buffer (ms)</span>
          <input type="number" className="mt-1 px-2 py-1 bg-background/30 border border-border/50 rounded" value={buf} onChange={(e) => setBuf(Number(e.target.value))} />
        </label>
        <div className="flex items-end">
          <button className="px-2 py-1 rounded border border-border/50" onClick={() => { setTelemetryBuffer(buf); const id=Date.now(); addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'SET_BUFFER', data: { buf }, subsystem: 'comms' }); }}>Apply</button>
        </div>
        <label className="flex flex-col">
          <span>FEC Level</span>
          <select className="mt-1 px-2 py-1 bg-background/30 border border-border/50 rounded" value={fecLevel} onChange={(e) => setFecLevel(e.target.value as any)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <div className="flex items-end text-[11px] text-muted-foreground">Automatically increases during low SNR</div>
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold mb-1">Schedule Data Dumps</div>
        <button className="px-2 py-1 rounded border border-border/50 text-xs" onClick={() => {
          const start = Date.now() + 2*60_000; const end = start + 10*60_000;
          scheduleDump({ id: Math.random().toString(36).slice(2), startTs: start, endTs: end });
        }}>Add window</button>
        <ul className="mt-1 text-xs">
          {scheduledDumps.map(w => (
            <li key={w.id}>Window: {new Date(w.startTs).toLocaleTimeString()}–{new Date(w.endTs).toLocaleTimeString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
