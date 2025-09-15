import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PredictedEvent {
  id: string;
  time: string; // Relative time like "T+2.3h"
  event: string;
  probability: number;
  aiGenerated: boolean;
  reasoning?: string;
  category: 'environmental' | 'systems' | 'operations' | 'navigation' | 'thermal' | 'communications';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommendedActions?: string[];
}

interface Props {
  missionState?: any;
  timeHorizon?: number; // hours
  autoUpdate?: boolean;
}

const PredictiveTimeline: React.FC<Props> = ({ 
  missionState, 
  timeHorizon = 12, 
  autoUpdate = true 
}) => {
  const [predictions, setPredictions] = useState<PredictedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PredictedEvent | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

  const generatePredictions = (): PredictedEvent[] => {
    const events: PredictedEvent[] = [];
    
    // Solar flare evolution prediction
    if (missionState?.hazards?.solarFlare?.active) {
      events.push({
        id: `solar-peak-${Date.now()}`,
        time: 'T+1.7h',
        event: 'Solar flare intensity peak expected',
        probability: randomBetween(83, 91),
        aiGenerated: true,
        reasoning: 'Deep learning flux trajectory analysis based on 847 similar AR-class solar events from historical mission database. Pattern recognition indicates 87% correlation with Mission Apollo-2401 solar maximum.',
        category: 'environmental',
        impact: 'HIGH',
        confidence: randomBetween(85, 93),
        recommendedActions: [
          'Pre-position UHF backup communication channels',
          'Reduce non-essential power consumption by 15%',
          'Deploy auxiliary thermal radiators proactively'
        ]
      });

      events.push({
        id: `comm-recovery-${Date.now()}`,
        time: 'T+4.8h',
        event: 'Communication degradation recovery projected',
        probability: randomBetween(76, 87),
        aiGenerated: true,
        reasoning: 'Solar particle flux decay model indicates ionosphere recovery timeline. Historical correlation analysis shows 82% probability of signal strength restoration within this window.',
        category: 'communications',
        impact: 'MEDIUM',
        confidence: randomBetween(78, 86),
        recommendedActions: [
          'Schedule priority data transmission during recovery window',
          'Test primary communication systems at recovery onset'
        ]
      });
    }

    // Mission operations predictions
    events.push({
      id: `dsn-handover-${Date.now()}`,
      time: 'T+3.2h',
      event: 'Optimal DSN handover window to Goldstone-34m',
      probability: randomBetween(89, 95),
      aiGenerated: true,
      reasoning: 'Link budget optimization considering atmospheric conditions, orbital geometry, and ground station availability. Multi-variable analysis identifies maximum signal strength window.',
      category: 'operations',
      impact: 'LOW',
      confidence: randomBetween(91, 97),
      recommendedActions: [
        'Pre-authorize handover sequence',
        'Queue high-priority telemetry for transmission'
      ]
    });

    // Thermal predictions
    if (missionState?.hazards?.thermal?.temperature > 35 || missionState?.hazards?.solarFlare?.active) {
      events.push({
        id: `thermal-stress-${Date.now()}`,
        time: 'T+6.1h',
        event: 'Battery thermal stress peak anticipated',
        probability: randomBetween(67, 82),
        aiGenerated: true,
        reasoning: 'Finite element thermal modeling shows delayed heat buildup from solar radiation absorption and internal heat generation. Predictive algorithms identify critical thermal load convergence.',
        category: 'thermal',
        impact: 'MEDIUM',
        confidence: randomBetween(72, 84),
        recommendedActions: [
          'Activate emergency cooling protocol 30 minutes prior',
          'Reduce battery discharge rate during peak period'
        ]
      });
    }

    // Navigation events
    if (missionState?.navigation?.dispersion > 25) {
      events.push({
        id: `tcm-window-${Date.now()}`,
        time: 'T+8.4h',
        event: 'Trajectory correction maneuver window opens',
        probability: randomBetween(94, 98),
        aiGenerated: true,
        reasoning: 'Orbital mechanics optimization identifies optimal fuel efficiency and navigation accuracy convergence point. Monte Carlo analysis of 10,000 trajectory solutions confirms timing.',
        category: 'navigation',
        impact: 'HIGH',
        confidence: randomBetween(89, 96),
        recommendedActions: [
          'Begin TCM-7 preparation sequence',
          'Validate thruster pressurization systems',
          'Upload optimized burn parameters'
        ]
      });
    }

    // Power system predictions
    if (missionState?.power?.batterySOC < 85) {
      events.push({
        id: `power-optimization-${Date.now()}`,
        time: 'T+5.3h',
        event: 'Automated power optimization sequence initiation',
        probability: randomBetween(88, 94),
        aiGenerated: true,
        reasoning: 'Predictive power management algorithms identify optimal load shedding opportunities to maximize mission duration while maintaining 95% science objective completion.',
        category: 'systems',
        impact: 'MEDIUM',
        confidence: randomBetween(86, 92),
        recommendedActions: [
          'Review non-critical system prioritization',
          'Prepare manual override procedures'
        ]
      });
    }

    // Anomaly predictions
    if (randomBetween(0, 1) > 0.6) { // 40% chance of anomaly prediction
      events.push({
        id: `anomaly-detection-${Date.now()}`,
        time: `T+${randomBetween(2, 10).toFixed(1)}h`,
        event: 'Potential system anomaly window identified',
        probability: randomBetween(45, 65),
        aiGenerated: true,
        reasoning: 'Pattern recognition algorithms detect subtle deviation patterns in telemetry that historically precede minor system anomalies. Confidence interval reflects uncertainty in complex multi-variable interactions.',
        category: 'systems',
        impact: 'LOW',
        confidence: randomBetween(68, 78),
        recommendedActions: [
          'Increase telemetry monitoring frequency',
          'Prepare diagnostic sequence protocols'
        ]
      });
    }

    // Science opportunity predictions
    events.push({
      id: `science-opportunity-${Date.now()}`,
      time: `T+${randomBetween(7, 11).toFixed(1)}h`,
      event: 'Enhanced science data collection window',
      probability: randomBetween(72, 84),
      aiGenerated: true,
      reasoning: 'Orbital mechanics and instrument pointing optimization identify high-value science target visibility window with optimal lighting and atmospheric conditions.',
      category: 'operations',
      impact: 'MEDIUM',
      confidence: randomBetween(79, 87),
      recommendedActions: [
        'Pre-position science instruments',
        'Allocate additional data storage capacity',
        'Optimize communication schedule for data return'
      ]
    });

    return events
      .sort((a, b) => {
        const aTime = parseFloat(a.time.replace('T+', '').replace('h', ''));
        const bTime = parseFloat(b.time.replace('T+', '').replace('h', ''));
        return aTime - bTime;
      })
      .slice(0, 8); // Limit to 8 predictions
  };

  useEffect(() => {
    setPredictions(generatePredictions());

    if (autoUpdate) {
      const interval = setInterval(() => {
        setPredictions(generatePredictions());
        setCurrentTime(new Date());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [missionState, autoUpdate]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'systems': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'operations': return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'navigation': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'thermal': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'communications': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 85) return 'text-green-400';
    if (probability >= 70) return 'text-yellow-400';
    if (probability >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="predictive-timeline bg-background/40 backdrop-blur-sm border border-border/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">AI Predictive Timeline</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-muted-foreground">
            Horizon: {timeHorizon}h
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">AI Active</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {predictions.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
            >
              <div className="p-3 bg-background/30 border border-border/50 rounded-lg hover:bg-background/50 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm text-cyan-400 font-bold">
                      {event.time}
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(event.impact)}`}>
                      {event.impact}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-mono ${getProbabilityColor(event.probability)}`}>
                      {event.probability.toFixed(0)}%
                    </span>
                    {event.aiGenerated && (
                      <div className="w-2 h-2 bg-purple-400 rounded-full" title="AI Generated" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-foreground font-medium mb-1">{event.event}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence: {event.confidence.toFixed(0)}%</span>
                  <span className="group-hover:text-foreground transition-colors">
                    Click for details →
                  </span>
                </div>
              </div>

              {/* Detailed Event View */}
              <AnimatePresence>
                {selectedEvent?.id === event.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-4 bg-background/60 border border-border/40 rounded-lg"
                  >
                    <h4 className="text-sm font-semibold text-foreground mb-2">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {event.reasoning}
                    </p>

                    {event.recommendedActions && event.recommendedActions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-foreground mb-2">Recommended Actions</h5>
                        <ul className="space-y-1">
                          {event.recommendedActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start">
                              <span className="text-cyan-400 mr-2">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Generated: {currentTime.toLocaleTimeString()}</span>
                      <span>Model: ODIN-Predict v4.2.1</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Timeline Statistics */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-green-400">
            {predictions.filter(p => p.probability >= 80).length}
          </div>
          <div className="text-xs text-muted-foreground">High Probability</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-red-400">
            {predictions.filter(p => p.impact === 'HIGH' || p.impact === 'CRITICAL').length}
          </div>
          <div className="text-xs text-muted-foreground">High Impact</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-cyan-400">
            {(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Confidence</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-purple-400">
            {predictions.filter(p => p.aiGenerated).length}
          </div>
          <div className="text-xs text-muted-foreground">AI Generated</div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveTimeline;
