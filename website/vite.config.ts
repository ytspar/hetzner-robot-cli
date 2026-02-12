import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "/hetzner-cli/",
  build: {
    outDir: "dist",
  },
});
