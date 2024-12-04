import useGlobalStore from "../globalStore";

const initialState = {
  datasetStructureJSONObj: null,
  renderDatasetStructureJSONObj: null,
  datasetStructureSearchFilter: "",
  pathToRender: [], // Store pathToRender here
};

export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});

// Helper function to traverse dataset structure by pathToRender
const traverseStructureByPath = (structure, pathToRender) => {
  let structureRef = structure;
  pathToRender.forEach((subFolder) => {
    structureRef = structureRef.folders[subFolder];
  });
  return structureRef;
};

// Checks if a folder or its subfolders/files match the search filter
const folderObjMatchesSearch = (folderObj, searchFilter) => {
  const relativePath = folderObj.relativePath.toLowerCase();

  if (relativePath.includes(searchFilter)) return true;

  const foldersMatch = Object.values(folderObj.folders || {}).some((subFolder) =>
    folderObjMatchesSearch(subFolder, searchFilter)
  );

  const filesMatch = Object.values(folderObj.files || {}).some((file) =>
    file.relativePath.toLowerCase().includes(searchFilter)
  );

  return foldersMatch || filesMatch;
};

// Filters the structure based on the search filter
const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) {
    // Return the original structure when the filter is empty
    return structure;
  }

  const lowerCaseSearchFilter = searchFilter.toLowerCase();

  const pruneStructure = (folderObj) => {
    // Recursively prune subfolders that do not match the filter
    for (const subFolder of Object.keys(folderObj.folders || {})) {
      if (!folderObjMatchesSearch(folderObj.folders[subFolder], lowerCaseSearchFilter)) {
        delete folderObj.folders[subFolder];
      } else {
        pruneStructure(folderObj.folders[subFolder]);
      }
    }

    // Remove files that do not match the filter
    for (const fileName of Object.keys(folderObj.files || {})) {
      if (fileName.endsWith(".tiff")) {
        console.log("File name:", fileName);
        console.log("search filter:", lowerCaseSearchFilter);
        console.log(
          folderObj.files[fileName].relativePath.toLowerCase().includes(lowerCaseSearchFilter)
        );
      }
      if (!folderObj.files[fileName].relativePath.toLowerCase().includes(lowerCaseSearchFilter)) {
        delete folderObj.files[fileName];
      }
    }

    return folderObj; // Ensure the function returns the modified folderObj
  };

  // Deep copy the structure to avoid in-place mutation
  const structureCopy = JSON.parse(JSON.stringify(structure));
  return pruneStructure(structureCopy);
};

// Sets the dataset structure search filter and updates the render dataset structure
export const setDatasetstructureSearchFilter = (searchFilter) => {
  const globalStore = useGlobalStore.getState();
  console.log("Before filter set:", globalStore);

  let originalStructure = JSON.parse(JSON.stringify(globalStore.datasetStructureJSONObj));

  // Use the helper function to traverse to the correct nested structure
  const structureToFilter = traverseStructureByPath(originalStructure, globalStore.pathToRender);

  const filteredStructure = filterStructure(structureToFilter, searchFilter);

  console.log("Filtered structure result:", filteredStructure); // Check result

  // Update the filtered structure in global state
  useGlobalStore.setState({
    ...globalStore,
    datasetStructureSearchFilter: searchFilter,
    renderDatasetStructureJSONObj: filteredStructure,
  });
};

// Sets the tree view dataset structure and updates relative paths
export const setTreeViewDatasetStructure = (datasetStructure, pathToRender) => {
  const clonedStructure = JSON.parse(JSON.stringify(datasetStructure));

  // Adds relative paths recursively
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

  addRelativePaths(clonedStructure);

  useGlobalStore.setState({
    datasetStructureJSONObj: clonedStructure,
    pathToRender: pathToRender,
  });

  // Use the helper function to traverse to the correct structure
  let renderStructureRef = traverseStructureByPath(clonedStructure, pathToRender);

  addRelativePaths(renderStructureRef, pathToRender);

  useGlobalStore.setState({
    renderDatasetStructureJSONObj: renderStructureRef,
  });
};
