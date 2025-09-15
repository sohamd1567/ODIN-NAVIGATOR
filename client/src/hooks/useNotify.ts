import { NotificationSeverity, NotificationAction } from '../types/notification';
import { useNotificationStore } from '../context/NotificationContext';

export function useNotify({ severity, title, message, actions, source, relatedLogId }: {
  severity: NotificationSeverity;
  title: string;
  message: string;
  actions?: NotificationAction[];
  source: string;
  relatedLogId?: number | string;
}) {
  const { addNotification } = useNotificationStore();
  return () => {
    addNotification({ severity, title, message, actions, source, relatedLogId });
  };
}

export function useBanner({ message, title = 'Notice', source = 'system' }: { message: string; title?: string; source?: string; }) {
  const { addNotification } = useNotificationStore();
  return () => addNotification({ severity: 'warning', title, message, source });
}

export function useAcknowledge(id: string) {
  const { acknowledge } = useNotificationStore();
  return () => acknowledge(id);
}
