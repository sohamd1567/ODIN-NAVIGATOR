import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Notification, NotificationSeverity, NotificationStore, NotificationAction } from '../types/notification';
import { useMission } from '@/context/MissionContext';

const NotificationContext = createContext<NotificationStore | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastFocused = useRef<HTMLElement | null>(null);
  const { addLog, addMissionEvent } = useMission();

  const genId = () => (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'acknowledged'>) => {
    const id = genId();
    const time = Date.now();
    const created: Notification = { ...n, id, time, acknowledged: false };
    setNotifications((prev) => [...prev, created]);
    // Link to Decision Log and Timeline
    const entryId = Date.now();
    addLog({
      id: entryId,
      timestamp: new Date(time).toISOString().replace('T', ' ').substring(0, 19),
      type: n.severity === 'critical' ? 'ALERT' : n.severity === 'warning' ? 'WARNING' : 'INFO',
      data: { title: n.title, message: n.message, source: n.source, severity: n.severity },
    });
    addMissionEvent({ id: `notif-${entryId}`, ts: time, type: 'note', label: `${n.severity.toUpperCase()}: ${n.title}`, meta: { flash: true, logId: entryId } });
    // backfill relatedLogId for this notification
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, relatedLogId: entryId } : x)));
    return { ...created, relatedLogId: entryId } as Notification;
  }, [addLog, addMissionEvent]);

  const acknowledge = useCallback((id: string) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n));
    const n = notifications.find(x => x.id === id);
    if (n && !n.acknowledged) {
      const time = Date.now();
      addLog({ id: time, timestamp: new Date(time).toISOString().replace('T',' ').substring(0,19), type: 'ACK', data: { title: n.title, source: n.source } });
      addMissionEvent({ id: `ack-${time}`, ts: time, type: 'note', label: `Ack: ${n.title}` });
    }
  }, [notifications, addLog, addMissionEvent]);

  const bulkAcknowledge = useCallback((ids: string[]) => {
    setNotifications((prev) => prev.map(n => ids.includes(n.id) ? { ...n, acknowledged: true } : n));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  const filter = useCallback((severity?: NotificationSeverity) => {
    return severity ? notifications.filter(n => n.severity === severity) : notifications;
  }, [notifications]);

  const value: NotificationStore = {
    notifications,
    addNotification,
    acknowledge,
    bulkAcknowledge,
    removeNotification,
    filter,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotificationStore() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationStore must be used within NotificationProvider');
  return ctx;
}
