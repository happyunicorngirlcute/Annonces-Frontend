module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxRuntime: "automatic" }],
    ],

    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@/assets": "./assets",
            "@": "./src",
          },
          extensions: [
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
            ".json",
            ".css",
          ],
        },
      ],

      // MUST ALWAYS BE LAST
      "react-native-reanimated/plugin",
    ],
  };
};