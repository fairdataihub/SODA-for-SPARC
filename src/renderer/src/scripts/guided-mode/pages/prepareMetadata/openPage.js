import { pageNeedsUpdateFromPennsieve } from "../../pennsieveUtils";
import { setPageLoadingState } from "../navigationUtils/pageLoading";
import {
  addContributor,
  renderDatasetDescriptionContributorsTable,
} from "../../metadata/contributors";
import { addGuidedProtocol } from "../../metadata/protocols";
import Swal from "sweetalert2";
import Cropper from "cropperjs";
import client from "../../../client";
import api from "../../../others/api/api";
import { clientError, userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";
import { renderManifestCards } from "../../manifests/manifest";
import { setTreeViewDatasetStructure } from "../../../../stores/slices/datasetTreeViewSlice";
import {
  setEntityType,
  setEntityListForEntityType,
  setActiveEntity,
} from "../../../../stores/slices/datasetEntitySelectorSlice";
import { dragDrop } from "../../../../assets/lotties/lotties";
import lottie from "lottie-web";

export const openPagePrepareMetadata = async (targetPageID) => {
  if (targetPageID === "guided-banner-image-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-banner-image-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      // If the fetch fails, (they don't have a banner image yet)
      const datasetName = window.sodaJSONObj["digital-metadata"]["name"];
      const datasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
      try {
        // pass in the id in case the name of the dataset has been
        // changed from the original Pennsieve dataset name
        let res = await api.getDatasetBannerImageURL(datasetID);
        if (res != "No banner image") {
          //Banner is returned as an s3 bucket url but image needs to be converted as
          //base64 to save and write to users local system
          let img_base64 = await window.getBase64(res); // encode image to base64
          let guided_img_url = res;
          let imageType = "";
          let fullBase64Image = "";
          let position = guided_img_url.search("X-Amz-Security-Token");
          if (position != -1) {
            // The image url will be before the security token
            let new_img_src = guided_img_url.substring(0, position - 1);
            let new_position = new_img_src.lastIndexOf("."); //
            if (new_position != -1) {
              window.imageExtension = new_img_src.substring(new_position + 1);
              if (window.imageExtension.toLowerCase() == "png") {
                fullBase64Image = "data:image/png;base64," + img_base64;
                imageType = "png";
              } else if (
                window.imageExtension.toLowerCase() == "jpeg" ||
                window.imageExtension.toLowerCase() == "jpg"
              ) {
                fullBase64Image = "data:image/jpg;base64," + img_base64;
                imageType = "jpg";
              } else {
                window.log.error(`An error happened: ${guided_img_url}`);
                Swal.fire({
                  icon: "error",
                  text: "An error occurred when importing the image. Please try again later.",
                  showConfirmButton: "OK",
                  backdrop: "rgba(0,0,0, 0.4)",
                  heightAuto: false,
                });
                window.logGeneralOperationsForAnalytics(
                  "Error",
                  window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
                  window.AnalyticsGranularity.ALL_LEVELS,
                  ["Importing Banner Image"]
                );
              }
            }
          }
          const homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");
          let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
          if (!window.fs.existsSync(imageFolder)) {
            //create SODA/guided-banner-images if it doesn't exist
            window.fs.mkdirSync(imageFolder, { recursive: true });
          }
          let imagePath = window.path.join(imageFolder, `${datasetName}.` + imageType);
          //store file at imagePath destination
          await window.electron.ipcRenderer.invoke("write-banner-image", img_base64, imagePath);
          //save imagePath to sodaJson
          window.sodaJSONObj["digital-metadata"]["banner-image-path"] = imagePath;
          //add image to modal and display image on main banner import page
          $("#guided-image-banner").attr("src", fullBase64Image);
          $("#guided-para-path-image").html(imagePath);
          document.getElementById("guided-div-img-container-holder").style.display = "none";
          document.getElementById("guided-div-img-container").style.display = "block";
          //set new cropper for imported image
          window.myCropper.destroy();
          window.myCropper = new Cropper(
            window.guidedBfViewImportedImage,
            window.guidedCropOptions
          );
          $("#guided-save-banner-image").css("visibility", "visible");
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
      } catch (error) {
        clientError(error);
        const emessage = userErrorMessage(error);
        await guidedShowOptionalRetrySwal(emessage, "guided-banner-image-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
      }
    }
    if (window.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
      //added extra param to function to prevent modification of URL
      guidedShowBannerImagePreview(
        window.sodaJSONObj["digital-metadata"]["banner-image-path"],
        true
      );
      document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
    } else {
      //reset the banner image page
      $("#guided-button-add-banner-image").html("Add banner image");
      $("#guided-banner-image-preview-container").hide();
    }
  }

  if (targetPageID === "guided-manifest-file-generation-tab") {
    // Delete existing manifest files in the dataset structure
    Object.values(window.datasetStructureJSONObj.folders).forEach((folder) => {
      delete folder.files["manifest.xlsx"];
    });

    /**
     * Purge non-existent files from the dataset structure.
     */
    const purgeNonExistentFiles = async (datasetStructure) => {
      const nonExistentFiles = [];

      const collectNonExistentFiles = async (currentStructure, currentPath = "") => {
        for (const [fileName, fileData] of Object.entries(currentStructure.files || {})) {
          if (fileData.type === "local" && !(await window.fs.existsSync(fileData.path))) {
            nonExistentFiles.push(`${currentPath}${fileName}`);
          }
        }
        await Promise.all(
          Object.entries(currentStructure.folders || {}).map(([folderName, folder]) =>
            collectNonExistentFiles(folder, `${currentPath}${folderName}/`)
          )
        );
      };

      /**
       * Recursively deletes references to non-existent files from the dataset structure.
       * @param {Object} currentStructure - The current level of the dataset structure.
       * @param {string} currentPath - The relative path to the current structure.
       */
      const deleteNonExistentFiles = (currentStructure, currentPath = "") => {
        const files = currentStructure?.files || {};
        for (const fileName in files) {
          const fileData = files[fileName];
          if (fileData.type === "local") {
            const filePath = fileData.path;
            const isNonExistent = !window.fs.existsSync(filePath);

            if (isNonExistent) {
              window.log.info(`Deleting reference to non-existent file: ${currentPath}${fileName}`);
              delete files[fileName];
            }
          }
        }
        Object.entries(currentStructure.folders || {}).forEach(([folderName, folder]) =>
          deleteNonExistentFiles(folder)
        );
      };

      await collectNonExistentFiles(datasetStructure);
      if (nonExistentFiles.length > 0) {
        await swalFileListSingleAction(
          nonExistentFiles,
          "Files imported into SODA that are no longer on your computer were detected",
          "These files will be disregarded and not uploaded to Pennsieve.",
          ""
        );
        deleteNonExistentFiles(datasetStructure);
      }
    };

    await purgeNonExistentFiles(window.datasetStructureJSONObj);

    /**
     * Recursively delete empty folders from the dataset structure.
     */
    const deleteEmptyFolders = (currentStructure) => {
      Object.entries(currentStructure.folders || {}).forEach(([folderName, folder]) => {
        deleteEmptyFolders(folder);
        if (!Object.keys(folder.files || {}).length && !Object.keys(folder.folders || {}).length) {
          delete currentStructure.folders[folderName];
        }
      });
    };

    deleteEmptyFolders(window.datasetStructureJSONObj);

    if (!Object.keys(window.datasetStructureJSONObj.folders).length) {
      await swalShowInfo(
        "No files or folders are currently imported into SODA",
        "You will be returned to the beginning of the dataset structuring section to import your data."
      );
      await window.openPage("guided-dataset-structure-intro-tab");
      return;
    }

    document.getElementById("guided-container-manifest-file-cards").innerHTML = `
      <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
      Updating your dataset's manifest files...
    `;

    const sodaCopy = {
      ...window.sodaJSONObj,
      "metadata-files": {},
      "dataset-structure": window.datasetStructureJSONObj,
    };
    delete sodaCopy["generate-dataset"];

    const response = (
      await client.post(
        "/curate_datasets/clean-dataset",
        { soda_json_structure: sodaCopy },
        { timeout: 0 }
      )
    ).data.soda_json_structure;
    const manifestRes = (
      await client.post(
        "/curate_datasets/generate_manifest_file_data",
        { dataset_structure_obj: response["dataset-structure"] },
        { timeout: 0 }
      )
    ).data;

    const newManifestData = { headers: manifestRes.shift(), data: manifestRes };
    const entityColumnIndex = newManifestData.headers.indexOf("entity");

    /**
     * Sort manifest data rows based on predefined folder order.
     */
    const sortManifestDataRows = (rows) => {
      const folderOrder = {
        data: 0,
        primary: 1,
        source: 2,
        derivative: 3,
        code: 4,
        protocol: 5,
        docs: 6,
      };

      return rows.sort((rowA, rowB) => {
        const pathA = rowA[0] || "";
        const pathB = rowB[0] || "";

        const getTopLevelFolder = (path) => (path.includes("/") ? path.split("/")[0] : path);

        const folderA = getTopLevelFolder(pathA);
        const folderB = getTopLevelFolder(pathB);

        const priorityA = folderOrder[folderA] ?? Infinity;
        const priorityB = folderOrder[folderB] ?? Infinity;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Ensure 'data' always comes before lexicographical sorting
        if (folderA === "data" && folderB !== "data") return -1;
        if (folderB === "data" && folderA !== "data") return 1;

        return pathA.localeCompare(pathB);
      });
    };

    console.log("Before sort: ", newManifestData.data);

    newManifestData.data = sortManifestDataRows(newManifestData.data);

    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

    const updateEntityColumn = (manifestDataRows, datasetEntityObj) => {
      manifestDataRows.forEach((row) => {
        const path = row[0]; // Path is in the first column
        let entityList = [];

        // Check for subjects
        for (const [entity, paths] of Object.entries(datasetEntityObj.subjects || {})) {
          if (paths.includes(path)) {
            console.log("Subject found: ", entity);
            entityList.push(entity);
            break; // Stop checking subjects after the first match
          }
        }

        // Check for samples
        for (const [entity, paths] of Object.entries(datasetEntityObj.samples || {})) {
          if (paths.includes(path)) {
            entityList.push(entity);
            break; // Stop checking samples after the first match
          }
        }

        // Check for performances
        for (const [entity, paths] of Object.entries(datasetEntityObj.performances || {})) {
          if (paths.includes(path)) {
            entityList.push(entity);
            break; // Stop checking performances after the first match
          }
        }

        // Update the entity column (index from headers)
        row[entityColumnIndex] = entityList.join(" ");
      });

      return manifestDataRows; // Return updated data
    };

    const updateModalitiesColumn = (manifestDataRows, datasetEntityObj) => {
      const modalitiesColumnIndex = newManifestData.headers.indexOf("data modality");
      console.log("modalitiesColumnIndex", modalitiesColumnIndex);

      manifestDataRows.forEach((row) => {
        const path = row[0]; // Path is in the first column
        let modalitiesList = [];

        // Check for modalities
        for (const [modality, paths] of Object.entries(datasetEntityObj.modalities || {})) {
          if (paths.includes(path)) {
            modalitiesList.push(modality);
          }
        }

        // Update the modalities column (index from headers)
        row[modalitiesColumnIndex] = modalitiesList.join(" ");
      });

      return manifestDataRows; // Return updated data
    };

    // Apply the function
    updateEntityColumn(newManifestData.data, datasetEntityObj);
    updateModalitiesColumn(newManifestData.data, datasetEntityObj);

    console.log("After sort: ", newManifestData.data);
    window.sodaJSONObj["guided-manifest-file-data"] = window.sodaJSONObj[
      "guided-manifest-file-data"
    ]
      ? window.diffCheckManifestFiles(
          newManifestData,
          window.sodaJSONObj["guided-manifest-file-data"]
        )
      : newManifestData;

    renderManifestCards();
  }

  if (targetPageID === "guided-manifest-subject-entity-selector-tab") {
    setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
    setEntityType("subject-related-folders-and-files");
    setEntityListForEntityType(
      "subject-related-folders-and-files",
      window.sodaJSONObj["subject-related-folders-and-files"] || {}
    );
    setActiveEntity(null);
  }
  if (targetPageID === "guided-manifest-sample-entity-selector-tab") {
    setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
    setEntityType("sample-related-folders-and-files");
    setEntityListForEntityType(
      "sample-related-folders-and-files",
      window.sodaJSONObj["sample-related-folders-and-files"] || {}
    );
    setActiveEntity(null);
  }
  if (targetPageID === "guided-manifest-performance-entity-selector-tab") {
    setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
    setEntityType("performance-related-folders-and-files");
    setEntityListForEntityType(
      "performance-related-folders-and-files",
      window.sodaJSONObj["performance-related-folders-and-files"] || {}
    );
    setActiveEntity(null);
  }

  if (targetPageID === "guided-create-submission-metadata-tab") {
    if (pageNeedsUpdateFromPennsieve(targetPageID)) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        const submissionMetadataRes = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "submission.xlsx",
          },
        });

        const submissionData = submissionMetadataRes.data;

        window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
          submissionData["Award number"];
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] =
          submissionData["Milestone achieved"];
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
          submissionData["Milestone completion date"];

        window.sodaJSONObj["pages-fetched-from-pennsieve"].push(targetPageID);
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, targetPageID);
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push(targetPageID);
      }
    }

    //Reset the manual submission metadata UI
    const sparcAwardInputManual = document.getElementById("guided-submission-sparc-award-manual");
    sparcAwardInputManual.value = "";
    window.guidedSubmissionTagsTagifyManual.removeAllTags();
    const completionDateInputManual = document.getElementById(
      "guided-submission-completion-date-manual"
    );
    completionDateInputManual.innerHTML = `
            <option value="">Select a completion date</option>
            <option value="Enter my own date">Enter my own date</option>
            <option value="N/A">N/A</option>
          `;
    completionDateInputManual.value = "";

    const sectionThatAsksIfDataDeliverablesReady = document.getElementById(
      "guided-section-user-has-data-deliverables-question"
    );
    const sectionSubmissionMetadataInputs = document.getElementById(
      "guided-section-submission-metadata-inputs"
    );

    //Update the UI if their respective keys exist in the window.sodaJSONObj
    const sparcAward = window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
    if (sparcAward) {
      sparcAwardInputManual.value = sparcAward;
    }
    const milestones = window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
    if (milestones) {
      window.guidedSubmissionTagsTagifyManual.addTags(milestones);
    }
    const completionDate =
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];

    if (completionDate && completionDate != "") {
      completionDateInputManual.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
      //select the completion date that was added
      completionDateInputManual.value = completionDate;
    }

    const setFundingConsortium =
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"];

    const topLevelDDDInstructionsText = document.getElementById(
      "guided-submission-metadata-ddd-import-instructions"
    );
    if (setFundingConsortium != "SPARC") {
      topLevelDDDInstructionsText.classList.add("hidden");
      // Hide the ddd import section since the submission is not SPARC funded
      sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
      // Show the submission metadata inputs section so the user can enter the metadata manually
      sectionSubmissionMetadataInputs.classList.remove("hidden");

      // Show the instructions for non-SPARC funded submissions
      window.showElementsWithClass("guided-non-sparc-funding-consortium-instructions");
    } else {
      topLevelDDDInstructionsText.classList.remove("hidden");

      // If the submission is SPARC, but they have already added their sparc award and milestones
      // then hide the section that asks if they have data deliverables ready and show the
      // submission metadata inputs section
      if (sparcAward && milestones) {
        sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
        sectionSubmissionMetadataInputs.classList.remove("hidden");
      } else {
        // If the submission is SPARC and they have not added their sparc award and milestones
        // then show the section that asks if they have data deliverables ready and hide the
        // submission metadata inputs section
        sectionThatAsksIfDataDeliverablesReady.classList.remove("hidden");
        sectionSubmissionMetadataInputs.classList.add("hidden");
        // Load the lottie animation where the user can drag and drop the data deliverable document
        const dataDeliverableLottieContainer = document.getElementById(
          "data-deliverable-lottie-container"
        );
        dataDeliverableLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: dataDeliverableLottieContainer,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
      }

      // Hide the instructions for non-SPARC funded submissions
      window.hideElementsWithClass("guided-non-sparc-funding-consortium-instructions");
    }
  }

  if (targetPageID === "guided-contributors-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-contributors-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "dataset_description.xlsx",
          },
        });
        let contributorData = metadata_import.data["Contributor information"];
        //Filter out returned rows that only contain empty srings (first name is checked)
        const currentContributorFullNames = getContributorFullNames();
        contributorData = contributorData = contributorData.filter((row) => {
          return row[0] !== "" && !currentContributorFullNames.includes(row[0]);
        });

        // Loop through the contributorData array besides the first row (which is the header)
        for (let i = 1; i < contributorData.length; i++) {
          const contributors = contributorData[i];
          // split the name into first and last name with the first name being the first element and last name being the rest of the elements
          const contributorFullName = contributors[0];
          const contributorID = contributors[1];
          const contributorAffiliation = contributors[2].split(", ");
          const contributorRoles = contributors[3].split(", ");
          try {
            addContributor(
              contributorFullName,
              contributorID,
              contributorAffiliation,
              contributorRoles
            );
          } catch (error) {
            console.log(error);
          }
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, "guided-contributors-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
      }
    }

    renderDatasetDescriptionContributorsTable();
  }

  if (targetPageID === "guided-protocols-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-protocols-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "dataset_description.xlsx",
          },
        });
        let relatedInformationData = metadata_import.data["Related information"];
        const protocolsFromPennsieve = relatedInformationData.filter((relatedInformationArray) => {
          return (
            relatedInformationArray[1] === "IsProtocolFor" && relatedInformationArray[2] !== ""
          );
        });

        for (const protocol of protocolsFromPennsieve) {
          const protocolLink = protocol[2];
          const protocolDescription = protocol[0];
          const protocolType = protocol[3];
          try {
            addGuidedProtocol(protocolLink, protocolDescription, protocolType);
          } catch (error) {
            console.log(error);
          }
        }
        // Click the yes protocol button if protocols were imported
        if (protocolsFromPennsieve.length > 0) {
          document.getElementById("guided-button-user-has-protocols").click();
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, "guided-protocols-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
      }
    }
    renderProtocolsTable();
  }
};
