const {app, BrowserWindow, dialog} = require('electron')
app.showExitPrompt = true
const path = require('path')
const glob = require('glob')
const contextMenu = require('electron-context-menu');
const log  = require("electron-log");
require('v8-compile-cache')
const {ipcMain} = require('electron')
const { autoUpdater } = require("electron-updater");

log.transports.console.level = false
/*************************************************************
 * Python Process
 *************************************************************/

const PY_DIST_FOLDER = 'pysodadist'
const PY_FOLDER = 'pysoda'
const PY_MODULE = 'api' // without .py suffix

let pyProc = null
let pyPort = null

const guessPackaged = () => {
  const fullPath = path.join(__dirname, PY_DIST_FOLDER)
  return require('fs').existsSync(fullPath)
}

const getScriptPath = () => {
  if (!guessPackaged()) {
    return path.join(__dirname, PY_FOLDER, PY_MODULE + '.py')
  }
  if (process.platform === 'win32') {
    return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE + '.exe')
  }
  return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE)
}

const selectPort = () => {
  pyPort = 4242
  return pyPort
}

const createPyProc = () => {
  let script = getScriptPath()
  let port = '' + selectPort()

  if (guessPackaged()) {
    pyProc = require('child_process').execFile(script, [port], { stdio: 'ignore' })
  } else {
    pyProc = require('child_process').spawn('python', [script, port], { stdio: 'ignore' })
  }

  if (pyProc != null) {
    console.log('child process success on port ' + port)
    log.info('child process success on port ' + port)
  } else {
    console.error('child process failed to start on port' + port)
  }
}

const exitPyProc = () => {
  pyProc.kill()
  pyProc = null
  pyPort = null
}

app.on('ready', createPyProc)
app.on('will-quit', exitPyProc)


/*************************************************************
 * Main app window
 *************************************************************/

let mainWindow = null
let user_restart_confirmed = false;

function initialize () {
  makeSingleInstance()

  loadDemos()

  function createWindow () {
    const windowOptions = {
      minWidth: 1080,
      minHeight: 680,
      width: 1080,
      height: 720,
      center: true,
      //title: app.getName(),
      icon: __dirname + '/assets/menu-icon/soda_icon.png',
      webPreferences: {
        nodeIntegration: true
      }
    }

    //if (process.platform === 'linux') {
    //  windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/soda_icon.png')
    //}

    mainWindow = new BrowserWindow(windowOptions)
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

    mainWindow.webContents.openDevTools();

    mainWindow.webContents.once('dom-ready', () => {
      autoUpdater.checkForUpdatesAndNotify();
    });

/*    mainWindow.on('closed', () => {
      mainWindow = null
    })*/

    mainWindow.on('close', (e) => {
      if (app.showExitPrompt) {
        e.preventDefault() // Prevents the window from closing
        if (user_restart_confirmed) {
          quit_app();
        }
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Any running proccess will be stopped. Are you sure you want to quit?'
        }, function (response) {
          if (response === 0) { // Runs the following if 'Yes' is clicked
          quit_app();
          }
        })
      }
    })

  }

  const quit_app = () => {
    app.showExitPrompt = false
    mainWindow.close()
    /// feedback form iframe prevents closing gracefully
    /// so force close
    if (!mainWindow.closed) {
      mainWindow.destroy()
    }
  }

  app.on('ready', () => {
    createWindow()
  })

  app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') {
      app.quit()
    // }
  })

  // app.on('activate', () => {
  //   if (mainWindow === null) {
  //     createWindow()
  //   }
  // })
}

// Make this app a single instance app.
const gotTheLock = app.requestSingleInstanceLock()

function makeSingleInstance () {
  if (process.mas) return

  if (!gotTheLock) {
    app.quit()
  } else {

    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
  }
}

/*
the saveImage context Menu-Item works; however, it does not notify users that a download occurs.
If you check your download folder, you'll see it there.
See: https://github.com/nteract/nteract/issues/1655
showSaveImageAs prompts the users where they want to save the image.
*/
contextMenu()

// Require each JS file in the main-process dir
function loadDemos () {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach((file) => { require(file) })
}

initialize()


ipcMain.on('resize-window', (event, dir) => {
  var x = mainWindow.getSize()[0]
  var y = mainWindow.getSize()[1]
  if (dir === 'up'){
    x = x+1
    y = y+1
  } else {
    x = x-1
    y = y-1
  }
  mainWindow.setSize(x, y)
})

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", () => {
  user_restart_confirmed = true;
  autoUpdater.quitAndInstall();
});