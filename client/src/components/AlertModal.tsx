import React, { useEffect, useRef } from 'react';
import { Notification } from '../types/notification';

interface AlertModalProps {
  notification: Notification;
  onAcknowledge: () => void;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ notification, onAcknowledge, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    lastFocused.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Trap focus
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastFocused.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      aria-describedby="alert-desc"
      aria-live="assertive"
      tabIndex={-1}
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ outline: 'none' }}
    >
      <div className="bg-white rounded shadow-lg p-6 max-w-md w-full" style={{ outline: 'none' }}>
        <h2 id="alert-title" className="text-lg font-bold mb-2">{notification.title}</h2>
  <div id="alert-desc" className="mb-4">{notification.message}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onAcknowledge}
            className="bg-blue-600 text-white px-4 py-2 rounded focus:outline focus:outline-2 focus:outline-blue-800"
            aria-label="Acknowledge alert"
          >
            Acknowledge
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded focus:outline focus:outline-2 focus:outline-blue-800"
            aria-label="Close alert dialog"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
