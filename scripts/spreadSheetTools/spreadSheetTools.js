// this function runs when the DOM is ready, i.e. when the document has been parsed
document.addEventListener("DOMContentLoaded", function () {
  const ipcRenderer = require("electron").ipcRenderer;

  //Request the spreadsheet data from main
  ipcRenderer.once("requested-spreadsheet", async (ev, spreadsheet) => {
    if (!spreadsheet || spreadsheet === "") {
      return;
    } else {
      //spreadsheet obtained, create jspreadsheet
      let manifestHeaders = spreadsheet["headers"];
      let manifestFileData = spreadsheet["data"];
      let saveAndExitManifest = document.getElementById("manifest-save-exit");

      const readOnlyHeaders = ["A", "B", "D"];
      const columnHeaders = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
      if (manifestFileData[0][0] != "filename") {
        manifestFileData.unshift(manifestHeaders);
      }
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
        ],
        data: manifestFileData,
        columns: columnHeaders.map((header) => {
          return {
            readOnly: readOnlyHeaders.includes(header) ? true : false,
            type: "text",
            title: header,
            width: "204px",
          };
        }),
        style: {
          A1: "background-color: #A0C2E6; font-weight: 700;",
          B1: "background-color: #a8d08d; font-weight: 700;",
          C1: "background-color: #a8d08d; font-weight: 700;",
          D1: "background-color: #a8d08d; font-weight: 700;",
          E1: "background-color: #ffd965; font-weight: 700;",
          F1: "background-color: #ffd965; font-weight: 700;",
          G1: "background-color: #ffd965; font-weight: 700;",
          H1: "background-color: #ffd965; font-weight: 700;",
          I1: "background-color: #ffd965; font-weight: 700;",
        },
      });

      let toolBar = document.getElementsByClassName("jexcel_toolbar")[0];
      console.log(toolBar);
      toolBar.innerHTML = "";
      toolBar.innerHTML = `
        <div style="
        margin-right: 1rem;
        margin-left: 6px;
        "><i class="jexcel_toolbar_item material-icons" data-k="undefined" data-v="undefined" id="undefined">undo</i><p style="
        margin: 0;
        /* vertical-align: 1rem; */
        font-size: 14px;
        ">Undo</p></div>
        <div><i class="jexcel_toolbar_item material-icons" data-k="undefined" data-v="undefined" id="undefined">redo</i><p style="
        margin: 0;
        font-size: 14px;
        vertical-align: 1;
        ">Redo</p></div>
      `;

      //create event listener for saving and exiting
      saveAndExitManifest.addEventListener("click", () => {
        //extract headers and data
        const savedData = manifestTable.getData();
        const savedHeaders = savedData[0];
        savedData.shift();

        //remove extra columns created if headers are untitled
        if (savedHeaders[8] === "") savedHeaders.splice(8, 1);
        if (savedHeaders[7] === "") savedHeaders.splice(7, 1);
        if (savedHeaders[6] === "") savedHeaders.splice(6, 1);
        if (savedHeaders[5] === "") savedHeaders.splice(5, 1);

        const result = [savedHeaders, savedData];

        //send spreadsheet data back to main
        ipcRenderer.send("spreadsheet-results", result);
      });
    }
  });
});
