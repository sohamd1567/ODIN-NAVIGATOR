import React from 'react';
import { Notification } from '../types/notification';

interface BannerProps {
  notification: Notification;
  onDismiss: () => void;
  onViewDetails: () => void;
}

export const Banner: React.FC<BannerProps> = ({ notification, onDismiss, onViewDetails }) => (
  <div
    role="status"
    aria-live="polite"
    tabIndex={-1}
    className="fixed top-0 left-0 w-full z-40 bg-yellow-100 text-yellow-900 px-6 py-3 flex items-center justify-between shadow"
    style={{ minHeight: 48 }}
  >
    <div>
      <strong>{notification.title}</strong>
      <span className="ml-2">{notification.message}</span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onViewDetails}
        className="underline text-yellow-900 focus:outline focus:outline-2 focus:outline-yellow-700"
        aria-label="View details"
      >
        View details
      </button>
      <button
        onClick={onDismiss}
        className="ml-2 text-yellow-700 hover:text-yellow-900 focus:outline focus:outline-2 focus:outline-yellow-700"
        aria-label="Dismiss banner"
      >
        ×
      </button>
    </div>
  </div>
);
