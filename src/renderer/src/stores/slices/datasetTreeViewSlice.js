import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Initial state for managing dataset structure and filters
const initialState = {
  datasetStructureJSONObj: null,
  datasetStructureJSONObjHistory: [],
  datasetstructureJSONObjHistoryIndex: -1,
  renderDatasetStructureJSONObj: null,
  renderDatasetStructureJSONObjIsLoading: false,
  datasetStructureSearchFilter: "",
  pathToRender: [],
  contextMenuIsOpened: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItemName: null,
  contextMenuItemType: null,
  contextMenuItemData: null,
  externallySetSearchFilterValue: "",
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

export const setRenderDatasetStructureJSONObjIsLoading = (isLoading) => {
  useGlobalStore.setState({
    renderDatasetStructureJSONObjIsLoading: isLoading,
  });
};

const pruneFolder = (folder, searchFilter) => {
  const lowerCaseSearchFilter = searchFilter.toLowerCase();
  const folderMatches = folder.relativePath.toLowerCase().includes(lowerCaseSearchFilter);

  // Prune files
  const files = folder.files || {};
  const hasMatchingFiles =
    Object.keys(files).filter((key) =>
      files[key].relativePath.toLowerCase().includes(lowerCaseSearchFilter)
    ).length > 0;

  if (folderMatches || hasMatchingFiles) {
    return {
      ...folder,
      passThrough: false,
      files,
    };
  }

  // Prune subfolders
  const subfolders = folder.folders || {};
  const prunedSubfolders = Object.fromEntries(
    Object.entries(subfolders)
      .map(([key, subfolder]) => [key, pruneFolder(subfolder, lowerCaseSearchFilter)])
      .filter(([_, subfolder]) => subfolder !== null)
  );

  if (Object.keys(prunedSubfolders).length === 0) {
    console.log("Folder did not match search filter and has no subfolders or files:", folder); // Debug log
    console.log("Search filter:", lowerCaseSearchFilter); // Debug log
    return null;
  }

  return {
    ...folder,
    passThrough: true,
    folders: prunedSubfolders,
    files,
  };
};

// Entry point to filter the folder structure based on the search filter
export const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure; // If no filter, return the structure as is
  console.log("Filter structure called on structure: ", JSON.stringify(structure, null, 2)); // Debug log
  console.log("Search filter:", searchFilter); // Debug log
  console.time("Filter Structure"); // Debug log
  console.log(JSON.stringify(structure, null, 2)); // Debug log
  const result = pruneFolder(structure, searchFilter);
  console.timeEnd("Filter Structure");
  console.log("Result of filterStructure:", JSON.stringify(result, null, 2)); // Debug log

  return result;
};

// Updates the dataset search filter and modifies the rendered structure
export const setDatasetStructureSearchFilter = (searchFilter) => {
  // Set the loading state for the rendered structure
  useGlobalStore.setState({
    datasetStructureSearchFilter: searchFilter,
    renderDatasetStructureJSONObjIsLoading: true,
  });

  const globalStore = useGlobalStore.getState();

  const originalStructure = globalStore.datasetStructureJSONObj;
  let structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);
  structureToFilter = JSON.parse(JSON.stringify(structureToFilter)); // Avoid proxy-related issues

  const filteredStructure = filterStructure(structureToFilter, searchFilter);

  useGlobalStore.setState({
    renderDatasetStructureJSONObj: filteredStructure,
    renderDatasetStructureJSONObjIsLoading: false,
  });
};

export const externallySetSearchFilterValue = (searchFilterValue) => {
  useGlobalStore.setState({
    externallySetSearchFilterValue: searchFilterValue,
  });
};

export const addRelativePaths = (obj, currentPath = []) => {
  if (!obj) {
    console.log("object is null but had addRelativePaths called on it");
    return;
  }
  obj.relativePath = currentPath.join("/") + "/";
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

// Set the dataset structure and prepare it for rendering
export const setTreeViewDatasetStructure = (datasetStructure, pathToRender) => {
  pathToRender = pathToRender ? pathToRender : useGlobalStore.getState().pathToRender;
  // Recursively adds relative paths to folders and files in the dataset structure

  // Ensure immutability of the updated structure
  const updatedStructure = JSON.parse(JSON.stringify(datasetStructure)); // Avoid direct mutation
  addRelativePaths(updatedStructure); // Add relative paths to the structure

  // Traverse to the folder structure to be rendered and add relative paths
  const renderStructureRef = traverseStructureByPath(updatedStructure, pathToRender);
  addRelativePaths(renderStructureRef, pathToRender);

  // Add relative path to the window dataset structure
  addRelativePaths(window.datasetStructureJSONObj, []);

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
