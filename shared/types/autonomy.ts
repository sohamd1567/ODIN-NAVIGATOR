/**
 * NASA-Grade Autonomous Mission Operations Types
 * 
 * Defines the core types for autonomous decision boundaries,
 * AI governance, and human-AI collaboration protocols.
 * 
 * Based on NASA AMO (Autonomous Mission Operations) protocols
 */

export type MissionPhase = 'launch' | 'transit' | 'orbital' | 'landing' | 'surface' | 'emergency';
export type SubsystemType = 'comms' | 'power' | 'thermal' | 'navigation' | 'propulsion' | 'life_support' | 'science';
export type AutonomyLevel = 'full' | 'advisory' | 'manual' | 'emergency_override';
export type DecisionCategory = 'immediate' | 'advisory' | 'strategic' | 'emergency';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'critical';

/**
 * Core decision boundary definition following NASA AMO protocols
 */
export interface DecisionBoundary {
  id: string;
  subsystem: SubsystemType;
  action: string;
  autonomyLevel: AutonomyLevel;
  confidenceThreshold: number; // 0-100%
  timeConstraint: number; // seconds before auto-execute
  requiresHumanConfirmation: boolean;
  fallbackAction?: string;
  safetyClassification: 'routine' | 'caution' | 'warning' | 'critical';
  lastUpdated: Date;
  missionPhaseRestrictions?: MissionPhase[];
}

/**
 * Autonomous action execution context
 */
export interface AutonomousAction {
  id: string;
  decisionBoundaryId: string;
  action: string;
  subsystem: SubsystemType;
  confidence: number;
  reasoning: string[];
  alternativeActions: AlternativeAction[];
  executionPlan: ActionSequence;
  humanOverrideDeadline: Date;
  status: 'pending' | 'executing' | 'completed' | 'overridden' | 'failed';
  correlationId: string; // For post-mission analysis
  createdAt: Date;
  executedAt?: Date;
}

/**
 * Alternative action options for human review
 */
export interface AlternativeAction {
  id: string;
  description: string;
  confidence: number;
  estimatedOutcome: string;
  riskAssessment: RiskLevel;
  resourceRequirements: ResourceRequirement[];
}

/**
 * Step-by-step action execution plan
 */
export interface ActionSequence {
  steps: ActionStep[];
  totalDuration: number; // seconds
  rollbackPossible: boolean;
  checkpoints: string[]; // Points where execution can be safely halted
}

export interface ActionStep {
  id: string;
  description: string;
  duration: number; // seconds
  dependencies: string[]; // Other step IDs
  criticalityLevel: 'low' | 'medium' | 'high' | 'mission_critical';
  rollbackAction?: string;
}

/**
 * Human override system interfaces
 */
export interface HumanOverride {
  id: string;
  autonomousActionId: string;
  operatorId: string;
  overrideReason: string;
  alternativeAction?: string;
  timestamp: Date;
  confirmedBySecondOperator?: boolean; // For critical actions
}

/**
 * System health and risk assessment
 */
export interface SystemHealthSummary {
  overall: HealthStatus;
  subsystems: Record<SubsystemType, SubsystemHealth>;
  activeAlerts: SystemAlert[];
  predictiveHealth: HealthPrediction[];
}

export interface SubsystemHealth {
  status: HealthStatus;
  confidence: number;
  lastAssessment: Date;
  criticalParameters: ParameterStatus[];
  autonomyAvailable: boolean;
}

export interface ParameterStatus {
  name: string;
  value: number;
  unit: string;
  nominal: [number, number]; // [min, max] nominal range
  caution: [number, number]; // [min, max] caution range
  status: 'nominal' | 'caution' | 'warning' | 'critical';
}

export type HealthStatus = 'optimal' | 'nominal' | 'caution' | 'warning' | 'critical' | 'offline';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Space environment context
 */
export interface SpaceEnvironment {
  solarActivity: SolarActivity;
  radiation: RadiationEnvironment;
  temperature: ThermalEnvironment;
  micrometeorite: MicrometeoriteRisk;
  communicationConditions: CommConditions;
}

export interface SolarActivity {
  flareRisk: RiskLevel;
  solarWindSpeed: number; // km/s
  kpIndex: number;
  predictedFlares: PredictedSolarFlare[];
}

export interface PredictedSolarFlare {
  class: 'A' | 'B' | 'C' | 'M' | 'X';
  magnitude: number;
  probability: number;
  estimatedArrival: Date;
  duration: number; // hours
}

export interface RadiationEnvironment {
  totalDose: number; // mGy
  doseRate: number; // mGy/hour
  shieldingEffectiveness: number; // 0-100%
  saaTransit: boolean; // South Atlantic Anomaly
}

export interface ThermalEnvironment {
  sunExposure: number; // 0-100%
  earthAlbedo: number; // 0-100%
  deepSpaceView: number; // 0-100%
  predictedTempSwing: number; // Celsius
}

export interface MicrometeoriteRisk {
  fluxDensity: number; // particles/m²/hour
  averageVelocity: number; // km/s
  riskLevel: RiskLevel;
}

export interface CommConditions {
  signalStrength: number; // dBm
  dataRate: number; // kbps
  latency: number; // ms
  blackoutRisk: RiskLevel;
  nextDsnHandover: Date;
}

/**
 * Mission objectives and priorities
 */
export interface ObjectivePriority {
  id: string;
  name: string;
  priority: number; // 1-10, 10 being highest
  category: 'primary' | 'secondary' | 'tertiary' | 'safety';
  status: 'active' | 'completed' | 'deferred' | 'cancelled';
  deadline?: Date;
  resourceRequirements: ResourceRequirement[];
}

export interface ResourceRequirement {
  type: 'power' | 'thermal' | 'compute' | 'memory' | 'bandwidth' | 'time';
  amount: number;
  unit: string;
  duration: number; // seconds
}

/**
 * Active risk tracking
 */
export interface ActiveRisk {
  id: string;
  category: 'technical' | 'environmental' | 'operational' | 'mission';
  description: string;
  severity: RiskLevel;
  probability: number; // 0-100%
  impact: string[];
  mitigationStrategies: MitigationStrategy[];
  timeToMaterialize?: number; // hours
}

export interface MitigationStrategy {
  id: string;
  description: string;
  effectiveness: number; // 0-100%
  resourceCost: ResourceRequirement[];
  autonomousCapable: boolean;
}

/**
 * Health prediction for predictive maintenance
 */
export interface HealthPrediction {
  component: string;
  subsystem: SubsystemType;
  currentHealth: number; // 0-100%
  predictedHealth: HealthTrend[];
  maintenanceRecommendations: MaintenanceAction[];
  failureProbability: number; // 0-100% over next 30 days
}

export interface HealthTrend {
  timeHorizon: number; // hours from now
  predictedHealth: number; // 0-100%
  confidence: number; // 0-100%
}

export interface MaintenanceAction {
  action: string;
  urgency: 'routine' | 'recommended' | 'urgent' | 'critical';
  estimatedTimeToComplete: number; // hours
  resourceRequirements: ResourceRequirement[];
}

/**
 * System alerts with correlation and escalation
 */
export interface SystemAlert {
  id: string;
  subsystem: SubsystemType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  correlationId: string;
  acknowledgmentRequired: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  escalationLevel: number; // 0-3, 3 being highest
  relatedAlerts: string[]; // Other alert IDs
  suggestedActions: string[];
}

/**
 * Mission timeline prediction and optimization
 */
export interface MissionPrediction {
  timeHorizon: number; // hours
  predictedEvents: PredictedEvent[];
  resourceUtilization: ResourceForecast;
  riskAssessment: RiskPrediction;
  recommendedActions: ScheduleOptimization[];
  confidence: number; // 0-100%
  lastUpdated: Date;
}

export interface PredictedEvent {
  id: string;
  type: 'solar_storm' | 'dsn_handover' | 'eclipse' | 'thruster_burn' | 'communication_blackout';
  probability: number; // 0-100%
  startTime: Date;
  duration: number; // seconds
  impact: SystemImpact[];
  preparation: PreparationAction[];
}

export interface SystemImpact {
  subsystem: SubsystemType;
  impactType: 'performance_degradation' | 'service_interruption' | 'data_loss' | 'safety_risk';
  severity: number; // 0-100%
  mitigationPossible: boolean;
}

export interface PreparationAction {
  action: string;
  timeBeforeEvent: number; // seconds
  autonomousCapable: boolean;
  priority: number; // 1-10
}

export interface ResourceForecast {
  timeHorizon: number; // hours
  power: PowerForecast;
  thermal: ThermalForecast;
  bandwidth: BandwidthForecast;
  compute: ComputeForecast;
}

export interface PowerForecast {
  generation: PowerTrend[];
  consumption: PowerTrend[];
  batteryState: BatteryForecast[];
  criticalEvents: PowerEvent[];
}

export interface PowerTrend {
  timestamp: Date;
  value: number; // watts
  confidence: number; // 0-100%
}

export interface BatteryForecast {
  timestamp: Date;
  soc: number; // 0-100%
  soh: number; // 0-100%
  temperature: number; // Celsius
  confidence: number; // 0-100%
}

export interface PowerEvent {
  timestamp: Date;
  event: 'high_demand' | 'low_generation' | 'thermal_limit' | 'battery_switch';
  impact: number; // watts
  duration: number; // seconds
}

export interface ThermalForecast {
  componentTemperatures: ComponentThermalTrend[];
  thermalEvents: ThermalEvent[];
  coolingCapacity: ThermalCapacityTrend[];
}

export interface ComponentThermalTrend {
  component: string;
  trends: ThermalDataPoint[];
  thermalLimits: {
    nominal: [number, number];
    survival: [number, number];
  };
}

export interface ThermalDataPoint {
  timestamp: Date;
  temperature: number; // Celsius
  confidence: number; // 0-100%
}

export interface ThermalEvent {
  timestamp: Date;
  event: 'solar_heating' | 'eclipse_cooling' | 'flare_impact' | 'component_overheat';
  magnitude: number; // Celsius change
  duration: number; // seconds
  affectedComponents: string[];
}

export interface ThermalCapacityTrend {
  timestamp: Date;
  capacity: number; // watts thermal
  utilizationPercent: number; // 0-100%
}

export interface BandwidthForecast {
  dataRates: DataRateTrend[];
  commWindows: CommWindow[];
  dataVolume: DataVolumeForecast[];
}

export interface DataRateTrend {
  timestamp: Date;
  downlink: number; // kbps
  uplink: number; // kbps
  confidence: number; // 0-100%
}

export interface CommWindow {
  startTime: Date;
  endTime: Date;
  station: string;
  maxDataRate: number; // kbps
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface DataVolumeForecast {
  timestamp: Date;
  queuedData: number; // GB
  transmissionPriority: DataPriority[];
}

export interface DataPriority {
  dataType: 'telemetry' | 'science' | 'housekeeping' | 'logs';
  volume: number; // GB
  priority: number; // 1-10
}

export interface ComputeForecast {
  cpuUtilization: UtilizationTrend[];
  memoryUtilization: UtilizationTrend[];
  aiProcessingLoad: AiLoadForecast[];
}

export interface UtilizationTrend {
  timestamp: Date;
  utilization: number; // 0-100%
  available: number; // Resource units available
}

export interface AiLoadForecast {
  timestamp: Date;
  inferenceRequests: number; // per second
  modelType: string;
  processingTime: number; // ms average
}

export interface RiskPrediction {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  cascadeRisks: CascadeRisk[];
  mitigationEffectiveness: number; // 0-100%
}

export interface RiskFactor {
  category: string;
  risk: RiskLevel;
  probability: number; // 0-100%
  timeframe: number; // hours
  impact: string[];
}

export interface CascadeRisk {
  triggerEvent: string;
  cascadeSequence: string[];
  probability: number; // 0-100%
  totalImpact: RiskLevel;
}

export interface ScheduleOptimization {
  id: string;
  optimization: string;
  benefits: string[];
  tradeoffs: string[];
  resourceImpact: ResourceRequirement[];
  implementationComplexity: 'low' | 'medium' | 'high';
  confidence: number; // 0-100%
}

/**
 * Thermal Management Types
 */
export interface ThermalResponse {
  triggerCondition: 'solar_flare' | 'component_overheat' | 'deep_space_cooling';
  predictedTempRise: number; // Celsius
  timeToThreshold: number; // minutes
  automaticActions: ThermalAction[];
  manualRecommendations: string[];
  confidenceLevel: number;
}

export interface ThermalAction {
  component: string;
  action: 'deploy_radiator' | 'activate_heater' | 'reduce_power' | 'reorient_spacecraft';
  priority: 'critical' | 'high' | 'medium' | 'low';
  executionTime: number; // seconds
}

/**
 * Power Management Types
 */
export interface PowerManagementAction {
  id: string;
  trigger: 'low_soc' | 'thermal_limit' | 'solar_storm' | 'load_spike' | 'thermal_runaway';
  action: 'shed_load' | 'switch_battery_bank' | 'activate_backup' | 'emergency_mode' | 'isolate_bank';
  affectedSystems: string[];
  powerSavings: number; // watts
  missionImpact: 'none' | 'minor' | 'moderate' | 'severe';
  executionTime: number; // seconds
  reversible: boolean;
  confidence: number; // 0-100%
  timestamp: Date;
}
