import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port and will fail if it's taken
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@presentation": path.resolve(__dirname, "src/presentation"),
      "@application": path.resolve(__dirname, "src/application"),
      "@domain": path.resolve(__dirname, "src/domain"),
      "@repository": path.resolve(__dirname, "src/repository"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@design-system": path.resolve(__dirname, "src/design-system"),
      "@i18n": path.resolve(__dirname, "src/i18n"),
    },
  },
  build: {
    // Tauri uses Chromium on Windows/Linux and WebKit on macOS
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
