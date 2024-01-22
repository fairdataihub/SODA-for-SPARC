import https from "https";
import { ipcMain } from "electron";


ipcMain.handle("getStrainData", async (event, rridInfo) => {
  let data = await new Promise((resolve, reject) => { 
    https.get(rridInfo, async (res) => {
    let data = ""; 
    let dataReady = false; 
    if (res.statusCode === 200) {
      res.setEncoding("utf8");
      res.on("data", (d) => {
        data += d;
      });
      res.on("end", () => {
        dataReady = true 
        })

      while(!dataReady) {
        // wait for 1 second
        await new Promise(r => setTimeout(r, 1000));
      }

      resolve(data)
    } else {
      reject("Could not load strain") 
    }
  })
})



  // let xmlSerializer = new XMLSerializer();
  // let serialized =  xmlSerializer.serializeToString(data) 
  return data
})