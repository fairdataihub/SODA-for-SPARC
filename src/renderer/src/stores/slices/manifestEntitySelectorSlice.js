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
  if (!entityType || !entityName || !entityRelativePath) {
    console.log(
      "Aborting toggleRelativeFilePathForManifestEntity: entityType, entityName, or entityRelativePath is missing"
    );
    console.log(entityType, entityName, entityRelativePath);

    return;
  }
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

export const getEntityForRelativePath = (relativePath) => {
  const manifestEntityObj = useGlobalStore((state) => state.manifestEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);

  if (!entityType || !manifestEntityObj?.[entityType]) {
    return null;
  }

  // Iterate through all entities within the specified entityType
  for (const entity in manifestEntityObj[entityType]) {
    if (manifestEntityObj[entityType][entity]?.includes(relativePath)) {
      return entity;
    }
  }

  return null;
};

export const getNumberFilesForEntity = (entityName) => {
  const manifestEntityObj = useGlobalStore((state) => state.manifestEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  return manifestEntityObj?.[entityType]?.[entityName]?.length || 0;
};
