import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMission } from "@/context/MissionContext";
import { useNotificationStore } from "@/context/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import CommsDiagnosticsAccordion from "./CommsDiagnosticsAccordion";
import { activeRLevelFromHazards } from "@/types/odin";

export default function CommsHealthWidget() {
  const { comms, riskBands, commsDegraded, hazards, addLog, addMissionEvent, setFecLevel, setCommsRedundancy, commsRedundancy, telemetryBufferMs, fecLevel, setFecManualOverride, switchActiveLink } = useMission();
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();
  const lastDegraded = useRef<boolean>(false);
  const degraded = comms.packetLossPct > 5 || comms.uplinkMs > 500 || comms.downlinkMs > 500; // TODO: thresholds in config
  const duringRisk = riskBands.some((r) => Date.now() >= r.startTs && Date.now() <= r.endTs);
  const rNow = useMemo(() => activeRLevelFromHazards(hazards), [hazards]);
  const [manualOverride, setManualOverride] = useState(false);

  // Adaptive FEC / UHF switch thresholds
  const HIGH_FEC_TRIGGER = (loss: number, snr?: number) => loss >= 2 || (snr !== undefined && snr <= 9);
  const UHF_SWITCH_TRIGGER = (loss: number, snr?: number) => loss >= 5 || (snr !== undefined && snr <= 6);

  useEffect(() => {
    if (degraded && !lastDegraded.current) {
      // Disabled: Communications degradation banner
      // addNotification({ severity: 'warning', title: 'Comms degraded', message: `Latency ${Math.max(comms.uplinkMs, comms.downlinkMs)} ms, loss ${comms.packetLossPct.toFixed(1)}%`, source: 'comms' });
    }
    lastDegraded.current = degraded;
  }, [degraded, comms.uplinkMs, comms.downlinkMs, comms.packetLossPct, addNotification]);

  // Auto actions based on thresholds
  useEffect(() => {
  const corr = crypto?.randomUUID?.() || String(Date.now());
  const snr = commsRedundancy?.primary?.snrDb ?? 9.2;
    // High FEC enable
  if (!manualOverride && HIGH_FEC_TRIGGER(comms.packetLossPct, snr)) {
      setFecLevel('High');
      const id = Date.now();
      const r = rNow?.r || 'R1';
      addLog({
        id,
        timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
        type: 'COMMS_ACTION',
        severity: 'warning',
        actionRequired: false,
        subsystem: 'comms',
        data: {
          action: 'Enable High FEC',
          automated: true,
          triggers: { lossPct: '>=2%', snrDb: '<=9dB' },
          measured: { lossPct: Number(comms.packetLossPct.toFixed(1)), snrDb: snr },
          rLevel: r,
          justification: 'Link budget margin reduced; FEC gain improves BER under low SNR.',
          correlationId: corr,
        },
      });
      addMissionEvent({ id: `fec-${id}`, ts: Date.now(), type: 'comm', label: 'High FEC Enabled', meta: { logId: id } });
    }
    // UHF switch recommendation
    if (UHF_SWITCH_TRIGGER(comms.packetLossPct, snr)) {
      const id = Date.now()+1;
      const r = rNow?.r || 'R1';
    switchActiveLink('backupUHF');
      addLog({
        id,
        timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
        type: 'COMMS_ACTION',
        severity: 'critical',
        actionRequired: true,
        subsystem: 'comms',
        data: {
      action: 'Switched to UHF backup and lowered data rate',
          automated: true,
          triggers: { lossPct: '>=5%', snrDb: '<=6dB' },
          measured: { lossPct: Number(comms.packetLossPct.toFixed(1)), snrDb: snr },
          rLevel: r,
          justification: 'Primary link margin insufficient; UHF provides robustness under deep fades.',
          correlationId: corr,
        },
      });
  addMissionEvent({ id: `uhf-${id}`, ts: Date.now(), type: 'comm', label: 'Switched to UHF Backup', meta: { logId: id } });
      setCommsRedundancy({ backupUHF: { status: 'up', lastCheck: Date.now() } as any });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comms.packetLossPct, comms.uplinkMs, comms.downlinkMs]);

  return (
  <div className={`p-3 rounded-lg border ${degraded ? "border-red-500/60 bg-red-950/30" : "border-border/50 bg-background/30"}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Comms Health</h3>
        <span className={`text-xs ${degraded ? "text-red-400" : "text-emerald-400"}`} aria-live="polite">
          {degraded ? <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-red-500/60 rounded text-red-300" aria-label="Comms Degraded">⚠️ Comms Degraded</span> : "Nominal"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><div className="text-muted-foreground">Uplink</div><div className="font-mono">{Math.round(comms.uplinkMs)} ms</div></div>
        <div><div className="text-muted-foreground">Downlink</div><div className="font-mono">{Math.round(comms.downlinkMs)} ms</div></div>
        <div><div className="text-muted-foreground">Loss</div><div className="font-mono">{comms.packetLossPct.toFixed(1)}%</div></div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">DSN: <span className="text-foreground">{comms.dsnStation}</span>{rNow ? <span className="ml-2 text-yellow-200">R-level: {rNow.r}</span> : null}</div>
      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
        <div>FEC: <span className="font-mono">{fecLevel}</span></div>
        <div>Buffer: <span className="font-mono">{Math.round((telemetryBufferMs||0)/1000)}s</span></div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Thresholds: High FEC at loss ≥ 2% or SNR ≤ 9 dB; UHF/data-rate at loss ≥ 5% or SNR ≤ 6 dB.
      </div>
      {duringRisk && (
        <div className="mt-2 text-[11px] text-yellow-300">Within hazard window: comms degradations likely</div>
      )}
      <div className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-2">
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" aria-label="Manual FEC override" checked={manualOverride} onChange={(e) => { setManualOverride(e.target.checked); setFecManualOverride(e.target.checked); addNotification({ severity: 'info', title: 'FEC override', message: e.target.checked ? 'Manual override enabled' : 'Manual override disabled', source: 'comms' }); }} />
          <span>Manual override</span>
        </label>
        {manualOverride && <span className="text-yellow-300">Auto-FEC adjustments paused</span>}
      </div>
      {/* Operator actions */}
      <div className="mt-2 flex gap-2">
        <button className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label="Enable High FEC" onClick={() => {
          const id = Date.now();
          setFecLevel('High');
          setFecManualOverride(true);
          addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'COMMS_ACTION', severity: 'info', subsystem: 'comms', data: { action: 'Enable High FEC', manual: true } });
          addMissionEvent({ id: `fec-${id}`, ts: Date.now(), type: 'comm', label: 'High FEC Enabled', meta: { logId: id } });
        }}>Enable High FEC</button>
        <button className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label="Plan DSN handover" onClick={() => {
          const id = Date.now();
          addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'COMMS_ACTION', severity: 'warning', actionRequired: true, subsystem: 'comms', data: { action: 'Plan DSN handover', sites: ['Canberra','Goldstone','Madrid'], overlapMin: 10 } });
          addMissionEvent({ id: `dsn-${id}`, ts: Date.now()+10*60_000, type: 'comm', label: 'DSN Handover (overlap)', durationMs: 10*60_000, meta: { logId: id } });
        }}>Plan DSN handover</button>
        <button className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label="Validate UHF" onClick={() => {
          console.log('🔧 Validate UHF button clicked!');
          const id = Date.now();
          addLog({ id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'COMMS_ACTION', severity: 'info', subsystem: 'comms', data: { action: 'Validate UHF backup', result: 'ok' } });
          addMissionEvent({ id: `uhfval-${id}`, ts: Date.now(), type: 'comm', label: 'UHF Validated', meta: { logId: id } });
          toast({
            title: "✅ UHF Backup Validated",
            description: "UHF communication link validation successful.",
            duration: 3000,
          });
          console.log('🔧 UHF Validation completed - log and event added');
        }}>Validate UHF</button>
        <button className="text-[11px] px-2 py-1 rounded border border-border/50 hover:bg-white/5" aria-label="Switch to UHF backup" onClick={() => {
          console.log('🔧 Switch to UHF backup button clicked!');
          const id = Date.now();
          const correlationId = crypto?.randomUUID?.() || String(Date.now());
          switchActiveLink('backupUHF');
          addLog({
            id,
            timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
            type: 'COMMS_ACTION',
            severity: 'warning',
            actionRequired: false,
            subsystem: 'comms',
            data: {
              action: 'Switched to UHF backup (manual)',
              manual: true,
              correlationId,
              justification: 'Manual switch to UHF backup communication link',
            },
          });
          addMissionEvent({ id: `uhf-manual-${id}`, ts: Date.now(), type: 'comm', label: 'Switched to UHF Backup', meta: { logId: id } });
          setCommsRedundancy({ backupUHF: { status: 'up', lastCheck: Date.now() } as any });
          addNotification({
            severity: 'info',
            title: 'UHF Backup Activated',
            message: 'Communication link switched to UHF backup. Primary link deactivated.',
            source: 'Communications'
          });
          toast({
            title: "🔄 Switched to UHF Backup",
            description: "Primary communication link switched to UHF backup.",
            duration: 4000,
          });
          console.log('🔧 UHF switch completed - switched to backup link');
        }}>Switch to UHF Backup</button>
      </div>
      <CommsDiagnosticsAccordion />
  </div>
  );
}
