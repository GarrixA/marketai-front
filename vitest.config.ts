import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 15_000,
    setupFiles: "tests/setup.tsx",
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      // Report all source files, including untested ones (0% coverage).
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
    },
  },
});
