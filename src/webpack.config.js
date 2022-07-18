const path = require("path");
// const { merge } = require("webpack-merge")
// const base = require("./webpack.base.config");

module.exports = {
  target: "node",
  mode: "development",
  entry: {
    main: "./main.js",
    renderer: ["./scripts/others/renderer.js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "distBundle"),
  },
};
