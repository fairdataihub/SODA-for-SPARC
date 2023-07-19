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
const { fstat } = require("fs");
const { resolve } = require("path");
const axios = require("axios");
const { info } = require("console");
const { node } = require("prop-types");
const uuid = require("uuid").v4;

log.transports.console.level = false;
log.transports.file.level = "debug";
autoUpdater.channel = "latest";
autoUpdater.logger = log;
global.trackEvent = trackEvent;
global.trackKombuchaEvent = trackKombuchaEvent;

const nodeStorage = new JSONStorage(app.getPath("userData"));
/*************************************************************
 * Python Process
 *************************************************************/

// flask setup environment variables
const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "pyflask";
const PY_FLASK_MODULE = "app";
let pyflaskProcess = null;

let PORT = 4242;
let selectedPort = null;
const portRange = 100;
const kombuchaURL = "https://analytics-nine-ashen.vercel.app/api";
const localKombuchaURL = "http://localhost:3000/api";
const kombuchaServer = axios.create({
  baseURL: kombuchaURL,
  timeout: 0,
});

/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
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

/**
 * Get the system path to the api server script.
 * The script is located in the resources folder for packaged Linux and Mac builds and in the app.getAppPath() for Windows builds.
 * It is relative to the main.js file directory when in dev mode.
 * @returns {string} The path to the api server script that needs to be executed to start the Python server
 */
const getScriptPath = () => {
  if (!guessPackaged()) {
    log.info("App is not packaged returning path: ");
    log.info(path.join(__dirname, PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"));
    return path.join(__dirname, PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  }

  if (process.platform === "win32") {
    return path.join(__dirname, PY_FLASK_DIST_FOLDER, PY_FLASK_MODULE + ".exe");
  } else {
    log.info("Since app is packaged returning path: ");
    return path.join(process.resourcesPath, PY_FLASK_MODULE);
  }
};

const selectPort = () => {
  return PORT;
};

const createPyProc = async () => {
  let script = getScriptPath();
  log.info(`Path to server executable: ${script}`);

  let port = "" + selectPort();

  await killAllPreviousProcesses();

  if (require("fs").existsSync(script)) {
    log.info("server exists at specified location");
  } else {
    log.info("server does not exist at specified location");
  }

  fp(PORT, PORT + portRange)
    .then(([freePort]) => {
      let port = freePort;

      if (guessPackaged()) {
        log.info("Application is packaged");

        // Store the stdout and stederr in a string to log later
        let sessionServerOutput = "";

        pyflaskProcess = require("child_process").execFile(script, [port], {});

        // Log the stdout and stderr
        pyflaskProcess.stdout.on("data", (data) => {
          const logOutput = `[pyflaskProcess output] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });
        pyflaskProcess.stderr.on("data", (data) => {
          const logOutput = `[pyflaskProcess stderr] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });

        // On close, log the outputs and the exit code
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

/**
 * Kill the python server process. Needs to be called before SODA closes.
 */
const exitPyProc = async () => {
  log.info("Killing python server process");

  // Windows does not properly shut off the python server process. This ensures it is killed.
  const killPythonProcess = () => {
    // kill pyproc with command line
    const cmd = require("child_process").spawnSync("taskkill", [
      "/pid",
      pyflaskProcess.pid,
      "/f",
      "/t",
    ]);
  };

  console.log("Killing the process");

  await killAllPreviousProcesses();

  // check if the platform is Windows
  if (process.platform === "win32") {
    if (pyflaskProcess !== null) killPythonProcess();
    pyflaskProcess = null;
    PORT = null;
    return;
  }

  // kill signal to pyProc
  if (pyflaskProcess != null) {
    pyflaskProcess.kill();
    pyflaskProcess = null;
  }
  PORT = null;
};

const killAllPreviousProcesses = async () => {
  console.log("Killing all previous processes");

  // kill all previous python processes that could be running.
  let promisesArray = [];

  let endRange = PORT + portRange;

  // create a loop of 100
  for (let currentPort = PORT; currentPort <= endRange; currentPort++) {
    promisesArray.push(
      axios.get(`http://127.0.0.1:${currentPort}/sodaforsparc_server_shutdown`, {})
    );
  }

  // wait for all the promises to resolve
  await Promise.allSettled(promisesArray);
};

// Sends user information to Kombucha server
const sendUserAnalytics = () => {
  // Retrieve the userId and if it doesn't exist, create a new uuid
  let token;
  try {
    token = nodeStorage.getItem("kombuchaToken");
  } catch (e) {
    token = null;
  }

  if (token === null) {
    console.log("no token found, creating new user");
    // send empty object for new users
    kombuchaServer
      .post("meta/users", {})
      .then((res) => {
        // Save the user token from the server
        console.log(res);
        nodeStorage.setItem("kombuchaToken", res.data.token);
        nodeStorage.setItem("userId", res.data.userId);
      })
      .catch((err) => {
        console.error(err);
      });
  }
};

// 5.4.1 change: We call createPyProc in a spearate ready event
// app.on("ready", createPyProc);
// 5.4.1 change: We call exitPyreProc when all windows are killed so it has time to kill the process before closing

/*************************************************************
 * Main app window
 *************************************************************/

let mainWindow = null;
let user_restart_confirmed = false;
let updatechecked = false;
let window_reloaded = false;

// If buildIsBeta is true, the app will not check for updates
// If it is false, the app will check for updates
const buildIsBeta = true;

function initialize() {
  const checkForAnnouncements = () => {
    mainWindow.webContents.send("checkForAnnouncements");
  };

  sendUserAnalytics();

  makeSingleInstance();
  loadDemos();

  function createWindow() {
    // mainWindow.webContents.openDevTools();

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
          e.preventDefault(); // Prevents the window from closing
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
                // Runs the following if 'Yes' is clicked
                var announcementsLaunch = nodeStorage.getItem("announcements");
                nodeStorage.setItem("announcements", false);
                await exitPyProc();
                quit_app();
              }
            });
        }
      } else {
        var first_launch = nodeStorage.getItem("firstlaunch");
        nodeStorage.setItem("firstlaunch", true);
        nodeStorage.setItem("announcements", true);
        await exitPyProc();
        app.exit();
      }
    });
  }

  const quit_app = () => {
    console.log("Quit app called");
    app.showExitPrompt = false;
    mainWindow.close();
    /// feedback form iframe prevents closing gracefully
    /// so force close
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

    //  if main window is ready to show, then destroy the splash window and show up the main window
    mainWindow.webContents.once("dom-ready", () => {
      setTimeout(function () {
        splash.close();
        //mainWindow.maximize();
        mainWindow.show();
        createWindow();
        var first_launch = nodeStorage.getItem("firstlaunch");
        var announcementsLaunch = nodeStorage.getItem("announcements");

        if (first_launch == true || first_launch == undefined) {
          mainWindow.reload();
          mainWindow.focus();
          nodeStorage.setItem("firstlaunch", false);
        }
        if (announcementsLaunch == true || announcementsLaunch == undefined) {
          checkForAnnouncements();
          nodeStorage.setItem("announcements", false);
        }
        start_pre_flight_checks();
        if (!buildIsBeta) {
          autoUpdater.checkForUpdatesAndNotify();
        }
        updatechecked = true;
      }, 6000);
    });

    mainWindow.on("show", () => {
      var first_launch = nodeStorage.getItem("firstlaunch");
      if ((first_launch == true || first_launch == undefined) && window_reloaded == false) {
      }
    });
  });

  app.on("window-all-closed", async () => {
    console.log("All windows closed");
    await exitPyProc();
    app.quit();
  });

  app.on("will-quit", () => {
    app.quit();
  });
}

function start_pre_flight_checks() {
  console.log("Running pre-checks");
  mainWindow.webContents.send("start_pre_flight_checks");
}

// Make this app a single instance app.
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

/*
the saveImage context Menu-Item works; however, it does not notify users that a download occurs.
If you check your download folder, you'll see it there.
See: https://github.com/nteract/nteract/issues/1655
showSaveImageAs prompts the users where they want to save the image.
*/
contextMenu();

// Require each JS file in the main-process dir
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

// Google analytics tracking function
// To use, category and action is required. Label and value can be left out
// if not needed. Sample requests from renderer.js is shown below:
//ipcRenderer.send('track-event', "App Backend", "Python Connection Established");
//ipcRenderer.send('track-event', "App Backend", "Errors", "server", error);
ipcMain.on("track-event", (event, category, action, label, value) => {
  // do nothing here for now
});

ipcMain.on("track-kombucha", (event, category, action, label, eventStatus, eventData) => {
  trackKombuchaEvent(category, action, label, eventStatus, eventData);
});

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

autoUpdater.on("update-available", () => {
  log.info("update_available");
  mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  log.info("update_downloaded");
  mainWindow.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", async () => {
  user_restart_confirmed = true;
  nodeStorage.setItem("announcements", true);
  log.info("quitAndInstall");
  autoUpdater.quitAndInstall();
});

// passing in the spreadsheet data to pass to a modal
// that will have a jspreadsheet for user edits
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
      // spreadSheetModal.close();
    } catch (e) {
      console.log(e);
    }
  });

  spreadSheetModal.loadFile("./sections/spreadSheetModal/spreadSheet.html");

  spreadSheetModal.once("ready-to-show", async () => {
    //display window when ready to show
    spreadSheetModal.show();
    //send data to child window
    spreadSheetModal.send("requested-spreadsheet", spreadsheet);
  });

  ipcMain.on("spreadsheet-results", async (ev, res) => {
    //send back spreadsheet data to main window
    mainWindow.webContents.send("spreadsheet-reply", res);
    //destroy window
    try {
      spreadSheetModal.destroy();
      // spreadSheetModal.close();
    } catch (e) {
      console.log(e);
    }
  });
});

const wait = async (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// passing in the spreadsheet data to pass to a modal
// that will have a jspreadsheet for user edits

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

  // send to client so they can use this for the Pennsieve endpoint for integrating an ORCID
  let accessCode;

  pennsieveModal.on("close", function () {
    // send event back to the renderer to re-run the prepublishing checks
    // this will detect if the user added their ORCID iD
    event.reply("orcid-reply", accessCode);

    pennsieveModal = null;
  });
  pennsieveModal.loadURL(url);

  pennsieveModal.once("ready-to-show", async () => {
    pennsieveModal.show();
  });

  // track when the page navigates
  pennsieveModal.webContents.on("did-navigate", () => {
    // get the URL
    url = pennsieveModal.webContents.getURL();

    // check if the url includes the access code
    if (url.includes("code=")) {
      // get the access code from the url
      let params = new URLSearchParams(url.slice(url.search(/\?/)));
      accessCode = params.get("code");

      // if so close the window
      pennsieveModal.close();
    }
  });
});

ipcMain.on("get-port", (event) => {
  log.info("Renderer requested port: " + selectedPort);
  event.returnValue = selectedPort;
});
