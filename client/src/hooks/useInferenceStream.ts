import { useEffect, useRef, useState } from 'react';
import { useMission } from '@/context/MissionContext';

export type InferenceStatus = 'live' | 'partial' | 'fallback' | 'idle';

interface StreamMsg {
  type: 'partial' | 'final' | 'tick' | 'error';
  stage?: string; // e.g., 'engine', 'nav', 'comms'
  etaSec?: number;
  data?: any;
  error?: string;
}

// TODO: endpoint via env/config
const WS_URL = '/ws/inference';

export function useInferenceStream(jobId: string | null) {
  const [status, setStatus] = useState<InferenceStatus>('idle');
  const [stageETAs, setStageETAs] = useState<Record<string, number>>({});
  const [lastData, setLastData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { addLog } = useMission();
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const ws = new WebSocket(WS_URL + `?job=${encodeURIComponent(jobId)}`);
    wsRef.current = ws;
    setStatus('live');
  startRef.current = Date.now();
  addLog({ id: startRef.current, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'INFER_START', data: { jobId } });

    ws.onmessage = (ev) => {
      try {
        const msg: StreamMsg = JSON.parse(ev.data);
        if (msg.type === 'partial') {
          setStatus('partial');
          if (msg.stage && typeof msg.etaSec === 'number') setStageETAs((m) => ({ ...m, [msg.stage!]: msg.etaSec! }));
          if (msg.data) setLastData(msg.data);
          addLog({ id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'INFER_PARTIAL', data: { jobId, stage: msg.stage, etaSec: msg.etaSec } });
        } else if (msg.type === 'final') {
          setStatus('live');
          setStageETAs({});
          if (msg.data) setLastData(msg.data);
          const end = Date.now();
          const dur = startRef.current ? end - startRef.current : undefined;
          addLog({ id: end, timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'INFER_FINAL', data: { jobId }, durationMs: dur });
          ws.close();
        } else if (msg.type === 'tick') {
          if (msg.stage && typeof msg.etaSec === 'number') setStageETAs((m) => ({ ...m, [msg.stage!]: msg.etaSec! }));
        } else if (msg.type === 'error') {
          setStatus('fallback');
          addLog({ id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'INFER_ERROR', data: { jobId, error: msg.error }, severity: 'warning' });
        }
      } catch (e: any) {
        setStatus('fallback');
        addLog({ id: Date.now(), timestamp: new Date().toISOString().replace('T',' ').substring(0,19), type: 'INFER_ERROR', data: { jobId, error: String(e) }, severity: 'warning' });
      }
    };
    ws.onerror = () => {
      setStatus('fallback');
    };
    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => ws.close();
  }, [jobId, addLog]);

  return { status, stageETAs, lastData } as const;
}
