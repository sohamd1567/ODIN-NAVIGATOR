import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TrajectoryVisualizationProps {
  showTrajectory: boolean;
  isAnimating: boolean;
}

export default function TrajectoryVisualization({ showTrajectory, isAnimating }: TrajectoryVisualizationProps) {
  const [showSpaceship, setShowSpaceship] = useState(false);

  useEffect(() => {
    if (showTrajectory) {
      setTimeout(() => setShowSpaceship(true), 1000);
    } else {
      setShowSpaceship(false);
    }
  }, [showTrajectory]);

  return (
    <motion.div 
      className="glass-panel rounded-lg p-6 border border-border/50"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <motion.div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center"
          animate={{ rotate: isAnimating ? 360 : 0 }}
          transition={{ duration: 2, repeat: isAnimating ? Infinity : 0, ease: "linear" }}
        >
          <span className="text-sm">🗺️</span>
        </motion.div>
        <h2 className="text-xl font-semibold text-primary neon-text">Trajectory Visualization</h2>
      </div>
      
      <div className="relative h-64 bg-background/20 rounded-lg border border-border/30 overflow-hidden" data-testid="trajectory-canvas">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(195, 100%, 50%, 0.1)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: "hsl(195, 100%, 50%)", stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: "hsl(262, 83%, 68%)", stopOpacity: 1}} />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>
          
          {/* Earth */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <circle cx="50" cy="100" r="20" fill="hsl(195, 100%, 50%)" opacity="0.8"/>
            <text x="50" y="140" textAnchor="middle" className="text-xs fill-primary font-mono" data-testid="label-earth">
              🌍 Earth
            </text>
          </motion.g>
          
          {/* Moon */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
          >
            <circle cx="350" cy="80" r="12" fill="hsl(60, 100%, 80%)" opacity="0.8"/>
            <text x="350" y="110" textAnchor="middle" className="text-xs fill-yellow-300 font-mono" data-testid="label-moon">
              🌕 Moon
            </text>
          </motion.g>
          
          {/* Original trajectory */}
          <motion.path 
            d="M 70 100 Q 200 100 330 80" 
            stroke="hsl(215, 16%, 47%)" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="5,5"
            opacity="0.6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            data-testid="path-original"
          />
          
          {/* Adjusted trajectory */}
          {showTrajectory && (
            <motion.path 
              d="M 70 100 Q 200 60 330 80" 
              stroke="url(#pathGradient)" 
              strokeWidth="3" 
              fill="none"
              filter="drop-shadow(0 0 6px hsl(195, 100%, 50%, 0.6))"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              data-testid="path-adjusted"
            />
          )}
          
          {/* Spaceship */}
          {showSpaceship && (
            <motion.g
              initial={{ x: 80, y: 100 }}
              animate={{ 
                x: [80, 200, 320],
                y: [100, 65, 85]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              data-testid="spaceship-icon"
            >
              <text className="text-lg">🚀</text>
            </motion.g>
          )}
          
          {/* Labels */}
          <text x="200" y="130" textAnchor="middle" className="text-xs fill-muted-foreground font-mono opacity-60">
            Direct Route
          </text>
          {showTrajectory && (
            <motion.text 
              x="200" 
              y="40" 
              textAnchor="middle" 
              className="text-xs fill-primary font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              data-testid="label-safe-route"
            >
              Safe Route (+6 hrs)
            </motion.text>
          )}
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-muted opacity-60"></div>
          <span className="text-muted-foreground font-mono">Original Path</span>
        </div>
        {showTrajectory && (
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-3 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
            <span className="text-primary font-mono">ODIN Optimized</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
