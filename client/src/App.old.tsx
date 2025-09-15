import React from "react";
import "./styles/odin-theme.css";

function App() {
  console.log("🎯 Minimal App rendering...");
  
  return (
    <div style={{ 
      padding: '20px', 
      background: '#0B0E1A', 
      color: '#FFFFFF', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif' 
    }}>
      <h1>� ODIN Navigator - DEBUG MODE</h1>
      <p>Basic React app is working!</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#161B2E', 
        borderRadius: '8px',
        border: '1px solid #00D9FF'
      }}>
        <p>✅ React: Working</p>
        <p>✅ CSS: Loading</p>
        <p>✅ Server: Connected</p>
        <p>⚠️ Testing individual components...</p>
      </div>
    </div>
  );
}

export default App;
