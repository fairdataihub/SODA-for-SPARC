const {ipcMain, dialog, BrowserWindow} = require('electron')

ipcMain.on('warning-clear-table', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will erase all your progress, are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-clear-table-selection', index)
  })
})

ipcMain.on('warning-add-permission-owner', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-add-permission-owner-selection', index)
  })
})

ipcMain.on('warning-add-permission-owner-PI', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-add-permission-owner-selection-PI', index)
  })
})

ipcMain.on('warning-new-version', (event) => {
  const options = {
    type: 'info',
    title: 'New version of SODA available',
    message: "We suggest to uninstall the current version and download the latest version to make sure you are up-to-date with the SPARC curation rules!",
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-new-version-showed')
  })
})

ipcMain.on('warning-no-internet-connection', (event) => {
  const options = {
    type: 'warning',
    title: 'No internect connection',
    message: "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of SODA related to Blackfynn and especially none of the features located under the 'Manage Datasets' section.",
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-no-internet-connection-showed')
  })
})

ipcMain.on('open-error-file-exist', (event, emessage) => {
  const options = {
    type: 'error',
    title: 'Duplicate file(s) / folder(s)',
    message: emessage, 
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('error-file-exist-shown')
  })
})

ipcMain.on('open-error-folder-selected', (event, emessage) => {
  const options = {
    type: 'error',
    title: 'Folder(s) not allowed',
    message: emessage, 
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('error-fodler-selected-shown')
  })
})