import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Initial state for managing dataset structure and filters
const initialState = {
  datasetStructureJSONObj: null, // Full dataset structure
  renderDatasetStructureJSONObj: null, // Rendered subset of dataset structure
  datasetStructureSearchFilter: "", // Current search filter text
  pathToRender: [], // Path to the folder currently rendered in the tree view
  contextMenuIsOpened: false, // Whether the context menu is open
  contextMenuPosition: { x: 0, y: 0 }, // Position of the context menu
  contextMenuItemType: null, // Type of item in the context menu
  contextMenuData: null, // Data for the context menu
};

// Create the dataset tree view slice for global state
export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});

// Traverses the dataset structure using the specified path
// Returns a reference to the nested folder at the specified path
const traverseStructureByPath = (structure, pathToRender) => {
  console.log("traverseStructureByPath", structure, pathToRender);
  let structureRef = structure;
  pathToRender.forEach((subFolder) => {
    structureRef = structureRef.folders[subFolder];
  });
  return structureRef;
};

// Determines if a folder or its subfolders/files match the search filter
const folderObjMatchesSearch = (folderObj, searchFilter) => {
  if (!searchFilter) {
    return {
      matchesDirectly: true,
      matchesFilesDirectly: true,
      passThrough: false,
    };
  }

  const folderRelativePath = folderObj.relativePath.toLowerCase();
  const matchesDirectly = folderRelativePath.includes(searchFilter);

  // Check if any files match the search filter
  const filesMatch = Object.values(folderObj.files || {}).some((file) =>
    file.relativePath.toLowerCase().includes(searchFilter)
  );

  // Check if any subfolders match the search filter
  const subfolderMatches = Object.values(folderObj.folders || {}).some((subFolder) => {
    const result = folderObjMatchesSearch(subFolder, searchFilter);
    return result.matchesDirectly || result.matchesFilesDirectly || result.passThrough;
  });

  // Determine if this folder is pass-through
  const passThrough = !matchesDirectly && !filesMatch && subfolderMatches;

  return {
    matchesDirectly,
    matchesFilesDirectly: filesMatch,
    passThrough,
  };
};

// Filters the dataset structure based on the current search filter
const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure;

  const lowerCaseSearchFilter = searchFilter.toLowerCase();

  // Recursively prunes the dataset structure to retain only matching folders/files
  const pruneStructure = (folderObj, searchFilter) => {
    // Check if the folder matches
    const { matchesDirectly, matchesFilesDirectly, passThrough } = folderObjMatchesSearch(
      folderObj,
      searchFilter
    );

    // If it doesn't match at all, return null to remove it
    if (!matchesDirectly && !matchesFilesDirectly && !passThrough) {
      return null;
    }

    // Set the keys in the folder object
    folderObj.matchesDirectly = matchesDirectly;
    folderObj.matchesFilesDirectly = matchesFilesDirectly;
    folderObj.passThrough = passThrough;

    // Recursively prune subfolders
    for (const subFolder of Object.keys(folderObj.folders || {})) {
      const prunedSubFolder = pruneStructure(folderObj.folders[subFolder], searchFilter);
      if (prunedSubFolder === null) {
        delete folderObj.folders[subFolder];
      }
    }

    // Prune files that don't match the search filter
    for (const fileName of Object.keys(folderObj.files || {})) {
      if (!folderObj.files[fileName].relativePath.toLowerCase().includes(searchFilter)) {
        delete folderObj.files[fileName];
      }
    }

    return folderObj;
  };

  // Deep copy the structure to avoid in-place modification
  const structureCopy = JSON.parse(JSON.stringify(structure));
  return pruneStructure(structureCopy, lowerCaseSearchFilter);
};

// Updates the dataset search filter and modifies the rendered structure accordingly
export const setDatasetStructureSearchFilter = (searchFilter) => {
  const globalStore = useGlobalStore.getState();

  console.log("Before filter set:", globalStore);

  // Deep copy the full dataset structure to prevent mutation
  const originalStructure = JSON.parse(JSON.stringify(globalStore.datasetStructureJSONObj));

  // Get the portion of the structure to filter based on the current path
  const structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);

  // Apply the search filter to the relevant structure
  const filteredStructure = filterStructure(structureToFilter, searchFilter);

  console.log("Filtered structure result:", filteredStructure);

  // Update global state with the filtered structure and search filter
  useGlobalStore.setState({
    ...globalStore,
    datasetStructureSearchFilter: searchFilter,
    renderDatasetStructureJSONObj: filteredStructure,
  });
};

// Sets the dataset structure and renders the specified path
export const setTreeViewDatasetStructure = (datasetStructure, pathToRender) => {
  // Deep copy the dataset structure to prevent mutation
  const clonedStructure = JSON.parse(JSON.stringify(datasetStructure));

  // Recursively adds relative paths to folders and files in the dataset structure
  const addRelativePaths = (obj, currentPath = []) => {
    for (const folderName in obj?.folders || {}) {
      const folderPath = [...currentPath, folderName].join("/") + "/";
      obj.folders[folderName].relativePath = folderPath;
      addRelativePaths(obj.folders[folderName], [...currentPath, folderName]);
    }

    for (const fileName in obj?.files || {}) {
      const filePath = [...currentPath, fileName].join("/");
      obj.files[fileName].relativePath = filePath;
    }
  };

  // Add relative paths to the full dataset structure
  addRelativePaths(clonedStructure);

  // Update the full dataset structure and path in the global store
  useGlobalStore.setState({
    datasetStructureJSONObj: clonedStructure,
    pathToRender: pathToRender,
  });

  // Traverse to the folder structure to be rendered
  const renderStructureRef = traverseStructureByPath(clonedStructure, pathToRender);
  console.log("Render structure ref:", renderStructureRef);

  // Add relative paths for the rendered subset
  addRelativePaths(renderStructureRef, pathToRender);

  // Update the rendered structure in the global store
  useGlobalStore.setState({
    renderDatasetStructureJSONObj: renderStructureRef,
  });

  // Reset the search filter when the dataset structure is updated
  setDatasetStructureSearchFilter("");
};

// Opens the context menu
export const openContextMenu = (itemPosition, itemType, itemName, itemContent) => {
  console.log("Opening context menu");
  console.log("itemType", itemType);
  console.log("itemName", itemName);
  console.log("itemContent", itemContent);
  const globalStore = useGlobalStore.getState();
  useGlobalStore.setState({
    ...globalStore,
    contextMenuIsOpened: true,
    contextMenuPosition: itemPosition,
    contextMenuItemType: itemType,
    contextMenuItemName: itemName,
    contextMenuItemData: JSON.parse(JSON.stringify(itemContent)),
  });
};

// Closes the context menu
export const closeContextMenu = () => {
  const globalStore = useGlobalStore.getState();
  useGlobalStore.setState({
    ...globalStore,
    contextMenuIsOpened: false,
  });
};

export const getFolderStructureJsonByPath = (path) => {
  if (typeof path === "string") {
    path = path.split("/").filter(Boolean); // Split string and remove empty segments
  } else if (!Array.isArray(path)) {
    throw new Error("Path must be a string or an array");
  }

  const globalStore = useGlobalStore.getState();
  let structure = globalStore.datasetStructureJSONObj;

  for (const folder of path) {
    if (!structure.folders || !structure.folders[folder]) {
      throw new Error(`Folder "${folder}" does not exist in the structure`);
    }
    structure = structure.folders[folder];
  }

  structure = JSON.parse(JSON.stringify(structure));

  return structure;
};

export const getFileStructureJsonByPath = (path) => {
  if (typeof path === "string") {
    path = path.split("/").filter(Boolean); // Split string and remove empty segments
  } else if (!Array.isArray(path)) {
    throw new Error("Path must be a string or an array");
  }
  // The file name is the last segment of the path
  const fileName = path.pop();
  console.log("folder path to get file structure", path);
  const folderStructure = getFolderStructureJsonByPath(path);
  const fileStructure = folderStructure.files[fileName];
  console.log("fileStructure", fileStructure);
  return fileStructure;
};

export const deleteFilesByRelativePath = (relativePaths) => {
  console.log("relativePaths to delete", relativePaths);
  const globalStore = useGlobalStore.getState(); // Get the current state
  const clonedStructure = JSON.parse(JSON.stringify(globalStore.datasetStructureJSONObj)); // Make a deep copy of the structure
  console.log("clonedStructure sub-c", clonedStructure["folders"]["primary"]["folders"]["sub-c"]);

  for (const relativePath of relativePaths) {
    const pathSegments = relativePath.split("/").filter(Boolean);
    const fileName = pathSegments.pop();
    console.log("pathSegments", pathSegments);
    console.log("fileName", fileName);
    const folderJson = getFolderStructureJsonByPath(pathSegments);

    if (!folderJson.files || !folderJson.files[fileName]) {
      throw new Error(`File "${fileName}" does not exist in the structure`);
    }
    console.log("folderJson before delete", folderJson);
    delete folderJson.files[fileName]; // Delete the file
    console.log("folderJson after delete", folderJson);

    // Update the folder and structure to reflect the deletion
    const updatedStructure = { ...clonedStructure };
    console.log("updatedStructure", updatedStructure);
    setTreeViewDatasetStructure(updatedStructure, globalStore.pathToRender);
  }
};

// Folder move operations
export const setFolderMoveMode = (moveMode) => {
  useGlobalStore.setState((state) => {
    return {
      ...state,
      folderMoveModeIsActive: moveMode,
    };
  });
};

export const moveFolderToNewLocation = (targetRelativePath) => {
  const { contextMenuItemName, contextMenuItemType, contextMenuItemData } =
    useGlobalStore.getState();
  const targetFolder = getFolderStructureJsonByPath(targetRelativePath);
  console.log(targetRelativePath, targetFolder);
  targetFolder.folders[contextMenuItemName] = contextMenuItemData;
  deleteFilesByRelativePath([contextMenuItemData.relativePath]);
  setFolderMoveMode(false);
};
