import React, { useState } from 'react';
import { useNotificationStore } from '../context/NotificationContext';
import { Toast } from './Toast';
import { Banner } from './Banner';
import { AlertModal } from './AlertModal';
import { Notification } from '../types/notification';

export const NotificationCenter: React.FC = () => {
  const { notifications, acknowledge, removeNotification, bulkAcknowledge } = useNotificationStore();
  const [modalId, setModalId] = useState<string | null>(null);
  const [bannerIds, setBannerIds] = useState<string[]>([]);
  const [sidePanelId, setSidePanelId] = useState<string | null>(null);

  // Show only unacknowledged notifications
  const unacknowledged = notifications.filter(n => !n.acknowledged);
  const infoToasts = unacknowledged.filter(n => n.severity === 'info');
  const warningBanners = unacknowledged.filter(n => n.severity === 'warning');
  const criticalAlerts = unacknowledged.filter(n => n.severity === 'critical');

  // Modal logic
  const modalNotification = criticalAlerts.find(n => n.id === modalId) || null;

  // Banner logic
  const dismissBanner = (id: string) => {
    setBannerIds(ids => [...ids, id]);
    removeNotification(id);
  };

  // Details logic
  const viewDetails = (n: Notification) => {
    if (n.severity === 'critical') setModalId(n.id);
    setSidePanelId(n.id);
    if (n.relatedLogId) {
      const ev = new CustomEvent('odin-scroll-to-log', { detail: { logId: n.relatedLogId } });
      window.dispatchEvent(ev);
    }
  };

  // Bulk acknowledge
  const handleBulkAcknowledge = () => {
    const ids = unacknowledged.filter(n => n.severity !== 'critical').map(n => n.id);
    bulkAcknowledge(ids);
  };

  return (
    <div aria-label="Notifications" role="feed" className="fixed top-4 right-4 z-50">
      {/* Bell icon and panel */}
      <button
        aria-label="Open notifications panel"
        className="bg-white rounded-full shadow p-2 mb-2 focus:outline focus:outline-2 focus:outline-blue-500"
        tabIndex={0}
        // TODO: open/close panel logic
      >
        <span role="img" aria-label="Notifications">🔔</span>
        {unacknowledged.length > 0 && (
          <span className="ml-1 bg-red-600 text-white rounded-full px-2 text-xs">{unacknowledged.length}</span>
        )}
      </button>
      {/* Feed/list */}
      <div className="bg-white rounded shadow-lg p-4 w-80 max-h-[60vh] overflow-y-auto" role="list">
        {unacknowledged.map(n => (
          <div key={n.id} role="listitem" className="mb-2 border-b pb-2 flex justify-between items-center">
            <div>
              <span className="font-bold">[{n.severity}]</span> {n.title}
              <div className="text-xs text-gray-500">{new Date(n.time).toLocaleString()} • {n.source}</div>
              <div className="text-xs text-gray-700 max-w-[18rem] truncate">{n.message}</div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => viewDetails(n)}
                className="underline text-blue-600 text-xs focus:outline focus:outline-2 focus:outline-blue-500"
                aria-label={`View details for ${n.title}`}
              >
                Details
              </button>
              {!n.acknowledged && (
                <button
                  onClick={() => acknowledge(n.id)}
                  className="text-green-700 text-xs focus:outline focus:outline-2 focus:outline-green-700"
                  aria-label={`Acknowledge ${n.title}`}
                >
                  ✓
                </button>
              )}
            </div>
          </div>
        ))}
        {unacknowledged.length > 0 && (
          <button
            onClick={handleBulkAcknowledge}
            className="mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs focus:outline focus:outline-2 focus:outline-blue-500"
            aria-label="Bulk acknowledge non-critical notifications"
          >
            Bulk Acknowledge
          </button>
        )}
      </div>
      {/* Toasts */}
      {infoToasts.map(n => (
        <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
      ))}
      {/* Banners */}
      {warningBanners.filter(n => !bannerIds.includes(n.id)).map(n => (
        <Banner
          key={n.id}
          notification={n}
          onDismiss={() => dismissBanner(n.id)}
          onViewDetails={() => viewDetails(n)}
        />
      ))}
      {/* Modal */}
      {modalNotification && (
        <AlertModal
          notification={modalNotification}
          onAcknowledge={() => {
            acknowledge(modalNotification.id);
            setModalId(null);
          }}
          onClose={() => setModalId(null)}
        />
      )}
      {/* Side Panel Overlay */}
      {sidePanelId && (() => {
        const n = notifications.find(x => x.id === sidePanelId)!;
        return (
          <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setSidePanelId(null)}>
            <aside className="absolute right-0 top-0 h-full w-[480px] bg-white shadow-xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{n.title}</h3>
                <button aria-label="Close details" onClick={() => setSidePanelId(null)}>×</button>
              </div>
              <div className="text-xs text-gray-600 mb-2">{new Date(n.time).toLocaleString()} • {n.source} • {n.severity}</div>
              <p className="text-sm mb-3">{n.message}</p>
              {/* Tabs */}
              <div className="mb-3 border-b">
                <nav className="flex gap-3 text-xs" aria-label="Notification details tabs">
                  <button className="px-2 py-1 border-b-2 border-blue-600" aria-selected>Related Telemetry</button>
                  <button className="px-2 py-1">Past Alerts</button>
                </nav>
              </div>
              {/* Related Telemetry: show scoped window around notification time (±2h) */}
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Related Decision Log</div>
                {n.relatedLogId ? (
                  <button className="underline text-blue-600 text-xs" onClick={() => {
                    const ev = new CustomEvent('odin-scroll-to-log', { detail: { logId: n.relatedLogId } });
                    window.dispatchEvent(ev);
                  }}>Jump to log #{String(n.relatedLogId)}</button>
                ) : <div className="text-xs text-gray-500">None</div>}
              </div>
              <div className="text-xs text-gray-500">TODO: render comms mini-charts scoped to ±2h around the notification.</div>
              {/* Past Alerts */}
              <div className="mt-3">
                <div className="text-xs font-semibold mb-1">Past Alerts</div>
                <div className="text-xs text-gray-600 max-h-40 overflow-y-auto">
                  {notifications.filter(x => x.source === n.source && x.id !== n.id).map(x => (
                    <button key={x.id} className="w-full text-left border-b py-1" onClick={() => {
                      const ev = new CustomEvent('odin-scroll-to-log', { detail: { logId: x.relatedLogId } });
                      window.dispatchEvent(ev);
                    }}>
                      <div className="font-medium">{x.title}</div>
                      <div className="text-[10px] text-gray-500">{new Date(x.time).toLocaleString()} • {x.severity}</div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        );
      })()}
    </div>
  );
};
