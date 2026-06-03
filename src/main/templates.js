import { ipcMain } from "electron";
import fs from "fs";
// import exceljs
import ExcelJS from "exceljs";
ipcMain.handle("write-template", async (event, templatePath, destinationPath, helperConfig) => {
  // If a helperConfig is supplied and the file is an Excel workbook,
  // try to load and modify it using `exceljs`. If `exceljs` is not
  // available or modification fails, fall back to a straight copy.
  console.log("write-template handler called", { templatePath, destinationPath, helperConfig });
  try {
    if (helperConfig && templatePath.toLowerCase().endsWith(".xlsx")) {
      console.log("Processing with helperConfig:", helperConfig);
      // Use the regular import for ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);

      if (helperConfig.disabledColumns) {
        const disabledColumnFillColor = "FFCCCCCC"; // standard disabled gray
        const disabledCols = helperConfig.disabledColumns.map((col) => col.toLowerCase());
        console.log("Disabling columns in template:", disabledCols);

        workbook.eachSheet((worksheet) => {
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            if (disabledCols.includes(String(cell.value).toLowerCase())) {
              console.log(
                `Coloring column ${colNumber} ('${cell.value}') gray in sheet '${worksheet.name}'`
              );
              // Color rows 2-2000 in this column gray
              for (let r = 2; r <= 2000; r++) {
                const targetCell = worksheet.getRow(r).getCell(colNumber);
                // Always apply the gray fill (existing "pattern" fills need to be overwritten)
                targetCell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: disabledColumnFillColor },
                };
                // Lock the cell so it cannot be edited
                targetCell.protection = { locked: true };
              }
            }
          });
          // Auto-fit all columns based on header width
          headerRow.eachCell((cell, colNumber) => {
            const headerText = String(cell.value || "");
            const estimatedWidth = Math.max(headerText.length + 2, 12);
            worksheet.getColumn(colNumber).width = estimatedWidth;
          });
        });
      }

      if (helperConfig.sampleCountsBySubject) {
        const sampleCountsBySubject = helperConfig.sampleCountsBySubject;
        const firstSheet = workbook.worksheets[0];

        if (firstSheet) {
          const headerRow = firstSheet.getRow(1);
          let subjectIdColNumber = null;

          headerRow.eachCell((cell, colNumber) => {
            const headerValue = String(cell.value || "")
              .toLowerCase()
              .trim();
            if (headerValue === "subject id") {
              subjectIdColNumber = colNumber;
            }
          });

          if (subjectIdColNumber) {
            let currentRow = 2;

            for (const [subjectId, countRaw] of Object.entries(sampleCountsBySubject)) {
              const count = Number(countRaw) || 0;
              for (let i = 0; i < count; i++) {
                firstSheet.getRow(currentRow).getCell(subjectIdColNumber).value = subjectId;
                currentRow += 1;
              }
            }
          }
        }
      }

      if (helperConfig.siteCountsBySubject || helperConfig.siteCountsBySample) {
        const firstSheet = workbook.worksheets[0];

        if (firstSheet) {
          const headerRow = firstSheet.getRow(1);
          let siteIdColNumber = null;
          let specimenIdColNumber = null;

          headerRow.eachCell((cell, colNumber) => {
            const headerValue = String(cell.value || "")
              .toLowerCase()
              .trim();
            if (headerValue === "site id") {
              siteIdColNumber = colNumber;
            }
            if (headerValue === "specimen id") {
              specimenIdColNumber = colNumber;
            }
          });

          if (siteIdColNumber && specimenIdColNumber) {
            let currentRow = 2;
            let siteCounter = 1;

            const siteCountsBySubject = helperConfig.siteCountsBySubject || {};
            for (const [subjectId, countRaw] of Object.entries(siteCountsBySubject)) {
              const count = Number(countRaw) || 0;
              for (let i = 0; i < count; i++) {
                firstSheet.getRow(currentRow).getCell(siteIdColNumber).value =
                  `site-${siteCounter}`;
                firstSheet.getRow(currentRow).getCell(specimenIdColNumber).value = subjectId;
                siteCounter += 1;
                currentRow += 1;
              }
            }

            const siteCountsBySample = helperConfig.siteCountsBySample || {};
            for (const [sampleId, countRaw] of Object.entries(siteCountsBySample)) {
              const count = Number(countRaw) || 0;
              for (let i = 0; i < count; i++) {
                firstSheet.getRow(currentRow).getCell(siteIdColNumber).value =
                  `site-${siteCounter}`;
                firstSheet.getRow(currentRow).getCell(specimenIdColNumber).value = sampleId;
                siteCounter += 1;
                currentRow += 1;
              }
            }
          }
        }
      }

      // Create a copy of the first sheet and append it
      try {
        const firstSheet = workbook.worksheets[0];
        if (firstSheet) {
          const copiedSheet = workbook.addWorksheet(`${firstSheet.name} (copy)`);

          // Copy all rows and their formatting
          for (let r = 1; r <= firstSheet.rowCount; r++) {
            const sourceRow = firstSheet.getRow(r);
            const targetRow = copiedSheet.getRow(r);
            targetRow.height = sourceRow.height;

            sourceRow.eachCell((cell, colNumber) => {
              const targetCell = targetRow.getCell(colNumber);
              targetCell.value = cell.value;
              targetCell.fill = { ...cell.fill };
              targetCell.font = { ...cell.font };
              targetCell.alignment = { ...cell.alignment };
              targetCell.border = { ...cell.border };
              targetCell.protection = { ...cell.protection };
              targetCell.numFmt = cell.numFmt;
            });
          }

          // Copy column widths
          for (let c = 1; c <= firstSheet.columnCount; c++) {
            const sourceCol = firstSheet.getColumn(c);
            const targetCol = copiedSheet.getColumn(c);
            targetCol.width = sourceCol.width;
          }

          console.log(`Created copy of sheet '${firstSheet.name}' as '${copiedSheet.name}'`);
        }
      } catch (err) {
        console.warn("Failed to create sheet copy:", err);
      }

      if (helperConfig.prePopulate) {
        for (const [sheetName, entries] of Object.entries(helperConfig.prePopulate)) {
          const sheet = workbook.getWorksheet(sheetName);
          if (!sheet) continue;
          for (const entry of entries) {
            try {
              sheet.getCell(entry.cell).value = entry.value;
            } catch (e) {
              // ignore invalid cell refs
            }
          }
        }
      }

      await workbook.xlsx.writeFile(destinationPath);
      return;
    }
  } catch (err) {
    // If any error occurs (exceljs not installed or modification failed),
    // fall back to copying the template file as-is.
    try {
      console.warn("Could not apply helperConfig to template, falling back to copy:", err);
    } catch (e) {}
    fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath));
    return;
  }

  // Default: just copy the file
  fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath));
  return;
});

ipcMain.handle("get-current-directory", async (event) => {
  return __dirname;
});
