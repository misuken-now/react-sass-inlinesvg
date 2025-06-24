import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    { format: "esm", syntax: "es2021", dts: true },
    { format: "cjs", syntax: "es2021" },
  ],
  tools: {
    lightningcssLoader: false,
    cssLoader: {
      esModule: false,
      modules: {
        exportLocalsConvention: "camelCase",
        localIdentName: "___[local]___[hash:base64:5]",
        auto: resource => resource.endsWith(".scss"),
      },
    },
  },
});
