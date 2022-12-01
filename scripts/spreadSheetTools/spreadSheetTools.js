// this function runs when the DOM is ready, i.e. when the document has been parsed
document.addEventListener("DOMContentLoaded", function () {
  const ipcRenderer = require("electron").ipcRenderer;

  //Request the spreadsheet data from main
  ipcRenderer.on("requested-spreadsheet", async (ev, spreadsheet) => {
    if (!spreadsheet || spreadsheet === "") {
      console.log("HELP");
    } else {
      //spreadsheet obtained, create jspreadsheet
      let manifestFileHeaders = spreadsheet["headers"];
      let manifestFileData = spreadsheet["data"];
      let saveAndExitManifest = document.getElementById("manifest-save-exit");

      const readOnlyHeaders = ["filename", "file type", "timestamp"];

      let manifestTable;

      const manifestSpreadsheetContainer = document.getElementById("manifest-edit");
      manifestTable = jspreadsheet(manifestSpreadsheetContainer, {
        tableOverflow: true,
        lazyLoading: true,
        loadingSpin: true,
        data: manifestFileData,
        columns: manifestFileHeaders.map((header) => {
          return {
            readOnly: readOnlyHeaders.includes(header) ? true : false,
            type: "text",
            title: header,
            width: 200,
          };
        }),
      });

      //create event listener for saving and exiting
      saveAndExitManifest.addEventListener("click", () => {
        //send spreadsheet data back to main
        console.log("sending back results");
        //extract headers and data
        const savedHeaders = manifestTable.getHeaders().split(",");
        const savedData = manifestTable.getData();
        const result = [savedHeaders, savedData];
        ipcRenderer.send("spreadsheet-results", result);
      });
    }
  });
});
