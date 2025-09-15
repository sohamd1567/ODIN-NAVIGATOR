import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type {
  CommsHealth,
  HazardEvent,
  LogEntry,
  LogComment,
  MissionActions,
  MissionContextType,
  MissionEvent,
  MissionState,
  RiskBand,
} from "@/types/odin";
import { combinedRiskIndex, COMMS_THRESHOLDS, activeRLevelFromHazards } from "@/types/odin";
import type { LinkHealth } from "@/types/odin";

type Action =
  | { type: "SET_SIM"; v: boolean }
  | { type: "ADD_HAZARD"; h: HazardEvent }
  | { type: "CLEAR_HAZARD"; id: string }
  | { type: "SET_COMMS"; c: Partial<CommsHealth> }
  | { type: "ADD_EVENT"; e: MissionEvent }
  | { type: "ADD_RISK"; b: RiskBand }
  | { type: "ADD_COMMENT"; c: LogComment }
  | { type: "UPDATE_COMMENT"; logEntryId: number; commentId: string; patch: Partial<LogComment> }
  | { type: "RESOLVE_COMMENT"; logEntryId: number; commentId: string }
  | { type: "ADD_LOG"; entry: LogEntry }
  | { type: "SET_FEC"; level: 'Low'|'Medium'|'High' }
  | { type: "SET_FEC_OVERRIDE"; manual: boolean }
  | { type: "SET_BUFFER"; ms: number }
  | { type: "SCHEDULE_DUMP"; win: { id: string; startTs: number; endTs: number } }
  | { type: "SWITCH_ACTIVE_LINK"; which: 'primary'|'backupUHF' }
  | { type: "SET_TEAM_ROLE"; role: string; operator: string }
  | { type: "SET_SUBSYSTEM_OWNER"; subsystem: string; owner: string }
  | { type: "SET_COMMS_REDUNDANCY"; primary?: Partial<import("@/types/odin").LinkHealth>; backupUHF?: Partial<import("@/types/odin").LinkHealth>; lastValidatedTs?: number };

const initialState: MissionState = {
  now: Date.now(),
  simulationMode: false,
  hazards: [
    {
      id: "h1",
      kind: "solar-flare",
      label: "M1.0 Solar Flare",
      severity: 4,
  startTs: Date.now() - 15 * 60_000,
  endTs: Date.now() + 30 * 60_000,
      details: { class: "M1.0", sourceRegion: "AR3751" },
      recommendedAction: "Switch to UHF backup",
    },
  ],
  missionEvents: [
    { id: "e1", ts: Date.now() + 30 * 60_000, type: "burn", label: "TCM-1", durationMs: 8 * 60_000 },
    { id: "e2", ts: Date.now() + 3 * 3600_000, type: "comm", label: "DSN Handover", durationMs: 15 * 60_000 },
  ],
  riskBands: [
    { id: "r1", startTs: Date.now() - 10 * 60_000, endTs: Date.now() + 45 * 60_000, severity: 4, label: "Solar Radio Blackout" },
  ],
  comms: { uplinkMs: 420, downlinkMs: 510, packetLossPct: 2.4, dsnStation: "DSS-43 Canberra" },
  commsRedundancy: {
    primary: { name: 'DSN Ka/ X-band', status: 'up', latencyMs: 480, lossPct: 2.1, snrDb: 9.2, lastCheck: Date.now() - 10*60_000 },
    backupUHF: { name: 'Backup UHF', status: 'up', latencyMs: 680, lossPct: 3.5, snrDb: 6.1, lastCheck: Date.now() - 60*60_000 },
    lastValidatedTs: Date.now() - 60*60_000,
  },
  // Seed a 24h rolling comms history at 5-minute intervals
  commsHistory: (() => {
    const out: any[] = [];
    const now = Date.now();
    const step = 5 * 60_000;
    const n = Math.floor((24 * 3600_000) / step);
    for (let i = n; i >= 0; i--) {
      const ts = now - i * step;
      const baseLat = 350 + 100 * Math.sin((i / n) * Math.PI * 2);
      const snr = 8 + 3 * Math.cos((i / (n / 3)) * Math.PI * 2);
      // If within initial hazard window, degrade slightly
      const inFlare = ts >= (Date.now() - 15 * 60_000) && ts <= (Date.now() + 30 * 60_000);
      const uplinkMs = baseLat + (inFlare ? 180 : 0) + Math.random() * 40;
      const downlinkMs = baseLat + (inFlare ? 200 : 0) + Math.random() * 50;
      const packetLossPct = (inFlare ? 4 + Math.random() * 3 : 1 + Math.random() * 2);
      out.push({ ts, uplinkMs, downlinkMs, packetLossPct, dsnStation: "DSS-43 Canberra", snrDb: snr + (inFlare ? -3 : 0) });
    }
    return out;
  })(),
  commentsByLogId: {},
  commsDegraded: false,
  telemetryBufferMs: 30000,
  fecLevel: 'Medium',
  fecManualOverride: false,
  activeLink: 'primary',
  scheduledDumps: [],
  teamRoles: { 'Flight Director': 'Unassigned', 'Comms': 'Unassigned', 'Navigation': 'Unassigned', 'Propulsion': 'Unassigned' },
  subsystemOwners: { comms: 'Comms', nav: 'Navigation', propulsion: 'Propulsion' },
  logEntries: [
    {
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: "STATUS",
      data: { message: "No hazards detected; monitoring sensors." },
    },
  ],
};

function reducer(state: MissionState, action: Action): MissionState {
  switch (action.type) {
    case "SET_SIM":
      return { ...state, simulationMode: action.v };
    case "ADD_HAZARD": {
      const bands = [...state.riskBands];
      // Derive a short risk band around the hazard time (default 45 minutes)
      const start = action.h.startTs;
      const end = action.h.endTs || action.h.startTs + 45 * 60_000;
      bands.push({ id: `rb-${action.h.id}`, startTs: start, endTs: end, severity: action.h.severity, label: action.h.label });
  const hEvent: MissionEvent = { id: `h-${action.h.id}`, ts: Date.now(), type: "note", label: `Hazard: ${action.h.label}`, meta: { flash: true } };
  const events = [...state.missionEvents, hEvent];
      // When adding a solar flare with R>=R2, increase telemetry buffer and defer bulk dumps
      let telemetryBufferMs = state.telemetryBufferMs;
      let scheduledDumps = state.scheduledDumps || [];
      const rInfo = activeRLevelFromHazards([...state.hazards, action.h]);
      const corr = String(Date.now());
      let logEntries = state.logEntries || [];
      if (rInfo && rInfo.severity >= 2) {
        telemetryBufferMs = Math.max(telemetryBufferMs || 30000, 120000);
        const deferStart = rInfo.window?.startTs || action.h.startTs;
        const deferEnd = rInfo.window?.endTs || (action.h.endTs || action.h.startTs + 45*60_000);
        const winId = `defer-${deferStart}`;
        scheduledDumps = [...scheduledDumps, { id: winId, startTs: deferStart, endTs: deferEnd }];
        const logId = Date.now();
        logEntries = [...logEntries, {
          id: logId,
          timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
          type: 'TELEMETRY_POLICY',
          severity: 'warning',
          subsystem: 'comms',
          actionRequired: false,
          data: {
            action: 'Increase buffer and defer bulk dump',
            r_level: rInfo.r,
            buffer_ms: telemetryBufferMs,
            window: { start: deferStart, end: deferEnd },
            correlationId: corr,
          }
        }];
        events.push({ id: winId, ts: deferStart, type: 'window', label: 'Defer Bulk Dump', durationMs: Math.max(0, deferEnd - deferStart), meta: { logId } });
      }
      return { ...state, hazards: [...state.hazards, action.h], riskBands: bands, missionEvents: events, telemetryBufferMs, scheduledDumps, logEntries };
    }
    case "CLEAR_HAZARD":
      return { ...state, hazards: state.hazards.filter((h) => h.id !== action.id) };
    case "SET_COMMS": {
      const comms = { ...state.comms, ...action.c } as CommsHealth;
      const degraded =
        comms.packetLossPct > COMMS_THRESHOLDS.packetLossPct ||
        comms.uplinkMs > COMMS_THRESHOLDS.latencyMs ||
        comms.downlinkMs > COMMS_THRESHOLDS.latencyMs;
      let nextLogs = state.logEntries || [];
      let nextEvents = state.missionEvents;
      let telemetryBufferMs = state.telemetryBufferMs;
      let scheduledDumps = state.scheduledDumps || [];
      const corr = String(Date.now());
      // If loss ≥ 2%: increase buffer and defer bulk dump until flare decays (or 30m)
      if (comms.packetLossPct >= 2) {
        telemetryBufferMs = Math.max(telemetryBufferMs || 30000, 120000);
        const rInfo = activeRLevelFromHazards(state.hazards);
        const deferStart = Date.now();
        const deferEnd = rInfo ? (rInfo.window?.endTs ?? (deferStart + 30*60_000)) : (deferStart + 30*60_000);
        const winId = `defer-${deferStart}`;
        scheduledDumps = [...scheduledDumps, { id: winId, startTs: deferStart, endTs: deferEnd }];
        const logId = Date.now();
        nextLogs = [...nextLogs, {
          id: logId,
          timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
          type: 'TELEMETRY_POLICY',
          severity: 'warning',
          subsystem: 'comms',
          actionRequired: false,
          data: { action: 'Increase buffer and defer bulk dump', reason: 'loss>=2% or R>=R2', lossPct: Number(comms.packetLossPct.toFixed(1)), r_level: rInfo?.r || 'R1', buffer_ms: telemetryBufferMs, window: { start: deferStart, end: deferEnd }, correlationId: corr }
        }];
        nextEvents = [...nextEvents, { id: winId, ts: deferStart, type: 'window', label: 'Defer Bulk Dump', durationMs: Math.max(0, deferEnd - deferStart), meta: { logId } }];
        // Schedule a high-rate dump 30 minutes after defer window ends
        const dumpStart = deferEnd + 30*60_000;
        const dumpEnd = dumpStart + 20*60_000;
        const dumpId = `dump-${dumpStart}`;
        scheduledDumps = [...scheduledDumps, { id: dumpId, startTs: dumpStart, endTs: dumpEnd }];
        const dumpLogId = Date.now()+1;
        nextLogs = [...nextLogs, { id: dumpLogId, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'TELEMETRY_SCHEDULE', severity: 'info', subsystem: 'comms', data: { action: 'Schedule high-rate dump', window: { start: dumpStart, end: dumpEnd }, correlationId: corr } }];
        nextEvents = [...nextEvents, { id: dumpId, ts: dumpStart, type: 'comm', label: 'High-Rate Dump', durationMs: dumpEnd - dumpStart, meta: { logId: dumpLogId } }];
      }
      if (degraded && !state.commsDegraded) {
        const tsStr = new Date().toISOString().substring(11, 16) + " UTC";
        const entry: LogEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: "COMMS_ALERT",
          data: {
            message: `Comms degraded at ${tsStr} (loss ${comms.packetLossPct.toFixed(1)}%, latency ${Math.max(
              comms.uplinkMs,
              comms.downlinkMs
            )} ms); switching to backup link.`,
          },
        };
        nextLogs = [...nextLogs, entry];
  // Disabled: Comms degraded mission events
  // const e: MissionEvent = { id: `evt-${entry.id}`, ts: Date.now(), type: "comm", label: "⚠️ Comms Degraded", meta: { flash: true } };
  // nextEvents = [...nextEvents, e];
      }
      // Auto propose DSN handover when severe loss or SNR low
      const snr = (state.commsRedundancy?.primary.snrDb) ?? (state.commsHistory && state.commsHistory[state.commsHistory.length-1]?.snrDb) ?? 9;
      if (comms.packetLossPct >= 5 || snr <= 6) {
        const id = Date.now()+2;
        nextLogs = [...nextLogs, { id, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'COMMS_ACTION', severity: 'warning', actionRequired: true, subsystem: 'comms', data: { action: 'Plan DSN handover', triggers: { lossPct: '>=5%', snrDb: '<=6dB' }, measured: { lossPct: Number(comms.packetLossPct.toFixed(1)), snrDb: snr }, sites: ['Canberra','Goldstone','Madrid'], overlapMin: 10, correlationId: corr } }];
        nextEvents = [...nextEvents, { id: `dsn-${id}`, ts: Date.now()+10*60_000, type: 'comm', label: 'DSN Handover (overlap)', durationMs: 10*60_000, meta: { logId: id } }];
      }
      return { ...state, comms, commsDegraded: degraded, logEntries: nextLogs, missionEvents: nextEvents, telemetryBufferMs, scheduledDumps };
    }
    case "ADD_EVENT":
      return { ...state, missionEvents: [...state.missionEvents, action.e] };
    case "ADD_RISK":
      return { ...state, riskBands: [...state.riskBands, action.b] };
    case "ADD_LOG": {
      const list = state.logEntries || [];
      return { ...state, logEntries: [...list, action.entry] };
    }
    case "SET_FEC":
      return { ...state, fecLevel: action.level };
    case "SET_FEC_OVERRIDE":
      return { ...state, fecManualOverride: action.manual };
    case "SET_BUFFER":
      return { ...state, telemetryBufferMs: action.ms };
    case "SCHEDULE_DUMP":
      return { ...state, scheduledDumps: [...(state.scheduledDumps||[]), action.win] };
    case "SWITCH_ACTIVE_LINK": {
      return { ...state, activeLink: action.which };
    }
    case "SET_TEAM_ROLE":
      return { ...state, teamRoles: { ...(state.teamRoles||{}), [action.role]: action.operator } };
    case "SET_SUBSYSTEM_OWNER":
      return { ...state, subsystemOwners: { ...(state.subsystemOwners||{}), [action.subsystem]: action.owner } };
    case "SET_COMMS_REDUNDANCY": {
      const cr = state.commsRedundancy || { primary: { name: 'Primary', status: 'up' }, backupUHF: { name: 'Backup UHF', status: 'up' } } as any;
      return {
        ...state,
        commsRedundancy: {
          primary: { ...cr.primary, ...(action.primary||{}) },
          backupUHF: { ...cr.backupUHF, ...(action.backupUHF||{}) },
          lastValidatedTs: action.lastValidatedTs ?? cr.lastValidatedTs,
        },
      };
    }
    case "ADD_COMMENT": {
      const list = state.commentsByLogId[action.c.logEntryId] || [];
      return {
        ...state,
        commentsByLogId: { ...state.commentsByLogId, [action.c.logEntryId]: [...list, action.c] },
      };
    }
    case "UPDATE_COMMENT": {
      const list = state.commentsByLogId[action.logEntryId] || [];
      return {
        ...state,
        commentsByLogId: {
          ...state.commentsByLogId,
          [action.logEntryId]: list.map((c) => (c.id === action.commentId ? { ...c, ...action.patch } : c)),
        },
      };
    }
    case "RESOLVE_COMMENT": {
      const list = state.commentsByLogId[action.logEntryId] || [];
      return {
        ...state,
        commentsByLogId: {
          ...state.commentsByLogId,
          [action.logEntryId]: list.map((c) => (c.id === action.commentId ? { ...c, status: "resolved" } : c)),
        },
      };
    }
    default:
      return state;
  }
}

const MissionContext = createContext<MissionContextType | null>(null);

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used within MissionProvider");
  return ctx;
}

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions: MissionActions = useMemo(
    () => ({
      setSimulationMode: (v) => dispatch({ type: "SET_SIM", v }),
      addHazard: (h) => dispatch({ type: "ADD_HAZARD", h }),
      clearHazard: (id) => dispatch({ type: "CLEAR_HAZARD", id }),
      setComms: (c) => dispatch({ type: "SET_COMMS", c }),
      addMissionEvent: (e) => dispatch({ type: "ADD_EVENT", e }),
      addRiskBand: (b) => dispatch({ type: "ADD_RISK", b }),
      addComment: (c) => dispatch({ type: "ADD_COMMENT", c }),
      updateComment: (logEntryId, commentId, patch) =>
        dispatch({ type: "UPDATE_COMMENT", logEntryId, commentId, patch }),
      resolveComment: (logEntryId, commentId) =>
        dispatch({ type: "RESOLVE_COMMENT", logEntryId, commentId }),
  addLog: (entry) => dispatch({ type: "ADD_LOG", entry }),
  setFecLevel: (level: 'Low'|'Medium'|'High') => dispatch({ type: 'SET_FEC', level }),
  setFecManualOverride: (manual: boolean) => dispatch({ type: 'SET_FEC_OVERRIDE', manual }),
  setTelemetryBuffer: (ms: number) => dispatch({ type: 'SET_BUFFER', ms }),
  scheduleDump: (win: { id: string; startTs: number; endTs: number }) => dispatch({ type: 'SCHEDULE_DUMP', win }),
  switchActiveLink: (which: 'primary'|'backupUHF') => dispatch({ type: 'SWITCH_ACTIVE_LINK', which }),
  setTeamRole: (role: string, operator: string) => dispatch({ type: 'SET_TEAM_ROLE', role, operator }),
  setSubsystemOwner: (subsystem: string, owner: string) => dispatch({ type: 'SET_SUBSYSTEM_OWNER', subsystem, owner }),
  setCommsRedundancy: (patch: { primary?: import("@/types/odin").LinkHealth; backupUHF?: import("@/types/odin").LinkHealth; lastValidatedTs?: number }) => dispatch({ type: 'SET_COMMS_REDUNDANCY', ...patch }),
    }),
    []
  );

  const value: MissionContextType = useMemo(
    () => ({ ...state, ...actions }),
    [state, actions]
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

// Selectors / helpers
export function useCombinedRisk(): number {
  const { hazards } = useMission();
  return useMemo(() => combinedRiskIndex(hazards), [hazards]);
}
