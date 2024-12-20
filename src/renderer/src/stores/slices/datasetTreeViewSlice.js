import useGlobalStore from "../globalStore";

// Initial state for managing dataset structure and filters
const initialState = {
  datasetStructureJSONObj: null, // Full dataset structure
  renderDatasetStructureJSONObj: null, // Rendered subset of dataset structure
  datasetStructureSearchFilter: "", // Current search filter text
  pathToRender: [], // Path to the folder currently rendered in the tree view
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
