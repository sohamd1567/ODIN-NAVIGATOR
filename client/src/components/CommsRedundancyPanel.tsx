import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMission } from '@/context/MissionContext';
import { useNotificationStore } from '@/context/NotificationContext';
import { useApiClient } from '@/lib/apiClient';

export default function CommsRedundancyPanel() {
  const { hazards, commsRedundancy, addLog, addMissionEvent, setCommsRedundancy } = useMission();
  const { addNotification } = useNotificationStore();
  const { request } = useApiClient();
  const [checking, setChecking] = useState(false);
  const combinedRisk = 0; // TODO: compute from hazards or use useCombinedRisk
  const latestFlare = useMemo(() => hazards.filter(h => h.kind === 'solar-flare').sort((a,b)=>b.startTs-a.startTs)[0], [hazards]);

  const flareClassNum = () => {
    const cls = String(latestFlare?.details?.class || '').toUpperCase();
    if (cls.startsWith('X')) return 6; if (cls.startsWith('M')) return Number(cls.slice(1)) >= 5 ? 5 : 4; if (cls.startsWith('C')) return 3; return 1;
  };

  async function validateBackupUHF() {
    setChecking(true);
    const start = Date.now();
    addNotification({ severity: 'warning', title: 'High-risk Event Detected', message: 'Initiating backup UHF communication validation.', source: 'comms' });
    addLog({ id: start, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'UHF_VALIDATE_START', data: {}, subsystem: 'comms', permalink: `#log-${start}` });
    try {
      // TODO: backend endpoint to validate link
      const res = await request<{ status: 'ok'; latencyMs: number; lossPct: number; snrDb: number }>(`/api/comms/validate-uhf`, { method: 'POST', label: 'Validate UHF' });
      setCommsRedundancy({ backupUHF: { status: 'up', latencyMs: res.latencyMs, lossPct: res.lossPct, snrDb: res.snrDb, lastCheck: Date.now() }, lastValidatedTs: Date.now() });
      addLog({ id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'UHF_VALIDATE_OK', data: { ...res }, subsystem: 'comms' });
    } catch (e) {
      setCommsRedundancy({ backupUHF: { status: 'down', lastCheck: Date.now() } });
      addLog({ id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'UHF_VALIDATE_FAIL', data: {}, subsystem: 'comms', severity: 'warning' });
    } finally {
      setChecking(false);
    }
  }

  // Trigger on high risk or M5+
  useEffect(() => {
    if (combinedRisk >= 85 || flareClassNum() >= 5) {
      validateBackupUHF();
    }
  }, [combinedRisk, latestFlare?.details?.class]);

  // Schedule periodic validation when nominal
  useEffect(() => {
    const id = setInterval(() => {
      if (combinedRisk < 50) {
        validateBackupUHF();
        const entry = { id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'UHF_HEALTH_CHECK', data: {}, subsystem: 'comms' };
        addLog(entry);
        addMissionEvent({ id: `evt-${entry.id}`, ts: Date.now(), type: 'comm', label: 'UHF Health Check', meta: { logId: entry.id } });
      }
    }, 60 * 60_000); // hourly
    return () => clearInterval(id);
  }, [combinedRisk]);

  const cr = commsRedundancy;
  return (
    <div className="glass-card p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Communications Redundancy</h3>
        <button className="px-2 py-1 text-xs rounded border border-border/50" disabled={checking} onClick={validateBackupUHF}>{checking ? 'Validating…' : 'Validate Backup UHF'}</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded border border-border/50">
          <div className="font-semibold">Primary</div>
          <div>Status: {cr?.primary.status}</div>
          <div>Latency: {cr?.primary.latencyMs ?? '—'} ms</div>
          <div>Loss: {cr?.primary.lossPct ?? '—'} %</div>
          <div>SNR: {cr?.primary.snrDb ?? '—'} dB</div>
        </div>
        <div className="p-2 rounded border border-border/50">
          <div className="font-semibold">Backup UHF</div>
          <div>Status: {cr?.backupUHF.status}</div>
          <div>Latency: {cr?.backupUHF.latencyMs ?? '—'} ms</div>
          <div>Loss: {cr?.backupUHF.lossPct ?? '—'} %</div>
          <div>SNR: {cr?.backupUHF.snrDb ?? '—'} dB</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">Last validated: {cr?.lastValidatedTs ? new Date(cr.lastValidatedTs).toLocaleString() : '—'}</div>
    </div>
  );
}
