import useGlobalStore from "../globalStore";

const initialState = {
  datasetStructureJSONObj: null,
  renderDatasetStructureJSONObj: null,
  datasetStructureSearchFilter: "",
};

export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});
const folderObjIsIncludedInSearchFilter = (folderObj, searchFilter) => {
  const relativePath = folderObj["relativePath"].toLowerCase();

  // Check if the folder's relativePath matches the search filter
  if (relativePath.includes(searchFilter)) return true;

  // Recursively check subfolders
  return (
    Object.keys(folderObj?.folders || {}).some((subFolder) =>
      folderObjIsIncludedInSearchFilter(folderObj.folders[subFolder], searchFilter)
    ) ||
    // Check if any files' relativePaths match the search filter
    Object.keys(folderObj?.files || {}).some((fileName) =>
      folderObj?.files[fileName]["relativePath"].toLowerCase().includes(searchFilter)
    )
  );
};
const filterStructure = (structure, searchFilter) => {
  const filteredStructure = JSON.parse(JSON.stringify(structure));
  const lowerCaseSearchFilter = searchFilter.toLowerCase();

  const recursivePrune = (folderObj) => {
    for (const subFolder of Object.keys(folderObj?.folders || {})) {
      if (!folderObjIsIncludedInSearchFilter(folderObj.folders[subFolder], lowerCaseSearchFilter)) {
        delete folderObj.folders[subFolder];
      } else {
        recursivePrune(folderObj.folders[subFolder]);
      }
    }
    for (const fileName of Object.keys(folderObj?.files || {})) {
      if (
        !folderObj?.files[fileName]["relativePath"].toLowerCase().includes(lowerCaseSearchFilter)
      ) {
        delete folderObj.files[fileName];
      }
    }
  };

  recursivePrune(filteredStructure);
  return filteredStructure;
};

export const setDatasetstructureSearchFilter = (datasetStructureSearchFilter) => {
  useGlobalStore.setState((state) => ({
    ...state,
    datasetStructureSearchFilter,
  }));

  const filteredDatasetStructure = filterStructure(
    useGlobalStore.getState().renderDatasetStructureJSONObj,
    datasetStructureSearchFilter
  );
  useGlobalStore.setState((state) => ({
    ...state,
    renderDatasetStructureJSONObj: filteredDatasetStructure,
  }));
};

export const setTreeViewDatasetStructure = (
  datasetStructureJSONObj,
  arrayPathToNestedJsonToRender
) => {
  let datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(datasetStructureJSONObj));

  // Traverse safely and update the render object reference
  let renderDatasetStructureJSONObjCopy = datasetStructureJSONObjCopy;
  arrayPathToNestedJsonToRender.forEach((subFolder) => {
    renderDatasetStructureJSONObjCopy = renderDatasetStructureJSONObjCopy.folders[subFolder];
  });

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

  addRelativePaths(renderDatasetStructureJSONObjCopy, arrayPathToNestedJsonToRender);

  // Reset the filter and update state with copies
  setDatasetstructureSearchFilter("");

  console.log("Dataset structure JSON object:", datasetStructureJSONObjCopy);

  useGlobalStore.setState((state) => ({
    ...state,
    datasetStructureJSONObj: datasetStructureJSONObjCopy,
    renderDatasetStructureJSONObj: renderDatasetStructureJSONObjCopy,
  }));
};
