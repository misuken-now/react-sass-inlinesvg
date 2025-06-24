import { StorybookConfig } from "storybook-react-rsbuild";

const { pluginNodePolyfill } = require("@rsbuild/plugin-node-polyfill");
const { pluginSass } = require("@rsbuild/plugin-sass");

const config: StorybookConfig = {
  framework: {
    name: "storybook-react-rsbuild",
    options: {},
  },
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  core: {
    // ログの邪魔になるので無効化
    // https://storybook.js.org/docs/configure/telemetry
    disableTelemetry: true,
  },
  addons: ["@storybook/addon-essentials", "storybook-addon-rslib"],
  rsbuildFinal: config => {
    return {
      ...config,
      plugins: [
        ...(config.plugins ?? []),
        pluginNodePolyfill(),
        pluginSass({
          sassLoaderOptions: {
            api: "modern-compiler",
            implementation: require("sass-embedded"),
          },
        }),
      ],
    };
  },
  typescript: {
    check: true,
  },
};

export default config;
