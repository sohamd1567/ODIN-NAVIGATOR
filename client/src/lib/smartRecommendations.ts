interface MissionState {
  hazards: {
    solarFlare: {
      active: boolean;
      class: string;
      magnitude: number;
    };
    communication: {
      degraded: boolean;
      latency: number;
      snr: number;
    };
    thermal: {
      overheating: boolean;
      temperature: number;
    };
  };
  navigation: {
    dispersion: number;
    fuel: number;
    trajectory: any;
  };
  power: {
    batterySOC: number;
    solarGeneration: number;
    consumption: number;
  };
}

interface SmartRecommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  reasoning: string;
  confidence: number;
  estimatedImpact: string;
  timeframe: string;
  aiGenerated: boolean;
  category: 'safety' | 'efficiency' | 'mission_success' | 'resource_optimization';
  riskReduction: number; // 0-100%
  resourceCost: {
    power?: number; // watts
    fuel?: number; // kg
    time?: number; // minutes
  };
}

interface ContextualInsight {
  type: 'pattern' | 'correlation' | 'anomaly' | 'prediction' | 'optimization';
  description: string;
  confidence: number;
  timeRelevance: string;
  historicalReference?: string;
}

const randomBetween = (min: number, max: number): number => Math.random() * (max - min) + min;

const getPriorityValue = (priority: string): number => {
  switch (priority) {
    case 'CRITICAL': return 4;
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 0;
  }
};

export const generateSmartRecommendations = (missionState: MissionState): SmartRecommendation[] => {
  const recommendations: SmartRecommendation[] = [];
  const currentTime = new Date();

  // Solar flare impact analysis
  if (missionState.hazards.solarFlare.active && missionState.hazards.solarFlare.magnitude >= 1.0) {
    recommendations.push({
      id: `solar-comm-${Date.now()}`,
      priority: missionState.hazards.solarFlare.magnitude > 5.0 ? 'CRITICAL' : 'HIGH',
      action: 'Activate redundant UHF communication channels',
      reasoning: `${missionState.hazards.solarFlare.class}${missionState.hazards.solarFlare.magnitude} solar flare detected. Historical correlation analysis shows ${randomBetween(70, 85).toFixed(0)}% probability of primary comm degradation within next 2 hours. Pattern matches Mission SIM-2398 event which resulted in 47-minute communication blackout.`,
      confidence: randomBetween(87, 95),
      estimatedImpact: 'Prevents mission-critical communication loss during solar particle bombardment',
      timeframe: 'Execute within 15 minutes',
      aiGenerated: true,
      category: 'safety',
      riskReduction: randomBetween(65, 85),
      resourceCost: { power: 45, time: 8 }
    });

    // Thermal protection during solar events
    recommendations.push({
      id: `solar-thermal-${Date.now()}`,
      priority: 'HIGH',
      action: 'Pre-deploy emergency thermal radiators',
      reasoning: `Solar particle flux predicted to increase thermal load by ${randomBetween(15, 25).toFixed(1)}%. Proactive radiator deployment reduces peak temperature exposure and protects sensitive electronics during solar maximum phase.`,
      confidence: randomBetween(82, 94),
      estimatedImpact: `Maintains component temperatures within safe margins, prevents thermal runaway cascade`,
      timeframe: 'Deploy within 20 minutes, before peak flux arrival',
      aiGenerated: true,
      category: 'safety',
      riskReduction: randomBetween(45, 68),
      resourceCost: { power: 25, time: 12 }
    });
  }

  // Navigation dispersion optimization
  if (missionState.navigation.dispersion > 30) {
    const fuelCost = randomBetween(12, 18);
    const uncertaintyReduction = randomBetween(55, 70);
    
    recommendations.push({
      id: `nav-tcm-${Date.now()}`,
      priority: missionState.navigation.dispersion > 50 ? 'HIGH' : 'MEDIUM',
      action: 'Execute precision trajectory correction maneuver (TCM-7)',
      reasoning: `Navigation dispersion at ${missionState.navigation.dispersion.toFixed(1)}% exceeds mission design threshold. Monte Carlo analysis of 10,000 trajectory iterations indicates ${randomBetween(2.1, 2.8).toFixed(1)}±0.8 km deviation at lunar arrival without correction. Optimized burn sequence minimizes fuel consumption while maximizing arrival accuracy.`,
      confidence: randomBetween(89, 96),
      estimatedImpact: `Reduces arrival uncertainty by ~${uncertaintyReduction.toFixed(0)}%, ensures science orbit insertion success`,
      timeframe: 'Optimal execution window: T+6.2 to T+8.7 hours',
      aiGenerated: true,
      category: 'mission_success',
      riskReduction: randomBetween(35, 55),
      resourceCost: { fuel: fuelCost, time: 45 }
    });
  }

  // Power optimization during solar events
  if (missionState.power.batterySOC < 85 && missionState.hazards.solarFlare.active) {
    const powerSavings = randomBetween(20, 35);
    const timeExtension = randomBetween(3.5, 6.2);
    
    recommendations.push({
      id: `power-conservation-${Date.now()}`,
      priority: missionState.power.batterySOC < 70 ? 'CRITICAL' : 'HIGH',
      action: 'Implement intelligent power conservation protocol',
      reasoning: `Battery SOC at ${missionState.power.batterySOC.toFixed(1)}% during active solar event. AI thermal model predicts ${randomBetween(20, 28).toFixed(0)}% additional power draw for thermal management systems. Multi-objective optimization identifies non-critical load shedding opportunities with minimal science impact.`,
      confidence: randomBetween(91, 98),
      estimatedImpact: `Extends operational capability by ${timeExtension.toFixed(1)} hours, maintains ${randomBetween(92, 96).toFixed(0)}% of primary science objectives`,
      timeframe: 'Immediate implementation - within 5 minutes',
      aiGenerated: true,
      category: 'resource_optimization',
      riskReduction: randomBetween(55, 75),
      resourceCost: { power: -powerSavings, time: 3 }
    });
  }

  // Communication latency optimization
  if (missionState.hazards.communication.latency > 800) {
    recommendations.push({
      id: `comm-optimization-${Date.now()}`,
      priority: 'MEDIUM',
      action: 'Optimize data packet routing and compression',
      reasoning: `Communication latency trending ${((missionState.hazards.communication.latency - 450) / 450 * 100).toFixed(0)}% above baseline. Adaptive protocol switching and enhanced compression algorithms can maintain data throughput during degraded conditions.`,
      confidence: randomBetween(78, 87),
      estimatedImpact: `Improves effective data rate by ${randomBetween(25, 40).toFixed(0)}%, ensures critical telemetry delivery`,
      timeframe: 'Implement during next communication window',
      aiGenerated: true,
      category: 'efficiency',
      riskReduction: randomBetween(25, 40),
      resourceCost: { power: 8, time: 15 }
    });
  }

  // Thermal management optimization
  if (missionState.hazards.thermal.temperature > 45) {
    recommendations.push({
      id: `thermal-management-${Date.now()}`,
      priority: missionState.hazards.thermal.temperature > 60 ? 'CRITICAL' : 'HIGH',
      action: 'Activate adaptive thermal management system',
      reasoning: `Component temperature at ${missionState.hazards.thermal.temperature.toFixed(1)}°C approaches thermal design limits. Predictive thermal modeling suggests progressive activation of cooling systems to prevent thermal stress accumulation and maintain operational margins.`,
      confidence: randomBetween(85, 93),
      estimatedImpact: `Prevents thermal damage, maintains component lifetime within mission requirements`,
      timeframe: 'Immediate - activate within 2 minutes',
      aiGenerated: true,
      category: 'safety',
      riskReduction: randomBetween(70, 85),
      resourceCost: { power: 35, time: 1 }
    });
  }

  // Fuel efficiency opportunity
  if (missionState.navigation.fuel > 70) {
    recommendations.push({
      id: `fuel-optimization-${Date.now()}`,
      priority: 'LOW',
      action: 'Consider extended mission trajectory options',
      reasoning: `Current fuel reserves at ${missionState.navigation.fuel.toFixed(1)}% provide ${randomBetween(25, 40).toFixed(0)}% margin above mission requirements. Trajectory analysis identifies opportunities for extended science operations or alternate targets with minimal additional risk.`,
      confidence: randomBetween(72, 84),
      estimatedImpact: `Enables ${randomBetween(15, 30).toFixed(0)}% additional science return, potential mission extension`,
      timeframe: 'Evaluate during next mission planning cycle',
      aiGenerated: true,
      category: 'mission_success',
      riskReduction: 0,
      resourceCost: { time: 120 }
    });
  }

  // Data management optimization
  if (randomBetween(0, 1) > 0.7) { // 30% chance to show data optimization
    recommendations.push({
      id: `data-management-${Date.now()}`,
      priority: 'MEDIUM',
      action: 'Optimize scientific data prioritization and compression',
      reasoning: `Analysis of data queue indicates ${randomBetween(15, 25).toFixed(0)}% efficiency gain possible through intelligent prioritization. Machine learning models identify high-value science data for priority transmission during limited communication windows.`,
      confidence: randomBetween(79, 88),
      estimatedImpact: `Increases science data return by ${randomBetween(18, 28).toFixed(0)}%, optimizes bandwidth utilization`,
      timeframe: 'Implement during next data dump sequence',
      aiGenerated: true,
      category: 'efficiency',
      riskReduction: randomBetween(10, 25),
      resourceCost: { power: 12, time: 25 }
    });
  }

  return recommendations
    .sort((a, b) => {
      // Sort by priority first, then by risk reduction potential
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return b.riskReduction - a.riskReduction;
    })
    .slice(0, 8); // Limit to top 8 recommendations to avoid overwhelming the operator
};

export const generateContextualInsights = (missionState: MissionState): ContextualInsight[] => {
  const insights: ContextualInsight[] = [];

  // Pattern recognition insights
  if (missionState.hazards.solarFlare.active) {
    insights.push({
      type: 'pattern',
      description: `Solar activity pattern matches historical AR-class event from Sol day 2401. Similar magnetic field configuration resulted in 3.2-hour communication disruption and required 23% additional thermal management power.`,
      confidence: randomBetween(78, 89),
      timeRelevance: 'Next 4-6 hours critical',
      historicalReference: 'Mission SIM-2398, Sol 2401-2403'
    });
  }

  // Correlation analysis
  if (missionState.power.batterySOC < 80 && missionState.hazards.thermal.temperature > 40) {
    insights.push({
      type: 'correlation',
      description: `Strong correlation detected between reduced battery capacity and thermal stress (r=0.847). Similar conditions on previous missions led to accelerated battery degradation and reduced operational lifetime.`,
      confidence: randomBetween(85, 94),
      timeRelevance: 'Ongoing monitoring required',
      historicalReference: 'Deep Space missions DS-7, DS-12'
    });
  }

  // Anomaly detection
  if (missionState.hazards.communication.latency > 600) {
    insights.push({
      type: 'anomaly',
      description: `Communication latency shows unusual periodic spikes every 47±3 minutes, suggesting interference from onboard switching power supply harmonics. This anomaly was not present in pre-flight testing.`,
      confidence: randomBetween(82, 91),
      timeRelevance: 'Continuous anomaly - investigate during next maintenance window'
    });
  }

  // Predictive insights
  insights.push({
    type: 'prediction',
    description: `Predictive model forecasts ${randomBetween(15, 25).toFixed(0)}% increase in thermal management requirements over next 72 hours due to approaching perihelion. Recommend preemptive radiator deployment.`,
    confidence: randomBetween(77, 86),
    timeRelevance: 'T+24 to T+96 hours'
  });

  // Optimization opportunities
  if (missionState.navigation.fuel > 60) {
    insights.push({
      type: 'optimization',
      description: `Trajectory optimization algorithms identify potential ${randomBetween(8, 15).toFixed(1)}% fuel savings through bi-propellant mixture ratio adjustment and extended coast phases without compromising mission timeline.`,
      confidence: randomBetween(73, 84),
      timeRelevance: 'Implementation window: T+48 to T+120 hours'
    });
  }

  return insights.slice(0, 5); // Limit to top 5 insights
};

export const generatePredictiveEvents = (missionState: MissionState) => {
  const events = [];
  const baseTime = new Date();

  // Solar flare evolution prediction
  if (missionState.hazards.solarFlare.active) {
    events.push({
      time: 'T+1.7h',
      event: 'Solar flare intensity peak expected',
      probability: randomBetween(83, 91),
      aiGenerated: true,
      reasoning: 'Flux trajectory analysis based on 12 similar AR-class solar events from historical database',
      category: 'environmental',
      impact: 'HIGH'
    });

    events.push({
      time: 'T+4.8h',
      event: 'Communication degradation recovery projected', 
      probability: randomBetween(76, 87),
      aiGenerated: true,
      reasoning: 'Solar particle flux decay model indicates ionosphere recovery timeline',
      category: 'systems',
      impact: 'MEDIUM'
    });
  }

  // Mission timeline predictions
  events.push({
    time: 'T+3.2h',
    event: 'Optimal DSN handover window to Goldstone-34m',
    probability: randomBetween(89, 95),
    aiGenerated: true,
    reasoning: 'Link budget optimization considering atmospheric conditions and orbital geometry',
    category: 'operations',
    impact: 'LOW'
  });

  // Thermal predictions
  if (missionState.hazards.thermal.temperature > 35) {
    events.push({
      time: 'T+6.1h',
      event: 'Battery thermal stress peak anticipated',
      probability: randomBetween(67, 82),
      aiGenerated: true,
      reasoning: 'Thermal modeling shows delayed heat buildup from solar radiation and internal heat generation',
      category: 'thermal',
      impact: 'MEDIUM'
    });
  }

  // Navigation events
  if (missionState.navigation.dispersion > 25) {
    events.push({
      time: 'T+8.4h',
      event: 'Trajectory correction maneuver window opens',
      probability: randomBetween(94, 98),
      aiGenerated: true,
      reasoning: 'Optimal fuel efficiency and navigation accuracy convergence point',
      category: 'navigation',
      impact: 'HIGH'
    });
  }

  return events.slice(0, 6);
};
