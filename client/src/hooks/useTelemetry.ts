import { useTelemetryStore, type TelemetryFrame } from '../store/telemetryStore';
import { useEffect, useRef } from 'react';

type Telemetry = { t: number; hazards?: Array<{ id: string; x: number; y: number; r: number; type: string }>; ts: number; id: string };

export default function useTelemetry(onFrame: (data: Telemetry) => void) {
  const addFrame = useTelemetryStore((s: { addFrame: (f: TelemetryFrame) => void }) => s.addFrame);
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg && msg.type === 'telemetry') { onFrame(msg); addFrame(msg); }
      } catch {}
    };
    const t = setInterval(() => { if (ws.readyState === ws.CLOSED) { try { ws.close(); } catch {} } }, 5000);
    return () => { clearInterval(t); try { ws.close(); } catch {} wsRef.current = null; };
  }, [onFrame]);
}
