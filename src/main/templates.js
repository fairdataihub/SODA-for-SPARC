import { ipcMain } from "electron";
import fs from "fs"

ipcMain.handle("write-template", async (event, templatePath, destinationPath) => {
    return fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath))
  })


ipcMain.handle("get-current-directory", async (event) => {
  return __dirname
})