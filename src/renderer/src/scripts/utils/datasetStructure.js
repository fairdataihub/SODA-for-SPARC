import useGlobalStore from "../../stores/globalStore";
import { reRenderTreeView } from "../../stores/slices/datasetTreeViewSlice";
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
  // Split the relative path into segments and isolate the item name.
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const itemName = pathSegments.pop();

  // Get the parent folder by traversing the path segments.
  console.log("getItemAtPath called with path:", relativePath);
  const parentFolder = getNestedObjectAtPathArray(pathSegments);
  if (!parentFolder) {
    console.error(`getItemAtPath: parentFolder not found for path: ${relativePath}`);
    return null;
  }
  console.log("getItemAtPath: parentFolder found for path:", relativePath, parentFolder);

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
    console.log("deleteFoldersByRelativePath called for path:", relativePathToDelete);
    const { parentFolder, itemName, itemObject } = getItemAtPath(relativePathToDelete, "folder");

    if (itemObject?.["location"] === "ps") {
      // Mark folders from Pennsieve for deletion instead of directly deleting them.
      parentFolder["folders"][itemName]["action"].push("deleted");
    } else {
      // Directly delete folders not originating from Pennsieve.
      delete parentFolder["folders"][itemName];
    }
    console.log("Delete Folder: parentFolder found for path:", relativePathToDelete, parentFolder);
  }

  // Update the tree view structure to reflect the changes.
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
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
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const moveFileToTargetLocation = (relativePathToMove, destionationRelativeFolderPath) => {
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
