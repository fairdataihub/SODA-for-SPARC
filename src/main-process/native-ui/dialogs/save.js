const {ipcMain, dialog, BrowserWindow} = require('electron')

ipcMain.on('save-dialog', (event) => {
  const options = {
    title: 'Save an Image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('saved-file', filename)
  })
})

ipcMain.on('save-file-dialog-saveorganization', (event, location) => {
  const options = {
    title: 'Save File Organization',
    filters: [
      { name: 'CSV', extensions: ['csv'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('selected-saveorganizationfile', filename, location)
  })
})

ipcMain.on('save-file-dialog-submission', (event) => {
  const options = {
    title: 'Saving your submission.xlsx',
    filters: [
      { name: 'Excel', extensions: ['xlsx'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('selected-savesubmissionfile', filename)
  })
})

ipcMain.on('save-file-dialog-ds-description', (event) => {
  const options = {
    title: 'Saving your dataset-description.xlsx',
    filters: [
      { name: 'Excel', extensions: ['xlsx'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('selected-savedsdescriptionfile', filename)
  })
})

ipcMain.on('save-file-dialog-validator-current', (event, location) => {
  const options = {
    title: 'Saving your validator report',
    filters: [
      { name: 'PDF', extensions: ['pdf'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('selected-savedvalidatorcurrent', filename)
  })
})

ipcMain.on('save-file-dialog-validator-local', (event, location) => {
  const options = {
    title: 'Saving your validator report',
    filters: [
      { name: 'PDF', extensions: ['pdf'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('selected-savedvalidatorlocal', filename)
  })
})
