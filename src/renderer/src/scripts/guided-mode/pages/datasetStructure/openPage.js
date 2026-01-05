import { swalListSingleAction } from "../../../utils/swal-utils";
import { getEntityDataById } from "../../../../stores/slices/datasetEntityStructureSlice";
import { createStandardizedDatasetStructure } from "../../../utils/datasetStructure";
import { deleteEmptyFoldersFromStructure } from "../../../../stores/slices/datasetTreeViewSlice";
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

      const collectNonExistentFiles = async (current, currentPath = "") => {
        for (const [fileName, fileData] of Object.entries(current.files || {})) {
          if (fileData.type === "local" && !(await window.fs.existsSync(fileData.path))) {
            nonExistentFiles.push(`${currentPath}${fileName}`);
          }
        }

        await Promise.all(
          Object.entries(current.folders || {}).map(([folderName, folder]) =>
            collectNonExistentFiles(folder, `${currentPath}${folderName}/`)
          )
        );
      };

      const deleteNonExistentFiles = (current) => {
        const files = current?.files || {};
        for (const fileName in files) {
          const fileData = files[fileName];
          if (fileData.type === "local" && !window.fs.existsSync(fileData.path)) {
            delete files[fileName];
          }
        }

        Object.values(current.folders || {}).forEach(deleteNonExistentFiles);
      };

      await collectNonExistentFiles(datasetStructure);
      if (nonExistentFiles.length > 0) {
        await swalListSingleAction(
          nonExistentFiles,
          "Files imported into SODA that are no longer on your computer were detected",
          "These files will be disregarded and not uploaded to Pennsieve.",
          ""
        );
        deleteNonExistentFiles(datasetStructure);
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
      const entityTypes = ["sites", "samples", "subjects", "performances"];

      rows.forEach((row) => {
        let path = row[0];
        const pathSegments = path.split("/");
        if (pathSegments.length > 0) pathSegments[0] = "data";
        path = pathSegments.join("/");

        const entityList = [];

        for (const type of entityTypes) {
          const entities = datasetEntityObj?.[type] || {};
          for (const [entity, paths] of Object.entries(entities)) {
            if (paths?.[path]) {
              const entityData = getEntityDataById(entity);
              if (!entityData) continue;

              entityList.push(entityData.id);
              if (entityData?.metadata?.sample_id) entityList.push(entityData.metadata.sample_id);
              if (entityData?.metadata?.["subject id"])
                entityList.push(entityData.metadata["subject id"]);
              break;
            }
          }
        }

        row[entityColumnIndex] = [...new Set(entityList)].join(" ");
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

    // Merge with existing manifest diff (if any)
    const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"]
      ? window.diffCheckManifestFiles(
          newManifestData,
          window.sodaJSONObj["guided-manifest-file-data"]
        )
      : newManifestData;

    updateEntityColumn(guidedManifestData.data);
    updateModalitiesColumn(guidedManifestData.data);

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
