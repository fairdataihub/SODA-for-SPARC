import { app, shell, BrowserWindow, ipcMain } from 'electron'
import os from 'os'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from "electron-updater";
import { trackEvent, trackKombuchaEvent } from "./analytics"
import icon from '../../resources/soda_icon.png?asset'
import axios from "axios"
import fp from "find-free-port"
import { spawn, execFile, spawnSync } from "node:child_process"
import { existsSync } from 'fs'
import { JSONStorage } from "node-localstorage";
import contextMenu from "electron-context-menu";
import log from 'electron-log/main';
import "./manifest-workbook"
import "./banner-image"
import './node-storage'
import "./main-process/native-ui/dialogs/open-file"
import "./strain"
import "./checkDiskSpace"
import "./spreadsheet-import-gm"


const sodaVersion = app.getVersion();
// If the version includes "beta", the app will not check for updates
const buildIsBeta = sodaVersion.includes("beta");
if (buildIsBeta) {
  log.info("This is a beta build. Updates will not be checked.");
}
autoUpdater.channel = buildIsBeta ? "beta" : "latest";
autoUpdater.logger = log;

// setup event tracking
global.trackEvent = trackEvent;
global.trackKombuchaEvent = trackKombuchaEvent;

// Optional, initialize the logger for any renderer process
log.initialize({ preload: true });
log.transports.console.level = false;
log.transports.file.level = "debug";
let user_restart_confirmed = false;

let nodeStorage = new JSONStorage(app.getPath("userData"))

// TODO: Move to ipcMain handler so renderer processes can talk to the nodestorage
var mainWindow = null;


// import "./appUtils"


// TODO: move to a separate file that handles all the ipcMain handlers
ipcMain.handle('get-app-path', async (event, arg) => {
  if (arg) return app.getPath(arg)
  return app.getAppPath()
})

ipcMain.handle("get-port", () => {
  log.info("Renderer requested port: " + selectedPort);
  return selectedPort
});

ipcMain.handle("app-version", () => {
  return app.getVersion();
})

ipcMain.handle("set-nodestorage-key", (key, value) => {
  return nodeStorage.setItem(key, value);
})

ipcMain.handle("get-nodestorage-key", (key) => {
  return nodeStorage.getItem(key);
})

ipcMain.handle("relaunch-soda", () => {
  app.relaunch();
  app.exit();
})

ipcMain.handle("exit-soda", () => {
  app.exit();
})

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

// passing in the spreadsheet data to pass to a modal
// that will have a jspreadsheet for user edits
ipcMain.handle("spreadsheet", (event, spreadsheet) => {
  console.log("Spreadsheet invoked")
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

  if(is.dev && process.env['ELECTRON_RENDERER_URL']) {
  spreadSheetModal.loadFile(__dirname + "/../../src/renderer/public/spreadSheetModal/spreadSheet.html");
  } else {
    spreadSheetModal.loadFile(join(__dirname, '../renderer/spreadSheetModal/spreadSheet.html'))
  }
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
})

ipcMain.on("restart_app", async () => {
  user_restart_confirmed = true;
  nodeStorage.setItem("announcements", true);
  log.info("quitAndInstall");
  autoUpdater.quitAndInstall();
});

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


// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "../src/pyflask";
const PY_FLASK_MODULE = "app";
let PORT = 4242;
const portRange = 100;
let pyflaskProcess = null;
let selectedPort = null;
const kombuchaURL = "https://analytics-nine-ashen.vercel.app/api";
const localKombuchaURL = "http://localhost:3000/api";
const kombuchaServer = axios.create({
  baseURL: kombuchaURL,
  timeout: 0,
});
let updatechecked = false;



/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
const guessPackaged = () => {
  const executablePathUnix = join(process.resourcesPath, PY_FLASK_MODULE);
  const executablePathWindows = join(process.resourcesPath, PY_FLASK_MODULE + ".exe")

  if (existsSync(executablePathUnix) || existsSync(executablePathWindows)) {
    return true;
  } else {
    return false;
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
    log.info(join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"));
    return join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  }
  if (process.platform === "win32") {
    const winPath = join(process.resourcesPath, PY_FLASK_MODULE + ".exe");
    log.info("App is packaged [Windows]; Path to server executable: " + winPath);
    return winPath;
  } else {
    const unixPath = join(process.resourcesPath, PY_FLASK_MODULE);
    log.info("App is packaged [ Unix ]; Path to server executable: " + unixPath);
    return unixPath;
  }
};

const killAllPreviousProcesses = async () => {
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

const selectPort = () => {
  return PORT;
};

const createPyProc = async () => {
  let script = getScriptPath();
  log.info(`Path to server executable: ${script}`);
  let port = "" + selectPort();
  // await killAllPreviousProcesses();
  if (existsSync(script)) {
    log.info("Server exists at specified location", script);
  } else {
    log.info("Server doesn't exist at specified location");
  }
  fp(PORT, PORT + portRange)
    .then(([freePort]) => {
      let port = freePort;
      if (guessPackaged()) {
        log.info("Application is packaged")
        // Store the stdout and stederr in a string to log later
        let sessionServerOutput = "";
        log.info(`Starting server on port ${port}`)
        pyflaskProcess = execFile(script, [port], (error, stdout, stderr) => {
          if (error) {
            console.error(error)
            log.error(error);
            // console.error(stderr)
            throw error;
          }
          console.log(stdout);
        });
        // log the stdout and stderr
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
        log.info("Application is not packaged")
        // update code here
        pyflaskProcess = spawn("python", [script, port], {
          stdio: "ignore",
        });

        pyflaskProcess.on('data', function () {
          console.log('pyflaskProcess successfully started');
        });

        pyflaskProcess.on('error', function (err) {
          console.error('Failed to start pyflaskProcess:', err);
        });

        pyflaskProcess.on('close', function (err) {
          console.error('Failed to start pyflaskProcess:', err);
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
      log.error("Error starting the python server");
      console.log(err);
    });
};

const exitPyProc = async () => {
  log.info("Killing python server process");
  // Windows does not properly shut off the python server process. This ensures it is killed.
  const killPythonProcess = () => {
    // kill pyproc with command line
    const cmd = spawnSync("taskkill", [
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
    if (pyflaskProcess != null) {
      killPythonProcess();
    }
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


// analytics function
// Sends user information to Kombucha server
const sendUserAnalytics = () => {
  // Retrieve the userId and if it doesn't exist, create a new uuid
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
    // send empty object for new users
    kombuchaServer
      .post("meta/users", {})
      .then((res) => {
        // Save the user token from the server
        nodeStorage.setItem("kombuchaToken", res.data.token);
        nodeStorage.setItem("userId", res.data.uid);
        nodeStorage.setItem("kombuchaUserCreated", true);
      })
      .catch((err) => {
        console.error(err);
      });
  }
};


// single app instance code
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


// Auto updater events -- MAIN Window may not be defined?
autoUpdater.on("update-available", () => {
  log.info("update_available");
  mainWindow.webContents.send("update_available");
});
autoUpdater.on("update-downloaded", () => {
  log.info("update_downloaded");
  // set the launch announcements and auto update flags to true here to handle the case where a user closes the application once the update is downloaded
  // via some means other than the notyf popup
  nodeStorage.setItem("launch_announcements", true);
  nodeStorage.setItem("auto_update_launch", true);
  mainWindow.webContents.send("update_downloaded");
});


// setup main processes for the app ( starting spsash screen, starting the server, what to do on all windows closed, etc )
const initialize = () => {
  sendUserAnalytics();
  makeSingleInstance();

  log.info("Running initialize")

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    const splashScreen = new BrowserWindow({
      width: 220,
      height: 190,
      frame: false,
      icon: __dirname + "/assets/menu-icon/soda_icon.png",
      alwaysOnTop: true,
      transparent: true,
    })

    // TODO: Add dev check for this path
    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      splashScreen.loadURL(process.env['ELECTRON_RENDERER_URL'] + "/splash/splash-screen.html")
    } else {
      splashScreen.loadFile(join(__dirname, '../renderer/splash/splash-screen.html'))
    }


    splashScreen.once("ready-to-show", () => {
      splashScreen.show();
    })

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    try{
      createWindow()
    } catch(err) {
      console.log(err)
      log.info(err)
    }

    mainWindow.webContents.once("dom-ready", () => {
      setTimeout(function () {
        splashScreen.close();
        //mainWindow.maximize();
        mainWindow.show();
        // createWindow();
        var first_launch = nodeStorage.getItem("auto_update_launch");
        if (first_launch == true) {
          nodeStorage.setItem("auto_update_launch", false);
          mainWindow.reload();
          mainWindow.focus();
        }

        // start_pre_flight_checks();
        // if (!buildIsBeta) {
          log.info("Checking for updates in initialize");
          autoUpdater.checkForUpdatesAndNotify();
        // }
        updatechecked = true;
      }, 6000);
    })

    // spawn the python server 
    try{
      createPyProc()
    } catch(err) {
      console.log(err)
      log.info(err)
    }

    // track app launch at Kombucha analytics server
    // trackKombuchaEvent(
    //   kombuchaEnums.Category.STARTUP,
    //   kombuchaEnums.Action.APP_LAUNCHED,
    //   kombuchaEnums.Label.VERSION,
    //   kombuchaEnums.Status.SUCCESS,
    //   {
    //     value: app.getVersion(),
    //   }
    // );

    // trackKombuchaEvent(
    //   kombuchaEnums.Category.STARTUP,
    //   kombuchaEnums.Action.APP_LAUNCHED,
    //   kombuchaEnums.Label.OS,
    //   kombuchaEnums.Status.SUCCESS,
    //   {
    //     value: os.platform() + "-" + os.release(),
    //   }
    // );

    trackEvent("Success", "App Launched - OS", os.platform() + "-" + os.release());
    trackEvent("Success", "App Launched - SODA", app.getVersion());

    console.log(__dirname)


    function createWindow() {

      let iconPath = ""
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        iconPath = process.env['ELECTRON_RENDERER_URL'] + "/public/menu-icon/soda_icon.png"
      } else {
        iconPath = join(__dirname, '../renderer/public/menu-icon/soda_icon.png')
      }

      console.log(iconPath)

      // Create the browser window.
      mainWindow = new BrowserWindow({
        show: false,
        minWidth: 1121,
        minHeight: 735,
        width: 1121,
        height: 735,
        center: true,
        show: false,
        nodeIntegration: true,
        autoHideMenuBar: true,
        icon: iconPath,
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          contextIsolation: true,
          webSecurity: false // TODO: set to true and make the Python server a proxy to add CORS headers
        }
      })

      mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault()
        shell.openExternal(url)
      })


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
                  await exitPyProc();
                  quit_app();
                }
              });
          }
        } else {
          // if this flag is true SODA for SPARC will run through the auto update launch workflow
          nodeStorage.setItem("auto_update_launch", true);
          // after an autoupdate we want to display announcements at launch
          nodeStorage.setItem("launch_announcements", true);
          await exitPyProc();
          app.exit();
        }
      });

      const quit_app = () => {
        // TODO: CHeck if an update was downloaded here and reset the launchAnnouncements and freshLaunch flags to true [ HERE ]
        app.showExitPrompt = false;
        mainWindow.close();
        /// feedback form iframe prevents closing gracefully
        /// so force close
        if (!mainWindow.closed) {
          mainWindow.destroy();
        }
      };

      mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
      })

      // HMR for renderer base on electron-vite cli.
      // Load the remote URL for development or the local html file for production.
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
      }



    }
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', async () => {
    await exitPyProc()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on("will-quit", () => {
    app.quit();
  });
}

contextMenu()

initialize()













