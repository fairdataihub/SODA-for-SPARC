import useGlobalStore from "../../stores/globalStore";
import { reRenderTreeView } from "../../stores/slices/datasetTreeViewSlice";
import {
  deleteEmptyFoldersFromStructure,
  getInvertedDatasetEntityObj,
  filePassesAllFilters,
} from "../../stores/slices/datasetTreeViewSlice";
import { modifyDatasetEntityForRelativeFilePath } from "../../stores/slices/datasetEntitySelectorSlice";

export const countFilesInDatasetStructure = (datasetStructure) => {
  // If datasetStructure is an array (datasetRenderArray), count file items
  if (Array.isArray(datasetStructure)) {
    return datasetStructure.filter((item) => item.itemType === "file").length;
  }

  // Otherwise, fallback to legacy recursive count
  if (!datasetStructure || typeof datasetStructure !== "object") return 0;

  let totalFiles = 0;

  if (datasetStructure.files && typeof datasetStructure.files === "object") {
    totalFiles += Object.keys(datasetStructure.files).length;
  }

  if (datasetStructure.folders && typeof datasetStructure.folders === "object") {
    for (const folder of Object.values(datasetStructure.folders)) {
      totalFiles += countFilesInDatasetStructure(folder);
    }
  }

  return totalFiles;
};

export const getFileTypesArrayInDatasetStructure = (datasetStructure) => {
  // Collect unique file extensions from a nested dataset structure and return them sorted.

  const fileTypes = new Set();

  const walk = (node) => {
    if (node.files) {
      for (const fileObj of Object.values(node.files)) {
        if (typeof fileObj.extension === "string") {
          fileTypes.add(fileObj.extension);
        }
      }
    }

    if (node.folders) {
      for (const folderObj of Object.values(node.folders)) {
        walk(folderObj);
      }
    }
  };

  walk(datasetStructure);

  return Array.from(fileTypes).sort((a, b) => a.localeCompare(b));
};

/**
 * Creates a new empty folder object with standard properties
 * @returns {Object} A new empty folder object
 */
export const newEmptyFolderObj = () => {
  return { folders: {}, files: {}, type: "virtual", action: ["new"], location: "local" };
};

export const countSelectedFilesByEntityType = (entityType) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  if (!datasetEntityObj?.[entityType]) return 0;

  // Count total files across all entities using the map structure
  let totalCount = 0;
  const allEntities = Object.values(datasetEntityObj[entityType] || {});

  allEntities.forEach((entityFiles) => {
    // Each entry in entityFiles is a file path, so this is already counting only files
    totalCount += Object.keys(entityFiles).length;
  });

  return totalCount;
};

/**
 * Gets an array of file paths that are attributed to specific entity type(s)
 * @param {string|Array<string>} entityType - The entity type(s) to get files for (e.g., "data-folders", ["subjects", "samples"])
 * @param {string} [entityName] - Optional specific entity name to get files for
 * @returns {Array} Array of file relative paths attributed to the entity type(s)/name
 */
export const getFilesByEntityType = (entityType, entityName = null) => {
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Handle both string and array inputs
  const entityTypes = Array.isArray(entityType) ? entityType : [entityType];
  let allFilePaths = [];

  entityTypes.forEach((type) => {
    if (!datasetEntityObj?.[type]) return;

    if (entityName) {
      // Get files for a specific entity within the type
      const entityFiles = datasetEntityObj[type][entityName] || {};
      const filePaths = Object.keys(entityFiles).filter((filePath) => entityFiles[filePath]);
      allFilePaths = allFilePaths.concat(filePaths);
    } else {
      // Get files for all entities of this type
      const allEntities = Object.values(datasetEntityObj[type] || {});
      allEntities.forEach((entityFiles) => {
        const filePaths = Object.keys(entityFiles).filter((filePath) => entityFiles[filePath]);
        allFilePaths = allFilePaths.concat(filePaths);
      });
    }
  });

  return allFilePaths;
};

const getNestedObjectAtPathArray = (pathArray) => {
  let current = window.datasetStructureJSONObj;
  for (const folder of pathArray) {
    if (!current || !current.folders || !current.folders[folder]) {
      return null;
    }
    current = current.folders[folder];
  }
  return current;
};

export const getFolderDetailsByRelativePath = (relativePath) => {
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const folderName = pathSegments.pop();
  const parentFolder = getNestedObjectAtPathArray(pathSegments);
  const folderObject = parentFolder?.folders?.[folderName];
  const datasetStructureSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
  const entityFilters = useGlobalStore.getState().entityFilters;
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Recursively collect all fileObj.relativePath values in this folder and subfolders as an array, filtered
  const collectFileRelativePathsRecursively = (folderObj) => {
    let result = [];
    if (folderObj?.files) {
      Object.values(folderObj.files).forEach((fileObj) => {
        if (
          fileObj.relativePath &&
          filePassesAllFilters({
            filePath: fileObj.relativePath,
            entityFilters,
            searchFilter: datasetStructureSearchFilter,
            datasetEntityObj,
          })
        ) {
          result.push(fileObj.relativePath);
        }
      });
    }
    if (folderObj?.folders) {
      Object.values(folderObj.folders).forEach((subfolderObj) => {
        result = result.concat(collectFileRelativePathsRecursively(subfolderObj));
      });
    }
    return result;
  };

  let childrenFileRelativePaths = [];
  if (folderObject) {
    childrenFileRelativePaths = collectFileRelativePathsRecursively(folderObject);
  }

  return {
    parentFolder,
    itemName: folderName,
    itemObject: folderObject,
    childrenFileRelativePaths,
  };
};

export const getFileDetailsByRelativePath = (relativePath) => {
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const fileName = pathSegments.pop();
  const parentFolder = getNestedObjectAtPathArray(pathSegments);
  const fileObject = parentFolder?.files?.[fileName];
  return { parentFolder, itemName: fileName, itemObject: fileObject };
};

export const deleteFoldersByRelativePath = (arrayOfRelativePaths) => {
  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } =
      getFolderDetailsByRelativePath(relativePathToDelete);
    if (itemObject["location"] === "ps") {
      itemObject["action"].push("deleted");
    } else {
      delete parentFolder["folders"][itemName];
    }
  }
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const deleteFilesByRelativePath = (arrayOfRelativePaths) => {
  // Get the inverted entity object to find which entities each file belongs to
  const invertedDatasetEntityObj = getInvertedDatasetEntityObj();

  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } =
      getFileDetailsByRelativePath(relativePathToDelete);
    if (itemObject["location"] === "ps") {
      itemObject["action"].push("deleted");
    } else {
      delete parentFolder["files"][itemName];
    }

    // Remove from datasetEntityObj using existing utility functions
    const fileEntityMapping = invertedDatasetEntityObj[relativePathToDelete];
    if (fileEntityMapping) {
      Object.keys(fileEntityMapping).forEach((entityType) => {
        const entityNames = fileEntityMapping[entityType];
        entityNames.forEach((entityName) => {
          modifyDatasetEntityForRelativeFilePath(
            entityType,
            entityName,
            relativePathToDelete,
            "remove",
            false
          );
        });
      });
    }
  }
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const moveFileToTargetLocation = (relativePathToMove, destionationRelativeFolderPath) => {
  const { parentFolder, itemName, itemObject } = getFileDetailsByRelativePath(relativePathToMove);

  // Check if the file exists before trying to move it
  if (!itemObject || !parentFolder || !parentFolder.files || !parentFolder.files[itemName]) {
    console.warn(`moveFileToTargetLocation: File not found, skipping: ${relativePathToMove}`);
    return;
  }

  const filePathSegments = relativePathToMove.split("/").filter(Boolean);
  const subfolders = filePathSegments.slice(1, -1);
  const destinationPathSegments = destionationRelativeFolderPath
    .split("/")
    .filter(Boolean)
    .concat(subfolders);

  let currentFolder = window.datasetStructureJSONObj;
  for (const segment of destinationPathSegments) {
    if (!currentFolder || !currentFolder.folders) {
      if (!currentFolder) {
        console.error("moveFileToTargetLocation: currentFolder is null/undefined");
        return;
      }
      currentFolder.folders = {};
    }
    if (!currentFolder.folders[segment]) {
      currentFolder.folders[segment] = newEmptyFolderObj();
    }
    currentFolder = currentFolder.folders[segment];
  }

  if (!currentFolder) {
    console.error("moveFileToTargetLocation: target folder is null after path traversal");
    return;
  }

  if (!currentFolder.files) {
    currentFolder.files = {};
  }

  currentFolder["files"][itemName] = itemObject;
  delete parentFolder["files"][itemName];
};

export const createStandardizedDatasetStructure = (datasetStructure, datasetEntityObj) => {
  // --- Step 1: Preserve the original global structure ---
  let originalStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  // Remove any empty folders from the original structure
  originalStructure = deleteEmptyFoldersFromStructure(originalStructure);

  const moveFilesByCategory = (categoryObj, destFolder) => {
    if (!categoryObj) return;

    Object.keys(categoryObj).forEach((file) => {
      moveFileToTargetLocation(file, destFolder);
    });
  };
  try {
    // Move Code files into the code/ folder
    moveFilesByCategory(datasetEntityObj?.["non-data-folders"]?.["Code"], "code/");
    moveFilesByCategory(datasetEntityObj?.["non-data-folders"]?.["Docs"], "docs/");
    moveFilesByCategory(datasetEntityObj?.["non-data-folders"]?.["Protocol"], "protocol/");

    // Move Primary files into the primary/ folder
    // (Files that are marked as primary during the computational workflow)
    moveFilesByCategory(
      datasetEntityObj?.["experimental-data-categorization"]?.["Source"],
      "source/"
    );
    moveFilesByCategory(
      datasetEntityObj?.["experimental-data-categorization"]?.["Derivative"],
      "derivative/"
    );

    moveFilesByCategory(datasetEntityObj?.["remaining-data-categorization"]?.["Source"], "source/");
    moveFilesByCategory(
      datasetEntityObj?.["remaining-data-categorization"]?.["Derivative"],
      "derivative/"
    );

    // Get list of files in data folder and move them to primary
    const getDataFolderFiles = () => {
      const dataFolder = window.datasetStructureJSONObj?.folders?.data;
      if (!dataFolder) return [];

      const collectFiles = (folderObj) => {
        let files = [];
        if (folderObj?.files) {
          Object.values(folderObj.files).forEach((fileObj) => {
            if (fileObj.relativePath) {
              files.push(fileObj.relativePath);
            }
          });
        }
        if (folderObj?.folders) {
          Object.values(folderObj.folders).forEach((subFolder) => {
            files = files.concat(collectFiles(subFolder));
          });
        }
        return files;
      };

      return collectFiles(dataFolder);
    };

    const dataFolderFiles = getDataFolderFiles();
    dataFolderFiles.forEach((filePath) => moveFileToTargetLocation(filePath, "primary/"));

    // Delete any empty folders in the dataset structure
    // (The window.datasetStructureJSONObj can be used since the move fns already update it)
    window.datasetStructureJSONObj = deleteEmptyFoldersFromStructure(
      window.datasetStructureJSONObj
    );

    // --- Step 6: Capture the modified structure before reverting changes ---
    const standardizedStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));
    useGlobalStore.setState({ datasetStructureJSONObj: standardizedStructure });
    reRenderTreeView();
    // --- Step 7: Revert any global changes to window.datasetStructureJSONObj ---
    window.datasetStructureJSONObj = originalStructure;

    return standardizedStructure;
  } catch (error) {
    console.error("Error while creating standardized dataset structure:", error);
    window.datasetStructureJSONObj = originalStructure;
    throw error;
  }
};
