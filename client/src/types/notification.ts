export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

export interface Notification {
  id: string;
  time: number;
  severity: NotificationSeverity;
  title: string;
  message: string; // The human-readable message
  source: string; // subsystem/source e.g., 'comms', 'simulation', 'hazard'
  acknowledged: boolean; // requires explicit user ack when critical
  relatedLogId?: number | string; // link to Decision Log entry id
  actions?: NotificationAction[]; // optional extra actions like Undo/View
}

export interface NotificationStore {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'time' | 'acknowledged'>) => Notification; // returns created
  acknowledge: (id: string) => void;
  bulkAcknowledge: (ids: string[]) => void;
  removeNotification: (id: string) => void;
  filter: (severity?: NotificationSeverity) => Notification[];
}
