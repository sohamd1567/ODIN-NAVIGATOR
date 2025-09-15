import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// Moon data interface
interface MoonData {
  date: string;
  moonPhase: {
    phase: string;
    illumination: number;
    age: number;
  };
  moonPosition: {
    azimuth: number;
    altitude: number;
    distance: number;
    angularDiameter: number;
  };
}

// Moon phase emoji mapping
function getMoonPhaseEmoji(phase: string): string {
  const phaseMap: Record<string, string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
  };
  
  return phaseMap[phase] || '🌙';
}

export default function MoonPhaseWidget() {
  const { data: moonData, isLoading } = useQuery<MoonData>({
    queryKey: ['/api/moon-data'],
    refetchInterval: 3600000, // Refresh every hour
    retry: 2
  });

  if (isLoading) {
    return (
      <motion.div 
        className="glass-panel rounded-lg p-4 border border-border/50 w-full"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-yellow-400/20 animate-pulse" />
          <div>
            <div className="h-4 bg-muted/30 rounded animate-pulse w-20 mb-1" />
            <div className="h-3 bg-muted/20 rounded animate-pulse w-16" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!moonData) {
    // Fallback to calculated moon data when API is unavailable
    const today = new Date();
    const moonCycleStart = new Date('2025-01-01'); // New moon reference
    const daysSinceNewMoon = Math.floor((today.getTime() - moonCycleStart.getTime()) / (1000 * 60 * 60 * 24)) % 29.5;
    
    let phase = 'New Moon';
    let emoji = '🌑';
    let illumination = 0;
    
    if (daysSinceNewMoon < 7.4) {
      phase = 'Waxing Crescent';
      emoji = '🌒';
      illumination = daysSinceNewMoon / 7.4 * 0.5;
    } else if (daysSinceNewMoon < 14.8) {
      phase = 'Waxing Gibbous';
      emoji = '🌔';
      illumination = 0.5 + (daysSinceNewMoon - 7.4) / 7.4 * 0.5;
    } else if (daysSinceNewMoon < 22.1) {
      phase = 'Waning Gibbous';
      emoji = '🌖';
      illumination = 1 - (daysSinceNewMoon - 14.8) / 7.3 * 0.5;
    } else {
      phase = 'Waning Crescent';
      emoji = '🌘';
      illumination = 0.5 - (daysSinceNewMoon - 22.1) / 7.4 * 0.5;
    }

    return (
      <motion.div 
        className="glass-panel rounded-lg p-4 border border-border/50 w-full hover:border-primary/50 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        data-testid="moon-phase-widget"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl"
          >
            {emoji}
          </motion.div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground" data-testid="moon-phase-name">
              {phase}
            </div>
            <div className="text-xs text-muted-foreground space-x-2">
              <span data-testid="moon-illumination">{Math.round(illumination * 100)}% illuminated</span>
              <span className="text-primary">•</span>
              <span data-testid="moon-distance">384,400 km</span>
            </div>
            <div className="text-xs text-secondary font-mono mt-1">
              Age: {Math.round(daysSinceNewMoon)} days
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const phaseEmoji = getMoonPhaseEmoji(moonData.moonPhase.phase);
  const illuminationPercent = Math.round(moonData.moonPhase.illumination * 100);

  return (
    <motion.div 
      className="glass-panel rounded-lg p-4 border border-border/50 w-full hover:border-primary/50 transition-all duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      data-testid="moon-phase-widget"
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl"
        >
          {phaseEmoji}
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground" data-testid="moon-phase-name">
            {moonData.moonPhase.phase}
          </div>
          <div className="text-xs text-muted-foreground space-x-2">
            <span data-testid="moon-illumination">{illuminationPercent}% illuminated</span>
            <span className="text-primary">•</span>
            <span data-testid="moon-distance">{Math.round(moonData.moonPosition.distance).toLocaleString()} km</span>
          </div>
          <div className="text-xs text-secondary font-mono mt-1">
            Age: {Math.round(moonData.moonPhase.age)} days
          </div>
        </div>
      </div>
    </motion.div>
  );
}