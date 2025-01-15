import useGlobalStore from "../globalStore";
import { setTreeViewDatasetStructure } from "../slices/datasetTreeViewSlice";
import { setFolderMoveMode } from "../slices/datasetTreeViewSlice";

const getNestedObjectAtPathArray = (pathArray) => {
  // Traverse the dataset structure to find the object at the given path.
  let currentPath = window.datasetStructureJSONObj;
  for (const folder of pathArray) {
    currentPath = currentPath["folders"][folder];
  }
  return currentPath;
};

const getItemAtPath = (relativePath, itemType) => {
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

    if (itemObject?.["type"] === "bf") {
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

    if (itemObject?.["type"] === "bf") {
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
