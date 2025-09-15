/**
 * NASA-Grade Autonomy Dashboard
 * 
 * Main dashboard component integrating all autonomous systems:
 * - Autonomy Governor for decision boundaries
 * - Thermal Predictor for thermal management
 * - Battery Management System for power optimization
 * - Mission Scheduler for predictive planning
 * - Enhanced AI analysis integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Brain,
  Shield,
  BarChart3,
  Cpu,
  Loader2
} from 'lucide-react';

import { AutonomyGovernor } from '../lib/autonomy/AutonomyGovernor';
import { ThermalPredictor } from '../lib/thermal/ThermalPredictor';
import { BatteryManagementSystem } from '../lib/power/BatteryManagementSystem';
import { MissionScheduler } from '../lib/mission/MissionScheduler';
import { EnhancedGroqClient } from '../lib/ai/EnhancedGroqClient';
import { useAdvancedAIAnalysis } from '../hooks/useAdvancedAIAnalysis';
import ConfidenceHeatMap from './ConfidenceHeatMap';
import PredictiveTimeline from './PredictiveTimeline';
import AnomalyDetection from './AnomalyDetection';
import VoiceCommands from './VoiceCommands';
import { NotificationDemo } from './NotificationDemo';
import AIControlStatus from './AIControlStatus';

import { 
  MissionPhase,
  AutonomousAction,
  SystemHealthSummary,
  SpaceEnvironment,
  DecisionBoundary
} from '../../../shared/types/autonomy';

interface AutonomyDashboardProps {
  systemHealth: SystemHealthSummary;
  environment: SpaceEnvironment;
  missionPhase: MissionPhase;
  onAutonomousAction?: (action: AutonomousAction) => void;
  onEmergencyOverride?: () => void;
}

export const AutonomyDashboard: React.FC<AutonomyDashboardProps> = ({
  systemHealth,
  environment,
  missionPhase,
  onAutonomousAction,
  onEmergencyOverride
}) => {
  // Core autonomy systems
  const [autonomyGovernor] = useState(() => new AutonomyGovernor());
  const [thermalPredictor] = useState(() => new ThermalPredictor());
  const [batteryManager] = useState(() => new BatteryManagementSystem());
  const [missionScheduler] = useState(() => new MissionScheduler());
  const [aiClient] = useState(() => new EnhancedGroqClient());

  // Advanced AI Analysis Hook
  const { 
    isAnalyzing, 
    currentStage, 
    results: analysisResults, 
    runAdvancedAnalysis: startAnalysis,
    confidence,
    streamingLogs: logs,
    processingMetrics,
    stageName,
    stageProgress
  } = useAdvancedAIAnalysis();

  // Dashboard state
  const [autonomyStatus, setAutonomyStatus] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState<AutonomousAction[]>([]);
  const [thermalStatus, setThermalStatus] = useState<any>(null);
  const [powerStatus, setPowerStatus] = useState<any>(null);
  const [scheduleMetrics, setScheduleMetrics] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);

  // Mission state for AI components
  const missionStateForAI = {
    power: powerStatus,
    thermal: thermalStatus,
    navigation: { dispersion: 12 + Math.random() * 8 },
    hazards: {
      solarFlare: { active: Math.random() > 0.6 },
      thermal: { temperature: 32 + Math.random() * 12 }
    },
    autonomy: autonomyStatus
  };

  // Update mission context
  useEffect(() => {
    autonomyGovernor.updateMissionPhase(missionPhase);
    
    aiClient.updateMissionContext({
      missionPhase,
      systemHealth,
      environmentalConditions: environment,
      missionObjectives: [],
      currentRisks: [],
      timeToNextCriticalEvent: 6,
      autonomyLevel: autonomyStatus?.autonomyLevel || 85,
      operatorAvailable: true
    });
  }, [missionPhase, systemHealth, environment, autonomyStatus]);

  // Periodic status updates
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      try {
        // Update autonomy status
        const newAutonomyStatus = autonomyGovernor.getAutonomyStatus();
        setAutonomyStatus(newAutonomyStatus);

        // Update pending actions
        const newPendingActions = autonomyGovernor.getPendingActions();
        setPendingActions(newPendingActions);

        // Update thermal status
        const newThermalStatus = thermalPredictor.getThermalStatus();
        setThermalStatus(newThermalStatus);

        // Update power status
        const newPowerStatus = batteryManager.getPowerStatus();
        setPowerStatus(newPowerStatus);

        // Update schedule metrics
        const newScheduleMetrics = missionScheduler.getScheduleMetrics();
        setScheduleMetrics(newScheduleMetrics);

        // Perform AI analysis if conditions warrant (DISABLED for manual control)
        // if (shouldPerformAiAnalysis()) {
        //   const analysis = await aiClient.analyzeSystemHealth(systemHealth, environment);
        //   setAiAnalysis(analysis);
        // }

        setLastUpdate(new Date());

      } catch (error) {
        console.error('Dashboard update failed:', error);
      }
    }, 30000); // Update every 30 seconds

    // Initial update
    const initialUpdate = async () => {
      setAutonomyStatus(autonomyGovernor.getAutonomyStatus());
      setPendingActions(autonomyGovernor.getPendingActions());
      setThermalStatus(thermalPredictor.getThermalStatus());
      setPowerStatus(batteryManager.getPowerStatus());
      setScheduleMetrics(missionScheduler.getScheduleMetrics());
    };

    initialUpdate();

    return () => clearInterval(updateInterval);
  }, [systemHealth, environment]);

  // Emergency mode handling
  useEffect(() => {
    if (systemHealth.overall === 'critical' || pendingActions.some(a => a.subsystem === 'life_support')) {
      if (!emergencyMode) {
        setEmergencyMode(true);
        autonomyGovernor.activateEmergencyMode('Critical system health detected');
        onEmergencyOverride?.();
      }
    }
  }, [systemHealth, pendingActions, emergencyMode]);

  // Action handlers
  const handleApproveAction = useCallback(async (actionId: string) => {
    try {
      const action = pendingActions.find(a => a.id === actionId);
      if (action) {
        action.status = 'executing';
        onAutonomousAction?.(action);
        
        // Simulate action execution
        setTimeout(() => {
          action.status = 'completed';
          setPendingActions(prev => prev.filter(a => a.id !== actionId));
        }, action.executionPlan.totalDuration * 1000);
      }
    } catch (error) {
      console.error('Action approval failed:', error);
    }
  }, [pendingActions, onAutonomousAction]);

  const handleOverrideAction = useCallback((actionId: string, reason: string) => {
    try {
      autonomyGovernor.processHumanOverride(actionId, 'OPERATOR', reason);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
    } catch (error) {
      console.error('Action override failed:', error);
    }
  }, []);

  const handleEmergencyStop = useCallback(() => {
    setEmergencyMode(true);
    autonomyGovernor.activateEmergencyMode('Manual emergency stop activated');
    onEmergencyOverride?.();
  }, [onEmergencyOverride]);

  const handleResumeAutonomy = useCallback(() => {
    setEmergencyMode(false);
    autonomyGovernor.deactivateEmergencyMode();
  }, []);

  // Helper functions
  const shouldPerformAiAnalysis = (): boolean => {
    if (!aiAnalysis) return true;
    const timeSinceLastAnalysis = Date.now() - aiAnalysis.timestamp.getTime();
    return timeSinceLastAnalysis > 10 * 60 * 1000; // 10 minutes
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal':
      case 'nominal': return 'text-green-600';
      case 'caution': return 'text-yellow-600';
      case 'warning': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAutonomyLevelColor = (level: number): string => {
    if (level >= 80) return 'text-green-600';
    if (level >= 60) return 'text-yellow-600';
    if (level >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!autonomyStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing Autonomy Systems...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency Controls */}
      {emergencyMode && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Emergency Mode Active</AlertTitle>
          <AlertDescription className="text-red-700">
            Autonomous operations limited to critical safety actions only.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResumeAutonomy}
              className="ml-4"
            >
              Resume Normal Operations
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Autonomy Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autonomy Level</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getAutonomyLevelColor(85)}>85%</span>
            </div>
            <p className="text-xs text-gray-600">
              {autonomyStatus.activeBoundaries} active boundaries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingActions.length}</div>
            <p className="text-xs text-gray-600">
              {autonomyStatus.urgentActionsCount} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(thermalStatus?.overallStatus || 'nominal')}`}>
              {thermalStatus?.overallStatus || 'Nominal'}
            </div>
            <p className="text-xs text-gray-600">All subsystems</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mission Phase</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{missionPhase}</div>
            <p className="text-xs text-gray-600">Current phase</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="thermal">Thermal</TabsTrigger>
          <TabsTrigger value="power">Power</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="voice">Voice AI</TabsTrigger>
          <TabsTrigger value="controls">AI Controls</TabsTrigger>
        </TabsList>

        {/* Pending Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Autonomous Actions Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending autonomous actions</p>
                  <p className="text-sm">All systems operating within normal parameters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{action.action}</h4>
                          <p className="text-sm text-gray-600">
                            Subsystem: {action.subsystem} • Confidence: {action.confidence}%
                          </p>
                        </div>
                        <Badge variant={action.confidence >= 90 ? 'default' : 'secondary'}>
                          {action.confidence >= 90 ? 'High Confidence' : 'Requires Review'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Reasoning:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {action.reasoning.map((reason: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Deadline: {action.humanOverrideDeadline.toLocaleTimeString()}
                        </div>
                        <div className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOverrideAction(action.id, 'Manual override')}
                          >
                            Override
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveAction(action.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thermal Management Tab */}
        <TabsContent value="thermal" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Component Temperatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                {thermalStatus && (
                  <div className="space-y-3">
                    {Object.entries(thermalStatus.components).map(([id, component]: [string, any]) => (
                      <div key={id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{component.name}</span>
                          <Badge variant={
                            component.status === 'nominal' ? 'default' : 
                            component.status === 'warning' ? 'secondary' : 'destructive'
                          }>
                            {component.currentTemp.toFixed(1)}°C
                          </Badge>
                        </div>
                        <Progress 
                          value={Math.min(100, (component.currentTemp + 50) / 150 * 100)} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Thermal Control Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {thermalStatus && (
                  <div className="space-y-3">
                    {Object.entries(thermalStatus.actuators).map(([id, actuator]: [string, any]) => (
                      <div key={id} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium capitalize">{actuator.type}</span>
                          <p className="text-xs text-gray-600">{actuator.capacity}W capacity</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{actuator.activation}%</div>
                          <div className="text-xs text-gray-600">
                            {actuator.reliability.toFixed(1)}% reliable
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Power Management Tab */}
        <TabsContent value="power" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Battery Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {powerStatus && (
                  <div className="space-y-4">
                    {Object.entries(powerStatus.batteries).map(([id, battery]: [string, any]) => (
                      <div key={id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {id.split('-').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                          <Badge variant={battery.active ? 'default' : 'secondary'}>
                            {battery.active ? 'Active' : 'Standby'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>SoC:</span>
                            <span>{battery.soc.toFixed(1)}%</span>
                          </div>
                          <Progress value={battery.soc} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>SoH: {battery.soh.toFixed(1)}%</span>
                            <span>{battery.temperature.toFixed(1)}°C</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Power Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {powerStatus && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Generation:</span>
                      <span className="text-sm font-medium text-green-600">
                        +{powerStatus.totalGeneration.toFixed(0)}W
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Consumption:</span>
                      <span className="text-sm font-medium text-red-600">
                        -{powerStatus.totalConsumption.toFixed(0)}W
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Net Balance:</span>
                        <span className={`text-sm font-bold ${
                          powerStatus.powerMargin >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {powerStatus.powerMargin >= 0 ? '+' : ''}{powerStatus.powerMargin.toFixed(0)}W
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Load Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {powerStatus && (
                  <div className="space-y-3">
                    {Object.entries(powerStatus.loads).map(([id, load]: [string, any]) => (
                      <div key={id} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">
                            {id.split('-').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                          <p className="text-xs text-gray-600 capitalize">{load.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{load.currentDraw.toFixed(0)}W</div>
                          <Badge variant={load.sheddable ? 'secondary' : 'default'} className="text-xs">
                            {load.sheddable ? 'Sheddable' : 'Critical'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mission Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleMetrics && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Efficiency:</span>
                        <span className="text-sm font-medium">{scheduleMetrics.efficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={scheduleMetrics.efficiency} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Rate:</span>
                        <span className="text-sm font-medium">{scheduleMetrics.completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={scheduleMetrics.completionRate} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Autonomy Level:</span>
                        <span className="text-sm font-medium">{scheduleMetrics.autonomyLevel.toFixed(1)}%</span>
                      </div>
                      <Progress value={scheduleMetrics.autonomyLevel} className="h-2" />
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Risk Level:</span>
                        <span className={getStatusColor(
                          scheduleMetrics.riskLevel > 70 ? 'critical' :
                          scheduleMetrics.riskLevel > 40 ? 'warning' : 'nominal'
                        )}>
                          {scheduleMetrics.riskLevel.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Adaptability:</span>
                        <span className="font-medium">{scheduleMetrics.adaptability.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Margins</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleMetrics && (
                  <div className="space-y-3">
                    {Object.entries(scheduleMetrics.resourceMargin).map(([resource, margin]: [string, any]) => (
                      <div key={resource} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{resource}:</span>
                        <span className={`text-sm font-medium ${
                          margin > 100 ? 'text-green-600' :
                          margin > 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {typeof margin === 'number' ? `${margin.toFixed(0)} ${
                            resource === 'power' ? 'W' :
                            resource === 'thermal' ? 'W' :
                            resource === 'bandwidth' ? 'kbps' : '%'
                          }` : margin}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Advanced AI Analysis (Manual Mode)
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startAnalysis(missionStateForAI)}
                    disabled={isAnalyzing}
                    className="ml-auto"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-3 w-3 mr-1" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing || analysisResults.length > 0 ? (
                  <div className="space-y-4">
                    {/* Analysis Progress */}
                    {isAnalyzing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Stage {currentStage}: {stageName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {confidence}% confidence
                          </span>
                        </div>
                        <Progress value={stageProgress} className="h-2" />
                      </div>
                    )}

                    {/* Live Logs */}
                    {logs.length > 0 && (
                      <div className="bg-background/50 border rounded-lg p-3 max-h-40 overflow-y-auto">
                        <h5 className="text-sm font-medium mb-2">Analysis Log</h5>
                        {logs.slice(-5).map((log: string, idx: number) => (
                          <div key={idx} className="text-xs text-muted-foreground mb-1 font-mono">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Results */}
                    {analysisResults.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Analysis Results</h4>
                        {analysisResults.map((result: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{result.stage}</span>
                              <Badge variant={result.confidence > 80 ? 'default' : 'secondary'}>
                                {result.confidence}%
                              </Badge>
                            </div>
                            {result.insights.length > 0 && (
                              <div className="space-y-1">
                                {result.insights.map((insight: string, insightIdx: number) => (
                                  <p key={insightIdx} className="text-sm text-muted-foreground">• {insight}</p>
                                ))}
                              </div>
                            )}
                            {result.recommendations.length > 0 && (
                              <div className="space-y-1">
                                {result.recommendations.slice(0, 2).map((rec: any, recIdx: number) => (
                                  <p key={recIdx} className="text-sm text-blue-600">→ {rec.action}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Click "Run Analysis" to start advanced AI evaluation</p>
                    <p className="text-sm">AI will analyze all mission systems and provide intelligent insights</p>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        ℹ️ Manual Mode: AI analysis only runs when triggered to prevent automatic API usage
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Confidence Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConfidenceHeatMap missionState={missionStateForAI} />
              </CardContent>
            </Card>
          </div>

          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Legacy AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="default">
                      Confidence: {aiAnalysis.confidence}%
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {aiAnalysis.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-gray-700">{aiAnalysis.summary}</p>
                  </div>

                  {aiAnalysis.keyFindings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Findings</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.keyFindings.map((finding: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.riskFactors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Risk Factors</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.riskFactors.map((risk: string, index: number) => (
                          <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-600" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictive Timeline Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <PredictiveTimeline missionState={missionStateForAI} timeHorizon={12} autoUpdate={true} />
        </TabsContent>

        {/* Anomaly Detection Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <AnomalyDetection missionState={missionStateForAI} maxAlerts={8} autoDetection={true} />
        </TabsContent>

        {/* Voice Commands Tab */}
        <TabsContent value="voice" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <VoiceCommands 
                missionState={missionStateForAI} 
                autoListen={false}
                onCommand={(command) => {
                  console.log('Voice command received:', command);
                  // You could integrate this with the pending actions system
                }}
              />
            </div>
            <div>
              <NotificationDemo />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="flex justify-center">
            <AIControlStatus />
          </div>
        </TabsContent>
      </Tabs>

      {/* Emergency Stop Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleEmergencyStop}
          disabled={emergencyMode}
          className="min-w-[200px]"
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          {emergencyMode ? 'Emergency Mode Active' : 'Emergency Stop'}
        </Button>
      </div>

      {/* Status Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleTimeString()} • 
        Systems operational • 
        Autonomy level: {Math.round((autonomyStatus.activeBoundaries / autonomyStatus.totalBoundaries) * 100)}%
      </div>
    </div>
  );
};
