// Shared ODIN domain types

export type HazardKind =
  | "solar-flare"
  | "space-debris"
  | "radiation-burst"
  | "engine-failure"
  | "communication-loss"
  | "custom";

export type SeverityLevel = 1 | 2 | 3 | 4 | 5; // 1=low, 5=extreme

export interface HazardEvent {
  id: string;
  kind: HazardKind;
  label: string; // e.g., "M1.0 Solar Flare"
  severity: SeverityLevel;
  startTs: number; // epoch ms
  endTs?: number; // epoch ms
  details?: Record<string, any>;
  recommendedAction?: string; // e.g., "Switch to UHF backup"
}

export interface MissionEvent {
  id: string;
  ts: number; // epoch ms
  type: "burn" | "maneuver" | "comm" | "waypoint" | "window" | "note";
  label: string;
  durationMs?: number;
  meta?: Record<string, any>;
}

export interface RiskBand {
  id: string;
  startTs: number;
  endTs: number;
  severity: SeverityLevel;
  label?: string;
}

export interface CommsHealth {
  uplinkMs: number;
  downlinkMs: number;
  packetLossPct: number; // 0-100
  dsnStation: string; // e.g., "DSS-43 Canberra"
}

export interface CommsSample extends CommsHealth {
  ts: number; // epoch ms
  snrDb?: number; // TODO: populate from DSN telemetry
  linkBudgetDb?: number; // TODO: calculate from antenna gains & distance
}

export type LinkStatus = 'up' | 'degraded' | 'down';
export interface LinkHealth {
  name: string;
  status: LinkStatus;
  latencyMs?: number;
  lossPct?: number;
  snrDb?: number;
  lastCheck?: number;
}

export type CommentStatus = "open" | "resolved";

export interface LogComment {
  id: string;
  logEntryId: number;
  author: string;
  text: string;
  createdAt: number;
  status: CommentStatus;
}

export interface MissionState {
  now: number;
  simulationMode: boolean;
  hazards: HazardEvent[];
  missionEvents: MissionEvent[];
  riskBands: RiskBand[];
  comms: CommsHealth;
  commsHistory?: CommsSample[]; // last 24h rolling window
  commsRedundancy?: { primary: LinkHealth; backupUHF: LinkHealth; lastValidatedTs?: number };
  commentsByLogId: Record<number, LogComment[]>;
  // Derived UI flags
  commsDegraded?: boolean;
  // Ops configuration
  telemetryBufferMs?: number;
  fecLevel?: 'Low'|'Medium'|'High';
  fecManualOverride?: boolean;
  activeLink?: 'primary'|'backupUHF';
  scheduledDumps?: Array<{ id: string; startTs: number; endTs: number }>;
  // Team coordination
  teamRoles?: Record<string, string>; // role -> operator
  subsystemOwners?: Record<string, string>; // subsystem -> owner
  // Centralized decision log entries
  logEntries?: LogEntry[];
}

export interface MissionActions {
  setSimulationMode(v: boolean): void;
  addHazard(h: HazardEvent): void;
  clearHazard(id: string): void;
  setComms(c: Partial<CommsHealth>): void;
  addMissionEvent(e: MissionEvent): void;
  addRiskBand(b: RiskBand): void;
  addComment(c: LogComment): void;
  updateComment(logEntryId: number, commentId: string, patch: Partial<LogComment>): void;
  resolveComment(logEntryId: number, commentId: string): void;
  addLog(entry: LogEntry): void;
  setFecLevel(level: 'Low'|'Medium'|'High'): void;
  setFecManualOverride(manual: boolean): void;
  setTelemetryBuffer(ms: number): void;
  scheduleDump(win: { id: string; startTs: number; endTs: number }): void;
  switchActiveLink(which: 'primary'|'backupUHF'): void;
  setTeamRole(role: string, operator: string): void;
  setSubsystemOwner(subsystem: string, owner: string): void;
  setCommsRedundancy(patch: { primary?: Partial<LinkHealth>; backupUHF?: Partial<LinkHealth>; lastValidatedTs?: number }): void;
}

export type MissionContextType = MissionState & MissionActions;

// Helpers
export function solarClassToRScale(cls: string): { r: `R${SeverityLevel}`; severity: SeverityLevel } {
  // NOAA radio blackout (R) scale mapping
  // M1≈R1, M5≈R2, X1≈R3, X10≈R4, X20≈R5. C-class and below treated as R1 (operationally minimal).
  const c = (cls || "").trim().toUpperCase();
  const letter = c[0] || "";
  const mag = parseFloat(c.slice(1)) || 0;
  let sev: SeverityLevel = 1;
  if (letter === "X") {
    if (mag >= 20) sev = 5; // R5
    else if (mag >= 10) sev = 4; // R4
    else sev = 3; // R3 for X1–X9.9
  } else if (letter === "M") {
    if (mag >= 5) sev = 2; // R2
    else sev = 1; // R1 for M1–M4.9
  } else {
    // C, B, A -> R1 for messaging uniformity
    sev = 1;
  }
  return { r: `R${sev}` as const, severity: sev };
}

// Alias utility required by spec: returns numeric R-scale (1..5) from flare class
export function mapFlareToRScale(flareClass: string): number {
  const { severity } = solarClassToRScale(flareClass);
  return severity;
}

// Convenience: compute the currently active solar flare R-level from mission hazards
export function activeRLevelFromHazards(hazards: HazardEvent[], nowTs = Date.now()): { r: `R${SeverityLevel}`; severity: SeverityLevel; cls?: string; ar?: string; window?: { startTs: number; endTs: number } } | null {
  const active = hazards.find(h => h.kind === 'solar-flare' && nowTs >= h.startTs && nowTs <= (h.endTs ?? nowTs));
  if (!active) return null;
  const cls = (active.details?.class as string) || '';
  const ar = (active.details?.sourceRegion as string) || undefined;
  const { r, severity } = solarClassToRScale(cls);
  return { r, severity, cls, ar, window: { startTs: active.startTs, endTs: active.endTs ?? active.startTs } };
}

export function combinedRiskIndex(hazards: HazardEvent[]): number {
  // Simple aggregator: weighted by severity and recency window (last 6h)
  if (!hazards.length) return 0;
  const now = Date.now();
  const sixHours = 6 * 3600_000;
  const score = hazards.reduce((acc, h) => {
    const age = Math.max(0, now - h.startTs);
    const w = Math.max(0.3, 1 - age / sixHours); // decay to 0.3 after 6h
    return acc + h.severity * w;
  }, 0);
  // Normalize to 0-100 (max 5 * n with w<=1)
  const max = hazards.length * 5;
  return Math.round((score / max) * 100);
}

// Decision log shared shape
export interface LogEntry {
  id: number;
  timestamp: string; // ISO or formatted time
  type: string; // e.g., "SIM_TOGGLE", "HAZARD_INJECTED", "COMMS_ALERT"
  data: Record<string, any>;
  // Optional analytics/audit metadata
  subsystem?: string; // e.g., 'comms', 'propulsion', 'nav'
  inputs?: Record<string, any>; // input parameters
  modelVersion?: string; // ML model version
  durationMs?: number; // analysis duration
  fallbackReason?: string; // if fallback used
  severity?: 'info' | 'warning' | 'critical';
  actionRequired?: boolean; // flag for critical attention
  permalink?: string; // stable link/id for navigation
  operatorId?: string;
  riskFactors?: string[];
  verifiedBy?: string;
  systemSnapshot?: Record<string, any>;
}

// Comms degradation thresholds (TODO: tune thresholds)
export const COMMS_THRESHOLDS = {
  latencyMs: 500,
  packetLossPct: 5,
};

// AI Analysis Types for Groq Integration
export interface AIRiskAssessment {
  overallRisk: number; // 0-100
  confidence: number; // 0-100
  riskFactors: string[];
}

export interface AIImmediateAction {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
  confidence: number; // 0-100
}

export interface AISecondaryEffects {
  trajectory: string;
  communications: string;
  power: string;
  thermal: string;
}

export interface AIRecommendation {
  category: string;
  description: string;
  confidence: number; // 0-100
  timeline: string;
}

export interface AIAnalysisResult {
  riskAssessment: AIRiskAssessment;
  immediateActions: AIImmediateAction[];
  secondaryEffects: AISecondaryEffects;
  recommendations: AIRecommendation[];
  reasoning: string;
}

export interface AnalysisRequest {
  hazard: HazardEvent;
  missionState: Partial<MissionState>;
  requestId: string;
  timestamp: number;
}

export interface StreamingAnalysisState {
  isStreaming: boolean;
  currentChunk: string;
  partialResult: Partial<AIAnalysisResult>;
  error: string | null;
  requestId: string | null;
}

export type AIAnalysisType = 
  | 'solar-flare'
  | 'engine-failure' 
  | 'comms-degradation'
  | 'trajectory-deviation'
  | 'general-hazard';

export interface AIAnalysisContext {
  analysisType: AIAnalysisType;
  missionPhase: 'launch' | 'cruise' | 'lunar-orbit' | 'surface' | 'return';
  timeToNextBurn?: number;
  criticalSystemsStatus: Record<string, 'nominal' | 'degraded' | 'offline'>;
  consumablesStatus: Record<string, number>; // percentages
}
