const {app, dialog, globalShortcut} = require('electron')


app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
