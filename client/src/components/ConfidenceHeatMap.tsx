import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SystemConfidence {
  subsystem: string;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  lastUpdated: Date;
  aiAnalysis: string;
  category: 'critical' | 'operational' | 'support';
}

interface Props {
  missionState?: any;
  realTime?: boolean;
}

const ConfidenceHeatMap: React.FC<Props> = ({ missionState, realTime = true }) => {
  const [confidenceData, setConfidenceData] = useState<SystemConfidence[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemConfidence | null>(null);

  useEffect(() => {
    const generateConfidenceGrid = (): SystemConfidence[] => {
      const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
      
      const baseConfidences = [
        {
          subsystem: 'Communications',
          category: 'critical' as const,
          baseConfidence: missionState?.hazards?.solarFlare?.active ? [65, 78] : [88, 96],
          trend: missionState?.hazards?.solarFlare?.active ? 'decreasing' as const : 'stable' as const,
          factors: ['Solar activity correlation', 'Signal-to-noise ratio', 'DSN availability', 'Protocol efficiency'],
          aiAnalysis: missionState?.hazards?.solarFlare?.active 
            ? 'Pattern recognition indicates 73% correlation with Mission SIM-2398 solar event. Recommend UHF backup activation.'
            : 'All communication parameters within nominal ranges. Deep learning models show stable performance.'
        },
        {
          subsystem: 'Navigation',
          category: 'critical' as const,
          baseConfidence: [84, 92],
          trend: 'stable' as const,
          factors: ['Star tracker accuracy', 'Orbital determination', 'Momentum bias', 'Trajectory dispersion'],
          aiAnalysis: 'Kalman filter convergence excellent. Monte Carlo simulations show 97.8% mission success probability.'
        },
        {
          subsystem: 'Power Management',
          category: 'critical' as const,
          baseConfidence: [89, 97],
          trend: 'increasing' as const,
          factors: ['Battery health', 'Solar array efficiency', 'Load forecasting', 'Thermal coupling'],
          aiAnalysis: 'Predictive models show optimal power utilization. Battery degradation 15% slower than modeled.'
        },
        {
          subsystem: 'Thermal Control',
          category: 'operational' as const,
          baseConfidence: missionState?.hazards?.thermal?.temperature > 45 ? [67, 82] : [78, 89],
          trend: missionState?.hazards?.thermal?.temperature > 45 ? 'decreasing' as const : 'stable' as const,
          factors: ['Component temperatures', 'Radiator efficiency', 'Solar flux modeling', 'Heat dissipation'],
          aiAnalysis: missionState?.hazards?.thermal?.temperature > 45
            ? 'Thermal stress detected. AI recommends proactive radiator deployment to prevent cascade effects.'
            : 'Thermal balance within acceptable parameters. Predictive cooling models stable.'
        },
        {
          subsystem: 'Propulsion',
          category: 'operational' as const,
          baseConfidence: [85, 94],
          trend: 'stable' as const,
          factors: ['Fuel pressure', 'Thruster performance', 'Tank utilization', 'Delta-V reserves'],
          aiAnalysis: 'Fuel efficiency 12% better than nominal. Trajectory optimization algorithms identify 23% reserve margin.'
        },
        {
          subsystem: 'Data Systems',
          category: 'support' as const,
          baseConfidence: [91, 98],
          trend: 'increasing' as const,
          factors: ['Storage utilization', 'Processing load', 'Compression efficiency', 'Queue management'],
          aiAnalysis: 'Machine learning data prioritization achieving 34% improvement in science return optimization.'
        },
        {
          subsystem: 'Attitude Control',
          category: 'operational' as const,
          baseConfidence: [79, 87],
          trend: 'stable' as const,
          factors: ['Gyro stability', 'Reaction wheel health', 'Pointing accuracy', 'Momentum management'],
          aiAnalysis: 'Predictive maintenance suggests reaction wheel bearing replacement in 847 operational hours.'
        },
        {
          subsystem: 'Command & Control',
          category: 'critical' as const,
          baseConfidence: [93, 99],
          trend: 'stable' as const,
          factors: ['Processing capacity', 'Memory utilization', 'Fault tolerance', 'Response time'],
          aiAnalysis: 'Autonomous decision-making algorithms operating at 94.7% efficiency with 2.3ms average response time.'
        }
      ];

      return baseConfidences.map(system => ({
        ...system,
        confidence: randomBetween(system.baseConfidence[0], system.baseConfidence[1]),
        lastUpdated: new Date()
      }));
    };

    setConfidenceData(generateConfidenceGrid());

    if (realTime) {
      const interval = setInterval(() => {
        setConfidenceData(prev => prev.map(system => ({
          ...system,
          confidence: Math.max(0, Math.min(100, system.confidence + (Math.random() - 0.5) * 4)),
          lastUpdated: new Date()
        })));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [missionState, realTime]);

  const getConfidenceColor = (confidence: number, category: string) => {
    const intensity = category === 'critical' ? 1.0 : category === 'operational' ? 0.8 : 0.6;
    
    if (confidence >= 90) return `rgba(34, 197, 94, ${intensity})`;  // green
    if (confidence >= 80) return `rgba(59, 130, 246, ${intensity})`;  // blue
    if (confidence >= 70) return `rgba(245, 158, 11, ${intensity})`;  // yellow
    if (confidence >= 60) return `rgba(249, 115, 22, ${intensity})`;  // orange
    return `rgba(239, 68, 68, ${intensity})`;  // red
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      case 'stable': return '→';
      default: return '?';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-400';
      case 'decreasing': return 'text-red-400';
      case 'stable': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryOrder = (category: string) => {
    switch (category) {
      case 'critical': return 0;
      case 'operational': return 1;
      case 'support': return 2;
      default: return 3;
    }
  };

  const sortedData = [...confidenceData].sort((a, b) => {
    const categoryDiff = getCategoryOrder(a.category) - getCategoryOrder(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return b.confidence - a.confidence;
  });

  return (
    <div className="confidence-heat-map bg-background/40 backdrop-blur-sm border border-border/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">AI Confidence Matrix</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>90+%</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>70-90%</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>&lt;70%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {sortedData.map((system, index) => (
          <motion.div
            key={system.subsystem}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group cursor-pointer"
            onClick={() => setSelectedSystem(system)}
          >
            <div
              className="p-3 rounded-lg border border-border/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-border"
              style={{
                backgroundColor: getConfidenceColor(system.confidence, system.category),
                boxShadow: `0 4px 20px ${getConfidenceColor(system.confidence, system.category)}40`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white truncate">{system.subsystem}</h4>
                <div className="flex items-center space-x-1">
                  <span className={`text-lg ${getTrendColor(system.trend)}`}>
                    {getTrendIcon(system.trend)}
                  </span>
                  <div className={`px-1 py-0.5 rounded text-xs ${
                    system.category === 'critical' ? 'bg-red-500/20 text-red-200' :
                    system.category === 'operational' ? 'bg-blue-500/20 text-blue-200' :
                    'bg-gray-500/20 text-gray-200'
                  }`}>
                    {system.category.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {system.confidence.toFixed(0)}%
                </span>
                <div className="text-right">
                  <div className="text-xs text-white/80">
                    {system.trend}
                  </div>
                  <div className="text-xs text-white/60">
                    {system.factors.length} factors
                  </div>
                </div>
              </div>

              {/* Pulse effect for low confidence */}
              {system.confidence < 75 && (
                <div className="absolute inset-0 rounded-lg border-2 border-red-400 animate-pulse opacity-50" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed System View */}
      {selectedSystem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-foreground">{selectedSystem.subsystem} Analysis</h4>
            <button
              onClick={() => setSelectedSystem(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-foreground mb-2">Confidence Factors</h5>
              <ul className="space-y-1">
                {selectedSystem.factors.map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-medium text-foreground mb-2">AI Analysis</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedSystem.aiAnalysis}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Last updated: {selectedSystem.lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Confidence: </span>
                <span className="font-mono font-bold text-foreground">
                  {selectedSystem.confidence.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Trend: </span>
                <span className={`font-medium ${getTrendColor(selectedSystem.trend)}`}>
                  {selectedSystem.trend} {getTrendIcon(selectedSystem.trend)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Category: </span>
                <span className="font-medium capitalize text-foreground">
                  {selectedSystem.category}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overall Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-background/30 rounded-lg border border-border/20">
          <div className="text-lg font-bold text-green-400">
            {sortedData.filter(s => s.confidence >= 90).length}
          </div>
          <div className="text-xs text-muted-foreground">High Confidence</div>
        </div>
        <div className="p-3 bg-background/30 rounded-lg border border-border/20">
          <div className="text-lg font-bold text-cyan-400">
            {(sortedData.reduce((sum, s) => sum + s.confidence, 0) / sortedData.length).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">Average Confidence</div>
        </div>
        <div className="p-3 bg-background/30 rounded-lg border border-border/20">
          <div className="text-lg font-bold text-purple-400">
            {sortedData.filter(s => s.trend === 'increasing').length}
          </div>
          <div className="text-xs text-muted-foreground">Improving Systems</div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceHeatMap;
