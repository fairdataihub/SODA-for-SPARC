import { clipboard, ipcMain } from "electron";

ipcMain.handle("clipboard-write", (event, data, type) => {
  clipboard.writeText(data, type);
});
