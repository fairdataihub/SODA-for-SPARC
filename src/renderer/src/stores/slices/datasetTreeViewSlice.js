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
  entityFilters: {
    // Complex entity filter configuration
    include: [], // Array of {type, names} objects for inclusion
    exclude: [], // Array of {type, names} objects for exclusion
  },
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

// Check if a file passes the entity filter criteria based on the complex filter configuration
const checkIfFilePassesEntityFilter = (filePath, entityFilters) => {
  const globalStore = useGlobalStore.getState();
  const datasetEntityObj = globalStore.datasetEntityObj;

  if (!datasetEntityObj) {
    return false;
  }

  // If both include and exclude lists are empty, don't filter (show everything)
  if (entityFilters.include.length === 0 && entityFilters.exclude.length === 0) {
    return true;
  }

  // Check exclusions first - if file is associated with ANY excluded entity, reject it
  for (const filter of entityFilters.exclude) {
    const { type, names } = filter;
    if (!type || !names || !Array.isArray(names) || names.length === 0) {
      continue;
    }

    // Skip if entity type doesn't exist in datasetEntityObj
    if (!datasetEntityObj[type]) {
      continue;
    }

    // Check each entity name in the exclusion list
    for (const entityName of names) {
      if (entityName && datasetEntityObj[type][entityName]) {
        const isAssociated = Boolean(datasetEntityObj[type][entityName][filePath]);
        if (isAssociated) {
          return false; // File is associated with an excluded entity, so don't show it
        }
      }
    }
  }

  // If there's no include list, we only needed to pass the exclude check
  if (entityFilters.include.length === 0) {
    return true;
  }

  // Check inclusions - must match AT LEAST ONE inclusion filter set
  for (const filter of entityFilters.include) {
    const { type, names } = filter;
    if (!type || !names || !Array.isArray(names) || names.length === 0) continue;

    // Skip if entity type doesn't exist in datasetEntityObj
    if (!datasetEntityObj[type]) {
      continue;
    }

    // Check each entity name in the inclusion list
    for (const entityName of names) {
      if (entityName && datasetEntityObj[type][entityName]) {
        const isAssociated = Boolean(datasetEntityObj[type][entityName][filePath]);
        if (isAssociated) {
          return true; // File is associated with an included entity, so show it
        }
      }
    }
  }

  // If we get here, the file didn't match any include entity
  return false;
};

// Helper function to filter files based on search term and entity filters
const filterFiles = (files, searchFilter, entityFilterConfig) => {
  if (!files || Object.keys(files).length === 0) return {};

  const matchingFiles = {};
  const lowerCaseSearchFilter = searchFilter.toLowerCase();
  const isSearchActive = lowerCaseSearchFilter.length > 0;
  const isEntityFilterActive = entityFilterConfig?.active;

  Object.entries(files).forEach(([key, file]) => {
    // Skip search check if no search filter is active
    const matchesSearch =
      !isSearchActive ||
      (file.relativePath && file.relativePath.toLowerCase().includes(lowerCaseSearchFilter));

    if (matchesSearch) {
      if (isEntityFilterActive) {
        // Only check entity filters if search passed and entity filtering is active
        if (checkIfFilePassesEntityFilter(file.relativePath, entityFilterConfig.filters)) {
          matchingFiles[key] = file;
        }
      } else {
        matchingFiles[key] = file;
      }
    }
  });

  return matchingFiles;
};

// Helper function to process subfolders recursively
const processSubfolders = (subfolders, searchFilter, entityFilterConfig) => {
  if (!subfolders || Object.keys(subfolders).length === 0) {
    return { prunedSubfolders: {}, hasMatchingSubfolders: false };
  }

  const prunedSubfolders = {};
  let hasMatchingSubfolders = false;

  Object.entries(subfolders).forEach(([key, subfolder]) => {
    const prunedSubfolder = pruneFolder(subfolder, searchFilter, entityFilterConfig);
    if (prunedSubfolder !== null) {
      prunedSubfolders[key] = prunedSubfolder;
      hasMatchingSubfolders = true;
    }
  });

  return { prunedSubfolders, hasMatchingSubfolders };
};

// Prunes the folder structure based on the search filter and optional entity filter
const pruneFolder = (folder, searchFilter, entityFilterConfig = null) => {
  if (!folder) return null;

  // Get lowercase filter once to reuse
  const lowerCaseSearchFilter = searchFilter.toLowerCase();
  const isSearchActive = lowerCaseSearchFilter.length > 0;

  // Quick path - if no active filtering, return the folder as-is
  if (!isSearchActive && !entityFilterConfig?.active) {
    return folder;
  }

  // Check if folder name matches the search filter
  const folderMatches =
    !isSearchActive ||
    (folder.relativePath && folder.relativePath.toLowerCase().includes(lowerCaseSearchFilter));

  if (!folderMatches) {
    return null; // Skip this folder if it doesn't match the search filter
  }

  // Filter files that match criteria
  const matchingFiles = filterFiles(folder.files, searchFilter, entityFilterConfig);
  const hasMatchingFiles = Object.keys(matchingFiles).length > 0;

  // Process subfolders recursively
  const { prunedSubfolders, hasMatchingSubfolders } = processSubfolders(
    folder.folders,
    searchFilter,
    entityFilterConfig
  );

  // Keep this folder if it matches any criteria
  if (hasMatchingFiles || hasMatchingSubfolders) {
    return {
      ...folder,
      passThrough: !folderMatches && !hasMatchingFiles,
      folders: prunedSubfolders,
      files: matchingFiles,
    };
  }

  // No matches in this folder branch
  return null;
};

// Filters the dataset structure based on the search filter
export const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure; // Return the original structure if no filter is applied
  const result = pruneFolder(structure, searchFilter);
  return result;
};

// Updates the dataset search filter and modifies the rendered structure
export const setDatasetStructureSearchFilter = (searchFilter) => {
  try {
    useGlobalStore.setState({
      datasetStructureSearchFilter: searchFilter || "",
      renderDatasetStructureJSONObjIsLoading: true,
    });

    const globalStore = useGlobalStore.getState();

    const originalStructure = globalStore.datasetStructureJSONObj;
    if (!originalStructure) {
      useGlobalStore.setState({
        renderDatasetStructureJSONObj: null,
        renderDatasetStructureJSONObjIsLoading: false,
      });
      return;
    }

    let structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);

    if (!structureToFilter) {
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
          filters: globalStore.entityFilters,
        }
      : null;

    // Pass entity filter config to pruneFolder function
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
    pathToRender = pathToRender ? pathToRender : useGlobalStore.getState().pathToRender;

    if (!datasetStructure) {
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

/**
 * Set entity filter with multi-type include/exclude capabilities
 *
 * @param {Array} include - Array of {type, names} objects for inclusion
 * @param {Array} exclude - Array of {type, names} objects for exclusion
 */
export const setEntityFilter = (include = [], exclude = []) => {
  // Create the entityFilters object directly
  const entityFilters = {
    include,
    exclude,
  };

  // Only activate filter if we have valid filters
  const isFilterActive = include.length > 0 || exclude.length > 0;

  // Update state
  useGlobalStore.setState({
    renderDatasetStructureJSONObjIsLoading: true,
    entityFilterActive: isFilterActive,
    entityFilters,
  });

  // Re-apply the current search filter to update the view with the entity filter
  setTimeout(() => {
    const currentSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
    setDatasetStructureSearchFilter(currentSearchFilter);
  }, 0);
};

// For backward compatibility - filter by a single entity type
export const setSimpleEntityFilter = (entityType, includeNames = [], excludeNames = []) => {
  // Convert to the new format for direct parameters
  const includeFilter = includeNames.length > 0 ? [{ type: entityType, names: includeNames }] : [];
  const excludeFilter = excludeNames.length > 0 ? [{ type: entityType, names: excludeNames }] : [];

  setEntityFilter(includeFilter, excludeFilter);
};

// Clear the entity filter
export const clearEntityFilter = () => {
  useGlobalStore.setState({
    renderDatasetStructureJSONObjIsLoading: true,
    entityFilterActive: false,
    entityFilters: { include: [], exclude: [] },
  });

  // Re-apply the current search filter without entity filtering
  setTimeout(() => {
    const currentSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
    setDatasetStructureSearchFilter(currentSearchFilter);
  }, 0);
};
