import Swal from "sweetalert2";
import { updateDatasetList } from "../globals";
import determineDatasetLocation, { Destinations } from "../analytics/analytics-utils";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import { successCheck } from "../../assets/lotties/lotties";
import client from "../client";
import "jstree";
import fileTxt from "/img/txt-file.png";
import filePng from "/img/png-file.png";
import filePdf from "/img/pdf-file.png";
import fileCsv from "/img/csv-file.png";
import fileDoc from "/img/doc-file.png";
import fileXlsx from "/img/excel-file.png";
import fileJpeg from "/img/jpeg-file.png";
import fileOther from "/img/other-file.png";
import { swalConfirmAction } from "../utils/swal-utils";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

var metadataFile = "";
window.jstreePreview = document.getElementById("div-dataset-tree-preview");
window.nonAllowedCharacters = '<>:",;[]{}^`~@/|?*$=!%&+#\\';

// Event listeners for opening the dropdown prompt
document
  .querySelector("#Question-getting-started-BF-account .change-current-account")
  .addEventListener("click", function () {
    window.openDropdownPrompt(this, "bf");
  });

document
  .querySelector("#Question-getting-started-BF-dataset .change-current-account")
  .addEventListener("click", function () {
    window.openDropdownPrompt(this, "dataset", false);
  });

document
  .querySelector("#Question-generate-dataset-BF-dataset .change-current-account:not(.organization)")
  .addEventListener("click", function (event) {
    window.openDropdownPrompt(event.target, "dataset", false);
  });

document
  .querySelector("#Question-generate-dataset-BF-account .change-current-account")
  .addEventListener("click", function () {
    window.openDropdownPrompt(this, "bf");
  });

$(".button-individual-metadata.remove").click(function () {
  let metadataFileStatus = $($(this).parents()[1]).find(".para-metadata-file-status");

  $(metadataFileStatus).text("");
  $($(this).parents()[1]).find(".div-metadata-confirm").css("display", "none");
  $($(this).parents()[1]).find(".div-metadata-go-back").css("display", "flex");
});

// Where metadata files are imported through free form mode
$(".metadata-button").click(function () {
  metadataFile = $(this);
  $(".div-organize-generate-dataset.metadata").addClass("hide");
  let target = $(this).attr("data-next");
  $("#" + target).toggleClass("show");
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("prevBtn").style.display = "none";
});

window.confirmMetadataFilePath = (ev) => {
  $($(ev).parents()[1]).removeClass("show");
  $(".div-organize-generate-dataset.metadata").removeClass("hide");
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";

  // Checking if metadata files are imported
  //// once users click "Confirm" or "Cancel", check if file is specified
  //// if yes: addClass 'done'
  //// if no: removeClass 'done'
  let errorMetadataFileMessages = [
    "",
    "Please only drag and drop a file!",
    "Your SPARC metadata file must be in one of the formats listed above!",
    "Your SPARC metadata file must be named and formatted exactly as listed above!",
  ];
  let metadataFileStatus = $($(ev).parents()[1]).find(".para-metadata-file-status");

  if (!errorMetadataFileMessages.includes($(metadataFileStatus).text())) {
    $(metadataFile).addClass("done");

    // log the import to analytics
    window.logCurationForAnalytics(
      "Success",
      window.PrepareDatasetsAnalyticsPrefix.CURATE,
      window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      [
        "Step 4",
        "Import",
        `${window.getMetadataFileNameFromStatus(metadataFileStatus)}`,
        window.determineLocationFromStatus(metadataFileStatus)
          ? Destinations.PENNSIEVE
          : Destinations.LOCAL,
      ],
      determineDatasetLocation()
    );
  } else {
    $(metadataFile).removeClass("done");
    $(metadataFileStatus).text("");
    // log the import attempt to analytics
    window.logCurationForAnalytics(
      "Error",
      window.PrepareDatasetsAnalyticsPrefix.CURATE,
      window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      [
        "Step 4",
        "Import",
        `${window.getMetadataFileNameFromStatus(metadataFileStatus)}`,
        window.determineLocationFromStatus(metadataFileStatus)
          ? Destinations.PENNSIEVE
          : Destinations.LOCAL,
      ],
      determineDatasetLocation()
    );
  }
};

// Two vars with the same name
$(".button-individual-metadata.go-back").click(function () {
  var metadataFileStatus = $($(this).parents()[1]).find(".para-metadata-file-status");
  $(metadataFileStatus).text("");
  $($(this).parents()[1]).removeClass("show");
  $(".div-organize-generate-dataset.metadata").removeClass("hide");
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  let errorMetadataFileMessages = [
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

window.dropHandler = async (
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
        window.handleSelectedBannerImage(path, "guided-mode");
        $("#guided-banner-image-modal").modal("show");
      }
      if (dataDeliverables === true) {
        let filepath = file.path;
        log.info(`Importing Data Deliverables document: ${filepath}`);
        try {
          let extract_milestone = await client.get(`/prepare_metadata/import_milestone`, {
            params: {
              path: filepath,
            },
          });
          let res = extract_milestone.data;

          // Get the SPARC award and milestone data from the response
          const importedSparcAward = res["sparc_award"];
          const milestoneObj = res["milestone_data"];

          await window.openSubmissionMultiStepSwal(curationMode, importedSparcAward, milestoneObj);
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
              window.sodaJSONObj["dataset-metadata"]["code-metadata"][metadataFileType] = file.path;
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

const checkAvailableSpace = async () => {
  const roundToHundredth = (value) => {
    return Number(parseFloat(value.toFixed(2)));
  };

  let location = document
    .getElementById("input-destination-generate-dataset-locally")
    .getAttribute("placeholder");

  let freeMemory = await window.electron.ipcRenderer.invoke("getDiskSpace", location);
  let freeMemoryMB = roundToHundredth(freeMemory / 1024 ** 2);

  let datasetSizeResponse;
  try {
    datasetSizeResponse = await client.post(
      "/curate_datasets/dataset_size",
      {
        soda_json_structure: window.sodaJSONObj,
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

      window.logCurationForAnalytics(
        "Error",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ACTION_WITH_DESTINATION,
        ["Step 6", "Check Storage Space", determineDatasetLocation()],
        determineDatasetLocation()
      );

      // return to avoid logging that the user passed the storage space check
      return;
    }

    window.logCurationForAnalytics(
      "Success",
      window.PrepareDatasetsAnalyticsPrefix.CURATE,
      window.AnalyticsGranularity.ACTION_WITH_DESTINATION,
      ["Step 6", "Check Storage Space", determineDatasetLocation()],
      determineDatasetLocation()
    );
  } catch (error) {
    clientError(error);
  }
};
const btnConfirmLocalDatasetGeneration = document.getElementById("btn-confirm-local-destination");
btnConfirmLocalDatasetGeneration.addEventListener("click", checkAvailableSpace, false);

//////////////// IMPORT EXISTING PROGRESS FILES ////////////////////////////////
window.progressFileDropdown = document.getElementById("progress-files-dropdown");

/////////////////////////////// Helpers function for Import progress function /////////////////////////////
// function to load SODA with progress file
const progressFileParse = (ev) => {
  var fileName = $(ev).val();
  if (fileName !== "Select") {
    var filePath = window.path.join(window.progressFilePath, fileName);
    try {
      var content = window.fs.readFileSync(filePath, "utf-8");
      let contentJson = JSON.parse(content);
      return contentJson;
    } catch (error) {
      log.error(error);
      console.log(error);
      document.getElementById("para-progress-file-status").innerHTML =
        "<span style='color:red'>" + error + "</span>";

      // log the error to analytics at varying levels of granularity
      window.logMetadataForAnalytics(
        "Error",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ALL_LEVELS,
        window.Actions.EXISTING,
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
    window.manifestFileCheck.checked = true;
  } else {
    window.manifestFileCheck.checked = false;
  }
};

const importMetadataFilesProgress = (object) => {
  populateMetadataProgress(false, "", "");
  if ("metadata-files" in object) {
    var metadataFileArray = Object.keys(object["metadata-files"]);
    metadataFileArray.forEach((element) => {
      var fullPath = object["metadata-files"][element]["path"];

      populateMetadataProgress(true, window.path.parse(element).name, fullPath);
      if (!window.fs.existsSync(fullPath)) {
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
      if (!window.fs.existsSync(dataset_folder["files"][file]["path"])) {
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
    datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
    recursive_check_for_missing_files(datasetStructureJSONObj);
    window.highLevelFoldersDisableOptions();
  } else {
    datasetStructureJSONObj = { folders: {}, files: {}, type: "" };
  }
};

const importGenerateDatasetStep = async (object) => {
  if ("generate-dataset" in window.sodaJSONObj) {
    // Step 1: Where to generate the dataset
    if (sodaJSONObj["generate-dataset"]["destination"] === "local") {
      $("#generate-local-desktop").prop("checked", true);
      $($("#generate-local-desktop").parents()[2]).click();
      // Step 2: if generate locally, name and path
      $("#input-destination-generate-dataset-locally").prop(
        "placeholder",
        window.sodaJSONObj["generate-dataset"]["path"]
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
        "bf-account-selected" in window.sodaJSONObj &&
        window.sodaJSONObj["bf-account-selected"]["account-name"] !== ""
      ) {
        let bfAccountSelected = window.sodaJSONObj["bf-account-selected"]["account-name"];
        if (bfAccountSelected != window.defaultBfDataset) {
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
          window.updateBfAccountList();
        } catch (error) {
          clientError(error);
          showHideDropdownButtons("account", "hide");
        }

        $("#btn-bf-account").trigger("click");
        // Step 3: choose to generate on an existing or new dataset
        if (
          "bf-dataset-selected" in window.sodaJSONObj &&
          window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] !== ""
        ) {
          $("#generate-BF-dataset-options-existing").prop("checked", true);
          $($("#generate-BF-dataset-options-existing").parents()[2]).click();
          let bfDatasetSelected = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
          setTimeout(() => {
            let valid_dataset = false;
            for (const index in window.datasetList) {
              let x = window.datasetList[index]["name"];
              if (bfDatasetSelected == window.datasetList[index]["name"]) {
                valid_dataset = true;
              }
            }
            if (valid_dataset == false) {
              return;
            }
            $("#current-bf-dataset-generate").text(bfDatasetSelected);
            $("#button-confirm-bf-dataset").click();
            // Step 4: Handle existing files and folders
            if ("if-existing" in window.sodaJSONObj["generate-dataset"]) {
              let existingFolderOption = window.sodaJSONObj["generate-dataset"]["if-existing"];
              $("#existing-folders-" + existingFolderOption).prop("checked", true);
              $($("#existing-folders-" + existingFolderOption).parents()[2]).click();
            }
            if ("if-existing-files" in window.sodaJSONObj["generate-dataset"]) {
              let existingFileOption = window.sodaJSONObj["generate-dataset"]["if-existing-files"];
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
    if ("save-progress" in window.sodaJSONObj) {
      // the block of code below reverts all the checks to option cards if applicable
      $("#previous-progress").prop("checked", true);
      $($("#previous-progress").parents()[2]).addClass("checked");
      $(
        $($($("#div-getting-started-previous-progress").parents()[0]).siblings()[0]).children()[0]
      ).toggleClass("non-selected");
    } else {
      window.exitCurate();
    }
  }
};

// check metadata files
const populateMetadataProgress = (populateBoolean, metadataFileName, localPath) => {
  let metadataButtonsArray = $(".metadata-button.button-generate-dataset");
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
      let paraElement = correspondingMetadataParaElement[metadataFileName];
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
    for (let key in correspondingMetadataParaElement) {
      let paraElement = correspondingMetadataParaElement[key];
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
window.loadProgressFile = (ev) => {
  missing_dataset_files = [];
  missing_metadata_files = [];

  if ($(ev).val() === "Select") {
    return;
  }

  let jsonContent = progressFileParse(ev);

  $("#para-progress-file-status").html("");
  // $("#nextBtn").prop("disabled", true);

  // create loading effect
  $("#div-progress-file-loader").css("display", "block");
  $("body").addClass("waiting");

  if (JSON.stringify(jsonContent) !== "{}") {
    window.sodaJSONObj = jsonContent;
    setTimeout(() => {
      window.sodaJSONObj = jsonContent;
      importManifest(window.sodaJSONObj);
      importMetadataFilesProgress(window.sodaJSONObj);
      importDatasetStructure(window.sodaJSONObj);
      importGenerateDatasetStep(window.sodaJSONObj);
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
        window.logMetadataForAnalytics(
          "Success",
          window.PrepareDatasetsAnalyticsPrefix.CURATE,
          window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          window.Actions.EXISTING,
          Destinations.SAVED
        );
      }
    }, 1000);
  } else {
    window.sodaJSONObj = '{"starting-point":"new","dataset-structure":{},"metadata-files":{}}';
    setTimeout(() => {
      importManifest(window.sodaJSONObj);
      importMetadataFilesProgress(window.sodaJSONObj);
      importDatasetStructure(window.sodaJSONObj);
      importGenerateDatasetStep(window.sodaJSONObj);
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
    reverseButtons: window.reverseSwalButtons,
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
        window.logMetadataForAnalytics(
          "Success",
          window.PrepareDatasetsAnalyticsPrefix.CURATE,
          window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          window.Actions.EXISTING,
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
      for (let item in window.sodaJSONObj["metadata-files"]) {
        if (
          window.sodaJSONObj["metadata-files"][item]["path"] == missing_metadata_files[item_path]
        ) {
          delete window.sodaJSONObj["metadata-files"][item];
        }
      }
    }
  }
  if (missing_dataset_files.length > 0) {
    for (let item_path in missing_dataset_files) {
      recursive_remove_missing_file(
        missing_dataset_files[item_path],
        window.sodaJSONObj["dataset-structure"]
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

// function to load Progress dropdown
const importOrganizeProgressPrompt = () => {
  document.getElementById("para-progress-file-status").innerHTML = "";
  window.removeOptions(window.progressFileDropdown);
  window.addOption(window.progressFileDropdown, "Select", "Select");
  if (window.fs.existsSync(window.progressFilePath)) {
    var fileNames = window.fs.readdirSync(window.progressFilePath);
    if (fileNames.length > 0) {
      fileNames.forEach((item, i) => {
        window.addOption(window.progressFileDropdown, window.path.parse(item).name, item);
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

window.create_api_key_and_secret = (login, password, machineUsernameSpecifier) => {
  return new Promise(async (resolve) => {
    try {
      let bf_get_pennsieve_secret_key = await client.post(
        `/manage_datasets/pennsieve_api_key_secret`,
        {
          username: login,
          password: password,
          machine_username_specifier: machineUsernameSpecifier,
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
  // updateDatasetList(window.defaultBfDataset);
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

let high_lvl_folder_node = "";
window.create_child_node = (
  oldFormatNode,
  nodeName,
  type,
  ext,
  treePreviewName,
  selectedState,
  disabledState,
  selectedOriginalLocation,
  viewOptions,
  parentFolder
) => {
  var newFormatNode = {
    text: nodeName,
    state: {
      opened: nodeName === treePreviewName,
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
          if (nodeName === "dataset_root") {
            high_lvl_folder_node = key;
          }
          if (key === selectedOriginalLocation && parentFolder === high_lvl_folder_node) {
            newFormatNode.state.selected = true;

            var new_node = window.create_child_node(
              value,
              key,
              "folder",
              "",
              treePreviewName,
              true,
              true,
              selectedOriginalLocation,
              viewOptions,
              parentFolder
            );
          } else {
            newFormatNode.state.selected = true;
            var new_node = window.create_child_node(
              value,
              key,
              "folder",
              "",
              treePreviewName,
              false,
              false,
              selectedOriginalLocation,
              viewOptions,
              parentFolder
            );
          }
          newFormatNode["children"].push(new_node);
          newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
        }
      } else {
        if (key === selectedOriginalLocation) {
          newFormatNode.state.selected = true;
          var new_node = window.create_child_node(
            value,
            key,
            "folder",
            "",
            treePreviewName,
            true,
            true,
            selectedOriginalLocation,
            viewOptions,
            parentFolder
          );
        } else {
          var new_node = window.create_child_node(
            value,
            key,
            "folder",
            "",
            treePreviewName,
            false,
            false,
            selectedOriginalLocation,
            viewOptions,
            parentFolder
          );
        }
        newFormatNode["children"].push(new_node);
        newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
      }
    }
    if ("files" in oldFormatNode) {
      let nodeType = "";
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
              ].includes(window.path.parse(key).ext)
            ) {
              nodeType = "file " + window.path.parse(key).ext.slice(1);
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

// var selected = false;
var selectedPath;
var selectedNode;
var jsTreeData = window.create_child_node(
  {
    folders: {},
    files: {},
    type: "",
  },
  "dataset_root",
  "folder",
  "",
  "dataset_root",
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
      let a1 = this.get_node(a);
      let b1 = this.get_node(b);

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
        icon: fileXlsx,
      },
      "file xls": {
        icon: fileXlsx,
      },
      "file png": {
        icon: filePng,
      },
      "file PNG": {
        icon: filePng,
      },
      "file pdf": {
        icon: filePdf,
      },
      "file txt": {
        icon: fileTxt,
      },
      "file csv": {
        icon: fileCsv,
      },
      "file CSV": {
        icon: fileCsv,
      },
      "file DOC": {
        icon: fileDoc,
      },
      "file DOCX": {
        icon: fileDoc,
      },
      "file docx": {
        icon: fileDoc,
      },
      "file doc": {
        icon: fileDoc,
      },
      "file jpeg": {
        icon: fileJpeg,
      },
      "file JPEG": {
        icon: fileJpeg,
      },
      "file jpg": {
        icon: fileJpeg,
      },
      "file JPG": {
        icon: fileJpeg,
      },
      "file other": {
        icon: fileOther,
      },
    },
  });
});

window.moveItems = async (ev, category) => {
  let filtered = window.getGlobalPath(window.organizeDSglobalPath);
  let myPath = window.getRecursivePath(filtered.slice(1), window.datasetStructureJSONObj);
  let parentFolder = filtered[1];
  let selectedOriginalLocation = filtered[filtered.length - 1];
  let selectedItem = ev.parentElement.innerText;

  if ("files" in window.datasetStructureJSONObj) {
    window.datasetStructureJSONObj["files"] = {};
  }

  for (let highLevelFol in window.datasetStructureJSONObj["folders"]) {
    // remove manifest files for treeview
    if (
      "manifest.xlsx" in window.datasetStructureJSONObj["folders"][highLevelFol]["files"] &&
      window.datasetStructureJSONObj["folders"][highLevelFol]["files"]["manifest.xlsx"][
        "forTreeview"
      ] === true
    ) {
      delete window.datasetStructureJSONObj["folders"][highLevelFol]["files"]["manifest.xlsx"];
    }
  }

  jsTreeData = window.create_child_node(
    window.datasetStructureJSONObj,
    "dataset_root",
    "folder",
    "",
    "dataset_root",
    true,
    true,
    selectedOriginalLocation,
    "moveItems",
    parentFolder
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
    reverseButtons: window.reverseSwalButtons,
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
    didOpen: () => {
      document.getElementById("swal2-html-container").style.overflowY = "auto";
      document.getElementById("swal2-html-container").style.maxHeight = "500px";
    },
    preConfirm: () => {
      Swal.resetValidationMessage();
      if (!selectedPath) {
        Swal.showValidationMessage("Please select a folder destination!");
        return undefined;
      } else if (selectedNode === "dataset_root") {
        Swal.showValidationMessage("Items cannot be moved to this level of the dataset!");
        return undefined;
      } else if (selectedNode === selectedItem) {
        Swal.showValidationMessage("Items cannot be moved into themselves!");
        return undefined;
      } else {
        return selectedPath;
      }
    },
  });

  if (folderDestination) {
    // Confirm with user if they want to move the item(s)
    const { value: confirm } = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      focusCancel: true,
      heightAuto: false,
      icon: "warning",
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: true,
      title: `Are you sure you want to move selected item(s) to: ${selectedPath}?`,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    if (confirm) {
      // User confimed the moving of the item(s)
      // TODO: Dorian -> Add a nicer loading icon for the sweet alert here
      let duplicateItems = [`<ul style="text-align: center;">`];
      let numberItems = $("div.single-item.selected-item").toArray().length;
      let timer = 2000;
      if (numberItems > 10) {
        timer = 7000;
      }
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
        let splitSelectedPath = selectedPath.split("/");
        let datasetStructureCopy = window.datasetStructureJSONObj;

        if ($("div.single-item.selected-item").toArray().length > 1) {
          // Moving multiple items
          $("div.single-item.selected-item")
            .toArray()
            .forEach((element) => {
              datasetStructureCopy = window.datasetStructureJSONObj;
              let itemToMove = element.textContent;
              let itemType = "";

              if ($(element.firstElementChild).hasClass("myFile")) {
                itemType = "files";
              } else if ($(element.firstElementChild).hasClass("myFol")) {
                itemType = "folders";
              }

              for (let i = 1; i < splitSelectedPath.length; i++) {
                if (datasetStructureCopy["folders"].hasOwnProperty(splitSelectedPath[i])) {
                  // Traverse to the necessary subfolder based on the path length (amount of subfolders)
                  datasetStructureCopy = datasetStructureCopy["folders"][splitSelectedPath[i]];
                }
              }

              //Enter files or folders based on the itemType
              datasetStructureCopy = datasetStructureCopy[itemType];
              if (datasetStructureCopy.hasOwnProperty(itemToMove)) {
                // There is already an item with the same name in the destination folder
                if (itemType == "folders") {
                  itemToMove += "/";
                }
                duplicateItems.push(`<li style="font-size: large;">${itemToMove}</li>`);
              } else {
                moveItemsHelper(itemToMove, selectedPath, itemType, window.organizeDSglobalPath);
                element.remove();
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
        } else {
          // only 1 file/folder
          let itemToMove = ev.parentElement.textContent;
          let itemType = "";

          if ($(ev).hasClass("myFile")) {
            itemType = "files";
          } else if ($(ev).hasClass("myFol")) {
            itemType = "folders";
          }

          for (let i = 1; i < splitSelectedPath.length; i++) {
            if (splitSelectedPath[i] in datasetStructureCopy["folders"]) {
              // Traverse to the necessary subfolder based on the path length (amount of subfolders)
              datasetStructureCopy = datasetStructureCopy["folders"][splitSelectedPath[i]];
            }
          }

          // Enter files or folders based on the itemType
          datasetStructureCopy = datasetStructureCopy[itemType];
          if (datasetStructureCopy.hasOwnProperty(itemToMove)) {
            Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              icon: "error",
              title: `The ${itemType.substring(
                0,
                itemType.length - 1
              )} is already in the folder destination!`,
              html: `<ul style="text-align: center;"><li>${itemToMove}</li></ul>`,
              didOpen: () => {
                Swal.hideLoading();
              },
            });
          } else {
            moveItemsHelper(itemToMove, selectedPath, itemType, organizeDSglobalPath);
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

        // Rerender the file view again
        window.listItems(myPath, "#items", 500);
        window.getInFolder(".single-item", "#items", window.organizeDSglobalPath, myPath);

        // if moved into an empty folder we need to remove the class 'empty' from the folder destination
        let folderDestinationName = splitSelectedPath[splitSelectedPath.length - 1];
        if (
          myPath?.["folders"]?.[folderDestinationName] != undefined &&
          Object.keys(myPath?.["folders"]?.[folderDestinationName]).length > 0
        ) {
          let listedItems = document.getElementsByClassName("folder_desc");
          for (let i = 0; i < listedItems.length; i++) {
            // Find the folder in the list of folders and remove the empty class
            if (listedItems[i].innerText === folderDestinationName) {
              listedItems[i].parentElement.children[0].classList.remove("empty");
            }
          }
        }
      });
    }
  }
};

const moveItemsHelper = (item, destination, category, currentDatasetPath) => {
  let filtered = window.getGlobalPath(currentDatasetPath);
  let myPath = window.getRecursivePath(filtered.slice(1), window.datasetStructureJSONObj);
  let selectedNodeList = destination.split("/").slice(1);
  let destinationPath = window.getRecursivePath(selectedNodeList, window.datasetStructureJSONObj);

  // handle duplicates in destination folder
  if (category === "files") {
    let uiFiles = {};
    if (JSON.stringify(destinationPath["files"]) !== "{}") {
      for (let file in destinationPath["files"]) {
        uiFiles[window.path.parse(file).base] = 1;
      }
    }
    let fileBaseName = window.path.basename(item);
    let originalFileNameWithoutExt = window.path.parse(fileBaseName).name;
    let fileNameWithoutExt = originalFileNameWithoutExt;
    let j = 1;

    while (fileBaseName in uiFiles) {
      fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
      fileBaseName = fileNameWithoutExt + window.path.parse(fileBaseName).ext;
      j++;
    }

    // Add moved action to file in SODA JSON
    if ("action" in myPath[category][item]) {
      if (!myPath[category][item]["action"].includes("moved")) {
        myPath[category][item]["action"].push("moved");
      }
      if (fileBaseName !== window.path.basename(item)) {
        myPath[category][item]["action"].push("renamed");
      }
    } else {
      myPath[category][item]["action"] = ["moved"];
      if (fileBaseName !== window.path.basename(item)) {
        myPath[category][item]["action"].push("renamed");
      }
    }
    destinationPath[category][fileBaseName] = myPath[category][item];
  } else if (category === "folders") {
    let uiFolders = {};
    if (JSON.stringify(destinationPath["folders"]) !== "{}") {
      for (var folder in destinationPath["folders"]) {
        uiFolders[folder] = 1;
      }
    }
    let originalFolderName = window.path.basename(item);
    let renamedFolderName = originalFolderName;
    let j = 1;
    while (renamedFolderName in uiFolders) {
      renamedFolderName = `${originalFolderName} (${j})`;
      j++;
    }

    // Add moved action to folder in SODA JSON
    if ("action" in myPath[category][item]) {
      myPath[category][item]["action"].push("moved");
      window.addMovedRecursively(myPath[category][item]);
      if (renamedFolderName !== originalFolderName) {
        myPath[category][item]["action"].push("renamed");
      }
    } else {
      myPath[category][item]["action"] = ["moved"];
      window.addMovedRecursively(myPath[category][item]);
      if (renamedFolderName !== originalFolderName) {
        myPath[category][item]["action"].push("renamed");
      }
    }
    destinationPath[category][renamedFolderName] = myPath[category][item];
  }
  //delete item from the original location
  delete myPath[category][item];
};

window.updateManifestLabelColor = (el) => {
  document.getElementById("label-manifest").style.color = el.checked
    ? "var(--color-light-green)"
    : "#303030";
  document.getElementById("label-manifest").style.fontWeight = el.checked ? "bold" : "normal";
};

// helper functions to add "moved" to leaf nodes a.k.a files
window.addMovedRecursively = (object) => {
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
      window.addMovedRecursively(folder);
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
  $(window.jstreePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types", "sort"],
    sort: function (a, b) {
      let a1 = this.get_node(a);
      let b1 = this.get_node(b);

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
        icon: fileXlsx,
      },
      "file xls": {
        icon: fileXlsx,
      },
      "file png": {
        icon: filePng,
      },
      "file PNG": {
        icon: filePng,
      },
      "file pdf": {
        icon: filePdf,
      },
      "file txt": {
        icon: fileTxt,
      },
      "file csv": {
        icon: fileCsv,
      },
      "file CSV": {
        icon: fileCsv,
      },
      "file DOC": {
        icon: fileDoc,
      },
      "file DOCX": {
        icon: fileDoc,
      },
      "file docx": {
        icon: fileDoc,
      },
      "file doc": {
        icon: fileDoc,
      },
      "file jpeg": {
        icon: fileJpeg,
      },
      "file JPEG": {
        icon: fileJpeg,
      },
      "file other": {
        icon: fileOther,
      },
    },
  });
});

$(window.jstreePreview).on("open_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder open");
});

$(window.jstreePreview).on("close_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder closed");
});

window.showTreeViewPreview = (
  disabledBoolean,
  selectedBoolean,
  manifestFileBoolean,
  new_dataset_name,
  previewDiv,
  datasetStructure
) => {
  if (manifestFileBoolean) {
    if (window.manifestFileCheck.checked) {
      window.addManifestFilesForTreeView();
    } else {
      revertManifestForTreeView();
    }
  }

  var jsTreePreviewDataManifest = window.create_child_node(
    datasetStructure,
    new_dataset_name,
    "folder",
    "",
    new_dataset_name,
    selectedBoolean,
    disabledBoolean,
    "",
    "preview"
  );
  $(previewDiv).jstree(true).settings.core.data = jsTreePreviewDataManifest;
  $(previewDiv).jstree(true).refresh();
};

// if checked
window.addManifestFilesForTreeView = () => {
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
  <div class="dataset-card">        
    <div class="dataset-card-body shrink">
      <div class="dataset-card-row">
        <h1 class="dataset-card-title-text">
          <span class="manifest-folder-name">${highLevelFolderName}</span>
        </h1>
      </div>
    </div>
    <div class="dataset-card-button-container">
      <button
        class="ui primary button dataset-card-button-confirm"
        style="
          width: 295px !important;
          height: 3rem;
          font-size: 13px;
        "
        onClick="window.ffOpenManifestEditSwal('${highLevelFolderName}')"
      >
        Preview/Edit ${highLevelFolderName} manifest file
      </button>
    </div>
  </div>
`;
};

const renderFFManifestCards = () => {
  // Retrieve manifest data from the sodaCopy object
  const manifestData = window.sodaCopy["manifest-files"];

  // Extract high-level folders with manifest data
  const highLevelFoldersWithManifestData = Object.keys(manifestData);

  // Generate manifest cards for each high-level folder
  const manifestCards = highLevelFoldersWithManifestData
    .map((highLevelFolder) => generateFFManifestEditCard(highLevelFolder))
    .join("\n");

  // Get the container for manifest file cards
  const manifestFilesCardsContainer = document.getElementById("ffm-container-manifest-file-cards");

  // Set the inner HTML of the container with the generated manifest cards
  manifestFilesCardsContainer.innerHTML = manifestCards;

  // Unhide the generate manifest files button
  document
    .getElementById("ffm-container-local-manifest-file-generation")
    .classList.remove("hidden");

  // Scroll to the manifest file cards container
  window.smoothScrollToElement(manifestFilesCardsContainer);
};

const handleOrganizeDsGenerateLocalManifestCopyButtonClick = async () => {
  // Step 1: Prompt the user to select a folder to save the dataset
  const savePath = await window.electron.ipcRenderer.invoke(
    "open-folder-path-select",
    "Select a folder to save the manifest files to"
  );

  // Step 2: Check if a save path was selected
  if (!savePath) {
    // If no path selected, exit the function
    return;
  }

  // Step 3: Define the base folder name for the manifest files
  let manifestFolderName = "SODA Manifest Files";

  // Step 4: Function to generate a unique folder path for the manifest files
  const generateManifestFolderSavePath = () => {
    // If the selected save path already contains a "SODA Manifest Files" directory, append a number to the folder name
    // Otherwise, return the selected save path as is

    // Step 4.1: Check if the "SODA Manifest Files" directory already exists at the selected save path
    if (window.fs.existsSync(window.path.join(savePath, manifestFolderName))) {
      let i = 1;

      // Step 4.2: If the directory with the original name already exists, increment the number until a unique name is found
      while (window.fs.existsSync(window.path.join(savePath, `${manifestFolderName} (${i})`))) {
        i++;
      }

      // Step 4.3: Return the path with the incremented folder name
      return window.path.join(savePath, `${manifestFolderName} (${i})`);
    } else {
      // Step 4.4: If the original directory does not exist, return the selected save path with the original folder name
      return window.path.join(savePath, manifestFolderName);
    }
  };

  // Step 5: Generate the unique folder path for the manifest files
  const manifestFolderSavePath = generateManifestFolderSavePath();

  // Step 6: Extract manifest file data from the sodaCopy object
  const manifestFileData = window.sodaCopy["manifest-files"];

  // Step 7: Iterate over folders with manifest data
  const foldersWithManifestData = Object.keys(manifestFileData);
  for (const folder of foldersWithManifestData) {
    // Step 7.1: Process manifest data and convert it to JSON
    const manifestJSON = window.processManifestInfo(
      manifestFileData[folder]["headers"],
      manifestFileData[folder]["data"]
    );

    // Step 7.2: Convert JSON manifest to a string
    const jsonManifest = JSON.stringify(manifestJSON);

    // Step 7.3: Define the path for the manifest file
    const manifestPath = window.path.join(manifestFolderSavePath, folder, "manifest.xlsx");

    // Step 7.4: Create necessary directories
    window.fs.mkdirSync(window.path.join(manifestFolderSavePath, folder), {
      recursive: true,
    });

    // Step 7.5: Convert JSON manifest to an Excel file and save it
    window.convertJSONToXlsx(JSON.parse(jsonManifest), manifestPath);
  }

  // Step 8: Display a success notification
  window.notyf.open({
    duration: "5000",
    type: "success",
    message: "Manifest files successfully generated",
  });
};

// Attach a click listener to the manifest file generation button
document
  .getElementById("ffm-button-generate-manifest-files-locally")
  .addEventListener("click", async () => {
    await handleOrganizeDsGenerateLocalManifestCopyButtonClick();
  });

window.ffOpenManifestEditSwal = async (highlevelFolderName) => {
  let saveManifestFiles = false;
  let guidedManifestTable = [];
  // Function for when user wants to edit the manifest cards
  const existingManifestData = window.sodaCopy["manifest-files"]?.[highlevelFolderName];

  let ffmManifestContainer = document.getElementById("ffm-container-manifest-file-cards").children;
  //Lock manifest buttons
  for (let i = 0; i < ffmManifestContainer.length; i++) {
    ffmManifestContainer[i].children[1].children[0].disabled = true;
  }

  window.electron.ipcRenderer.invoke("spreadsheet", existingManifestData);

  //upon receiving a reply of the spreadsheet, handle accordingly
  window.electron.ipcRenderer.on("spreadsheet-reply", async (event, result) => {
    for (let i = 0; i < ffmManifestContainer.length; i++) {
      ffmManifestContainer[i].children[1].children[0].disabled = false;
    }
    if (!result || result === "") {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
      return;
    } else {
      //spreadsheet reply contained results
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
      saveManifestFiles = true;
      if (saveManifestFiles) {
        //if additional metadata or description gets added for a file then add to json as well
        window.sodaJSONObj["manifest-files"]["auto-generated"] = true;
        const savedHeaders = result[0];
        const savedData = result[1];
        let jsonManifest = {};
        let localFolderPath = window.path.join(
          homeDirectory,
          "SODA",
          "manifest_files",
          highlevelFolderName
        );
        let selectedManifestFilePath = window.path.join(localFolderPath, "manifest.xlsx");

        if (!window.fs.existsSync(localFolderPath)) {
          window.fs.mkdirSync(localFolderPath);
          window.fs.closeSync(window.fs.openSync(selectedManifestFilePath, "w"));
        }

        jsonManifest = await window.electron.ipcRenderer.invoke("excelToJsonSheet1Options", {
          sourceFile: selectedManifestFilePath,
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        });

        let sortedJSON = window.processManifestInfo(savedHeaders, savedData);
        jsonManifest = JSON.stringify(sortedJSON);
        window.convertJSONToXlsx(JSON.parse(jsonManifest), selectedManifestFilePath);
        //Update the metadata in json object
        for (let i = 0; i < savedData.length; i++) {
          let fileName = savedData[i][0];
          if (fileName == "" || fileName == undefined) {
            // fileName is blank if user accidentally creates a new row and does not remove it
            continue;
          }
          let cleanedFileName = "";
          let fileNameSplit = fileName.split("/");
          let description = savedData[i][2];
          let additionalMetadata = savedData[i][4];
          if (fileNameSplit[0] === "") {
            //not in a subfolder
            cleanedFileName = fileNameSplit[1];
            window.sodaCopy["dataset-structure"]["folders"][highlevelFolderName]["files"][
              cleanedFileName
            ]["description"] = description;
            window.sodaJSONObj["dataset-structure"]["folders"][highlevelFolderName]["files"][
              cleanedFileName
            ]["description"];
            window.sodaCopy["dataset-structure"]["folders"][highlevelFolderName]["files"][
              cleanedFileName
            ]["additional-metadata"] = additionalMetadata;
            window.sodaJSONObj["dataset-structure"]["folders"][highlevelFolderName]["files"][
              cleanedFileName
            ]["additional-metadata"] = additionalMetadata;
          } else {
            // is in a subfolder so search for it and update metadata
            // need to add description and additional metadata to original sodaJSONObj
            let folderDepthCopy =
              window.sodaCopy["dataset-structure"]["folders"][highlevelFolderName];
            let folderDepthReal =
              window.sodaJSONObj["dataset-structure"]["folders"][highlevelFolderName];
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

        window.sodaCopy["manifest-files"][highlevelFolderName] = {
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
window.ffmCreateManifest = async (sodaJson) => {
  await new Promise((r) => setTimeout(r, 0));
  //create a copy of the sodajson object
  window.sodaCopy = sodaJson;
  let datasetStructCopy = window.sodaCopy["dataset-structure"];
  if ("auto-generated" in window.sodaCopy["manifest-files"]) {
    delete window.sodaCopy["manifest-files"]["auto-generated"];
  }
  if ("destination" in window.sodaCopy["manifest-files"]) {
    delete window.sodaCopy["manifest-files"]["destination"];
  }

  try {
    // used for imported local datasets and pennsieve datasets
    // filters out deleted files/folders before creating manifest data again
    const cleanJson = await client.post(
      `/curate_datasets/clean-dataset`,
      { soda_json_structure: window.sodaCopy },
      { timeout: 0 }
    );
    let response = cleanJson.data.soda_json_structure;
    window.sodaCopy = response;
  } catch (e) {
    clientError(e);
  }

  //manifest will still include pennsieve or locally imported files
  // deleted to prevent from showing up as manifest card
  if (window.sodaCopy["manifest-files"]?.["destination"]) {
    delete window.sodaCopy["manifest-files"]["destination"];
  }

  // create manifest data of all high level folders
  try {
    const res = await client.post(
      `/curate_datasets/generate_high_level_folder_manifest_data`,
      {
        dataset_structure_obj: datasetStructCopy,
      },
      { timeout: 0 }
    );

    // loop through each of the high level folders and create excel sheet in case no edits are made
    // will be auto generated and ready for upload
    const manifestRes = res.data;
    let newManifestData = {};
    for (const [highLevelFolderName, manifestFileData] of Object.entries(manifestRes)) {
      if (manifestFileData.length > 1) {
        const manifestHeader = manifestFileData.shift();
        newManifestData[highLevelFolderName] = {
          headers: manifestHeader,
          data: manifestFileData,
        };
        // Will create an excel sheet of the manifest files in case they receive no edits
        let jsonManifest = {};
        let manifestFolder = window.path.join(homeDirectory, "SODA", "manifest_files");
        let localFolderPath = window.path.join(manifestFolder, highLevelFolderName);
        let selectedManifestFilePath = window.path.join(localFolderPath, "manifest.xlsx");
        // create manifest folders if they don't exist
        if (!window.fs.existsSync(manifestFolder)) {
          window.fs.mkdirSync(manifestFolder);
        }
        if (!window.fs.existsSync(localFolderPath)) {
          window.fs.mkdirSync(localFolderPath);
          window.fs.closeSync(window.fs.openSync(selectedManifestFilePath, "w"));
        }
        if (!window.fs.existsSync(selectedManifestFilePath)) {
        } else {
          jsonManifest = await window.electron.ipcRenderer.invoke("excelToJsonSheet1Options", {
            sourceFile: selectedManifestFilePath,
            columnToKey: {
              "*": "{{columnHeader}}",
            },
          });
        }
        // If file doesn't exist then that means it didn't get imported properly

        let sortedJSON = window.processManifestInfo(manifestHeader, manifestFileData);
        jsonManifest = JSON.stringify(sortedJSON);
        window.convertJSONToXlsx(JSON.parse(jsonManifest), selectedManifestFilePath);
      }
    }

    // Check if manifest data is different from what exists already (if previous data exists)
    const existingManifestData = window.sodaCopy["manifest-files"];
    let updatedManifestData;

    if (existingManifestData) {
      updatedManifestData = window.diffCheckManifestFiles(newManifestData, existingManifestData);
    } else {
      updatedManifestData = newManifestData;
    }
    // manifest data will be stored in window.sodaCopy to be reused for manifest edits/regenerating cards
    // sodaJSONObj will remain the same and only have 'additonal-metadata' and 'description' data
    window.sodaCopy["manifest-files"] = updatedManifestData;

    // below needs to be added added before the main_curate_function begins
    window.sodaJSONObj["manifest-files"] = {
      "auto-generated": true,
      destination: "generate-dataset",
    };
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
  renderFFManifestCards();
};

$("#generate-manifest-curate").change(async function () {
  if (this.checked) {
    //display manifest generator UI here
    $("#manifest-creating-loading").removeClass("hidden");
    // create the manifest of the high level folders within sodaJSONObj
    if ("manifest-files" in window.sodaJSONObj === false) {
      window.sodaJSONObj["manifest-files"] = {
        "auto-generated": true,
        destination: "generate-dataset",
      };
    }

    await window.ffmCreateManifest(sodaJSONObj);
    $("#ffm-manifest-generator").show();
    // For the back end to know the manifest files have been created in $HOME/SODA/manifest-files/<highLvlFolder>
    window.sodaJSONObj["manifest-files"]["auto-generated"] = true;
    $("#manifest-creating-loading").addClass("hidden");
    document
      .getElementById("ffm-container-local-manifest-file-generation")
      .classList.remove("hidden");
  } else {
    $("#ffm-manifest-generator").hide();
    $("#manifest-creating-loading").addClass("hidden");
    document.getElementById("ffm-container-manifest-file-cards").innerHTML = "";
    if (window.sodaJSONObj["manifest-files"]?.["destination"]) {
      delete window.sodaJSONObj["manifest-files"]["destination"];
    }
    if (window.sodaJSONObj["manifest-files"]?.["auto-generated"]) {
      delete window.sodaJSONObj["manifest-files"]["auto-generated"];
    }
    document.getElementById("ffm-container-local-manifest-file-generation").classList.add("hidden");
  }
});
