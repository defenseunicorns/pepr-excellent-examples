import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "hack/**/*.test.ts"],
    exclude: ["node_modules", "dist", "pepr/**", "src/templates/**", "coverage"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["dist", "dev/**"],
    },

    hookTimeout: 10000,
  },
});
