const {ipcMain, dialog} = require('electron')

ipcMain.on('open-error-dialog', (event) => {
  dialog.showErrorBox('An Error Message', 'Demonstrating an error message.')
})


// ipcMain.on('open-error-file-exist', (event, emessage) => {
//   dialog.showErrorBox('Duplicate file(s) / folder(s)', emessage)
// })
