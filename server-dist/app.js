import express from "express";
import { registerRoutes } from "./routes";
import { WebSocketServer } from "ws";
import { serveStatic, log } from "./vite";
export async function createApp() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use((req, res, next) => {
        const start = Date.now();
        const path = req.path;
        let capturedJsonResponse = undefined;
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
    const server = await registerRoutes(app);
    // Setup WebSocket telemetry on the same HTTP server (only in local dev)
    if (process.env.LOCAL_DEV === '1') {
        const wss = new WebSocketServer({ noServer: true });
        // Upgrade handler for /ws
        server.on('upgrade', (req, socket, head) => {
            const { url } = req;
            if (!url || !url.startsWith('/ws')) {
                socket.destroy();
                return;
            }
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        });
        // Broadcast a synthetic telemetry stream
        wss.on('connection', (ws) => {
            let t = 0;
            const id = 'mission-1';
            const tick = setInterval(() => {
                t += 0.01;
                if (t > 1)
                    t = 0;
                const hazards = Array.from({ length: 3 }, (_, i) => ({
                    id: `hz-${i}`,
                    x: 80 + Math.random() * 400,
                    y: 80 + Math.random() * 300,
                    r: 8 + Math.random() * 18,
                    type: Math.random() > 0.6 ? 'asteroid' : (Math.random() > 0.5 ? 'debris' : 'radiation')
                }));
                const msg = { type: 'telemetry', id, t, hazards, ts: Date.now() };
                try {
                    ws.send(JSON.stringify(msg));
                }
                catch { /* noop */ }
            }, 200);
            ws.on('close', () => clearInterval(tick));
        });
    }
    else {
        // For Vercel deployment, add a basic /ws endpoint that returns connection info
        app.get('/ws', (req, res) => {
            res.json({
                message: 'WebSocket endpoint - connection handling depends on platform',
                platform: 'vercel',
                timestamp: Date.now()
            });
        });
    }
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        try {
            log(`[error] ${status} ${message}`, "express");
            if (process.env.NODE_ENV === "development" && err?.stack) {
                console.error(err.stack);
            }
        }
        catch { }
        if (!res.headersSent) {
            res.status(status).json({ message });
        }
    });
    // Serve static files in production
    if (process.env.NODE_ENV === "production") {
        serveStatic(app);
    }
    return { app, server };
}
// Global safety nets
process.on("unhandledRejection", (reason) => {
    try {
        const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
        log(`[unhandledRejection] ${msg}`, "server");
    }
    catch { }
});
process.on("uncaughtException", (err) => {
    try {
        log(`[uncaughtException] ${err?.stack || err?.message || String(err)}`, "server");
    }
    catch { }
});
