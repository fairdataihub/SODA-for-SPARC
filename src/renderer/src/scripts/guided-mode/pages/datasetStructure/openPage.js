import { swalListSingleAction, swalListDoubleAction } from "../../../utils/swal-utils";
import { getEntityDataById } from "../../../../stores/slices/datasetEntityStructureSlice";
import {
  createStandardizedDatasetStructure,
  deleteFilesByRelativePath,
} from "../../../utils/datasetStructure";
import { deleteEmptyFoldersFromStructure } from "../../../../stores/slices/datasetTreeViewSlice";
import { returnUserToFirstPage } from "../navigationUtils/pageSkipping";
import useGlobalStore from "../../../../stores/globalStore";
import client from "../../../client";
import {
  isCheckboxCardChecked,
  setCheckboxCardChecked,
} from "../../../../stores/slices/checkboxCardSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const openPageDatasetStructure = async (targetPageID) => {
  // Add handlers for other pages without componentType

  if (targetPageID === "guided-dataset-structure-and-manifest-review-tab") {
    // Remove existing manifest files from the dataset structure
    Object.values(window.datasetStructureJSONObj.folders).forEach((folder) => {
      delete folder.files["manifest.xlsx"];
    });

    /**
     * Purge non-existent files from the dataset structure.
     */
    const purgeNonExistentFiles = async (datasetStructure) => {
      const nonExistentFiles = [];
      const nonExistentRelativePaths = [];

      const collectNonExistentFiles = async (current) => {
        for (const [fileName, fileData] of Object.entries(current.files || {})) {
          if (fileData.location === "local" && !window.fs.existsSync(fileData.path)) {
            // Use the actual file path so users can see what's missing
            nonExistentFiles.push(fileData.path);
            // Also collect relative paths for deletion function
            nonExistentRelativePaths.push(fileData.relativePath);
          }
        }

        await Promise.all(
          Object.values(current.folders || {}).map((folder) => collectNonExistentFiles(folder))
        );
      };

      await collectNonExistentFiles(datasetStructure);
      if (nonExistentFiles.length > 0) {
        const userConfirmedRemoval = await swalListDoubleAction(
          nonExistentFiles,
          "Missing files detected in your dataset",
          "The following files were imported into SODA but can no longer be found on your computer. SODA can remove these missing files from your dataset structure, but then will have to take you back to the first page to continue (you will only lose progress regarding the files not found). It would be better to restore these files to their original locations if possible.",
          "Remove missing files",
          "Keep references",
          "Would you like SODA to remove these missing files from your dataset?"
        );

        if (userConfirmedRemoval) {
          // Use deleteFilesByRelativePath with relative paths, not file paths
          deleteFilesByRelativePath(nonExistentRelativePaths);
          // Update the sodaJSONObj with the cleaned entity object from global store
          window.sodaJSONObj["dataset-entity-obj"] = useGlobalStore.getState().datasetEntityObj;
          // Ensure dataset structure is not undefined after purging
          if (!window.datasetStructureJSONObj) {
            window.datasetStructureJSONObj = { folders: {}, files: {} };
          }
          // Set flag that user should be redirected to first page
          window.sodaJSONObj["redirect-to-first-page-after-error"] = true;
          // Throw an error to trigger the error handler which will handle the redirect
          throw new Error("Files were purged - redirecting to first page");
        }
      }
    };

    await purgeNonExistentFiles(window.datasetStructureJSONObj);

    // Remove empty folders
    window.datasetStructureJSONObj = deleteEmptyFoldersFromStructure(
      window.datasetStructureJSONObj
    );

    // Prepare cleaned dataset structure for server-side processing
    const sodaCopy = {
      ...window.sodaJSONObj,
      "metadata-files": {},
      "dataset-structure": createStandardizedDatasetStructure(
        window.datasetStructureJSONObj,
        window.sodaJSONObj["dataset-entity-obj"]
      ),
    };
    delete sodaCopy["generate-dataset"];

    // Clean dataset via backend
    const { data: cleanResponse } = await client.post(
      "/curate_datasets/clean-dataset",
      { soda_json_structure: sodaCopy },
      { timeout: 0 }
    );

    const responseData = cleanResponse.soda;

    // Generate manifest file data
    const { data: manifestRes } = await client.post(
      "/curate_datasets/generate_manifest_file_data",
      { dataset_structure_obj: responseData["dataset-structure"] },
      { timeout: 0 }
    );

    const newManifestData = { headers: manifestRes.shift(), data: manifestRes };
    // wait for 100 seconds
    const entityColumnIndex = newManifestData.headers.indexOf("entity");

    /**
     * Sort manifest rows based on top-level folder order.
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

      const getTopLevelFolder = (path) => (path.includes("/") ? path.split("/")[0] : path);

      return rows.sort((a, b) => {
        const pathA = a[0] || "";
        const pathB = b[0] || "";
        const folderA = getTopLevelFolder(pathA);
        const folderB = getTopLevelFolder(pathB);
        const priorityA = folderOrder[folderA] ?? Infinity;
        const priorityB = folderOrder[folderB] ?? Infinity;

        if (priorityA !== priorityB) return priorityA - priorityB;
        if (folderA === "data" && folderB !== "data") return -1;
        if (folderB === "data" && folderA !== "data") return 1;

        return pathA.localeCompare(pathB);
      });
    };

    newManifestData.data = sortManifestDataRows(newManifestData.data);

    const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

    /**
     * Update entity column values.
     */
    const updateEntityColumn = (rows) => {
      const entityTypes = ["sites", "derived-samples", "samples", "subjects"];

      rows.forEach((row) => {
        let path = row[0];
        const pathSegments = path.split("/");
        if (pathSegments.length > 0) pathSegments[0] = "data";
        path = pathSegments.join("/");

        let entityId = "";

        for (const type of entityTypes) {
          const entities = datasetEntityObj?.[type] || {};
          for (const [entity, paths] of Object.entries(entities)) {
            if (paths?.[path]) {
              const { entityMetadata } = getEntityDataById(entity) || {};
              if (!entityMetadata) continue;

              entityId = entityMetadata.id;
              break;
            }
          }
          if (entityId) break;
        }

        row[entityColumnIndex] = entityId;
      });

      return rows;
    };

    /**
     * Update modalities column values.
     */
    const updateModalitiesColumn = (rows) => {
      const modalitiesColumnIndex = newManifestData.headers.indexOf("data modality");

      rows.forEach((row) => {
        let path = row[0];
        const pathSegments = path.split("/");
        if (pathSegments.length > 0) pathSegments[0] = "data";
        path = pathSegments.join("/");

        const modalitiesList = [];
        for (const [modality, paths] of Object.entries(datasetEntityObj?.modalities || {})) {
          if (paths?.[path]) modalitiesList.push(modality);
        }

        row[modalitiesColumnIndex] = modalitiesList.join(" ");
      });

      return rows;
    };

    /**
     * Update also in dataset column values from entity metadata.
     */
    const updateAlsoInDatasetColumn = (rows) => {
      const alsoInDatasetColumnIndex = newManifestData.headers.indexOf("also in dataset");

      if (alsoInDatasetColumnIndex === -1) return rows; // Column doesn't exist

      rows.forEach((row) => {
        let path = row[0];
        const pathSegments = path.split("/");
        if (pathSegments.length > 0) pathSegments[0] = "data";
        path = pathSegments.join("/");

        let alsoInDatasetValue = "";

        const entityTypes = ["samples", "subjects"];
        for (const type of entityTypes) {
          const entities = datasetEntityObj?.[type] || {};
          for (const [entity, paths] of Object.entries(entities)) {
            if (paths?.[path]) {
              const { entityMetadata } = getEntityDataById(entity) || {};
              if (entityMetadata?.metadata?.also_in_dataset) {
                alsoInDatasetValue = entityMetadata.metadata.also_in_dataset;
                break;
              }
            }
          }
          if (alsoInDatasetValue) break;
        }

        row[alsoInDatasetColumnIndex] = alsoInDatasetValue;
      });

      return rows;
    };

    // Merge with existing manifest diff (if any)
    const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"]
      ? window.diffCheckManifestFiles(
          newManifestData,
          window.sodaJSONObj["guided-manifest-file-data"]
        )
      : newManifestData;

    updateEntityColumn(guidedManifestData.data);
    updateModalitiesColumn(guidedManifestData.data);
    updateAlsoInDatasetColumn(guidedManifestData.data);

    // Save final manifest data
    window.sodaJSONObj["guided-manifest-file-data"] = guidedManifestData;
  }
  if (targetPageID == "guided-modalities-selection-tab") {
    let modalities = window.sodaJSONObj["button-config"]["multiple-modalities"];
    if (modalities === "yes") {
      setCheckboxCardChecked("modality-selection-yes");
    } else if (modalities === "no") {
      setCheckboxCardChecked("modality-selection-no");
    }
  }
};
