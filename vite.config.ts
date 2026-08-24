import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/ai-history-ar/" : "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
  },
});
