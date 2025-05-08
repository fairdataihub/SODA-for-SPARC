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
    console.log("Dataset entity object not found");
    return false;
  }

  // If both include and exclude lists are empty, don't filter (show everything)
  if (entityFilters.include.length === 0 && entityFilters.exclude.length === 0) {
    return true;
  }

  // Check exclusions first - if file is associated with ANY excluded entity, reject it
  for (const filter of entityFilters.exclude) {
    const { type, names } = filter;
    if (!type || !names || !Array.isArray(names) || names.length === 0) continue;

    // Skip if entity type doesn't exist in datasetEntityObj
    if (!datasetEntityObj[type]) {
      console.log(`Entity type ${type} not found in datasetEntityObj`);
      continue;
    }

    // Check each entity name in the exclusion list
    for (const entityName of names) {
      if (entityName && datasetEntityObj[type][entityName]) {
        const isAssociated = Boolean(datasetEntityObj[type][entityName][filePath]);
        if (isAssociated) {
          console.log(`File ${filePath} is EXCLUDED by ${type}/${entityName}`);
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
      console.log(`Entity type ${type} not found in datasetEntityObj`);
      continue;
    }

    // Check each entity name in the inclusion list
    for (const entityName of names) {
      if (entityName && datasetEntityObj[type][entityName]) {
        const isAssociated = Boolean(datasetEntityObj[type][entityName][filePath]);
        if (isAssociated) {
          console.log(`File ${filePath} is INCLUDED by ${type}/${entityName}`);
          return true; // File is associated with an included entity, so show it
        }
      }
    }
  }

  // If we get here, the file didn't match any include entity
  console.log(`File ${filePath} did not match any included entities`);
  return false;
};

// Prunes the folder structure based on the search filter and optional entity filter
const pruneFolder = (folder, searchFilter, entityFilterConfig = null) => {
  if (!folder) return null;

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
    // 2. File passes the entity filter criteria (if entity filter is active)
    const matchesSearch = !lowerCaseSearchFilter || filePathMatches;

    if (entityFilterConfig && entityFilterConfig.active) {
      // Use the new entity filter checking function with the complex filter config
      const passesEntityFilter = checkIfFilePassesEntityFilter(
        file.relativePath,
        entityFilterConfig.filters
      );

      // Log filtering results for debugging
      console.log(`File ${file.relativePath} filtering result: ${passesEntityFilter}`);

      if (matchesSearch && passesEntityFilter) {
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
          filters: globalStore.entityFilters,
        }
      : null;

    // Pass entity filter config to pruneFolder function
    let filteredStructure = pruneFolder(structureToFilter, searchFilter, entityFilterConfig);

    // Delete any empty folders that might have been created during filtering
    filteredStructure = deleteEmptyFoldersFromStructure(filteredStructure);

    // Update the global store with the filtered structure
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

export const deleteEmptyFoldersFromStructure = (structure) => {
  if (!structure) return null;

  // Recursively delete empty folders
  const folders = structure.folders || {};
  const files = structure.files || {};

  if (!folders && !files) {
    console.log("No folders or files to delete");
    return null; // No folders or files to delete
  }

  // Filter out empty folders
  Object.keys(folders).forEach((key) => {
    const subfolder = deleteEmptyFoldersFromStructure(folders[key]);
    if (
      !subfolder ||
      (Object.keys(subfolder.folders).length === 0 && Object.keys(subfolder.files).length === 0)
    ) {
      delete folders[key];
    } else {
      folders[key] = subfolder;
    }
  });

  // Return the modified structure
  return { ...structure, folders, files };
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

  // Log what we're filtering
  console.log("Setting entity filters:", JSON.stringify(entityFilters, null, 2));

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
  console.log("Clearing entity filter");

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
