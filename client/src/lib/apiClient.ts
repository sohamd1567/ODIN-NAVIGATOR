import { useMission } from '@/context/MissionContext';
import { useNotificationStore } from '@/context/NotificationContext';

export type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';

export interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  critical?: boolean; // if true, show AlertModal; else toast
  label?: string; // for logs
}

export function useApiClient() {
  const { addLog } = useMission();
  const { addNotification } = useNotificationStore();

  async function request<T>(url: string, opts: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, critical, label } = opts;
    const started = Date.now();
    const correlationId = `${started}-${Math.random().toString(36).slice(2)}`;
    addLog({ id: started, timestamp: new Date(started).toISOString().replace('T',' ').substring(0,19), type: 'API_REQUEST', data: { url, method, headers: Object.keys(headers).length ? headers : undefined, body: body ? '[omitted]' : undefined, correlationId }, subsystem: 'api' });
    try {
      const res = await fetch(url, { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
      const duration = Date.now() - started;
      const text = await res.text();
      const json = (() => { try { return JSON.parse(text); } catch { return text as any; }})();
      addLog({ id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'API_RESPONSE', data: { url, status: res.status, durationMs: duration, correlationId }, subsystem: 'api' });
      if (!res.ok) {
        const msg = typeof json === 'string' ? json : json?.message || 'Request failed';
        addNotification({ severity: critical ? 'critical' : 'warning', title: label || 'Request error', message: `${msg} (code ${res.status})`, source: 'api' });
        throw new Error(msg);
      }
      return json as T;
    } catch (err: any) {
      if (critical) {
        addNotification({ severity: 'critical', title: label || 'Critical error', message: String(err), source: 'api' });
      } else {
        addNotification({ severity: 'warning', title: label || 'Non-critical error', message: String(err), source: 'api' });
      }
      throw err;
    }
  }

  return { request } as const;
}
