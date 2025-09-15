import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { WebSocketServer } from "ws";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup WebSocket telemetry on the same HTTP server
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Log the error but do not crash the dev server
    try {
      log(`[error] ${status} ${message}`, "express");
      if (process.env.NODE_ENV === "development" && err?.stack) {
        console.error(err.stack);
      }
    } catch {}

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    // Note: do not rethrow here; allow the server to continue running
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "127.0.0.1"
  }, () => {
    log(`serving on http://127.0.0.1:${port}`);
  });
})();

// Global safety nets to avoid hard exits during development
process.on("unhandledRejection", (reason) => {
  try {
    const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
    log(`[unhandledRejection] ${msg}`, "server");
  } catch {}
});

process.on("uncaughtException", (err) => {
  try {
    log(`[uncaughtException] ${err?.stack || err?.message || String(err)}`, "server");
  } catch {}
});
