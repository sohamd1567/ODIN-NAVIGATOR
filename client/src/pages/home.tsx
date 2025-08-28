import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import HazardInputPanel from "@/components/HazardInputPanel";
import TrajectoryVisualization from "@/components/TrajectoryVisualization";
import DecisionLog from "@/components/DecisionLog";
import CrewSummary from "@/components/CrewSummary";
import MoonPhaseWidget from "@/components/MoonPhaseWidget";
import { useState } from "react";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState("");

  const handleAnalysis = (hazard: string) => {
    setSelectedHazard(hazard);
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen cosmic-bg text-foreground font-sans overflow-x-hidden">
      <StarField />
      
      {/* Navigation */}
      <motion.nav 
        className="relative z-10 p-4 glass-panel border-b border-border/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary neon-glow flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-xl font-bold text-primary-foreground">🪐</span>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-primary neon-text" data-testid="title-odin">ODIN</h1>
              <div className="relative">
                <p className="text-sm text-muted-foreground">Optimal Dynamic Interplanetary Navigator</p>
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <MoonPhaseWidget />
            <div className="px-3 py-1 glass-panel rounded-full text-sm text-muted-foreground">
              Mission Status: <span className="text-primary font-mono" data-testid="status-active">ACTIVE</span>
            </div>
            <motion.div 
              className="w-3 h-3 rounded-full bg-primary"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.nav>

      {/* Main Dashboard */}
      <main className="relative z-10 max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <HazardInputPanel 
            onAnalysis={handleAnalysis}
            isAnalyzing={isAnalyzing}
            analysisComplete={analysisComplete}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TrajectoryVisualization 
            showTrajectory={analysisComplete}
            isAnimating={isAnalyzing}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <DecisionLog 
            isAnalyzing={isAnalyzing}
            analysisComplete={analysisComplete}
            hazardType={selectedHazard}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <CrewSummary 
            analysisComplete={analysisComplete}
            hazardType={selectedHazard}
          />
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 mt-12 p-6 glass-panel border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p className="font-mono text-sm">
            ODIN v2.1.0 | Mission Control Interface | 
            <span className="text-primary"> Earth-Moon Transit Authority</span>
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
