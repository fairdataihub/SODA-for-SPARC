const checkDiskSpace = require("check-disk-space").default;

var metadataFile = "";
var jstreePreview = document.getElementById("div-dataset-tree-preview");
const nonAllowedCharacters = '<>:",;[]{}^`~@/|?*$=!%&+#\\';

// Function to clear the confirm options in the curate feature
const confirm_click_account_function = () => {
  let temp = $(".bf-account-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  if (temp == "None" || temp == "") {
    $("#div-create_empty_dataset-account-btns").css("display", "none");
    $("#div-bf-account-btns-getting-started").css("display", "none");
    $("#div-bf-account-btns-getting-started button").hide();
  } else {
    $("#div-create_empty_dataset-account-btns").css("display", "flex");
    $("#div-bf-account-btns-getting-started").css("display", "flex");
    $("#div-bf-account-btns-getting-started button").show();
  }
};

// per change event of current dataset span text
function confirm_click_function() {
  let temp = $(".bf-dataset-span").html();
  if (
    $(".bf-dataset-span").html() == "None" ||
    $(".bf-dataset-span").html() == ""
  ) {
    $($(this).parents().find(".field").find(".div-confirm-button")).css(
      "display",
      "none"
    );
    $("#para-review-dataset-info-disseminate").text("None");
  } else {
    $($(this).parents().find(".field").find(".div-confirm-button")).css(
      "display",
      "flex"
    );
    if ($($(this).parents().find(".field").find(".synced-progress")).length) {
      if (
        $($(this).parents().find(".field").find(".synced-progress")).css(
          "display"
        ) === "none"
      ) {
        $(".confirm-button").click();
      }
    } else {
      $(".confirm-button").click();
    }
  }
}

$(".button-individual-metadata.remove").click(function () {
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );

  $(metadataFileStatus).text("");
  $($(this).parents()[1]).find(".div-metadata-confirm").css("display", "none");
  $($(this).parents()[1]).find(".div-metadata-go-back").css("display", "flex");
});

$(".metadata-button").click(function () {
  metadataFile = $(this);
  $(".div-organize-generate-dataset.metadata").addClass("hide");
  var target = $(this).attr("data-next");
  $("#" + target).toggleClass("show");
  // document.getElementById("save-progress-btn").style.display = "none";
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("prevBtn").style.display = "none";
});

function confirmMetadataFilePath(ev) {
  $($(ev).parents()[1]).removeClass("show");
  $(".div-organize-generate-dataset.metadata").removeClass("hide");
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  // document.getElementById("save-progress-btn").style.display = "block";

  // Checking if metadata files are imported
  //// once users click "Confirm" or "Cancel", check if file is specified
  //// if yes: addClass 'done'
  //// if no: removeClass 'done'
  var errorMetadataFileMessages = [
    "",
    "Please only drag and drop a file!",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];
  var metadataFileStatus = $($(ev).parents()[1]).find(
    ".para-metadata-file-status"
  );

  if (!errorMetadataFileMessages.includes($(metadataFileStatus).text())) {
    $(metadataFile).addClass("done");

    // log the import to analytics
    logCurationForAnalytics(
      "Success",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      [
        "Step 4",
        "Import",
        `${getMetadataFileNameFromStatus(metadataFileStatus)}`,
        determineLocationFromStatus(metadataFileStatus)
          ? Destinations.PENNSIEVE
          : Destinations.LOCAL,
      ],
      determineDatasetLocation()
    );
  } else {
    $(metadataFile).removeClass("done");
    $(metadataFileStatus).text("");
    // log the import attempt to analytics
    logCurationForAnalytics(
      "Error",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      [
        "Step 4",
        "Import",
        `${getMetadataFileNameFromStatus(metadataFileStatus)}`,
        determineLocationFromStatus(metadataFileStatus)
          ? Destinations.PENNSIEVE
          : Destinations.LOCAL,
      ],
      determineDatasetLocation()
    );
  }
}
// $(".button-individual-metadata.confirm").click(function() {
// })

$(".button-individual-metadata.go-back").click(function () {
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  $(metadataFileStatus).text("");
  $($(this).parents()[1]).removeClass("show");
  $(".div-organize-generate-dataset.metadata").removeClass("hide");
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  var errorMetadataFileMessages = [
    "",
    "Please only drag and drop a file!",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];
  var metadataFileStatus = $($(this).parents()[1]).find(
    ".para-metadata-file-status"
  );
  if (!errorMetadataFileMessages.includes($(metadataFileStatus).text())) {
    $(metadataFile).addClass("done");
  } else {
    $(metadataFile).removeClass("done");
    $(metadataFileStatus).text("");
  }
});

const metadataFileExtensionObject = {
  submission: [".csv", ".xlsx", ".xls", ".json"],
  dataset_description: [".csv", ".xlsx", ".xls", ".json"],
  subjects: [".csv", ".xlsx", ".xls", ".json"],
  samples: [".csv", ".xlsx", ".xls", ".json"],
  README: [".txt"],
  CHANGES: [".txt"],
  code_description: [".xlsx"],
  inputs_metadata: [".xlsx"],
  outputs_metadata: [".xlsx"],
};

function dropHandler(ev, paraElement, metadataFile) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  document.getElementById(paraElement).innerHTML = "";

  if (ev.dataTransfer.items) {
    /// if users drag multiple files, only show first file
    var file = ev.dataTransfer.items[0];
    // If dropped items aren't files, reject them
    if (ev.dataTransfer.items[0].kind === "file") {
      var file = ev.dataTransfer.items[0].getAsFile();
      var metadataWithoutExtension = file.name.slice(0, file.name.indexOf("."));
      var extension = file.name.slice(file.name.indexOf("."));

      if (metadataWithoutExtension === metadataFile) {
        if (metadataFileExtensionObject[metadataFile].includes(extension)) {
          document.getElementById(paraElement).innerHTML = file.path;
          $($("#" + paraElement).parents()[1])
            .find(".div-metadata-confirm")
            .css("display", "flex");
          $($("#" + paraElement).parents()[1])
            .find(".div-metadata-go-back")
            .css("display", "none");
        } else {
          document.getElementById(paraElement).innerHTML =
            "<span style='color:red'>Your SPARC metadata file must be in one of the formats listed above!</span>";
        }
      } else {
        document.getElementById(paraElement).innerHTML =
          "<span style='color:red'>Your SPARC metadata file must be named and formatted exactly as listed above!</span>";
        $($("#" + paraElement).parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "none");
        $($("#" + paraElement).parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "flex");
      }
    } else {
      document.getElementById(paraElement).innerHTML =
        "<span style='color:red'>Please only drag and drop a file!</span>";
    }
  }
}

const checkAvailableSpace = () => {
  const roundToHundredth = (value) => {
    return Number(parseFloat(value.toFixed(2)));
  };
  let location = document
    .getElementById("input-destination-generate-dataset-locally")
    .getAttribute("placeholder");

  checkDiskSpace(location).then((diskSpace) => {
    let freeMemory = diskSpace.free; //returns in bytes
    let freeMemoryMB = roundToHundredth(freeMemory / 1024 ** 2);

    client.invoke("api_check_JSON_size", sodaJSONObj, (error, res) => {
      if (error) {
        console.error(error);
      } else {
        let tempFolderSize = res;
        let folderSizeMB = roundToHundredth(tempFolderSize / 1024 ** 2);
        let warningText =
          "Please free up " +
          roundToHundredth(folderSizeMB) +
          "MB " +
          "or consider uploading directly to Pennsieve.";

        //converted to MB/GB/TB for user readability
        if (folderSizeMB > 1000) {
          //if bigger than a gb then convert to that
          folderSizeMB = roundToHundredth(folderSizeMB / 1024);
          freeMemoryMB = roundToHundredth(freeMemoryMB / 1024);
          warningText =
            "Please free up " +
            roundToHundredth(folderSizeMB) +
            "GB " +
            "or consider uploading directly to Pennsieve.";
          //if bigger than a tb then convert to that
          if (folderSizeMB > 1000) {
            folderSizeMB = roundToHundredth(folderSizeMB / 1024);
            freeMemoryMB = roundToHundredth(freeMemoryMB / 1024);
            warningText =
              "Please free up " +
              roundToHundredth(folderSizeMB) +
              "TB " +
              "or consider uploading directly to Pennsieve.";
          }
        }

        //comparison is done in bytes
        if (freeMemory < tempFolderSize) {
          $("#div-confirm-destination-locally button").hide();
          $("#Question-generate-dataset-choose-ds-name").css("display", "none");
          document.getElementById(
            "input-destination-generate-dataset-locally"
          ).placeholder = "Browse here";

          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: "OK",
            heightAuto: false,
            icon: "warning",
            showCancelButton: false,
            title: "Not enough space in storage device",
            text: warningText,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          });

          logCurationForAnalytics(
            "Error",
            PrepareDatasetsAnalyticsPrefix.CURATE,
            AnalyticsGranularity.ACTION_WITH_DESTINATION,
            ["Step 6", "Check Storage Space", determineDatasetLocation()],
            determineDatasetLocation()
          );

          // return to avoid logging that the user passed the storage space check
          return;
        }

        logCurationForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_WITH_DESTINATION,
          ["Step 6", "Check Storage Space", determineDatasetLocation()],
          determineDatasetLocation()
        );
      }
    });
  });
};
const btnConfirmLocalDatasetGeneration = document.getElementById(
  "btn-confirm-local-destination"
);
btnConfirmLocalDatasetGeneration.addEventListener(
  "click",
  checkAvailableSpace,
  false
);

////////////////// IMPORT EXISTING PROGRESS FILES ////////////////////////////////
const progressFileDropdown = document.getElementById("progress-files-dropdown");

/////////////////////////////// Helpers function for Import progress function /////////////////////////////
// function to load SODA with progress file
const progressFileParse = (ev) => {
  var fileName = $(ev).val();
  if (fileName !== "Select") {
    var filePath = path.join(progressFilePath, fileName);
    try {
      var content = fs.readFileSync(filePath);
      contentJson = JSON.parse(content);
      return contentJson;
    } catch (error) {
      log.error(error);
      console.log(error);
      document.getElementById("para-progress-file-status").innerHTML =
        "<span style='color:red'>" + error + "</span>";

      // log the error to analytics at varying levels of granularity
      logMetadataForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ALL_LEVELS,
        Actions.EXISTING,
        Destinations.SAVED
      );

      return {};
    }
  } else {
    return {};
  }
};

const importManifest = (object) => {
  if ("manifest-files" in object) {
    manifestFileCheck.checked = true;
  } else {
    manifestFileCheck.checked = false;
  }
};

const importMetadataFilesProgress = (object) => {
  populateMetadataProgress(false, "", "");
  if ("metadata-files" in object) {
    var metadataFileArray = Object.keys(object["metadata-files"]);
    metadataFileArray.forEach((element) => {
      var fullPath = object["metadata-files"][element]["path"];
      populateMetadataProgress(true, path.parse(element).name, fullPath);
      if (!fs.existsSync(fullPath)) {
        missing_metadata_files.push(fullPath);
      }
    });
  }
};

const recursive_check_for_missing_files = (dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let file in dataset_folder["files"]) {
      if ("forTreeview" in dataset_folder["files"][file]) {
        continue;
      }
      if (!fs.existsSync(dataset_folder["files"][file]["path"])) {
        missing_dataset_files.push(dataset_folder["files"][file]["path"]);
      }
    }
  }
  if (
    "folders" in dataset_folder &&
    Object.keys(dataset_folder["folders"]).length !== 0
  ) {
    for (let folder in dataset_folder["folders"]) {
      recursive_check_for_missing_files(dataset_folder["folders"][folder]);
    }
  }
};

const importDatasetStructure = (object) => {
  if ("dataset-structure" in object) {
    datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
    recursive_check_for_missing_files(datasetStructureJSONObj);
    highLevelFoldersDisableOptions();
  } else {
    datasetStructureJSONObj = { folders: {}, files: {}, type: "" };
  }
};

const importGenerateDatasetStep = (object) => {
  if ("generate-dataset" in sodaJSONObj) {
    // Step 1: Where to generate the dataset
    if (sodaJSONObj["generate-dataset"]["destination"] === "local") {
      $("#generate-local-desktop").prop("checked", true);
      $($("#generate-local-desktop").parents()[2]).click();
      // Step 2: if generate locally, name and path
      $("#input-destination-generate-dataset-locally").prop(
        "placeholder",
        sodaJSONObj["generate-dataset"]["path"]
      );
      $("#input-destination-generate-dataset-locally").val(
        sodaJSONObj["generate-dataset"]["path"]
      );
      $("#btn-confirm-local-destination").click();
      $("#inputNewNameDataset").val(
        sodaJSONObj["generate-dataset"]["dataset-name"]
      );
      $("#btn-confirm-new-dataset-name").click();
    } else if (sodaJSONObj["generate-dataset"]["destination"] === "bf") {
      $("#generate-upload-BF").prop("checked", true);
      $($("#generate-upload-BF").parents()[2]).click();
      // Step 2: if generate on bf, choose bf account
      if (
        "bf-account-selected" in sodaJSONObj &&
        sodaJSONObj["bf-account-selected"]["account-name"] !== ""
      ) {
        var bfAccountSelected =
          sodaJSONObj["bf-account-selected"]["account-name"];
        if (bfAccountSelected != defaultBfAccount) {
          return;
        }
        $("#current-bf-account-generate").text(bfAccountSelected);
        $("#para-account-detail-curate").html("");
        client.invoke(
          "api_bf_account_details",
          bfAccountSelected,
          (error, res) => {
            if (error) {
              log.error(error);
              console.error(error);
              showHideDropdownButtons("account", "hide");
            } else {
              $("#para-account-detail-curate").html(res);
              updateBfAccountList();
              // checkPrevDivForConfirmButton("account");
            }
          }
        );
        // $("#div-bf-account-btns").css("display", "flex");
        $("#btn-bf-account").trigger("click");
        // Step 3: choose to generate on an existing or new dataset
        if (
          "bf-dataset-selected" in sodaJSONObj &&
          sodaJSONObj["bf-dataset-selected"]["dataset-name"] !== ""
        ) {
          $("#generate-BF-dataset-options-existing").prop("checked", true);
          $($("#generate-BF-dataset-options-existing").parents()[2]).click();
          var bfDatasetSelected =
            sodaJSONObj["bf-dataset-selected"]["dataset-name"];
          setTimeout(() => {
            let valid_dataset = false;
            for (index in datasetList) {
              let x = datasetList[index]["name"];
              if (bfDatasetSelected == datasetList[index]["name"]) {
                valid_dataset = true;
              }
            }
            if (valid_dataset == false) {
              return;
            }
            $("#current-bf-dataset-generate").text(bfDatasetSelected);
            $("#button-confirm-bf-dataset").click();
            // Step 4: Handle existing files and folders
            if ("if-existing" in sodaJSONObj["generate-dataset"]) {
              var existingFolderOption =
                sodaJSONObj["generate-dataset"]["if-existing"];
              $("#existing-folders-" + existingFolderOption).prop(
                "checked",
                true
              );
              $(
                $("#existing-folders-" + existingFolderOption).parents()[2]
              ).click();
            }
            if ("if-existing-files" in sodaJSONObj["generate-dataset"]) {
              var existingFileOption =
                sodaJSONObj["generate-dataset"]["if-existing-files"];
              $("#existing-files-" + existingFileOption).prop("checked", true);
              $(
                $("#existing-files-" + existingFileOption).parents()[2]
              ).click();
            }
          }, 3000);
        } else {
          $("#generate-BF-dataset-options-new").prop("checked", true);
          $($("#generate-BF-dataset-options-new").parents()[2]).click();
          $("#inputNewNameDataset").val(
            sodaJSONObj["generate-dataset"]["dataset-name"]
          );
          $("#inputNewNameDataset").keyup();
        }
      }
    }
  } else {
    if ("save-progress" in sodaJSONObj) {
      // the block of code below reverts all the checks to option cards if applicable
      $("#previous-progress").prop("checked", true);
      $($("#previous-progress").parents()[2]).addClass("checked");
      $(
        $(
          $(
            $("#div-getting-started-previous-progress").parents()[0]
          ).siblings()[0]
        ).children()[0]
      ).toggleClass("non-selected");
    } else {
      exitCurate();
    }
  }
};

// check metadata files
function populateMetadataProgress(
  populateBoolean,
  metadataFileName,
  localPath
) {
  var metadataButtonsArray = $(".metadata-button.button-generate-dataset");
  var correspondingMetadataParaElement = {
    submission: ["para-submission-file-path", metadataButtonsArray[0]],
    dataset_description: [
      "para-ds-description-file-path",
      metadataButtonsArray[1],
    ],
    subjects: ["para-subjects-file-path", metadataButtonsArray[2]],
    samples: ["para-samples-file-path", metadataButtonsArray[3]],
    README: ["para-readme-file-path", metadataButtonsArray[4]],
    CHANGES: ["para-changes-file-path", metadataButtonsArray[5]],
    code_description: ["para-readme-file-path", metadataButtonsArray[6]],
    inputs_metadata: ["para-inputsMetadata-file-path", metadataButtonsArray[7]],
    outputs_metadata: [
      "para-outputs_metadata-file-path",
      metadataButtonsArray[8],
    ],
  };
  if (populateBoolean) {
    if (metadataFileName in correspondingMetadataParaElement) {
      var paraElement = correspondingMetadataParaElement[metadataFileName];
      $("#" + paraElement[0]).text(localPath);
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-confirm")
        .css("display", "flex");
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-go-back")
        .css("display", "none");
      $(paraElement[1]).addClass("done");
    }
  } else {
    for (var key in correspondingMetadataParaElement) {
      var paraElement = correspondingMetadataParaElement[key];
      $("#" + paraElement[0]).text("");
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-confirm")
        .css("display", "none");
      $($("#" + paraElement[0]).parents()[1])
        .find(".div-metadata-go-back")
        .css("display", "flex");
      $(paraElement[1]).removeClass("done");
    }
  }
}

//////////////////////// Main Import progress function
let missing_dataset_files = [];
let missing_metadata_files = [];
function loadProgressFile(ev) {
  let return_option = "";
  missing_dataset_files = [];
  missing_metadata_files = [];

  if ($(ev).val() === "Select") {
    return;
  }

  var jsonContent = progressFileParse(ev);

  $("#para-progress-file-status").html("");
  $("#nextBtn").prop("disabled", true);

  // create loading effect
  $("#div-progress-file-loader").css("display", "block");
  $("body").addClass("waiting");

  if (JSON.stringify(jsonContent) !== "{}") {
    sodaJSONObj = jsonContent;
    setTimeout(() => {
      sodaJSONObj = jsonContent;
      importManifest(sodaJSONObj);
      importMetadataFilesProgress(sodaJSONObj);
      importDatasetStructure(sodaJSONObj);
      importGenerateDatasetStep(sodaJSONObj);
      if (missing_dataset_files.length > 0 || missing_metadata_files > 0) {
        verify_missing_files("pre-existing");
      } else {
        document.getElementById("div-progress-file-loader").style.display =
          "none";
        $("body").removeClass("waiting");
        document.getElementById("nextBtn").disabled = false;
        document.getElementById("para-progress-file-status").innerHTML =
          "<span style='color:var(--color-light-green)'>Previous work loaded successfully! Continue below.</span>";

        // log the success at the action and action with destination granularity levels
        logMetadataForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          Actions.EXISTING,
          Destinations.SAVED
        );
      }
    }, 1300);
  } else {
    sodaJSONObj =
      '{"starting-point":"new","dataset-structure":{},"metadata-files":{}}';
    setTimeout(() => {
      importManifest(sodaJSONObj);
      importMetadataFilesProgress(sodaJSONObj);
      importDatasetStructure(sodaJSONObj);
      importGenerateDatasetStep(sodaJSONObj);
      if (missing_dataset_files.length > 0 || missing_metadata_files > 0) {
        return_option = verify_missing_files("new");
      } else {
        document.getElementById("div-progress-file-loader").style.display =
          "none";
        $("body").removeClass("waiting");
        document.getElementById("para-progress-file-status").innerHTML = "";
      }
    }, 500);
  }
}

const verify_missing_files = (mode) => {
  let missing_files = missing_metadata_files.concat(missing_dataset_files);
  let message_text = "";
  message_text = "<ul>";

  for (let item in missing_files) {
    message_text += `<li>${missing_files[item]}</li>`;
  }

  message_text += "</ul>";

  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "Cancel",
    confirmButtonText: "Continue",
    heightAuto: false,
    title:
      "The following files have been moved, deleted, or renamed since this progress was saved. If you continue, they will be ignored",
    icon: "warning",
    reverseButtons: reverseSwalButtons,
    showCancelButton: true,
    html: message_text,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    didOpen() {
      document.getElementById("swal2-title").parentNode.parentNode.style.width =
        "600px";
      document.getElementById("swal2-content").style.overflowY = "scroll";
      document.getElementById("swal2-content").style.height = "400px";
      document.getElementById(
        "swal2-title"
      ).parentNode.parentNode.children[1].style.whiteSpace = "nowrap";
      // document.getElementById("swal2-content").style.
    },
  }).then((result) => {
    if (result.isConfirmed) {
      remove_missing_files();
      if (mode === "pre-existing") {
        document.getElementById("div-progress-file-loader").style.display =
          "none";
        $("body").removeClass("waiting");
        document.getElementById("nextBtn").disabled = false;
        document.getElementById("para-progress-file-status").innerHTML =
          "<span style='color:var(--color-light-green)'>Previous work loaded successfully! Continue below.</span>";

        // log the success at the action and action with destination granularith levels
        logMetadataForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          Actions.EXISTING,
          Destinations.SAVED
        );
      } else if (mode === "new") {
        document.getElementById("div-progress-file-loader").style.display =
          "none";
        $("body").removeClass("waiting");
        document.getElementById("para-progress-file-status").innerHTML = "";
      }
    } else {
      document.getElementById("div-progress-file-loader").style.display =
        "none";
      $("body").removeClass("waiting");
      document.getElementById("para-progress-file-status").innerHTML = "";
    }
  });
};

const remove_missing_files = () => {
  if (missing_metadata_files.length > 0) {
    for (let item_path in missing_metadata_files) {
      for (let item in sodaJSONObj["metadata-files"]) {
        if (
          sodaJSONObj["metadata-files"][item]["path"] ==
          missing_metadata_files[item_path]
        ) {
          delete sodaJSONObj["metadata-files"][item];
        }
      }
    }
  }
  if (missing_dataset_files.length > 0) {
    for (let item_path in missing_dataset_files) {
      recursive_remove_missing_file(
        missing_dataset_files[item_path],
        sodaJSONObj["dataset-structure"]
      );
    }
  }
};

const recursive_remove_missing_file = (item_path, dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let file in dataset_folder["files"]) {
      if ("forTreeview" in dataset_folder["files"][file]) {
        continue;
      }
      if (dataset_folder["files"][file]["path"] == item_path) {
        delete dataset_folder["files"][file];
      }
    }
  }
  if (
    "folders" in dataset_folder &&
    Object.keys(dataset_folder["folders"]).length !== 0
  ) {
    for (let folder in dataset_folder["folders"]) {
      recursive_remove_missing_file(
        item_path,
        dataset_folder["folders"][folder]
      );
    }
  }
};

function removeOptions(selectbox) {
  var i;
  for (i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
}
//
// Function to add options to dropdown list
function addOption(selectbox, text, value) {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
}

// function to load Progress dropdown
const importOrganizeProgressPrompt = () => {
  document.getElementById("para-progress-file-status").innerHTML = "";
  removeOptions(progressFileDropdown);
  addOption(progressFileDropdown, "Select", "Select");
  if (fs.existsSync(progressFilePath)) {
    var fileNames = fs.readdirSync(progressFilePath);
    if (fileNames.length > 0) {
      fileNames.forEach((item, i) => {
        addOption(progressFileDropdown, path.parse(item).name, item);
      });
    } else {
      document.getElementById("para-progress-file-status").innerHTML =
        "<span style='color:var(--color)'>There is no existing progress to load. Please choose one of the other options above!</span>";
    }
  } else {
    document.getElementById("para-progress-file-status").innerHTML =
      "<span style='color:var(--color)'>There is no existing progress to load. Please choose one of the other options above!</span>";
  }
};

$(document).ready(function () {
  var accountDetails = $("#para-account-detail-curate");
  //Observe the paragraph
  this.observer = new MutationObserver(
    function (mutations) {
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
            refreshDatasetList();
          }
        }
      );
    }.bind(this)
  );
  this.observer.observe(accountDetails.get(0), {
    characterData: true,
    childList: true,
  });

  importOrganizeProgressPrompt();

  $("#bf_list_users_pi").selectpicker();
  $("#bf_list_users_pi").selectpicker("refresh");
  $("#bf_list_users").selectpicker();
  $("#bf_list_users").selectpicker("refresh");
  $("#bf_list_roles_user").selectpicker();
  $("#bf_list_roles_user").selectpicker("refresh");
  $("#bf_list_teams").selectpicker();
  $("#bf_list_teams").selectpicker("refresh");
  $("#bf_list_roles_team").selectpicker();
  $("#bf_list_roles_team").selectpicker("refresh");
});

const get_api_key = async (login, password, key_name) => {
  return new Promise((resolve) => {
    client.invoke(
      "api_get_pennsieve_api_key_secret",
      login,
      password,
      key_name,
      (error, res) => {
        if (error) {
          log.error(error);
          console.error(error);
          resolve(["failed", error]);
        } else {
          console.log(res);
          resolve(res);
        }
      }
    );
  });
};

var dropdownEventID = "";
async function openDropdownPrompt(ev, dropdown, show_timer = true) {
  // if users edit current account
  if (dropdown === "bf") {
    var resolveMessage = "";
    if (bfAccountOptionsStatus === "") {
      if (Object.keys(bfAccountOptions).length === 1) {
        footerMessage = "No existing accounts to load. Please add an account.";
      } else {
        footerMessage = "";
      }
    } else {
      footerMessage = bfAccountOptionsStatus;
    }
    var bfacct;
    let bfAccountSwal = false;
    if (bfAccountSwal === null) {
      if (bfacct !== "Select") {
        Swal.fire({
          allowEscapeKey: false,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          title: "Loading your account details...",
          didOpen: () => {
            Swal.showLoading();
          },
        });
        $("#Question-getting-started-BF-account")
          .nextAll()
          .removeClass("show")
          .removeClass("prev")
          .removeClass("test2");
        $("#Question-generate-dataset-BF-account")
          .nextAll()
          .removeClass("show")
          .removeClass("prev")
          .removeClass("test2");
        $("#current-bf-account").text("");
        $("#current-bf-account-generate").text("");
        $("#create_empty_dataset_BF_account_span").text("");
        $(".bf-account-span").text("");
        $("#current-bf-dataset").text("None");
        $("#current-bf-dataset-generate").text("None");
        $(".bf-dataset-span").html("None");
        defaultBfDataset = "Select dataset";
        document.getElementById("ds-description").innerHTML = "";
        refreshDatasetList();
        $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
          "display",
          "none"
        );
        $("#button-confirm-bf-dataset-getting-started").hide();

        $("#para-account-detail-curate").html("");
        $("#current-bf-dataset").text("None");
        $(".bf-dataset-span").html("None");
        showHideDropdownButtons("dataset", "hide");
        client.invoke("api_bf_account_details", bfacct, (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              icon: "error",
              text: error,
              footer:
                "<a href='https://docs.pennsieve.io/docs/configuring-the-client-credentials'>Why do I have this issue?</a>",
            });
            showHideDropdownButtons("account", "hide");
          } else {
            $("#para-account-detail-curate").html(res);
            $("#current-bf-account").text(bfacct);
            $("#current-bf-account-generate").text(bfacct);
            $("#create_empty_dataset_BF_account_span").text(bfacct);
            $(".bf-account-span").text(bfacct);
            updateBfAccountList();
            client.invoke("api_bf_dataset_account", bfacct, (error, result) => {
              if (error) {
                log.error(error);
                console.log(error);
                var emessage = error;
                document.getElementById(
                  "para-filter-datasets-status-2"
                ).innerHTML =
                  "<span style='color: red'>" + emessage + "</span>";
              } else {
                datasetList = [];
                datasetList = result;
                refreshDatasetList();
              }
            });
            showHideDropdownButtons("account", "hide");
            // checkPrevDivForConfirmButton("account");
          }
        });
      } else {
        Swal.showValidationMessage("Please select an account!");
      }
    } else if (bfAccountSwal === false) {
      Swal.fire({
        allowOutsideClick: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        confirmButtonText: "Connect to Pennsieve",
        showCloseButton: false,
        focusConfirm: false,
        heightAuto: false,
        reverseButtons: reverseSwalButtons,
        showCancelButton: true,
        title: `<span style="text-align:center">Connect your Pennsieve account using your email and password</span><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`,
        html: `<input type="text" id="ps_login" class="swal2-input" placeholder="Email Address for Pennsieve">
        <input type="password" id="ps_password" class="swal2-input" placeholder="Password">`,
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
        footer:
          '<a onclick="showBFAddAccountSweetalert()">I want to connect with an API key instead</a>',
        didOpen: () => {
          $(".swal-popover").popover();
        },
        preConfirm: async () => {
          Swal.resetValidationMessage();
          Swal.showLoading();
          const login = Swal.getPopup().querySelector("#ps_login").value;
          const password = Swal.getPopup().querySelector("#ps_password").value;
          if (!login || !password) {
            Swal.hideLoading();
            Swal.showValidationMessage(`Please enter login and password`);
          } else {
            let key_name = SODA_SPARC_API_KEY;
            let response = await get_api_key(login, password, key_name);
            if (response[0] == "failed") {
              let error_message = response[1];
              if (
                response[1]["message"] ===
                "exceptions must derive from BaseException"
              ) {
                error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">It seems that you do not have access to the SPARC Consortium organization on Pennsieve. Email <a href="mailto:support@pennsieve.net">support@pennsieve.net</a> to get access to the SPARC Consortium organization then try again.</div>`;
              }
              console.log(response[1]["message"]);
              if (
                response[1]["message"] ===
                "Error: Username or password was incorrect."
              ) {
                error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">Error: Username or password was incorrect</div>`;
              }
              console.log(error_message);
              Swal.hideLoading();
              Swal.showValidationMessage(error_message);
              document.getElementById(
                "swal2-validation-message"
              ).style.flexDirection = "column";
            } else if (response[0] == "success") {
              return {
                key: response[1],
                secret: response[2],
                name: response[3],
              };
            }
          }
        },
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            allowEscapeKey: false,
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            showConfirmButton: false,
            title: "Adding account...",
            didOpen: () => {
              Swal.showLoading();
            },
          });
          let key_name = result.value.name;
          let apiKey = result.value.key;
          let apiSecret = result.value.secret;
          client.invoke(
            "api_bf_add_account_username",
            key_name,
            apiKey,
            apiSecret,
            (error, res) => {
              if (error) {
                log.error(error);
                console.error(error);
                Swal.showValidationMessage(userError(error));
                Swal.close();
              } else {
                bfAccountOptions[key_name] = key_name;
                defaultBfAccount = key_name;
                defaultBfDataset = "Select dataset";
                client.invoke(
                  "api_bf_account_details",
                  key_name,
                  (error, res) => {
                    if (error) {
                      log.error(error);
                      console.error(error);
                      Swal.fire({
                        backdrop: "rgba(0,0,0, 0.4)",
                        heightAuto: false,
                        icon: "error",
                        text: "Something went wrong!",
                        footer:
                          '<a target="_blank" href="https://docs.pennsieve.io/docs/configuring-the-client-credentials">Why do I have this issue?</a>',
                      });
                      showHideDropdownButtons("account", "hide");
                      confirm_click_account_function();
                    } else {
                      $("#para-account-detail-curate").html(res);
                      $("#current-bf-account").text(key_name);
                      $("#current-bf-account-generate").text(key_name);
                      $("#create_empty_dataset_BF_account_span").text(key_name);
                      $(".bf-account-span").text(key_name);
                      $("#current-bf-dataset").text("None");
                      $("#current-bf-dataset-generate").text("None");
                      $(".bf-dataset-span").html("None");
                      $("#para-account-detail-curate-generate").html(res);
                      $("#para_create_empty_dataset_BF_account").html(res);
                      $(".bf-account-details-span").html(res);
                      $("#para-continue-bf-dataset-getting-started").text("");

                      $("#current_curation_team_status").text("None");
                      $("#curation-team-share-btn").hide();
                      $("#curation-team-unshare-btn").hide();
                      $("#current_sparc_consortium_status").text("None");
                      $("#sparc-consortium-share-btn").hide();
                      $("#sparc-consortium-unshare-btn").hide();

                      showHideDropdownButtons("account", "show");
                      confirm_click_account_function();
                      updateBfAccountList();
                    }
                  }
                );
                Swal.fire({
                  allowEscapeKey: false,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                  icon: "success",
                  showConfirmButton: false,
                  timer: 3000,
                  timerProgressBar: true,
                  title:
                    "Successfully added! <br/>Loading your account details...",
                  didOpen: () => {
                    Swal.showLoading();
                  },
                });
              }
            }
          );
        }
      });
    }
  } else if (dropdown === "dataset") {
    if (ev != null) {
      dropdownEventID = ev.id;
    }
    $(".svg-change-current-account.dataset").css("display", "none");
    $("#div-permission-list-2").css("display", "none");
    $(".ui.active.green.inline.loader.small").css("display", "block");

    setTimeout(async function () {
      // disable the Continue btn first
      $("#nextBtn").prop("disabled", true);
      var bfDataset = "";

      // if users edit Current dataset
      datasetPermissionDiv.style.display = "none";
      $(datasetPermissionDiv)
        .find("#curatebfdatasetlist")
        .find("option")
        .empty()
        .append('<option value="Select dataset">Search here...</option>')
        .val("Select dataset");

      $(datasetPermissionDiv)
        .find("#div-filter-datasets-progress-2")
        .css("display", "block");

      $("#bf-dataset-select-header").css("display", "none");

      $(datasetPermissionDiv).find("#para-filter-datasets-status-2").text("");
      $("#para-continue-bf-dataset-getting-started").text("");

      $(datasetPermissionDiv)
        .find("#select-permission-list-2")
        .val("All")
        .trigger("change");
      $(datasetPermissionDiv)
        .find("#curatebfdatasetlist")
        .val("Select dataset")
        .trigger("change");

      initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

      //$("#curatebfdatasetlist").selectpicker("hide");
      //$("#curatebfdatasetlist").selectpicker("refresh");
      //$(".selectpicker").selectpicker("hide");
      //$(".selectpicker").selectpicker("refresh");
      //$("#bf-dataset-select-div").hide();

      var accountPresent = await check_api_key();
      if (accountPresent === false) {
        //If there is no API key pair, warning will pop up allowing user to sign in
        await Swal.fire({
          icon: "warning",
          text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connected to Pennsieve. Would you like to do it now?",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Yes",
          showCancelButton: true,
          reverseButtons: reverseSwalButtons,
          cancelButtonText: "I'll do it later",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            await openDropdownPrompt(this, "bf");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          } else {
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          }
        });
        ipcRenderer.send(
          "track-event",
          "Error",
          "Selecting dataset",
          "User has not connected their Pennsieve account with SODA",
          1
        );
      } else {
        //account is signed in but no datasets have been fetched or created
        //invoke dataset request to ensure no datasets have been created
        if (datasetList.length === 0) {
          const fetchData = new Promise((resolve, reject) => {
            client.invoke(
              "api_bf_dataset_account",
              defaultBfAccount,
              (error, result) => {
                if (error) {
                  log.error(error);
                  console.log(error);
                  var emessage = error;
                  reject(emessage);
                } else {
                  datasetList = [];
                  datasetList = result;
                  refreshDatasetList();
                  resolve();
                }
              }
            );
          });
        }
        //after request check length again
        //if 0 then no datasets have been created
        if (datasetList.length === 0) {
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            cancelButtonText: "Cancel",
            confirmButtonText: "Create new dataset",
            focusCancel: false,
            focusConfirm: true,
            showCloseButton: true,
            showCancelButton: true,
            heightAuto: false,
            allowOutsideClick: false,
            allowEscapeKey: true,
            title:
              "<h3 style='margin-bottom:20px !important'>No dataset found</h3>",
            html: "It appears that your don't have any datasets on Pennsieve with owner or manage permission.<br><br>Please create one to get started.",
            showClass: {
              popup: "animate__animated animate__fadeInDown animate__faster",
            },
            hideClass: {
              popup:
                "animate__animated animate__fadeOutUp animate__faster animate_fastest",
            },
            didOpen: () => {
              $(".ui.active.green.inline.loader.small").css("display", "none");
              $(".svg-change-current-account.dataset").css("display", "block");
            },
          }).then((result) => {
            if (result.isConfirmed) {
              $("#create_new_bf_dataset_btn").click();
            }
          });
          ipcRenderer.send(
            "track-event",
            "Error",
            "Selecting dataset",
            "User has not created any datasets",
            1
          );
        }
      }
      //datasets do exist so display popup with dataset options
      //else datasets have been created
      if (datasetList.length > 0) {
        const { value: bfDS } = await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Confirm",
          focusCancel: true,
          focusConfirm: false,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          html: datasetPermissionDiv,
          reverseButtons: reverseSwalButtons,
          showCloseButton: true,
          showCancelButton: true,
          title:
            "<h3 style='margin-bottom:20px !important'>Select your dataset</h3>",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup:
              "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          willOpen: () => {
            $("#curatebfdatasetlist").selectpicker("hide");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#bf-dataset-select-div").hide();
          },
          didOpen: () => {
            $("#div-permission-list-2").css("display", "block");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            datasetPermissionDiv.style.display = "block";
            $("#curatebfdatasetlist").attr("disabled", false);
            $(datasetPermissionDiv)
              .find("#div-filter-datasets-progress-2")
              .css("display", "none");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#curatebfdatasetlist").selectpicker("show");
            $("#bf-dataset-select-div").show();

            bfDataset = $("#curatebfdatasetlist").val();
            let sweet_al = document.getElementsByClassName("swal2-content")[0];
            let sweet_alrt =
              document.getElementsByClassName("swal2-actions")[0];
            sweet_alrt.style.marginTop = "1rem";

            let tip_container = document.createElement("div");
            let tip_content = document.createElement("p");
            tip_content.innerText =
              "Only datasets where you have owner or manager permissions will be shown in the list";
            tip_content.classList.add("tip-content");
            tip_content.style.textAlign = "left";
            tip_container.style.marginTop = ".5rem";
            tip_container.appendChild(tip_content);
            sweet_al.appendChild(tip_container);
          },
          preConfirm: () => {
            bfDataset = $("#curatebfdatasetlist").val();
            if (!bfDataset) {
              Swal.showValidationMessage("Please select a dataset!");

              $(datasetPermissionDiv)
                .find("#div-filter-datasets-progress-2")
                .css("display", "none");
              $("#curatebfdatasetlist").selectpicker("show");
              $("#curatebfdatasetlist").selectpicker("refresh");
              $("#bf-dataset-select-div").show();

              return undefined;
            } else {
              if (bfDataset === "Select dataset") {
                Swal.showValidationMessage("Please select a dataset!");

                $(datasetPermissionDiv)
                  .find("#div-filter-datasets-progress-2")
                  .css("display", "none");
                $("#curatebfdatasetlist").selectpicker("show");
                $("#curatebfdatasetlist").selectpicker("refresh");
                $("#bf-dataset-select-div").show();

                return undefined;
              } else {
                return bfDataset;
              }
            }
          },
        });

        // check return value
        if (bfDS) {
          if (show_timer) {
            Swal.fire({
              allowEscapeKey: false,
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: false,
              title: "Loading your dataset details...",
              didOpen: () => {
                Swal.showLoading();
              },
            });
          }

          if (dropdownEventID === "dd-select-pennsieve-dataset") {
            $("#ds-name").val(bfDataset);
            $("body").removeClass("waiting");
            $(".svg-change-current-account.dataset").css("display", "block");
            dropdownEventID = "";
            return;
          }
          $("#current-bf-dataset").text(bfDataset);
          $("#current-bf-dataset-generate").text(bfDataset);
          $(".bf-dataset-span").html(bfDataset);
          confirm_click_function();

          defaultBfDataset = bfDataset;
          // document.getElementById("ds-description").innerHTML = "";
          refreshDatasetList();
          $("#dataset-loaded-message").hide();

          showHideDropdownButtons("dataset", "show");
          // checkPrevDivForConfirmButton("dataset");
        }
        if ($("#current-bf-dataset-generate").text() === "None") {
          showHideDropdownButtons("dataset", "hide");
        } else {
          showHideDropdownButtons("dataset", "show");
        }
        //currently changing it but not visually in the UI
        $("#bf_list_users_pi").val("Select PI");

        defaultBfDataset = bfDataset;

        // update the gloabl dataset id
        for (const item of datasetList) {
          let { name } = item;
          let { id } = item;
          if (name === bfDataset) {
            defaultBfDatasetId = id;
          }
        }

        // log a map of datasetId to dataset name to analytics
        // this will be used to help us track private datasets which are not trackable using a datasetId alone
        ipcRenderer.send(
          "track-event",
          "Dataset ID to Dataset Name Map",
          defaultBfDatasetId,
          defaultBfDataset
        );

        // document.getElementById("ds-description").innerHTML = "";
        refreshDatasetList();
        $("#dataset-loaded-message").hide();

        showHideDropdownButtons("dataset", "show");
        // checkPrevDivForConfirmButton("dataset");
      }

      // hide "Confirm" button if Current dataset set to None
      if ($("#current-bf-dataset-generate").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }

      // hide "Confirm" button if Current dataset under Getting started set to None
      if ($("#current-bf-dataset").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }
      $("body").removeClass("waiting");
      $(".svg-change-current-account.dataset").css("display", "block");
      $(".ui.active.green.inline.loader.small").css("display", "none");
      ipcRenderer.send(
        "track-event",
        "Success",
        "Selecting dataset",
        defaultBfDatasetId,
        1
      );
    }, 10);
  }
}

$("#select-permission-list-2").change((e) => {
  // updateDatasetList(defaultBfAccount);
  $("#div-filter-datasets-progress-2").css("display", "block");

  $("#bf-dataset-select-header").css("display", "none");
  $("#curatebfdatasetlist").selectpicker("hide");
  $("#curatebfdatasetlist").selectpicker("refresh");
  $(".selectpicker").selectpicker("hide");
  $(".selectpicker").selectpicker("refresh");
  $("#bf-dataset-select-div").hide();

  // var datasetPermission = $("#select-permission-list-2").val();
  var bfacct = $("#current-bf-account").text();

  if (bfacct === "None") {
    $("#para-filter-datasets-status-2").html(
      "<span style='color:red'>Please select a Pennsieve account first!</span>"
    );
    $(datasetPermissionDiv)
      .find("#div-filter-datasets-progress-2")
      .css("display", "none");

    //$("#bf-dataset-select-header").css("display", "block")
    $("#curatebfdatasetlist").selectpicker("show");
    $("#curatebfdatasetlist").selectpicker("refresh");
    $(".selectpicker").selectpicker("show");
    $(".selectpicker").selectpicker("refresh");
    $("#bf-dataset-select-div").show();
  } else {
    $("#curatebfdatasetlist").selectpicker("render");
    updateDatasetList(bfacct);
  }
});

function checkPrevDivForConfirmButton(category) {
  if (category === "account") {
    if (!$("#Question-generate-dataset-BF-account").hasClass("prev")) {
      $("#div-bf-account-btns").css("display", "flex");
      $("#div-bf-account-btns button").show();
    } else {
      $("#div-bf-account-btns").css("display", "none");
      $("#div-bf-account-btns button").hide();
    }
    if (!$("#Question-getting-started-BF-account").hasClass("prev")) {
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    } else {
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    }
  } else if (category === "dataset") {
    if (!$("#Question-generate-dataset-BF-dataset").hasClass("prev")) {
      $($("#button-confirm-bf-dataset").parent()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
    } else {
      $($("#button-confirm-bf-dataset").parent()[0]).css("display", "none");
      $("#button-confirm-bf-dataset").hide();
    }
    if (!$("#Question-getting-started-BF-dataset").hasClass("prev")) {
      $($("#button-confirm-bf-dataset-getting-started").parent()[0]).css(
        "display",
        "flex"
      );
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      $($("#button-confirm-bf-dataset-getting-started").parent()[0]).css(
        "display",
        "none"
      );
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  }
}

const updateDatasetList = (bfaccount) => {
  var filteredDatasets = [];

  $("#div-filter-datasets-progress-2").css("display", "none");

  removeOptions(curateDatasetDropdown);
  addOption(curateDatasetDropdown, "Search here...", "Select dataset");

  initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

  $("#bf-dataset-select-header").css("display", "none");
  $("#curatebfdatasetlist").selectpicker("hide");
  $("#curatebfdatasetlist").selectpicker("refresh");
  $(".selectpicker").selectpicker("hide");
  $(".selectpicker").selectpicker("refresh");
  $("#bf-dataset-select-div").hide();

  // waiting for dataset list to load first before initiating BF dataset dropdown list
  setTimeout(() => {
    var myPermission = $(datasetPermissionDiv)
      .find("#select-permission-list-2")
      .val();

    if (!myPermission) {
      myPermission = "All";
    }

    if (myPermission.toLowerCase() === "all") {
      for (var i = 0; i < datasetList.length; i++) {
        filteredDatasets.push(datasetList[i].name);
      }
    } else {
      for (var i = 0; i < datasetList.length; i++) {
        if (datasetList[i].role === myPermission.toLowerCase()) {
          filteredDatasets.push(datasetList[i].name);
        }
      }
    }

    filteredDatasets.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
    $("#curatebfdatasetlist").find("option:not(:first)").remove();

    for (myitem in filteredDatasets) {
      var myitemselect = filteredDatasets[myitem];
      var option = document.createElement("option");
      option.textContent = myitemselect;
      option.value = myitemselect;
      curateDatasetDropdown.appendChild(option);
    }

    initializeBootstrapSelect("#curatebfdatasetlist", "show");

    // !!!!
    // if (document.getElementById("div-permission-list-2")) {
    //   document.getElementById("div-permission-list-2").style.display = "block";
    // }

    $("#div-filter-datasets-progress-2").css("display", "none");
    //$("#bf-dataset-select-header").css("display", "block")
    $("#curatebfdatasetlist").selectpicker("show");
    $("#curatebfdatasetlist").selectpicker("refresh");
    $(".selectpicker").selectpicker("show");
    $(".selectpicker").selectpicker("refresh");
    $("#bf-dataset-select-div").show();

    if (document.getElementById("div-permission-list-2")) {
      document.getElementById("para-filter-datasets-status-2").innerHTML =
        filteredDatasets.length +
        " dataset(s) where you have " +
        myPermission.toLowerCase() +
        " permissions were loaded successfully below.";
    }
  }, 100);
};

/// helper function to refresh live search dropdowns per dataset permission on change event
const initializeBootstrapSelect = (dropdown, action) => {
  if (action === "disabled") {
    $(dropdown).attr("disabled", true);
    $(".dropdown.bootstrap-select button").addClass("disabled");
    $(".dropdown.bootstrap-select").addClass("disabled");
    $(dropdown).selectpicker("refresh");
  } else if (action === "show") {
    $(dropdown).selectpicker();
    $(dropdown).selectpicker("refresh");
    $(dropdown).attr("disabled", false);
    $(".dropdown.bootstrap-select button").removeClass("disabled");
    $(".dropdown.bootstrap-select").removeClass("disabled");
  }
};

// function to show dataset or account Confirm buttons
const showHideDropdownButtons = (category, action) => {
  if (category === "dataset") {
    if (action === "show") {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
        "display",
        "flex"
      );
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset").hide();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css(
        "display",
        "none"
      );
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  } else if (category === "account") {
    if (action === "show") {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "flex");
      $("#div-bf-account-btns button").show();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    } else {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "none");
      $("#div-bf-account-btns button").hide();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    }
  }
};

function create_child_node(
  oldFormatNode,
  nodeName,
  type,
  ext,
  openedState,
  selectedState,
  disabledState,
  selectedOriginalLocation,
  viewOptions
) {
  /*
  oldFormatNode: node in the format under "dataset-structure" key in SODA object
  nodeName: text to show for each node (name)
  type: "folder" or "file"
  ext: track ext of files to match with the right CSS icons
  openedState, selectedState: states of a jstree node
  selectedOriginalLocation: current folder of selected items
  viewOptions: preview or moveItems
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
  if (viewOptions !== "moveItems") {
    selectedOriginalLocation = "";
  }
  if (oldFormatNode) {
    for (const [key, value] of Object.entries(oldFormatNode["folders"])) {
      if ("action" in oldFormatNode["folders"][key]) {
        if (!oldFormatNode["folders"][key]["action"].includes("deleted")) {
          if (key === selectedOriginalLocation) {
            newFormatNode.state.selected = true;
            newFormatNode.state.opened = true;
            var new_node = create_child_node(
              value,
              key,
              "folder",
              "",
              true,
              true,
              true,
              selectedOriginalLocation,
              viewOptions
            );
          } else {
            // newFormatNode.state.selected = false;
            // newFormatNode.state.opened = false;
            var new_node = create_child_node(
              value,
              key,
              "folder",
              "",
              false,
              false,
              false,
              selectedOriginalLocation,
              viewOptions
            );
          }
          newFormatNode["children"].push(new_node);
          newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
        }
      } else {
        if (key === selectedOriginalLocation) {
          newFormatNode.state.selected = true;
          newFormatNode.state.opened = true;
          var new_node = create_child_node(
            value,
            key,
            "folder",
            "",
            true,
            true,
            true,
            selectedOriginalLocation,
            viewOptions
          );
        } else {
          // newFormatNode.state.selected = false;
          // newFormatNode.state.opened = false;
          var new_node = create_child_node(
            value,
            key,
            "folder",
            "",
            false,
            false,
            false,
            selectedOriginalLocation,
            viewOptions
          );
        }
        newFormatNode["children"].push(new_node);
        newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
      }
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
            if ("action" in oldFormatNode["files"][key]) {
              if (!oldFormatNode["files"][key]["action"].includes("deleted")) {
                var new_node = {
                  text: key,
                  state: { disabled: true },
                  type: nodeType,
                };
                newFormatNode["children"].push(new_node);
                newFormatNode["children"].sort((a, b) =>
                  a.text > b.text ? 1 : -1
                );
              }
            } else {
              var new_node = {
                text: key,
                state: { disabled: true },
                type: nodeType,
              };
              newFormatNode["children"].push(new_node);
              newFormatNode["children"].sort((a, b) =>
                a.text > b.text ? 1 : -1
              );
            }
          }
        }
      }
    }
  }
  return newFormatNode;
}

function recursiveExpandNodes(object) {
  // var newFormatNode = {"text": nodeName,
  // "state": {"opened": openedState, "selected": selectedState},
  // "children": [], "type": type + ext}
  if (object.state.selected) {
  }
}

// var selected = false;
var selectedPath;
var selectedNode;
var jsTreeData = create_child_node(
  {
    folders: {},
    files: {},
    type: "",
  },
  "My_dataset_folder",
  "folder",
  "",
  true,
  true,
  true,
  "",
  "moveItems"
);
var jstreeInstance = document.getElementById("data");
$(document).ready(function () {
  $("#data").jstree({
    core: {
      check_callback: true,
      data: {},
      expand_selected_onload: true,
    },
    plugins: ["types", "changed"],
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
      "file jpg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });
});

async function moveItems(ev, category) {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  var selectedOriginalLocation = filtered[filtered.length - 1];
  var selectedItem = ev.parentElement.innerText;
  /*
  Reset previously selected items first, create jsTreeData again with updated dataset structure JSON object.
  Always remember to exclude/delete:
      1. metadata files added for preview show
      2. added manifest files for show (for preview) before showing the tree here
  */
  if ("files" in datasetStructureJSONObj) {
    datasetStructureJSONObj["files"] = {};
  }
  for (var highLevelFol in datasetStructureJSONObj["folders"]) {
    if (
      "manifest.xlsx" in
        datasetStructureJSONObj["folders"][highLevelFol]["files"] &&
      datasetStructureJSONObj["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ]["forTreeview"] === true
    ) {
      delete datasetStructureJSONObj["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
  jsTreeData = create_child_node(
    datasetStructureJSONObj,
    "My_dataset_folder",
    "folder",
    "",
    true,
    true,
    true,
    selectedOriginalLocation,
    "moveItems"
  );
  // Note: somehow, html element "#data" was destroyed after closing the Swal popup.
  // Creating the element again after it was destroyed.
  if (!jstreeInstance) {
    $("#items").prepend('<div id="data"></div>');
    jstreeInstance = document.getElementById("data");
  } else {
    jstreeInstance.style.display = "block";
  }
  $(jstreeInstance).jstree(true).settings.core.data = jsTreeData;
  $(jstreeInstance).jstree(true).refresh();
  selectedPath = undefined;
  selectedNode = "";

  // first, convert datasetStructureJSONObj to jsTree's json structure
  // show swal2 with jstree in here
  const { value: folderDestination } = await Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    focusCancel: true,
    focusConfirm: false,
    heightAuto: false,
    html: jstreeInstance,
    reverseButtons: reverseSwalButtons,
    showCancelButton: true,
    showCloseButton: true,
    title:
      "<h3 style='margin-bottom:20px !important'>Please choose a folder destination:</h3>",
    customClass: { content: "swal-left-align" },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate_fastest",
    },
    preConfirm: () => {
      Swal.resetValidationMessage();
      if (!selectedPath) {
        Swal.showValidationMessage("Please select a folder destination!");
        return undefined;
      } else {
        if (selectedNode === "My_dataset_folder") {
          Swal.showValidationMessage(
            "Items cannot be moved to this level of the dataset!"
          );
          return undefined;
        } else if (selectedNode === selectedItem) {
          Swal.showValidationMessage("Items cannot be moved into themselves!");
          return undefined;
        } else {
          return selectedPath;
        }
      }
    },
  });
  if (folderDestination) {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      focusCancel: true,
      heightAuto: false,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      title: `Are you sure you want to move selected item(s) to: ${selectedPath}?`,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      let numberItems = $("div.single-item.selected-item").toArray().length;
      let timer = 2000;
      if (numberItems > 10) {
        timer = 7000;
      }
      if (result.isConfirmed) {
        // loading effect
        Swal.fire({
          allowEscapeKey: false,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          timerProgressBar: false,
          timer: timer,
          title: "Moving items...",
          didOpen: () => {
            Swal.showLoading();
          },
        }).then(() => {
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "success",
            text: "Successfully moved items!",
            didOpen: () => {
              Swal.hideLoading();
            },
          });
        });
        // action to move and delete here
        // multiple files/folders
        if ($("div.single-item.selected-item").toArray().length > 1) {
          $("div.single-item.selected-item")
            .toArray()
            .forEach((element) => {
              let itemToMove = element.textContent;
              var itemType;
              if ($(element.firstElementChild).hasClass("myFile")) {
                itemType = "files";
              } else if ($(element.firstElementChild).hasClass("myFol")) {
                itemType = "folders";
              }
              moveItemsHelper(itemToMove, selectedPath, itemType);
              ev.parentElement.remove();
            });
          // only 1 file/folder
        } else {
          let itemToMove = ev.parentElement.textContent;
          var itemType;
          if ($(ev).hasClass("myFile")) {
            itemType = "files";
          } else if ($(ev).hasClass("myFol")) {
            itemType = "folders";
          }
          moveItemsHelper(itemToMove, selectedPath, itemType);
          ev.parentElement.remove();
        }
        document.getElementById("input-global-path").value =
          "My_dataset_folder/";
        listItems(datasetStructureJSONObj, "#items", 500, (reset = true));
        organizeLandingUIEffect();
        // reconstruct div with new elements
        getInFolder(
          ".single-item",
          "#items",
          organizeDSglobalPath,
          datasetStructureJSONObj
        );
      }
    });
  }
}

function moveItemsHelper(item, destination, category) {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  var selectedNodeList = destination.split("/").slice(1);
  var destinationPath = getRecursivePath(
    selectedNodeList,
    datasetStructureJSONObj
  );

  // handle duplicates in destination folder
  if (category === "files") {
    var uiFiles = {};
    if (JSON.stringify(destinationPath["files"]) !== "{}") {
      for (var file in destinationPath["files"]) {
        uiFiles[path.parse(file).base] = 1;
      }
    }
    var fileBaseName = path.basename(item);
    var originalFileNameWithoutExt = path.parse(fileBaseName).name;
    var fileNameWithoutExt = originalFileNameWithoutExt;
    var j = 1;

    while (fileBaseName in uiFiles) {
      fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
      fileBaseName = fileNameWithoutExt + path.parse(fileBaseName).ext;
      j++;
    }
    if ("action" in myPath[category][item]) {
      if (!myPath[category][item]["action"].includes("moved")) {
        myPath[category][item]["action"].push("moved");
      }
      if (fileBaseName !== path.basename(item)) {
        myPath[category][item]["action"].push("renamed");
      }
    } else {
      myPath[category][item]["action"] = ["moved"];
      if (fileBaseName !== path.basename(item)) {
        myPath[category][item]["action"].push("renamed");
      }
    }
    destinationPath[category][fileBaseName] = myPath[category][item];
  } else if (category === "folders") {
    var uiFolders = {};
    if (JSON.stringify(destinationPath["folders"]) !== "{}") {
      for (var folder in destinationPath["folders"]) {
        uiFolders[folder] = 1;
      }
    }
    var originalFolderName = path.basename(item);
    var renamedFolderName = originalFolderName;
    var j = 1;
    while (renamedFolderName in uiFolders) {
      renamedFolderName = `${originalFolderName} (${j})`;
      j++;
    }
    if ("action" in myPath[category][item]) {
      myPath[category][item]["action"].push("moved");
      addMovedRecursively(myPath[category][item]);
      if (renamedFolderName !== originalFolderName) {
        myPath[category][item]["action"].push("renamed");
      }
    } else {
      myPath[category][item]["action"] = ["moved"];
      addMovedRecursively(myPath[category][item]);
      if (renamedFolderName !== originalFolderName) {
        myPath[category][item]["action"].push("renamed");
      }
    }
    destinationPath[category][renamedFolderName] = myPath[category][item];
  }
  //delete item from the original location
  delete myPath[category][item];
  listItems(myPath, "#items");
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );

  // log moving multiple files/folders successfully
  logCurationForAnalytics(
    "Success",
    PrepareDatasetsAnalyticsPrefix.CURATE,
    AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
    ["Step 3", "Move", category === "files" ? "File" : "Folder"],
    determineDatasetLocation()
  );
}

// helper functions to add "moved" to leaf nodes a.k.a files
function addMovedRecursively(object) {
  Object.keys(object["files"]).forEach((key) => {
    var file = object["files"][key];
    if ("action" in file) {
      if (!file["action"].includes("moved")) {
        file["action"].push("moved");
      }
    } else {
      file["action"] = ["moved"];
    }
  });
  Object.keys(object["folders"]).forEach((key) => {
    var folder = object["folders"][key];
    if ("action" in folder) {
      folder["action"].push("moved");
    } else {
      folder["action"] = ["moved"];
    }
    if (Object.keys(folder["files"]).length > 0) {
      Object.keys(folder["files"]).forEach((ele) => {
        if ("action" in folder["files"][ele]) {
          if (!folder["files"][ele]["action"].includes("moved")) {
            folder["files"][ele]["action"].push("moved");
          }
        } else {
          folder["files"][ele]["action"] = ["moved"];
        }
      });
    }
    if (Object.keys(folder["folders"]).length > 0) {
      addMovedRecursively(folder);
    }
  });
}

$(jstreeInstance).on("changed.jstree", function (e, data) {
  if (data.node) {
    selectedNode = data.node.text;
    selectedPath = data.instance.get_path(data.node, "/");
    var parentNode = $(jstreeInstance).jstree("get_selected");
  }
});

$(jstreeInstance).on("open_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder open");
});

$(jstreeInstance).on("close_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder closed");
});

$(document).ready(function () {
  $(jstreePreview).jstree({
    core: {
      check_callback: true,
      data: {},
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
});

$(jstreePreview).on("open_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder open");
});

$(jstreePreview).on("close_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder closed");
});

function showTreeViewPreview(
  disabledBoolean,
  selectedBoolean,
  manifestFileBoolean,
  new_dataset_name,
  previewDiv,
  datasetStructure
) {
  if (manifestFileBoolean) {
    if (manifestFileCheck.checked) {
      addManifestFilesForTreeView();
    } else {
      revertManifestForTreeView();
    }
  }

  var jsTreePreviewDataManifest = create_child_node(
    datasetStructure,
    new_dataset_name,
    "folder",
    "",
    true,
    selectedBoolean,
    disabledBoolean,
    "",
    "preview"
  );
  $(previewDiv).jstree(true).settings.core.data = jsTreePreviewDataManifest;
  $(previewDiv).jstree(true).refresh();
}

// if checked
function addManifestFilesForTreeView() {
  for (var key in datasetStructureJSONObj["folders"]) {
    if (highLevelFolders.includes(key)) {
      var fileKey = datasetStructureJSONObj["folders"][key]["files"];
      if (!("manifest.xlsx" in fileKey)) {
        fileKey["manifest.xlsx"] = {
          forTreeview: true,
        };
      }
    }
  }
}

// if unchecked
function revertManifestForTreeView() {
  for (var key in datasetStructureJSONObj["folders"]) {
    if (highLevelFolders.includes(key)) {
      var fileKey = datasetStructureJSONObj["folders"][key]["files"];
      if (
        "manifest.xlsx" in fileKey &&
        fileKey["manifest.xlsx"]["forTreeview"] === true
      ) {
        delete fileKey["manifest.xlsx"];
      }
    }
  }
}

$("#generate-manifest-curate").change(function () {
  if (this.checked) {
    $("#button-generate-manifest-locally").show();
  } else {
    $("#button-generate-manifest-locally").hide();
  }
});

function determineDatasetDestination(dataset_name, dataset_destination) {
  // determine if the dataset is being uploaded to Pennsieve or being generated locally
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

  return [dataset_name, dataset_destination];
}

// module.exports = {determineDatasetDestination}
