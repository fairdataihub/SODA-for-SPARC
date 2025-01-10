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
const folderObjMatchesSearch = (folderObj, searchFilter) => {
  if (!searchFilter) {
    return { matchesDirectly: true, matchesFilesDirectly: true, passThrough: false };
  }

  const folderRelativePath = folderObj.relativePath.toLowerCase();
  const matchesDirectly = folderRelativePath.includes(searchFilter);
  const matchesFilesDirectly = Object.values(folderObj.files || {}).some((file) =>
    file.relativePath.toLowerCase().includes(searchFilter)
  );
  const subfolderMatches = Object.values(folderObj.folders || {}).some((subFolder) => {
    const result = folderObjMatchesSearch(subFolder, searchFilter);
    return result.matchesDirectly || result.matchesFilesDirectly || result.passThrough;
  });
  const passThrough = !matchesDirectly && !matchesFilesDirectly && subfolderMatches;

  return { matchesDirectly, matchesFilesDirectly, passThrough };
};

// Filters the dataset structure based on the current search filter
const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure;

  const pruneStructure = (folderObj, searchFilter) => {
    const { matchesDirectly, matchesFilesDirectly, passThrough } = folderObjMatchesSearch(
      folderObj,
      searchFilter
    );

    if (!matchesDirectly && !matchesFilesDirectly && !passThrough) return null;

    return produce(folderObj, (draft) => {
      for (const subFolder in draft.folders || {}) {
        if (!pruneStructure(draft.folders[subFolder], searchFilter)) {
          delete draft.folders[subFolder];
        }
      }
      for (const fileName in draft.files || {}) {
        if (!draft.files[fileName].relativePath.toLowerCase().includes(searchFilter)) {
          delete draft.files[fileName];
        }
      }
    });
  };

  return pruneStructure(structure, searchFilter.toLowerCase());
};

// Updates the dataset search filter and modifies the rendered structure
export const setDatasetStructureSearchFilter = (searchFilter) => {
  const globalStore = useGlobalStore.getState();

  const originalStructure = globalStore.datasetStructureJSONObj;
  const structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);
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
