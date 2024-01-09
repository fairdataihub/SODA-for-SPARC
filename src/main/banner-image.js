// Purpose: Banner image buffering for when loading an uploaded Banner image

import { ipcMain } from "electron";
import axios from "axios";
import fs from "fs";
// import Buffer from "node:buffer"

ipcMain.handle("get-string-representation-of-buffer", async (event, url, format) => {
    console.log(url)
    let response = await axios
    .get(url, {
      responseType: "arraybuffer",
    })
    
    return new Buffer.from(response.data, format).toString("base64")
})

ipcMain.handle("write-banner-image", (event, imageBase64Representation, targetPath) => {
    let buf = new Buffer(imageBase64Representation, "base64");
    fs.writeFileSync(targetPath, buf);
})