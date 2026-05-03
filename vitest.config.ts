import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/utils/__tests__/setup.ts",
    exclude: ["node_modules", ".next", "out", "src-tauri"],
  },
});
