import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Initial state for managing dataset structure and filters
const initialState = {
  datasetStructureJSONObj: null, // The main dataset structure object
  datasetStructureJSONObjHistory: [], // History of dataset structure changes
  datasetstructureJSONObjHistoryIndex: -1, // Index for undo/redo functionality
  renderDatasetStructureJSONObj: null, // The dataset structure currently being rendered
  renderDatasetStructureJSONObjIsLoading: false, // Loading state for rendering
  datasetStructureSearchFilter: "", // Current search filter for the dataset structure
  pathToRender: [], // Path to the folder currently being rendered
  contextMenuIsOpened: false, // Whether the context menu is open
  contextMenuPosition: { x: 0, y: 0 }, // Position of the context menu
  contextMenuItemName: null, // Name of the item for the context menu
  contextMenuItemType: null, // Type of the item for the context menu
  contextMenuItemData: null, // Data associated with the context menu item
  externallySetSearchFilterValue: "", // Search filter value set externally
  entityFilterActive: false, // Flag to indicate if entity filtering is active
  entityFilterType: null, // Type of entity to filter by (e.g., "categorized-data", "subjects")
  entityFilterName: null, // Name of entity to filter by (e.g., "Code", "sub-001")
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

// Sets the loading state for rendering the dataset structure
export const setRenderDatasetStructureJSONObjIsLoading = (isLoading) => {
  useGlobalStore.setState({
    renderDatasetStructureJSONObjIsLoading: isLoading,
  });
};

// Prunes the folder structure based on the search filter and optional entity filter
const pruneFolder = (folder, searchFilter, entityFilterConfig = null) => {
  if (!folder) return null;

  console.log("Pruning folder:", folder.relativePath);
  console.log("Entity filter config:", entityFilterConfig);

  const lowerCaseSearchFilter = searchFilter.toLowerCase();
  const folderMatches =
    folder.relativePath && folder.relativePath.toLowerCase().includes(lowerCaseSearchFilter);

  // Check if any files match the search filter
  const files = folder.files || {};
  let matchingFiles = {};

  // Filter files by search term AND entity filter if active
  Object.keys(files).forEach((key) => {
    const file = files[key];
    const filePathMatches =
      file.relativePath && file.relativePath.toLowerCase().includes(lowerCaseSearchFilter);

    // Apply combined filtering:
    // 1. File matches search filter (or no search filter)
    // 2. File is associated with the selected entity (if entity filter is active)
    const matchesSearch = !lowerCaseSearchFilter || filePathMatches;

    if (entityFilterConfig && entityFilterConfig.active) {
      const { entityType, entityName } = entityFilterConfig;

      const isAssociated = checkIfFileAssociatedWithEntity(
        file.relativePath,
        entityType,
        entityName
      );
      console.log(`File ${file.relativePath} association with ${entityName}: ${isAssociated}`);

      if (matchesSearch && isAssociated) {
        matchingFiles[key] = file;
      }
    } else if (matchesSearch) {
      matchingFiles[key] = file;
    }
  });

  const hasMatchingFiles = Object.keys(matchingFiles).length > 0;
  console.log(
    `Folder ${folder.relativePath} has ${Object.keys(matchingFiles).length} matching files`
  );

  // Recursively prune subfolders first to determine if any contain matches
  const subfolders = folder.folders || {};
  const prunedSubfolders = {};

  let hasMatchingSubfolders = false;

  Object.entries(subfolders).forEach(([key, subfolder]) => {
    const prunedSubfolder = pruneFolder(subfolder, searchFilter, entityFilterConfig);
    if (prunedSubfolder !== null) {
      prunedSubfolders[key] = prunedSubfolder;
      hasMatchingSubfolders = true;
    }
  });

  // Keep this folder if:
  // 1. It directly matches the search filter, OR
  // 2. It has files that match both search and entity filter, OR
  // 3. It has subfolders that contain matching content
  if (folderMatches || hasMatchingFiles || hasMatchingSubfolders) {
    return {
      ...folder,
      passThrough: !folderMatches && !hasMatchingFiles, // Mark as pass-through if kept only for subfolders
      folders: prunedSubfolders,
      files: matchingFiles,
    };
  }

  // If we get here, this folder and all its contents don't match the criteria
  console.log(`Pruning out folder ${folder.relativePath} - no matches`);
  return null;
};

// Check if a file is associated with a specific entity - enhance logging
const checkIfFileAssociatedWithEntity = (filePath, entityType, entityName) => {
  const globalStore = useGlobalStore.getState();
  const datasetEntityObj = globalStore.datasetEntityObj;

  // Check if the entity type and entity name exist in the datasetEntityObj
  if (
    datasetEntityObj &&
    datasetEntityObj[entityType] &&
    datasetEntityObj[entityType][entityName]
  ) {
    // Check if the file path is associated with this entity
    const isAssociated = Boolean(datasetEntityObj[entityType][entityName][filePath]);

    // Add debug logging to help identify issues
    if (!isAssociated) {
      console.log(`File ${filePath} is NOT associated with ${entityType}/${entityName}`);
      // Log the first few entries to help debug
      const entries = Object.keys(datasetEntityObj[entityType][entityName]).slice(0, 5);
      console.log(`Sample entries in ${entityType}/${entityName}:`, entries);
    }

    return isAssociated;
  }

  return false;
};

// Filters the dataset structure based on the search filter
export const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure; // Return the original structure if no filter is applied
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

    // Always create entity filter config if entity filtering is active
    const entityFilterConfig = globalStore.entityFilterActive
      ? {
          active: true,
          entityType: globalStore.entityFilterType,
          entityName: globalStore.entityFilterName,
        }
      : null;

    // Pass entity filter config to pruneFolder function
    // This centralizes all filtering logic in one place
    const filteredStructure = pruneFolder(structureToFilter, searchFilter, entityFilterConfig);

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

// Set entity filter to show only files associated with a specific entity
export const setEntityFilter = (entityType, entityName) => {
  console.log(`Setting entity filter: ${entityType} - ${entityName}`);

  // Clear the render structure first to avoid flash of unfiltered content
  useGlobalStore.setState({
    renderDatasetStructureJSONObjIsLoading: true,
    entityFilterActive: true,
    entityFilterType: entityType,
    entityFilterName: entityName,
  });

  // Re-apply the current search filter to update the view with the entity filter
  setTimeout(() => {
    const currentSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
    setDatasetStructureSearchFilter(currentSearchFilter);
  }, 0);
};

// Clear the entity filter
export const clearEntityFilter = () => {
  console.log("Clearing entity filter");
  setEntityFilter(null, null, false);
};
