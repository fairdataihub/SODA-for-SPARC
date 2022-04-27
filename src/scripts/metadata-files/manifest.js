var jstreePreviewManifest = document.getElementById(
  "div-dataset-tree-preview-manifest"
);

function showLocalDatasetManifest() {
  ipcRenderer.send("open-file-dialog-local-dataset-manifest-purpose");
}

$(document).ready(function () {
  ipcRenderer.on(
    "selected-local-dataset-manifest-purpose",
    (event, folderPath) => {
      if (folderPath.length > 0) {
        if (folderPath !== null) {
          document.getElementById(
            "input-manifest-local-folder-dataset"
          ).placeholder = folderPath[0];
          localDatasetFolderPath = folderPath[0];
          $("#div-confirm-manifest-local-folder-dataset").css(
            "display",
            "flex"
          );
          $("#div-confirm-manifest-local-folder-dataset button").show();
        } else {
          document.getElementById(
            "input-manifest-local-folder-dataset"
          ).placeholder = "Browse here";
          localDatasetFolderPath = "";
          $("#div-confirm-manifest-local-folder-dataset").hide();
          $("#Question-prepare-manifest-2")
            .nextAll()
            .removeClass("show")
            .removeClass("prev");
        }
      } else {
        document.getElementById(
          "input-manifest-local-folder-dataset"
        ).placeholder = "Browse here";
        localDatasetFolderPath = "";
        $("#div-confirm-manifest-local-folder-dataset").hide();
        $("#Question-prepare-manifest-2")
          .nextAll()
          .removeClass("show")
          .removeClass("prev");
      }
    }
  );
  $("#bf_dataset_create_manifest").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_create_manifest").text().trim() !== "None") {
      $("#div-check-bf-create-manifest").css("display", "flex");
      $($("#div-check-bf-create-manifest").children()[0]).show();
    } else {
      $("#div-check-bf-create-manifest").css("display", "none");
    }
    $("#Question-prepare-manifest-3")
      .nextAll()
      .removeClass("show")
      .removeClass("prev");
  });

  $(jstreePreviewManifest).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });

  $(jstreePreviewManifest).on("close_node.jstree", function (event, data) {
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
      });
      var parentFolderName = $("#" + data.node.parent + "_anchor").text();
      var localFolderPath = path.join(
        homeDirectory,
        "SODA",
        "SODA Manifest Files",
        parentFolderName
      );
      // load onto library
      var localFolderPath = path.join(
        homeDirectory,
        "SODA",
        "SODA Manifest Files",
        parentFolderName
      );
      var selectedManifestFilePath = path.join(
        localFolderPath,
        "manifest.xlsx"
      );
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
});

function convertJSONToXlsx(jsondata, excelfile) {
  const wb = new excel4node.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  const headingColumnNames = Object.keys(jsondata[0]);
  //Write Column Title in Excel file
  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    ws.cell(1, headingColumnIndex++).string(heading);
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
              obj.deleteColumn(
                obj.getSelectedColumns().length ? undefined : parseInt(x)
              );
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

async function generateManifestPrecheck(manifestEditBoolean) {
  var type = "local";
  if (
    $('input[name="generate-manifest-1"]:checked').prop("id") ===
    "generate-manifest-from-Penn"
  ) {
    type = "bf";
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
    continueProgressValidateDataset = await validateSPARCdataset();
  }
  if (!continueProgressValidateDataset) {
    return;
  }
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
  generateManifest("", type, manifestEditBoolean);
}

async function generateManifest(action, type, manifestEditBoolean) {
  Swal.fire({
    title: "Reviewing the dataset structure.",
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
  // Case 1: Local dataset
  if (type === "local") {
    sodaJSONObj["starting-point"]["local-path"] = localDatasetFolderPath;
    //checking size of local folder path
    checkDiskSpace(localDatasetFolderPath).then(async (diskSpace) => {
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
        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.MANIFEST,
          AnalyticsGranularity.ACTION,
          "Generate - Check Storage Space",
          Destinations.LOCAL
        );
        sodaJSONObj["starting-point"]["type"] = "local";
        // if users would like to edit manifest files before generating them
        if (manifestEditBoolean) {
          localDatasetFolderPath = $(
            "#input-manifest-local-folder-dataset"
          ).attr("placeholder");
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
        initiate_generate_manifest_local(
          manifestEditBoolean,
          localDatasetFolderPath
        );
      }
    });
  } else {
    // Case 2: bf dataset
    if (manifestEditBoolean) {
      generateAfterEdits();
    } else {
      sodaJSONObj["bf-account-selected"] = { "account-name": defaultBfAccount };
      sodaJSONObj["bf-dataset-selected"] = { "dataset-name": defaultBfDataset };
      extractBFDatasetForManifestFile(
        false,
        defaultBfAccount,
        defaultBfDataset
      );
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
      }
    }
  }
}

function updateJSONStructureManifestGenerate() {
  let starting_point = sodaJSONObj["starting-point"]["type"];
  if (sodaJSONObj["starting-point"]["type"] == "bf") {
    sodaJSONObj["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing-bf",
    };
  }
  if (sodaJSONObj["starting-point"]["type"] == "local") {
    var localDestination = path.dirname(
      sodaJSONObj["starting-point"]["local-path"]
    );
    var newDatasetName = path.basename(
      sodaJSONObj["starting-point"]["local-path"]
    );
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

async function initiate_generate_manifest_local(
  manifestEditBoolean,
  originalDataset
) {
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
  if (manifestEditBoolean === false) {
    createManifestLocally("local", false, originalDataset);
  } else {
    // SODA Manifest Files folder
    let dir = path.join(homeDirectory, "SODA", "SODA Manifest Files");
    // Move manifest files to the local dataset
    let moveFinishedBool = await moveManifestFiles(dir, originalDataset);
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
        title:
          "Successfully generated manifest files at the specified location!",
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
function initiate_generate_manifest_bf() {
  generatingBoolean = true;
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
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;
  // if ("manifest-files" in sodaJSONObj) {
  //   if ("destination" in sodaJSONObj["manifest-files"]) {
  //     if (sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
  //       manifest_files_requested = true;
  //       delete_imported_manifest();
  //     }
  //   }
  // }

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

  client.invoke("api_main_curate_function", sodaJSONObj, (error, res) => {
    if (error) {
      var emessage = userError(error);
      log.error(error);
      console.error(error);
      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);
      client.invoke(
        "api_bf_dataset_account",
        defaultBfAccount,
        (error, result) => {
          if (error) {
            log.error(error);
            console.log(error);
            var emessage = error;
          } else {
            datasetList = [];
            datasetList = result;
          }
        }
      );

      Swal.fire({
        title: "Failed to generate manifest files!",
        text: emessage,
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
    } else {
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

      logMetadataSizeForAnalytics(
        destination === "Pennsieve" ? true : false,
        "manifest.xlsx",
        res[1]
      );

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
        title:
          "Successfully generated manifest files at the specified location!",
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
  });
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
          let destinationManifest = path.join(
            destinationFolder,
            folder,
            "manifest.xlsx"
          );
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

async function extractBFDatasetForManifestFile(
  editBoolean,
  bfaccount,
  bfdataset
) {
  var result;
  try {
    var res = await bf_request_and_populate_dataset(sodaJSONObj);
    result = [true, res];
  } catch (err) {
    result = [false, err];
  }
  if (!result[0]) {
    Swal.fire({
      icon: "error",
      html:
        "<p style='color:red'>" +
        result[1] +
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
    sodaJSONObj = result[1][0];
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
    let continueProgressEmptyFolder = await checkEmptySubFolders(
      sodaJSONObj["dataset-structure"]
    );
    if (!continueProgressEmptyFolder) {
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
    // check for no SPARC folders on a Pennsieve datasets (already include check for a local dataset)
    let continueProgressNoSPARCFolders = await checkNoSparcFolders(
      sodaJSONObj["dataset-structure"]
    );
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
  }
  if (!editBoolean) {
    generateManifestOnPennsieve();
  } else {
    createManifestLocally("bf", editBoolean, "");
  }
}

function generateManifestOnPennsieve() {
  generateManifestHelper();
  initiate_generate_manifest_bf();
}

function validateSPARCdataset() {
  localDatasetFolderPath = $("#input-manifest-local-folder-dataset").attr(
    "placeholder"
  );
  valid_dataset = verify_sparc_folder(localDatasetFolderPath);
  if (valid_dataset == true) {
    let action = "";
    irregularFolderArray = [];
    detectIrregularFolders(
      path.basename(localDatasetFolderPath),
      localDatasetFolderPath
    );
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
      document.getElementById(
        "input-manifest-local-folder-dataset"
      ).placeholder = "Browse here";
      $("#div-confirm-manifest-local-folder-dataset").hide();
      localDatasetFolderPath = "";
      $("#Question-prepare-manifest-2")
        .nextAll()
        .removeClass("show")
        .removeClass("prev");
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
        $("#Question-prepare-manifest-1 .option-card .folder-input-check").prop(
          "checked",
          false
        );
        $("#input-manifest-local-folder-dataset").attr(
          "placeholder",
          "Browse here"
        );
        $("#div-confirm-manifest-local-folder-dataset").hide();
        $("#bf_dataset_create_manifest").text("None");
        let dir = path.join(homeDirectory, "SODA", "SODA Manifest Files");
        removeDir(dir);
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
    $("#Question-prepare-manifest-1 .option-card .folder-input-check").prop(
      "checked",
      false
    );
    $("#input-manifest-local-folder-dataset").attr(
      "placeholder",
      "Browse here"
    );
    $("#div-confirm-manifest-local-folder-dataset").hide();
    $("#bf_dataset_create_manifest").text("None");
    let dir = path.join(homeDirectory, "SODA", "SODA Manifest Files");
    removeDir(dir);
  }
}

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
async function generateManifestFolderLocallyForEdit() {
  // Show loading popup
  Swal.fire({
    title: `Generating manifest files for edits`,
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  });
  var type = "local";
  if (
    $('input[name="generate-manifest-1"]:checked').prop("id") ===
    "generate-manifest-from-Penn"
  ) {
    type = "bf";
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
    continueProgressEmptyFolder = await checkEmptySubFolders(
      sodaJSONObj["dataset-structure"]
    );
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
      }).then((result) => {});
      return;
    } else {
      createManifestLocally("local", true, "");
    }
  } else {
    // Case 2: bf dataset
    sodaJSONObj["bf-account-selected"] = { "account-name": defaultBfAccount };
    sodaJSONObj["bf-dataset-selected"] = { "dataset-name": defaultBfDataset };
    extractBFDatasetForManifestFile(true, defaultBfAccount, defaultBfDataset);
  }
}

function createManifestLocally(type, editBoolean, originalDataset) {
  // generateManifestHelper();
  var generatePath = "";
  sodaJSONObj["manifest-files"]["local-destination"] = path.join(
    homeDirectory,
    "SODA"
  );
  if (type === "local") {
    generatePath = localDatasetFolderPath;
  } else {
    generatePath = path.join(homeDirectory, "SODA", "manifest_files");
  }
  client.invoke(
    "api_generate_manifest_file_locally",
    "edit-manifest",
    sodaJSONObj,
    async (error, res) => {
      if (error) {
        var emessage = userError(error);
        log.error(error);
        console.error(error);
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
      } else {
        if (editBoolean) {
          //// else: create locally for the purpose of generating of manifest files locally
          client.invoke(
            "api_create_high_level_manifest_files_existing_local_starting_point",
            generatePath,
            async (error, res) => {
              if (error) {
                var emessage = userError(error);
                log.error(error);
                console.error(error);
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
                }).then((result) => {});
              } else {
                // console.log(res)
                Swal.fire({
                  title: "Successfully generated!",
                  heightAuto: false,
                  showConfirmButton: false,
                  timer: 800,
                  icon: "success",
                  backdrop: "rgba(0,0,0, 0.4)",
                  didOpen: () => {
                    Swal.hideLoading();
                  },
                }).then((result) => {});
                $("#preview-manifest-fake-confirm").click();
                $("#Question-prepare-manifest-4").removeClass("show");
                $("#Question-prepare-manifest-4").removeClass("prev");
                loadDSTreePreviewManifest(sodaJSONObj["dataset-structure"]);
              }
            }
          );

          Swal.fire({
            title: "Successfully generated!",
            heightAuto: false,
            showConfirmButton: false,
            timer: 800,
            icon: "success",
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          }).then((result) => {});
          localDatasetFolderPath = "";
        } else {
          // SODA Manifest Files folder
          let dir = path.join(homeDirectory, "SODA", "SODA Manifest Files");
          // Move manifest files to the local dataset
          let moveFinishedBool = await moveManifestFiles(dir, originalDataset);
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
              title:
                "Successfully generated manifest files at the specified location!",
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              didOpen: () => {
                Swal.hideLoading();
              },
            });
            localDatasetFolderPath = "";
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
    }
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
      let disabled = true;
      let opened = false;
      let selected = false;
      if (
        highLevelFolders.includes(nodeName) ||
        nodeName === "My_dataset_structure"
      ) {
        opened = true;
        selected = true;
        disabled = false;
      }
      newFormatNode.state.selected = selected;
      newFormatNode.state.opened = opened;
      newFormatNode.state.disabled = disabled;
      var new_node = createChildNodeManifest(
        value,
        key,
        "folder",
        "",
        opened,
        selected,
        disabled
      );
      newFormatNode["children"].push(new_node);
      newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
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
            } else {
              var new_node = {
                text: key,
                state: { disabled: true },
                type: nodeType,
              };
            }
            newFormatNode["children"].push(new_node);
            newFormatNode["children"].sort((a, b) =>
              a.text > b.text ? 1 : -1
            );
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
      invalidFolders = datasetFolderArray.some(
        (val) => !highLevelFolders.includes(val)
      );
    }
  } else {
    invalidFolders = true;
  }
  return invalidFolders;
}

// function to generate edited manifest files onto Pennsieve (basically just upload the local SODA Manifest Files folder to Pennsieve)
function generateAfterEdits() {
  let dir = path.join(homeDirectory, "SODA", "SODA Manifest Files");
  // // 1. delete json files
  // removeManifestJSONFiles(dir);
  // 2. convert local SODA Manifest Files folder to sodaJsonObj
  // a. generate options: existing-folders: "merge", "existing-files": "replace"
  // b. starting-point: "local"
  // c. starting-point, "local-destination": sodaJSONObj["manifest-files"]["local-destination"] = path.join(homeDirectory, "SODA");
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
  // 3. generate on Pennsieve: call the function
  initiate_generate_manifest_bf();
}
