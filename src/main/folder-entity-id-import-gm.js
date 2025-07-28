import { ipcMain, BrowserWindow, dialog } from "electron";

ipcMain.on("open-entity-id-import-selector", (event) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  // Get the paths to the directories where the user wants to save the spreadsheet
  const folderPaths = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory", "multiSelections"], // Allow multiple folder selections
    title: "Select folders to import entity IDs from",
  });

  if (folderPaths && folderPaths.length > 0) {
    // Send all selected folder paths back to the renderer process
    event.sender.send("selected-create-dataset-structure-spreadsheet-pah", folderPaths);
  }
});
