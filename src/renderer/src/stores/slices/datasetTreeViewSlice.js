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

export const setTreeViewDatasetStructure = (datasetStructureJSONObj) => {
  // Create a deep copy of the object so that the original object is not mutated
  const datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(datasetStructureJSONObj));
  // Recursively add the relative paths to the datasetStructureJSONObjCopy object
  // for use in the manifest entity selector component
  const addRelativePaths = (obj, path = "") => {
    const objFolders = Object.keys(obj.folders || {});
    const objFiles = Object.keys(obj.files || {});
    objFolders.forEach((folder) => {
      const folderPath = path ? `${path}/${folder}` : folder;
      obj.folders[folder].relativePath = folderPath;
      addRelativePaths(obj.folders[folder], folderPath);
    });
    objFiles.forEach((file) => {
      const filePath = path ? `${path}/${file}` : file;
      obj.files[file].relativePath = filePath;
    });
  };
  addRelativePaths(datasetStructureJSONObjCopy);
  console.log("Dataset structure JSON object:", datasetStructureJSONObjCopy);
  useGlobalStore.setState((state) => ({
    ...state,
    datasetStructureJSONObj: datasetStructureJSONObjCopy,
  }));
};
