import React from 'react';
import { Button } from './ui/button';
import { useNotifications } from '../hooks/useNotifications';
import { AlertTriangle, Info, Zap, Radio, Navigation, Brain } from 'lucide-react';

export const NotificationDemo: React.FC = () => {
  const {
    notifyInfo,
    notifyWarning,
    notifyCritical,
    notifyHazardDetected,
    notifySystemStatus,
    notifyAIAnalysis,
    notifyTrajectoryChange,
    notifyCommStatus
  } = useNotifications();

  const demoNotifications = [
    {
      label: 'Info Notification',
      icon: <Info className="h-4 w-4" />,
      action: () => notifyInfo(
        'System Update',
        'All systems are operating within normal parameters. Mission status: On track.',
        { 
          source: 'System Monitor',
          autoAcknowledge: true,
          autoAcknowledgeDelay: 3000
        }
      )
    },
    {
      label: 'Warning Alert',
      icon: <AlertTriangle className="h-4 w-4" />,
      action: () => notifyWarning(
        'Solar Activity Increased',
        'Solar wind speed has increased to 450 km/s. Minor geomagnetic activity possible.',
        {
          source: 'Space Weather',
          actions: [
            {
              label: 'View Details',
              onClick: () => console.log('View space weather details'),
              ariaLabel: 'View detailed space weather information'
            }
          ]
        }
      )
    },
    {
      label: 'Critical Alert',
      icon: <Zap className="h-4 w-4" />,
      action: () => notifyCritical(
        'Power System Anomaly',
        'Primary power bus showing voltage fluctuation. Switching to backup systems.',
        {
          source: 'Power Management',
          actions: [
            {
              label: 'Emergency Protocol',
              onClick: () => console.log('Activate emergency power protocol'),
              ariaLabel: 'Activate emergency power management protocol'
            },
            {
              label: 'System Diagnostics',
              onClick: () => console.log('Run power system diagnostics'),
              ariaLabel: 'Run comprehensive power system diagnostics'
            }
          ]
        }
      )
    },
    {
      label: 'Hazard Detection',
      icon: <AlertTriangle className="h-4 w-4" />,
      action: () => notifyHazardDetected(
        'Orbital Debris',
        'Multiple debris objects detected in trajectory path. Avoidance maneuver recommended.',
        [
          {
            label: 'Calculate Avoidance',
            onClick: () => console.log('Calculate debris avoidance maneuver'),
            ariaLabel: 'Calculate optimal debris avoidance trajectory'
          },
          {
            label: 'Monitor Only',
            onClick: () => console.log('Continue monitoring debris'),
            ariaLabel: 'Continue monitoring debris without maneuver'
          }
        ]
      )
    },
    {
      label: 'Communication Status',
      icon: <Radio className="h-4 w-4" />,
      action: () => notifyCommStatus(
        'degraded',
        'Primary communication link signal strength reduced to 65%. Switching to high-gain antenna.'
      )
    },
    {
      label: 'Trajectory Change',
      icon: <Navigation className="h-4 w-4" />,
      action: () => notifyTrajectoryChange(
        'Solar pressure adjustment required',
        'Mission timeline impact: +2.3 hours',
        '2025-09-18 14:42:00 UTC'
      )
    },
    {
      label: 'AI Analysis',
      icon: <Brain className="h-4 w-4" />,
      action: () => notifyAIAnalysis(
        'Thermal Management',
        'Predictive model indicates potential thermal stress in 4.2 hours based on current solar exposure profile',
        87
      )
    }
  ];

  return (
    <div className="p-6 bg-background/50 rounded-lg border border-border/50 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Notification System Demo
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Test the enhanced notification management system with different severity levels and contexts.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {demoNotifications.map((demo, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={demo.action}
            className="justify-start gap-2 h-auto py-3 px-4"
          >
            {demo.icon}
            <span className="text-xs">{demo.label}</span>
          </Button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-muted/20 rounded border border-border/30">
        <h4 className="text-sm font-medium mb-2">Features:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Severity-based prioritization (Critical {'>'}Warning {'>'}Info)</li>
          <li>• Sound notifications for new alerts</li>
          <li>• Auto-acknowledgment for info notifications</li>
          <li>• Contextual actions and deep linking</li>
          <li>• Expandable notification feed</li>
          <li>• Bulk acknowledgment for non-critical alerts</li>
          <li>• Integration with mission logs and timeline</li>
        </ul>
      </div>
    </div>
  );
};
