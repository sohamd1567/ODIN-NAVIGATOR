import React, { useState } from 'react';
import { useMission } from '@/context/MissionContext';
import { useApiClient } from '@/lib/apiClient';

export default function EmergencyRecoveryPanel() {
  const { addLog, addMissionEvent } = useMission();
  const { request } = useApiClient();
  const [busy, setBusy] = useState(false);

  async function safeMode() {
    setBusy(true);
    const id = Date.now();
    addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'SAFE_MODE_ENTER', data: {}, subsystem: 'system' });
    addMissionEvent({ id: `evt-${id}`, ts: Date.now(), type: 'note', label: 'Enter Safe Mode', meta: { flash: true, logId: id } });
    try {
      // TODO: backend endpoint
      await request('/api/system/safe-mode', { method: 'POST', critical: true, label: 'Enter Safe Mode' });
    } finally {
      setBusy(false);
    }
  }

  async function reboot() {
    setBusy(true);
    const id = Date.now();
    addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'SYSTEM_REBOOT', data: {}, subsystem: 'system' });
    try {
      // TODO: backend endpoint
      await request('/api/system/reboot', { method: 'POST', critical: true, label: 'System Reboot' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card p-3 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Emergency Recovery</h3>
      <div className="flex gap-2 text-xs">
        <button className="px-2 py-1 rounded border border-border/50" onClick={safeMode} disabled={busy}>Enter Safe Mode</button>
        <button className="px-2 py-1 rounded border border-border/50" onClick={reboot} disabled={busy}>System Reboot</button>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">AI will automate telemetry rerouting during recovery. Manual overrides allowed.</div>
    </div>
  );
}
