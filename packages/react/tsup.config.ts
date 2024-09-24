import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    auth: "src/auth/index.ts",
    firestore: "src/firestore/index.ts",
  },
  format: ["esm"],
  dts: true, // generates .d.ts files
  outDir: "dist",
  // splitting: false, // Disable code splitting to generate distinct files
  clean: true,
});
