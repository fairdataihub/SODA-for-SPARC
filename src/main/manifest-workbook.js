import { ipcMain, app } from "electron";
import excel4node from "excel4node";
import excelToJson from "convert-excel-to-json";
import mv from "mv";

ipcMain.handle("mv", (event, source, destination) => {
  mv(source, destination, function (err) {
    if (err) {
      console.error(err);
      return err;
    } else {
      return "success";
    }
  });
});

ipcMain.handle("excelToJsonSheet1", (event, folderPath) => {
  let sheet = excelToJson({
    sourceFile: folderPath,
  })["Sheet1"];

  return sheet;
});

ipcMain.handle("excelToJsonSheet1Options", (event, options) => {
  let sheet = excelToJson(options)["Sheet1"];

  return sheet;
});

ipcMain.handle("convertJSONToSxlsx", async (event, jsondata, excelfile) => {
  // Helper function to create styles for workbook cells with specific background color
  const createWorkbookStyle = (wb, color) => {
    return wb.createStyle({
      fill: {
        type: "pattern",
        patternType: "solid",
        fgColor: color,
      },
      font: {
        bold: true,
        color: "#000000",
        size: 12,
        name: "Calibri",
      },
      border: {
        left: {
          style: "thin",
          color: "#000000",
        },
        right: {
          style: "thin",
          color: "#000000",
        },
        top: {
          style: "thin",
          color: "#000000",
        },
        bottom: {
          style: "thin",
          color: "#000000",
        },
      },
    });
  };

  // Define header categories with corresponding colors
  const headers = {
    blue: ["filename", "File Name", "file name"],
    green: ["timestamp", "description", "file type"],
    yellow: ["Additional Metadata"],
  };

  // Create a new workbook
  const wb = new excel4node.Workbook();
  // Define styles for headers and standard cells
  const styles = {
    blueHeaderStyle: createWorkbookStyle(wb, "A0C2E6"),
    greenHeaderStyle: createWorkbookStyle(wb, "a8d08d"),
    yellowHeaderStyle: createWorkbookStyle(wb, "ffd965"),
    standardCellStyle: wb.createStyle({
      font: {
        bold: false,
        color: "#000000",
        size: 12,
        name: "Calibri",
      },
    }),
  };

  // Worksheet options
  const wsOptions = {
    sheetFormat: {
      defaultColWidth: 20,
    },
  };

  // Add a worksheet to the workbook
  const ws = wb.addWorksheet("Sheet1", wsOptions);
  // Extract column names from the first JSON object
  const headingColumnNames = Object.keys(jsondata[0]);

  // Write Column Titles in Excel file
  headingColumnNames.forEach((heading, index) => {
    const columnIndex = index + 1;
    let styleObject = styles.yellowHeaderStyle;

    // Determine header style based on its category
    if (headers.blue.includes(heading)) {
      styleObject = styles.blueHeaderStyle;
    } else if (headers.green.includes(heading)) {
      styleObject = styles.greenHeaderStyle;
    }

    // Write the header with the appropriate style
    ws.cell(1, columnIndex).string(heading).style(styleObject);
  });

  // Write Data in Excel file
  jsondata.forEach((record, rowIndex) => {
    headingColumnNames.forEach((columnName, columnIndex) => {
      ws.cell(rowIndex + 2, columnIndex + 1)
        .string(record[columnName])
        .style(styles.standardCellStyle);
    });
  });

  // Save the workbook to the specified filepath
  await new Promise((resolve, reject) => {
    wb.write(excelfile, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
});
