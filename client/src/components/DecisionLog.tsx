import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMission } from "@/context/MissionContext";
import { MessageSquarePlus, CheckCircle2, AlertTriangle, Link as LinkIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrilldownModal, useDrilldown } from "@/components/DrilldownModals";

interface DecisionLogProps {
  isAnalyzing: boolean;
  analysisComplete: boolean;
  hazardType: string;
}

import type { LogEntry } from "@/types/odin";
import { activeRLevelFromHazards } from "@/types/odin";

export default function DecisionLog({ isAnalyzing, analysisComplete, hazardType }: DecisionLogProps) {
  const { logEntries = [], addLog, hazards } = useMission();
  const [currentEntry, setCurrentEntry] = useState<LogEntry | null>(null);
  const { commentsByLogId, addComment, resolveComment } = useMission();
  const drill = useDrilldown();
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all"|"info"|"warning"|"critical">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyActions, setOnlyActions] = useState(false);
  const [onlyAutomated, setOnlyAutomated] = useState(false);

  // Fetch live NASA data for enhanced decision logs
  const { data: solarFlares = [] } = useQuery({
    queryKey: ['/api/solar-flares'],
    refetchInterval: 300000,
    retry: 2
  });

  const { data: asteroids = [] } = useQuery({
    queryKey: ['/api/near-earth-objects'],
    refetchInterval: 3600000,
    retry: 2
  });

  useEffect(() => {
    if (isAnalyzing) {
      // Add initial entry
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const entry: LogEntry = {
        id: Date.now(),
        timestamp,
        type: "ANALYSIS_START",
        data: {
          status: "initializing",
          hazard_detected: (hazardType || "unknown").replace('-', '_'),
          systems: ["navigation", "trajectory", "risk_assessment"]
        }
      };
      addLog(entry);
    } else if (analysisComplete && hazardType) {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const rInfo = activeRLevelFromHazards(hazards);
      const hazardData = {
        "solar-flare": {
          hazard_type: "solar_flare",
          severity: 8.2,
          radiation_level: "extreme",
          impact: "crew_safety_risk",
          recommended_action: "trajectory_adjustment",
          delay_hours: 6,
          fuel_cost: "minimal"
        },
        "space-debris": {
          hazard_type: "space_debris",
          severity: 7.5,
          object_count: 42,
          collision_probability: 0.23,
          impact: "hull_damage_risk",
          recommended_action: "avoidance_maneuver",
          delay_hours: 3,
          fuel_cost: "moderate"
        },
        "engine-failure": {
          hazard_type: "engine_failure",
          severity: 9.1,
          affected_systems: ["primary_thrust", "attitude_control"],
          backup_available: true,
          impact: "mission_critical",
          recommended_action: "emergency_protocol",
          delay_hours: 12,
          fuel_cost: "high"
        }
      };

      let logData: any;
      if (hazardType && hazardData[hazardType as keyof typeof hazardData]) {
        logData = hazardData[hazardType as keyof typeof hazardData];
      } else {
        // Rule-based defaults and notice
        logData = {
          hazard_type: hazardType || "custom",
          severity: hazardType?.includes("solar") ? 6.0 : 4.0, // TODO: refine mapping
          impact: hazardType?.includes("comms") ? "comms_disruption" : "mission_delay",
          recommended_action: hazardType?.includes("solar") ? "comms_fallback" : "avoidance_maneuver",
          delay_hours: 2,
          fuel_cost: "low",
          notice: "Using rule-based defaults due to analysis timeout.",
        };
      }
    const completionEntry: LogEntry = {
        id: Date.now(),
        timestamp,
        type: "HAZARD_ANALYSIS",
        data: {
          ...logData,
          source_region: rInfo?.ar || 'Unknown',
          r_level: rInfo?.r || 'R1',
      correlationId: String(Date.now()),
        },
      };
      addLog(completionEntry);
    }
  }, [isAnalyzing, analysisComplete, hazardType]);

  useEffect(() => {
    if (currentEntry) {
      addLog(currentEntry);
      setCurrentEntry(null);
    }
  }, [currentEntry]);

  const formatLogEntry = (entry: LogEntry) => {
    const lines = [];
    lines.push(`[${entry.timestamp}] ${entry.type}`);
    
    Object.entries(entry.data).forEach(([key, value]) => {
      const formattedValue = typeof value === 'string' 
        ? `"${value}"` 
        : Array.isArray(value) 
          ? `[${value.map(v => `"${v}"`).join(', ')}]`
          : value;
      lines.push(`"${key}": ${formattedValue}`);
    });
    
    return lines;
  };

  // Listen for timeline click-to-scroll events
  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.logId;
      if (!id) return;
      const el = containerRef.current?.querySelector(`[data-log-id="${id}"]`);
      if (el && containerRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        (el as HTMLElement).classList.add("ring-2", "ring-primary");
        setTimeout(() => (el as HTMLElement).classList.remove("ring-2", "ring-primary"), 1200);
      }
    };
    window.addEventListener("odin-scroll-to-log", handler as any);
    return () => window.removeEventListener("odin-scroll-to-log", handler as any);
  }, []);

  // Hash-based deep-link support (#log-<id>)
  useEffect(() => {
    const seekFromHash = () => {
      const hash = window.location.hash || "";
      const m = hash.match(/#log-(\d+)/);
      if (!m) return;
      const id = Number(m[1]);
      const ev = new CustomEvent('odin-scroll-to-log', { detail: { logId: id } });
      window.dispatchEvent(ev);
    };
    // on mount and on hash change
    seekFromHash();
    window.addEventListener('hashchange', seekFromHash);
    return () => window.removeEventListener('hashchange', seekFromHash);
  }, []);

  const allTypes = useMemo(() => {
    const s = new Set<string>();
    (logEntries||[]).forEach((e) => s.add(e.type));
    return ["all", ...Array.from(s)];
  }, [logEntries]);

  const filtered = useMemo(() => {
    return (logEntries||[]).filter((e) => {
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (onlyActions && !e.actionRequired) return false;
      if (onlyAutomated && e.data?.automated !== true) return false;
      if (!search) return true;
      const hay = `${e.type} ${e.timestamp} ${JSON.stringify(e.data||{})}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [logEntries, severityFilter, typeFilter, search, onlyActions]);

  function copyPermalink(id: number, permalink?: string) {
    const hash = permalink && permalink.startsWith('#') ? permalink : `#log-${id}`;
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard?.writeText(url).catch(() => {/* noop */});
    // also update hash to enable immediate deep link
    window.location.hash = hash;
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* Feather file-text icon (lightweight line icon) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EA8E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>

        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#CFEFE2' }}>Decision Log</h2>
      </div>

      {/* Filters / Search */}
  <div className="mb-2 grid grid-cols-3 gap-2 items-end">
        <label className="text-[11px] text-muted-foreground">
          <span className="block mb-1">Search</span>
          <input
            aria-label="Search logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 rounded border border-border/40 bg-transparent text-xs"
            placeholder="type, field, value…"
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          <span className="block mb-1">Severity</span>
          <select aria-label="Filter by severity" value={severityFilter} onChange={(e)=>setSeverityFilter(e.target.value as any)} className="w-full px-2 py-1 rounded border border-border/40 bg-transparent text-xs">
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="text-[11px] text-muted-foreground">
          <span className="block mb-1">Type</span>
          <select aria-label="Filter by type" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} className="w-full px-2 py-1 rounded border border-border/40 bg-transparent text-xs">
            {allTypes.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
        </label>
      </div>
      <div className="mb-2 text-[11px] text-muted-foreground flex items-center gap-2">
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" checked={onlyActions} onChange={(e)=>setOnlyActions(e.target.checked)} />
          <span>Action Required only</span>
        </label>
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" checked={onlyAutomated} onChange={(e)=>setOnlyAutomated(e.target.checked)} />
          <span>Automated only</span>
        </label>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
        <div className="inline-flex items-center gap-1"><Filter size={12} /> Showing <span className="font-mono text-foreground">{filtered.length}</span> of <span className="font-mono text-foreground">{logEntries.length}</span></div>
        <button className="underline decoration-dotted underline-offset-2" onClick={()=>{ setSearch(""); setSeverityFilter("all"); setTypeFilter("all"); }}>Reset</button>
      </div>

      <div ref={containerRef} style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 6 }} data-testid="decision-log-container">
        <div style={{ color: '#9FD6A8', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: '#7CFF7C' }}>{'>'}</span> {isAnalyzing ? 'Running analysis...' : (logEntries.length ? 'Ready' : 'No hazards detected; monitoring sensors.')}
        </div>

        <AnimatePresence>
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id + '-' + i}
              style={{ padding: '8px 0', lineHeight: 1.45 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
        data-testid={`log-entry-${entry.id}`}
        data-log-id={entry.id}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontWeight: 600, color: '#CFEFE2', fontSize: 13 }}>
                  {`[${entry.timestamp}] ${entry.type}`}
                  {entry.severity && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded align-middle ${entry.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : entry.severity==='warning' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                      <span className="inline-flex items-center gap-1">{entry.severity === 'critical' ? <AlertTriangle size={10}/> : null}{entry.severity}</span>
                    </span>
                  )}
                  {entry.data?.automated ? (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded align-middle bg-blue-500/20 text-blue-300 border border-blue-500/40">Automated</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Copy permalink"
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 hover:bg-white/5 inline-flex items-center gap-1"
                    onClick={() => copyPermalink(entry.id, entry.permalink)}
                    title="Copy link"
                  >
                    <LinkIcon size={12}/> Link
                  </button>
      <button
                    aria-label="Add comment"
                    className="text-xs px-2 py-1 rounded border border-border/50 hover:bg-white/5 flex items-center gap-1"
                    onClick={() =>
                      addComment({
                        id: Math.random().toString(36).slice(2),
                        logEntryId: entry.id,
                        author: "Operator",
        text: "Review needed",
                        createdAt: Date.now(),
                        status: "open",
                      })
                    }
                  >
                    <MessageSquarePlus size={14} />
                    Comment
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#DDEDE0' }}>
                {Object.entries(entry.data).map(([key, value], idx) => (
                  <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 120, color: '#9FD6A8', fontFamily: 'monospace', fontSize: 12 }}>{key}</div>
                    <div style={{ color: '#FFDDA8', fontSize: 13 }}>
                      {key === 'severity' ? (
                        <button className="underline decoration-dotted underline-offset-4" onClick={drill.showSeverity}>
                          {String(value)}
                        </button>
                      ) : Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Comments list */}
              {commentsByLogId[entry.id]?.length ? (
                <div className="mt-2 space-y-1">
                  {commentsByLogId[entry.id].map((c) => (
                    <div key={c.id} className="text-xs border border-border/40 rounded px-2 py-1 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium">{c.author}:</span> {c.text}
                        <span className="ml-2 text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {c.status === 'open' ? (
                        <button className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 hover:bg-white/5" onClick={() => resolveComment(entry.id, c.id)}>
                          <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> Resolve</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400">Resolved</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
    </motion.div>
          ))}
        </AnimatePresence>
      </div>
  <DrilldownModal open={drill.open} onClose={drill.hide} />
    </div>
  );
}
