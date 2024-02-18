import { ipcMain } from "electron";
import axios from "axios";

ipcMain.handle("getStrainData", async (event) => {
  let organismResponse = await axios.get(
    "https://api.scicrunch.io/elastic/v1/RIN_Organism_pr/_search?q=Yucatan",
    {
      headers: {
        "Content-Type": "application/json",
        apiKey: "2YOfdcQRDVN6QZ1V6x3ZuIAsuypusxHD",
      },
    }
  );

  return organismResponse.data;
});
