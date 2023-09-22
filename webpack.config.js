import { defineConfig } from "electron-vite";
import { resolve } from "path";

// electron.vite.config.js
module.exports = {
  entry: {
    main: resolve(__dirname, "main.js"),
  },
  preload: {
    // vite config options
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, "preload.js"),
        },
      },
    },
    renderer: {
      // vite config options
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, "index.html"),
          },
        },
      },
    },
  },
};
