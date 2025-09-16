import express from "express";
import { registerRoutes } from "./routes";
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
    // Register all routes
    await registerRoutes(app);
    // For Vercel deployment, add a basic /ws endpoint that returns connection info
    if (process.env.NODE_ENV === "production") {
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
    return app;
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
