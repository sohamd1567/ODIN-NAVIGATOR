import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, Info, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { useNotificationStore } from '../context/NotificationContext';
import { Notification, NotificationSeverity } from '../types/notification';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface NotificationItemProps {
  notification: Notification;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onViewDetails: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onAcknowledge,
  onDismiss,
  onViewDetails
}) => {
  const getSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'info':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`border-l-4 p-4 rounded-lg shadow-md ${getSeverityColor(notification.severity)} relative`}
      role="alert"
      aria-live={notification.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        {getSeverityIcon(notification.severity)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {notification.title}
            </h4>
            <Badge variant="outline" className="text-xs">
              {notification.severity.toUpperCase()}
            </Badge>
            {notification.source && (
              <Badge variant="secondary" className="text-xs">
                {notification.source}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>
          <div className="text-xs text-muted-foreground mb-3">
            {new Date(notification.time).toLocaleString()}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {notification.actions?.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={action.onClick}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="default"
              onClick={onAcknowledge}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Acknowledge
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewDetails}
              className="text-xs"
            >
              Details
            </Button>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

interface NotificationManagerProps {
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableSound?: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxVisible = 5,
  position = 'top-right',
  enableSound = true
}) => {
  const { notifications, acknowledge, removeNotification, bulkAcknowledge } = useNotificationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Filter and sort notifications
  const unacknowledged = notifications.filter(n => !n.acknowledged);
  const sortedNotifications = unacknowledged.sort((a, b) => {
    // Priority: critical > warning > info
    const severityOrder = { critical: 3, warning: 2, info: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    // Then by time (newest first)
    return b.time - a.time;
  });

  const visibleNotifications = isExpanded 
    ? sortedNotifications 
    : sortedNotifications.slice(0, maxVisible);

  const criticalCount = unacknowledged.filter(n => n.severity === 'critical').length;
  const warningCount = unacknowledged.filter(n => n.severity === 'warning').length;
  const totalCount = unacknowledged.length;

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Sound notification effect
  useEffect(() => {
    if (soundEnabled && unacknowledged.length > 0) {
      const latestNotification = sortedNotifications[0];
      if (latestNotification && Date.now() - latestNotification.time < 1000) {
        // Play sound for notifications less than 1 second old
        try {
          const audio = new Audio();
          if (latestNotification.severity === 'critical') {
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUAjqm6+DLeyccHm23+dyrYRQBKq3i67V1IAsfkM3x1n0jAyN9xvFjaScoN2+z9d6VPQ';
          } else if (latestNotification.severity === 'warning') {
            audio.src = 'data:audio/wav;base64,UklGRuQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcAEAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUAjqm6+DLeyccHm23+dyrYRQBKq3i67V1IAsfkM3x1n0jAyN9xvEgX';
          } else {
            audio.src = 'data:audio/wav;base64,UklGRnwBAABXQVZFZm10IBAAAAABAAEAQCAAAEAgAAABAAgAZGF0YVgBAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUAjqm6+DLeyccHm23+dyrYRQBKq3i67V1';
          }
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignore errors if autoplay is blocked
        } catch (e) {
          console.warn('Could not play notification sound:', e);
        }
      }
    }
  }, [sortedNotifications.length, soundEnabled]);

  const handleAcknowledge = (notification: Notification) => {
    acknowledge(notification.id);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(null);
    }
  };

  const handleDismiss = (notification: Notification) => {
    removeNotification(notification.id);
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(null);
    }
  };

  const handleBulkAcknowledge = () => {
    const nonCriticalIds = unacknowledged
      .filter(n => n.severity !== 'critical')
      .map(n => n.id);
    bulkAcknowledge(nonCriticalIds);
  };

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    // Emit custom event for integration with other systems
    if (notification.relatedLogId) {
      const event = new CustomEvent('odin-scroll-to-log', {
        detail: { logId: notification.relatedLogId }
      });
      window.dispatchEvent(event);
    }
  };

  if (totalCount === 0) return null;

  return (
    <>
      <div className={`fixed ${getPositionClasses()} z-50 w-96 max-w-[90vw]`}>
        {/* Header with controls */}
        <div className="bg-background/95 backdrop-blur-sm border rounded-t-lg p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-semibold">Notifications</span>
              <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>
                {totalCount}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-7 w-7 p-0"
                title={`${soundEnabled ? 'Disable' : 'Enable'} sound notifications`}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              
              {totalCount > maxVisible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs"
                >
                  {isExpanded ? 'Collapse' : `+${totalCount - maxVisible}`}
                </Button>
              )}
              
              {unacknowledged.filter(n => n.severity !== 'critical').length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkAcknowledge}
                  className="text-xs"
                >
                  Ack All
                </Button>
              )}
            </div>
          </div>
          
          {/* Summary stats */}
          {totalCount > 0 && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {criticalCount > 0 && (
                <span className="text-red-500">
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-yellow-500">
                  {warningCount} Warning
                </span>
              )}
              <span>
                {unacknowledged.filter(n => n.severity === 'info').length} Info
              </span>
            </div>
          )}
        </div>

        {/* Notification list */}
        <div className="bg-background/95 backdrop-blur-sm border-x border-b rounded-b-lg max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {visibleNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                className="border-b last:border-b-0 p-3"
              >
                <NotificationItem
                  notification={notification}
                  onAcknowledge={() => handleAcknowledge(notification)}
                  onDismiss={() => handleDismiss(notification)}
                  onViewDetails={() => handleViewDetails(notification)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Detailed view modal */}
      {selectedNotification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedNotification.severity === 'critical' && (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  )}
                  {selectedNotification.severity === 'warning' && (
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  )}
                  {selectedNotification.severity === 'info' && (
                    <Info className="h-6 w-6 text-blue-500" />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedNotification.title}
                    </h2>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        {selectedNotification.severity.toUpperCase()}
                      </Badge>
                      {selectedNotification.source && (
                        <Badge variant="secondary">
                          {selectedNotification.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Message</h3>
                  <p className="text-muted-foreground">{selectedNotification.message}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Time:</span>
                      <div className="text-muted-foreground">
                        {new Date(selectedNotification.time).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Source:</span>
                      <div className="text-muted-foreground">
                        {selectedNotification.source || 'System'}
                      </div>
                    </div>
                    {selectedNotification.relatedLogId && (
                      <div>
                        <span className="font-medium">Related Log:</span>
                        <div className="text-muted-foreground">
                          #{selectedNotification.relatedLogId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedNotification.actions && selectedNotification.actions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Available Actions</h3>
                    <div className="flex gap-2 flex-wrap">
                      {selectedNotification.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={action.onClick}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleAcknowledge(selectedNotification)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
