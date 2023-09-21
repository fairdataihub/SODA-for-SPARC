"use strict";
const { app, BrowserWindow, dialog, shell } = require("electron");
require("@electron/remote/main").initialize();
app.showExitPrompt = true;
const path = require("path");
const glob = require("glob");
const fp = require("find-free-port");
const os = require("os");
const contextMenu = require("electron-context-menu");
const log = require("electron-log");
require("v8-compile-cache");
const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { JSONStorage } = require("node-localstorage");
const { trackEvent, trackKombuchaEvent } = require("./scripts/others/analytics/analytics");
require("fs");
require("path");
const axios = require("axios");
require("console");
require("prop-types");
const { kombuchaEnums } = require("./scripts/others/analytics/analytics-enums");
require("uuid").v4;
const sodaVersion = app.getVersion();
const buildIsBeta = sodaVersion.includes("beta");
if (buildIsBeta) {
  log.info("This is a beta build. Updates will not be checked.");
}
autoUpdater.channel = buildIsBeta ? "beta" : "latest";
log.transports.console.level = false;
log.transports.file.level = "debug";
autoUpdater.logger = log;
global.trackEvent = trackEvent;
global.trackKombuchaEvent = trackKombuchaEvent;
const nodeStorage = new JSONStorage(app.getPath("userData"));
const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "pyflask";
const PY_FLASK_MODULE = "app";
let pyflaskProcess = null;
let PORT = 4242;
let selectedPort = null;
const portRange = 100;
const kombuchaURL = "https://analytics-nine-ashen.vercel.app/api";
const kombuchaServer = axios.create({
  baseURL: kombuchaURL,
  timeout: 0,
});
const guessPackaged = () => {
  log.info("Guessing if packaged");
  const windowsPath = path.join(__dirname, PY_FLASK_DIST_FOLDER);
  const unixPath = path.join(process.resourcesPath, PY_FLASK_MODULE);
  log.info(unixPath);
  if (process.platform === "darwin" || process.platform === "linux") {
    if (require("fs").existsSync(unixPath)) {
      log.info("Unix path exists");
      return true;
    } else {
      log.info("Unix path does not exist");
      return false;
    }
  }
  if (process.platform === "win32") {
    if (require("fs").existsSync(windowsPath)) {
      return true;
    } else {
      return false;
    }
  }
};
const getScriptPath = () => {
  if (!guessPackaged()) {
    log.info("App is not packaged returning path: ");
    log.info(path.join(__dirname, PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"));
    return path.join(__dirname, PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  }
  if (process.platform === "win32") {
    const winPath = path.join(__dirname, PY_FLASK_DIST_FOLDER, PY_FLASK_MODULE + ".exe");
    log.info("Path to server executable: " + winPath);
    return winPath;
  } else {
    const unixPath = path.join(process.resourcesPath, PY_FLASK_MODULE);
    log.info("Path to server executable: " + unixPath);
    return unixPath;
  }
};
const createPyProc = async () => {
  let script = getScriptPath();
  log.info(`Path to server executable: ${script}`);
  await killAllPreviousProcesses();
  if (require("fs").existsSync(script)) {
    log.info("server exists at specified location");
  } else {
    log.info("server doesn't exist at specified location");
  }
  fp(PORT, PORT + portRange)
    .then(([freePort]) => {
      let port = freePort;
      if (guessPackaged()) {
        log.info("Application is packaged");
        let sessionServerOutput = "";
        pyflaskProcess = require("child_process").execFile(script, [port], {});
        pyflaskProcess.stdout.on("data", (data) => {
          const logOutput = `[pyflaskProcess output] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });
        pyflaskProcess.stderr.on("data", (data) => {
          const logOutput = `[pyflaskProcess stderr] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });
        pyflaskProcess.on("close", (code) => {
          log.info(`child process exited with code ${code}`);
          log.info("Server output during session found below:");
          log.info(sessionServerOutput);
        });
      } else {
        log.info("Application is not packaged");
        pyflaskProcess = require("child_process").spawn("python", [script, port], {
          stdio: "ignore",
        });
      }
      if (pyflaskProcess != null) {
        console.log("child process success on port " + port);
        log.info("child process success on port " + port);
      } else {
        console.error("child process failed to start on port" + port);
      }
      selectedPort = port;
    })
    .catch((err) => {
      console.log(err);
    });
};
const exitPyProc = async () => {
  log.info("Killing python server process");
  const killPythonProcess = () => {
    require("child_process").spawnSync("taskkill", ["/pid", pyflaskProcess.pid, "/f", "/t"]);
  };
  console.log("Killing the process");
  await killAllPreviousProcesses();
  if (process.platform === "win32") {
    if (pyflaskProcess != null) {
      killPythonProcess();
    }
    pyflaskProcess = null;
    PORT = null;
    return;
  }
  if (pyflaskProcess != null) {
    pyflaskProcess.kill();
    pyflaskProcess = null;
  }
  PORT = null;
};
const killAllPreviousProcesses = async () => {
  console.log("Killing all previous processes");
  let promisesArray = [];
  let endRange = PORT + portRange;
  for (let currentPort = PORT; currentPort <= endRange; currentPort++) {
    promisesArray.push(
      axios.get(`http://127.0.0.1:${currentPort}/sodaforsparc_server_shutdown`, {})
    );
  }
  await Promise.allSettled(promisesArray);
};
const sendUserAnalytics = () => {
  let token;
  let userCreated;
  try {
    token = nodeStorage.getItem("kombuchaToken");
  } catch (e) {
    token = null;
  }
  try {
    userCreated = nodeStorage.getItem("kombuchaUserCreated");
  } catch (e) {
    userCreated = null;
  }
  if (token === null || userCreated === null) {
    kombuchaServer
      .post("meta/users", {})
      .then((res) => {
        nodeStorage.setItem("kombuchaToken", res.data.token);
        nodeStorage.setItem("userId", res.data.uid);
        nodeStorage.setItem("kombuchaUserCreated", true);
      })
      .catch((err) => {
        console.error(err);
      });
  }
};
let mainWindow = null;
let user_restart_confirmed = false;
let updatechecked = false;
function initialize() {
  sendUserAnalytics();
  makeSingleInstance();
  loadDemos();
  function createWindow() {
    mainWindow.webContents.on("new-window", (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });
    mainWindow.webContents.once("dom-ready", () => {
      if (updatechecked == false && !buildIsBeta) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });
    mainWindow.on("close", async (e) => {
      if (!user_restart_confirmed) {
        if (app.showExitPrompt) {
          e.preventDefault();
          dialog
            .showMessageBox(BrowserWindow.getFocusedWindow(), {
              type: "question",
              buttons: ["Yes", "No"],
              title: "Confirm",
              message: "Any running process will be stopped. Are you sure you want to quit?",
            })
            .then(async (responseObject) => {
              let { response } = responseObject;
              if (response === 0) {
                await exitPyProc();
                quit_app();
              }
            });
        }
      } else {
        nodeStorage.setItem("auto_update_launch", true);
        nodeStorage.setItem("launch_announcements", true);
        await exitPyProc();
        app.exit();
      }
    });
  }
  const quit_app = () => {
    app.showExitPrompt = false;
    mainWindow.close();
    if (!mainWindow.closed) {
      mainWindow.destroy();
    }
  };
  app.on("ready", () => {
    createPyProc();
    const windowOptions = {
      minWidth: 1121,
      minHeight: 735,
      width: 1121,
      height: 735,
      center: true,
      show: false,
      icon: __dirname + "/assets/menu-icon/soda_icon.png",
      // autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
        sandbox: false,
        // preload: path.join(__dirname, "preload.js"),
      },
    };
    mainWindow = new BrowserWindow(windowOptions);
    require("@electron/remote/main").enable(mainWindow.webContents);
    mainWindow.loadURL(path.join("file://", __dirname, "/index.html"));
    const splash = new BrowserWindow({
      width: 220,
      height: 190,
      frame: false,
      icon: __dirname + "/assets/menu-icon/soda_icon.png",
      alwaysOnTop: true,
      transparent: true,
    });
    splash.loadURL(path.join("file://", __dirname, "/splash-screen.html"));
    mainWindow.webContents.once("dom-ready", () => {
      setTimeout(function () {
        splash.close();
        mainWindow.show();
        createWindow();
        var first_launch = nodeStorage.getItem("auto_update_launch");
        if (first_launch == true) {
          nodeStorage.setItem("auto_update_launch", false);
          mainWindow.reload();
          mainWindow.focus();
        }
        start_pre_flight_checks();
        if (!buildIsBeta) {
          autoUpdater.checkForUpdatesAndNotify();
        }
        updatechecked = true;
      }, 6e3);
    });
    mainWindow.on("show", () => {
      nodeStorage.getItem("auto_update_launch");
    });
  });
  app.on("ready", () => {
    trackKombuchaEvent(
      kombuchaEnums.Category.STARTUP,
      kombuchaEnums.Action.APP_LAUNCHED,
      kombuchaEnums.Label.VERSION,
      kombuchaEnums.Status.SUCCESS,
      {
        value: app.getVersion(),
      }
    );
    trackKombuchaEvent(
      kombuchaEnums.Category.STARTUP,
      kombuchaEnums.Action.APP_LAUNCHED,
      kombuchaEnums.Label.OS,
      kombuchaEnums.Status.SUCCESS,
      {
        value: os.platform() + "-" + os.release(),
      }
    );
    trackEvent("Success", "App Launched - OS", os.platform() + "-" + os.release());
    trackEvent("Success", "App Launched - SODA", app.getVersion());
  });
  app.on("window-all-closed", async () => {
    await exitPyProc();
    app.quit();
  });
  app.on("will-quit", () => {
    app.quit();
  });
}
function start_pre_flight_checks() {
  mainWindow.webContents.send("start_pre_flight_checks");
}
const gotTheLock = app.requestSingleInstanceLock();
function makeSingleInstance() {
  if (process.mas) {
    return;
  }
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });
  }
}
contextMenu();
function loadDemos() {
  const files = glob.sync(path.join(__dirname, "main-process/**/*.js"));
  files.forEach((file) => {
    require(file);
  });
}
initialize();
ipcMain.on("resize-window", (event, dir) => {
  let x = mainWindow.getSize()[0];
  let y = mainWindow.getSize()[1];
  if (dir === "up") {
    x += 1;
    y += 1;
  } else {
    x -= 1;
    y -= 1;
  }
  mainWindow.setSize(x, y);
});
ipcMain.on("track-event", (event, category, action, label, value) => {});
ipcMain.on("track-kombucha", (event, category, action, label, eventStatus, eventData) => {
  trackKombuchaEvent(category, action, label, eventStatus, eventData);
});
ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: sodaVersion });
});
autoUpdater.on("update-available", () => {
  log.info("update_available");
  mainWindow.webContents.send("update_available");
});
autoUpdater.on("update-downloaded", () => {
  log.info("update_downloaded");
  nodeStorage.setItem("launch_announcements", true);
  nodeStorage.setItem("auto_update_launch", true);
  mainWindow.webContents.send("update_downloaded");
});
ipcMain.on("restart_app", async () => {
  user_restart_confirmed = true;
  nodeStorage.setItem("announcements", true);
  log.info("quitAndInstall");
  autoUpdater.quitAndInstall();
});
ipcMain.handle("spreadsheet", (event, spreadsheet) => {
  const windowOptions = {
    minHeight: 450,
    width: 1120,
    height: 550,
    center: true,
    show: true,
    icon: __dirname + "/assets/menu-icon/soda_icon.png",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    // modal: true,
    parent: mainWindow,
    closable: true,
  };
  let spreadSheetModal = new BrowserWindow(windowOptions);
  spreadSheetModal.on("close", (e) => {
    mainWindow.webContents.send("spreadsheet-reply", "");
    try {
      spreadSheetModal.destroy();
    } catch (e2) {
      console.log(e2);
    }
  });
  spreadSheetModal.loadFile("./sections/spreadSheetModal/spreadSheet.html");
  spreadSheetModal.once("ready-to-show", async () => {
    spreadSheetModal.show();
    spreadSheetModal.send("requested-spreadsheet", spreadsheet);
  });
  ipcMain.on("spreadsheet-results", async (ev, res) => {
    mainWindow.webContents.send("spreadsheet-reply", res);
    try {
      spreadSheetModal.destroy();
    } catch (e) {
      console.log(e);
    }
  });
});
ipcMain.on("orcid", (event, url) => {
  const windowOptions = {
    minWidth: 500,
    minHeight: 300,
    width: 900,
    height: 800,
    center: true,
    show: true,
    icon: __dirname + "/assets/menu-icon/soda_icon.png",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    // modal: true,
    parent: mainWindow,
    closable: true,
  };
  let pennsieveModal = new BrowserWindow(windowOptions);
  let accessCode;
  pennsieveModal.on("close", function () {
    event.reply("orcid-reply", accessCode);
    pennsieveModal = null;
  });
  pennsieveModal.loadURL(url);
  pennsieveModal.once("ready-to-show", async () => {
    pennsieveModal.show();
  });
  pennsieveModal.webContents.on("did-navigate", () => {
    url = pennsieveModal.webContents.getURL();
    if (url.includes("code=")) {
      let params = new URLSearchParams(url.slice(url.search(/\?/)));
      accessCode = params.get("code");
      pennsieveModal.close();
    }
  });
});
ipcMain.on("get-port", (event) => {
  log.info("Renderer requested port: " + selectedPort);
  event.returnValue = selectedPort;
});
