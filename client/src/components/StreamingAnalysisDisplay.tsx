import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Brain, CheckCircle, Clock, Zap } from 'lucide-react';
import type { AIAnalysisResult, StreamingAnalysisState } from '../types/odin';

interface StreamingAnalysisDisplayProps {
  streamingState: StreamingAnalysisState;
  analysis?: Partial<AIAnalysisResult>;
  title?: string;
}

const ConfidenceIndicator: React.FC<{ confidence: number; label: string }> = ({ confidence, label }) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-500';
    if (conf >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1">
        <Progress value={confidence} className="w-16 h-2" />
        <span className="text-xs font-mono">{confidence}%</span>
      </div>
    </div>
  );
};

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [text, currentIndex, speed]);

  React.useEffect(() => {
    // Reset when text changes
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="font-mono text-sm">
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1 h-4 bg-blue-500 ml-1"
        />
      )}
    </span>
  );
};

export const StreamingAnalysisDisplay: React.FC<StreamingAnalysisDisplayProps> = ({
  streamingState,
  analysis,
  title = "AI Analysis"
}) => {
  const { isStreaming, error, partialResult } = streamingState;
  const currentAnalysis = analysis || partialResult;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Analysis failed: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="h-3 w-3" />
                </motion.div>
                Analyzing...
              </Badge>
            )}
            {!isStreaming && currentAnalysis?.riskAssessment && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence>
          {/* Risk Assessment */}
          {currentAnalysis?.riskAssessment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Risk Assessment
              </h4>
              <div className="pl-6 space-y-2">
                <div className="flex items-center gap-4">
                  <ConfidenceIndicator 
                    confidence={currentAnalysis.riskAssessment.confidence} 
                    label="Confidence" 
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Risk Level:</span>
                    <Badge 
                      variant={currentAnalysis.riskAssessment.overallRisk >= 70 ? "destructive" : 
                              currentAnalysis.riskAssessment.overallRisk >= 40 ? "default" : "secondary"}
                      className="font-mono"
                    >
                      {currentAnalysis.riskAssessment.overallRisk}%
                    </Badge>
                  </div>
                </div>
                {currentAnalysis.riskAssessment.riskFactors?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Risk Factors:</span>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      {currentAnalysis.riskAssessment.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Immediate Actions */}
          {currentAnalysis?.immediateActions && currentAnalysis.immediateActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Immediate Actions
              </h4>
              <div className="pl-6 space-y-2">
                {currentAnalysis.immediateActions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Badge 
                      variant={action.priority === 'critical' ? 'destructive' : 
                              action.priority === 'high' ? 'default' : 'secondary'}
                      className="mt-0.5"
                    >
                      {action.priority}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{action.action}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Timeframe: {action.timeframe}</span>
                        <ConfidenceIndicator confidence={action.confidence} label="Confidence" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Secondary Effects */}
          {currentAnalysis?.secondaryEffects && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h4 className="font-semibold">Secondary Effects</h4>
              <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(currentAnalysis.secondaryEffects).map(([system, effect]) => (
                  <div key={system} className="space-y-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {system}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{effect}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          {currentAnalysis?.recommendations && currentAnalysis.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h4 className="font-semibold">Recommendations</h4>
              <div className="pl-6 space-y-2">
                {currentAnalysis.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="p-3 bg-muted/30 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <Badge variant="outline">{rec.category}</Badge>
                      <ConfidenceIndicator confidence={rec.confidence} label="" />
                    </div>
                    <p className="text-sm">{rec.description}</p>
                    <p className="text-xs text-muted-foreground">Timeline: {rec.timeline}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Reasoning */}
          {currentAnalysis?.reasoning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h4 className="font-semibold">AI Reasoning</h4>
              <div className="pl-6 p-3 bg-muted/20 rounded-lg">
                {isStreaming ? (
                  <TypewriterText text={currentAnalysis.reasoning} />
                ) : (
                  <p className="text-sm text-muted-foreground">{currentAnalysis.reasoning}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streaming Status */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
              ))}
            </div>
            Receiving analysis stream...
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
