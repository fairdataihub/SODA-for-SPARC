import useGlobalStore from "../../stores/globalStore";
import { reRenderTreeView } from "../../stores/slices/datasetTreeViewSlice";
import { setFolderMoveMode } from "../../stores/slices/datasetTreeViewSlice";
import { deleteEmptyFoldersFromStructure } from "../../stores/slices/datasetTreeViewSlice";

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

  // Recursively collect all fileObj.relativePath values in this folder and subfolders as an array
  const collectFileRelativePathsRecursively = (folderObj) => {
    let result = [];
    if (folderObj?.files) {
      Object.values(folderObj.files).forEach((fileObj) => {
        if (fileObj.relativePath) result.push(fileObj.relativePath);
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
    console.log("deleteFoldersByRelativePath called for path:", relativePathToDelete);
    const { parentFolder, itemName, itemObject } =
      getFolderDetailsByRelativePath(relativePathToDelete);
    if (itemObject["location"] === "ps") {
      itemObject["action"].push("deleted");
    } else {
      delete parentFolder["folders"][itemName];
    }
    console.log("Delete Folder: parentFolder found for path:", relativePathToDelete, parentFolder);
  }
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const deleteFilesByRelativePath = (arrayOfRelativePaths) => {
  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } =
      getFileDetailsByRelativePath(relativePathToDelete);
    if (itemObject["location"] === "ps") {
      itemObject["action"].push("deleted");
    } else {
      delete parentFolder["files"][itemName];
    }
  }
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const moveFileToTargetLocation = (relativePathToMove, destionationRelativeFolderPath) => {
  const filePathSegments = relativePathToMove.split("/").filter(Boolean);
  const subfolders = filePathSegments.slice(1, -1);
  const destinationPathSegments = destionationRelativeFolderPath
    .split("/")
    .filter(Boolean)
    .concat(subfolders);

  let currentFolder = window.datasetStructureJSONObj;
  for (const segment of destinationPathSegments) {
    if (!currentFolder.folders) currentFolder.folders = {};
    if (!currentFolder.folders[segment]) {
      currentFolder.folders[segment] = newEmptyFolderObj();
    }
    currentFolder = currentFolder.folders[segment];
  }

  const { parentFolder, itemName, itemObject } = getFileDetailsByRelativePath(relativePathToMove);

  currentFolder["files"][itemName] = itemObject;
  delete parentFolder["files"][itemName];
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const createStandardizedDatasetStructure = (datasetStructure, datasetEntityObj) => {
  // --- Step 1: Preserve the original global structure ---
  let originalStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  // Remove any empty folders from the original structure
  originalStructure = deleteEmptyFoldersFromStructure(originalStructure);

  // Helper to move files by mapping
  const moveFilesByCategory = (categoryObj, destFolder) => {
    if (!categoryObj) return;
    const files = Object.keys(categoryObj);
    for (const file of files) {
      moveFileToTargetLocation(file, destFolder);
    }
  };

  try {
    // Move Code files into the code/ folder
    moveFilesByCategory(
      datasetEntityObj?.["high-level-folder-data-categorization"]?.["Code"],
      "code/"
    );

    // Move Experimental files into the primary/ folder
    moveFilesByCategory(
      datasetEntityObj?.["high-level-folder-data-categorization"]?.["Experimental"],
      "primary/"
    );

    // Move Documentation files into the docs/ folder
    moveFilesByCategory(
      datasetEntityObj?.["high-level-folder-data-categorization"]?.["Documentation"],
      "docs/"
    );

    // Move Protocol files into the protocols/ folder
    moveFilesByCategory(
      datasetEntityObj?.["high-level-folder-data-categorization"]?.["Protocol"],
      "protocol/"
    );

    // Delete any empty folders in the dataset structure
    // (The window.datasetStructureJSONObj can be used since the move fns already update it)
    window.datasetStructureJSONObj = deleteEmptyFoldersFromStructure(
      window.datasetStructureJSONObj
    );

    // --- Step 6: Capture the modified structure before reverting changes ---
    const standardizedStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));
    // --- Step 7: Revert any global changes to window.datasetStructureJSONObj ---
    window.datasetStructureJSONObj = originalStructure;

    return standardizedStructure;
  } catch (error) {
    console.error("Error while creating standardized dataset structure:", error);
    window.datasetStructureJSONObj = originalStructure;
    throw error;
  }
};
