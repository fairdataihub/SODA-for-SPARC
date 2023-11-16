// Purpose: Banner image buffering for when loading an uploaded Banner image

import { ipcMain } from "electron";
import axios from "axios";
// import Buffer from "node:buffer"

ipcMain.handle("get-string-representation-of-buffer", async (url, format) => {
    console.log(url)
    return "wiwiw"
    // let response = await axios
    // .get(url, {
    //   responseType: "arraybuffer",
    // })
    
    // return new Buffer.from(response, format).toString("base64")
})