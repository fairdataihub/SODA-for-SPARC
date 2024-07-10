import { ipcMain, app } from "electron";
import excel4node from "excel4node";
import excelToJson from "convert-excel-to-json";
import mv from "mv";

ipcMain.handle("mv", (event, source, destination) => {
  mv(source, destination, function (err) {
    if (err) {
      console.log(err);
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
  const blueHeader = ["filename", "File Name", "file name"];
  const greenHeader = ["timestamp", "description", "file type"];
  const yellowHeader = ["Additional Metadata"];
  const wb = new excel4node.Workbook();
  // create wb style that makes the background styling
  const greenHeaderStyle = createWorkbookStyle(wb, "a8d08d");
  const yellowHeaderStyle = createWorkbookStyle(wb, "ffd965");
  const blueHeaderStyle = createWorkbookStyle(wb, "A0C2E6");
  const standardCellStyle = wb.createStyle({
    font: {
      bold: false,
      color: "#000000",
      size: 12,
      name: "Calibri",
    },
  });

  const wsOptions = {
    sheetFormat: {
      defaultColWidth: 20,
    },
  };
  const ws = wb.addWorksheet("Sheet1", wsOptions);
  const headingColumnNames = Object.keys(jsondata[0]);
  //Write Column Title in Excel file
  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    let styleObject = yellowHeaderStyle;
    if (blueHeader.includes(heading)) {
      styleObject = blueHeaderStyle;
    }
    if (yellowHeader.includes(heading)) {
      styleObject = yellowHeaderStyle;
    }
    if (greenHeader.includes(heading)) {
      styleObject = greenHeaderStyle;
    }

    ws.cell(1, headingColumnIndex++).string(heading).style(styleObject);
  });
  //Write Data in Excel file
  let rowIndex = 2;
  jsondata.forEach((record) => {
    let columnIndex = 1;
    Object.keys(record).forEach((columnName) => {
      ws.cell(rowIndex, columnIndex++).string(record[columnName]).style(standardCellStyle);
    });
    rowIndex++;
  });

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
