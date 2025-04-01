import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy API requests to the backend server during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true, // Recommended for most setups
        // Optionally rewrite path if needed, but likely not necessary here
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
