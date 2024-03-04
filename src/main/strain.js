import { ipcMain } from "electron";
import axios from "axios";

ipcMain.handle("getStrainData", async (event, rrid) => {
  let organismResponse = await axios.get(`https://scicrunch.org/resolver/${rrid}.json`, {
    headers: {
      "Content-Type": "application/json",
      apiKey: "2YOfdcQRDVN6QZ1V6x3ZuIAsuypusxHD",
    },
  });
  return organismResponse.data;
});
