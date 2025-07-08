import useGlobalStore from "../../stores/globalStore";
import { setTreeViewDatasetStructure } from "../../stores/slices/datasetTreeViewSlice";
import { setFolderMoveMode } from "../../stores/slices/datasetTreeViewSlice";
import { deleteEmptyFoldersFromStructure } from "../../stores/slices/datasetTreeViewSlice";

export const countFilesInDatasetStructure = (datasetStructure) => {
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
  console.log("newEmptyFolderObj");
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
      return null; // or undefined, or throw new Error(...) depending on your needs
    }
    current = current.folders[folder];
  }

  return current;
};

export const getItemAtPath = (relativePath, itemType) => {
  console.log("getItemAtPath called with relativePath:", relativePath, "itemType:", itemType);
  // Split the relative path into segments and isolate the item name.
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const itemName = pathSegments.pop();

  // Get the parent folder by traversing the path segments.
  const parentFolder = getNestedObjectAtPathArray(pathSegments);
  if (!parentFolder) {
    console.error(`Parent folder not found for path: ${relativePath}`);
    return null;
  }

  // Retrieve the target item from the parent folder based on its type.
  const itemObject =
    itemType === "folder" ? parentFolder["folders"][itemName] : parentFolder["files"][itemName];

  if (!itemObject) {
    console.error(`Item not found at path: ${relativePath}`);
    return null;
  }

  return { parentFolder, itemName, itemObject };
};

export const deleteFoldersByRelativePath = (arrayOfRelativePaths) => {
  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToDelete, "folder");

    if (itemObject?.["location"] === "ps") {
      // Mark folders from Pennsieve for deletion instead of directly deleting them.
      parentFolder["folders"][itemName]["action"].push("deleted");
    } else {
      // Directly delete folders not originating from Pennsieve.
      delete parentFolder["folders"][itemName];
    }
  }

  // Update the tree view structure to reflect the changes.
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

export const deleteFilesByRelativePath = (arrayOfRelativePaths) => {
  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToDelete, "file");

    if (itemObject?.["location"] === "ps") {
      // Mark files from Pennsieve for deletion instead of directly deleting them.
      parentFolder["files"][itemName]["action"].push("deleted");
    } else {
      // Directly delete files not originating from Pennsieve.
      delete parentFolder["files"][itemName];
    }
  }

  // Update the tree view structure to reflect the changes.
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

export const moveFoldersToTargetLocation = (
  arrayOfRelativePathsToMove,
  destionationRelativePath
) => {
  console.log("moveFoldersByRelativePath called");
  console.log("arrayOfRelativePathsToMove", arrayOfRelativePathsToMove);
  console.log("destionationRelativePath", destionationRelativePath);

  const {
    parentFolder: destinationParentFolder,
    itemName: destinationItemName,
    itemObject: destinationItemObject,
  } = getItemAtPath(destionationRelativePath, "folder");
  console.log("destinationParentFolder", destinationParentFolder);
  console.log("destinationItemName", destinationItemName);

  for (const relativePathToMove of arrayOfRelativePathsToMove) {
    const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToMove, "folder");
    console.log("parentFolder", parentFolder);
    console.log("itemName", itemName);
    console.log("itemObject", itemObject);
    // Move the folder to the destination folder.
    console.log("destinationItemObject before move", destinationItemObject);
    console.log("number of folders", Object.keys(destinationItemObject["folders"]).length);
    destinationItemObject["folders"][itemName] = itemObject;
    console.log("itemObject after move", destinationItemObject);
    console.log("number of folders", Object.keys(destinationItemObject["folders"]).length);

    // Remove the folder from its original location.
    delete parentFolder["folders"][itemName];
  }

  // Update the tree view structure to reflect the changes.
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

export const moveFilesToTargetLocation = (arrayOfRelativePathsToMove, destionationRelativePath) => {
  const {
    parentFolder: destinationParentFolder,
    itemName: destinationItemName,
    itemObject: destinationItemObject,
  } = getItemAtPath(destionationRelativePath, "folder");

  for (const relativePathToMove of arrayOfRelativePathsToMove) {
    const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToMove, "file");
    console.log("parentFolder for file", parentFolder);
    console.log("itemName for file", itemName);
    console.log("itemObject for file", itemObject);

    // Move the file to the destination folder.
    destinationItemObject["files"][itemName] = itemObject;

    // Remove the file from its original location.
    delete parentFolder["files"][itemName];
  }

  // Update the tree view structure to reflect the changes.
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

export const moveFileToTargetLocation = (relativePathToMove, destionationRelativeFolderPath) => {
  console.log("moveFileToTargetLocation called");
  console.log("relativePathToMove", relativePathToMove);

  // Get the file's path segments and file name
  const filePathSegments = relativePathToMove.split("/").filter(Boolean);
  // Don't pop fileName here, use itemName from getItemAtPath
  // Build the destination path: destination folder + file's subfolders (excluding the root folder of the file path)
  // For example, if relativePathToMove is data/experiment/Subject01/Tissue02/RegionB/metadata.txt
  // and destionationRelativeFolderPath is primary/,
  // the destination should be primary/experiment/Subject01/Tissue02/RegionB/metadata.txt
  // So, skip the first segment (e.g., 'data')
  const subfolders = filePathSegments.slice(1, -1); // skip the root folder and file name
  const destinationPathSegments = destionationRelativeFolderPath
    .split("/")
    .filter(Boolean)
    .concat(subfolders);

  // Ensure the destination folder path exists, create if missing
  let currentFolder = window.datasetStructureJSONObj;
  for (const segment of destinationPathSegments) {
    if (!currentFolder.folders) currentFolder.folders = {};
    if (!currentFolder.folders[segment]) {
      currentFolder.folders[segment] = newEmptyFolderObj();
    }
    currentFolder = currentFolder.folders[segment];
  }

  // Now get the file object from the original location
  const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToMove, "file");

  // Move the file to the destination folder.
  currentFolder["files"][itemName] = itemObject;

  // Remove the file from its original location.
  delete parentFolder["files"][itemName];

  // Update the tree view structure to reflect the changes.
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

export const createStandardizedDatasetStructure = (datasetStructure, datasetEntityObj) => {
  // --- Step 1: Preserve the original global structure ---
  const originalStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  // Helper to move files by mapping
  const moveFilesByCategory = (categoryObj, destFolder) => {
    if (!categoryObj) return;
    const files = Object.keys(categoryObj);
    for (const file of files) {
      moveFileToTargetLocation(file, destFolder);
    }
  };

  try {
    console.log("createStandardizedDatasetStructure");
    console.log("datasetStructure", datasetStructure);
    console.log("datasetEntityObj", datasetEntityObj);

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
    console.log("standardizedStructure", standardizedStructure);

    // --- Step 7: Revert any global changes to window.datasetStructureJSONObj ---
    window.datasetStructureJSONObj = originalStructure;

    return standardizedStructure;
  } catch (error) {
    console.error("Error while creating standardized dataset structure:", error);
    window.datasetStructureJSONObj = originalStructure;
    throw error;
  }
};
