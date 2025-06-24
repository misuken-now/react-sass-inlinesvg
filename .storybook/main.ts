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
      output: {
        ...config.output,
        assetPrefix: "./",
        chunkFilename: "[contenthash].chunk.js",
        // NOTE: 静的ファイルをiframe.htmlと同じディレクトリに出力する
        // こうしないと、CSSからのsvg、画像、フォント類の相対パスが解決できなくなるため
        distPath: {
          ...config.output?.distPath,
          js: "./",
          jsAsync: "./",
          css: "./",
          cssAsync: "./",
          svg: "./",
          font: "./",
          wasm: "./",
          image: "./",
          media: "./",
          assets: "./",
        },
      },
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
