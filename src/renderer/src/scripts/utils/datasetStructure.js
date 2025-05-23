import useGlobalStore from "../../stores/globalStore";
import { setTreeViewDatasetStructure } from "../../stores/slices/datasetTreeViewSlice";
import { setFolderMoveMode } from "../../stores/slices/datasetTreeViewSlice";

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
  return { folders: {}, files: {}, type: "virtual", action: ["new"] };
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
  // Traverse the dataset structure to find the object at the given path.
  let currentPath = window.datasetStructureJSONObj;
  for (const folder of pathArray) {
    currentPath = currentPath["folders"][folder];
  }
  return currentPath;
};

const getItemAtPath = (relativePath, itemType) => {
  if (itemType === "folder") {
    console.log("hey");
    console.log("relativePath", relativePath);
  }
  // Split the relative path into segments and isolate the item name.
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const itemName = pathSegments.pop();

  // Get the parent folder by traversing the path segments.
  const parentFolder = getNestedObjectAtPathArray(pathSegments);

  // Retrieve the target item from the parent folder based on its type.
  const itemObject =
    itemType === "folder" ? parentFolder["folders"][itemName] : parentFolder["files"][itemName];

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
  const {
    parentFolder: destinationParentFolder,
    itemName: destinationItemName,
    itemObject: destinationItemObject,
  } = getItemAtPath(destionationRelativeFolderPath, "folder");
  console.log("destinationParentFolder", destinationParentFolder);
  console.log("destinationItemName", destinationItemName);
  console.log("destinationItemObject", destinationItemObject);

  const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToMove, "file");

  // Move the file to the destination folder.
  destinationItemObject["files"][itemName] = itemObject;

  // Remove the file from its original location.
  delete parentFolder["files"][itemName];

  // Update the tree view structure to reflect the changes.
  setTreeViewDatasetStructure(window.datasetStructureJSONObj);
};

export const createStandardizedDatasetStructure = (datasetStructure, datasetEntityObj) => {
  console.log("createStandardizedDatasetStructure");
  console.log("datasetStructure", datasetStructure);
  console.log("datasetEntityObj", datasetEntityObj);
  const foldersToMoveToCodeFolder = Object.keys(
    datasetEntityObj?.["high-level-folder-data-categorization"]?.["Code"] || {}
  );
  console.log("foldersToMoveToCodeFolder", foldersToMoveToCodeFolder);
  datasetStructure["folders"]["code"] = newEmptyFolderObj();
  for (const folder of foldersToMoveToCodeFolder) {
    moveFileToTargetLocation(folder, "code/");
  }
  return window.datasetStructureJSONObj;
};
