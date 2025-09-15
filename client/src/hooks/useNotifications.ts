import { useCallback } from 'react';
import { NotificationSeverity, NotificationAction } from '../types/notification';
import { useNotificationStore } from '../context/NotificationContext';

export interface NotificationOptions {
  severity: NotificationSeverity;
  title: string;
  message: string;
  source?: string;
  actions?: NotificationAction[];
  relatedLogId?: number | string;
  autoAcknowledge?: boolean;
  autoAcknowledgeDelay?: number;
}

export function useNotifications() {
  const { addNotification, acknowledge } = useNotificationStore();

  const notify = useCallback(({
    severity,
    title,
    message,
    source = 'System',
    actions,
    relatedLogId,
    autoAcknowledge = false,
    autoAcknowledgeDelay = 5000
  }: NotificationOptions) => {
    const notification = addNotification({
      severity,
      title,
      message,
      source,
      actions,
      relatedLogId
    });

    // Auto-acknowledge for info notifications if requested
    if (autoAcknowledge && severity === 'info') {
      setTimeout(() => {
        acknowledge(notification.id);
      }, autoAcknowledgeDelay);
    }

    return notification;
  }, [addNotification, acknowledge]);

  // Convenience methods for different severity levels
  const notifyInfo = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    return notify({ ...options, severity: 'info', title, message });
  }, [notify]);

  const notifyWarning = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    return notify({ ...options, severity: 'warning', title, message });
  }, [notify]);

  const notifyCritical = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    return notify({ ...options, severity: 'critical', title, message });
  }, [notify]);

  // Specialized notifications for common ODIN scenarios
  const notifyHazardDetected = useCallback((hazardType: string, details: string, actions?: NotificationAction[]) => {
    return notify({
      severity: 'warning',
      title: `${hazardType} Detected`,
      message: details,
      source: 'Hazard Detection',
      actions
    });
  }, [notify]);

  const notifySystemStatus = useCallback((system: string, status: string, isError = false) => {
    return notify({
      severity: isError ? 'critical' : 'info',
      title: `${system} Status Update`,
      message: status,
      source: 'System Monitor',
      autoAcknowledge: !isError,
      autoAcknowledgeDelay: 3000
    });
  }, [notify]);

  const notifyAIAnalysis = useCallback((analysisType: string, findings: string, confidence: number) => {
    return notify({
      severity: confidence > 80 ? 'warning' : 'info',
      title: `AI Analysis: ${analysisType}`,
      message: `${findings} (Confidence: ${confidence}%)`,
      source: 'AI Analysis',
      actions: [
        {
          label: 'View Details',
          onClick: () => {
            // Could open AI analysis tab or detailed view
            console.log('Open AI analysis details');
          },
          ariaLabel: 'View detailed AI analysis results'
        }
      ]
    });
  }, [notify]);

  const notifyTrajectoryChange = useCallback((reason: string, impact: string, newETA?: string) => {
    return notify({
      severity: 'warning',
      title: 'Trajectory Adjustment',
      message: `${reason}. ${impact}${newETA ? ` New ETA: ${newETA}` : ''}`,
      source: 'Navigation',
      actions: [
        {
          label: 'View Trajectory',
          onClick: () => {
            // Could open trajectory visualization
            console.log('Open trajectory view');
          },
          ariaLabel: 'View updated trajectory visualization'
        },
        {
          label: 'Mission Impact',
          onClick: () => {
            // Could show mission impact analysis
            console.log('Show mission impact analysis');
          },
          ariaLabel: 'View mission impact analysis'
        }
      ]
    });
  }, [notify]);

  const notifyCommStatus = useCallback((status: 'degraded' | 'restored' | 'lost', details: string) => {
    const severity = status === 'lost' ? 'critical' : status === 'degraded' ? 'warning' : 'info';
    const title = status === 'lost' ? 'Communication Lost' : 
                  status === 'degraded' ? 'Communication Degraded' : 
                  'Communication Restored';
    
    return notify({
      severity,
      title,
      message: details,
      source: 'Communications',
      actions: status !== 'restored' ? [
        {
          label: 'Backup Systems',
          onClick: () => {
            console.log('Activate backup communication systems');
          },
          ariaLabel: 'Activate backup communication systems'
        }
      ] : undefined
    });
  }, [notify]);

  return {
    notify,
    notifyInfo,
    notifyWarning,
    notifyCritical,
    notifyHazardDetected,
    notifySystemStatus,
    notifyAIAnalysis,
    notifyTrajectoryChange,
    notifyCommStatus
  };
}

// Legacy hook compatibility
export function useNotify(options: NotificationOptions) {
  const { notify } = useNotifications();
  return useCallback(() => notify(options), [notify, options]);
}

export function useBanner({ message, title = 'Notice', source = 'system' }: { 
  message: string; 
  title?: string; 
  source?: string; 
}) {
  const { notifyWarning } = useNotifications();
  return useCallback(() => notifyWarning(title, message, { source }), [notifyWarning, title, message, source]);
}

export function useAcknowledge(id: string) {
  const { acknowledge } = useNotificationStore();
  return useCallback(() => acknowledge(id), [acknowledge, id]);
}
