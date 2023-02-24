const checkDiskSpace = require("check-disk-space").default;

var metadataFile = "";
var jstreePreview = document.getElementById("div-dataset-tree-preview");
const nonAllowedCharacters = '<>_:",;[]{}^`~@/|?*$=!%&+#\\';

// per change event of current dataset span text
// const confirm_click_function = () => {
//   let temp = $(".bf-dataset-span").html();
//   if ($(".bf-dataset-span").html() == "None" || $(".bf-dataset-span").html() == "") {
//     $($(this).parents().find(".field").find(".div-confirm-button")).css("display", "none");
//     $("#para-review-dataset-info-disseminate").text("None");
//   } else {
//     $($(this).parents().find(".field").find(".div-confirm-button")).css("display", "flex");
//     if ($($(this).parents().find(".field").find(".synced-progress")).length) {
//       if ($($(this).parents().find(".field").find(".synced-progress")).css("display") === "none") {
//         $(".confirm-button").click();
//       }
//     } else {
//       $(".confirm-button").click();
//     }
//   }
// };

// Event listeners for opening the dropdown prompt
document
  .querySelector("#Question-getting-started-BF-account .change-current-account")
  .addEventListener("click", function () {
    openDropdownPrompt(this, "bf");
  });

document
  .querySelector("#Question-getting-started-BF-dataset .change-current-account")
  .addEventListener("click", function () {
    openDropdownPrompt(this, "dataset", false);
  });

document
  .querySelector("#Question-generate-dataset-BF-dataset .change-current-account")
  .addEventListener("click", function () {
    openDropdownPrompt(this, "dataset", false);
  });

document
  .querySelector("#Question-generate-dataset-BF-account .change-current-account")
  .addEventListener("click", function () {
    openDropdownPrompt(this, "bf");
  });

// document
//   .querySelector("#svg-change-current-account-generate-dropdown")
//   .addEventListener("click", function () {
//     openDropdownPrompt(this, "bf");
//   });

// document
//   .querySelector("#change-current-account-new-ds-name")
//   .addEventListener("click", function () {
//     openDropdownPrompt(this, "dataset");
//   });

$(".button-individual-metadata.remove").click(function () {
  var metadataFileStatus = $($(this).parents()[1]).find(".para-metadata-file-status");

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
  var metadataFileStatus = $($(ev).parents()[1]).find(".para-metadata-file-status");

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
  var metadataFileStatus = $($(this).parents()[1]).find(".para-metadata-file-status");
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
  var metadataFileStatus = $($(this).parents()[1]).find(".para-metadata-file-status");
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
  code_parameters: [".xlsx", ".csv", ".tsv", ".json"],
  data_deliverable: [".docx", ".doc"],
  bannerImage: [".png", ".PNG", ".jpeg", ".JPEG", ".tiff"],
};

const dropHandler = async (
  ev,
  paraElement,
  metadataFile,
  curationMode,
  dataDeliverables = false
) => {
  let gettingStartedSection = false;
  if (curationMode === "guided-getting-started") {
    curationMode = "guided";
    gettingStartedSection = true;
  }
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
      if (ev.dataTransfer.items[0].type.includes("image")) {
        //handle dropped images for banner images
        let path = [file.path];
        handleSelectedBannerImage(path, "guided-mode");
        $("#guided-banner-image-modal").modal("show");
      }
      if (dataDeliverables === true) {
        let filepath = file.path;
        var award = $("#submission-sparc-award");
        log.info(`Importing Data Deliverables document: ${filepath}`);
        try {
          let extract_milestone = await client.get(`/prepare_metadata/import_milestone`, {
            params: {
              path: filepath,
            },
          });
          let res = extract_milestone.data;
          milestoneObj = res;

          //Handle free-form mode submission data
          if (curationMode === "free-form") {
            createMetadataDir();
            var informationJson = {};
            informationJson = parseJson(milestonePath);
            informationJson[award] = milestoneObj;
            fs.writeFileSync(milestonePath, JSON.stringify(informationJson));
            Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              timer: 3000,
              timerProgressBar: true,
              icon: "success",
              text: `Successfully loaded your DataDeliverables.docx document`,
            });
            removeOptions(descriptionDateInput);
            milestoneTagify1.removeAllTags();
            milestoneTagify1.settings.whitelist = [];
            changeAwardInput();
          }

          //Handle guided mode submission data
          if (curationMode === "guided") {
            const guidedMilestoneData = res;
            //create a string with today's date in the format xxxx/xx/xx
            const today = new Date();
            const todayString = `
                  ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}
                `;
            //add a custom milestone row for when the user wants to add a custom milestone
            //not included in the dataset deliverables document
            guidedMilestoneData["Not included in the Dataset Deliverables document"] = [
              {
                "Description of data":
                  "Select this option when the dataset you are submitting is not related to a pre-agreed milestone",
                "Expected date of completion": "N/A",
              },
            ];

            //save the unselected milestones into sodaJSONObj
            sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-imported-milestones"] =
              guidedMilestoneData;

            sodaJSONObj["dataset-metadata"]["submission-metadata"]["filepath"] = filepath;

            renderMilestoneSelectionTable(guidedMilestoneData);

            guidedSubmissionTagsTagify.settings.whitelist = [];

            unHideAndSmoothScrollToElement("guided-div-data-deliverables-import");

            let dragDropContainer = document.getElementById(paraElement).parentElement;

            let lottieContainer = dragDropContainer.querySelector(
              ".code-metadata-lottie-container"
            );
            lottieContainer.innerHTML = "";
            lottie.loadAnimation({
              container: lottieContainer,
              animationData: successCheck,
              renderer: "svg",
              loop: true,
              autoplay: true,
            });
          }
        } catch (error) {
          clientError(error);
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "error",
            text: userErrorMessage(error),
          });
        }
      } else {
        //data deliverables is true for the name to be however it needs to be, just check extension is doc or docx
        if (metadataWithoutExtension === metadataFile) {
          if (metadataFileExtensionObject[metadataFile].includes(extension)) {
            document.getElementById(paraElement).innerHTML = file.path;
            if (curationMode === "free-form") {
              $($("#" + paraElement).parents()[1])
                .find(".div-metadata-confirm")
                .css("display", "flex");
              $($("#" + paraElement).parents()[1])
                .find(".div-metadata-go-back")
                .css("display", "none");
            }
            if (curationMode === "guided") {
              //Add success check mark lottie animation inside metadata card
              const dragDropContainer = document.getElementById(paraElement).parentElement;
              //get the value of data-code-metadata-file-type from dragDropContainer
              const metadataFileType = dragDropContainer.dataset.codeMetadataFileType;
              //save the path of the metadata file to the json object
              sodaJSONObj["dataset-metadata"]["code-metadata"][metadataFileType] = file.path;
              const lottieContainer = dragDropContainer.querySelector(
                ".code-metadata-lottie-container"
              );
              lottieContainer.innerHTML = "";
              lottie.loadAnimation({
                container: lottieContainer,
                animationData: successCheck,
                renderer: "svg",
                loop: false,
                autoplay: true,
              });
            }
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
      }
    } else {
      document.getElementById(paraElement).innerHTML =
        "<span style='color:red'>Please only drag and drop a file!</span>";
    }
  }
};

const checkAvailableSpace = () => {
  const roundToHundredth = (value) => {
    return Number(parseFloat(value.toFixed(2)));
  };
  let location = document
    .getElementById("input-destination-generate-dataset-locally")
    .getAttribute("placeholder");

  checkDiskSpace(location).then(async (diskSpace) => {
    log.info(`Checking available disk space for ${location}`);
    let freeMemory = diskSpace.free; //returns in bytes
    let freeMemoryMB = roundToHundredth(freeMemory / 1024 ** 2);

    let datasetSizeResponse;
    try {
      datasetSizeResponse = await client.post(
        "/curate_datasets/dataset_size",
        {
          soda_json_structure: sodaJSONObj,
        },
        { timeout: 0 }
      );

      let tempFolderSize = datasetSizeResponse.data.dataset_size;
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
        document.getElementById("input-destination-generate-dataset-locally").placeholder =
          "Browse here";

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
    } catch (error) {
      clientError(error);
    }
  });
};
const btnConfirmLocalDatasetGeneration = document.getElementById("btn-confirm-local-destination");
btnConfirmLocalDatasetGeneration.addEventListener("click", checkAvailableSpace, false);

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
  if ("folders" in dataset_folder && Object.keys(dataset_folder["folders"]).length !== 0) {
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

const importGenerateDatasetStep = async (object) => {
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
      $("#input-destination-generate-dataset-locally").val(sodaJSONObj["generate-dataset"]["path"]);
      $("#btn-confirm-local-destination").click();
      $("#inputNewNameDataset").val(sodaJSONObj["generate-dataset"]["dataset-name"]);
      $("#btn-confirm-new-dataset-name").click();
    } else if (sodaJSONObj["generate-dataset"]["destination"] === "bf") {
      $("#generate-upload-BF").prop("checked", true);
      $($("#generate-upload-BF").parents()[2]).click();
      // Step 2: if generate on bf, choose bf account
      if (
        "bf-account-selected" in sodaJSONObj &&
        sodaJSONObj["bf-account-selected"]["account-name"] !== ""
      ) {
        var bfAccountSelected = sodaJSONObj["bf-account-selected"]["account-name"];
        if (bfAccountSelected != defaultBfAccount) {
          return;
        }
        $("#current-bf-account-generate").text(bfAccountSelected);
        $("#para-account-detail-curate").html("");

        try {
          log.info(`Loading account details for ${bfAccountSelected}`);
          let dataset_request = await client.get(`/manage_datasets/bf_account_details`, {
            params: {
              selected_account: bfAccountSelected,
            },
          });
          $("#para-account-detail-curate").html(dataset_request.data.account_details);
          updateBfAccountList();
        } catch (error) {
          clientError(error);
          showHideDropdownButtons("account", "hide");
        }

        $("#btn-bf-account").trigger("click");
        // Step 3: choose to generate on an existing or new dataset
        if (
          "bf-dataset-selected" in sodaJSONObj &&
          sodaJSONObj["bf-dataset-selected"]["dataset-name"] !== ""
        ) {
          $("#generate-BF-dataset-options-existing").prop("checked", true);
          $($("#generate-BF-dataset-options-existing").parents()[2]).click();
          var bfDatasetSelected = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
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
              var existingFolderOption = sodaJSONObj["generate-dataset"]["if-existing"];
              $("#existing-folders-" + existingFolderOption).prop("checked", true);
              $($("#existing-folders-" + existingFolderOption).parents()[2]).click();
            }
            if ("if-existing-files" in sodaJSONObj["generate-dataset"]) {
              var existingFileOption = sodaJSONObj["generate-dataset"]["if-existing-files"];
              $("#existing-files-" + existingFileOption).prop("checked", true);
              $($("#existing-files-" + existingFileOption).parents()[2]).click();
            }
          }, 3000);
        } else {
          $("#generate-BF-dataset-options-new").prop("checked", true);
          $($("#generate-BF-dataset-options-new").parents()[2]).click();
          $("#inputNewNameDataset").val(sodaJSONObj["generate-dataset"]["dataset-name"]);
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
        $($($("#div-getting-started-previous-progress").parents()[0]).siblings()[0]).children()[0]
      ).toggleClass("non-selected");
    } else {
      exitCurate();
    }
  }
};

// check metadata files
const populateMetadataProgress = (populateBoolean, metadataFileName, localPath) => {
  var metadataButtonsArray = $(".metadata-button.button-generate-dataset");
  var correspondingMetadataParaElement = {
    submission: ["para-submission-file-path", metadataButtonsArray[0]],
    dataset_description: ["para-ds-description-file-path", metadataButtonsArray[1]],
    subjects: ["para-subjects-file-path", metadataButtonsArray[2]],
    samples: ["para-samples-file-path", metadataButtonsArray[3]],
    README: ["para-readme-file-path", metadataButtonsArray[4]],
    CHANGES: ["para-changes-file-path", metadataButtonsArray[5]],
    code_description: ["para-readme-file-path", metadataButtonsArray[6]],
    code_parameters: ["para-codeParamMetadata-file-path", metadataButtonsArray[7]],
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
};

//////////////////////// Main Import progress function
let missing_dataset_files = [];
let missing_metadata_files = [];
const loadProgressFile = (ev) => {
  let return_option = "";
  missing_dataset_files = [];
  missing_metadata_files = [];

  if ($(ev).val() === "Select") {
    return;
  }

  var jsonContent = progressFileParse(ev);

  $("#para-progress-file-status").html("");
  // $("#nextBtn").prop("disabled", true);

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
        document.getElementById("div-progress-file-loader").style.display = "none";
        $("body").removeClass("waiting");
        let nextBtn = document.getElementById("nextBtn");
        if (nextBtn.disabled) {
          nextBtn.removeAttribute("disabled");
        }
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
    }, 1000);
  } else {
    sodaJSONObj = '{"starting-point":"new","dataset-structure":{},"metadata-files":{}}';
    setTimeout(() => {
      importManifest(sodaJSONObj);
      importMetadataFilesProgress(sodaJSONObj);
      importDatasetStructure(sodaJSONObj);
      importGenerateDatasetStep(sodaJSONObj);
      if (missing_dataset_files.length > 0 || missing_metadata_files > 0) {
        return_option = verify_missing_files("new");
      } else {
        document.getElementById("div-progress-file-loader").style.display = "none";
        $("body").removeClass("waiting");
        document.getElementById("para-progress-file-status").innerHTML = "";
      }
    }, 500);
  }
};

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
      document.getElementById("swal2-title").parentNode.parentNode.style.width = "600px";
      document.getElementById("swal2-content").style.overflowY = "scroll";
      document.getElementById("swal2-content").style.height = "400px";
      document.getElementById("swal2-title").parentNode.parentNode.children[1].style.whiteSpace =
        "nowrap";
      // document.getElementById("swal2-content").style.
    },
  }).then((result) => {
    if (result.isConfirmed) {
      remove_missing_files();
      if (mode === "pre-existing") {
        document.getElementById("div-progress-file-loader").style.display = "none";
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
        document.getElementById("div-progress-file-loader").style.display = "none";
        $("body").removeClass("waiting");
        document.getElementById("para-progress-file-status").innerHTML = "";
      }
    } else {
      document.getElementById("div-progress-file-loader").style.display = "none";
      $("body").removeClass("waiting");
      document.getElementById("para-progress-file-status").innerHTML = "";
    }
  });
};

const remove_missing_files = () => {
  if (missing_metadata_files.length > 0) {
    for (let item_path in missing_metadata_files) {
      for (let item in sodaJSONObj["metadata-files"]) {
        if (sodaJSONObj["metadata-files"][item]["path"] == missing_metadata_files[item_path]) {
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
  if ("folders" in dataset_folder && Object.keys(dataset_folder["folders"]).length !== 0) {
    for (let folder in dataset_folder["folders"]) {
      recursive_remove_missing_file(item_path, dataset_folder["folders"][folder]);
    }
  }
};

// const removeOptions = (selectbox) => {
//   var i;
//   for (i = selectbox.options.length - 1; i >= 0; i--) {
//     selectbox.remove(i);
//   }
// };
//
// Function to add options to dropdown list
// const addOption = (selectbox, text, value) => {
//   var opt = document.createElement("OPTION");
//   opt.text = text;
//   opt.value = value;
//   selectbox.options.add(opt);
// };

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

$(document).ready(async function () {
  var accountDetails = $("#para-account-detail-curate");
  //Observe the paragraph
  this.observer = new MutationObserver(
    async function (mutations) {
      let datasets;
      try {
        datasets = await api.getDatasetsForAccount(defaultBfAccount);
      } catch (error) {
        clientError(error);
        return;
      }

      datasetList = [];
      datasetList = datasets;
      refreshDatasetList();
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

  $("#guided_bf_list_users_pi").selectpicker();
  $("#guided_bf_list_users_pi").selectpicker("refresh");
  $("#guided_bf_list_users_and_teams").selectpicker();
  $("#guided_bf_list_users_and_teams").selectpicker("refresh");
});

const get_api_key = (login, password, key_name) => {
  return new Promise(async (resolve) => {
    try {
      let bf_get_pennsieve_secret_key = await client.post(
        `/manage_datasets/pennsieve_api_key_secret`,
        {
          username: login,
          password: password,
          api_key: key_name,
        }
      );
      let res = bf_get_pennsieve_secret_key.data;
      resolve(res);
    } catch (error) {
      clientError(error);
      resolve(["failed", userErrorMessage(error)]);
    }
  });
};

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
    $(datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");

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

const checkPrevDivForConfirmButton = (category) => {
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
      $($("#button-confirm-bf-dataset-getting-started").parent()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      $($("#button-confirm-bf-dataset-getting-started").parent()[0]).css("display", "none");
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  }
};

const create_child_node = (
  oldFormatNode,
  nodeName,
  type,
  ext,
  openedState,
  selectedState,
  disabledState,
  selectedOriginalLocation,
  viewOptions
) => {
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
                newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
              }
            } else {
              var new_node = {
                text: key,
                state: { disabled: true },
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
};

// function recursiveExpandNodes(object) {
//   // var newFormatNode = {"text": nodeName,
//   // "state": {"opened": openedState, "selected": selectedState},
//   // "children": [], "type": type + ext}
//   if (object.state.selected) {
//   }
// }

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
    plugins: ["types", "changed", "sort"],
    sort: function (a, b) {
      a1 = this.get_node(a);
      b1 = this.get_node(b);

      if (a1.icon == b1.icon || (a1.icon.includes("assets") && b1.icon.includes("assets"))) {
        //if the word assets is included in the icon then we can assume it is a file
        //folder icons are under font awesome meanwhile files come from the assets folder
        return a1.text > b1.text ? 1 : -1;
      } else {
        return a1.icon < b1.icon ? 1 : -1;
      }
    },
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

const moveItems = async (ev, category) => {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  var selectedOriginalLocation = filtered[filtered.length - 1];
  var selectedItem = ev.parentElement.innerText;
  let item_name = ev.nextSibling.innerText;

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
      "manifest.xlsx" in datasetStructureJSONObj["folders"][highLevelFol]["files"] &&
      datasetStructureJSONObj["folders"][highLevelFol]["files"]["manifest.xlsx"]["forTreeview"] ===
        true
    ) {
      delete datasetStructureJSONObj["folders"][highLevelFol]["files"]["manifest.xlsx"];
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
    title: "<h3 style='margin-bottom:20px !important'>Please choose a folder destination:</h3>",
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
          Swal.showValidationMessage("Items cannot be moved to this level of the dataset!");
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
      let duplicateItems = [`<ul style="text-align: center;">`];
      // let duplicateBool = false;
      // duplicateItems[0] = `<ul style="text-align: start;">`;
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
          // action to move and delete here
          // multiple files/folders
          let split = selectedPath.split("/");
          let datasetCopy = datasetStructureJSONObj;
          if ($("div.single-item.selected-item").toArray().length > 1) {
            $("div.single-item.selected-item")
              .toArray()
              .forEach((element) => {
                datasetCopy = datasetStructureJSONObj;
                let itemToMove = element.textContent;
                var itemType;
                if ($(element.firstElementChild).hasClass("myFile")) {
                  itemType = "file";
                } else if ($(element.firstElementChild).hasClass("myFol")) {
                  itemType = "folder";
                }
                //do a check here
                //store duplicates into array and then skip
                //let user know which ones were duplicates

                for (let i = 1; i < split.length; i++) {
                  if (datasetCopy["folders"].hasOwnProperty(split[i])) {
                    datasetCopy = datasetCopy["folders"][split[i]];
                  }
                }
                if (itemType == "file") {
                  datasetCopy = datasetCopy["files"];
                } else {
                  datasetCopy = datasetCopy["folders"];
                }

                if (datasetCopy.hasOwnProperty(itemToMove)) {
                  if (itemType == "folder") {
                    itemToMove = itemToMove + "/";
                  }
                  duplicateItems.push(`<li style="font-size: large;">${itemToMove}</li>`);
                } else {
                  moveItemsHelper(itemToMove, selectedPath, itemType);
                  ev.parentElement.remove();
                }
              });
            duplicateItems.push(`</ul>`);

            if (duplicateItems.length > 2) {
              Swal.fire({
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                icon: "error",
                title: "The following are already in the folder destination!",
                html: `${duplicateItems.join("")}`,
                didOpen: () => {
                  Swal.hideLoading();
                },
              });
            }
            // only 1 file/folder
          } else {
            let itemToMove = ev.parentElement.textContent;
            var itemType;

            if ($(ev).hasClass("myFile")) {
              itemType = "file";
            } else if ($(ev).hasClass("myFol")) {
              itemType = "folder";
            }

            for (let i = 1; i < split.length; i++) {
              if (split[i] in datasetCopy["folders"]) {
                datasetCopy = datasetCopy["folders"][split[i]];
              }
            }

            if (itemType == "file") {
              datasetCopy = datasetCopy["files"];
            } else {
              datasetCopy = datasetCopy["folders"];
            }
            if (datasetCopy.hasOwnProperty(itemToMove)) {
              Swal.fire({
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                icon: "error",
                title: `The ${itemType} is already in the folder destination!`,
                html: `<ul style="text-align: center;"><li>${itemToMove}</li></ul>`,
                didOpen: () => {
                  Swal.hideLoading();
                },
              });
            } else {
              // return selectedPath;
              moveItemsHelper(itemToMove, selectedPath, itemType);
              ev.parentElement.remove();
              Swal.fire({
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                icon: "success",
                text: "Successfully moved items!",
                didOpen: () => {
                  Swal.hideLoading();
                },
              });
            }
          }
          let pathAsArray = selectedPath.split("/");
          listItems(datasetStructureJSONObj, "#items", 500);
          organizeLandingUIEffect();
          // reconstruct div with new elements
          getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);

          // if moved into an empty folder we need to remove the class 'empty'
          // from the folder destination
          let folderDestinationName = pathAsArray[pathAsArray.length - 1];
          if (Object.keys(myPath?.["folders"]?.[folderDestinationName]).length > 0) {
            //check if element has empty class
            let listedItems = document.getElementsByClassName("folder_desc");
            for (let i = 0; i < listedItems.length; i++) {
              if (listedItems[i].innerText === folderDestinationName) {
                listedItems[i].parentElement.children[0].classList.remove("empty");
              }
            }
          }
        });
      }
    });
  }
};

function moveItemsHelper(item, destination, category) {
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  var selectedNodeList = destination.split("/").slice(1);
  var destinationPath = getRecursivePath(selectedNodeList, datasetStructureJSONObj);

  // handle duplicates in destination folder
  if (category === "file") {
    category = "files";
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
  } else if (category === "folder") {
    category = "folders";
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
  getInFolder(".single-item", "#items", organizeDSglobalPath, datasetStructureJSONObj);

  // log moving multiple files/folders successfully
  logCurationForAnalytics(
    "Success",
    PrepareDatasetsAnalyticsPrefix.CURATE,
    AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
    ["Step 3", "Move", category === "files" ? "File" : "Folder"],
    determineDatasetLocation()
  );
}

const updateManifestLabelColor = (el) => {
  document.getElementById("label-manifest").style.color = el.checked
    ? "var(--color-light-green)"
    : "#303030";
  document.getElementById("label-manifest").style.fontWeight = el.checked ? "bold" : "normal";
};

// helper functions to add "moved" to leaf nodes a.k.a files
const addMovedRecursively = (object) => {
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
};

$(document).ready(function () {
  $(".button-display-details").click(function () {
    $(this).parent().toggleClass("show");
  });
  $(".button-generate-dataset i").bind("click", function () {
    $($(this).parents()[0]).click();
  });
});

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
    plugins: ["types", "sort"],
    sort: function (a, b) {
      a1 = this.get_node(a);
      b1 = this.get_node(b);

      if (a1.icon == b1.icon || (a1.icon.includes("assets") && b1.icon.includes("assets"))) {
        //if the word assets is included in the icon then we can assume it is a file
        //folder icons are under font awesome meanwhile files come from the assets folder
        return a1.text > b1.text ? 1 : -1;
      } else {
        return a1.icon < b1.icon ? 1 : -1;
      }
    },
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

const showTreeViewPreview = (
  disabledBoolean,
  selectedBoolean,
  manifestFileBoolean,
  new_dataset_name,
  previewDiv,
  datasetStructure
) => {
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
};

// if checked
const addManifestFilesForTreeView = () => {
  for (var key in datasetStructureJSONObj["folders"]) {
    if (highLevelFolders.includes(key)) {
      var fileKey = datasetStructureJSONObj["folders"][key]["files"];
      let folderAmount = Object.keys(datasetStructureJSONObj["folders"][key]["folders"]).length;
      let fileAmount = Object.keys(datasetStructureJSONObj["folders"][key]["files"]).length;
      if (!("manifest.xlsx" in fileKey) && (folderAmount > 0 || fileAmount > 0)) {
        fileKey["manifest.xlsx"] = {
          forTreeview: true,
        };
      }
    }
  }
};

// if unchecked
const revertManifestForTreeView = () => {
  for (var key in datasetStructureJSONObj["folders"]) {
    if (highLevelFolders.includes(key)) {
      var fileKey = datasetStructureJSONObj["folders"][key]["files"];
      if ("manifest.xlsx" in fileKey && fileKey["manifest.xlsx"]["forTreeview"] === true) {
        delete fileKey["manifest.xlsx"];
      }
    }
  }
};

const generateFFManifestEditCard = (highLevelFolderName) => {
  return `
  <div class="guided--dataset-card">        
    <div class="guided--dataset-card-body shrink">
      <div class="guided--dataset-card-row">
        <h1 class="guided--text-dataset-card">
          <span class="manifest-folder-name">${highLevelFolderName}</span>
        </h1>
      </div>
    </div>
    <div class="guided--container-dataset-card-center">
      <button
        class="ui primary button guided--button-footer"
        style="
          background-color: var(--color-light-green) !important;
          width: 280px !important;
          margin: 4px;
        "
        onClick="ffOpenManifestEditSwal('${highLevelFolderName}')"
      >
        Preview/Edit ${highLevelFolderName} manifest file
      </button>
    </div>
  </div>
`;
};

const renderFFManifestCards = () => {
  const manifestData = sodaCopy["manifest-files"];
  const highLevelFoldersWithManifestData = Object.keys(manifestData);

  const manifestCards = highLevelFoldersWithManifestData
    .map((highLevelFolder) => {
      return generateFFManifestEditCard(highLevelFolder);
    })
    .join("\n");

  const manifestFilesCardsContainer = document.getElementById("ffm-container-manifest-file-cards");
  manifestFilesCardsContainer.innerHTML = manifestCards;

  smoothScrollToElement(manifestFilesCardsContainer);
};

const ffOpenManifestEditSwal = async (highlevelFolderName) => {
  let saveManifestFiles = false;
  let guidedManifestTable = [];
  // Function for when user wants to edit the manifest cards
  const existingManifestData = sodaCopy["manifest-files"]?.[highlevelFolderName];
  // const existingManifestData = sodaJSONObj["guided-manifest-files"][highLevelFolderName];
  //send manifest data to main.js to then send to child window
  ipcRenderer.invoke("spreadsheet", existingManifestData);

  //upon receiving a reply of the spreadsheet, handle accordingly
  ipcRenderer.on("spreadsheet-reply", async (event, result) => {
    if (!result || result === "") {
      ipcRenderer.removeAllListeners("spreadsheet-reply");
      return;
    } else {
      //spreadsheet reply contained results
      ipcRenderer.removeAllListeners("spreadsheet-reply");
      saveManifestFiles = true;
      // guidedManifestTable = result;
      if (saveManifestFiles) {
        //if additional metadata or description gets added for a file then add to json as well
        sodaJSONObj["manifest-files"]["auto-generated"] = true;
        const savedHeaders = result[0];
        const savedData = result[1];
        let jsonManifest = {};
        let localFolderPath = path.join(
          homeDirectory,
          "SODA",
          "manifest_files",
          highlevelFolderName
        );
        let selectedManifestFilePath = path.join(localFolderPath, "manifest.xlsx");
        if (!fs.existsSync(localFolderPath)) {
          fs.mkdirSync(localFolderPath);
          fs.closeSync(fs.openSync(selectedManifestFilePath, "w"));
        }
        jsonManifest = excelToJson({
          sourceFile: selectedManifestFilePath,
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        })["Sheet1"];

        let sortedJSON = processManifestInfo(savedHeaders, savedData);
        jsonManifest = JSON.stringify(sortedJSON);
        convertJSONToXlsx(JSON.parse(jsonManifest), selectedManifestFilePath);
        //Update the metadata in json object
        for (let i = 0; i < savedData.length; i++) {
          let fileName = savedData[i][0];
          let cleanedFileName = "";
          let fileNameSplit = fileName.split("/");
          let description = savedData[i][2];
          let additionalMetadata = savedData[i][4];
          if (fileNameSplit[0] === "") {
            //not in a subfolder
            cleanedFileName = fileNameSplit[1];
            sodaCopy["dataset-structure"]["folders"][highlevelFolderName]["files"][cleanedFileName][
              "description"
            ] = description;
            sodaJSONObj["dataset-structure"]["folders"][highlevelFolderName]["files"][
              cleanedFileName
            ]["description"];
            sodaCopy["dataset-structure"]["folders"][highlevelFolderName]["files"][cleanedFileName][
              "additional-metadata"
            ] = additionalMetadata;
            sodaJSONObj["dataset-structure"]["folders"][highlevelFolderName]["files"][
              cleanedFileName
            ]["additional-metadata"] = additionalMetadata;
          } else {
            // is in a subfolder so search for it and update metadata
            // need to add description and additional metadata to original sodaJSONObj
            let folderDepthCopy = sodaCopy["dataset-structure"]["folders"][highlevelFolderName];
            let folderDepthReal = sodaJSONObj["dataset-structure"]["folders"][highlevelFolderName];
            for (let j = 0; j < fileNameSplit.length; j++) {
              if (j === fileNameSplit.length - 1) {
                folderDepthCopy["files"][fileNameSplit[j]]["description"] = description;
                folderDepthReal["files"][fileNameSplit[j]]["description"] = description;
                folderDepthCopy["files"][fileNameSplit[j]]["additional-metadata"] =
                  additionalMetadata;
                folderDepthReal["files"][fileNameSplit[j]]["additional-metadata"] =
                  additionalMetadata;
              } else {
                folderDepthCopy = folderDepthCopy["folders"][fileNameSplit[j]];
                folderDepthReal = folderDepthReal["folders"][fileNameSplit[j]];
              }
            }
          }
        }

        sodaCopy["manifest-files"][highlevelFolderName] = {
          headers: savedHeaders,
          data: savedData,
        };
      }

      //Rerender the manifest cards
      renderFFManifestCards();
    }
  });
};

// Function takes in original sodaJSONObj and creates a copy of it to modify to manifest edits
// Manifest edits will create
const ffmCreateManifest = async (sodaJson) => {
  await new Promise((r) => setTimeout(r, 0));
  //create a copy of the sodajson object
  sodaCopy = sodaJson;
  datasetStructCopy = sodaCopy["dataset-structure"];
  if ("auto-generated" in sodaCopy["manifest-files"]) {
    delete sodaCopy["manifest-files"]["auto-generated"];
  }
  if ("destination" in sodaCopy["manifest-files"]) {
    delete sodaCopy["manifest-files"]["destination"];
  }

  try {
    // used for imported local datasets and pennsieve datasets
    // filters out deleted files/folders before creating manifest data again
    const cleanJson = await client.post(
      `/curate_datasets/clean-dataset`,
      { soda_json_structure: sodaCopy },
      { timeout: 0 }
    );

    let response = cleanJson.data.soda_json_structure;
    // response does not format in JSON format so need to format ' with "
    let regex = /'/gm;
    let formattedResponse = response.replace(regex, '"');
    let capitalTPosition = formattedResponse.search("True");
    if (capitalTPosition != -1) {
      formattedResponse = formattedResponse.replace("True", "true");
    }

    let json_structure = JSON.parse(formattedResponse);
    sodaCopy = json_structure;
    datasetStructCopy = sodaCopy["dataset-structure"];
  } catch (e) {
    clientError(e);
    console.log(e);
  }

  //manifest will still include pennsieve or locally imported files
  // deleted to prevent from showing up as manifest card
  if (sodaCopy["manifest-files"]?.["destination"]) {
    delete sodaCopy["manifest-files"]["destination"];
  }

  // create manifest data of all high level folders
  console.log(JSON.stringify(datasetStructCopy));
  try {
    const res = await client.post(
      `/curate_datasets/guided_generate_high_level_folder_manifest_data`,
      {
        dataset_structure_obj: datasetStructCopy,
      },
      { timeout: 0 }
    );

    // loop through each of the high level folders and create excel sheet in case no edits are made
    // will be auto generated and ready for upload
    const manifestRes = res.data;
    console.log(JSON.stringify(manifestRes));
    let newManifestData = {};
    for (const [highLevelFolderName, manifestFileData] of Object.entries(manifestRes)) {
      if (manifestFileData.length > 1) {
        const manifestHeader = manifestFileData.shift();
        console.log(manifestHeader);
        newManifestData[highLevelFolderName] = {
          headers: manifestHeader,
          data: manifestFileData,
        };
        console.log(newManifestData);
        console.log("above is the new manifest data");
        // Will create an excel sheet of the manifest files in case they receive no edits
        let jsonManifest = {};
        let manifestFolder = path.join(homeDirectory, "SODA", "manifest_files");
        let localFolderPath = path.join(manifestFolder, highLevelFolderName);
        let selectedManifestFilePath = path.join(localFolderPath, "manifest.xlsx");
        // create manifest folders if they don't exist
        if (!fs.existsSync(manifestFolder)) {
          fs.mkdirSync(manifestFolder);
        }
        if (!fs.existsSync(localFolderPath)) {
          fs.mkdirSync(localFolderPath);
          fs.closeSync(fs.openSync(selectedManifestFilePath, "w"));
          console.log("uhh");
        }
        if (!fs.existsSync(selectedManifestFilePath)) {
          console.log("Manifest file does not exist");
        } else {
          jsonManifest = excelToJson({
            sourceFile: selectedManifestFilePath,
            columnToKey: {
              "*": "{{columnHeader}}",
            },
          })["Sheet1"];
          console.log(jsonManifest);
        }
        // If file doesn't exist then that means it didn't get imported properly

        let sortedJSON = processManifestInfo(manifestHeader, manifestFileData);
        jsonManifest = JSON.stringify(sortedJSON);
        convertJSONToXlsx(JSON.parse(jsonManifest), selectedManifestFilePath);
      }
    }

    // Check if manifest data is different from what exists already (if previous data exists)
    const existingManifestData = sodaCopy["manifest-files"];
    let updatedManifestData;

    if (existingManifestData) {
      updatedManifestData = diffCheckManifestFiles(newManifestData, existingManifestData);
    } else {
      updatedManifestData = newManifestData;
    }
    // manifest data will be stored in sodaCopy to be reused for manifest edits/regenerating cards
    // sodaJSONObj will remain the same and only have 'additonal-metadata' and 'description' data
    sodaCopy["manifest-files"] = updatedManifestData;

    // below needs to be added added before the main_curate_function begins
    sodaJSONObj["manifest-files"] = {
      "auto-generated": true,
      destination: "generate-dataset",
    };
  } catch (err) {
    clientError(err);
    console.log(err);
    userError(err);
  }
  renderFFManifestCards();
};

$("#generate-manifest-curate").change(async function () {
  if (this.checked) {
    $("#button-generate-manifest-locally").show();
    //display manifest generator UI here
    $("#ffm-manifest-generator").show();
    // create the manifest of the high level folders within sodaJSONObj
    if ("manifest-files" in sodaJSONObj === false) {
      sodaJSONObj["manifest-files"] = {
        "auto-generated": true,
        destination: "generate-dataset",
      };
    }

    await ffmCreateManifest(sodaJSONObj);
    // For the back end to know the manifest files have been created in $HOME/SODA/manifest-files/<highLvlFolder>
    sodaJSONObj["manifest-files"]["auto-generated"] = true;
  } else {
    $("#button-generate-manifest-locally").hide();
    $("#ffm-manifest-generator").hide();
    document.getElementById("ffm-container-manifest-file-cards").innerHTML = "";
    if (sodaJSONObj["manifest-files"]?.["destination"]) {
      delete sodaJSONObj["manifest-files"]["destination"];
    }
    if (sodaJSONObj["manifest-files"]?.["auto-generated"]) {
      delete sodaJSONObj["manifest-files"]["auto-generated"];
    }
  }
});

// const determineDatasetDestination = (dataset_name, dataset_destination) => {
//   // determine if the dataset is being uploaded to Pennsieve or being generated locally
//   if ("bf-dataset-selected" in sodaJSONObj) {
//     dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
//     dataset_destination = "Pennsieve";
//   } else if ("generate-dataset" in sodaJSONObj) {
//     if ("destination" in sodaJSONObj["generate-dataset"]) {
//       let destination = sodaJSONObj["generate-dataset"]["destination"];
//       if (destination == "local") {
//         dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
//         dataset_destination = "Local";
//       }
//       if (destination == "bf") {
//         dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
//         dataset_destination = "Pennsieve";
//       }
//     }
//   }

//   return [dataset_name, dataset_destination];
// };
