import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  /*
   * Prevent Vite HMR from triggering a full page reload when the
   * browser tab is backgrounded and returned to. The WebSocket
   * connection drops during background; a long timeout lets it
   * reconnect gracefully instead of forcing a hard reload.
   */
  server: {
    hmr: {
      timeout: 30000,
    },
  },
});