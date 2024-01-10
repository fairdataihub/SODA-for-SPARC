import { ipcMain, BrowserWindow, dialog, shell} from "electron";
import excel4node from "excel4node";
import {writeFile} from "fs/promises"


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

ipcMain.handle("create-and-save-dataset-structure-spreadsheet", async (event, hasPools, hasSamples, savePath) => {
  const workbook = new excel4node.Workbook();
  const worksheet = workbook.addWorksheet("Subject structure");
  const sodaGreenHeaderStyle = workbook.createStyle({
    font: {
      color: "#ffffff",
      size: 12,
      bold: true,
    },
    fill: {
      type: "pattern",
      patternType: "solid",
      bgColor: "#13716d",
      fgColor: "#13716d",
    },
  });

  const headers = ["subject id"];

  if (hasPools) {
    headers.push("pool id");
  }
  if (hasSamples) {
    headers.push("sample id");
  }

  for (let i = 0; i < headers.length; i++) {
    worksheet
      .cell(1, i + 1)
      .string(headers[i])
      .style(sodaGreenHeaderStyle);
    worksheet.column(i + 1).setWidth(30);
  }

  // write the spreadsheet to the selected
  const buffer = await workbook.writeToBuffer();
  await writeFile(savePath, buffer);
})


ipcMain.on("open-file-at-path", async (event, path) => {
  shell.openPath(path);
});

