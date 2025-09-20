import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import MoonWidget from "./MoonWidget";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Zap, Brain, Wifi, WifiOff } from "lucide-react";
import { useInferenceStream } from "@/hooks/useInferenceStream";
import { ModelStatusBadge } from "@/components/ModelStatusBadge";
import { useMission } from "@/context/MissionContext";
import { useApiClient } from "@/lib/apiClient";
import { useMoonSummary } from "@/hooks/useMoonSummary";
import { useGroqAnalysisContext } from "@/context/GroqAnalysisContext";
import { useToast } from "@/hooks/use-toast";
import type { HazardEvent, HazardKind, SeverityLevel } from "@/types/odin";

interface HazardInputPanelProps {
  onAnalysis: (hazard: string) => void;
  isAnalyzing: boolean;
  analysisComplete: boolean;
}

export default function HazardInputPanel({ onAnalysis, isAnalyzing, analysisComplete }: HazardInputPanelProps) {
  const { addLog, addHazard } = useMission();
  const { request } = useApiClient();
  const { toast } = useToast();
  const {
    analyzeHazard,
    analyzeHazardStream,
    isAnalyzing: groqAnalyzing,
    apiStatus,
    checkApiStatus,
  } = useGroqAnalysisContext();

  // Create dynamic hazard options based on real NASA data
  const { data: solarFlares = [] } = useQuery({
    queryKey: ['/api/solar-flares'],
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: 2
  });

  const { data: asteroids = [] } = useQuery({
    queryKey: ['/api/near-earth-objects'],
    refetchInterval: 3600000, // Refresh every hour
    retry: 2
  });

  // Memoize hazard options to prevent recreation on every render
  const hazardOptions = useMemo(() => {
    const baseOptions = [
      { value: "engine-failure", label: "⚡ Engine Failure - Propulsion malfunction" },
      { value: "communication-loss", label: "📡 Communication Loss - Signal disruption" },
      { value: "space-debris", label: "🛰️ Space Debris - Orbital collision risk" },
      { value: "radiation-burst", label: "☢️ Radiation Burst - High energy event" },
      { value: "custom", label: "🔧 Custom Scenario" },
    ];

    // Add live solar flare alerts if detected
    if (Array.isArray(solarFlares) && solarFlares.length > 0) {
      const latestFlare = solarFlares[0] as any;
      baseOptions.unshift({
        value: "live-solar-flare",
        label: `🌞 LIVE: ${latestFlare.classType} Solar Flare - ${latestFlare.sourceLocation}`
      });
    } else {
      // Add default solar flare option
      baseOptions.unshift({
        value: "solar-flare",
        label: "🌞 Solar Flare - Space weather event"
      });
    }

    return baseOptions;
  }, [solarFlares, asteroids]);

  const defaultHazard = hazardOptions[0]?.value || "solar-flare";
  const [selectedHazard, setSelectedHazard] = useState(defaultHazard);
  const [customHazard, setCustomHazard] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [useGroqAnalysis, setUseGroqAnalysis] = useState(true);
  const [streamAnalysis, setStreamAnalysis] = useState(true);
  
  const { data: moonSummary, isLoading: moonLoading, error: moonErr } = useMoonSummary();
  const moonError = moonErr ? 'Failed to load moon data' : null;

  useEffect(() => {
    const validValues = hazardOptions.map(opt => opt.value);
    if (!validValues.includes(selectedHazard)) {
      setSelectedHazard(defaultHazard);
    }
  }, [hazardOptions, selectedHazard, defaultHazard]);

  const handleHazardChange = (value: string) => {
    // Only allow valid hazard values
    const validValues = hazardOptions.map(opt => opt.value);
    if (validValues.includes(value)) {
      setSelectedHazard(value);
      setShowCustomInput(value === "custom");
    } else {
      setSelectedHazard(defaultHazard);
      setShowCustomInput(false);
    }
  };

  const createHazardEvent = (hazardType: string): HazardEvent => {
    const hazardMap: Record<string, { kind: HazardKind; severity: SeverityLevel; label: string; details?: any }> = {
      "solar-flare": {
        kind: "solar-flare",
        severity: 4,
        label: "M1.0 Solar Flare",
        details: { class: "M1.0", sourceRegion: "AR3751", magneticField: "Beta-Gamma" }
      },
      "live-solar-flare": {
        kind: "solar-flare",
        severity: 5,
        label: "LIVE Solar Flare Event",
        details: { class: "X1.0", sourceRegion: "LIVE", magneticField: "Beta-Gamma-Delta" }
      },
      "engine-failure": {
        kind: "engine-failure",
        severity: 5,
        label: "Primary Engine Malfunction",
        details: { engine: "primary", failureMode: "nozzle_obstruction", fuelPressure: "nominal" }
      },
      "communication-loss": {
        kind: "communication-loss",
        severity: 3,
        label: "DSN Communication Degradation",
        details: { station: "DSS-43", signalStrength: "-120dBm", packetLoss: "15%" }
      },
      "space-debris": {
        kind: "space-debris",
        severity: 4,
        label: "Orbital Debris Conjunction",
        details: { objectSize: "10cm", closestApproach: "50m", timeToCA: "14min" }
      },
      "radiation-burst": {
        kind: "radiation-burst",
        severity: 4,
        label: "Solar Energetic Particle Event",
        details: { fluxLevel: "S2", duration: "6hrs", shielding: "partial" }
      },
      "custom": {
        kind: "custom",
        severity: 3,
        label: customHazard || "Custom Hazard Scenario",
        details: { description: customHazard }
      }
    };

    const config = hazardMap[hazardType] || hazardMap["custom"];
    
    return {
      id: `hazard-${Date.now()}`,
      kind: config.kind,
      label: config.label,
      severity: config.severity,
      startTs: Date.now(),
      endTs: Date.now() + (2 * 60 * 60 * 1000), // 2 hours duration
      details: config.details,
      recommendedAction: useGroqAnalysis ? "AI analysis pending..." : "Manual analysis required"
    };
  };

  const handleRunAnalysis = async () => {
    const hazardToAnalyze = selectedHazard === "custom" ? customHazard : selectedHazard;
    if (!hazardToAnalyze) return;

    // Create hazard event
    const hazardEvent = createHazardEvent(selectedHazard);
    
    // Add to mission state
    addHazard(hazardEvent);
    
    // Log the analysis request
    const logId = Date.now();
    addLog({ 
      id: logId, 
      timestamp: new Date().toISOString().replace('T',' ').substring(0,19), 
      type: useGroqAnalysis ? 'GROQ_ANALYSIS_REQUEST' : 'LEGACY_ANALYSIS_REQUEST', 
      data: { 
        hazard: hazardToAnalyze, 
        hazardId: hazardEvent.id,
        model: useGroqAnalysis ? 'groq-llama-3.3-70b' : 'legacy-ml-v0.9.0',
        streaming: streamAnalysis
      }, 
      inputs: { hazard: hazardToAnalyze }, 
      subsystem: 'analysis', 
      modelVersion: useGroqAnalysis ? 'groq-v1.0.0' : 'odin-ml-v0.9.0', 
      permalink: `#log-${logId}`,
      severity: 'info'
    });

    if (useGroqAnalysis) {
      try {
        let result;
        if (streamAnalysis) {
          result = await analyzeHazardStream(
            hazardEvent,
            (chunk, partial) => {
              // Progress updates handled by StreamingAnalysisDisplay
              console.log('Streaming chunk:', chunk);
            }
          );
        } else {
          result = await analyzeHazard(hazardEvent);
        }

        // Log successful analysis
        addLog({
          id: Date.now(),
          timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
          type: 'GROQ_ANALYSIS_COMPLETE',
          data: {
            hazardId: hazardEvent.id,
            riskLevel: result.riskAssessment.overallRisk,
            confidence: result.riskAssessment.confidence,
            actionsCount: result.immediateActions.length,
            recommendationsCount: result.recommendations.length
          },
          subsystem: 'analysis',
          severity: result.riskAssessment.overallRisk >= 70 ? 'critical' : 'info',
          permalink: `#analysis-${hazardEvent.id}`
        });

        toast({
          title: "AI Analysis Complete",
          description: `Risk: ${result.riskAssessment.overallRisk}% | Confidence: ${result.riskAssessment.confidence}%`,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        addLog({
          id: Date.now(),
          timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
          type: 'GROQ_ANALYSIS_ERROR',
          data: {
            hazardId: hazardEvent.id,
            error: errorMessage,
            fallbackUsed: true
          },
          subsystem: 'analysis',
          severity: 'warning',
          fallbackReason: errorMessage
        });

        toast({
          title: "Analysis Error", 
          description: `AI analysis failed: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } else {
      // Legacy analysis path
      onAnalysis(hazardToAnalyze);
      setJobId(`${hazardToAnalyze}-${Date.now()}`);
    }
  };

  // Legacy inference streaming (kept for fallback)
  const [jobId, setJobId] = useState<string | null>(null);
  const { status, stageETAs } = useInferenceStream(jobId);
  const [fallbackStages, setFallbackStages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Object.entries(stageETAs).forEach(([stage, eta]) => {
      if (eta !== undefined && eta <= 0 && !fallbackStages[stage]) {
        setFallbackStages((m) => ({ ...m, [stage]: true }));
        const id = Date.now();
        addLog({ 
          id, 
          timestamp: new Date().toISOString().replace('T',' ').substring(0,19), 
          type: 'INFER_FALLBACK', 
          data: { stage, reason: 'Stage timeout' }, 
          subsystem: stage, 
          fallbackReason: 'timeout', 
          severity: 'warning', 
          actionRequired: false, 
          permalink: `#log-${id}` 
        });
      }
    });
  }, [stageETAs, fallbackStages, addLog]);

  const combinedAnalyzing = isAnalyzing || groqAnalyzing;

  return (
    <motion.div 
      className="glass-panel rounded-lg p-6 border border-border/50 hover:border-primary/50 transition-all duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center"
          animate={{ rotate: combinedAnalyzing ? 360 : 0 }}
          transition={{ duration: 2, repeat: combinedAnalyzing ? Infinity : 0, ease: "linear" }}
        >
          {useGroqAnalysis ? <Brain className="w-4 h-4" /> : <span className="text-sm">⚠️</span>}
        </motion.div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-primary neon-text">
            {useGroqAnalysis ? 'AI-Powered Hazard Analysis' : 'Mission Hazard Assessment'}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkApiStatus}
          disabled={combinedAnalyzing}
          className="flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          Test AI
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* AI Analysis Options */}
        <div className="border border-border/50 rounded-lg p-3 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Analysis Engine
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useGroqAnalysis}
                onChange={(e) => setUseGroqAnalysis(e.target.checked)}
                className="rounded"
              />
              Use Groq AI Analysis (real-time inference)
            </label>
            {useGroqAnalysis && (
              <label className="flex items-center gap-2 text-sm ml-6">
                <input
                  type="checkbox"
                  checked={streamAnalysis}
                  onChange={(e) => setStreamAnalysis(e.target.checked)}
                  className="rounded"
                />
                Enable streaming updates
              </label>
            )}
          </div>
        </div>

        {/* Analysis status / timers */}
        {!useGroqAnalysis && (
          <div className="rounded border border-border/50 p-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Legacy Analysis</div>
              <ModelStatusBadge status={status} etas={stageETAs} />
            </div>
            {!!Object.keys(stageETAs).length && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {Object.entries(stageETAs).map(([stage, eta]) => (
                  <div key={stage} className="flex items-center justify-between bg-background/40 rounded px-2 py-1">
                    <span className="font-mono">{stage}</span>
                    <span>{Math.max(0, Math.round(eta))}s</span>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(fallbackStages).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(fallbackStages).filter(([,v])=>v).map(([stage]) => (
                  <span key={stage} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-yellow-400/60 text-yellow-300" role="status" aria-live="polite">Fallback applied to {stage}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Moon widget */}
        <div className="mb-2">
          <MoonWidget loading={moonLoading} error={moonError} phase={moonSummary?.phase} illumination={moonSummary?.illumination} distance_km={moonSummary?.distance_km} />
        </div>
        
        <fieldset className="relative border-0 p-0 m-0">
          <legend className="block text-sm font-medium text-muted-foreground mb-2">Hazard Type</legend>
          <Label htmlFor="hazard-select" className="sr-only">Select Hazard Type</Label>
          <Select value={selectedHazard} onValueChange={handleHazardChange} data-testid="select-hazard">
            <SelectTrigger id="hazard-select" aria-describedby="hazard-help" className="w-full glass-panel border border-border/50 bg-background/50 text-foreground font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <SelectValue placeholder="Choose hazard scenario..." />
            </SelectTrigger>
            <SelectContent className="glass-panel border border-border/50">
              {hazardOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={`font-mono hover:bg-primary/10 ${option.value.startsWith('live-') ? 'text-red-400 font-semibold' : ''}`}
                  data-testid={`option-${option.value}`}
                >
                  <div className="flex items-center space-x-2">
                    {option.value.startsWith('live-') && (
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-red-500 rounded-full"
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="hazard-help" className="sr-only">Choose a hazard type to analyze. Live items indicate active alerts.</p>
        </fieldset>
        
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Label className="block text-sm font-medium text-muted-foreground mb-2">
              Custom Hazard Description
            </Label>
            <Textarea 
              className="w-full glass-panel border border-border/50 bg-background/50 text-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20" 
              rows={3} 
              placeholder="Describe the custom hazard scenario..."
              value={customHazard}
              onChange={(e) => setCustomHazard(e.target.value)}
              data-testid="input-custom-hazard"
            />
          </motion.div>
        )}
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={handleRunAnalysis}
            disabled={!selectedHazard || combinedAnalyzing || (selectedHazard === "custom" && !customHazard)}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg neon-glow hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 flex items-center justify-center space-x-2 group"
            data-testid="button-run-odin"
          >
            {combinedAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{useGroqAnalysis ? 'AI Analyzing...' : 'Analyzing...'}</span>
              </>
            ) : analysisComplete ? (
              <span>🚀 Analysis Complete</span>
            ) : (
              <>
                {useGroqAnalysis ? <Brain className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                <span>🚀 {useGroqAnalysis ? 'Run AI Analysis' : 'Run ODIN Analysis'}</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
