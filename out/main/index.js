"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const ElectronLog = require("electron-log");
require("axios");
const fp = require("find-free-port");
const node_child_process = require("node:child_process");
const fs = require("fs");
const icon = path.join(__dirname, "../../resources/icon.png");
electron.ipcMain.handle("get-app-path", async (event, arg) => {
  return electron.app.getPath(arg);
});
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    nodeIntegration: true,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(async () => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  await createPyProc();
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "../src/pyflask";
const PY_FLASK_MODULE = "app";
let PORT = 4242;
const portRange = 100;
let pyflaskProcess = null;
const guessPackaged = () => {
  const windowsPath = path.join(process.resourcesPath, PY_FLASK_DIST_FOLDER);
  ElectronLog.info("Windows path: " + windowsPath);
  const unixPath = path.join(process.resourcesPath, PY_FLASK_MODULE);
  if (process.platform === "darwin" || process.platform === "linux") {
    if (fs.existsSync(unixPath)) {
      return true;
    } else {
      return false;
    }
  }
  if (process.platform === "win32") {
    if (fs.existsSync(windowsPath)) {
      ElectronLog.info("App is packaged returning true [ Windows ]");
      return true;
    } else {
      return false;
    }
  }
};
const getScriptPath = () => {
  if (!guessPackaged()) {
    ElectronLog.info("App is not packaged returning path: ");
    ElectronLog.info(path.join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"));
    return path.join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  }
  if (process.platform === "win32") {
    const winPath = path.join(process.resourcesPath, PY_FLASK_DIST_FOLDER, PY_FLASK_MODULE + ".exe");
    ElectronLog.info("App is packaged [Windows]; Path to server executable: " + winPath);
    return winPath;
  } else {
    const unixPath = path.join(process.resourcesPath, PY_FLASK_MODULE);
    ElectronLog.info("App is packaged [ Unix ]; Path to server executable: " + unixPath);
    return unixPath;
  }
};
const createPyProc = async () => {
  let script = getScriptPath();
  ElectronLog.info(`Path to server executable: ${script}`);
  if (fs.existsSync(script)) {
    ElectronLog.info("Server exists at specified location", script);
  } else {
    ElectronLog.info("Server doesn't exist at specified location");
  }
  fp(PORT, PORT + portRange).then(([freePort]) => {
    let port = freePort;
    if (guessPackaged()) {
      let sessionServerOutput = "";
      ElectronLog.info(`Starting server on port ${port}`);
      pyflaskProcess = node_child_process.execFile(script, [port], (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          ElectronLog.error(error);
          throw error;
        }
        console.log(stdout);
      });
      pyflaskProcess.stdout.on("data", (data) => {
        const logOutput = `[pyflaskProcess output] ${data.toString()}`;
        sessionServerOutput += `${logOutput}`;
      });
      pyflaskProcess.stderr.on("data", (data) => {
        const logOutput = `[pyflaskProcess stderr] ${data.toString()}`;
        sessionServerOutput += `${logOutput}`;
      });
      pyflaskProcess.on("close", (code) => {
        ElectronLog.info(`child process exited with code ${code}`);
        ElectronLog.info("Server output during session found below:");
        ElectronLog.info(sessionServerOutput);
      });
    } else {
      ElectronLog.info("Starting server on port aka wrong place " + port);
      pyflaskProcess = node_child_process.spawn("python", [script, port], {
        stdio: "ignore"
      });
      pyflaskProcess.on("data", function() {
        console.log("pyflaskProcess successfully started");
      });
      pyflaskProcess.on("error", function(err) {
        console.error("Failed to start pyflaskProcess:", err);
      });
      pyflaskProcess.on("close", function(err) {
        console.error("Failed to start pyflaskProcess:", err);
      });
    }
    if (pyflaskProcess != null) {
      console.log("child process success on port " + port);
      ElectronLog.info("child process success on port " + port);
    } else {
      console.error("child process failed to start on port" + port);
    }
  }).catch((err) => {
    console.log(err);
  });
};
