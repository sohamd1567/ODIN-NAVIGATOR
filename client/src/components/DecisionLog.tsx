import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface DecisionLogProps {
  isAnalyzing: boolean;
  analysisComplete: boolean;
  hazardType: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  type: string;
  data: Record<string, any>;
}

export default function DecisionLog({ isAnalyzing, analysisComplete, hazardType }: DecisionLogProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<LogEntry | null>(null);

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
      // Clear previous entries and start new analysis
      setLogEntries([]);
      setCurrentEntry(null);

      // Add initial entry
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const initialEntry: LogEntry = {
        id: 1,
        timestamp,
        type: "ANALYSIS_START",
        data: {
          status: "initializing",
          hazard_detected: hazardType.replace('-', '_'),
          systems: ["navigation", "trajectory", "risk_assessment"]
        }
      };

      setTimeout(() => setCurrentEntry(initialEntry), 500);
    } else if (analysisComplete && hazardType) {
      // Add analysis results
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
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

      const completionEntry: LogEntry = {
        id: 2,
        timestamp,
        type: "HAZARD_ANALYSIS",
        data: hazardData[hazardType as keyof typeof hazardData] || {
          hazard_type: "custom",
          severity: 6.8,
          impact: "mission_adjustment",
          recommended_action: "adaptive_response",
          delay_hours: 4,
          fuel_cost: "acceptable"
        }
      };

      setTimeout(() => {
        setLogEntries(prev => [...prev, completionEntry]);
      }, 1000);
    }
  }, [isAnalyzing, analysisComplete, hazardType]);

  useEffect(() => {
    if (currentEntry) {
      setLogEntries(prev => [...prev, currentEntry]);
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

  return (
    <motion.div 
      className="glass-panel rounded-lg p-6 border border-border/50"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
          animate={{ rotate: isAnalyzing ? 360 : 0 }}
          transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
        >
          <span className="text-sm">📊</span>
        </motion.div>
        <h2 className="text-xl font-semibold text-primary neon-text">Decision Log</h2>
      </div>
      
      <div className="bg-background/30 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto" data-testid="decision-log-container">
        <div className="text-muted-foreground">
          <span className="text-secondary">{'>'}</span> ODIN system initialized...<br />
          <span className="text-secondary">{'>'}</span> {isAnalyzing ? "Running analysis..." : "Awaiting hazard input..."}
        </div>
        
        <AnimatePresence>
          {logEntries.map((entry) => (
            <motion.div 
              key={entry.id}
              className="p-3 glass-panel rounded border border-border/30 mt-4 slide-in-right"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6 }}
              data-testid={`log-entry-${entry.id}`}
            >
              {formatLogEntry(entry).map((line, index) => (
                <motion.div 
                  key={index}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeInOut"
                  }}
                  className={`${index === 0 ? 'text-primary typewriter' : 'text-foreground'} overflow-hidden whitespace-nowrap`}
                >
                  {index === 0 ? (
                    <span>{line}</span>
                  ) : (
                    <span>
                      <span className="text-secondary">"{line.split('"')[1]}":</span>{" "}
                      <span className="text-yellow-400">{line.split(': ')[1]}</span>
                      {index < formatLogEntry(entry).length - 1 && ','}
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
