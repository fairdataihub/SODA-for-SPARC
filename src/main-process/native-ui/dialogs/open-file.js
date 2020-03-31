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

///// SPARC folders

//code
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

//derivatives
ipcMain.on('open-file-dialog-derivatives', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-derivatives', files);
    }
  })
})

ipcMain.on('open-folder-dialog-derivatives', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-derivatives', files);
    }
  })
})

//docs
ipcMain.on('open-file-dialog-docs', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-docs', files);
    }
  })
})

ipcMain.on('open-folder-dialog-docs', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-docs', files);
    }
  })
})


//primary
ipcMain.on('open-file-dialog-primary', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-primary', files);
    }
  })
})

ipcMain.on('open-folder-dialog-primary', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-primary', files);
    }
  })
})

//protocol
ipcMain.on('open-file-dialog-protocol', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-protocol', files);
    }
  })
})

ipcMain.on('open-folder-dialog-protocol', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-protocol', files);
    }
  })
})


//source
ipcMain.on('open-file-dialog-source', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-source', files);
    }
  })
})

ipcMain.on('open-folder-dialog-source', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory', 'multiSelections']
  }, (files) => {
    if (files) {
      event.sender.send('selected-source', files);
    }
  })
})


/////
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

////// milestone document
ipcMain.on('open-file-dialog-milestone-doc', (event) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
    { name: 'DOCX', extensions: ['docx'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-milestonedoc', files);
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
    { name: 'Image', extensions: ['jpg', 'png', 'jpeg'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-banner-image', files)
    }
  })
})

// Metadata template download
ipcMain.on('open-folder-dialog-save-metadata', (event, filename) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-metadata-download-folder', files, filename);
    }
  })
})

// Metadata submission download
ipcMain.on('open-folder-dialog-save-submission', (event, filename) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-metadata-submission', files, filename);
    }
  })
})

// Metadata ds description download
ipcMain.on('open-folder-dialog-save-ds-description', (event, filename) => {
  dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-metadata-ds-description', files, filename);
    }
  })
})
