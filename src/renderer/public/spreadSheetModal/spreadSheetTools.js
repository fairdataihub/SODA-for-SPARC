// this function runs when the DOM is ready, i.e. when the document has been parsed
document.addEventListener("DOMContentLoaded", function () {
  const { ipcRenderer } = require("electron");

  ipcRenderer.once("requested-spreadsheet", async (ev, spreadsheet) => {
    if (!spreadsheet || spreadsheet === "") {
      return;
    } else {
      let manifestHeaders = spreadsheet["headers"];
      let manifestFileData = spreadsheet["data"];
      let saveAndExitManifest = document.getElementById("manifest-save-exit");

      const readOnlyHeaders = ["A", "B"];
      const columnHeaders = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      if (manifestFileData[0][0] != "filename") {
        manifestFileData.unshift(manifestHeaders);
      }
      let manifestTable;

      const manifestSpreadsheetContainer = document.getElementById("manifest-edit");

      manifestTable = jspreadsheet(manifestSpreadsheetContainer, {
        tableOverflow: true,
        lazyLoading: true,
        loadingSpin: true,
        tableHeight: "calc(100vh - 230px)",
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
          E1: "background-color: #a8d08d; font-weight: 700;",
          F1: "background-color: #a8d08d; font-weight: 700;",
          G1: "background-color: #a8d08d; font-weight: 700;",
          H1: "background-color: #a8d08d; font-weight: 700;",
          I1: "background-color: #a8d08d; font-weight: 700;",
          J1: "background-color: #a8d08d; font-weight: 700;",
          K1: "background-color: #ffd965; font-weight: 700;",
        },
        // Add event handlers for cell selection
        onselection: function (instance, x1, y1, x2, y2, origin) {
          console.log("Cell selected:", x1, y1); // Debug log
          setTimeout(() => updateFormulaBar(instance, x1, y1), 10);
        },
        onclick: function (instance, cell, x, y, value, e) {
          console.log("Cell clicked:", x, y, "Value:", value); // Debug log

          setTimeout(() => updateFormulaBar(instance, x, y), 10);
        },
        onchange: function (instance, cell, x, y, value) {
          console.log("Cell changed:", x, y, "New value:", value); // Debug log

          setTimeout(() => updateFormulaBar(instance, x, y), 10);
        },
        onfocus: function (instance, cell, x, y, value) {
          console.log("Cell focused:", x, y, "Value:", value); // Debug log

          setTimeout(() => updateFormulaBar(instance, x, y), 10);
        },
      });

      // Function to update the formula bar
      function updateFormulaBar(instance, x, y) {
        console.log("Updating formula bar for cell:", x, y); // Debug log

        const cellReference = document.getElementById("cell-reference");
        const formulaInput = document.getElementById("formula-input");

        console.log("Formula bar elements found:", !!cellReference, !!formulaInput); // Debug log

        if (cellReference && formulaInput) {
          // Convert coordinates to Excel-like reference (A1, B2, etc.)
          const columnLetter = String.fromCharCode(65 + x); // 65 is 'A'
          const rowNumber = y + 1;
          const cellRef = columnLetter + rowNumber;

          // Get cell value
          let cellValue = manifestTable.getCellFromCoords(x, y) || "";
          if (cellValue) {
            cellValue = cellValue.innerText;
          }

          console.log("Cell reference:", cellRef, "Cell value:", cellValue); // Debug log

          // Update formula bar
          cellReference.textContent = cellRef;
          formulaInput.value = cellValue;
        } else {
          console.error("Formula bar elements not found!");
        }
      }

      // Customize the toolbar to include the formula bar - move this BEFORE the event listeners
      let toolBar = document.getElementsByClassName("jexcel_toolbar")[0];

      // Wait a bit to ensure toolbar is created
      setTimeout(() => {
        if (toolBar) {
          toolBar.innerHTML = "";
          toolBar.style.cssText = `
            display: flex;
            align-items: center;
            padding: 10px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #ddd;
            flex-wrap: wrap;
            gap: 10px;
          `;

          toolBar.innerHTML = `
            <!-- Undo/Redo Section -->
            <div style="display: flex; gap: 10px;">
              <div style="text-align: center;">
                <i class="jexcel_toolbar_item material-icons" data-k="undefined" data-v="undefined" id="undo-btn" style="cursor: pointer;">undo</i>
                <p style="margin: 0; font-size: 12px;">Undo</p>
              </div>
              <div style="text-align: center;">
                <i class="jexcel_toolbar_item material-icons" data-k="undefined" data-v="undefined" id="redo-btn" style="cursor: pointer;">redo</i>
                <p style="margin: 0; font-size: 12px;">Redo</p>
              </div>
            </div>
            
            <!-- Separator -->
            <div style="width: 1px; height: 30px; background-color: #ddd; margin: 0 5px;"></div>
            
            <!-- Formula Bar Section -->
            <div style="display: flex; align-items: center; flex: 1; min-width: 300px;">
              <span id="cell-reference" style="
                min-width: 60px;
                padding: 5px 10px;
                border: 1px solid #ddd;
                background-color: white;
                margin-right: 10px;
                font-weight: bold;
                text-align: center;
                border-radius: 3px;
                font-size: 12px;
              ">A1</span>
              <input id="formula-input" type="text" style="
                flex: 1;
                border: 1px solid #ddd;
                padding: 5px 10px;
                font-size: 13px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                border-radius: 3px;
                min-width: 200px;
              " placeholder="Cell content will appear here..." />
            </div>
          `;

          // Add event listeners for undo/redo after creating the buttons
          document.getElementById("undo-btn").addEventListener("click", function () {
            manifestTable.undo();
          });

          document.getElementById("redo-btn").addEventListener("click", function () {
            manifestTable.redo();
          });

          // Add event listeners for formula input
          const formulaInput = document.getElementById("formula-input");
          if (formulaInput) {
            formulaInput.addEventListener("keydown", function (e) {
              if (e.key === "Enter") {
                const selected = manifestTable.getSelected();
                if (selected && selected.length > 0) {
                  const x = selected[0][0];
                  const y = selected[0][1];
                  manifestTable.setValue(x, y, this.value);
                  updateFormulaBar(manifestTable, x, y);
                }
              }
            });

            formulaInput.addEventListener("blur", function () {
              const selected = manifestTable.getSelected();
              if (selected && selected.length > 0) {
                const x = selected[0][0];
                const y = selected[0][1];
                manifestTable.setValue(x, y, this.value);
              }
            });
          }

          // Initialize formula bar with first cell
          setTimeout(() => {
            updateFormulaBar(manifestTable, 0, 0);
          }, 100);
        }
      }, 100);

      // Create event listener for saving and exiting
      saveAndExitManifest.addEventListener("click", () => {
        const savedData = manifestTable.getData();
        const savedHeaders = savedData[0];
        let breakOut = 0;
        savedData.shift();

        for (let i = savedHeaders.length - 1; i >= 0; i--) {
          if (breakOut > 2) {
            break;
          }
          if (savedHeaders[i] === "") {
            savedHeaders.splice(i, 1);
          } else {
            breakOut++;
          }
        }

        breakOut = 0;
        for (let i = savedData.length - 1; i >= 0; i--) {
          if (breakOut > 2) {
            break;
          }
          if (savedData[i][0] === "") {
            savedData.splice(i, 1);
          } else {
            breakOut++;
          }
        }

        ipcRenderer.send("spreadsheet-results", [savedHeaders, savedData]);
      });
    }
  });
});
