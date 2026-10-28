import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
            return "react-vendor";
          }
          if (id.includes("/@tanstack/")) {
            return "tanstack-vendor";
          }
          if (id.includes("/lexical/") || id.includes("/@lexical/")) {
            return "lexical-vendor";
          }
          if (
            id.includes("/@radix-ui/") ||
            id.includes("/framer-motion/") ||
            id.includes("/lucide-react/") ||
            id.includes("/@floating-ui/")
          ) {
            return "ui-vendor";
          }
          if (
            id.includes("/socket.io-client/") ||
            id.includes("/engine.io-client/") ||
            id.includes("/lodash/") ||
            id.includes("/dayjs/") ||
            id.includes("/zustand/") ||
            id.includes("/immer/") ||
            id.includes("/blurhash/")
          ) {
            return "utils-vendor";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
