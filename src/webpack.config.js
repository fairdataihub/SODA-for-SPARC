const path = require("path");
// const { merge } = require("webpack-merge")
// const base = require("./webpack.base.config");

const commonConfig = {
  mode: "development",
};

module.exports = [
  Object.assign(
    {
      target: "electron-main",
      entry: {
        main: "./main.js",
      },
      output: {
        filename: "bundleMain.js",
        path: __dirname,
      },
    },
    commonConfig
  ),
  Object.assign(
    {
      target: "electron-renderer",
      entry: {
        renderer: [
          "./scripts/others/renderer.js",
          "./scripts/others/tab-effects.js",
          "./scripts/organize-dataset/curate-functions.js",
          "./scripts/organize-dataset/organizeDS.js",
          "./scripts/metadata-files/datasetDescription.js",
          "./scripts/metadata-files/manifest.js",
          "./scripts/metadata-files/readme-changes.js",
          "./scripts/metadata-files/subjects-samples.js",
          "./scripts/metadata-files/submission.js",
          "./scripts/manage-dataset/manage-dataset.js",
          "./scripts/disseminate/disseminate.js",
          "./assets/nav.js",
        ],
      },
      output: {
        filename: "bundleRenderer.js",
        path: __dirname,
      },
    },
    commonConfig
  ),
];
