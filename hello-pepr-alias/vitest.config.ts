import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["capabilities/**/*.e2e.test.ts"],
    exclude: ["node_modules/**", "dist", "coverage"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["capabilities/**/*.e2e.test.ts"],
      exclude: ["dist", "node_modules/**"],
    },

    hookTimeout: 10000,
  },
});
