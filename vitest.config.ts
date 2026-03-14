import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
      "@": resolve(__dirname, "./src"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@helpers": resolve(__dirname, "./src/helpers"),
      "@components": resolve(__dirname, "./src/components"),
      "@static": resolve(__dirname, "./src/static"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    env: {
      NODE_ENV: "test",
    },
    root: ".",
    include: ["tests/**/*.{test,spec}.ts"],
    exclude: ["node_modules", ".nuxt", "dist"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/services/**", "src/helpers/**", "src/@schemas/**"],
      exclude: ["src/**/*.vue", "src/components/**"],
    },
    typecheck: {
      tsconfig: "./tsconfig.vitest.json",
    },
  },
});
