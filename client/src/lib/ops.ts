import { MissionActions, MissionState, activeRLevelFromHazards } from "@/types/odin";

// Compute next safe data-dump window after hazard window, or at a fallback UTC time
export function scheduleDataDump(state: MissionState, actions: MissionActions, opts?: { fallbackAfterMin?: number; correlationId?: string }) {
  const now = Date.now();
  const active = state.hazards.find(h => h.kind === 'solar-flare' && now <= (h.endTs ?? now));
  const start = active ? (active.endTs ?? now + 30 * 60_000) + 30 * 60_000 : now + (opts?.fallbackAfterMin ?? 20) * 60_000;
  const end = start + 20 * 60_000;
  const id = `dump-${start}`;
  actions.scheduleDump({ id, startTs: start, endTs: end });
  const logId = Date.now();
  const r = activeRLevelFromHazards(state.hazards);
  const tplusMin = Math.round((start - now) / 60_000);
  const tplus = `T+${String(Math.floor(tplusMin/60)).padStart(2,'0')}:${String(tplusMin%60).padStart(2,'0')} UTC`;
  actions.addLog({
    id: logId,
    timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
    type: 'TELEMETRY_SCHEDULE',
    severity: 'info',
    subsystem: 'comms',
    data: { action: `Data dump scheduled at ${tplus}`, window: { start, end }, rLevel: r?.r, flareClass: r?.cls, correlationId: opts?.correlationId }
  });
  actions.addMissionEvent({ id, ts: start, type: 'comm', label: 'Scheduled Data Dump', durationMs: end - start, meta: { logId } });
}

// Plan a DSN handover with a 10-minute overlap, naively cycling Canberra -> Goldstone -> Madrid
export function planDSNHandover(state: MissionState, actions: MissionActions, opts?: { correlationId?: string }) {
  const order = ['Canberra', 'Goldstone', 'Madrid'];
  const current = state.comms.dsnStation || '';
  const idx = order.findIndex(s => current.toLowerCase().includes(s.toLowerCase()));
  const nextSite = order[(idx + 1 + order.length) % order.length];
  const start = Date.now() + 10 * 60_000;
  const end = start + 10 * 60_000;
  const id = `dsn-${start}`;
  const logId = Date.now();
  const r = activeRLevelFromHazards(state.hazards);
  actions.addLog({
    id: logId,
    timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
    type: 'COMMS_ACTION',
    severity: 'info',
    subsystem: 'comms',
    data: { action: 'DSN handover scheduled', from: current, to: nextSite, overlapMin: 10, rLevel: r?.r, flareClass: r?.cls, correlationId: opts?.correlationId }
  });
  actions.addMissionEvent({ id, ts: start, type: 'comm', label: `DSN Handover: ${nextSite}`, durationMs: end - start, meta: { logId } });
}
