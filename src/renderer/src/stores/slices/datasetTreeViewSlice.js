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
  try {
    console.log("Setting dataset search filter:", searchFilter);

    // Set the loading state for the rendered structure
    useGlobalStore.setState({
      datasetStructureSearchFilter: searchFilter || "",
      renderDatasetStructureJSONObjIsLoading: true,
    });

    const globalStore = useGlobalStore.getState();

    const originalStructure = globalStore.datasetStructureJSONObj;
    if (!originalStructure) {
      console.warn("Original structure is null or undefined");
      useGlobalStore.setState({
        renderDatasetStructureJSONObj: null,
        renderDatasetStructureJSONObjIsLoading: false,
      });
      return;
    }

    let structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);

    if (!structureToFilter) {
      console.warn("Structure to filter is null or undefined");
      useGlobalStore.setState({
        renderDatasetStructureJSONObj: null,
        renderDatasetStructureJSONObjIsLoading: false,
      });
      return;
    }

    // Create a deep copy to avoid proxy-related issues, but safely
    try {
      structureToFilter = JSON.parse(JSON.stringify(structureToFilter));
    } catch (error) {
      console.error("Error creating deep copy of structure:", error);
      // Continue with original reference if parsing fails
    }

    const filteredStructure = filterStructure(structureToFilter, searchFilter);

    useGlobalStore.setState({
      renderDatasetStructureJSONObj: filteredStructure,
      renderDatasetStructureJSONObjIsLoading: false,
    });
  } catch (error) {
    console.error("Error in setDatasetStructureSearchFilter:", error);
    // Reset to safe values in case of error
    useGlobalStore.setState({
      renderDatasetStructureJSONObj: null,
      renderDatasetStructureJSONObjIsLoading: false,
    });
  }
};

export const externallySetSearchFilterValue = (searchFilterValue) => {
  try {
    console.log("Externally setting search filter value:", searchFilterValue);
    useGlobalStore.setState({
      externallySetSearchFilterValue: searchFilterValue || "",
    });
  } catch (error) {
    console.error("Error in externallySetSearchFilterValue:", error);
    useGlobalStore.setState({
      externallySetSearchFilterValue: "",
    });
  }
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
  try {
    console.log("Setting tree view dataset structure");
    pathToRender = pathToRender ? pathToRender : useGlobalStore.getState().pathToRender;

    if (!datasetStructure) {
      console.warn("Dataset structure is null or undefined");
      return;
    }

    // Ensure immutability of the updated structure
    let updatedStructure;
    try {
      updatedStructure = JSON.parse(JSON.stringify(datasetStructure)); // Avoid direct mutation
    } catch (error) {
      console.error("Error creating deep copy of dataset structure:", error);
      updatedStructure = datasetStructure; // Fall back to original if stringify fails
    }

    // Add relative paths to the structure
    addRelativePaths(updatedStructure);

    // Traverse to the folder structure to be rendered and add relative paths
    const renderStructureRef = traverseStructureByPath(updatedStructure, pathToRender);
    if (renderStructureRef) {
      addRelativePaths(renderStructureRef, pathToRender);
    }

    // Add relative path to the window dataset structure
    if (window.datasetStructureJSONObj) {
      addRelativePaths(window.datasetStructureJSONObj, []);
    }

    // Update global store safely
    useGlobalStore.setState({
      datasetStructureJSONObj: updatedStructure,
      pathToRender,
      renderDatasetStructureJSONObj: renderStructureRef || { folders: {}, files: {} },
    });
  } catch (error) {
    console.error("Error in setTreeViewDatasetStructure:", error);
  }
};

// Opens the context menu
export const openContextMenu = (itemPosition, itemType, itemName, itemContent) => {
  try {
    let safeItemContent;
    try {
      safeItemContent = JSON.parse(JSON.stringify(itemContent));
    } catch (error) {
      console.error("Error stringifying context menu item content:", error);
      safeItemContent = {}; // Fallback to empty object if serialization fails
    }

    useGlobalStore.setState({
      contextMenuIsOpened: true,
      contextMenuPosition: itemPosition,
      contextMenuItemName: itemName,
      contextMenuItemType: itemType,
      contextMenuItemData: safeItemContent,
    });
  } catch (error) {
    console.error("Error in openContextMenu:", error);
  }
};

// Closes the context menu
export const closeContextMenu = () => {
  useGlobalStore.setState({
    contextMenuIsOpened: false,
  });
};

// Retrieves folder structure by path
export const getFolderStructureJsonByPath = (path) => {
  try {
    const globalStore = useGlobalStore.getState();
    const pathArray = typeof path === "string" ? path.split("/").filter(Boolean) : path;
    let structure = globalStore.datasetStructureJSONObj;

    pathArray.forEach((folder) => {
      structure = structure?.folders?.[folder];
      if (!structure) throw new Error(`Folder "${folder}" does not exist`);
    });

    return JSON.parse(JSON.stringify(structure)); // Avoid proxy-related issues
  } catch (error) {
    console.error("Error in getFolderStructureJsonByPath:", error);
    return { folders: {}, files: {} }; // Return empty structure on error
  }
};

// Folder move operations
export const setFolderMoveMode = (moveMode) => {
  useGlobalStore.setState({
    folderMoveModeIsActive: moveMode,
  });
};

export const moveFolderToNewLocation = (targetRelativePath) => {
  try {
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
  } catch (error) {
    console.error("Error in moveFolderToNewLocation:", error);
  }
};
