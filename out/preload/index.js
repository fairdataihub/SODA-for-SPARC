"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const api = {
  homeDir: () => {
    return app.getPath("home");
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
    electron.contextBridge.exposeInMainWorld("os", {
      homedir: () => {
        return os.homedir();
      }
    });
    electron.contextBridge.exposeInMainWorld("fs", {
      existsSync: (targetPath) => {
        return fs.existsSync(targetPath);
      },
      mkdirSync: (targetDir, options) => {
        return fs.mkdirSync(targetDir, options);
      }
    });
    electron.contextBridge.exposeInMainWorld("path", {
      join: (...paths) => {
        return path.join(...paths);
      }
    });
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
