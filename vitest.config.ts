import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
    },
    alias: {
      "~/testing-utils": path.resolve(__dirname, "./vitest/utils"),
    },
  },
});
