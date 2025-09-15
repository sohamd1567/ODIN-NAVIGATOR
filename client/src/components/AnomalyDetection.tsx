import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Brain, Cpu, Activity, Shield, Zap } from 'lucide-react';

interface AnomalyAlert {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  source: string;
  confidence: number;
  category: 'thermal' | 'power' | 'communications' | 'navigation' | 'structural' | 'software';
  aiRecommendation: string;
  correlationId?: string;
  suppressible: boolean;
  autoResolved?: boolean;
  telemetryData?: Record<string, any>;
}

interface Props {
  missionState?: any;
  maxAlerts?: number;
  autoDetection?: boolean;
}

const AnomalyDetection: React.FC<Props> = ({ 
  missionState, 
  maxAlerts = 5, 
  autoDetection = true 
}) => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [suppressedAlerts, setSuppressedAlerts] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

  const generateAnomalyAlert = (): AnomalyAlert | null => {
    // Probabilistic anomaly generation based on mission state
    const anomalyChance = randomBetween(0, 1);
    
    // Increase anomaly probability based on hazards
    let baseProbability = 0.15; // 15% base chance
    if (missionState?.hazards?.solarFlare?.active) baseProbability += 0.25;
    if (missionState?.hazards?.thermal?.temperature > 35) baseProbability += 0.15;
    if (missionState?.power?.batterySOC < 50) baseProbability += 0.20;
    if (missionState?.navigation?.dispersion > 30) baseProbability += 0.10;

    if (anomalyChance > baseProbability) return null;

    const anomalyTemplates = [
      // Thermal anomalies
      {
        category: 'thermal' as const,
        severity: 'MEDIUM' as const,
        title: 'Thermal Gradient Anomaly Detected',
        description: 'Unexpected temperature differential between primary battery pack and secondary thermal sensors exceeds nominal variance by 3.2°C.',
        source: 'AI Pattern Recognition - Thermal Subsystem',
        confidence: randomBetween(78, 89),
        aiRecommendation: 'Deploy auxiliary cooling fins and reduce non-essential power draw by 12%. Monitor for 45 minutes to confirm thermal stabilization.',
        telemetryData: {
          primaryTemp: randomBetween(35, 42),
          secondaryTemp: randomBetween(30, 36),
          gradientDeviation: randomBetween(2.8, 4.1)
        }
      },
      
      // Power anomalies
      {
        category: 'power' as const,
        severity: 'HIGH' as const,
        title: 'Battery Cell Voltage Asymmetry',
        description: 'AI correlation analysis identified abnormal voltage distribution across battery cells 7-12. Potential early indicator of cell degradation.',
        source: 'Deep Learning Battery Analysis',
        confidence: randomBetween(83, 94),
        aiRecommendation: 'Initiate cell balancing protocol immediately. Schedule diagnostic discharge cycle within next 6 hours to characterize cell health.',
        telemetryData: {
          cellVoltages: Array.from({length: 12}, () => randomBetween(3.6, 4.1)),
          asymmetryIndex: randomBetween(0.23, 0.47),
          degradationRisk: randomBetween(15, 35)
        }
      },

      // Communication anomalies
      {
        category: 'communications' as const,
        severity: 'MEDIUM' as const,
        title: 'Signal Coherence Pattern Deviation',
        description: 'Machine learning algorithms detect subtle phase noise patterns in X-band downlink that deviate from baseline by 2.7 standard deviations.',
        source: 'Communications AI Monitoring',
        confidence: randomBetween(72, 86),
        aiRecommendation: 'Switch to backup transponder for next scheduled contact. Run comprehensive RF self-test during maintenance window.',
        telemetryData: {
          phaseNoise: randomBetween(-87, -92),
          coherenceIndex: randomBetween(0.72, 0.89),
          deviationSigma: randomBetween(2.1, 3.4)
        }
      },

      // Navigation anomalies
      {
        category: 'navigation' as const,
        severity: 'LOW' as const,
        title: 'IMU Drift Acceleration Detected',
        description: 'Inertial measurement unit showing gradual bias drift rate 15% higher than expected from thermal modeling and historical performance.',
        source: 'Navigation AI Correlation Engine',
        confidence: randomBetween(69, 81),
        aiRecommendation: 'Schedule star tracker calibration sequence within 3 hours. Update IMU bias compensation parameters based on latest drift analysis.',
        telemetryData: {
          driftRate: randomBetween(0.0012, 0.0028),
          biasAcceleration: randomBetween(1.12, 1.18),
          temperatureCorrelation: randomBetween(0.67, 0.83)
        }
      },

      // Software anomalies
      {
        category: 'software' as const,
        severity: 'LOW' as const,
        title: 'Memory Access Pattern Anomaly',
        description: 'Unusual memory allocation patterns detected in guidance computer. AI analysis suggests potential memory fragmentation or leak in non-critical subsystem.',
        source: 'Software Health Monitoring AI',
        confidence: randomBetween(65, 78),
        aiRecommendation: 'Execute memory defragmentation routine during next planned system maintenance. Monitor heap allocation patterns for trend continuation.',
        telemetryData: {
          memoryUtilization: randomBetween(67, 84),
          fragmentationIndex: randomBetween(0.23, 0.41),
          allocationRate: randomBetween(12, 28)
        }
      },

      // Structural anomalies
      {
        category: 'structural' as const,
        severity: 'CRITICAL' as const,
        title: 'Micro-Vibration Anomaly in Solar Array',
        description: 'High-frequency vibration analysis reveals resonant frequency shift in solar array structure. AI models predict potential fatigue stress accumulation.',
        source: 'Structural Health AI Monitor',
        confidence: randomBetween(91, 97),
        aiRecommendation: 'Immediately reduce solar array articulation rate by 40%. Schedule detailed structural assessment and consider mission profile modification.',
        telemetryData: {
          resonantFreq: randomBetween(47.2, 52.8),
          dampingRatio: randomBetween(0.023, 0.041),
          stressAmplitude: randomBetween(145, 278)
        }
      }
    ];

    const template = anomalyTemplates[Math.floor(Math.random() * anomalyTemplates.length)];
    
    return {
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...template,
      correlationId: `COR-${Date.now().toString(36).toUpperCase()}`,
      suppressible: template.severity !== 'CRITICAL',
      autoResolved: Math.random() > 0.8 && template.severity === 'LOW'
    };
  };

  useEffect(() => {
    if (!autoDetection) return;

    const interval = setInterval(() => {
      setIsAnalyzing(true);
      
      // Simulate AI analysis time
      setTimeout(() => {
        const newAlert = generateAnomalyAlert();
        if (newAlert) {
          setAlerts(prev => {
            const filtered = prev.filter(alert => !alert.autoResolved);
            return [...filtered, newAlert].slice(-maxAlerts);
          });
        }
        setIsAnalyzing(false);
      }, randomBetween(800, 2200));
      
    }, randomBetween(15000, 45000)); // Check every 15-45 seconds

    return () => clearInterval(interval);
  }, [autoDetection, maxAlerts, missionState]);

  // Auto-resolve some low-severity alerts
  useEffect(() => {
    const autoResolveInterval = setInterval(() => {
      setAlerts(prev => prev.map(alert => {
        if (alert.severity === 'LOW' && Math.random() > 0.85) {
          return { ...alert, autoResolved: true };
        }
        return alert;
      }));
    }, 30000);

    return () => clearInterval(autoResolveInterval);
  }, []);

  const suppressAlert = (alertId: string) => {
    setSuppressedAlerts(prev => new Set(Array.from(prev).concat(alertId)));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-500/10 text-red-300';
      case 'HIGH': return 'border-orange-500 bg-orange-500/10 text-orange-300';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-500/10 text-yellow-300';
      case 'LOW': return 'border-blue-500 bg-blue-500/10 text-blue-300';
      default: return 'border-gray-500 bg-gray-500/10 text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'thermal': return <Zap className="w-4 h-4" />;
      case 'power': return <Activity className="w-4 h-4" />;
      case 'communications': return <Cpu className="w-4 h-4" />;
      case 'navigation': return <Shield className="w-4 h-4" />;
      case 'structural': return <AlertTriangle className="w-4 h-4" />;
      case 'software': return <Brain className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const activeAlerts = alerts.filter(alert => 
    !suppressedAlerts.has(alert.id) && !alert.autoResolved
  );

  return (
    <div className="anomaly-detection bg-background/40 backdrop-blur-sm border border-border/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-foreground">AI Anomaly Detection</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isAnalyzing && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Analyzing</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {activeAlerts.length} Active
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {activeAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)} transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(alert.category)}
                  <div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {alert.source} • {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono">
                    {alert.confidence.toFixed(0)}%
                  </span>
                  <div className="flex space-x-1">
                    {alert.suppressible && (
                      <button
                        onClick={() => suppressAlert(alert.id)}
                        className="text-xs px-2 py-1 bg-background/30 hover:bg-background/50 rounded border border-border/30 transition-colors"
                      >
                        Suppress
                      </button>
                    )}
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-xs px-2 py-1 bg-background/30 hover:bg-background/50 rounded border border-border/30 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {alert.description}
              </p>

              <div className="bg-background/30 p-2 rounded border border-border/20 mb-2">
                <h5 className="text-xs font-medium text-foreground mb-1">AI Recommendation</h5>
                <p className="text-xs text-muted-foreground">
                  {alert.aiRecommendation}
                </p>
              </div>

              {alert.telemetryData && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    View Telemetry Data
                  </summary>
                  <div className="mt-2 p-2 bg-background/20 rounded font-mono text-xs">
                    {Object.entries(alert.telemetryData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="text-foreground">
                          {typeof value === 'number' ? value.toFixed(3) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {alert.correlationId && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Correlation ID: {alert.correlationId}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {activeAlerts.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No anomalies detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI monitoring systems operational
            </p>
          </div>
        )}
      </div>

      {/* Detection Statistics */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-red-400">
            {activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length}
          </div>
          <div className="text-xs text-muted-foreground">High Severity</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-yellow-400">
            {activeAlerts.filter(a => a.severity === 'MEDIUM').length}
          </div>
          <div className="text-xs text-muted-foreground">Medium Risk</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-green-400">
            {alerts.filter(a => a.autoResolved).length}
          </div>
          <div className="text-xs text-muted-foreground">Auto-Resolved</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-purple-400">
            {activeAlerts.length > 0 ? (activeAlerts.reduce((sum, a) => sum + a.confidence, 0) / activeAlerts.length).toFixed(0) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Confidence</div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection;
