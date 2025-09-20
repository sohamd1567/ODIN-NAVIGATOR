import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Settings, Zap, Brain, AlertCircle } from 'lucide-react';
import { useGroqAnalysisContext } from '@/context/GroqAnalysisContext';

export const AIControlStatus: React.FC = () => {
  const { apiStatus, checkApiStatus, isAnalyzing } = useGroqAnalysisContext();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          AI System Control Status
        </CardTitle>
        <CardDescription>
          Current AI automation settings and manual control status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Automatic Features Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Automatic Features (Disabled)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <span>Auto API Health Checks</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                DISABLED
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <span>Auto AI Analysis</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                DISABLED
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <span>Dashboard Auto-Connect</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                DISABLED
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <span>Periodic AI Triggers</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                DISABLED
              </Badge>
            </div>
          </div>
        </div>

        {/* Current API Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Current AI Status
          </h3>
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-500' :
                apiStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`} />
              <span className="text-sm">AI Analysis Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                apiStatus === 'connected' ? 'default' :
                apiStatus === 'connecting' ? 'secondary' :
                'outline'
              }>
                {apiStatus.toUpperCase()}
              </Badge>
              {isAnalyzing && (
                <Badge variant="secondary" className="animate-pulse">
                  ANALYZING
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Manual Controls
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkApiStatus}
              disabled={isAnalyzing}
              className="flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Test AI Connection
            </Button>
            <Badge variant="outline" className="text-xs">
              All AI analysis is now manual-only
            </Badge>
          </div>
        </div>

        {/* Status Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">Manual Control Mode Active</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                All AI analysis and API connections are now user-controlled. No automatic triggers are active.
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default AIControlStatus;
