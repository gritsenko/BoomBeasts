import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/BoomBeasts/" : "/",
  server: {
    port: 8080,
    open: true,
  },
}));
