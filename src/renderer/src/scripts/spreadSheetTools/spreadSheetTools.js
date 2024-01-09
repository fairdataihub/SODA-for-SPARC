import jspreadsheet from "jspreadsheet";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100))
}

// this function runs when the DOM is ready, i.e. when the document has been parsed
document.addEventListener("DOMContentLoaded", function () {


  //Request the spreadsheet data from main
  window.Electron.ipcRenderer.once("requested-spreadsheet", async (ev, spreadsheet) => {
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
        tableHeight: "calc(100vh - 190px)",
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
            readOnly: !!readOnlyHeaders.includes(header),
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
      toolBar.innerHTML = "";
      toolBar.innerHTML = `
        <div style="
        margin-right: 1rem;
        margin-left: 6px;
        "><i class="jexcel_toolbar_item material-icons" data-k="undefined" data-v="undefined" id="undefined">undo</i><p style="
        margin: 0;
        margin-top: -.5rem;
        font-size: 14px;
        ">Undo</p></div>
        <div><i class="jexcel_toolbar_item material-icons" data-k="undefined" data-v="undefined" id="undefined">redo</i><p style="
        margin: 0;
        font-size: 14px;
        vertical-align: 1;
        margin-top: -.5rem;
        ">Redo</p></div>
      `;

      //create event listener for saving and exiting
      saveAndExitManifest.addEventListener("click", () => {
        //extract headers and data
        const savedData = manifestTable.getData();
        const savedHeaders = savedData[0];
        let breakOut = 0;
        savedData.shift();

        //remove extra columns created if headers are untitled
        for (let i = savedHeaders.length - 1; i >= 0; i--) {
          if (breakOut > 2) {
            // After 2 rows of not being empty, break out of the loop
            break;
          }
          if (savedHeaders[i] === "") {
            savedHeaders.splice(i, 1);
          } else {
            breakOut++;
          }
        }

        // iterate through savedData and remove any rows that are empty
        breakOut = 0;
        for (let i = savedData.length - 1; i >= 0; i--) {
          if (breakOut > 2) {
            // After 2 rows of not being emtpy, break out of the loop
            break;
          }
          if (savedData[i][0] === "") {
            savedData.splice(i, 1);
          } else {
            breakOut++;
          }
        }

        //send spreadsheet data back to main
        ipcRenderer.send("spreadsheet-results", [savedHeaders, savedData]);
      });
    }
  });
});
