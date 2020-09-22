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
    title: 'Saving your submission.xlsx'
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    properties: 'openDirectory'
    }, options, (filename) => {
    event.sender.send('selected-savesubmissionfile', "submission.xlsx")
  })
})

ipcMain.on('save-file-dialog-ds-description', (event) => {
  const options = {
    title: 'Saving your dataset-description.xlsx'
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    properties: 'openDirectory'
  }, options, (filename) => {
    event.sender.send('selected-savedsdescriptionfile', "dataset_description.xlsx")
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

ipcMain.on('save-file-saveorganization-dialog', (event, location) => {
  const options = {
    title: 'Save File Organization',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }
  dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options, (filename) => {
    event.sender.send('selected-fileorganization', filename)
  })
})
