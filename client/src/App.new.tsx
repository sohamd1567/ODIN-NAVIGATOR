import React from "react";
import "./styles/odin-theme.css";

function App() {
  console.log("🎯 App component rendering...");
  
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-6 neon-text">
          🚀 ODIN Navigator - System Online
        </h1>
        <div className="glass-panel p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-secondary mb-4">Mission Status</h2>
          <div className="space-y-3">
            <p className="text-green-400">✅ React Application: Running</p>
            <p className="text-green-400">✅ TypeScript: Compiled</p>
            <p className="text-green-400">✅ Vite Dev Server: Active</p>
            <p className="text-green-400">✅ CSS Styling: Applied</p>
            <p className="text-green-400">✅ Environment Variables: {import.meta.env.VITE_GROQ_API_KEY ? 'Loaded' : 'Missing'}</p>
            <p className="text-primary font-semibold">🎯 Status: Ready for Full System Integration</p>
          </div>
          <button 
            onClick={() => {
              console.log("🔄 Testing React interactivity...");
              alert("React interactivity confirmed! ✅");
            }}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Test React Interactivity
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
