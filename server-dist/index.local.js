import { createApp } from "./app";
import { setupVite, log } from "./vite";
(async () => {
    const { app, server } = await createApp();
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
