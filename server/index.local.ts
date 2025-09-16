import { createApp } from "./app";
import { setupVite, log } from "./vite";
import { createServer } from "http";
import { WebSocketServer } from "ws";

(async () => {
  // Only run if explicitly in local development mode
  if (process.env.LOCAL_DEV !== '1') {
    log("LOCAL_DEV not set to '1', exiting local server");
    process.exit(0);
  }

  const app = await createApp();
  const server = createServer(app);

  // Setup WebSocket telemetry on the same HTTP server (only in local dev)
  const wss = new WebSocketServer({ noServer: true });
  type TelemetryMsg = { type: 'telemetry'; id: string; t: number; hazards?: Array<{ id: string; x: number; y: number; r: number; type: string }>; ts: number };

  // Upgrade handler for /ws
  server.on('upgrade', (req, socket, head) => {
    const { url } = req;
    if (!url || !url.startsWith('/ws')) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket as any, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // Broadcast a synthetic telemetry stream
  wss.on('connection', (ws) => {
    let t = 0;
    const id = 'mission-1';
    const tick = setInterval(() => {
      t += 0.01; if (t > 1) t = 0;
      const hazards = Array.from({ length: 3 }, (_, i) => ({
        id: `hz-${i}`,
        x: 80 + Math.random() * 400,
        y: 80 + Math.random() * 300,
        r: 8 + Math.random() * 18,
        type: Math.random() > 0.6 ? 'asteroid' : (Math.random() > 0.5 ? 'debris' : 'radiation')
      }));
      const msg: TelemetryMsg = { type: 'telemetry', id, t, hazards, ts: Date.now() };
      try { ws.send(JSON.stringify(msg)); } catch { /* noop */ }
    }, 200);
    ws.on('close', () => clearInterval(tick));
  });

  // Setup Vite dev middleware only in local development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "127.0.0.1"
  }, () => {
    log(`serving on http://127.0.0.1:${port}`);
  });
})();
