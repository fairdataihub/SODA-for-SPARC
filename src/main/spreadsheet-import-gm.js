import { ipcMain, app, BrowserWindow, dialog } from "electron";



ipcMain.on("open-create-dataset-structure-spreadsheet-path-selection-dialog", (event) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  // Get the path to the directory where the user wants to save the spreadsheet
  const spreadsheetPath = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a folder to save the spreadsheet to",
  });

  if (spreadsheetPath) {
    event.sender.send("selected-create-dataset-structure-spreadsheet-path", spreadsheetPath[0]);
  }
});

ipcMain.on("open-subject-multi-folder-import-dialog", (event) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory", "multiSelections"],
    title: "Select your subject folders",
  });

  if (files) {
    mainWindow.webContents.send("selected-subject-names-from-dialog", files);
  }
});

ipcMain.on("open-sample-multi-folder-import-dialog", (event) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  const folders = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory", "multiSelections"],
    title: "Select your sample folders",
  });

  if (folders) {
    mainWindow.webContents.send("selected-sample-names-from-dialog", folders);
  }
});

