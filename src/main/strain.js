import https from "https";
import { ipcMain } from "electron";


ipcMain.handle("getStrainData", async (event, rridInfo) => {
  https.get(rridInfo, (res) => {
    if (res.statusCode === 200) {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (d) => {
        data += d;
      });
      res.on("end", () => {
        return data 
        })
    } else {
      throw new Error("Could not load strain") 
    }
  });
})