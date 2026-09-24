import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: [
        "src/domain/**/*.ts",
        "src/lib/errors.ts",
        "src/lib/http.ts",
        "src/lib/safety.ts",
        "src/lib/result.ts",
        "src/lib/pagination.ts",
        "src/lib/time.ts",
        "src/lib/settings/secrets.ts",
        "src/lib/services/catalog-map.ts",
        "src/lib/db/health-layer.ts",
        "src/domain/db-url.ts",
        "src/domain/sql-safety.ts",
        "src/lib/money/profile.ts",
        "src/lib/locale/messages-fa.ts",
        "src/adapters/registry.ts",
        "src/adapters/payments/**/*.ts",
        "src/adapters/sms/**/*.ts",
        "src/adapters/carriers/**/*.ts",
        "src/config/**/*.ts",
      ],
      exclude: ["src/domain/**/*.test.ts", "src/lib/**/*.test.ts", "src/adapters/**/*.test.ts"],
      thresholds: {
        lines: 98,
        functions: 98,
        statements: 98,
        branches: 93,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
