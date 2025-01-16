import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Initial state for managing dataset structure and filters
const initialState = {
  datasetStructureJSONObj: null,
  datasetStructureJSONObjHistory: [],
  datasetstructureJSONObjHistoryIndex: -1,
  renderDatasetStructureJSONObj: null,
  datasetStructureSearchFilter: "",
  pathToRender: [],
  contextMenuIsOpened: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItemName: null,
  contextMenuItemType: null,
  contextMenuItemData: null,
};

// Create the dataset tree view slice for global state
export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});

// Traverses the dataset structure using the specified path
const traverseStructureByPath = (structure, pathToRender) => {
  let structureRef = structure;
  pathToRender.forEach((subFolder) => {
    structureRef = structureRef?.folders?.[subFolder];
  });
  return structureRef;
};

// Determines if a folder or its subfolders/files match the search filter
const folderMatchesSearch = (folder, searchFilter) => {
  const folderRelativePath = folder.relativePath.toLowerCase();
  const matchesDirectly = folderRelativePath.includes(searchFilter);
  const matchesFilesDirectly = Object.values(folder.files || {}).some((file) =>
    file.relativePath.toLowerCase().includes(searchFilter)
  );
  const subfolderMatches = Object.values(folder.folders || {}).some((subFolder) =>
    folderMatchesSearch(subFolder, searchFilter)
  );

  return { matchesDirectly, matchesFilesDirectly, subfolderMatches };
};

// Determines if a folder should be kept or pruned based on search filter
const pruneFolder = (folder, searchFilter) => {
  // Check if the folder itself or its contents match the search filter
  const { matchesDirectly, matchesFilesDirectly, subfolderMatches } = folderMatchesSearch(
    folder,
    searchFilter
  );

  // If nothing matches and the folder has no subfolders or files to pass through, return null
  if (!matchesDirectly && !matchesFilesDirectly && !subfolderMatches) return null;

  // Mark if the folder should pass through (i.e., it has matching subfolders or files but itself does not match)
  const passThrough = !matchesDirectly && !matchesFilesDirectly && subfolderMatches;

  // Keep the folder and its properties
  const prunedFolder = {
    ...folder,
    matchesDirectly,
    matchesFilesDirectly,
    passThrough,
  };

  // Prune subfolders recursively
  if (prunedFolder.folders) {
    prunedFolder.folders = Object.entries(prunedFolder.folders)
      .map(([key, subFolder]) => {
        const prunedSubFolder = pruneFolder(subFolder, searchFilter);
        if (!prunedSubFolder) return null;
        return { [key]: prunedSubFolder };
      })
      .filter(Boolean)
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  // Prune files based on the search filter
  if (prunedFolder.files) {
    prunedFolder.files = Object.entries(prunedFolder.files)
      .filter(([_, file]) => file.relativePath.toLowerCase().includes(searchFilter))
      .reduce((acc, [key, file]) => ({ ...acc, [key]: file }), {});
  }

  return prunedFolder;
};

// Filter structure based on search filter
const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure;
  const lowerCaseSearchFilter = searchFilter.toLowerCase();
  return pruneFolder(structure, lowerCaseSearchFilter);
};

// Updates the dataset search filter and modifies the rendered structure
export const setDatasetStructureSearchFilter = (searchFilter) => {
  const globalStore = useGlobalStore.getState();

  const originalStructure = globalStore.datasetStructureJSONObj;
  let structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);
  structureToFilter = JSON.parse(JSON.stringify(structureToFilter)); // Avoid proxy-related issues

  const filteredStructure = filterStructure(structureToFilter, searchFilter);

  useGlobalStore.setState({
    datasetStructureSearchFilter: searchFilter,
    renderDatasetStructureJSONObj: filteredStructure,
  });
};

// Set the dataset structure and prepare it for rendering
export const setTreeViewDatasetStructure = (datasetStructure, pathToRender) => {
  pathToRender = pathToRender ? pathToRender : useGlobalStore.getState().pathToRender;
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

  // Ensure immutability of the updated structure
  const updatedStructure = JSON.parse(JSON.stringify(datasetStructure)); // Avoid direct mutation
  addRelativePaths(updatedStructure); // Add relative paths to the structure

  // Traverse to the folder structure to be rendered and add relative paths
  const renderStructureRef = traverseStructureByPath(updatedStructure, pathToRender);
  addRelativePaths(renderStructureRef, pathToRender);

  // Update global store safely
  useGlobalStore.setState({
    datasetStructureJSONObj: updatedStructure,
    pathToRender,
    renderDatasetStructureJSONObj: renderStructureRef,
  });
};

// Opens the context menu
export const openContextMenu = (itemPosition, itemType, itemName, itemContent) => {
  useGlobalStore.setState({
    contextMenuIsOpened: true,
    contextMenuPosition: itemPosition,
    contextMenuItemName: itemName,
    contextMenuItemType: itemType,
    contextMenuItemData: JSON.parse(JSON.stringify(itemContent)),
  });
};

// Closes the context menu
export const closeContextMenu = () => {
  useGlobalStore.setState({
    contextMenuIsOpened: false,
  });
};

// Retrieves folder structure by path
export const getFolderStructureJsonByPath = (path) => {
  const globalStore = useGlobalStore.getState();
  const pathArray = typeof path === "string" ? path.split("/").filter(Boolean) : path;
  let structure = globalStore.datasetStructureJSONObj;

  pathArray.forEach((folder) => {
    structure = structure?.folders?.[folder];
    if (!structure) throw new Error(`Folder "${folder}" does not exist`);
  });

  return JSON.parse(JSON.stringify(structure)); // Avoid proxy-related issues
};

// Folder move operations
export const setFolderMoveMode = (moveMode) => {
  useGlobalStore.setState({
    folderMoveModeIsActive: moveMode,
  });
};

export const moveFolderToNewLocation = (targetRelativePath) => {
  const globalStore = useGlobalStore.getState();
  const { contextMenuItemName, contextMenuItemType, contextMenuItemData } = globalStore;

  console.log("contextMenuItemName:", contextMenuItemName); // Debug log
  console.log("contextMenuItemType:", contextMenuItemType); // Debug log
  console.log("contextMenuItemData:", contextMenuItemData); // Debug log

  if (!contextMenuItemName || !contextMenuItemData) {
    throw new Error("Missing contextMenuItemName or contextMenuItemData.");
  }

  // Get the stringified JSON object of the target folder (where we will be moving the folder)
  const targetFolder = getFolderStructureJsonByPath(targetRelativePath);

  if (!targetFolder) {
    throw new Error(`Target folder at path "${targetRelativePath}" not found.`);
  }

  const originalStructure = globalStore.datasetStructureJSONObj;
  const folderToDeletePathSegments = contextMenuItemData.relativePath.split("/").filter(Boolean);
  console.log("folderToDeletePathSegments:", folderToDeletePathSegments);
  const parentFolder = traverseStructureByPath(
    originalStructure,
    folderToDeletePathSegments.slice(0, -1)
  );

  if (!parentFolder || !parentFolder.folders[contextMenuItemName]) {
    throw new Error(`Folder "${contextMenuItemName}" not found in the original location.`);
  }

  useGlobalStore.setState(
    produce((state) => {
      delete parentFolder.folders[contextMenuItemName];
      targetFolder.folders[contextMenuItemName] = contextMenuItemData;
      targetFolder.folders[contextMenuItemName].relativePath =
        `${targetRelativePath}/${contextMenuItemName}`;

      setTreeViewDatasetStructure(state.datasetStructureJSONObj, globalStore.pathToRender);
    })
  );
};
