import { ipcMain } from "electron";
import fs from "fs";
import XLSX from "xlsx";
ipcMain.handle("write-template", async (event, templatePath, destinationPath, helperConfig) => {
  try {
    if (helperConfig && templatePath.toLowerCase().endsWith(".xlsx")) {
      // Read the workbook using XLSX
      const workbook = XLSX.readFile(templatePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Get headers from first row (preserve all original cell properties including formatting)
      const headers = {};
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const headerValue = worksheet[cellAddress]?.v || "";
        headers[col] = headerValue;
      }

      // Handle sampleCountsBySubject
      if (helperConfig.sampleCountsBySubject) {
        let subjectIdColNum = null;
        for (const [colNum, header] of Object.entries(headers)) {
          if (String(header).toLowerCase().trim() === "subject id") {
            subjectIdColNum = parseInt(colNum);
            break;
          }
        }

        if (subjectIdColNum !== null) {
          let currentRow = 1;
          for (const [subjectId, countRaw] of Object.entries(helperConfig.sampleCountsBySubject)) {
            const count = Number(countRaw) || 0;
            for (let i = 0; i < count; i++) {
              const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: subjectIdColNum });
              // Preserve existing cell if it exists, only update the value
              if (worksheet[cellAddress]) {
                worksheet[cellAddress].v = subjectId;
              } else {
                worksheet[cellAddress] = { v: subjectId, t: "s" };
              }
              currentRow += 1;
            }
          }
        }
      }

      // Handle siteCountsBySubject and siteCountsBySample
      if (helperConfig.siteCountsBySubject || helperConfig.siteCountsBySample) {
        let specimenIdColNum = null;
        for (const [colNum, header] of Object.entries(headers)) {
          if (String(header).toLowerCase().trim() === "specimen id") {
            specimenIdColNum = parseInt(colNum);
            break;
          }
        }

        if (specimenIdColNum !== null) {
          let currentRow = 1;

          const siteCountsBySubject = helperConfig.siteCountsBySubject || {};
          for (const [subjectId, countRaw] of Object.entries(siteCountsBySubject)) {
            const count = Number(countRaw) || 0;
            for (let i = 0; i < count; i++) {
              const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: specimenIdColNum });
              if (worksheet[cellAddress]) {
                worksheet[cellAddress].v = subjectId;
              } else {
                worksheet[cellAddress] = { v: subjectId, t: "s" };
              }
              currentRow += 1;
            }
          }

          const siteCountsBySample = helperConfig.siteCountsBySample || {};
          for (const [sampleId, countRaw] of Object.entries(siteCountsBySample)) {
            const count = Number(countRaw) || 0;
            for (let i = 0; i < count; i++) {
              const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: specimenIdColNum });
              if (worksheet[cellAddress]) {
                worksheet[cellAddress].v = sampleId;
              } else {
                worksheet[cellAddress] = { v: sampleId, t: "s" };
              }
              currentRow += 1;
            }
          }
        }
      }

      // Handle prePopulate (only for first sheet)
      if (helperConfig.prePopulate) {
        for (const entry of helperConfig.prePopulate) {
          try {
            // Preserve existing cell if it exists, only update the value
            if (worksheet[entry.cell]) {
              worksheet[entry.cell].v = entry.value;
            } else {
              worksheet[entry.cell] = { v: entry.value, t: "s" };
            }
          } catch (e) {
            // ignore invalid cell refs
          }
        }
      }

      // Write the modified workbook (preserves all original styling)
      XLSX.writeFile(workbook, destinationPath);
      return;
    }
  } catch (err) {
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
