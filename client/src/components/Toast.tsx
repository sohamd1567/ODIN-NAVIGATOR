import React, { useEffect } from 'react';
import { Notification } from '../types/notification';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timeout = setTimeout(onClose, Math.max(3000, Math.min(8000, 3000 + notification.title.length * 50)));
    return () => clearTimeout(timeout);
  }, [onClose, notification.title.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      tabIndex={-1}
      className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3"
      style={{ minWidth: 280 }}
    >
      <div>
        <strong>{notification.title}</strong>
        <div>{notification.message}</div>
        {notification.actions?.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="ml-2 underline text-blue-300 focus:outline focus:outline-2 focus:outline-blue-500"
            aria-label={action.ariaLabel || action.label}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-4 text-gray-400 hover:text-white focus:outline focus:outline-2 focus:outline-blue-500"
      >
        ×
      </button>
    </div>
  );
};
