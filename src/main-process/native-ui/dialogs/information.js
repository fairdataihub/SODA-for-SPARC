const {ipcMain, dialog} = require('electron')

ipcMain.on('warning-clear-table', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will erase all your progress, are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(options, (index) => {
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
  dialog.showMessageBox(options, (index) => {
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
  dialog.showMessageBox(options, (index) => {
    event.sender.send('warning-add-permission-owner-selection-PI', index)
  })
})

ipcMain.on('warning-new-version', (event) => {
  const options = {
    type: 'info',
    title: 'New version of SODA available',
    message: "We suggest to uninstall the current version and download the latest version to make sure you are up-to-date with the SPARC curation rules!",
  }
  dialog.showMessageBox(options, (index) => {
    event.sender.send('warning-new-version-showed')
  })
})