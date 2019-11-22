const {app, BrowserWindow, dialog} = require('electron')
app.showExitPrompt = true
const path = require('path')
const glob = require('glob')
const contextMenu = require('electron-context-menu');

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
    //console.log(pyProc)
    console.log('child process success on port ' + port)
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

function initialize () {
  makeSingleInstance()

  loadDemos()

  function createWindow () {
    const windowOptions = {
      minWidth: 1080,
      minHeight: 680,
      width: 1080,
      height: 680,
      center: true,
      //title: app.getName(),
      icon: __dirname + '/assets/app-icon/png/soda_icon.png',
      webPreferences: {
        nodeIntegration: true
      }
    }

    //if (process.platform === 'linux') {
    //  windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/soda_icon.png')
    //}

    mainWindow = new BrowserWindow(windowOptions)
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

/*    mainWindow.on('closed', () => {
      mainWindow = null
    })*/

    mainWindow.on('close', (e) => {
    if (app.showExitPrompt) {
        e.preventDefault() // Prevents the window from closing 
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Any running proccess will be stopped. Are you sure you want to quit?'
        }, function (response) {
            if (response === 0) { // Runs the following if 'Yes' is clicked
                app.showExitPrompt = false
                mainWindow.close()
            }
        })
    }
    })


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

// Right click context menu
contextMenu({
  prepend: (params, browserWindow) => [{
    label: "hello"
  }
  ]
});

// Require each JS file in the main-process dir
function loadDemos () {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach((file) => { require(file) })
}

initialize()