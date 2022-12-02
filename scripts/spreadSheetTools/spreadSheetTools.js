// this function runs when the DOM is ready, i.e. when the document has been parsed
document.addEventListener("DOMContentLoaded", function () {
  const ipcRenderer = require("electron").ipcRenderer;

  //Request the spreadsheet data from main
  ipcRenderer.on("requested-spreadsheet", async (ev, spreadsheet) => {
    if (!spreadsheet || spreadsheet === "") {
      console.log("No spreadsheet");
      return;
    } else {
      //spreadsheet obtained, create jspreadsheet
      let manifestFileHeaders = spreadsheet["headers"];
      let manifestFileData = spreadsheet["data"];
      console.log(manifestFileHeaders);
      console.log(manifestFileData);
      let saveAndExitManifest = document.getElementById("manifest-save-exit");

      const allHeaders = [
        "filename",
        "timestamp",
        "description",
        "file type",
        "Additional Metadata",
      ];
      const readOnlyHeaders = ["A", "B", "D"];
      const columnHeaders = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
      if (manifestFileData[0][0] != "filename") {
        manifestFileData.unshift(allHeaders);
      }
      console.log(manifestFileData[0][0]);
      let manifestTable;

      const manifestSpreadsheetContainer = document.getElementById("manifest-edit");
      manifestTable = jspreadsheet(manifestSpreadsheetContainer, {
        tableOverflow: true,
        lazyLoading: true,
        loadingSpin: true,
        tableHeight: "calc(100vh - 193px)",
        tableWidth: "calc(100vw - 23px)",
        toolbar: [
          {
            type: "i",
            content: "undo",
            onclick: function () {
              manifestTable.undo();
            },
          },
          {
            type: "i",
            content: "redo",
            onclick: function () {
              manifestTable.redo();
            },
          },
        ], //array of objects
        data: manifestFileData,
        columns: columnHeaders.map((header) => {
          return {
            readOnly: readOnlyHeaders.includes(header) ? true : false,
            type: "text",
            title: header,
            width: "204px",
          };
        }),
      });

      //create event listener for saving and exiting
      saveAndExitManifest.addEventListener("click", () => {
        //extract headers and data
        const savedHeaders = manifestTable.getHeaders().split(",");
        const savedData = manifestTable.getData();
        const result = [savedHeaders, savedData];

        //send spreadsheet data back to main
        ipcRenderer.send("spreadsheet-results", result);
      });
    }
  });
});
