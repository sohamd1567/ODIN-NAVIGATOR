import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import MoonWidget from "./MoonWidget";
import { useQuery } from "@tanstack/react-query";
import { useMoonSummary } from "@/hooks/useMoonSummary";

interface CrewSummaryProps {
  analysisComplete: boolean;
  hazardType: string;
}

interface SummaryData {
  emoji: string;
  title: string;
  description: string;
  stats: { icon: string; text: string; color: string }[];
}

export default function CrewSummary({ analysisComplete, hazardType }: CrewSummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const { data: moonSummary, isLoading: moonLoading, error: moonErr } = useMoonSummary();
  const moonError = moonErr ? 'Failed to load moon data' : null;

  // Fetch live NASA data for enhanced crew summaries
  const { data: solarFlares = [] } = useQuery({
    queryKey: ['/api/solar-flares'],
    refetchInterval: 300000,
    retry: 2
  });

  const { data: moonData } = useQuery({
    queryKey: ['/api/moon-data'],
    refetchInterval: 3600000,
    retry: 2
  });

  const summaryContent: Record<string, SummaryData> = {
    "solar-flare": {
      emoji: "🌞",
      title: "Solar Storm Detected",
      description: "A major solar flare is approaching our path. ODIN recommends taking the scenic route around the radiation zone. We'll arrive 6 hours later, but everyone stays healthy! ✅",
      stats: [
        { icon: "⏱️", text: "+6 hours", color: "text-secondary" },
        { icon: "✅", text: "Safe passage", color: "text-green-400" },
        { icon: "🔋", text: "Fuel: Nominal", color: "text-primary" }
      ]
    },
    "space-debris": {
      emoji: "🛰️",
      title: "Space Debris Field Detected",
      description: "Multiple objects detected in our flight path. ODIN has calculated a safe detour that avoids all collision risks. Minor course correction with minimal fuel impact! 🛡️",
      stats: [
        { icon: "⏱️", text: "+3 hours", color: "text-secondary" },
        { icon: "🛡️", text: "Collision avoided", color: "text-green-400" },
        { icon: "🔋", text: "Fuel: Acceptable", color: "text-yellow-400" }
      ]
    },
    "engine-failure": {
      emoji: "⚡",
      title: "Engine Anomaly Detected",
      description: "Primary thruster showing irregularities. ODIN has activated backup systems and plotted an emergency-safe trajectory. Mission continues with extended timeline for maximum safety! 🔧",
      stats: [
        { icon: "⏱️", text: "+12 hours", color: "text-secondary" },
        { icon: "🔧", text: "Backup active", color: "text-yellow-400" },
        { icon: "🔋", text: "Fuel: Reserve", color: "text-red-400" }
      ]
    },
    "communication-loss": {
      emoji: "📡",
      title: "Communication Disruption",
      description: "Temporary signal interference detected. ODIN has switched to redundant communication arrays and adjusted trajectory for optimal signal recovery. Stay connected! 📡",
      stats: [
        { icon: "⏱️", text: "+2 hours", color: "text-secondary" },
        { icon: "📡", text: "Signal restored", color: "text-green-400" },
        { icon: "🔋", text: "Fuel: Minimal", color: "text-primary" }
      ]
    }
  };

  useEffect(() => {
    if (analysisComplete && hazardType) {
      const data = summaryContent[hazardType] || {
        emoji: "🔧",
        title: "Custom Hazard Analysis",
        description: "ODIN has analyzed the custom scenario and calculated an optimal response strategy. Adjustments made to ensure mission success with minimal impact! 🎯",
        stats: [
          { icon: "⏱️", text: "+4 hours", color: "text-secondary" },
          { icon: "🎯", text: "Solution found", color: "text-green-400" },
          { icon: "🔋", text: "Fuel: Acceptable", color: "text-primary" }
        ]
      };
      
      setTimeout(() => setSummaryData(data), 1500);
    } else {
      setSummaryData(null);
    }
  }, [analysisComplete, hazardType]);

  // Moon summary is provided by useMoonSummary; no local effect

  return (
    <motion.div 
      className="glass-panel rounded-lg p-6 border border-border/50"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center"
          whileHover={{ rotate: 15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span className="text-sm">👥</span>
        </motion.div>
        <h2 className="text-xl font-semibold text-primary neon-text">Crew-Friendly Summary</h2>
      </div>
      
      <div className="space-y-4" data-testid="crew-summary-container">
        <AnimatePresence mode="wait">
          {!summaryData ? (
            <motion.div 
              key="empty"
              className="text-muted-foreground text-center py-8"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Select a hazard scenario to generate crew summary...
            </motion.div>
          ) : (
            <motion.div 
              key="summary"
              className="space-y-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <motion.div 
                className="flex items-start space-x-3 p-4 glass-panel rounded-lg border border-border/30"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                data-testid="crew-summary-content"
              >
                <motion.span 
                  className="text-2xl flex-shrink-0"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                >
                  {summaryData.emoji}
                </motion.span>
                <div className="flex-1">
                  <div className="mb-2">
                    <MoonWidget loading={moonLoading} error={moonError} phase={moonSummary?.phase} illumination={moonSummary?.illumination} distance_km={moonSummary?.distance_km} />
                  </div>
                  <motion.h3 
                    className="font-semibold text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    data-testid="summary-title"
                  >
                    {summaryData.title}
                  </motion.h3>
                  <motion.p 
                    className="text-muted-foreground mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    data-testid="summary-description"
                  >
                    {summaryData.description}
                  </motion.p>
                  <motion.div 
                    className="flex items-center space-x-4 mt-3 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {summaryData.stats.map((stat, index) => (
                      <motion.span 
                        key={index}
                        className={stat.color}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        data-testid={`summary-stat-${index}`}
                      >
                        {stat.icon} {stat.text}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
