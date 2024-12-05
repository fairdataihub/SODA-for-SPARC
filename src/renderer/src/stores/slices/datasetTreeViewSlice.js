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
  const relativePath = folderObj.relativePath.toLowerCase();

  // Check if the current folder's relative path matches the search filter
  if (relativePath.includes(searchFilter)) return true;

  // Check if any subfolders match the search filter
  const foldersMatch = Object.values(folderObj.folders || {}).some((subFolder) =>
    folderObjMatchesSearch(subFolder, searchFilter)
  );

  // Check if any files match the search filter
  const filesMatch = Object.values(folderObj.files || {}).some((file) =>
    file.relativePath.toLowerCase().includes(searchFilter)
  );

  return foldersMatch || filesMatch;
};

// Filters the dataset structure based on the current search filter
const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) {
    // Return the original structure if no search filter is applied
    return structure;
  }

  const lowerCaseSearchFilter = searchFilter.toLowerCase();

  // Recursively prunes the dataset structure to retain only matching folders/files
  const pruneStructure = (folderObj) => {
    // Remove subfolders that do not match the search filter
    for (const subFolder of Object.keys(folderObj.folders || {})) {
      if (!folderObjMatchesSearch(folderObj.folders[subFolder], lowerCaseSearchFilter)) {
        delete folderObj.folders[subFolder];
      } else {
        pruneStructure(folderObj.folders[subFolder]);
      }
    }

    // Remove files that do not match the search filter
    for (const fileName of Object.keys(folderObj.files || {})) {
      if (!folderObj.files[fileName].relativePath.toLowerCase().includes(lowerCaseSearchFilter)) {
        delete folderObj.files[fileName];
      }
    }

    return folderObj; // Return the modified folder object
  };

  // Deep copy the structure to prevent in-place modification
  const structureCopy = JSON.parse(JSON.stringify(structure));
  return pruneStructure(structureCopy);
};

// Updates the dataset search filter and modifies the rendered structure accordingly
export const setDatasetstructureSearchFilter = (searchFilter) => {
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

  // Add relative paths for the rendered subset
  addRelativePaths(renderStructureRef, pathToRender);

  // Update the rendered structure in the global store
  useGlobalStore.setState({
    renderDatasetStructureJSONObj: renderStructureRef,
  });
};
