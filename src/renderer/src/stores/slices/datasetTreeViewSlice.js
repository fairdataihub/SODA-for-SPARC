import useGlobalStore from "../globalStore";

const initialState = {
  datasetStructureJSONObj: null,
  datasetStructureSearchFilter: "",
};

export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});

export const setDatasetstructureSearchFilter = (datasetStructureSearchFilter) => {
  useGlobalStore.setState((state) => ({
    ...state,
    datasetStructureSearchFilter,
  }));
};

// Recursively add relative paths to the datasetStructureJSONObjCopy for manifest entity selector
const addRelativePaths = (obj, path = []) => {
  const objFolders = Object.keys(obj.folders || {});
  const objFiles = Object.keys(obj.files || {});

  // Add relative path for each folder and recursively call for nested structures
  objFolders.forEach((folder) => {
    const folderPath = [...path, folder].join("/");
    obj.folders[folder].relativePath = folderPath;
    addRelativePaths(obj.folders[folder], [...path, folder]);
  });

  // Add relative path for each file
  objFiles.forEach((file) => {
    const filePath = [...path, file].join("/");
    obj.files[file].relativePath = filePath;
  });
};

export const setTreeViewDatasetStructure = (
  datasetStructureJSONObj,
  arrayPathToNestedJsonToRender
) => {
  // Create a deep copy to avoid mutating the original structure
  let datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(datasetStructureJSONObj));

  // Traverse to the specified nested path
  arrayPathToNestedJsonToRender.forEach((subFolder) => {
    datasetStructureJSONObjCopy = datasetStructureJSONObjCopy.folders[subFolder];
  });

  // Reset the filter when setting the dataset structure
  setDatasetstructureSearchFilter("");

  // Add relative paths starting from the given array path
  addRelativePaths(datasetStructureJSONObjCopy, arrayPathToNestedJsonToRender);
  console.log("Dataset structure JSON object:", datasetStructureJSONObjCopy);

  // Update the global state with the modified copy
  useGlobalStore.setState((state) => ({
    ...state,
    datasetStructureJSONObj: datasetStructureJSONObjCopy,
  }));
};
