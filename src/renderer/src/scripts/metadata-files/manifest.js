import client from "../client";
import determineDatasetLocation, { Destinations } from "../analytics/analytics-utils";
import Swal from "sweetalert2";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import api from "../others/api/api";
import fileTxt from "/img/txt-file.png";
import filePng from "/img/png-file.png";
import filePdf from "/img/pdf-file.png";
import fileCsv from "/img/csv-file.png";
import fileDoc from "/img/doc-file.png";
import fileXlsx from "/img/excel-file.png";
import fileJpeg from "/img/jpeg-file.png";
import fileOther from "/img/other-file.png";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let openedEdit = false;

// opendropdown event listeners
document.querySelectorAll(".manifest-change-current-account").forEach((element) => {
  element.addEventListener("click", () => {
    window.openDropdownPrompt(null, "ps");
  });
});

document.querySelectorAll(".manifest-change-current-ds").forEach((element) => {
  element.addEventListener("click", () => {
    window.openDropdownPrompt(null, "dataset");
  });
});

const jstreePreviewManifest = document.getElementById("div-dataset-tree-preview-manifest");

const guidedJsTreePreviewManifest = document.getElementById(
  "guided-div-dataset-tree-preview-manifest"
);

window.showLocalDatasetManifest = () => {
  window.electron.ipcRenderer.send("open-file-dialog-local-dataset-manifest-purpose");
};

window.selectManifestGenerationLocation = () => {
  window.electron.ipcRenderer.send("open-file-dialog-local-dataset-manifest-generate-purpose");
};

const openDirectoryAtManifestGenerationLocation = (generationLocation) => {
  openFolder(generationLocation);
  return;
};

const openFolder = (generationLocation) => {
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
};

$(document).ready(async function () {
  let localDataSetImport = false;
  let fileOpenedOnce = {};
  window.electron.ipcRenderer.on("selected-local-dataset-manifest-purpose", (event, folderPath) => {
    if (folderPath.length > 0) {
      if (folderPath !== null) {
        localDataSetImport = true;
        fileOpenedOnce = {};
        document.getElementById("input-manifest-local-folder-dataset").placeholder = folderPath[0];
        localDatasetFolderPath = folderPath[0];
        $("#div-confirm-manifest-local-folder-dataset").css("display", "flex");
        document
          .getElementById("confirm-local-manifest-folder-adv-feature")
          .classList.remove("hidden");
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

  window.electron.ipcRenderer.on(
    "selected-local-dataset-manifest-generate-purpose",
    (event, folderPath) => {
      if (folderPath.length <= 0 || folderPath === null) {
        document.getElementById("input-manifest-local-gen-location").placeholder = "Browse here";
        return;
      }

      document.getElementById("input-manifest-local-gen-location").placeholder = folderPath[0];
    }
  );

  $("#bf_dataset_create_manifest").on("DOMSubtreeModified", () => {
    if ($("#bf_dataset_create_manifest").text().trim() !== "None") {
      $("#div-check-bf-create-manifest").css("display", "flex");
      document.querySelector("#btn-confirm-dataset-manifest-page").classList.remove("hidden");

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

  //Event listener for the jstree to open manifest files
  $(jstreePreviewManifest).on("select_node.jstree", async function (evt, data) {
    // Check if pennsieve option was selected to reset localDataSetImport
    if (document.getElementById("pennsieve-option-create-manifest").classList.contains("checked")) {
      localDataSetImport = false;
    }

    // Check if the selected file is a manifest file
    // If there's already an opened manifest file, don't open another one
    if (data.node.text === "manifest.xlsx") {
      if (openedEdit) {
        return;
      }

      openedEdit = true;
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
      if (!fileOpenedOnce?.[parentFolderName]) {
        fileOpenedOnce[parentFolderName] = true;
      }

      // TODO: Check if this is needed everytime
      var localFolderPath = window.path.join(
        window.homeDirectory,
        "SODA",
        "manifest_files",
        parentFolderName
      );
      var selectedManifestFilePath = window.path.join(localFolderPath, "manifest.xlsx");
      if (window.fs.existsSync(selectedManifestFilePath)) {
        let jsonManifest = await window.electron.ipcRenderer.invoke("excelToJsonSheet1Options", {
          sourceFile: selectedManifestFilePath,
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        });
      }

      window.sodaCopy = window.sodaJSONObj;
      let datasetStructCopy = window.sodaCopy["dataset-structure"];

      //Save content of manifest file to a variable to add to soda json at the end
      let originalManifestFilesValue = window.sodaCopy["manifest-files"];
      window.sodaCopy["manifest-files"] = {};

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
        userErrorMessage(e);
      }

      // manifest will still include pennsieve or locally imported files
      // deleted to prevent from showing up as manifest card
      if (window.sodaCopy["manifest-files"]?.["destination"]) {
        delete window.sodaCopy["manifest-files"]["destination"];
      }

      // create manifest data of all high level folders
      try {
        const res = await client.post(
          `/curate_datasets/generate_manifest_file_data`,
          {
            dataset_structure_obj: datasetStructCopy,
          },
          { timeout: 0 }
        );

        // loop through each of the high level folders and create excel sheet in case no edits are made
        // will be auto generated and ready for upload
        const manifestRes = res.data;
        let newManifestData = {};

        // Format response for
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

        // Check if dataset is local or pennsieve
        // If local then we need to read the excel file and create a json object
        let highLvlFolderNames = [];
        if (localDataSetImport && !fileOpenedOnce?.[parentFolderName]) {
          // get the paths of the manifest files that were imported locally
          let manifestPaths = [];
          for (const [highLevelFolderName, folderData] of Object.entries(
            window.sodaCopy["dataset-structure"]["folders"]
          )) {
            for (const [fileName, fileData] of Object.entries(folderData["files"])) {
              if (fileName === "manifest.xlsx") {
                manifestPaths.push(window.path.join(folderData["path"], fileName));
                highLvlFolderNames.push(highLevelFolderName);
              }
            }
          }

          if (manifestPaths.length > 0) {
            window.sodaCopy["manifest-files"] = {};

            for (const manifestPath of manifestPaths) {
              let manifestData = [];
              let highLevelFolderName = window.path.basename(window.path.dirname(manifestPath));

              if (!window.fs.existsSync(manifestPath)) {
                // If manifest file doesn't exist then newManifestData will be used
                // No old manifest to compare to
                window.sodaCopy["manifest-files"][highLevelFolderName] =
                  newManifestData[highLevelFolderName];
              } else {
                let jsonManifest = await window.electron.ipcRenderer.invoke(
                  "excelToJsonSheet1Options",
                  {
                    sourceFile: manifestPath,
                    sheets: [{ name: "Sheet1" }],
                    header: {
                      rows: 0,
                    },
                    includeEmptyLines: true,
                  }
                );

                let alphabet = [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "K",
                  "L",
                  "M",
                  "N",
                  "O",
                  "P",
                  "Q",
                  "R",
                  "S",
                  "T",
                  "U",
                  "V",
                  "W",
                  "X",
                  "Y",
                  "Z",
                ];
                let manifestHeader = Object.values(jsonManifest["Sheet1"][0]);

                alphabet = alphabet.slice(0, manifestHeader.length);

                // Go through response and fill in empty cells with empty string
                for (let j = 1; j < jsonManifest["Sheet1"].length; j++) {
                  for (let i = 0; i < alphabet.length; i++) {
                    let cellEntry = jsonManifest["Sheet1"][j][alphabet[i]];
                    if (cellEntry === undefined) {
                      jsonManifest["Sheet1"][j][alphabet[i]] = "";
                    }
                  }
                  manifestData.push(Object.values(jsonManifest["Sheet1"][j]));
                }

                // Header and data should be formatted correctly

                window.processManifestInfo(manifestHeader, manifestData);
                window.sodaCopy["manifest-files"][highLevelFolderName] = {
                  headers: manifestHeader,
                  data: manifestData,
                };
              }
            }
          }
        }

        // Check if manifest data is different from what exists already (if previous data exists)
        const existingManifestData = window.sodaCopy["manifest-files"];
        let updatedManifestData;

        if (existingManifestData) {
          updatedManifestData = window.diffCheckManifestFiles(
            newManifestData,
            existingManifestData
          );
        } else {
          updatedManifestData = newManifestData;
        }

        // manifest data will be stored in window.sodaCopy to be reused for manifest edits/regenerating cards
        // window.sodaJSONObj will remain the same and only have 'additonal-metadata' and 'description' data
        window.sodaCopy["manifest-files"] = updatedManifestData;

        // below needs to be added added before the main_curate_function begins
        window.sodaJSONObj["manifest-files"] = originalManifestFilesValue;
      } catch (err) {
        clientError(err);
        console.log(err);
        userErrorMessage(err);
      }

      //Create child window here
      // const existingManifestData = window.sodaJSONObj["guided-manifest-file-data"][highLevelFolderName];
      //send manifest data to main.js to then send to child window
      const existingManifestData = window.sodaCopy["manifest-files"]?.[parentFolderName];
      Swal.close();
      // TODO: Lock all other manifest buttons
      window.electron.ipcRenderer.invoke("spreadsheet", existingManifestData);

      //upon receiving a reply of the spreadsheet, handle accordingly
      window.electron.ipcRenderer.on("spreadsheet-reply", async (event, result) => {
        openedEdit = false;
        if (!result || result === "") {
          window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
          return;
        } else {
          //spreadsheet reply contained results
          window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
          let saveManifestFiles = true;
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
              parentFolderName
            );
            let selectedManifestFilePath = window.path.join(localFolderPath, "manifest.xlsx");

            if (!window.fs.existsSync(localFolderPath)) {
              // create the manifest folder if it doesn't exist
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
            // If extra columns are added preserve them into window.sodaJSONObj
            for (let i = 0; i < savedData.length; i++) {
              let fileName = savedData[i][0];
              if (fileName == "" || fileName == undefined) {
                // fileName is blank if user accidentally adds a new row and does not remove it
                continue;
              }
              let cleanedFileName = "";
              let fileNameSplit = fileName.split("/");
              let description = savedData[i][2];
              let additionalMetadata = savedData[i][4];

              if (fileNameSplit[0] === "") {
                //not in a subfolder
                cleanedFileName = fileNameSplit[1];
                window.sodaCopy["dataset-structure"]["folders"][parentFolderName]["files"][
                  cleanedFileName
                ]["description"] = description;
                window.sodaJSONObj["dataset-structure"]["folders"][parentFolderName]["files"][
                  cleanedFileName
                ]["description"];
                window.sodaCopy["dataset-structure"]["folders"][parentFolderName]["files"][
                  cleanedFileName
                ]["additional-metadata"] = additionalMetadata;
                window.sodaJSONObj["dataset-structure"]["folders"][parentFolderName]["files"][
                  cleanedFileName
                ]["additional-metadata"] = additionalMetadata;
                if (savedHeaders[i].length > 5) {
                  //extra columns are present, ensure to preserve them in window.sodaJSONObj
                  for (let extra_column_index = 5; extra_column_index < savedHeaders.length; i++) {
                    let extraColumnName = savedHeaders[extra_column_index];

                    window.sodaJSONObj["dataset-structure"]["folders"][parentFolderName]["files"][
                      cleanedFileName
                    ]["extra_columns"] = {
                      [extraColumnName]: [savedData[i][extra_column_index]],
                    };
                  }
                }
              } else {
                // is in a subfolder so search for it and update metadata
                // need to add description and additional metadata to original window.sodaJSONObj
                let folderDepthCopy =
                  window.sodaCopy["dataset-structure"]["folders"][parentFolderName];
                let folderDepthReal =
                  window.sodaJSONObj["dataset-structure"]["folders"][parentFolderName];
                for (let j = 0; j < fileNameSplit.length; j++) {
                  if (j === fileNameSplit.length - 1) {
                    folderDepthCopy["files"][fileNameSplit[j]]["description"] = description;
                    folderDepthReal["files"][fileNameSplit[j]]["description"] = description;
                    folderDepthCopy["files"][fileNameSplit[j]]["additional-metadata"] =
                      additionalMetadata;
                    folderDepthReal["files"][fileNameSplit[j]]["additional-metadata"] =
                      additionalMetadata;

                    if (savedData[i].length > 5) {
                      //extra columns are present, ensure to preserve them in window.sodaJSONObj
                      for (
                        let extra_column_index = 5;
                        extra_column_index < savedHeaders.length;
                        extra_column_index++
                      ) {
                        folderDepthReal["files"][fileNameSplit[j]]["extra_columns"] = {
                          [savedHeaders[extra_column_index]]: savedData[i][extra_column_index],
                        };
                      }
                    }
                  } else {
                    folderDepthCopy = folderDepthCopy["folders"][fileNameSplit[j]];
                    folderDepthReal = folderDepthReal["folders"][fileNameSplit[j]];
                  }
                }
              }
            }

            window.sodaJSONObj["manifest-files"] = originalManifestFilesValue;

            window.sodaCopy["manifest-files"][parentFolderName] = {
              headers: savedHeaders,
              data: savedData,
            };
          }
        }
      });
    }
  });

  $(guidedJsTreePreviewManifest).on("select_node.jstree", async function (evt, data) {
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
      var localFolderPath = window.path.join(
        homeDirectory,
        "SODA",
        "Guided-Manifest-Files",
        window.sodaJSONObj["digital-metadata"]["name"],
        parentFolderName
      );
      var selectedManifestFilePath = window.path.join(localFolderPath, "manifest.xlsx");
      jsonManifest = await window.electron.ipcRenderer.invoke("excelToJsonSheet1Options", {
        sourceFile: selectedManifestFilePath,
        columnToKey: {
          "*": "{{columnHeader}}",
        },
      });
    }
  });
});

// function that removes hidden class from js element by id and smooth scrolls to it
window.unHideAndSmoothScrollToElement = (id) => {
  let elementToUnhideAndScrollTo = document.getElementById(id);
  elementToUnhideAndScrollTo.classList.remove("hidden");
  elementToUnhideAndScrollTo.scrollIntoView({
    behavior: "smooth",
  });
};

window.smoothScrollToElement = (idOrElement, block = "start", inline = "nearest") => {
  //check if idOrElement is an element
  if (typeof idOrElement === "string") {
    let elementToScrollTo = document.getElementById(idOrElement);
    elementToScrollTo.scrollIntoView({
      behavior: "smooth",
      block: block,
      inline: inline,
    });
  } else {
    idOrElement.scrollIntoView({
      behavior: "smooth",
      block: block,
      inline: inline,
    });
  }
};

window.processManifestInfo = (headers, data) => {
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

window.convertJSONToXlsx = async (jsondata, excelfile) => {
  await window.electron.ipcRenderer.invoke("convertJSONToSxlsx", jsondata, excelfile);
};

const determineStandaloneManifestGeneratorOrigin = () => {
  const selectedCardCreateManifest = $('input[name="generate-manifest-1"]:checked').prop("id");
  return selectedCardCreateManifest === "generate-manifest-from-Penn" ? "ps" : "local";
};

var localDatasetFolderPath = "";
window.finalManifestGenerationPath = "";
let pennsievePreview = false;

window.generateManifestPrecheck = async (manifestEditBoolean, ev) => {
  Swal.fire({
    title: "Preparing to generate the manifest.xlsx file(s)",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  });
  let continueProgressValidateDataset = true;
  let titleTerm = "folder";
  let localGenerationDifferentDestination = false;
  let localDatasetPath = document.querySelector("#input-manifest-local-folder-dataset").placeholder;
  let localManifestGeneratePath = document.querySelector(
    "#input-manifest-local-gen-location"
  ).placeholder;
  pennsievePreview = false;
  const type = determineStandaloneManifestGeneratorOrigin();

  window.sodaJSONObj["starting-point"] = {};
  window.sodaJSONObj["dataset-structure"] = {};
  window.datasetStructureJSONObj = { folders: {}, files: {} };
  window.sodaJSONObj["metadata-files"] = {};

  if (type === "ps") {
    titleTerm = "on Pennsieve";
  } else if (type != "ps" && !pennsievePreview) {
    continueProgressValidateDataset = validateSPARCdataset();

    if (!continueProgressValidateDataset) {
      return;
    }
  }

  if (localManifestGeneratePath !== localDatasetPath) {
    // A local dataset folder has been selected that is different from the destination folder for the manifest file
    localGenerationDifferentDestination = true;
  }

  await window.wait(500);
  if (!localGenerationDifferentDestination) {
    // Check if dataset is locked before generating manifest
    const isLocked = await api.isDatasetLocked(window.defaultBfDataset);

    if (isLocked) {
      await Swal.fire({
        icon: "info",
        title: `${window.defaultBfDataset} is locked from editing`,
        html: `
          This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
          <br />
          <br />
          If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>
        `,
        width: 600,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        focusConfirm: true,
        allowOutsideClick: false,
      });
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
  }).then(() => {});

  await generateManifest("", type, manifestEditBoolean, ev);

  return;
};

const generateManifest = async (action, type, manifestEditBoolean, ev) => {
  // Case 1: Local dataset
  if (type === "local") {
    if (window.finalManifestGenerationPath === "") {
      let localManifestGeneratePath = document.querySelector(
        "#input-manifest-local-gen-location"
      ).placeholder;
      window.finalManifestGenerationPath = localManifestGeneratePath;
    }
    window.sodaJSONObj["starting-point"]["local-path"] = window.finalManifestGenerationPath;

    let freeMem = await window.electron.ipcRenderer.invoke(
      "getDiskSpace",
      window.finalManifestGenerationPath
    );

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
      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.LOCAL
      );

      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ACTION,
        "Generate - Check Storage Space",
        Destinations.LOCAL
      );
    } else {
      if (pennsievePreview) {
        generateAfterEdits();
        return;
      }

      window.logMetadataForAnalytics(
        "Success",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ACTION,
        "Generate - Check Storage Space",
        Destinations.LOCAL
      );

      window.sodaJSONObj["starting-point"]["origin"] = "local";
      // if the manifest is going to be recreated post edits
      if (manifestEditBoolean) {
        localDatasetFolderPath = $("#input-manifest-local-folder-dataset").attr("placeholder");
      }
      await window.create_json_object(action, window.sodaJSONObj, localDatasetFolderPath);
      window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
      window.populate_existing_folders(window.datasetStructureJSONObj);
      window.populate_existing_metadata(window.sodaJSONObj);
      window.sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
      window.sodaJSONObj["ps-account-selected"] = {};
      window.sodaJSONObj["ps-dataset-selected"] = {};
      window.sodaJSONObj["generate-dataset"] = {};
      // check for empty folders/sub-folders
      let continueProgressEmptyFolder = await checkEmptySubFolders(
        window.sodaJSONObj["dataset-structure"]
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
        }).then(() => {});

        // log the error to analytics
        window.logMetadataForAnalytics(
          "Error",
          window.MetadataAnalyticsPrefix.MANIFEST,
          window.AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          Destinations.LOCAL
        );
        $("#div-confirm-manifest-local-folder-dataset").hide();
        return;
      }

      // check for no SPARC folders on a Pennsieve datasets (already include check for a local dataset)
      let continueProgressNoSPARCFolders = await checkNoSparcFolders(
        window.sodaJSONObj["dataset-structure"]
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
        }).then(() => {});
        // log the error to analytics
        window.logMetadataForAnalytics(
          "Error",
          window.MetadataAnalyticsPrefix.MANIFEST,
          window.AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          Destinations.LOCAL
        );
        $("#div-confirm-manifest-local-folder-dataset").hide();
        return;
      }

      // check for invalid high level folders in a dataset
      let continueProgressInvalidFolders = await checkInvalidHighLevelFolders(
        window.sodaJSONObj["dataset-structure"]
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
        }).then(() => {});
        // log the error to analytics
        window.logMetadataForAnalytics(
          "Error",
          window.MetadataAnalyticsPrefix.MANIFEST,
          window.AnalyticsGranularity.ALL_LEVELS,
          "Generate",
          Destinations.LOCAL
        );
        $("#div-confirm-manifest-local-folder-dataset").hide();
        return;
      }
      await generateManifestHelper();
      await initiate_generate_manifest_local(manifestEditBoolean, localDatasetFolderPath);
    }
  } else {
    // Case 2: bf dataset
    if (manifestEditBoolean) {
      generateAfterEdits();
    } else {
      window.sodaJSONObj["ps-account-selected"] = { "account-name": window.defaultBfAccount };
      window.sodaJSONObj["ps-dataset-selected"] = { "dataset-name": window.defaultBfDataset };
      extractBFDatasetForManifestFile(false, window.defaultBfAccount, window.defaultBfDataset, ev);
    }
  }
};

const generateManifestHelper = async () => {
  updateJSONStructureManifestGenerate();
  // now call the upload function including generating the manifest file(s)
  if (window.sodaJSONObj["starting-point"]["origin"] === "local") {
    window.sodaJSONObj["starting-point"]["origin"] = "new";
  }
  let dataset_destination = "";

  if ("ps-dataset-selected" in window.sodaJSONObj) {
    dataset_destination = "Pennsieve";
  } else if ("generate-dataset" in window.sodaJSONObj) {
    if ("destination" in window.sodaJSONObj["generate-dataset"]) {
      let destination = window.sodaJSONObj["generate-dataset"]["destination"];
      if (destination == "local") {
        dataset_destination = "Local";
      }
      if (destination == "ps") {
        dataset_destination = "Pennsieve";
      }
    }
  }
  if (dataset_destination == "Pennsieve") {
    let supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      $("#sidebarCollapse").prop("disabled", false);
      return;
    }
  }
};

window.generateManifestPreview = async () => {
  // open a file dialog so the user can select their dataset folder
  window.electron.ipcRenderer.send("open-folder-dialog-save-manifest-local");
};

window.electron.ipcRenderer.on("selected-manifest-folder", async (event, result) => {
  if (!result["canceled"]) {
    $("body").addClass("waiting");
    let manifest_destination = result["filePaths"][0];

    if ("manifest-files" in window.sodaJSONObj) {
      window.sodaJSONObj["manifest-files"]["local-destination"] = manifest_destination;
    } else {
      window.sodaJSONObj["manifest-files"] = {};
      window.sodaJSONObj["manifest-files"]["local-destination"] = manifest_destination;
    }

    window.delete_imported_manifest();

    let temp_sodaJSONObj = JSON.parse(JSON.stringify(window.sodaJSONObj));

    recursive_remove_deleted_files(temp_sodaJSONObj["dataset-structure"]);

    try {
      await client.post(
        `/curate_datasets/manifest_files`,
        {
          generate_purpose: "",
          soda_json_object: temp_sodaJSONObj,
        },
        { timeout: 0 }
      );

      $("body").removeClass("waiting");
      window.logCurationForAnalytics(
        "Success",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 5", "Generate", "Manifest"],
        determineDatasetLocation()
      );
    } catch (error) {
      clientError(error);
      $("body").removeClass("waiting");

      // log the error to analytics
      window.logCurationForAnalytics(
        "Error",
        window.PrepareDatasetsAnalyticsPrefix.CURATE,
        window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 5", "Generate", "Manifest"],
        determineDatasetLocation()
      );
    }
  }
});

const recursive_remove_deleted_files = (dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let item in dataset_folder["files"]) {
      if (dataset_folder["files"][item]["action"].includes("deleted")) {
        delete dataset_folder["files"][item];
      }
    }
  }

  if ("folders" in dataset_folder) {
    for (let item in dataset_folder["folders"]) {
      recursive_remove_deleted_files(dataset_folder["folders"][item]);
      if (dataset_folder["folders"][item]["action"].includes("deleted")) {
        delete dataset_folder["folders"][item];
      }
    }
  }
};

const updateJSONStructureManifestGenerate = () => {
  let starting_point = window.sodaJSONObj["starting-point"]["origin"];
  if (starting_point == "ps") {
    window.sodaJSONObj["generate-dataset"] = {
      destination: "ps",
      "generate-option": "existing-bf",
    };
  }
  if (starting_point == "local") {
    var newDatasetName = window.path.basename(window.sodaJSONObj["starting-point"]["local-path"]);
    window.sodaJSONObj["generate-dataset"] = {
      destination: "local",
      path: $("#input-manifest-local-folder-dataset").attr("placeholder"),
      "dataset-name": newDatasetName,
      "if-existing": "new",
      "if-existing-files": "replace",
      "generate-option": "new",
    };
    // delete bf account and dataset keys
    if ("ps-account-selected" in window.sodaJSONObj) {
      delete window.sodaJSONObj["ps-account-selected"];
    }
    if ("ps-dataset-selected" in window.sodaJSONObj) {
      delete window.sodaJSONObj["ps-dataset-selected"];
    }
    window.sodaJSONObj["starting-point"]["origin"] = "new";
  }
};

const initiate_generate_manifest_local = async (manifestEditBoolean, originalDataset) => {
  if (manifestEditBoolean === false) {
    createManifestLocally("local", false, originalDataset);
  } else {
    // SODA Manifest Files folder
    let dir = window.path.join(window.homeDirectory, "SODA", "manifest_files");
    // Move manifest files to the local dataset
    let moveFinishedBool;
    let generationLocation;
    if (window.finalManifestGenerationPath == originalDataset) {
      moveFinishedBool = await moveManifestFiles(dir, originalDataset);
    } else {
      [moveFinishedBool, generationLocation] = await moveManifestFilesPreview(
        dir,
        window.finalManifestGenerationPath
      );
    }

    openDirectoryAtManifestGenerationLocation(
      window.finalManifestGenerationPath == originalDataset
        ? window.finalManifestGenerationPath
        : generationLocation
    );

    if (moveFinishedBool) {
      window.resetManifest(false);
      // reset window.sodaJSONObj
      window.sodaJSONObj = {
        "starting-point": { type: "" },
        "dataset-structure": {},
        "metadata-files": {},
      };
      window.datasetStructureJSONObj = {
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
      window.logMetadataForAnalytics(
        "Success",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.LOCAL
      );
    }
  }
};

var generatingBoolean = false;

/// creating manifest files locally by generating them to a local SODA folder, then move them to original dataset folder
const moveManifestFiles = (sourceFolder, destinationFolder) => {
  return new Promise((resolve) => {
    window.fs.readdircallback(sourceFolder, (err, folders) => {
      if (err) {
        console.log(err);
        resolve(false);
      } else {
        folders.forEach(async function (folder) {
          let sourceManifest = window.path.join(sourceFolder, folder, "manifest.xlsx");
          let destinationManifest = window.path.join(destinationFolder, folder, "manifest.xlsx");
          // TODO: Catch error and reject rather than resolve
          await window.electron.ipcRenderer.invoke("mv", sourceManifest, destinationManifest);
        });
        resolve(true);
      }
    });
  });
};

// create manifest files in a local folder for previewing before generation in the case of a Pennsieve dataset.
// In the case of generating a manifest file for a local dataset, this is used for generating the manifest files outside of the original dataset folder.
// Rationale: A user will want to preview their manifest files before uploading them to Pennsieve. In the case of generating for a local dataset,
// sometimes the location of the dataset is read only, so we need to generate the manifest files in a different location for the user.
const moveManifestFilesPreview = async (sourceFolder, destinationFolder) => {
  // get the files/folders in the source folder
  let sourceDir;
  try {
    sourceDir = await window.fs.readdir(sourceFolder);
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

    let sourceManifest = window.path.join(sourceFolder, folder, "manifest.xlsx");

    let destinationManifestHighLevelFolder = window.path.join(manifestFolderDirectory, folder);
    window.fs.mkdirSync(destinationManifestHighLevelFolder);

    let destinationManifest = window.path.join(destinationManifestHighLevelFolder, "manifest.xlsx");

    try {
      await window.fs.copyFile(sourceManifest, destinationManifest);
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
    destinationDir = await window.fs.readdir(destination);
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
    let manifestFolderDirectory = window.path.join(destination, "SODA Manifest Files");
    window.fs.mkdirSync(manifestFolderDirectory);
    return manifestFolderDirectory;
  }

  if (manifestFolderCopies.length === 1) {
    let manifestFolderDirectory = window.path.join(destination, "SODA Manifest Files (1)");
    window.fs.mkdirSync(manifestFolderDirectory);
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
  let manifestFolderDirectory = window.path.join(
    destination,
    `SODA Manifest Files (${parseInt(lastCopyNumber) + 1})`
  );
  window.fs.mkdirSync(manifestFolderDirectory);

  // return the path to the new SODA Manifest Files directory
  return manifestFolderDirectory;
};

window.removeDir = function (pathdir) {
  if (window.fs.existsSync(pathdir)) {
    const files = window.fs.readdirSync(pathdir);
    if (files.length > 0) {
      files.forEach(function (filename) {
        let ele = window.path.join(pathdir, filename);
        let isDirectory = window.fs.isDirectorySync(ele);
        if (isDirectory) {
          window.removeDir(ele);
        } else {
          try {
            window.fs.unlinkSync(ele);
          } catch {
            fd = window.fs.openSync(ele, "r");
            window.fs.closeSync(fd);
            window.fs.unlinkSync(ele);
          }
        }
      });
      window.fs.rmdirSync(pathdir);
    } else {
      window.fs.rmdirSync(pathdir);
    }
  }
};

const extractBFDatasetForManifestFile = async (editBoolean, bfaccount, bfdataset, ev) => {
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
    var res = await window.bf_request_and_populate_dataset(
      window.sodaJSONObj,
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
    window.defaultBfDataset = "Select dataset";
    // log the Generate action without the destination
    window.logMetadataForAnalytics(
      "Error",
      window.MetadataAnalyticsPrefix.MANIFEST,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Generate",
      Destinations.PENNSIEVE
    );

    $("#bf_dataset_create_manifest").text("None");
    $("#div-check-bf-create-manifest").hide();
    window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = "";
    return;
  } else {
    window.sodaJSONObj = result[1]["soda_object"];
    if (JSON.stringify(window.sodaJSONObj["dataset-structure"]) !== "{}") {
      window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
    } else {
      window.datasetStructureJSONObj = { folders: {}, files: {} };
    }
    window.sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    window.sodaJSONObj["generate-dataset"] = {
      destination: "ps",
      "generate-option": "existing-bf",
    };
    window.sodaJSONObj["starting-point"] = { origin: "ps" };

    window.populate_existing_folders(window.datasetStructureJSONObj);
    window.populate_existing_metadata(window.sodaJSONObj);

    let continueProgressEmptyFolder = await checkEmptySubFolders(
      window.sodaJSONObj["dataset-structure"]
    );

    continueProgressEmptyFolder = true;
    if (!continueProgressEmptyFolder) {
      window.hideProgressContainer(progressContainer);
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
      }).then(() => {});

      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $("#Question-prepare-manifest-3").removeClass("prev");
      $("#bf_dataset_create_manifest").text("None");
      window.defaultBfDataset = "Select dataset";
      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.PENNSIEVE
      );
      return;
    }

    await window.wait(1000);
    var continueErrorManifest;
    try {
      let res = await extractBFManifestFile();
      continueErrorManifest = [false, res];
    } catch (err) {
      continueErrorManifest = [true, err];
    }

    await window.wait(1000);

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
      }).then(() => {});

      window.hideProgressContainer(progressContainer);
      spanManifest.style.display = "none";

      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $("#Question-prepare-manifest-3").removeClass("prev");
      $("#bf_dataset_create_manifest").text("None");
      window.defaultBfDataset = "Select dataset";
      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        Destinations.PENNSIEVE
      );
      return;
    }

    // check for no SPARC folders on a Pennsieve datasets (already include check for a local dataset)
    let continueProgressNoSPARCFolders = checkNoSparcFolders(
      window.sodaJSONObj["dataset-structure"]
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
      }).then(() => {});
      $("#Question-prepare-manifest-4").removeClass("show");
      $("#Question-prepare-manifest-4").removeClass("prev");
      $("#Question-prepare-manifest-3").removeClass("prev");
      $("#bf_dataset_create_manifest").text("None");

      window.hideProgressContainer(progressContainer);
      spanManifest.style.display = "none";

      window.defaultBfDataset = "Select dataset";
      // log the error to analytics
      window.logMetadataForAnalytics(
        "Error",
        window.MetadataAnalyticsPrefix.MANIFEST,
        window.AnalyticsGranularity.ALL_LEVELS,
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
      loadDSTreePreviewManifest(window.sodaJSONObj["dataset-structure"]);

      // hide the loading bar's text
      document.querySelector("#loading_pennsieve_dataset_manifest_span").style.visibility =
        "hidden";

      localDatasetFolderPath = "";

      // hide the entire progress container div
      document.querySelector("#manifest-progress-container").style.display = "none";
    }
  }
};

const extractBFManifestFile = () => {
  return new Promise((resolve, reject) => {
    client
      .post(
        `/prepare_metadata/manifest_files/pennsieve`,
        {
          soda_json_object: window.sodaJSONObj,
          selected_account: window.defaultBfAccount,
          selected_dataset: window.defaultBfDataset,
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
};

// generate on Pennsieve without edits
const generateManifestOnPennsieve = () => {
  generateManifestHelper();
  initiate_generate_manifest_bf();
};

const validateSPARCdataset = () => {
  let localDatasetFolderPath = $("#input-manifest-local-folder-dataset").attr("placeholder");
  let valid_dataset = window.verifySparcFolder(localDatasetFolderPath, "local");
  if (valid_dataset == true) {
    window.irregularFolderArray = [];
    window.detectIrregularFolders(localDatasetFolderPath);
    var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
    if (window.irregularFolderArray.length > 0) {
      Swal.fire({
        title:
          "The following folders contain non-allowed characters in their names. Please correct them before continuing.",
        html:
          "<div style='max-height:300px; overflow-y:auto'>" +
          window.irregularFolderArray.join("</br>") +
          "</div>",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          $(".swal-popover").popover();
        },
        footer: footer,
      }).then(() => {});
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
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      didOpen: () => {
        Swal.hideLoading();
      },
    }).then(() => {
      document.getElementById("input-manifest-local-folder-dataset").placeholder = "Browse here";
      $("#div-confirm-manifest-local-folder-dataset").hide();
      localDatasetFolderPath = "";
      $("#Question-prepare-manifest-2").nextAll().removeClass("show").removeClass("prev");
      return false;
    });
  }
};

const trackManifestImportProgress = async () => {
  // show the progress container - it is hidden by default once the dataset import is complete
  let progressContainer = document.getElementById("loading_pennsieve_dataset_manifest");

  let { percentage_text, left_progress_bar, right_progress_bar } =
    window.getProgressContainerElements(progressContainer);

  await window.resetProgressContainer(
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

    window.updateProgressContainer(
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
const checkEmptySubFolders = (datasetStructure) => {
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
};

// helper function 1: First, generate manifest file folder locally
// Parameter: dataset structure object
// Return: manifest file folder path
window.generateManifestFolderLocallyForEdit = async (ev) => {
  //Function called by Confirm button in Prepare Metadata -> Manifest
  let type = "local";
  if ($('input[name="generate-manifest-1"]:checked').prop("id") === "generate-manifest-from-Penn") {
    type = "ps";
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

  if (!["btn-pull-ds-manifest", "confirm-local-manifest-folder-adv-feature"].includes(ev.id)) {
    window.exitCurate();
  }

  window.sodaJSONObj["starting-point"] = {};
  window.sodaJSONObj["dataset-structure"] = {};
  window.datasetStructureJSONObj = { folders: {}, files: {} };
  window.sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
  window.sodaJSONObj["metadata-files"] = {};
  window.sodaJSONObj["generate-dataset"] = {};

  if (type === "local") {
    Swal.fire({
      title: "Preparing manifest files",
      allowOutsideClick: false,
      icon: "info",
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
    await window.wait(500);

    let continueProgressValidateDataset = true;
    let continueProgressEmptyFolder = true;
    continueProgressValidateDataset = await validateSPARCdataset();
    if (!continueProgressValidateDataset) {
      return;
    }

    window.sodaJSONObj["starting-point"]["local-path"] = localDatasetFolderPath;
    window.sodaJSONObj["starting-point"]["origin"] = "local";
    await window.create_json_object("", window.sodaJSONObj, localDatasetFolderPath);
    window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
    window.populate_existing_folders(window.datasetStructureJSONObj);
    window.populate_existing_metadata(window.sodaJSONObj);
    window.sodaJSONObj["manifest-files"] = { destination: "generate-dataset" };
    window.sodaJSONObj["ps-account-selected"] = {};
    window.sodaJSONObj["ps-dataset-selected"] = {};
    window.sodaJSONObj["generate-dataset"] = {};
    continueProgressEmptyFolder = await checkEmptySubFolders(
      window.sodaJSONObj["dataset-structure"]
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
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then(() => {});
      return;
    }
    createManifestLocally("local", true, "");
    if (ev.id === "confirm-local-manifest-folder-adv-feature") {
      document.getElementById(
        "confirm-local-manifest-folder-adv-feature"
      ).children[0].style.display = "block";
      document.getElementById("confirm-local-manifest-folder-adv-feature").classList.add("hidden");
    }
  } else {
    // Case 2: bf dataset
    window.sodaJSONObj["ps-account-selected"] = { "account-name": window.defaultBfAccount };
    window.sodaJSONObj["ps-dataset-selected"] = { "dataset-name": window.defaultBfDataset };
    extractBFDatasetForManifestFile(true, window.defaultBfAccount, window.defaultBfDataset, ev);
  }
};

const createManifestLocally = async (type, editBoolean, originalDataset) => {
  var generatePath = "";
  window.sodaJSONObj["manifest-files"]["local-destination"] = window.path.join(
    homeDirectory,
    "SODA"
  );

  if (type === "local") {
    generatePath = localDatasetFolderPath;
  } else {
    generatePath = "";
  }

  // create the manifest files based off the user's edits to the manifest files
  try {
    await client.post(
      `/curate_datasets/manifest_files`,
      {
        generate_purpose: editBoolean ? "edit-manifest" : "",
        soda_json_object: window.sodaJSONObj,
      },
      { timeout: 0 }
    );

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
        }).then(() => {});
        $("#preview-manifest-fake-confirm").click();
        $("#Question-prepare-manifest-4").removeClass("show");
        $("#Question-prepare-manifest-4").removeClass("prev");
        loadDSTreePreviewManifest(window.sodaJSONObj["dataset-structure"]);
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
      let dir = window.path.join(homeDirectory, "SODA", "SODA Manifest Files");
      let moveFinishedBool;
      let manifestGenerationDirectory;
      if (originalDataset !== window.finalManifestGenerationPath) {
        // Move manifest files to the local dataset
        [moveFinishedBool, manifestGenerationDirectory] = await moveManifestFilesPreview(
          dir,
          window.finalManifestGenerationPath
        );
      } else {
        // Move manifest files to the local dataset
        moveFinishedBool = await moveManifestFiles(dir, originalDataset);
      }

      openDirectoryAtManifestGenerationLocation(
        originalDataset !== window.finalManifestGenerationPath
          ? manifestGenerationDirectory
          : originalDataset
      );

      if (moveFinishedBool) {
        window.resetManifest(false);
        // reset window.sodaJSONObj
        window.sodaJSONObj = {
          "starting-point": { type: "" },
          "dataset-structure": {},
          "metadata-files": {},
        };
        window.datasetStructureJSONObj = {
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
        window.logMetadataForAnalytics(
          "Success",
          window.MetadataAnalyticsPrefix.MANIFEST,
          window.AnalyticsGranularity.ALL_LEVELS,
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
    }).then(() => {});
    $("#Question-prepare-manifest-4").removeClass("show");
    $("#Question-prepare-manifest-4").removeClass("prev");
    $("#Question-prepare-manifest-3").removeClass("prev");
    $("#bf_dataset_create_manifest").text("None");
  }

  window.transitionFreeFormMode(
    document.querySelector("#div-confirm-manifest-local-folder-dataset .btn_animated"),
    "Question-prepare-manifest-2",
    "create_manifest-tab",
    "",
    "individual-question prepare-manifest"
  );
};

// helper function 2: Second, load dataset structure as preview tree
// (so users can choose which manifest file to add additional metadata to)
// Parameter: dataset structure object
// Return tree
const loadDSTreePreviewManifest = (datasetStructure) => {
  // return tree view
  // upon clicking on a node, if node == manifest, feed the actual path of that manifest file -> UI library xspreadsheet
  // -> popup opens up with loaded info from such manifest.xlsx file.
  // -> upon save+close -> save the new file to the old path (make changes to the file)
  window.addManifestFilesForTreeView();
  showTreeViewPreviewManifestEdits(
    false,
    true,
    false,
    "My_dataset_structure",
    jstreePreviewManifest,
    datasetStructure
  );
};

const showTreeViewPreviewManifestEdits = (
  disabledBoolean,
  selectedBoolean,
  manifestFileBoolean,
  new_dataset_name,
  previewDiv,
  datasetStructure
) => {
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
};

const createChildNodeManifest = (
  oldFormatNode,
  nodeName,
  type,
  ext,
  openedState,
  selectedState,
  disabledState
) => {
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
      }
      newFormatNode["children"].push(new_node);
      newFormatNode["children"].sort((a, b) => (a.text > b.text ? 1 : -1));
      // newFormatNode["children"].forEach((child, idx) => {
      //   if (idx != 0) child.state.opened = false;
      // });
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
};

// check for no SPARC folders on a Pennsieve dataset before continuing to generate manifest files
// to avoid changes made to the dataset structure when we call the main curate function for manifest files
const checkNoSparcFolders = (datasetStructure) => {
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
};

// check for invalid high level folders before continuing to generate manifest files
// to avoid changes made to the dataset structure when we call the main curate function for manifest files
const checkInvalidHighLevelFolders = (datasetStructure) => {
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
};

// function to generate edited manifest files onto Pennsieve (basically just upload the local SODA Manifest Files folder to Pennsieve)
const generateAfterEdits = async () => {
  let dir = window.path.join(window.homeDirectory, "SODA", "manifest_files");
  // set up window.sodaJSONObject
  window.sodaJSONObj = {
    "ps-account-selected": {},
    "ps-dataset-selected": {},
    "dataset-structure": {},
    "metadata-files": {},
    "generate-dataset": {},
    "starting-point": {},
  };
  window.sodaJSONObj["starting-point"]["local-path"] = dir;
  window.sodaJSONObj["starting-point"]["origin"] = "local";
  window.create_json_object_include_manifest("", window.sodaJSONObj, dir);
  window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
  window.populate_existing_folders(window.datasetStructureJSONObj);
  window.populate_existing_metadata(window.sodaJSONObj);
  window.sodaJSONObj["ps-account-selected"] = { "account-name": window.defaultBfAccount };
  window.sodaJSONObj["ps-dataset-selected"] = { "dataset-name": window.defaultBfDataset };
  window.sodaJSONObj["generate-dataset"] = {
    destination: "ps",
    "if-existing": "merge",
    "if-existing-files": "replace",
    "generate-option": "new",
  };

  // move the generated manifest files to the user selected location for preview
  if (pennsievePreview) {
    let location = await moveManifestFilesPreview(dir, window.finalManifestGenerationPath)[1];
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
};

document.querySelector("#btn-pull-ds-manifest").addEventListener("click", () => {
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
  .addEventListener("click", (ev) => {
    // hide the Generate manifest on pennsieve section
    document.querySelector("#generate-local-preview-manifest").parentNode.style.display = "none";
    document.querySelector("#manifest-gen-on-pennsieve-section").style.display = "none";

    // show the confinue button for moving on to step 6
    document.querySelector("#continue_step_5-manifest").parentNode.style.visibility = "visible";

    // hide the 'this' value ( aka, the #div-confirm-manifest-local-folder-dataset div)
    ev.target.style.display = "none";

    // hide the Pennsieve continue button in question 5
    document.querySelector("#btn-continue-pennsieve-question-6").style.display = "none";
  });

document.querySelector("#continue_step_5-manifest").addEventListener("click", (e) => {
  e.target.parentNode.style.visibility = "hidden";
});

document.querySelector(".manifest-change-current-ds").addEventListener("click", () => {
  document.querySelector("#div-confirm-manifest-local-folder-dataset").style.visibility = "visible";
});

// show the manifest generation on Pennsieve section so the user can choose to generate on Pennsieve or create a local preview
document
  .querySelector("#show-manifest-gen-on-pennsieve-section-btn")
  .addEventListener("click", (ev) => {
    openedEdit = false;
    // show the section
    let section = document.querySelector("#manifest-gen-on-pennsieve-section");
    section.style.display = "flex";

    // transition to the header
    section.scrollIntoView({ behavior: "smooth" });

    // hide the continue button
    ev.target.parentNode.parentNode.style.display = "none";
  });
