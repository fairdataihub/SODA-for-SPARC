import { guidedSkipPage, guidedUnSkipPage } from "../navigationUtils/pageSkipping";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { reRenderTreeView, setPathToRender } from "../../../../stores/slices/datasetTreeViewSlice";
import { swalFileListSingleAction } from "../../../utils/swal-utils";
import { getEntityDataById } from "../../../../stores/slices/datasetEntityStructureSlice";
import { createStandardizedDatasetStructure } from "../../../utils/datasetStructure";
import {
  deleteEmptyFoldersFromStructure,
  setActiveFileExplorer,
} from "../../../../stores/slices/datasetTreeViewSlice";
import client from "../../../client";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const openPageDatasetStructure = async (targetPageID) => {
  // Add handlers for other pages without componentType
  if (targetPageID === "guided-unstructured-data-import-tab") {
    setActiveFileExplorer("guided-unstructured-data-import-tab");
  }

  if (targetPageID === "guided-dataset-structure-and-manifest-review-tab") {
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

    // Delete empty folders from the dataset structure
    window.datasetStructureJSONObj = deleteEmptyFoldersFromStructure(
      window.datasetStructureJSONObj
    );

    const sodaCopy = {
      ...window.sodaJSONObj,
      "metadata-files": {},
      "dataset-structure": standardizedStructure,
    };
    delete sodaCopy["generate-dataset"];

    const response = await client.post(
      "/curate_datasets/clean-dataset",
      { soda_json_structure: sodaCopy },
      { timeout: 0 }
    );

    const responseData = response.data.soda;

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
    newManifestData.data = sortManifestDataRows(newManifestData.data);

    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

    const updateEntityColumn = (manifestDataRows, datasetEntityObj) => {
      manifestDataRows.forEach((row) => {
        let path = row[0]; // Path is in the first column
        // replace the first part of the path with "data/"
        const pathSegments = path.split("/");
        if (pathSegments.length > 0) {
          pathSegments[0] = "data";
          path = pathSegments.join("/");
        }
        let entityList = [];

        const entityTypes = ["sites", "samples", "subjects", "performances"];

        for (const type of entityTypes) {
          const entities = datasetEntityObj?.[type] || {};
          for (const [entity, paths] of Object.entries(entities)) {
            if (paths?.[path]) {
              const entityData = getEntityDataById(entity);
              if (!entityData) {
                continue;
              }
              entityList.push(entityData.id);
              if (entityData?.["metadata"]?.["sample_id"]) {
                const sampleId = entityData["metadata"]["sample_id"];
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
      manifestDataRows.forEach((row) => {
        // Use the updated path (replace high-level folder with data/)
        let path = row[0]; // Path is in the first column
        const pathSegments = path.split("/");
        if (pathSegments.length > 0) {
          pathSegments[0] = "data";
          path = pathSegments.join("/");
        }
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

    // Update the column values for entities and modalities
    updateEntityColumn(newManifestData.data, datasetEntityObj);
    updateModalitiesColumn(newManifestData.data, datasetEntityObj);
    window.sodaJSONObj["guided-manifest-file-data"] = window.sodaJSONObj[
      "guided-manifest-file-data"
    ]
      ? window.diffCheckManifestFiles(
          newManifestData,
          window.sodaJSONObj["guided-manifest-file-data"]
        )
      : newManifestData;
  }
};
