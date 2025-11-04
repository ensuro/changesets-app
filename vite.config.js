import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: "automatic",
    loader: "jsx",
    include: /src\/.*\.(js|jsx)$/,
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
    esbuildOptions: {
      loader: { ".js": "jsx", ".jsx": "jsx" },
      define: { global: "globalThis" },
    },
  },
  server: {
    host: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      "Content-Security-Policy": "frame-ancestors 'self' https://app.safe.global;",
    },
  },
});
