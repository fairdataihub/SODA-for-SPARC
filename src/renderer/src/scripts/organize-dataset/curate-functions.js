import Swal from "sweetalert2";
import { updateDatasetList } from "../globals";
import api from "../others/api/api";
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
import {
  swalConfirmAction,
  swalFileListSingleAction,
  swalFileListTripleAction,
  swalShowInfo,
} from "../utils/swal-utils";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

var metadataFile = "";
window.nonAllowedCharacters = '<>:",;[]{}^`~@/|?*$=!%&+#\\';

// Event listeners for opening the dropdown prompt
document
  .querySelector("#Question-getting-started-ps-account .change-current-account")
  .addEventListener("click", function () {
    window.openDropdownPrompt(this, "ps");
  });

document
  .querySelector("#Question-generate-dataset-ps-dataset .change-current-account")
  .addEventListener("click", function () {
    window.openDropdownPrompt(this, "dataset", false);
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

window.uploadDatasetDropHandler = async (ev) => {
  // Drag and drop handler for upload dataset
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    const itemDropped = ev.dataTransfer.items[0];
    const folderPath = itemDropped.getAsFile().path;
    const { isDirectory } = window.fs.statSync(folderPath);

    if (isDirectory) {
      window.sodaJSONObj = {
        "ps-account-selected": {},
        "ps-dataset-selected": {},
        "dataset-structure": {},
        "metadata-files": {},
        "manifest-files": {},
        "generate-dataset": {},
        "starting-point": {
          origin: "local",
          "local-path": "",
        },
      };

      let moveForward = false;
      document.getElementById("para-org-dataset-path").classList.add("hidden");
      let valid_dataset = window.verifySparcFolder(folderPath, "local");

      if (valid_dataset) {
        moveForward = await window.handleLocalDatasetImport(folderPath);
      } else {
        Swal.fire({
          icon: "warning",
          html: `<div style="text-align: left;">
                  This dataset is not following the SPARC Dataset Structure (SDS). It is expected that each of the high-level folders in this dataset is named after one of the SDS folders.
                  <br/>
                  See the "Data Organization" section of the SPARC documentation for more 
                  <a target="_blank" href="https://docs.sparc.science/docs/sparc-dataset-structure">details</a>
                  </div>`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showConfirmButton: false,
          showCancelButton: true,
          focusCancel: true,
          cancelButtonText: "Okay",
          reverseButtons: window.reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        });
      }

      if (moveForward) {
        document.getElementById("org-dataset-folder-path").innerHTML = folderPath;
        document.getElementById("nextBtn").disabled = false;
      }
    } else {
      document.getElementById("para-org-dataset-path").classList.remove("hidden");
    }
  }
};

const getFilesAndFolders = async (directoryPath) => {
  try {
    // Read the contents of the directory
    const contents = fs.readdirSync(directoryPath);

    // Separate files and folders
    const files = {};
    const folders = [];
    contents.forEach((item) => {
      // Get the full path of the item
      const itemPath = path.join(directoryPath, item);

      // Check if it's a file or a folder
      const stats = fs.statSync(itemPath);
      if (stats.isFile) {
        files[item] = {
          path: itemPath,
          action: ["new"],
          location: "local",
        };
      } else if (stats.isDirectory) {
        folders.push(itemPath);
      }
    });

    // itereate through the folders and get the files. If any of the files are names "manifest.csv" or "manifest.xlsx", save them to the variable manifestFiles
    let manifestFiles = {};
    for (let i = 0; i < folders.length; i++) {
      let folder = folders[i];
      let folderName = path.basename(folder);
      let files = fs.readdirSync(folder);
      for (let j = 0; j < files.length; j++) {
        let file = files[j];
        if (file === "manifest.csv" || file === "manifest.xlsx") {
          manifestFiles[folderName] = path.join(folder, file);
          // Create a copy of the manifest files in the root directory
        }
      }
    }
    return { files, folders, manifestFiles };
  } catch (err) {
    // Handle any errors
    console.error("Error reading directory:", err);
    return null;
  }
};

window.addManifestDetailsToDatasetStructure = async (
  datasetStructure,
  manifestFiles,
  problematicItems
) => {
  // Add the manifest files to the dataset structure
  if (manifestFiles.length == 0) {
    return datasetStructure;
  }

  const problematicFolders = problematicItems[1];
  const problematicFiles = problematicItems[2];

  let problematicFoldersObj = {};
  let problematicFilesObj = {};

  for (let folder of problematicFolders) {
    let primaryFolder = folder.split("/")[1];
    if (!problematicFoldersObj[primaryFolder]) {
      // There is already a problematic folder in this primary folder
      // Handle if there was a change to the folder
      problematicFoldersObj[primaryFolder] = [];
    }
    problematicFoldersObj[primaryFolder].push({
      path: folder,
      folder_name: path.basename(folder),
    });
  }

  for (let file of problematicFiles) {
    let primaryFolder = file["relativePath"].split("/")[1];
    let fileName = file["fileName"];
    if (!problematicFilesObj[primaryFolder]) {
      // There is already a problematic file in this primary folder
      // Handle if there was a change to the file
      problematicFilesObj[primaryFolder] = [];
    }
    problematicFilesObj[primaryFolder].push({
      path: file,
      file_name: fileName,
    });
  }

  // Open the manifest file and read the contents
  for (let folder in manifestFiles) {
    if (Object.keys(datasetStructure["dataset-structure"]["folders"]).includes(folder)) {
      // Get the manifest file path
      let manifestFilePath = manifestFiles[folder];

      // Read the contents of the manifest file
      try {
        let jsonManifest = await window.electron.ipcRenderer.invoke("excelToJsonSheet1Options", {
          sourceFile: manifestFilePath,
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        });

        for (let file in datasetStructure["dataset-structure"]["folders"][folder]["files"]) {
          if (file.includes("manifest.xlsx") || file.includes("manifest.csv")) {
            // delete key
            delete datasetStructure["dataset-structure"]["folders"][folder]["files"][file];
          }
        }

        jsonManifest.shift();
        let currentFolder = datasetStructure?.["dataset-structure"]?.["folders"]?.[folder];
        for (let manifest of jsonManifest) {
          let filename = manifest["filename"].split("/");
          if (filename.length == 1) {
            // update the dataset structure key
            // get the metadata already stored in the dataset structure
            let temp = currentFolder?.["files"]?.[filename[0]];
            if (temp == undefined) {
              // File might have been renamed
              // Check subfolders of currentFolder and see if any of the keys' value, action, includes "renamed"
              let keys = Object.keys(currentFolder["files"]);
              for (let key of keys) {
                if (currentFolder["files"][key]["action"].includes("renamed")) {
                  if (currentFolder["files"][key]["original-name"] == filename[0]) {
                    // The file has been renamed
                    // Get the new file name
                    filename[0] = currentFolder["files"][key]["new-name"];
                    break;
                  }
                }
              }
            }
            let metadata = currentFolder?.["files"]?.[filename[0]];
            if (metadata !== undefined) {
              let additionalMetadata = manifest["Additional Metadata"] || "";
              let description = manifest["description"] || "";
              let timestamp = manifest["timestamp"] || "";
              datasetStructure["dataset-structure"]["folders"][folder]["files"][filename[0]] = {
                action: ["new"],
                "additional-metadata": String(additionalMetadata),
                description: String(description),
                timestamp: String(timestamp),
                location: "local",
                extension: metadata.extension,
                path: metadata.path,
                extension: metadata.extension,
              };
            }

            if (Object.keys(manifest).length > 4) {
              // extra columns are present, ensure to preserve them in the data structure
              // iterate through the keys in manifest

              for (let key in manifest) {
                if (
                  key !== "filename" &&
                  key !== "timestamp" &&
                  key !== "description" &&
                  key !== "file type" &&
                  key !== "Additional Metadata"
                ) {
                  datasetStructure["dataset-structure"]["folders"][folder]["files"][filename[0]][
                    "extra_columns"
                  ] = { [key]: String(manifest[key]) };
                }
              }
            }
          } else {
            // within a subfolder
            // depending on the length of filename will determine how many folders deep to traverse
            // get the metadata already stored in the dataset structure

            if (
              Object.keys(problematicFilesObj).length > 0 &&
              Object.keys(problematicFilesObj).includes(folder)
            ) {
              // Therer is a problematic file in this primary folder
              // Handle if there was a change to the file
              for (let i = 0; i < problematicFilesObj[folder].length; i++) {}
            }

            if (
              Object.keys(problematicFoldersObj).length > 0 &&
              Object.keys(problematicFoldersObj).includes(folder)
            ) {
              // There is a problematic folder in this primary folder

              for (let i = 0; i < problematicFoldersObj[folder].length; i++) {}
            }

            let currentFolder = datasetStructure?.["dataset-structure"]?.["folders"]?.[folder];

            for (let i = 0; i < filename.length - 1; i++) {
              let fileName = filename[i];
              let temp = currentFolder?.["folders"]?.[fileName];
              if (temp == undefined) {
                // Folder might have been renamed
                // Check subfolders of currentFolder and see if any of the keys' value, action, includes "renamed"
                let keys = Object.keys(currentFolder["folders"]);
                for (let key of keys) {
                  if (currentFolder["folders"][key]["action"].includes("renamed")) {
                    if (currentFolder["folders"][key]["original-name"] == filename[i]) {
                      // The folder has been renamed
                      // Get the new folder name
                      fileName = currentFolder["folders"][key]["new-name"];
                      break;
                    }
                  }
                }
              }
              currentFolder = currentFolder?.["folders"]?.[fileName];
            }
            let temp = currentFolder?.["files"]?.[filename[filename.length - 1]];
            if (temp == undefined) {
              // File might have been renamed
              // Check subfolders of currentFolder and see if any of the keys' value, action, includes "renamed"
              let keys = Object.keys(currentFolder["files"]);
              for (let key of keys) {
                if (
                  currentFolder["files"]?.[key]?.["action"] !== undefined &&
                  currentFolder["files"]?.[key]?.["action"].includes("renamed")
                ) {
                  if (
                    currentFolder["files"][key]["original-name"] == filename[filename.length - 1]
                  ) {
                    // The file has been renamed
                    // Get the new file name
                    filename[filename.length - 1] = currentFolder["files"]?.[key]?.["new-name"];
                    break;
                  }
                }
              }
            }
            let metadata = currentFolder?.["files"]?.[filename[filename.length - 1]];
            if (currentFolder != undefined && metadata != undefined) {
              let additionalMetadata = manifest["Additional Metadata"] || "";
              let description = manifest["description"] || "";
              let timestamp = manifest["timestamp"] || "";
              currentFolder["files"][filename[filename.length - 1]] = {
                action: metadata.action,
                "additional-metadata": String(additionalMetadata),
                description: String(description),
                timestamp: String(timestamp),
                location: "local",
                extension: metadata.extension,
                path: metadata.path,
                extension: metadata.extension,
              };

              if (Object.keys(manifest).length > 4) {
                // extra columns are present, ensure to preserve them in the data structure
                // iterate through the keys in manifest
                for (let key in manifest) {
                  if (
                    key !== "filename" &&
                    key !== "timestamp" &&
                    key !== "description" &&
                    key !== "file type" &&
                    key !== "Additional Metadata"
                  ) {
                    currentFolder["files"][filename[filename.length - 1]]["extra_columns"] = {
                      [key]: String(manifest[key]),
                    };
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Error reading manifest file:", e);
      }
    }
  }

  return datasetStructure;
};

window.uploadDatasetClickHandler = async (ev) => {
  window.electron.ipcRenderer.send("open-file-dialog-upload-dataset");
};

window.handleLocalDatasetImport = async (path) => {
  const list = await getFilesAndFolders(path);
  const structure = await window.buildDatasetStructureJsonFromImportedData(
    list.folders,
    "dataset_root/", // Use dataset_root as the root folder since we are importing the root in this case
    true
  );

  window.sodaJSONObj["dataset-structure"] = structure[0];
  window.sodaJSONObj["dataset-structure"]["files"] = list.files;
  const forbiddenFileNames = [];
  const problematicFiles = [];
  const hiddenItems = [];

  for (let file in list.files) {
    const filesIsForbiddenFilesList = window.evaluateStringAgainstSdsRequirements(
      file,
      "is-forbidden-file"
    );
    if (filesIsForbiddenFilesList) {
      forbiddenFileNames.push(file);
    } else {
      const fileNameIsValid = window.evaluateStringAgainstSdsRequirements(
        file,
        "folder-or-file-name-is-valid"
      );

      if (!fileNameIsValid) {
        problematicFiles.push(file);
      }

      const fileIsHidden = window.evaluateStringAgainstSdsRequirements("file", "is-hidden-file");
      if (fileIsHidden) {
        hiddenItems.push(file);
      }
    }
  }

  // TODO: Handle dropped/renamed files in the manifest file
  if (forbiddenFileNames.length > 0) {
    await swalFileListSingleAction(
      forbiddenFileNames.map((file) => `dataset_root/${file}`),
      "Forbidden file names detected",
      "The files listed below do not comply with the SPARC data standards and will not be imported",
      false
    );

    const metadataFiles = Object.keys(window.sodaJSONObj["dataset-structure"]["files"]);
    for (let file of metadataFiles) {
      if (forbiddenFileNames.includes(file)) {
        delete window.sodaJSONObj["dataset-structure"]["files"][file];
      }
    }
  }

  if (problematicFiles.length > 0) {
    const userResponse = await swalFileListTripleAction(
      problematicFiles.map((file) => `dataset_root/${file}`),
      "<p>File name modifications</p>",
      `The files listed below contain the special characters "#", "&", "%", or "+"
      which are typically not recommended per the SPARC data standards.
      You may choose to either keep them as is, or replace the characters with '-'.
      `,
      "Replace the special characters with '-'",
      "Keep the file names as they are",
      "Cancel import",
      "What would you like to do with the files with special characters?"
    );

    if (userResponse === "confirm") {
      window.replaceProblematicFilesWithSDSCompliantNames(window.sodaJSONObj);
    }

    if (userResponse === "cancel") {
      throw new Error("Importation cancelled");
    }
  }

  if (hiddenItems.length > 0) {
    const userResponse = await swalFileListTripleAction(
      hiddenItems.map((file) => `dataset_root/${file}`),
      "<p>Hidden files detected</p>",
      `Hidden files are typically not recommend per the SPARC data standards, but you can choose to keep them if you wish.`,
      "Import the hidden files into SODA",
      "Do not import the hidden files",
      "Cancel import",
      "What would you like to do with the hidden files?"
    );

    if (userResponse === "deny") {
      window.removeHiddenFiles(window.sodaJSONObj["dataset-structure"]);
    }

    if (userResponse === "cancel") {
      throw new Error("Importation cancelled");
    }
  }

  // window.sodaJSONObj["metadata-files"] = list.files;
  window.sodaJSONObj["starting-point"]["local-path"] = path;
  // TODO: Add manfiest details to the dataset structure?
  // window.sodaJSONObj = await window.addManifestDetailsToDatasetStructure(
  //   window.sodaJSONObj,
  //   list.manifestFiles,
  //   builtDatasetStructure
  // );

  return true;
};

window.importLocalDataset = async (folderPath) => {
  // Reset the sodaJSONObj
  window.sodaJSONObj = {
    "ps-account-selected": {},
    "ps-dataset-selected": {},
    "dataset-structure": {},
    "metadata-files": {},
    "manifest-files": {},
    "generate-dataset": {},
    dataset_metadata: {
      manifest_file: [],
    },
    "starting-point": {
      origin: "local",
      "local-path": "",
    },
  };

  let moveForward = false;
  let valid_dataset = window.verifySparcFolder(folderPath, "local");

  if (valid_dataset) {
    moveForward = await window.handleLocalDatasetImport(folderPath);
  } else {
    Swal.fire({
      icon: "warning",
      html: `<div style="text-align: left;">
              This dataset is not following the SPARC Dataset Structure (SDS). It is expected that each of the high-level folders in this dataset is named after one of the SDS folders.
              <br/>
              See the "Data Organization" section of the SPARC documentation for more 
              <a target="_blank" href="https://docs.sparc.science/docs/sparc-dataset-structure">details</a>
              </div>`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: false,
      showCancelButton: true,
      focusCancel: true,
      cancelButtonText: "Okay",
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }

  if (moveForward) {
    document.getElementById("org-dataset-folder-path").innerHTML = folderPath;
    document.getElementById("nextBtn").disabled = false;
  }
};

window.electron.ipcRenderer.on(
  "selected-destination-upload-dataset",
  async (event, importedFolderPath) => {
    if (importedFolderPath.length > 0) {
      // Get the path of the first index
      let folderPath = importedFolderPath[0];

      await window.importLocalDataset(folderPath);
    }
  }
);

// Event listeners for buttons in step 2 of Organize Dataset
document.getElementById("confirm-account-workspace").addEventListener("click", async function () {
  const loadingDiv = document.querySelector("#upload-dataset-synchronizing-workspace-loading");
  const loadingDivText = document.querySelector(
    "#upload-dataset-synchronizing-workspace-loading-para"
  );
  const pennsieveAgentCheckDivId = "freeform-mode-post-account-confirmation-pennsieve-agent-check";
  const pennsieveAgentCheckDiv = document.getElementById(pennsieveAgentCheckDivId);
  // Hide the Pennsieve Agent check div
  pennsieveAgentCheckDiv.classList.add("hidden");

  try {
    let userInfo = await api.getUserInformation();
    let currentWorkspace = userInfo["preferredOrganization"];

    // check if we are in welcome workspace
    if (currentWorkspace === "N:organization:9ae9659b-2311-4d75-963e-0000aa055627") {
      await swalShowInfo(
        "Cannot Use the Welcome Workspace",
        "Please switch to a different workspace."
      );
      // If the user confirms the workspace and account, proceed to the next step
      document.getElementById("confirm-account-workspace").classList.add("soda-green-border");
      document
        .getElementById("confirm-account-workspace")
        .classList.remove("soda-green-background");
      document.getElementById("confirm-account-workspace").classList.remove("selected");
      document.getElementById("confirm-account-workspace").classList.add("not-selected");
      document.getElementById("confirm-account-workspace").classList.add("basic");

      return;
    }
  } catch (e) {
    await swalShowInfo(
      "Something went wrong while verifying your profile",
      "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
    );
    clientError(e);
  }

  try {
    loadingDiv.classList.remove("hidden");
    loadingDivText.textContent = "Verifying account...";
    await window.verifyProfile();
    loadingDivText.textContent = "Verifying workspace...";
    await window.synchronizePennsieveWorkspace();

    loadingDiv.classList.add("hidden");
  } catch (e) {
    clientError(e);
    await swalShowInfo(
      "Something went wrong while verifying your profile",
      "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
    );
    loadingDiv.classList.add("hidden");
    return;
  }
  try {
    pennsieveAgentCheckDiv.classList.remove("hidden");
    // Check to make sure the Pennsieve agent is installed
    let passed = await window.checkPennsieveAgent(pennsieveAgentCheckDivId);
    if (passed) document.getElementById("nextBtn").disabled = false;
  } catch (e) {
    console.error("Error with agent" + e);
  }

  // If the user confirms the workspace and account, proceed to the next step
  document.getElementById("confirm-account-workspace").classList.remove("soda-green-border");
  document.getElementById("confirm-account-workspace").classList.add("soda-green-background");
});

document
  .getElementById("dataset-upload-existing-dataset")
  .addEventListener("click", async function () {
    // EVENT CLICKER FOR EXISTING DATASET UPLOAD (UPLOAD DATASET WORKFLOW)
    // check if the user has already entered a dataset name in the input field
    let datasetName = document.getElementById("inputNewNameDataset-upload-dataset").value;
    if (datasetName !== "") {
      // confirm with the user if they want to lose their progress by switching to the other workflow
      let confirmSwitch = await swalConfirmAction(
        "warning",
        "Are you sure you want to switch to the existing dataset upload workflow?",
        "You will lose the progress you have made in the current workflow.",
        "Yes",
        "No"
      );

      if (!confirmSwitch) return;
    }

    // reset the dataset name input field
    document.getElementById("inputNewNameDataset-upload-dataset").value = "";
    //hide the confirm button
    $("#upload-dataset-btn-confirm-new-dataset-name").addClass("hidden");

    document.getElementById("Question-new-dataset-upload-name").classList.add("hidden");
    document.getElementById("existing-dataset-upload").classList.remove("hidden");

    document.getElementById("dataset-upload-new-dataset").classList.remove("checked");
    document.getElementById("dataset-upload-existing-dataset").classList.add("checked");

    $("#nextBtn").prop("disabled", true);
  });

document.getElementById("dataset-upload-new-dataset").addEventListener("click", async function () {
  if (await api.userIsWorkspaceGuest()) {
    swalShowInfo(
      "Guests cannot create datasets on Pennsieve",
      "You are currently a guest user in your workspace and do not have permission to create new datasets. If an empty dataset has already been created for you, select the 'Existing dataset' option."
    );
    return;
  }
  const dsName = document.getElementById("current-ps-dataset-generate").innerText;
  const existingCardChecked = document
    .getElementById("dataset-upload-existing-dataset")
    .classList.contains("checked");
  if (!["None", ""].includes(dsName) && existingCardChecked) {
    // confirm with the user if they want to lose their progress by switching to the other workflow
    const confirmSwitch = await swalConfirmAction(
      "warning",
      "Are you sure you want to switch to the new dataset upload workflow?",
      "You will lose the progress you have made in the current workflow.",
      "Yes",
      "No"
    );

    if (!confirmSwitch) return;

    $("#inputNewNameDataset-upload-dataset").val("");

    // reset the dataset name input field
    document.getElementById("current-ps-dataset-generate").textContent = "None";

    // TODO: REset sodaJSONObj here too
    // Remove checked state from all checkbox cards (input field inside the cards)
    document.getElementsByName("generate-5").forEach((element) => {
      // Reset state for folder cards
      element.checked = false;
    });

    document.getElementsByName("generate-6").forEach((element) => {
      // Reset state for file cards
      element.checked = false;
    });
    // Reset the merge option cards

    document.getElementById("replace-file-card").classList.remove("non-selected");
    document.getElementById("replace-file-card").classList.remove("checked");
    document.getElementById("skip-file-card").classList.remove("checked");
    document.getElementById("skip-file-card").classList.remove("non-selected");
  }
  document.getElementById("dataset-upload-new-dataset").classList.add("checked");
  document.getElementById("existing-dataset-upload").classList.add("hidden");
  document.getElementById("Question-new-dataset-upload-name").classList.remove("hidden");

  document.getElementById("dataset-upload-existing-dataset").classList.remove("checked");
  document.getElementById("Question-new-dataset-upload-name").classList.add("checked");

  // hide the existing folder options
  $("#Question-generate-dataset-existing-files-options").addClass("hidden");

  // disable the continue btn
  $("#nextBtn").prop("disabled", true);
});

document
  .getElementById("inputNewNameDataset-upload-dataset")
  .addEventListener("input", function (event) {
    document.getElementById("para-new-name-dataset-message").innerText = "";
    if (event.target.value != "") {
      let invalidName = window.check_forbidden_characters_ps(event.target.value);
      if (invalidName) {
        document.querySelector("#para-new-name-dataset-message").style.display = "flex";
        document.querySelector("#para-new-name-dataset-message").textContent =
          "A Pennsieve dataset name cannot contain any of the following characters: <>:/\\|?*";
        document
          .getElementById("upload-dataset-btn-confirm-new-dataset-name")
          .classList.add("hidden");
        return;
      }
      // Show the confirm button
      document
        .getElementById("upload-dataset-btn-confirm-new-dataset-name")
        .classList.remove("hidden");
      // document.querySelector("#para-new-name-dataset-message").style.display = "none";
    } else {
      document
        .getElementById("upload-dataset-btn-confirm-new-dataset-name")
        .classList.add("hidden");
      // document.querySelector("#para-new-name-dataset-message").style.display = "none";
    }
  });

document
  .getElementById("upload-dataset-btn-confirm-new-dataset-name")
  .addEventListener("click", async function () {
    // Once clicked, verify if the dataset name exists, if not warn the user that they need to choose a different name
    document
      .getElementById("upload-dataset-btn-confirm-new-dataset-name")
      .classList.add("loading-text");
    document.getElementById("upload-dataset-btn-confirm-new-dataset-name").classList.add("loading");
    let datasetName = document.getElementById("inputNewNameDataset-upload-dataset").value;
    let invalidName = window.check_forbidden_characters_ps(datasetName);
    if (invalidName) {
      document.querySelector("#para-new-name-dataset-message").style.display = "flex";
      document.querySelector("#para-new-name-dataset-message").textContent =
        "A Pennsieve dataset name cannot contain any of the following characters: <>:/\\|?*";
    }

    let datasetExists = await api.checkDatasetNameExists(datasetName);
    if (datasetExists) {
      document.querySelector("#para-new-name-dataset-message").style.display = "flex";
      document.querySelector("#para-new-name-dataset-message").textContent =
        "A dataset with this name already exists. Please choose a different name.";
    } else {
      document
        .getElementById("upload-dataset-btn-confirm-new-dataset-name")
        .classList.add("hidden");
      document.getElementById("nextBtn").disabled = false;
    }
    document
      .getElementById("upload-dataset-btn-confirm-new-dataset-name")
      .classList.remove("loading");
    document
      .getElementById("upload-dataset-btn-confirm-new-dataset-name")
      .classList.remove("loading-text");
  });

document.getElementById("change-account-btn").addEventListener("click", async function () {
  // If the user changes the account, show the dropdown prompt
  document.getElementById("confirm-account-workspace").classList.add("soda-green-border");
  document.getElementById("confirm-account-workspace").classList.remove("soda-green-background");
  await window.openDropdownPrompt(this, "ps");
  document.getElementById("change-account-btn").classList.add("basic");
  document.getElementById("change-account-btn").classList.remove("selected");
});

document.getElementById("change-workspace-btn").addEventListener("click", async function () {
  // If the user changes the workspace, show the dropdown prompt
  document.getElementById("confirm-account-workspace").classList.add("soda-green-border");
  document.getElementById("confirm-account-workspace").classList.remove("soda-green-background");
  await window.openDropdownPrompt(this, "organization");
  document.getElementById("change-workspace-btn").classList.add("basic");
  document.getElementById("change-workspace-btn").classList.remove("selected");

  // If the user has selected the existing dataset option, reset all progress up to the current page
  document.getElementById("existing-dataset-upload").classList.add("hidden");
  document.getElementById("current-ps-dataset-generate").innerText = "";
  document.getElementById("dataset-upload-existing-dataset").classList.remove("checked");
  document.getElementById("dataset-upload-new-dataset").classList.remove("checked");
  document.getElementById("inputNewNameDataset-upload-dataset").value = "";
  document.getElementById("button-confirm-ps-dataset").parentNode.style.display = "flex";
  document.getElementsByName("generate-5").forEach((element) => {
    element.checked = false;
  });
  // Remove checks from all the cards in step 3 (merge option cards)

  document.getElementById("replace-file-card").classList.remove("non-selected");
  document.getElementById("replace-file-card").classList.remove("checked");
  document.getElementById("skip-file-card").classList.remove("checked");
  document.getElementById("skip-file-card").classList.remove("non-selected");

  // Step 4
  if (document.getElementById("generate-manifest-curate").checked) {
    document.getElementById("generate-manifest-curate").click();
    // if the manifest_files folder exists in ~/SODA delete it
    if (window.fs.existsSync(window.path.join(window.os.homedir(), "SODA", "manifest_files"))) {
      window.fs.rmdirSync(window.path.join(window.os.homedir(), "SODA", "manifest_files"), {
        recursive: true,
      });
    }

    if (window.fs.existsSync(window.path.join(window.os.homedir(), "SODA", "manifest_file"))) {
      window.fs.rmdirSync(window.path.join(window.os.homedir(), "SODA", "manifest_file"), {
        recursive: true,
      });
    }

    // reset the manifest information in soda
    if (window.sodaJSONObj["dataset_metadata"]["manifest_file"]) {
      window.sodaJSONObj["dataset_metadata"]["manifest_file"] = [];
    }
  }

  // reset the dataset name input field
  document.getElementById("inputNewNameDataset-upload-dataset").value = "";
  document.getElementById("Question-new-dataset-upload-name").classList.add("hidden");
  $("#upload-dataset-btn-confirm-new-dataset-name").addClass("hidden");

  // get every input with name="generate-5" and remove the checked property
  let inputs = document.querySelectorAll('input[name="generate-5"]');
  inputs.forEach((input) => {
    input.checked = false;
    input.classList.remove("checked");
  });
  document.getElementById("current-ps-dataset-generate").textContent = "None";
  // hide the existing folder/files options
  $("#Question-generate-dataset-existing-files-options").addClass("hidden");
  $("#please-wait-new-curate-div").show();

  $("#existing-dataset-upload").addClass("hidden");
  $("#Question-generate-dataset-ps-dataset-options").addClass("hidden");
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
  if (curationMode === "guided-getting-started") {
    curationMode = "guided";
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
        window.log.info(`Importing Data Deliverables document: ${filepath}`);
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
              window.sodaJSONObj["dataset_metadata"]["code-metadata"][metadataFileType] = file.path;
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
      window.log.error(error);
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
    // window.highLevelFoldersDisableOptions();
  } else {
    datasetStructureJSONObj = { folders: {}, files: {}, type: "" };
  }
};

const importGenerateDatasetStep = async () => {
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
      $("#input-destination-generate-dataset-locally").val(
        window.sodaJSONObj["generate-dataset"]["path"]
      );
      $("#btn-confirm-local-destination").click();
      $("#inputNewNameDataset").val(window.sodaJSONObj["generate-dataset"]["dataset-name"]);
      $("#btn-confirm-new-dataset-name").click();
    } else if (window.sodaJSONObj["generate-dataset"]["destination"] === "ps") {
      $("#generate-upload-ps").prop("checked", true);
      $($("#generate-upload-ps").parents()[2]).click();
      // Step 2: if generate on ps, choose ps account
      if (
        "ps-account-selected" in window.sodaJSONObj &&
        window.sodaJSONObj["ps-account-selected"]["account-name"] !== ""
      ) {
        let bfAccountSelected = window.sodaJSONObj["ps-account-selected"]["account-name"];
        if (bfAccountSelected != window.defaultBfDataset) {
          return;
        }
        $("#current-ps-account-generate").text(bfAccountSelected);
        $("#para-account-detail-curate").html("");

        try {
          window.log.info(`Loading account details for ${bfAccountSelected}`);
          await client.get(`/manage_datasets/bf_account_details`, {
            params: {
              selected_account: bfAccountSelected,
            },
          });
          window.updateBfAccountList();
        } catch (error) {
          clientError(error);
          showHideDropdownButtons("account", "hide");
        }

        $("#btn-ps-account").trigger("click");
        // Step 3: choose to generate on an existing or new dataset
        if (
          "ps-dataset-selected" in window.sodaJSONObj &&
          window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] !== ""
        ) {
          $("#generate-ps-dataset-options-existing").prop("checked", true);
          $($("#generate-ps-dataset-options-existing").parents()[2]).click();
          let bfDatasetSelected = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];
          setTimeout(() => {
            let valid_dataset = false;
            for (const index in window.datasetList) {
              if (bfDatasetSelected == window.datasetList[index]["name"]) {
                valid_dataset = true;
              }
            }
            if (valid_dataset == false) {
              return;
            }
            $("#current-ps-dataset-generate").text(bfDatasetSelected);
            $("#button-confirm-ps-dataset").click();
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
          $("#generate-ps-dataset-options-new").prop("checked", true);
          $($("#generate-ps-dataset-options-new").parents()[2]).click();
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
      importGenerateDatasetStep();
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
      importGenerateDatasetStep();
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

  $("#ps-dataset-select-header").css("display", "none");
  $("#curatebfdatasetlist").selectpicker("hide");
  $("#curatebfdatasetlist").selectpicker("refresh");
  $(".selectpicker").selectpicker("hide");
  $(".selectpicker").selectpicker("refresh");
  $("#ps-dataset-select-div").hide();

  // var datasetPermission = $("#select-permission-list-2").val();
  var bfacct = $("#current-ps-account").text();

  if (bfacct === "None") {
    $("#para-filter-datasets-status-2").html(
      "<span style='color:red'>Please select a Pennsieve account first!</span>"
    );
    $(datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");

    //$("#ps-dataset-select-header").css("display", "block")
    $("#curatebfdatasetlist").selectpicker("show");
    $("#curatebfdatasetlist").selectpicker("refresh");
    $(".selectpicker").selectpicker("show");
    $(".selectpicker").selectpicker("refresh");
    $("#ps-dataset-select-div").show();
  } else {
    $("#curatebfdatasetlist").selectpicker("render");
    updateDatasetList(bfacct);
  }
});

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

  // New
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

window.moveItems = async (ev) => {
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

// PRE-REQ: Happens after the dataset name has been selected
window.ffmCreateManifest = async () => {
  let datasetStructure = window.sodaJSONObj["dataset-structure"];

  let manifestStructure = [];

  // recursively go through the dataset structure
  const createManifestStructure = async (
    datasetStructure,
    manifestStructure,
    parentFolder = ""
  ) => {
    for (const folder in datasetStructure["folders"]) {
      let folderName = parentFolder ? `${parentFolder}/${folder}` : folder;
      const statsObj = await window.fs.stat(datasetStructure["folders"][folder]["path"]);
      const timeStamp = statsObj.mtime.toISOString();
      manifestStructure.push({
        filename: folderName,
        timestamp: timeStamp,
        description: "",
        file_type: "folder",
        entity: "",
        data_modality: "",
        also_in_dataset: "",
        also_in_dataset_path: "",
        data_dictionary_path: "",
        entity_is_transitive: "",
        additional_metadata: "",
      });
      createManifestStructure(datasetStructure["folders"][folder], manifestStructure, folderName);
    }

    for (const file in datasetStructure["files"]) {
      let filePath = parentFolder ? `${parentFolder}/${file}` : file;
      // get timestamp of the file at the given path
      const statsObj = await window.fs.stat(datasetStructure["files"][file]["path"]);
      const timeStamp = statsObj.mtime.toISOString();
      const fileExtension = window.path.extname(datasetStructure["files"][file]["path"]);

      manifestStructure.push({
        filename: filePath,
        timestamp: timeStamp,
        description: "",
        file_type: fileExtension,
        entity: "",
        data_modality: "",
        also_in_dataset: "",
        also_in_dataset_path: "",
        data_dictionary_path: "",
        entity_is_transitive: "",
        additional_metadata: "",
      });
    }
  };

  await createManifestStructure(datasetStructure, manifestStructure);

  return manifestStructure;
};

window.openmanifestEditSwal = async () => {
  let existingManifestData = {};
  try {
    let pathToManifest = window.path.join(
      window.homeDirectory,
      "SODA",
      "manifest_files",
      "manifest.xlsx"
    );

    // create file path if it does not exist
    if (!window.fs.existsSync(pathToManifest)) {
      window.fs.mkdirSync(window.path.dirname(pathToManifest), { recursive: true });
    }

    try {
      await client.post("/prepare_metadata/manifest", {
        soda: window.sodaJSONObj,
        path_to_manifest_file: pathToManifest,
        upload_boolean: false,
      });
    } catch (error) {
      clientError(error);
    }

    existingManifestData = await client.get(
      `/prepare_metadata/manifest?path_to_manifest_file=${pathToManifest}`
    );
    existingManifestData = existingManifestData.data;
  } catch (error) {
    clientError(error);
    return;
  }

  window.electron.ipcRenderer.invoke("spreadsheet", existingManifestData);

  //upon receiving a reply of the spreadsheet, handle accordingly
  window.electron.ipcRenderer.on("spreadsheet-reply", async (event, result) => {
    if (!result || result === "") {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
      return;
    } else {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");

      window.sodaJSONObj["manifest-files"] = { headers: result[0], data: result[1] };
      // load the updated data values into the dataset_metadata object
      const newManifestData = [];
      for (let dataIdx = 0; dataIdx < result[1].length; dataIdx++) {
        const newRow = {};
        for (let headerIdx = 0; headerIdx < result[0].length; headerIdx++) {
          newRow[result[0][headerIdx].replace(/ /g, "_")] = result[1][dataIdx][headerIdx];
        }
        newManifestData.push(newRow);
      }
      window.sodaJSONObj["dataset_metadata"]["manifest_file"] = newManifestData;
    }
  });
};

// TODO: Revisit
$("#generate-manifest-curate").change(async function () {
  if (this.checked) {
    //display manifest generator UI here
    $("#manifest-creating-loading").removeClass("hidden");

    $("#ffm-manifest-generator").show();
    let manifestStructure = await window.ffmCreateManifest();
    if (!window.sodaJSONObj["dataset_metadata"]) {
      window.sodaJSONObj["dataset_metadata"] = {};
    }
    window.sodaJSONObj["dataset_metadata"]["manifest_file"] = manifestStructure;
    // For the back end to know the manifest files have been created in $HOME/SODA/manifest-files/<highLvlFolder>
    // window.sodaJSONObj["manifest-files"]["auto-generated"] = true;
    $("#manifest-creating-loading").addClass("hidden");

    document.getElementById("manifest-information-container").classList.remove("hidden");
    document
      .getElementById("ffm-container-local-manifest-file-generation")
      .classList.remove("hidden");
    document.getElementById("manifest-items-container").classList.remove("hidden");
  } else {
    $("#ffm-manifest-generator").hide();
    $("#manifest-creating-loading").addClass("hidden");
    // document.getElementById("ffm-container-manifest-file-cards").innerHTML = "";
    if (window.sodaJSONObj["manifest-files"]?.["destination"]) {
      delete window.sodaJSONObj["manifest-files"]["destination"];
    }
    if (window.sodaJSONObj["manifest-files"]?.["auto-generated"]) {
      delete window.sodaJSONObj["manifest-files"]["auto-generated"];
    }
    document.getElementById("ffm-container-local-manifest-file-generation").classList.add("hidden");
    document.getElementById("manifest-information-container").classList.add("hidden");
    document.getElementById("manifest-items-container").classList.add("hidden");
  }
});
