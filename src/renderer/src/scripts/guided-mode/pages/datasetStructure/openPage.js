import { guidedSkipPage, guidedUnSkipPage } from "../navigationUtils/pageSkipping";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { setTreeViewDatasetStructure } from "../../../../stores/slices/datasetTreeViewSlice";
import { guidedUpdateFolderStructureUI } from "./utils";
import { renderManifestCards } from "../../manifests/manifest";
import { swalFileListSingleAction } from "../../../utils/swal-utils";
import { getEntityDataById } from "../../../../stores/slices/datasetEntityStructureSlice";
import {
  newEmptyFolderObj,
  createStandardizedDatasetStructure,
} from "../../../utils/datasetStructure";
import client from "../../../client";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const openPageDatasetStructure = async (targetPageID) => {
  console.log(`Opening dataset structure page: ${targetPageID}`);

  if (targetPageID === "guided-dataset-structure-intro-tab") {
    // Handle whether or not the spreadsheet importation page should be skipped
    // Note: this is done here to centralize the logic for skipping the page
    // The page is unskipped only if the user has not added any subjects,
    // indicated that they will be adding subjects, and the user is not starting from Pennsieve
    if (
      window.getExistingSubjectNames().length === 0 &&
      window.sodaJSONObj["starting-point"]["origin"] != "ps" &&
      window.sodaJSONObj["button-config"]["dataset-contains-subjects"] === "yes"
    ) {
      guidedUnSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    } else {
      guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    }
  }

  // Add handlers for other pages without componentType
  if (targetPageID === "guided-unstructured-data-import-tab") {
    guidedUpdateFolderStructureUI("data/");
  }

  if (targetPageID === "guided-entity-addition-method-selection-tab") {
    console.log("Opening entity addition method selection page");
  }

  if (targetPageID === "guided-dataset-content-tab") {
    console.log("Opening dataset content selector page");
    // Component with type "dataset-content-selector" will handle most of the logic
  }

  if (targetPageID === "data-categorization-tab") {
    console.log("Opening data categorization page");
    // Component with type "data-categorization-page" will handle most of the logic
  }

  if (targetPageID === "other-data-categorization-tab") {
    console.log("Opening other data categorization page");
    // Component with type "data-categorization-page" will handle most of the logic
  }

  if (targetPageID === "guided-manual-dataset-entity-and-metadata-tab") {
    console.log("Opening manual dataset entity and metadata page");
    // Component with type "entity-metadata-page" will handle most of the logic
  }

  if (targetPageID === "guided-spreadsheet-import-dataset-entity-and-metadata-tab") {
    console.log("Opening spreadsheet import dataset entity and metadata page");
    // Component with type "entity-spreadsheet-import-page" will handle most of the logic
  }

  if (targetPageID === "guided-sites-selection-tab") {
    console.log("Opening sites selection page");
    // Component with type "data-categorization-page" will handle most of the logic
  }

  if (targetPageID === "guided-samples-selection-tab") {
    console.log("Opening samples selection page");
    // Component with type "data-categorization-page" will handle most of the logic
  }

  if (targetPageID === "guided-subjects-selection-tab") {
    console.log("Opening subjects selection page");
    // Component with type "data-categorization-page" will handle most of the logic
  }

  if (targetPageID === "guided-performances-entity-addition-tab") {
    console.log("Opening performances entity addition page");
    // Component with type "performance-id-management-page" will handle most of the logic
  }

  if (targetPageID === "guided-Performances-selection-tab") {
    console.log("Opening performances selection page");
    // Component with type "data-categorization-page" will handle most of the logic
  }

  if (targetPageID === "guided-modalities-selection-tab") {
    console.log("Opening modalities selection page");
    // Component with type "modality-selection-page" will handle most of the logic
  }

  if (targetPageID === "guided-modalities-data-selection-tab") {
    console.log("Opening modalities data selection page");
    // Component with type "data-categorization-page" will handle most of the logic
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

    const response = await client.post(
      "/curate_datasets/clean-dataset",
      { soda_json_structure: sodaCopy },
      { timeout: 0 }
    );

    const responseData = response.data.soda;
    console.log("keys in responseData: ", Object.keys(responseData));

    console.log("Response from clean-dataset: ", response);
    console.log("Response data" + JSON.stringify(response, null, 2));
    const manifestRes = (
      await client.post(
        "/curate_datasets/generate_manifest_file_data",
        { dataset_structure_obj: responseData["dataset-structure"] },
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

        const entityTypes = ["sites", "samples", "subjects", "performances"];

        for (const type of entityTypes) {
          const entities = datasetEntityObj?.[type] || {};
          console.log(`datasetEntityObj ${type}:`, Object.keys(entities));

          for (const [entity, paths] of Object.entries(entities)) {
            if (paths?.[path]) {
              console.log(`Found ${type} entity: ${entity} in path: ${path}`);
              const entityData = getEntityDataById(entity);
              if (!entityData) {
                console.error(`Entity data not found for ID: ${entity}`);
                continue;
              }
              console.log("Entity dataz: ", entityData);

              entityList.push(entityData.id);
              if (entityData?.["metadata"]?.["sample_id"]) {
                const sampleId = entityData["metadata"]["sample_id"];
                console.log("found sample id", sampleId);
                entityList.push(sampleId);
              }

              if (entityData?.["metadata"]?.["subject id"]) {
                const subjectId = entityData["metadata"]["subject id"];
                entityList.push(subjectId);
              }

              break; // One match is enough
            }
          }
        }
        // remove duplicates from entityList
        entityList = [...new Set(entityList)];

        row[entityColumnIndex] = entityList.join(" ");
      });

      return manifestDataRows;
    };

    const updateModalitiesColumn = (manifestDataRows, datasetEntityObj) => {
      const modalitiesColumnIndex = newManifestData.headers.indexOf("data modality");
      console.log("modalitiesColumnIndex", modalitiesColumnIndex);

      manifestDataRows.forEach((row) => {
        const path = row[0]; // Path is in the first column
        let modalitiesList = [];

        // Check all modalities
        for (const [modality, paths] of Object.entries(datasetEntityObj?.modalities || {})) {
          if (paths?.[path]) {
            modalitiesList.push(modality);
          }
        }

        // Update the modalities column
        row[modalitiesColumnIndex] = modalitiesList.join(" ");
      });

      return manifestDataRows;
    };

    const updateFileNameColumn = (manifestDataRows, datasetEntityObj) => {
      const fileNameColumnIndex = newManifestData.headers.indexOf("filename");
      console.log("fileNameColumnIndex", fileNameColumnIndex);

      const updateFilePathDataFolder = (path, newFolder) => {
        // Find the first instance of data/ in the path and replace it with newFolder
        const dataIndex = path.indexOf("data/");
        if (dataIndex !== -1) {
          const newPath = path.slice(0, dataIndex) + newFolder + path.slice(dataIndex + 5);
          return newPath;
        }
        return path; // Return the original path if data/ is not found
      };

      manifestDataRows.forEach((row) => {
        const path = row[0]; // Path is in the first column
        console.log("path1", path);
        if (
          datasetEntityObj?.["high-level-folder-data-categorization"]?.["Experimental data"]?.[path]
        ) {
          console.log("found folder to move to primary", path);
          const newPath = updateFilePathDataFolder(path, "primary/");
          console.log("newPath", newPath);
          row[fileNameColumnIndex] = newPath;
          console.log("row[fileNameColumnIndex]", row[fileNameColumnIndex]);
        }

        if (datasetEntityObj?.["high-level-folder-data-categorization"]?.["Code"]?.[path]) {
          console.log("found code path", path);
          const newPath = updateFilePathDataFolder(path, "code/");
          console.log("newPath", newPath);
          row[fileNameColumnIndex] = newPath;
          console.log("row[fileNameColumnIndex]", row[fileNameColumnIndex]);
        }
        if (datasetEntityObj?.["other-data"]?.["Documentation"]?.[path]) {
          console.log("found folder to move to documentation", path);
          const newPath = updateFilePathDataFolder(path, "docs/");
          console.log("newPath", newPath);
          row[fileNameColumnIndex] = newPath;
          console.log("row[fileNameColumnIndex]", row[fileNameColumnIndex]);
        }

        if (datasetEntityObj?.["other-data"]?.["Protocol data"]?.[path]) {
          console.log("found folder to move to protocol", path);
          const newPath = updateFilePathDataFolder(path, "protocol/");
          console.log("newPath", newPath);
          row[fileNameColumnIndex] = newPath;
          console.log("row[fileNameColumnIndex]", row[fileNameColumnIndex]);
        }
      });

      return manifestDataRows;
    };

    // Apply the function
    updateEntityColumn(newManifestData.data, datasetEntityObj);
    updateModalitiesColumn(newManifestData.data, datasetEntityObj);
    updateFileNameColumn(newManifestData.data, datasetEntityObj);

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

  if (targetPageID === "dataset-structure-review-tab") {
    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

    // Create a deep copy of the dataset structure JSON object
    const datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));
    console.log("datasetStructureJSONObjCopy", datasetStructureJSONObjCopy);

    const starndardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      datasetEntityObj
    );
    setTreeViewDatasetStructure(starndardizedDatasetStructure, []);

    // Restore the original dataset structure
    window.datasetStructureJSONObj = datasetStructureJSONObjCopy;
    console.log("datasetStructureJSONObj restored", window.datasetStructureJSONObj);
  }
};
