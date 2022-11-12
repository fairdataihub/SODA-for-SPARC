const { platform } = require("os");

const { copyFile, readdir } = require("fs").promises;

// opendropdown event listeners
document.querySelectorAll(".manifest-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "bf");
  });
});

document.querySelectorAll(".manifest-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "dataset");
  });
});

var jstreePreviewManifest = document.getElementById("div-dataset-tree-preview-manifest");

const guidedJsTreePreviewManifest = document.getElementById(
  "guided-div-dataset-tree-preview-manifest"
);

function showLocalDatasetManifest() {
  ipcRenderer.send("open-file-dialog-local-dataset-manifest-purpose");
}

function selectManifestGenerationLocation() {
  ipcRenderer.send("open-file-dialog-local-dataset-manifest-generate-purpose");
}

const openDirectoryAtManifestGenerationLocation = (generationLocation) => {
  openFolder(generationLocation);
  return;
};

function openFolder(generationLocation) {
  // create the folder path
  try {
    client.get("/datasets/open", {
      params: {
        dataset_path: generationLocation,
      },
    });
  } catch (error) {
    console.error(error);
    clientError(error);
    Swal.fire({
      title: "Error",
      text: `Could not open the new manifest folder for you. Please view your manifest files by navigating to ${generationLocation}.`,
      icon: "error",
      confirmButtonText: "Ok",
    });
  }
}

$(document).ready(function () {
  ipcRenderer.on("selected-local-dataset-manifest-purpose", (event, folderPath) => {
    if (folderPath.length > 0) {
      if (folderPath !== null) {
        document.getElementById("input-manifest-local-folder-dataset").placeholder = folderPath[0];
        localDatasetFolderPath = folderPath[0];
        $("#div-confirm-manifest-local-folder-dataset").css("display", "flex");
        $($("#div-confirm-manifest-local-folder-dataset button")[0]).show();
      } else {
        document.getElementById("input-manifest-local-folder-dataset").placeholder = "Browse here";
        localDatasetFolderPath = "";
        $("#div-confirm-manifest-local-folder-dataset").hide();
        $("#Question-prepare-manifest-2").nextAll().removeClass("show").removeClass("prev");
      }
    } else {
      document.getElementById("input-manifest-local-folder-dataset").placeholder = "Browse here";
      localDatasetFolderPath = "";
      $("#div-confirm-manifest-local-folder-dataset").hide();
      $("#Question-prepare-manifest-2").nextAll().removeClass("show").removeClass("prev");
    }
  });

  ipcRenderer.on("selected-local-dataset-manifest-generate-purpose", (event, folderPath) => {
    if (folderPath.length <= 0 || folderPath === null) {
      document.getElementById("input-manifest-local-gen-location").placeholder = "Browse here";
      return;
    }

    document.getElementById("input-manifest-local-gen-location").placeholder = folderPath[0];
  });

  $("#bf_dataset_create_manifest").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_create_manifest").text().trim() !== "None") {
      $("#div-check-bf-create-manifest").css("display", "flex");
      $($("#div-check-bf-create-manifest").children()[0]).show();
    } else {
      $("#div-check-bf-create-manifest").css("display", "none");
    }
    $("#Question-prepare-manifest-3").nextAll().removeClass("show").removeClass("prev");
  });

  $(jstreePreviewManifest).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });
  $(guidedJsTreePreviewManifest).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });

  $(jstreePreviewManifest).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });
  $(guidedJsTreePreviewManifest).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });

  $(jstreePreviewManifest).jstree({
    core: {
      check_callback: true,
      data: {},
      dblclick_toggle: false,
    },
    plugins: ["types"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });
  $(guidedJsTreePreviewManifest).jstree({
    core: {
      check_callback: true,
      data: {},
      dblclick_toggle: false,
    },
    plugins: ["types"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });

  var jsonManifest = {};

  $(jstreePreviewManifest).on("select_node.jstree", function (evt, data) {
    if (data.node.text === "manifest.xlsx") {
      // Show loading popup
      Swal.fire({
        title: `Loading the manifest file.`,
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      var parentFolderName = $("#" + data.node.parent + "_anchor").text();
      var localFolderPath = path.join(homeDirectory, "SODA", "manifest_files", parentFolderName);
      var selectedManifestFilePath = path.join(localFolderPath, "manifest.xlsx");
      jsonManifest = excelToJson({
        sourceFile: selectedManifestFilePath,
        columnToKey: {
          "*": "{{columnHeader}}",
        },
      })["Sheet1"];
      Swal.fire({
        title:
          "<span style='font-size: 18px !important;'>Edit the manifest file below: </span> <br><span style='font-size: 13px; font-weight: 500'> Tip: Double click on a cell to edit it.<span>",
        html: "<div id='div-manifest-edit'></div>",
        allowEscapeKey: false,
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "Confirm",
        showCancelButton: true,
        width: "90%",
        // height: "80%",
        customClass: "swal-large",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {
        $(jstreePreviewManifest).jstree().deselect_all(true);
        // sort the updated json object (since users might have added new columns)
        let manifestHeaders = table1.getHeaders().split(",");
        let manifestEntries = table1.getData();
        let sortedJSON = processManifestInfo(manifestHeaders, manifestEntries);
        // // write this new json to existing manifest.json file
        jsonManifest = JSON.stringify(sortedJSON);
        // convert manifest.json to existing manifest.xlsx file
        convertJSONToXlsx(JSON.parse(jsonManifest), selectedManifestFilePath);
      });
      loadManifestFileEdits(jsonManifest);
    }
  });
  $(guidedJsTreePreviewManifest).on("select_node.jstree", function (evt, data) {
    if (data.node.text === "manifest.xlsx") {
      // Show loading popup
      Swal.fire({
        title: `Loading the manifest file.`,
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      var parentFolderName = $("#" + data.node.parent + "_anchor").text();
      var localFolderPath = path.join(
        homeDirectory,
        "SODA",
        "Guided-Manifest-Files",
        sodaJSONObj["digital-metadata"]["name"],
        parentFolderName
      );
      var selectedManifestFilePath = path.join(localFolderPath, "manifest.xlsx");
      jsonManifest = excelToJson({
        sourceFile: selectedManifestFilePath,
        columnToKey: {
          "*": "{{columnHeader}}",
        },
      })["Sheet1"];
      Swal.fire({
        title:
          "<span style='font-size: 18px !important;'>Edit the manifest file below: </span> <br><span style='font-size: 13px; font-weight: 500'> Tip: Double click on a cell to edit it.<span>",
        html: "<div id='div-manifest-edit'></div>",
        allowEscapeKey: false,
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "Confirm",
        showCancelButton: true,
        width: "90%",
        // height: "80%",
        customClass: "swal-large",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {
        $(jstreePreviewManifest).jstree().deselect_all(true);
        // sort the updated json object (since users might have added new columns)
        let manifestHeaders = table1.getHeaders().split(",");
        let manifestEntries = table1.getData();
        let sortedJSON = processManifestInfo(manifestHeaders, manifestEntries);
        // // write this new json to existing manifest.json file
        jsonManifest = JSON.stringify(sortedJSON);
        // convert manifest.json to existing manifest.xlsx file
        convertJSONToXlsx(JSON.parse(jsonManifest), selectedManifestFilePath);
      });
      loadManifestFileEdits(jsonManifest);
      b;
    }
  });
});

function convertJSONToXlsx(jsondata, excelfile) {
  const requiredManifestHeaders = ["filename", "timestamp", "description", "file type"];
  const wb = new excel4node.Workbook();
  // create wb style that makes the background red
  const requiredHeaderStyle = wb.createStyle({
    fill: {
      type: "pattern",
      patternType: "solid",
      fgColor: "a8d08d",
    },
    font: {
      bold: true,
      color: "#000000",
      size: 12,
      name: "Calibri",
    },
  });
  const optionalHeaderStyle = wb.createStyle({
    fill: {
      type: "pattern",
      patternType: "solid",
      fgColor: "ffd965",
    },
    font: {
      bold: true,
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
    let styleObject = requiredManifestHeaders.includes(heading)
      ? requiredHeaderStyle
      : optionalHeaderStyle;

    ws.cell(1, headingColumnIndex++)
      .string(heading)
      .style(styleObject);
  });
  //Write Data in Excel file
  let rowIndex = 2;
  jsondata.forEach((record) => {
    let columnIndex = 1;
    Object.keys(record).forEach((columnName) => {
      ws.cell(rowIndex, columnIndex++).string(record[columnName]);
    });
    rowIndex++;
  });
  wb.write(excelfile);
}

var table1;
function loadManifestFileEdits(jsondata) {
  let columns = Object.keys(jsondata[0]);
  let columnList = [];
  for (let i = 0; i < columns.length; i++) {
    let subColumn = {
      type: "text",
      tableWidth: "100%",
      width: "200px",
      name: columns[i],
      title: columns[i],
      readOnly: false,
    };
    columnList.push(subColumn);
  }
  // After ID in pop has been initiated, initialize jspreadsheet
  table1 = jspreadsheet(document.getElementById("div-manifest-edit"), {
    data: jsondata.slice(1),
    columns: columnList,
    contextMenu: function (obj, x, y, e) {
      var items = [];
      if (y == null) {
        // Insert a new column
        if (obj.options.allowInsertColumn == true) {
          items.push({
            title: obj.options.text.insertANewColumnBefore,
            onclick: function () {
              obj.insertColumn(1, parseInt(x), 1);
              $("#div-manifest-edit")
                .find("table")
                .find("thead")
                .find("td")
                .dblclick(function (e) {
                  e.target.contentEditable = true;
                  e.target.innerText = "";
                  e.target.focus();
                });
            },
          });
        }
        if (obj.options.allowInsertColumn == true) {
          items.push({
            title: obj.options.text.insertANewColumnAfter,
            onclick: function () {
              obj.insertColumn(1, parseInt(x), 0);
              $("#div-manifest-edit")
                .find("table")
                .find("thead")
                .find("td")
                .dblclick(function (e) {
                  e.target.contentEditable = true;
                  e.target.innerText = "";
                  e.target.focus();
                });
            },
          });
        }
        // Delete a column
        if (obj.options.allowDeleteColumn == true) {
          items.push({
            title: obj.options.text.deleteSelectedColumns,
            onclick: function () {
              obj.deleteColumn(obj.getSelectedColumns().length ? undefined : parseInt(x));
            },
          });
        }
      }
      return items;
    },
  });
  $("#div-manifest-edit")
    .find("table")
    .find("thead")
    .find("td")
    .dblclick(function (e) {
      e.target.contentEditable = true;
      e.target.innerText = "";
      e.target.focus();
    });
}

const processManifestInfo = (headers, data) => {
  let sortedArr = [];
  // sort json data by appending ordered entries (by columns) to each object's element
  for (let i = 0; i < data.length; i++) {
    let temp = {};
    for (let j = 0; j < headers.length; j++) {
      let header = headers[j];
      temp[header] = data[i][j];
    }
    sortedArr.push(temp);
  }
  return sortedArr;
};

var localDatasetFolderPath = "";
var finalManifestGenerationPath = "";
let pennsievePreview = false;

async function generateManifestPrecheck(manifestEditBoolean, ev) {
  // if doing a local generation ( but not as part of the Pennsieve preview flow ) make sure the input
  // that indicates where the manifest files will be generated is not empty
  if (
    ev.getAttribute("id") == document.getElementById("btn-local-manifest-gen").getAttribute("id")
  ) {
    // check if the input is empty
    if (
      document.querySelector("#input-manifest-local-gen-location").placeholder === "Browse here"
    ) {
      Swal.fire({
        title: "Please select a destination folder for the manifest file",
        icon: "error",
        confirmButtonText: "OK",
        heightAuto: false,
        backdrop: "rgba(0,0,0,0.4)",
      });
      return;
    }
  }

  var type = "local";
  pennsievePreview = false;
  if ($('input[name="generate-manifest-1"]:checked').prop("id") === "generate-manifest-from-Penn") {
    type = "bf";
  }

  if (
    ev.getAttribute("id") ==
    document.getElementById("generate-local-preview-manifest").getAttribute("id")
  ) {
    type = "local";
    pennsievePreview = true;
  }

  exitCurate();
  sodaJSONObj["starting-point"] = {};
  sodaJSONObj["dataset-structure"] = {};
  datasetStructureJSONObj = { folders: {}, files: {} };
  sodaJSONObj["metadata-files"] = {};
  let continueProgressValidateDataset = true;
  let continueProgressEmptyFolder = true;
  var titleTerm = "folder";

  if (type === "bf") {
    titleTerm = "on Pennsieve";
  } else {
    if (!pennsievePreview) {
      continueProgressValidateDataset = validateSPARCdataset();
    }
  }

  if (!continueProgressValidateDataset) {
    return;
  }

  let localGenerationDifferentDestination = false;
  if (
    document.querySelector("#input-manifest-local-gen-location").placeholder !==
    document.querySelector("#input-manifest-local-folder-dataset").placeholder
  ) {
    localGenerationDifferentDestination = true;
  }

  await wait(500);
  if (!pennsievePreview && !localGenerationDifferentDestination) {
    var { value: continueProgress } = await Swal.fire({
      title: `Any existing manifest.xlsx file(s) in the specified dataset ${titleTerm} will be replaced.`,
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });

    if (!continueProgress) {
      return;
    }
  }

  Swal.fire({
    title: "Generating the manifest.xlsx file(s)",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});

  // clean the manifest files by dropping empty columns ( keep the required columns even if empty )
  await dropEmptyManifestColumns();

  await generateManifest("", type, manifestEditBoolean, ev);

  return;
}

async function generateManifest(action, type, manifestEditBoolean, ev) {
  // Swal.fire({
  //   title: "Reviewing the dataset structure.",
  //   html: "Please wait...",
  //   allowEscapeKey: false,
  //   allowOutsideClick: false,
  //   showConfirmButton: false,
  //   heightAuto: false,
  //   backdrop: "rgba(0,0,0, 0.4)",
  //   didOpen: () => {
  //     Swal.showLoading();
  //   },
  // }).then((result) => { });
  // Case 1: Local dataset
  if (type === "local") {
    if (finalManifestGenerationPath === "") {
      finalManifestGenerationPath = document.querySelector(
        "#input-manifest-local-gen-location"
      ).placeholder;
    }
    sodaJSONObj["starting-point"]["local-path"] = finalManifestGenerationPath;

    //checking size of local folder path
    checkDiskSpace(finalManifestGenerationPath).then(async (diskSpace) => {
      let freeMem = diskSpace.free;
      //if free memory is less than 3MB
      if (freeMem < 3145728) {
        Swal.fire({
          title: "Not enough space in local storage",
          html: "Please select another storage device or free up 3MB",
          allowEscapeKey: true,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "warning",
          showConfirmButton: "OK",
        });
        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.MANIFEST,
          AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          Destinations.LOCAL
        );

        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.MANIFEST,
          AnalyticsGranularity.ACTION,
          "Generate - Check Storage Space",
          Destinations.LOCAL
        );
      } else {
        if (pennsievePreview) {
          generateAfterEdits();
          return;
        }

        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.MANIFEST,
          AnalyticsGranularity.ACTION,
          "Generate - Check Storage Space",
          Destinations.LOCAL
        );

        sodaJSONObj["starting-point"]["type"] = "local";
        // if the manifest is going to be recreated post edits
        if (manifestEditBoolean) {
          localDatasetFolderPath = $("#input-manifest-local-folder-dataset").attr("placeholder");
        }

        create_json_object(action, sodaJSONObj, localDatasetFolderPath);
        datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
        populate_existing_folders(datasetStructureJSONObj);
        populate_existing_metadata(sodaJSONObj);
        sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
        sodaJSONObj["bf-account-selected"] = {};
        sodaJSONObj["bf-dataset-selected"] = {};
        sodaJSONObj["generate-dataset"] = {};
        // check for empty folders/sub-folders
        let continueProgressEmptyFolder = await checkEmptySubFolders(
          sodaJSONObj["dataset-structure"]
        );
        if (continueProgressEmptyFolder === false) {
          Swal.fire({
            title: "Failed to generate the manifest files.",
            text: "The dataset contains one or more empty folder(s). Per SPARC guidelines, a dataset must not contain any empty folders. Please remove them before generating the manifest files.",
            heightAuto: false,
            icon: "error",
            showConfirmButton: true,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          }).then((result) => {});

          // log the error to analytics
          logMetadataForAnalytics(
            "Error",
            MetadataAnalyticsPrefix.MANIFEST,
            AnalyticsGranularity.ALL_LEVELS,
            "Generate",
            Destinations.LOCAL
          );
          $("#div-confirm-manifest-local-folder-dataset").hide();
          return;
        }

        // check for no SPARC folders on a Pennsieve datasets (already include check for a local dataset)
        let continueProgressNoSPARCFolders = await checkNoSparcFolders(
          sodaJSONObj["dataset-structure"]
        );
        if (continueProgressNoSPARCFolders === true) {
          Swal.fire({
            title: "Failed to generate the manifest files.",
            text: "The dataset does not contain any SPARC folder(s). Please choose a valid dataset before generating the manifest files.",
            heightAuto: false,
            icon: "error",
            showConfirmButton: true,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          }).then((result) => {});
          // log the error to analytics
          logMetadataForAnalytics(
            "Error",
            MetadataAnalyticsPrefix.MANIFEST,
            AnalyticsGranularity.ALL_LEVELS,
            "Generate",
            Destinations.LOCAL
          );
          $("#div-confirm-manifest-local-folder-dataset").hide();
          return;
        }

        // check for invalid high level folders in a dataset
        let continueProgressInvalidFolders = await checkInvalidHighLevelFolders(
          sodaJSONObj["dataset-structure"]
        );
        if (continueProgressInvalidFolders === true) {
          Swal.fire({
            title: "Failed to generate the manifest files.",
            text: "The dataset contains invalid, non-SPARC high level folder(s). Please delete or rename them according to SPARC standards before generating the manifest files.",
            heightAuto: false,
            showConfirmButton: true,
            icon: "error",
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          }).then((result) => {});
          // log the error to analytics
          logMetadataForAnalytics(
            "Error",
            MetadataAnalyticsPrefix.MANIFEST,
            AnalyticsGranularity.ALL_LEVELS,
            "Generate",
            Destinations.LOCAL
          );
          $("#div-confirm-manifest-local-folder-dataset").hide();
          return;
        }

        generateManifestHelper();
        initiate_generate_manifest_local(manifestEditBoolean, localDatasetFolderPath);
      }
    });
  } else {
    // Case 2: bf dataset
    if (manifestEditBoolean) {
      generateAfterEdits();
    } else {
      sodaJSONObj["bf-account-selected"] = { "account-name": defaultBfAccount };
      sodaJSONObj["bf-dataset-selected"] = { "dataset-name": defaultBfDataset };
      extractBFDatasetForManifestFile(false, defaultBfAccount, defaultBfDataset, ev);
    }
  }
}

async function generateManifestHelper() {
  updateJSONStructureManifestGenerate();
  // now call the upload function including generating the manifest file(s)
  if (sodaJSONObj["starting-point"]["type"] === "local") {
    sodaJSONObj["starting-point"]["type"] = "new";
  }
  let dataset_name = "";
  let dataset_destination = "";

  if ("bf-dataset-selected" in sodaJSONObj) {
    dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    dataset_destination = "Pennsieve";
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      let destination = sodaJSONObj["generate-dataset"]["destination"];
      if (destination == "local") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Local";
      }
      if (destination == "bf") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Pennsieve";
      }
    }
  }
  if (dataset_destination == "Pennsieve") {
    let supplementary_checks = await run_pre_flight_checks(false);
    if (!supplementary_checks) {
      $("#sidebarCollapse").prop("disabled", false);
      return;
    } else {
      if (generatingBoolean) {
      }
    }
  }
}

async function generateManifestPreview(e) {
  // open a file dialog so the user can select their dataset folder
  let folderPath = await ipcRenderer.invoke("open-manifest-preview-location");

  // set final generation destination to the user's selected location
  finalManifestGenerationPath = folderPath[0];

  // generate manifest precheck
  await generateManifestPrecheck(true, e);

  Swal.close();
}

/**
 *  Before a user uploads their manifest files to Pennsieve or generates them locally remove empty custom  columns.
 *  It is important that the SPARC SDS 2.0 mandated columns remain even if they are empty.
 */
const dropEmptyManifestColumns = async () => {
  try {
    await client.put("/prepare_metadata/manifest_files/pennsieve", {
      action: "drop_empty_manifest_columns",
      type: "bf",
    });
  } catch (error) {
    clientError(error);
  }
};

function updateJSONStructureManifestGenerate() {
  let starting_point = sodaJSONObj["starting-point"]["type"];
  if (sodaJSONObj["starting-point"]["type"] == "bf") {
    sodaJSONObj["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing-bf",
    };
  }
  if (sodaJSONObj["starting-point"]["type"] == "local") {
    var localDestination = path.dirname(sodaJSONObj["starting-point"]["local-path"]);
    var newDatasetName = path.basename(sodaJSONObj["starting-point"]["local-path"]);
    sodaJSONObj["generate-dataset"] = {
      destination: "local",
      path: $("#input-manifest-local-folder-dataset").attr("placeholder"),
      "dataset-name": newDatasetName,
      "if-existing": "new",
      "if-existing-files": "replace",
      "generate-option": "new",
    };
    // delete bf account and dataset keys
    if ("bf-account-selected" in sodaJSONObj) {
      delete sodaJSONObj["bf-account-selected"];
    }
    if ("bf-dataset-selected" in sodaJSONObj) {
      delete sodaJSONObj["bf-dataset-selected"];
    }
    sodaJSONObj["starting-point"]["type"] = "new";
  }
}

async function initiate_generate_manifest_local(manifestEditBoolean, originalDataset) {
  if (manifestEditBoolean === false) {
    createManifestLocally("local", false, originalDataset);
  } else {
    // SODA Manifest Files folder
    let dir = path.join(homeDirectory, "SODA", "manifest_files");
    // Move manifest files to the local dataset
    let moveFinishedBool;
    let generationLocation;
    if (finalManifestGenerationPath == originalDataset) {
      moveFinishedBool = await moveManifestFiles(dir, originalDataset);
    } else {
      [moveFinishedBool, generationLocation] = await moveManifestFilesPreview(
        dir,
        finalManifestGenerationPath
      );
    }

    openDirectoryAtManifestGenerationLocation(
      finalManifestGenerationPath == originalDataset
        ? finalManifestGenerationPath
        : generationLocation
    );

    if (moveFinishedBool) {
      resetManifest(true);
      // reset sodaJSONObj
      sodaJSONObj = {
        "starting-point": { type: "" },
        "dataset-structure": {},
        "metadata-files": {},
      };
      datasetStructureJSONObj = {
        folders: {},
        files: {},
        type: "",
      };

      Swal.fire({
        title: "Successfully generated manifest files at the specified location!",
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      });
      //////////// Tracking analytics /////////////
      // log the manifest file creation to analytics
      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.MANIFEST,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.LOCAL
      );
    }
  }
}

var generatingBoolean = false;
async function initiate_generate_manifest_bf() {
  generatingBoolean = true;
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  let dataset_name = "";
  let dataset_destination = "";

  if ("bf-dataset-selected" in sodaJSONObj) {
    dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    dataset_destination = "Pennsieve";
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      let destination = sodaJSONObj["generate-dataset"]["destination"];
      if (destination == "local") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Local";
      }
      if (destination == "bf") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Pennsieve";
      }
    }
  }

  // clear the pennsieve queue
  clearQueue();
  let curationResponse;
  try {
    curationResponse = await client.post(
      `/curate_datasets/curation`,
      {
        soda_json_structure: sodaJSONObj,
      },
      {
        timeout: 0,
      }
    );
  } catch (error) {
    clientError(error);
    file_counter = 0;
    folder_counter = 0;
    get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

    try {
      datasetList = [];
      datasetList = await api.getDatasetsForAccount(defaultBfAccount);
    } catch (error) {
      clientError(error);
    }

    Swal.fire({
      title: "Failed to generate manifest files!",
      text: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      didOpen: () => {
        Swal.hideLoading();
      },
    });

    generatingBoolean = false;
    let destination = "";

    // determine if working with a Local dataset or Pennsieve
    if ("bf-dataset-selected" in sodaJSONObj) {
      destination = "Pennsieve";
    } else if ("generate-dataset" in sodaJSONObj) {
      if ("destination" in sodaJSONObj["generate-dataset"]) {
        destination = sodaJSONObj["generate-dataset"]["destination"];
      }
    }

    // log the error to analytics
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.MANIFEST,
      AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      Destinations.PENNSIEVE
    );

    return;
  }

  let res = curationResponse.data;

  let high_level_folder_num = 0;
  if (manifest_files_requested) {
    if ("dataset-structure" in sodaJSONObj) {
      if ("folders" in sodaJSONObj["dataset-structure"]) {
        for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
          high_level_folder_num += 1;
        }
      }
    }
  }
  // determine if working with a Local dataset or Pennsieve
  if ("bf-dataset-selected" in sodaJSONObj) {
    destination = "Pennsieve";
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      destination = sodaJSONObj["generate-dataset"]["destination"];
    }
  }

  // log the manifest file creation to analytics
  logMetadataForAnalytics(
    "Success",
    MetadataAnalyticsPrefix.MANIFEST,
    AnalyticsGranularity.ALL_LEVELS,
    "Generate",
    Destinations.PENNSIEVE
  );

  // log the amount of high level manifest files that were created
  ipcRenderer.send(
    "track-event",
    "Success",
    MetadataAnalyticsPrefix.MANIFEST + " - Generate - Number of Files ",
    "Number of Files",
    high_level_folder_num
  );

  logMetadataSizeForAnalytics(destination === "Pennsieve" ? true : false, "manifest.xlsx", res[1]);

  sodaJSONObj = {
    "starting-point": { type: "" },
    "dataset-structure": {},
    "metadata-files": {},
  };
  datasetStructureJSONObj = {
    folders: {},
    files: {},
    type: "",
  };

  Swal.fire({
    title: "Successfully generated manifest files at the specified location!",
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.hideLoading();
    },
  });
  generatingBoolean = false;
  resetManifest(true);
}

/// creating manifest files locally by generating them to a local SODA folder, then move them to original dataset folder
function moveManifestFiles(sourceFolder, destinationFolder) {
  return new Promise((resolve) => {
    fs.readdir(sourceFolder, (err, folders) => {
      if (err) {
        console.log(err);
        resolve(false);
      } else {
        folders.forEach(function (folder) {
          let sourceManifest = path.join(sourceFolder, folder, "manifest.xlsx");
          let destinationManifest = path.join(destinationFolder, folder, "manifest.xlsx");
          const mv = require("mv");
          mv(sourceManifest, destinationManifest, function (err) {
            if (err) {
              throw err;
            }
          });
        });
        resolve(true);
      }
    });
  });
}

// create manifest files in a local folder for previewing before generation in the case of a Pennsieve dataset.
// In the case of generating a manifest file for a local dataset, this is used for generating the manifest files outside of the original dataset folder.
// Rationale: A user will want to preview their manifest files before uploading them to Pennsieve. In the case of generating for a local dataset,
// sometimes the location of the dataset is read only, so we need to generate the manifest files in a different location for the user.
const moveManifestFilesPreview = async (sourceFolder, destinationFolder) => {
  // get the files/folders in the source folder
  let sourceDir;
  try {
    sourceDir = await readdir(sourceFolder);
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Failed to generate manifest files for preview",
      text: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    return [false, ""];
  }

  // create a directory for storing the manifest files in the destination folder
  let manifestFolderDirectory = "";
  try {
    manifestFolderDirectory = await createDuplicateManifestDirectory(destinationFolder);
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Failed to generate manifest files for preview",
      text: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    return [false, ""];
  }

  // traverse the high level folders in the source folder and copy the source manifest files to the destination folder for user previewing
  for (const folderIdx in sourceDir) {
    let folder = sourceDir[folderIdx];

    let sourceManifest = path.join(sourceFolder, folder, "manifest.xlsx");

    let destinationManifestHighLevelFolder = path.join(manifestFolderDirectory, folder);
    fs.mkdirSync(destinationManifestHighLevelFolder);

    let destinationManifest = path.join(destinationManifestHighLevelFolder, "manifest.xlsx");

    try {
      await copyFile(sourceManifest, destinationManifest);
    } catch (error) {
      clientError(error);
      Swal.fire({
        title: "Failed to generate manifest files for preview",
        text: userErrorMessage(error),
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      return [false, manifestFolderDirectory];
    }
  }

  return [true, manifestFolderDirectory];
};

// TODO: Generalize then add to utilities
/**
 * Given a path to a destination, generate a SODA Manifest Files directory in that location.
 * If there are other SODA Manifest Files directories, then append a number to the end of the directory name and create it.
 * E.g., SODA Manifest Files (1), SODA Manifest Files (2), etc.
 * @param {URL} destination
 * @returns
 */
const createDuplicateManifestDirectory = async (destination) => {
  // get the files/folders in the destination folder
  let destinationDir;
  try {
    destinationDir = await readdir(destination);
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Failed to generate manifest files for preview",
      text: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    return false;
  }

  // get the folders in the destination folder that include SODA Manfiest Files
  let manifestFolderCopies = destinationDir.filter((folder) => {
    return folder.includes("SODA Manifest Files");
  });

  // filter out any extensions from the list
  manifestFolderCopies = manifestFolderCopies.filter((folder) => {
    return !folder.includes(".");
  });

  // if there is only one SODA Manifest Files directory create the first copy
  if (manifestFolderCopies.length === 0) {
    let manifestFolderDirectory = path.join(destination, "SODA Manifest Files");
    fs.mkdirSync(manifestFolderDirectory);
    return manifestFolderDirectory;
  }

  if (manifestFolderCopies.length === 1) {
    let manifestFolderDirectory = path.join(destination, "SODA Manifest Files (1)");
    fs.mkdirSync(manifestFolderDirectory);
    return manifestFolderDirectory;
  }

  // if there are multiple SODA Manifest Files directories, get the number of the last copy
  let copyNumbers = [];
  // get the numbers of all the copies
  for (const copy of manifestFolderCopies) {
    // check if not the first SODA Manifest Files folder - which doesn't have a number
    if (copy.split(" ")[3]) {
      copyNumbers.push(parseInt(copy.split(" ")[3].replace("(", "").replace(")", "")));
    }
  }

  // sort the copy numbers
  copyNumbers.sort((a, b) => {
    return a - b;
  });

  let lastCopyNumber = copyNumbers[copyNumbers.length - 1];

  // create a new SODA Manifest Files directory ending with ' (n)' where n is the number of times the directory has been created
  let manifestFolderDirectory = path.join(
    destination,
    `SODA Manifest Files (${parseInt(lastCopyNumber) + 1})`
  );
  fs.mkdirSync(manifestFolderDirectory);

  // return the path to the new SODA Manifest Files directory
  return manifestFolderDirectory;
};

const removeDir = function (pathdir) {
  if (fs.existsSync(pathdir)) {
    const files = fs.readdirSync(pathdir);
    if (files.length > 0) {
      files.forEach(function (filename) {
        let ele = path.join(pathdir, filename);
        if (fs.statSync(ele).isDirectory()) {
          removeDir(ele);
        } else {
          try {
            fs.unlinkSync(ele);
          } catch {
            fd = fs.openSync(ele, "r");
            fs.closeSync(fd);
            fs.unlinkSync(ele);
          }
        }
      });
      fs.rmdirSync(pathdir);
    } else {
      fs.rmdirSync(pathdir);
    }
  }
};

async function extractBFDatasetForManifestFile(editBoolean, bfaccount, bfdataset, ev) {
  // hide the entire progress container div
  let progressContainer = document.querySelector("#manifest-progress-container");
  progressContainer.style.display = "block";

  // inform user the manifest files are being generated
  let spanManifest = document.querySelector("#loading_pennsieve_dataset_manifest_span");
  spanManifest.textContent = "Importing your Pennsieve dataset...";
  spanManifest.style.display = "block";

  // hide the loading bar's text
  document.querySelector("#loading_pennsieve_dataset_manifest_span").style.visibility = "visible";

  // scroll to the loaders
  document.querySelector("#loading_pennsieve_dataset_manifest_span").scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });

  var result;
  try {
    var res = await bf_request_and_populate_dataset(
      sodaJSONObj,
      document.getElementById("loading_pennsieve_dataset_manifest"),
      false
    );
    result = [true, res];
  } catch (err) {
    result = [false, userErrorMessage(err)];
  }

  if (!result[0]) {
    Swal.fire({
      icon: "error",
      html:
        "<p style='color:red'>" +
        "Could not import this dataset." +
        ".<br>Please choose another dataset!</p>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    $("#Question-prepare-manifest-4").removeClass("show");
    $("#Question-prepare-manifest-4").removeClass("prev");
    $("#Question-prepare-manifest-3").removeClass("prev");
    $("#bf_dataset_create_manifest").text("None");
    defaultBfDataset = "Select dataset";
    // log the Generate action without the destination
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.MANIFEST,
      AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      Destinations.PENNSIEVE
    );

    $("#bf_dataset_create_manifest").text("None");
    $("#div-check-bf-create-manifest").hide();
    sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";
    return;
  } else {
    sodaJSONObj = result[1]["soda_object"];
    if (JSON.stringify(sodaJSONObj["dataset-structure"]) !== "{}") {
      datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
    } else {
      datasetStructureJSONObj = { folders: {}, files: {} };
    }
    sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    sodaJSONObj["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing-bf",
    };
    sodaJSONObj["starting-point"] = { type: "bf" };

    populate_existing_folders(datasetStructureJSONObj);
    populate_existing_metadata(sodaJSONObj);

    let continueProgressEmptyFolder = await checkEmptySubFolders(sodaJSONObj["dataset-structure"]);

    if (!continueProgressEmptyFolder) {
      hideProgressContainer(progressContainer);
      spanManifest.style.display = "none";

      Swal.fire({
        title: "Failed to generate the manifest files.",
        text: "The dataset contains one or more empty folder(s). Per SPARC guidelines, a dataset must not contain any empty folders. Please remove them before generating the manifest files.",
        heightAuto: false,
        showConfirmButton: true,
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {});

      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $("#Question-prepare-manifest-3").removeClass("prev");
      $("#bf_dataset_create_manifest").text("None");
      defaultBfDataset = "Select dataset";
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.MANIFEST,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.PENNSIEVE
      );
      return;
    }

    await wait(1000);
    var continueErrorManifest;
    try {
      let res = await extractBFManifestFile();
      continueErrorManifest = [false, res];
    } catch (err) {
      continueErrorManifest = [true, err];
    }

    await wait(1000);

    if (continueErrorManifest[0]) {
      Swal.fire({
        title: "Failed to load the manifest files for edits.",
        html: continueErrorManifest[1],
        heightAuto: false,
        showConfirmButton: true,
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {});

      hideProgressContainer(progressContainer);
      spanManifest.style.display = "none";

      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $("#Question-prepare-manifest-3").removeClass("prev");
      $("#bf_dataset_create_manifest").text("None");
      defaultBfDataset = "Select dataset";
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.MANIFEST,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.PENNSIEVE
      );
      return;
    }

    // check for no SPARC folders on a Pennsieve datasets (already include check for a local dataset)
    let continueProgressNoSPARCFolders = checkNoSparcFolders(sodaJSONObj["dataset-structure"]);
    if (continueProgressNoSPARCFolders === true) {
      Swal.fire({
        title: "Failed to generate the manifest files.",
        text: "The dataset does not contain any SPARC folder(s). Please choose a valid dataset before generating the manifest files.",
        heightAuto: false,
        showConfirmButton: true,
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {});
      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $("#Question-prepare-manifest-3").removeClass("prev");
      $("#bf_dataset_create_manifest").text("None");

      hideProgressContainer(progressContainer);
      spanManifest.style.display = "none";

      defaultBfDataset = "Select dataset";
      // log the error to analytics
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.MANIFEST,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.PENNSIEVE
      );
      return;
    }

    if (!editBoolean) {
      Swal.fire({
        title: "Generating the manifest.xlsx file(s)",
        text: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        showConfirmButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      generateManifestOnPennsieve();
    } else {
      $("#preview-manifest-fake-confirm-pennsieve").click();
      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $(ev).hide();
      loadDSTreePreviewManifest(sodaJSONObj["dataset-structure"]);

      // hide the loading bar's text
      document.querySelector("#loading_pennsieve_dataset_manifest_span").style.visibility =
        "hidden";

      localDatasetFolderPath = "";

      // hide the entire progress container div
      document.querySelector("#manifest-progress-container").style.display = "none";
    }
  }
}

function extractBFManifestFile() {
  return new Promise((resolve, reject) => {
    client
      .post(
        "/prepare_metadata/manifest_files/pennsieve",
        {
          soda_json_object: sodaJSONObj,
          selected_account: defaultBfAccount,
          selected_dataset: defaultBfDataset,
        },
        {
          timeout: 0,
        }
      )
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        clientError(err);
        reject(userErrorMessage(err));
      });

    trackManifestImportProgress();
  });
}

// generate on Pennsieve without edits
function generateManifestOnPennsieve() {
  generateManifestHelper();
  initiate_generate_manifest_bf();
}

function validateSPARCdataset() {
  // check if the bf option is selected

  // skip because previewing the manifest files for the user based off a Pennsieve dataset stored in json that has already been verified

  localDatasetFolderPath = $("#input-manifest-local-folder-dataset").attr("placeholder");
  valid_dataset = verify_sparc_folder(localDatasetFolderPath, "local");
  if (valid_dataset == true) {
    let action = "";
    irregularFolderArray = [];
    detectIrregularFolders(path.basename(localDatasetFolderPath), localDatasetFolderPath);
    var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
    if (irregularFolderArray.length > 0) {
      Swal.fire({
        title:
          "The following folders contain non-allowed characters in their names. Please correct them before continuing.",
        html:
          "<div style='max-height:300px; overflow-y:auto'>" +
          irregularFolderArray.join("</br>") +
          "</div>",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          $(".swal-popover").popover();
        },
        footer: footer,
      }).then((result) => {});
      return false;
    } else {
      return true;
    }
  } else {
    Swal.fire({
      icon: "error",
      html: `This folder does not seems to include any SPARC folders. Please select a folder that has a valid SPARC dataset structure.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      didOpen: () => {
        Swal.hideLoading();
      },
    }).then((result) => {
      document.getElementById("input-manifest-local-folder-dataset").placeholder = "Browse here";
      $("#div-confirm-manifest-local-folder-dataset").hide();
      localDatasetFolderPath = "";
      $("#Question-prepare-manifest-2").nextAll().removeClass("show").removeClass("prev");
      return false;
    });
  }
}

function resetManifest(skip_permission) {
  if (!skip_permission) {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "I want to start over!",
      focusCancel: true,
      heightAuto: false,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "Are you sure you want to start over and reset your progress?",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // 1. remove Prev and Show from all individual-question except for the first one
        // 2. empty all input, textarea, select, para-elements
        $("#Question-prepare-manifest-1").removeClass("prev");
        $("#Question-prepare-manifest-1").nextAll().removeClass("show");
        $("#Question-prepare-manifest-1").nextAll().removeClass("prev");
        $("#Question-prepare-manifest-1 .option-card")
          .removeClass("checked")
          .removeClass("disabled")
          .removeClass("non-selected");
        $("#Question-prepare-manifest-1 .option-card .folder-input-check").prop("checked", false);
        $("#input-manifest-local-folder-dataset").attr("placeholder", "Browse here");
        $("#div-confirm-manifest-local-folder-dataset").hide();
        $("#bf_dataset_create_manifest").text("None");
        let dir1 = path.join(homeDirectory, "SODA", "manifest_files");
        let dir2 = path.join(homeDirectory, "SODA", "SODA Manifest Files");
        removeDir(dir1);
        removeDir(dir2);
      } else {
        return;
      }
    });
  } else {
    // 1. remove Prev and Show from all individual-question except for the first one
    // 2. empty all input, textarea, select, para-elements
    $("#Question-prepare-manifest-1").removeClass("prev");
    $("#Question-prepare-manifest-1").nextAll().removeClass("show");
    $("#Question-prepare-manifest-1").nextAll().removeClass("prev");
    $("#Question-prepare-manifest-1 .option-card")
      .removeClass("checked")
      .removeClass("disabled")
      .removeClass("non-selected");
    $("#Question-prepare-manifest-1 .option-card .folder-input-check").prop("checked", false);
    $("#input-manifest-local-folder-dataset").attr("placeholder", "Browse here");
    $("#div-confirm-manifest-local-folder-dataset").hide();
    $("#bf_dataset_create_manifest").text("None");
    let dir1 = path.join(homeDirectory, "SODA", "manifest_files");
    let dir2 = path.join(homeDirectory, "SODA", "SODA Manifest Files");
    removeDir(dir1);
    removeDir(dir2);

    // reset the global variables for detecting the manifest path
    finalManifestGenerationPath = "";
  }
}

const trackManifestImportProgress = async () => {
  // show the progress container - it is hidden by default once the dataset import is complete
  let progressContainer = document.getElementById("loading_pennsieve_dataset_manifest");

  let { percentage_text, left_progress_bar, right_progress_bar } =
    getProgressContainerElements(progressContainer);

  await resetProgressContainer(
    progressContainer,
    percentage_text,
    left_progress_bar,
    right_progress_bar
  );

  // inform user the manifest files are being generated
  document.querySelector("#loading_pennsieve_dataset_manifest_span").textContent =
    "Preparing manifest files...";

  document.querySelector("#loading_pennsieve_dataset_manifest_span").style.display = "block";

  const manifest_creation_progress_pennsieve = async () => {
    let progressResponse;
    try {
      progressResponse = await client.get("/prepare_metadata/manifest_files/pennsieve/progress");
    } catch (error) {
      clientError(error);
      clearInterval(manifestProgressInterval);
      return;
    }

    let manifestProgress = progressResponse.data;
    let finished = manifestProgress.finished;

    updateProgressContainer(
      progressContainer,
      percentage_text,
      left_progress_bar,
      right_progress_bar,
      manifestProgress,
      "manifest"
    );

    if (finished) {
      clearInterval(manifestProgressInterval);
    }
  };

  // create an interval with a .5 second timer
  let manifestProgressInterval = setInterval(manifest_creation_progress_pennsieve, 800);
};

// check for empty sub-folders before continuing to generate manifest files
// to avoid changes made to the dataset structure when we call the main curate function for manifest files
function checkEmptySubFolders(datasetStructure) {
  let isEmpty = true;
  if (
    JSON.stringify(datasetStructure) !== "{}" &&
    Object.keys(datasetStructure).includes("folders")
  ) {
    for (var folder in datasetStructure["folders"]) {
      var currentFolder = datasetStructure["folders"][folder];
      if (
        Object.keys(currentFolder["folders"]).length === 0 &&
        Object.keys(currentFolder["files"]).length === 0
      ) {
        isEmpty = false;
      } else {
        isEmpty = isEmpty && checkEmptySubFolders(currentFolder);
      }
    }
  } else {
    isEmpty = true;
  }
  return isEmpty;
}

// helper function 1: First, generate manifest file folder locally
// Parameter: dataset structure object
// Return: manifest file folder path
async function generateManifestFolderLocallyForEdit(ev) {
  var type = "local";
  if ($('input[name="generate-manifest-1"]:checked').prop("id") === "generate-manifest-from-Penn") {
    type = "bf";
  }

  // setup question 5 for local or pennsieve generation
  if (type === "local") {
    document.querySelector("#continue_step_5-manifest").style.display = "block";
    document.querySelector("#generate_step_5-manifest").style.display = "none";
    document.querySelector("#input-manifest-local-gen-location").placeholder =
      document.querySelector("#input-manifest-local-folder-dataset").placeholder;
  } else {
    document.querySelector("#continue_step_5-manifest").style.display = "none";
    document.querySelector("#generate_step_5-manifest").style.display = "block";
  }

  exitCurate();
  sodaJSONObj["starting-point"] = {};
  sodaJSONObj["dataset-structure"] = {};
  datasetStructureJSONObj = { folders: {}, files: {} };
  sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
  sodaJSONObj["metadata-files"] = {};
  sodaJSONObj["generate-dataset"] = {};
  var titleTerm = "folder";
  if (type === "local") {
    Swal.fire({
      title: "Preparing manifest files",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      heightAuto: false,
      didOpen: () => {
        Swal.showLoading();
      },
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // give the swal a chace to load in
    await wait(500);

    let continueProgressValidateDataset = true;
    let continueProgressEmptyFolder = true;
    continueProgressValidateDataset = await validateSPARCdataset();
    if (!continueProgressValidateDataset) {
      return;
    }

    sodaJSONObj["starting-point"]["local-path"] = localDatasetFolderPath;
    sodaJSONObj["starting-point"]["type"] = "local";
    create_json_object("", sodaJSONObj, localDatasetFolderPath);
    datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
    populate_existing_folders(datasetStructureJSONObj);
    populate_existing_metadata(sodaJSONObj);
    sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    sodaJSONObj["bf-account-selected"] = {};
    sodaJSONObj["bf-dataset-selected"] = {};
    sodaJSONObj["generate-dataset"] = {};
    continueProgressEmptyFolder = await checkEmptySubFolders(sodaJSONObj["dataset-structure"]);

    if (continueProgressEmptyFolder === false) {
      Swal.fire({
        title: "Failed to generate the manifest files.",
        text: "The dataset contains one or more empty folder(s). Per SPARC guidelines, a dataset must not contain any empty folders. Please remove them before generating the manifest files.",
        heightAuto: false,
        showConfirmButton: true,
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {});
      return;
    }

    createManifestLocally("local", true, "");
  } else {
    // Case 2: bf dataset
    sodaJSONObj["bf-account-selected"] = { "account-name": defaultBfAccount };
    sodaJSONObj["bf-dataset-selected"] = { "dataset-name": defaultBfDataset };
    extractBFDatasetForManifestFile(true, defaultBfAccount, defaultBfDataset, ev);
  }
}

async function createManifestLocally(type, editBoolean, originalDataset) {
  var generatePath = "";
  sodaJSONObj["manifest-files"]["local-destination"] = path.join(homeDirectory, "SODA");

  if (type === "local") {
    generatePath = localDatasetFolderPath;
  } else {
    generatePath = "";
  }

  // create the manifest files based off the user's edits to the manifest files
  try {
    let generate_local_manifest = await client.post(
      `/curate_datasets/manifest_files`,
      {
        generate_purpose: editBoolean ? "edit-manifest" : "",
        soda_json_object: sodaJSONObj,
      },
      { timeout: 0 }
    );

    let res = generate_local_manifest.data.success_message_or_manifest_destination;

    // if the user wants to edit their manifest files then move them to the dataset folder
    // and then show the the manifest file editor in the UI
    if (editBoolean) {
      // move the pre-existing manifest files to the dataset folder
      try {
        await client.post(
          `/curate_datasets/manifest_files/local`,
          {
            filepath: generatePath,
          },
          {
            timeout: 0,
          }
        );

        Swal.fire({
          title: "Manifests ready!",
          heightAuto: false,
          showConfirmButton: false,
          timer: 800,
          icon: "success",
          backdrop: "rgba(0,0,0, 0.4)",
          didOpen: () => {
            Swal.hideLoading();
          },
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then((result) => {});
        $("#preview-manifest-fake-confirm").click();
        $("#Question-prepare-manifest-4").removeClass("show");
        $("#Question-prepare-manifest-4").removeClass("prev");
        loadDSTreePreviewManifest(sodaJSONObj["dataset-structure"]);
      } catch (error) {
        clientError(error);
        let emessage = userErrorMessage(error);

        Swal.fire({
          title: "Failed to load the manifest files for edits.",
          html: emessage,
          heightAuto: false,
          showConfirmButton: true,
          icon: "error",
          backdrop: "rgba(0,0,0, 0.4)",
          didOpen: () => {
            Swal.hideLoading();
          },
        });

        return;
      }

      Swal.close();
      localDatasetFolderPath = "";
    } else {
      // SODA Manifest Files folder
      let dir = path.join(homeDirectory, "SODA", "SODA Manifest Files");
      let moveFinishedBool;
      let manifestGenerationDirectory;
      if (originalDataset !== finalManifestGenerationPath) {
        // Move manifest files to the local dataset
        [moveFinishedBool, manifestGenerationDirectory] = await moveManifestFilesPreview(
          dir,
          finalManifestGenerationPath
        );
      } else {
        // Move manifest files to the local dataset
        moveFinishedBool = await moveManifestFiles(dir, originalDataset);
      }

      openDirectoryAtManifestGenerationLocation(
        originalDataset !== finalManifestGenerationPath
          ? manifestGenerationDirectory
          : originalDataset
      );

      if (moveFinishedBool) {
        resetManifest(true);
        // reset sodaJSONObj
        sodaJSONObj = {
          "starting-point": { type: "" },
          "dataset-structure": {},
          "metadata-files": {},
        };
        datasetStructureJSONObj = {
          folders: {},
          files: {},
          type: "",
        };

        Swal.fire({
          title: "Successfully generated manifest files at the specified location!",
          icon: "success",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          didOpen: () => {
            Swal.hideLoading();
          },
        });
        localDatasetFolderPath = "";

        // TODO: Open the manifest files for viewing in the UI

        //////////// Tracking analytics /////////////
        // log the manifest file creation to analytics
        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.MANIFEST,
          AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          Destinations.LOCAL
        );
      }
    }
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);

    Swal.fire({
      title: "Failed to generate the manifest files.",
      html: emessage,
      heightAuto: false,
      showConfirmButton: true,
      icon: "error",
      backdrop: "rgba(0,0,0, 0.4)",
      didOpen: () => {
        Swal.hideLoading();
      },
    }).then((result) => {});
    $("#Question-prepare-manifest-4").removeClass("show");
    $("#Question-prepare-manifest-4").removeClass("prev");
    $("#Question-prepare-manifest-3").removeClass("prev");
    $("#bf_dataset_create_manifest").text("None");
  }

  transitionFreeFormMode(
    document.querySelector("#div-confirm-manifest-local-folder-dataset .btn_animated"),
    "Question-prepare-manifest-2",
    "create_manifest-tab",
    "",
    "individual-question prepare-manifest"
  );
}

// helper function 2: Second, load dataset structure as preview tree
// (so users can choose which manifest file to add additional metadata to)
// Parameter: dataset structure object
// Return tree
function loadDSTreePreviewManifest(datasetStructure) {
  // return tree view
  // upon clicking on a node, if node == manifest, feed the actual path of that manifest file -> UI library xspreadsheet
  // -> popup opens up with loaded info from such manifest.xlsx file.
  // -> upon save+close -> save the new file to the old path (make changes to the file)
  addManifestFilesForTreeView();
  showTreeViewPreviewManifestEdits(
    false,
    true,
    false,
    "My_dataset_structure",
    jstreePreviewManifest,
    datasetStructure
  );
}

function showTreeViewPreviewManifestEdits(
  disabledBoolean,
  selectedBoolean,
  manifestFileBoolean,
  new_dataset_name,
  previewDiv,
  datasetStructure
) {
  var jsTreePreviewDataManifest = createChildNodeManifest(
    datasetStructure,
    new_dataset_name,
    "folder",
    "",
    true,
    true,
    false
  );
  $(previewDiv).jstree(true).settings.core.data = jsTreePreviewDataManifest;
  $(previewDiv).jstree(true).refresh();
}

function createChildNodeManifest(
  oldFormatNode,
  nodeName,
  type,
  ext,
  openedState,
  selectedState,
  disabledState
) {
  /*
    oldFormatNode: node in the format under "dataset-structure" key in SODA object
    nodeName: text to show for each node (name)
    type: "folder" or "file"
    ext: track ext of files to match with the right CSS icons
    openedState, selectedState: states of a jstree node
    */
  var newFormatNode = {
    text: nodeName,
    state: {
      opened: openedState,
      selected: selectedState,
      disabled: disabledState,
    },
    children: [],
    type: type + ext,
  };
  if (oldFormatNode) {
    for (const [key, value] of Object.entries(oldFormatNode["folders"])) {
      let disabled = false;
      let opened = true;
      let selected = false;
      if (nodeName === "My_dataset_structure") {
        newFormatNode.state.selected = true;
        newFormatNode.state.opened = true;
        newFormatNode.state.disabled = false;
        var new_node = createChildNodeManifest(
          value,
          key,
          "folder",
          "",
          opened,
          selected,
          disabled
        );
      }
      if (highLevelFolders.includes(key)) {
        newFormatNode.state.selected = selected;
        newFormatNode.state.opened = true;
        newFormatNode.state.disabled = disabled;
        var new_node = createChildNodeManifest(value, key, "folder", "", true, selected, disabled);

        firstNode = false;
      }
      newFormatNode["children"].push(new_node);
      newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
      // newFormatNode["children"].forEach((child, idx) => {
      //   if (idx != 0) child.state.opened = false;
      // });
    }
    if ("files" in oldFormatNode) {
      if (oldFormatNode["files"] != undefined) {
        for (var [key, value] of Object.entries(oldFormatNode["files"])) {
          if (key !== undefined || value !== undefined) {
            if (
              [
                ".png",
                ".PNG",
                ".xls",
                ".xlsx",
                ".pdf",
                ".txt",
                ".jpeg",
                ".JPEG",
                ".csv",
                ".CSV",
                ".DOC",
                ".DOCX",
                ".doc",
                ".docx",
              ].includes(path.parse(key).ext)
            ) {
              nodeType = "file " + path.parse(key).ext.slice(1);
            } else {
              nodeType = "file other";
            }
            if (key === "manifest.xlsx") {
              var new_node = {
                text: key,
                state: { disabled: false },
                type: nodeType,
              };
              newFormatNode["children"].push(new_node);
              newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
            }
          }
        }
      }
    }
  }
  return newFormatNode;
}

// check for no SPARC folders on a Pennsieve dataset before continuing to generate manifest files
// to avoid changes made to the dataset structure when we call the main curate function for manifest files
function checkNoSparcFolders(datasetStructure) {
  let noSPARCFolders = false;
  if (
    JSON.stringify(datasetStructure) !== "{}" &&
    Object.keys(datasetStructure).includes("folders")
  ) {
    let datasetFolderArray = Object.keys(datasetStructure["folders"]);
    if (datasetFolderArray.length === 0) {
      noSPARCFolders = true;
    } else {
      for (var folder of datasetFolderArray) {
        if (!highLevelFolders.includes(folder)) {
          noSPARCFolders = true;
          return noSPARCFolders;
        }
      }
    }
  } else {
    noSPARCFolders = true;
  }
  return noSPARCFolders;
}

// check for invalid high level folders before continuing to generate manifest files
// to avoid changes made to the dataset structure when we call the main curate function for manifest files
function checkInvalidHighLevelFolders(datasetStructure) {
  let invalidFolders;
  if (
    JSON.stringify(datasetStructure) !== "{}" &&
    Object.keys(datasetStructure).includes("folders")
  ) {
    let datasetFolderArray = Object.keys(datasetStructure["folders"]);
    if (datasetFolderArray.length === 0) {
      invalidFolders = true;
    } else {
      // checking if the datasetFolderArray is a subset of the highLevelFolders array or not, if not, then it must contain invalid folder(s)
      invalidFolders = datasetFolderArray.some((val) => !highLevelFolders.includes(val));
    }
  } else {
    invalidFolders = true;
  }
  return invalidFolders;
}

// function to generate edited manifest files onto Pennsieve (basically just upload the local SODA Manifest Files folder to Pennsieve)
async function generateAfterEdits() {
  let dir = path.join(homeDirectory, "SODA", "manifest_files");
  // set up sodaJSonObject
  sodaJSONObj = {
    "bf-account-selected": {},
    "bf-dataset-selected": {},
    "dataset-structure": {},
    "metadata-files": {},
    "generate-dataset": {},
    "starting-point": {},
  };
  sodaJSONObj["starting-point"]["local-path"] = dir;
  sodaJSONObj["starting-point"]["type"] = "local";
  create_json_object_include_manifest("", sodaJSONObj, dir);
  datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
  populate_existing_folders(datasetStructureJSONObj);
  populate_existing_metadata(sodaJSONObj);
  sodaJSONObj["bf-account-selected"] = { "account-name": defaultBfAccount };
  sodaJSONObj["bf-dataset-selected"] = { "dataset-name": defaultBfDataset };
  sodaJSONObj["generate-dataset"] = {
    destination: "bf",
    "if-existing": "merge",
    "if-existing-files": "replace",
    "generate-option": "new",
  };

  // move the generated manifest files to the user selected location for preview
  if (pennsievePreview) {
    let [moved, location] = await moveManifestFilesPreview(dir, finalManifestGenerationPath);
    openDirectoryAtManifestGenerationLocation(location);
    Swal.fire({
      title: "Successfully generated manifest files at the specified location!",
      icon: "success",
      confirmButtonText: "OK",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
    });
    return;
  }

  // generate on Pennsieve: call the function
  initiate_generate_manifest_bf();
}

document.querySelector("#btn-pull-ds-manifest").addEventListener("click", (e) => {
  document.querySelector("#div-check-bf-create-manifest").style.visibility = "hidden";

  let section = document.querySelector("#manifest-gen-on-pennsieve-section");
  section.style.display = "flex";
  section.querySelector("div").style.display = "flex";
});

document.querySelector("#div-check-bf-create-manifest").addEventListener("click", () => {
  // show the continue button
  document.querySelector("#btn-continue-pennsieve-question-6").style.display = "flex";

  // hide the manifest generation section
  let section = document.querySelector("#manifest-gen-on-pennsieve-section");
  section.style.display = "none";
});

document
  .querySelector("#div-confirm-manifest-local-folder-dataset")
  .addEventListener("click", function () {
    // hide the Generate manifest on pennsieve section
    document.querySelector("#generate-local-preview-manifest").parentNode.style.display = "none";
    document.querySelector("#manifest-gen-on-pennsieve-section").style.display = "none";

    // show the confinue button for moving on to step 6
    document.querySelector("#continue_step_5-manifest").parentNode.style.visibility = "visible";

    // hide the 'this' value ( aka, the #div-confirm-manifest-local-folder-dataset div)
    this.style.display = "none";

    // hide the Pennsieve continue button in question 5
    document.querySelector("#btn-continue-pennsieve-question-6").style.display = "none";
  });

document.querySelector("#continue_step_5-manifest").addEventListener("click", (e) => {
  e.target.parentNode.style.visibility = "hidden";
});

document.querySelector(".manifest-change-current-ds").addEventListener("click", (e) => {
  document.querySelector("#div-confirm-manifest-local-folder-dataset").style.visibility = "visible";
});

// show the manifest generation on Pennsieve section so the user can choose to generate on Pennsieve or create a local preview
document
  .querySelector("#show-manifest-gen-on-pennsieve-section-btn")
  .addEventListener("click", function () {
    // show the section
    let section = document.querySelector("#manifest-gen-on-pennsieve-section");
    section.style.display = "flex";

    // transition to the header
    section.scrollIntoView({ behavior: "smooth" });

    // hide the continue button
    this.parentNode.parentNode.style.display = "none";
  });
