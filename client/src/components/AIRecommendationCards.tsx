import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { AlertTriangle, Clock, CheckCircle2, X, RotateCcw, ExternalLink } from 'lucide-react';
import type { AIRecommendation, AIImmediateAction } from '../types/odin';

interface AIRecommendationCardsProps {
  recommendations: AIRecommendation[];
  immediateActions: AIImmediateAction[];
  onAcceptAction?: (action: AIImmediateAction) => void;
  onDismissAction?: (action: AIImmediateAction) => void;
  onAcceptRecommendation?: (recommendation: AIRecommendation) => void;
  confidenceThreshold?: number;
}

const PriorityIcon: React.FC<{ priority: AIImmediateAction['priority'] }> = ({ priority }) => {
  switch (priority) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const ConfidenceBadge: React.FC<{ confidence: number; threshold?: number }> = ({ 
  confidence, 
  threshold = 70 
}) => {
  const isHighConfidence = confidence >= threshold;
  const variant = isHighConfidence ? 'default' : 'secondary';
  const color = confidence >= 80 ? 'text-green-600' : confidence >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Badge variant={variant} className={`${color} font-mono`}>
      {confidence}% confidence
    </Badge>
  );
};

const ActionCard: React.FC<{
  action: AIImmediateAction;
  onAccept?: (action: AIImmediateAction) => void;
  onDismiss?: (action: AIImmediateAction) => void;
  confidenceThreshold?: number;
}> = ({ action, onAccept, onDismiss, confidenceThreshold = 70 }) => {
  const isHighConfidence = action.confidence >= confidenceThreshold;
  const priorityColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-950/30',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`border-l-4 ${priorityColors[action.priority]} p-4 rounded-lg space-y-3`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={action.priority} />
          <Badge variant={action.priority === 'critical' ? 'destructive' : 'default'}>
            {action.priority.toUpperCase()}
          </Badge>
        </div>
        <ConfidenceBadge confidence={action.confidence} threshold={confidenceThreshold} />
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">{action.action}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Timeframe: {action.timeframe}</span>
        </div>
      </div>

      {(onAccept || onDismiss) && (
        <div className="flex items-center gap-2 pt-2">
          {onAccept && (
            <Button
              size="sm"
              variant={isHighConfidence ? "default" : "outline"}
              onClick={() => onAccept(action)}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-3 w-3" />
              {isHighConfidence ? 'Execute' : 'Consider'}
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDismiss(action)}
              className="flex items-center gap-2"
            >
              <X className="h-3 w-3" />
              Dismiss
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

const RecommendationCard: React.FC<{
  recommendation: AIRecommendation;
  onAccept?: (recommendation: AIRecommendation) => void;
  confidenceThreshold?: number;
}> = ({ recommendation, onAccept, confidenceThreshold = 70 }) => {
  const isHighConfidence = recommendation.confidence >= confidenceThreshold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="border border-border/50 bg-card/50 p-4 rounded-lg space-y-3"
    >
      <div className="flex items-start justify-between">
        <Badge variant="outline" className="text-xs">
          {recommendation.category}
        </Badge>
        <ConfidenceBadge confidence={recommendation.confidence} threshold={confidenceThreshold} />
      </div>

      <div className="space-y-2">
        <p className="text-sm">{recommendation.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Timeline: {recommendation.timeline}</span>
        </div>
      </div>

      {onAccept && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant={isHighConfidence ? "default" : "outline"}
            onClick={() => onAccept(recommendation)}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            {isHighConfidence ? 'Implement' : 'Review'}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export const AIRecommendationCards: React.FC<AIRecommendationCardsProps> = ({
  recommendations,
  immediateActions,
  onAcceptAction,
  onDismissAction,
  onAcceptRecommendation,
  confidenceThreshold = 70,
}) => {
  const criticalActions = immediateActions.filter(a => a.priority === 'critical');
  const nonCriticalActions = immediateActions.filter(a => a.priority !== 'critical');
  const highConfidenceRecs = recommendations.filter(r => r.confidence >= confidenceThreshold);
  const lowConfidenceRecs = recommendations.filter(r => r.confidence < confidenceThreshold);

  return (
    <div className="space-y-6">
      {/* Critical Actions */}
      {criticalActions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Critical Actions Required
          </h3>
          <div className="space-y-3">
            {criticalActions.map((action, idx) => (
              <ActionCard
                key={idx}
                action={action}
                onAccept={onAcceptAction}
                onDismiss={onDismissAction}
                confidenceThreshold={confidenceThreshold}
              />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Actions */}
      {nonCriticalActions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Immediate Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nonCriticalActions.map((action, idx) => (
              <ActionCard
                key={idx}
                action={action}
                onAccept={onAcceptAction}
                onDismiss={onDismissAction}
                confidenceThreshold={confidenceThreshold}
              />
            ))}
          </div>
        </div>
      )}

      {/* High Confidence Recommendations */}
      {highConfidenceRecs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            High Confidence Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highConfidenceRecs.map((recommendation, idx) => (
              <RecommendationCard
                key={idx}
                recommendation={recommendation}
                onAccept={onAcceptRecommendation}
                confidenceThreshold={confidenceThreshold}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lower Confidence Recommendations */}
      {lowConfidenceRecs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            <RotateCcw className="h-5 w-5" />
            Additional Considerations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowConfidenceRecs.map((recommendation, idx) => (
              <RecommendationCard
                key={idx}
                recommendation={recommendation}
                onAccept={onAcceptRecommendation}
                confidenceThreshold={confidenceThreshold}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {immediateActions.length === 0 && recommendations.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Actions Required</h3>
            <p className="text-muted-foreground">
              AI analysis complete. All systems operating within normal parameters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
