import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Brain, 
  Zap, 
  Settings, 
  History, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { StreamingAnalysisDisplay } from './StreamingAnalysisDisplay';
import { AIRecommendationCards } from './AIRecommendationCards';
import { useGroqAnalysisContext } from '../context/GroqAnalysisContext';
import { useMission } from '../context/MissionContext';
import { useToast } from '../hooks/use-toast';
import type { HazardEvent, AIAnalysisContext, AIAnalysisResult } from '../types/odin';

interface AIAnalysisPanelProps {
  className?: string;
}

const ModelStatusBadge: React.FC<{ 
  status: 'connected' | 'disconnected' | 'error' | 'checking' | 'analyzing';
  isAnalyzing?: boolean;
}> = ({ status, isAnalyzing = false }) => {
  const getStatusConfig = () => {
    if (isAnalyzing) {
      return { 
        variant: 'default' as const, 
        icon: <Activity className="h-3 w-3 animate-pulse" />, 
        text: 'Analyzing' 
      };
    }
    
    switch (status) {
      case 'connected':
        return { 
          variant: 'default' as const, 
          icon: <Wifi className="h-3 w-3" />, 
          text: 'Connected' 
        };
      case 'checking':
        return { 
          variant: 'secondary' as const, 
          icon: <RefreshCw className="h-3 w-3 animate-spin" />, 
          text: 'Checking' 
        };
      case 'error':
      case 'disconnected':
        return { 
          variant: 'destructive' as const, 
          icon: <WifiOff className="h-3 w-3" />, 
          text: 'Offline' 
        };
      default:
        return { 
          variant: 'secondary' as const, 
          icon: <Brain className="h-3 w-3" />, 
          text: 'Unknown' 
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      <span>{config.text}</span>
    </Badge>
  );
};

const ConfidenceMetrics: React.FC<{ 
  confidence: number; 
  threshold: number;
  onThresholdChange?: (threshold: number) => void;
}> = ({ confidence, threshold, onThresholdChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const confidenceColor = confidence >= 80 ? 'text-green-600' : 
                          confidence >= 60 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Overall Confidence:</span>
        <span className={`font-mono font-semibold ${confidenceColor}`}>
          {confidence}%
        </span>
      </div>
      
      {onThresholdChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Threshold:</span>
          {isEditing ? (
            <input
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="w-16 px-2 py-1 text-xs border rounded"
              autoFocus
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-auto p-1 font-mono"
            >
              {threshold}%
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ className }) => {
  const { toast } = useToast();
  const missionContext = useMission();
  const {
    analyzeHazard,
    analyzeHazardStream,
    isAnalyzing,
    error,
    streamingState,
    apiStatus,
    analysisHistory,
    confidenceThreshold,
    setConfidenceThreshold,
    checkApiStatus,
    clearHistory,
  } = useGroqAnalysisContext();

  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysisResult | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<HazardEvent | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    settings: false,
    history: false,
  });

  // Auto-select most recent critical hazard
  React.useEffect(() => {
    const criticalHazards = missionContext.hazards
      .filter((h: HazardEvent) => h.severity >= 4)
      .sort((a: HazardEvent, b: HazardEvent) => b.startTs - a.startTs);
    
    if (criticalHazards.length > 0 && !selectedHazard) {
      setSelectedHazard(criticalHazards[0]);
    }
  }, [missionContext.hazards, selectedHazard]);

  const analyzeCurrentHazard = useCallback(async () => {
    if (!selectedHazard) {
      toast({
        title: "No Hazard Selected",
        description: "Please select a hazard to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      const context: Partial<AIAnalysisContext> = {
        analysisType: selectedHazard.kind as any,
        missionPhase: 'cruise', // Could be dynamic based on mission state
        criticalSystemsStatus: {
          navigation: 'nominal',
          communications: missionContext.commsDegraded ? 'degraded' : 'nominal',
          power: 'nominal',
          propulsion: 'nominal',
        },
        consumablesStatus: {
          propellant: 85,
          battery: 95,
          water: 90,
          oxygen: 88,
        },
      };

      let result: AIAnalysisResult;

      if (useStreaming) {
        result = await analyzeHazardStream(
          selectedHazard,
          (chunk, partial) => {
            // Real-time updates handled by StreamingAnalysisDisplay
          },
          context
        );
      } else {
        result = await analyzeHazard(selectedHazard, context);
      }

      setCurrentAnalysis(result);
      
      toast({
        title: "Analysis Complete",
        description: `Risk level: ${result.riskAssessment.overallRisk}% (${result.riskAssessment.confidence}% confidence)`,
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [selectedHazard, useStreaming, analyzeHazard, analyzeHazardStream, missionContext, toast]);

  const handleAcceptAction = useCallback((action: any) => {
    // Log the accepted action
    missionContext.addLog({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'AI_ACTION_ACCEPTED',
      data: { action, hazardId: selectedHazard?.id },
      subsystem: 'ai',
      severity: action.priority === 'critical' ? 'critical' : 'info',
      actionRequired: true,
    });

    toast({
      title: "Action Accepted",
      description: action.action,
    });
  }, [missionContext, selectedHazard, toast]);

  const handleDismissAction = useCallback((action: any) => {
    missionContext.addLog({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'AI_ACTION_DISMISSED',
      data: { action, hazardId: selectedHazard?.id },
      subsystem: 'ai',
      severity: 'info',
    });

    toast({
      title: "Action Dismissed",
      description: `Dismissed: ${action.action}`,
    });
  }, [missionContext, selectedHazard, toast]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ODIN AI Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <ModelStatusBadge status={apiStatus} isAnalyzing={isAnalyzing} />
            <Button
              variant="outline"
              size="sm"
              onClick={checkApiStatus}
              disabled={isAnalyzing}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hazard Selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Select Hazard for Analysis</h3>
          <div className="grid grid-cols-1 gap-2">
            {missionContext.hazards.map((hazard: HazardEvent) => (
              <button
                key={hazard.id}
                onClick={() => setSelectedHazard(hazard)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedHazard?.id === hazard.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{hazard.label}</span>
                  <Badge 
                    variant={hazard.severity >= 4 ? 'destructive' : 
                            hazard.severity >= 3 ? 'default' : 'secondary'}
                  >
                    Level {hazard.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {hazard.kind.replace('-', ' ')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Controls */}
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
          <Button
            onClick={analyzeCurrentHazard}
            disabled={!selectedHazard || isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Hazard'}
          </Button>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded"
            />
            Stream analysis
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analysis Results */}
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {(streamingState.isStreaming || currentAnalysis) ? (
              <StreamingAnalysisDisplay
                streamingState={streamingState}
                analysis={currentAnalysis || undefined}
                title="Real-time AI Analysis"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a hazard and click "Analyze" to begin</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {currentAnalysis && (
              <>
                <ConfidenceMetrics
                  confidence={currentAnalysis.riskAssessment.confidence}
                  threshold={confidenceThreshold}
                  onThresholdChange={setConfidenceThreshold}
                />
                
                <AIRecommendationCards
                  recommendations={currentAnalysis.recommendations}
                  immediateActions={currentAnalysis.immediateActions}
                  onAcceptAction={handleAcceptAction}
                  onDismissAction={handleDismissAction}
                  onAcceptRecommendation={handleAcceptAction}
                  confidenceThreshold={confidenceThreshold}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Analysis History</h3>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Clear History
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analysisHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border border-border/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{entry.hazard.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.model.includes('70b') ? 'Accurate' : 'Fast'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Risk: {entry.result.riskAssessment.overallRisk}%</span>
                    <span>Confidence: {entry.result.riskAssessment.confidence}%</span>
                    <span>Duration: {entry.requestDuration}ms</span>
                    {entry.fallbackUsed && (
                      <Badge variant="secondary" className="text-xs">Fallback</Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {analysisHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No analysis history yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
