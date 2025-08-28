import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Zap } from "lucide-react";

interface HazardInputPanelProps {
  onAnalysis: (hazard: string) => void;
  isAnalyzing: boolean;
  analysisComplete: boolean;
}

export default function HazardInputPanel({ onAnalysis, isAnalyzing, analysisComplete }: HazardInputPanelProps) {
  const [selectedHazard, setSelectedHazard] = useState("");
  const [customHazard, setCustomHazard] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch live space hazard data from NASA APIs
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

  // Create dynamic hazard options based on real NASA data
  const getHazardOptions = () => {
    const baseOptions = [
      { value: "engine-failure", label: "⚡ Engine Failure - Propulsion malfunction" },
      { value: "communication-loss", label: "📡 Communication Loss - Signal disruption" },
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
      baseOptions.unshift({
        value: "solar-flare",
        label: "☀️ Solar Flare - High radiation event"
      });
    }

    // Add live asteroid alerts if detected
    if (Array.isArray(asteroids) && asteroids.length > 0) {
      const hazardousAsteroid = asteroids.find((a: any) => a.is_potentially_hazardous_asteroid);
      if (hazardousAsteroid) {
        baseOptions.splice(1, 0, {
          value: "live-asteroid",
          label: `🛰️ LIVE: ${hazardousAsteroid.name} - Hazardous approach`
        });
      }
    }

    if (!baseOptions.find(opt => opt.value.includes('asteroid') || opt.value.includes('debris'))) {
      baseOptions.splice(1, 0, {
        value: "space-debris",
        label: "🛰️ Space Debris - Orbital collision risk"
      });
    }

    return baseOptions;
  };

  const handleHazardChange = (value: string) => {
    setSelectedHazard(value);
    setShowCustomInput(value === "custom");
  };

  const handleRunAnalysis = () => {
    const hazardToAnalyze = selectedHazard === "custom" ? customHazard : selectedHazard;
    if (hazardToAnalyze) {
      onAnalysis(hazardToAnalyze);
    }
  };

  return (
    <motion.div 
      className="glass-panel rounded-lg p-6 border border-border/50 hover:border-primary/50 transition-all duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center"
          animate={{ rotate: isAnalyzing ? 360 : 0 }}
          transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
        >
          <span className="text-sm">⚠️</span>
        </motion.div>
        <h2 className="text-xl font-semibold text-primary neon-text">Mission Hazard Assessment</h2>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Hazard Type
          </Label>
          <Select value={selectedHazard} onValueChange={handleHazardChange} data-testid="select-hazard">
            <SelectTrigger className="w-full glass-panel border border-border/50 bg-background/50 text-foreground font-mono focus:border-primary focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Choose hazard scenario..." />
            </SelectTrigger>
            <SelectContent className="glass-panel border border-border/50">
              {getHazardOptions().map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className={`font-mono hover:bg-primary/10 ${
                    option.value.startsWith('live-') ? 'text-red-400 font-semibold' : ''
                  }`}
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
        </div>
        
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
            disabled={!selectedHazard || isAnalyzing || (selectedHazard === "custom" && !customHazard)}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg neon-glow hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 flex items-center justify-center space-x-2 group"
            data-testid="button-run-odin"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : analysisComplete ? (
              <span>🚀 Analysis Complete</span>
            ) : (
              <span>🚀 Run ODIN Analysis</span>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
