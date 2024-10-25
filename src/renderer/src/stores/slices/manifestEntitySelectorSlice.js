import useGlobalStore from "../globalStore";
import { produce } from "immer";
const initialState = {
  datasetStructureJSONObj: null,
  entityList: [],
  activeEntity: null,
  entityType: null,
  manifestEntityObj: {},
};

// Slice now only has initial state
export const manifestEntitySelectorSlice = (set) => ({
  ...initialState,
});

export const resetManifestEntitySelectorState = () => {
  useGlobalStore.setState(
    produce((state) => {
      Object.assign(state, initialState);
    })
  );
};

export const setDatasetStructureJSONObj = (datasetStructureJSONObj) => {
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

export const setEntityList = (entityList) => {
  useGlobalStore.setState((state) => ({
    ...state,
    entityList,
  }));
};

export const setActiveEntity = (activeEntity) => {
  useGlobalStore.setState((state) => ({
    ...state,
    activeEntity,
  }));
};

export const setEntityType = (entityType) => {
  useGlobalStore.setState((state) => ({
    ...state,
    entityType,
  }));
};

export const setManifestEntityObj = (manifestEntityObj) => {
  useGlobalStore.setState((state) => ({
    ...state,
    manifestEntityObj,
  }));
};

// Function to add or update a specific value (relative path) in manifestEntityObj
export const toggleRelativeFilePathForManifestEntity = (
  entityType,
  entityName,
  entityRelativePath
) => {
  useGlobalStore.setState(
    produce((state) => {
      // Check if entityType exists, if not, create it
      if (!state.manifestEntityObj[entityType]) {
        state.manifestEntityObj[entityType] = {};
      }

      // Check if entityName exists within the entityType, if not, create it as an array
      if (!state.manifestEntityObj[entityType][entityName]) {
        state.manifestEntityObj[entityType][entityName] = [entityRelativePath];
      } else {
        // If entityName exists, check if the entityRelativePath exists in the array
        // If it does, remove it, otherwise add it
        const index = state.manifestEntityObj[entityType][entityName].indexOf(entityRelativePath);
        if (index !== -1) {
          state.manifestEntityObj[entityType][entityName].splice(index, 1);
        } else {
          state.manifestEntityObj[entityType][entityName].push(entityRelativePath);
        }
      }

      // Remove the entityRelativePath from all other entities in the same entityType
      Object.keys(state.manifestEntityObj[entityType]).forEach((entity) => {
        if (entity !== entityName) {
          const index = state.manifestEntityObj[entityType][entity].indexOf(entityRelativePath);
          if (index !== -1) {
            state.manifestEntityObj[entityType][entity].splice(index, 1);
          }
        }
      });
    })
  );
};

export const getEntityForRelativePath = (entityType, relativePath) => {
  const manifestEntityObj = useGlobalStore((state) => state.manifestEntityObj);
  if (!manifestEntityObj[entityType]) {
    return null;
  }
  return Object.keys(manifestEntityObj[entityType]).find((entity) =>
    manifestEntityObj[entityType][entity]?.includes(relativePath)
  );
};
