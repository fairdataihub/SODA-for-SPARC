function showLocalDatasetManifest() {
  ipcRenderer.send("open-file-dialog-local-dataset-manifest-purpose");
}

$(document).ready(function () {
  ipcRenderer.on(
    "selected-local-dataset-manifest-purpose",
    (event, folderPath) => {
      if (folderPath.length > 0) {
        if (folderPath != null) {
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
        }
      } else {
        document.getElementById(
          "input-manifest-local-folder-dataset"
        ).placeholder = "Browse here";
        localDatasetFolderPath = "";
        $("#div-confirm-manifest-local-folder-dataset").hide();
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
  });
});

var localDatasetFolderPath = "";

async function generateManifestPrecheck(type) {
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
  generateManifest("", type);
}

async function generateManifest(action, type) {
  Swal.fire({
    title: "Reviewing the dataset structure.",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
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
          MetadataAnalyticsPrefix.MANIFEST + " - Generate - Check Storage Space",
          Destinations.LOCAL
        );

      } else {
        logMetadataForAnalytics(
          "Success",
          MetadataAnalyticsPrefix.MANIFEST,
          AnalyticsGranularity.ACTION,
          MetadataAnalyticsPrefix.MANIFEST + " - Generate - Check Storage Space",
          Destinations.LOCAL
        );

        sodaJSONObj["starting-point"]["type"] = "local";
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
      }
    });
  } else {
    // Case 2: bf dataset
    sodaJSONObj["bf-account-selected"] = { "account-name": defaultBfAccount };
    sodaJSONObj["bf-dataset-selected"] = { "dataset-name": defaultBfDataset };
    extractBFDatasetForManifestFile(defaultBfAccount, defaultBfDataset);
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
    }
  }
  initiate_generate_manifest();
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
      path: localDestination,
      "dataset-name": newDatasetName,
      "if-existing": "merge",
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

function initiate_generate_manifest() {
  Swal.fire({
    title: "Generating the manifest.xlsx file(s)",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;
  if ("manifest-files" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["manifest-files"]) {
      if (sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
        manifest_files_requested = true;
        delete_imported_manifest();
      }
    }
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
      });

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
        destination === "local" ? Destinations.LOCAL : Destinations.PENNSIEVE
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
        destination === "local" ? Destinations.LOCAL : Destinations.PENNSIEVE
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

      Swal.fire({
        title:
          "Successfully generated manifest files at the specified location!",
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      sodaJSONObj = {
        "starting-point": { type: "" },
        "dataset-structure": {},
        "metadata-files": {},
      };

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
    }
  });
}

async function extractBFDatasetForManifestFile(bfaccount, bfdataset) {
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
    generateManifestHelper();
  }
}

function validateSPARCdataset() {
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
    }).then((result) => {
      document.getElementById(
        "input-manifest-local-folder-dataset"
      ).placeholder = "Browse here";
      $("#div-confirm-manifest-local-folder-dataset").hide();
      localDatasetFolderPath = "";
      return false;
    });
  }
}

function resetManifest() {
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
    }
  });
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
