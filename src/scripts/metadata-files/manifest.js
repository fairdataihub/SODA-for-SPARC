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
    sodaJSONObj["starting-point"]["type"] = "local";
    create_json_object(action, sodaJSONObj, localDatasetFolderPath);
    datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
    populate_existing_folders(datasetStructureJSONObj);
    populate_existing_metadata(sodaJSONObj);
    sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    sodaJSONObj["bf-account-selected"] = {};
    sodaJSONObj["bf-dataset-selected"] = {};
    sodaJSONObj["generate-dataset"] = {};
    let continueProgressEmptyFolder = await checkEmptySubFolders(
      sodaJSONObj["dataset-structure"]
    );
    if (continueProgressEmptyFolder === false) {
      Swal.fire({
        title: "Failed to generate the manifest files.",
        text: "The dataset contains one or more empty folder(s). Per SPARC guidelines, a dataset must not contain any empty folders. Please remove them before generating the manifest files.",
        heightAuto: false,
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {});

      // log the error to analytics
      ipcRenderer.send("track-event", "Error", "Prepare Metadata - maniftest");
      logDatasetDescriptionForAnalytics(false, "Error", "Generate", true);
      logDatasetDescriptionForAnalytics(false, "Error", "Generate", false);

      return;
    }
    generateManifestHelper();
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
    } else {
      if (manifest_files_requested) {
        let high_level_folder_num = 0;
        if ("dataset-structure" in sodaJSONObj) {
          if ("folders" in sodaJSONObj["dataset-structure"]) {
            for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
              high_level_folder_num += 1;
            }
          }
        }
      }

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
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      }).then((result) => {});
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
      showConfirmButton: false,
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
  return isEmpty;
}
