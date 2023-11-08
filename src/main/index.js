import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ElectronLog from "electron-log"
import axios from "axios"
import fp from "find-free-port"
import {spawn, execFile} from "node:child_process"
import { existsSync } from 'fs'
import { JSONStorage } from "node-localstorage";
import log from 'electron-log/main';

import "./main-process/native-ui/dialogs/open-file"

// Optional, initialize the logger for any renderer process
log.initialize({ preload: true });



// TODO: Move to ipcMain handler so renderer processes can talk to the nodestorage
let nodeStorage = new JSONStorage(app.getPath("userData"));


// import "./appUtils"
console.log("Test up[date")


// TODO: move to a separate file that handles all the ipcMain handlers
ipcMain.handle('get-app-path', async (event, arg) => {
  return app.getPath(arg) 
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


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    nodeIntegration: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      webSecurity: false // TODO: set to true and make the Python server a proxy to add CORS headers
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // spawn the python server 
  await createPyProc()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
const PY_FLASK_DIST_FOLDER = "pyflaskdist";
const PY_FLASK_FOLDER = "../src/pyflask";
const PY_FLASK_MODULE = "app";
let PORT = 4242;
const portRange = 100;
let pyflaskProcess = null;
let selectedPort = null;



/**
 * Determine if the application is running from a packaged version or from a dev version.
 * The resources path is used for Linux and Mac builds and the app.getAppPath() is used for Windows builds.
 * @returns {boolean} True if the app is packaged, false if it is running from a dev version.
 */
const guessPackaged = () => {
  const windowsPath = join(__dirname, "..", PY_FLASK_DIST_FOLDER);
  ElectronLog.info("Windows path: " + windowsPath);
  const unixPath = join(process.resourcesPath, PY_FLASK_MODULE);
  if (process.platform === "darwin" || process.platform === "linux") {
    if (existsSync(unixPath)) {
      return true;
    } else {
      return false;
    }
  }
  if (process.platform === "win32") {
    if (existsSync(windowsPath)) {
      ElectronLog.info("App is packaged returning true [ Windows ]")

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
    ElectronLog.info("App is not packaged returning path: ");
    ElectronLog.info(join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py"));
    return join(__dirname, "..", PY_FLASK_FOLDER, PY_FLASK_MODULE + ".py");
  }
  if (process.platform === "win32") {
    const winPath = join(__dirname, PY_FLASK_DIST_FOLDER,  PY_FLASK_MODULE + ".exe");
    ElectronLog.info("App is packaged [Windows]; Path to server executable: " + winPath);
    return winPath;
  } else {
    const unixPath = join(process.resourcesPath, PY_FLASK_MODULE);
    ElectronLog.info("App is packaged [ Unix ]; Path to server executable: " + unixPath);
    return unixPath;
  }
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

const selectPort = () => {
  return PORT;
};

const createPyProc = async () => {
  let script = getScriptPath();
  ElectronLog.info(`Path to server executable: ${script}`);
  let port = "" + selectPort();
  // await killAllPreviousProcesses();
  if (existsSync(script)) {
    ElectronLog.info("Server exists at specified location", script);
  } else {
    ElectronLog.info("Server doesn't exist at specified location");
  }
  fp(PORT, PORT + portRange)
    .then(([freePort]) => {
      let port = freePort;
      if (guessPackaged()) {
        // Store the stdout and stederr in a string to ElectronLog later
        let sessionServerOutput = "";
        ElectronLog.info(`Starting server on port ${port}`)
        pyflaskProcess = execFile(script, [port], (error, stdout, stderr) => {
          if (error) {
            console.error(error)
            ElectronLog.error(error);
            // console.error(stderr)
            throw error;
          }
          console.log(stdout);
        });
        // ElectronLog the stdout and stderr
        pyflaskProcess.stdout.on("data", (data) => {
          const logOutput = `[pyflaskProcess output] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });
        pyflaskProcess.stderr.on("data", (data) => {
          const logOutput = `[pyflaskProcess stderr] ${data.toString()}`;
          sessionServerOutput += `${logOutput}`;
        });
        // On close, ElectronLog the outputs and the exit code
        pyflaskProcess.on("close", (code) => {
          ElectronLog.info(`child process exited with code ${code}`);
          ElectronLog.info("Server output during session found below:");
          ElectronLog.info(sessionServerOutput);
        });
      } else {
        ElectronLog.info("Starting server on port aka wrong place " + port)
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
        ElectronLog.info("child process success on port " + port);
      } else {
        console.error("child process failed to start on port" + port);
      }
      selectedPort = port;
    })
    .catch((err) => {
      console.log(err);
    });
};


