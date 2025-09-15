import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🚀 ODIN Navigator Starting...");
console.log("Environment:", {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY ? `Configured (${import.meta.env.VITE_GROQ_API_KEY.slice(0, 10)}...)` : 'Missing'
});

const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (!rootElement) {
  console.error("❌ Could not find root element!");
  document.body.innerHTML = `
    <div style="padding: 20px; background: #0B0E1A; color: #FFFFFF; font-family: Arial;">
      <h1>🚨 ODIN System Error</h1>
      <p>Root element not found in DOM</p>
      <button onclick="location.reload()">Retry</button>
    </div>
  `;
} else {
  console.log("✅ Creating React root...");
  try {
    const root = createRoot(rootElement);
    console.log("✅ React root created, rendering app...");
    root.render(<App />);
    console.log("✅ App rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #0B0E1A; color: #FFFFFF; font-family: Arial;">
        <h1>🚨 ODIN Render Error</h1>
        <p>Failed to initialize React application</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error}</pre>
        </details>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}
