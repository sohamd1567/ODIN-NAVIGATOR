import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer plugin
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : []),
    // Disable runtime error overlay plugin
    // runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // esbuild optimization
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          vendor: ['react', 'react-dom'],
          // Three.js and 3D libraries
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          // Charts and data visualization
          charts: ['recharts', 'plotly.js-dist-min', 'react-plotly.js', 'd3'],
          // UI components
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          // TensorFlow (if not disabled)
          tf: ['@tensorflow/tfjs'],
        },
      },
    },
    // Increase chunk size warning limit since we're chunking
    chunkSizeWarningLimit: 800,
  },
  esbuild: {
    // Drop console and debugger statements in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Optimize for size
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  },
  server: {
    hmr: {
      overlay: false
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
