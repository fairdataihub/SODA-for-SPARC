const {ipcMain, dialog, BrowserWindow} = require('electron')

ipcMain.on('open-file-dialog-dataset', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-dataset', files);
    }
  })
})

// SPARC folder
ipcMain.on('open-file-dialog-code', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-code', files);
    }
  })
})

ipcMain.on('open-folder-dialog-code', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-code', files);
    }
  })
})

ipcMain.on('open-file-dialog-uploadorganization', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'CSV', extensions: ['csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-uploadorganization', files);
    }
  })
})

// Metadata

ipcMain.on('open-file-dialog-metadata', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections'],
  }, (files) => {
    if (files) {
      event.sender.send('selected-metadata', files)
    }
  })
})


ipcMain.on('open-file-dialog-submission', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-submission', files)
    }
  })
})

ipcMain.on('open-file-dialog-description', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-description', files)
    }
  })
})

ipcMain.on('open-file-dialog-subjects', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-subjects', files)
    }
  })
})

ipcMain.on('open-file-dialog-samples', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-samples', files)
    }
  })
})

ipcMain.on('open-file-dialog-newdataset', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-new-dataset', files);
    }
  })
})

ipcMain.on('open-file-dialog-submit-dataset', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-submit-dataset', files);
    }
  })
})
 
// Blackfynn metadata
ipcMain.on('open-file-dialog-import-banner-image', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'Image', extensions: ['jpg', 'png'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-banner-image', files)
    }
  })
})