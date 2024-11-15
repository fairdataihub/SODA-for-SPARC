import useGlobalStore from "../globalStore";
import { produce } from "immer";
const initialState = {
  entityList: [],
  entityListName: "",
  activeEntity: null,
  entityType: null,
  datasetEntityObj: {},
};

// Slice now only has initial state
export const datasetEntitySelectorSlice = (set) => ({
  ...initialState,
});

export const resetDatasetEntitySelectorState = () => {
  useGlobalStore.setState(
    produce((state) => {
      Object.assign(state, initialState);
    })
  );
};

export const setEntityList = (entityList, entityListName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    entityList,
    entityListName,
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

export const setdatasetEntityObj = (datasetEntityObj) => {
  useGlobalStore.setState((state) => ({
    ...state,
    datasetEntityObj,
  }));
};

// Function to add or update a specific value (relative path) in datasetEntityObj
export const modifyDatasetEntityForRelativeFilePath = (
  entityType,
  entityName,
  entityRelativePath,
  action
) => {
  if (!entityType || !entityName || !entityRelativePath) {
    console.log("Aborting function: entityType, entityName, or entityRelativePath is missing");
    console.log(entityType, entityName, entityRelativePath);

    return;
  }

  if (action === "toggle") {
    console.log("Toggling entity for relative path", entityRelativePath);
    useGlobalStore.setState(
      produce((state) => {
        // Check if entityType exists, if not, create it
        if (!state.datasetEntityObj[entityType]) {
          state.datasetEntityObj[entityType] = {};
        }

        // Check if entityName exists within the entityType, if not, create it as an array
        if (!state.datasetEntityObj[entityType][entityName]) {
          state.datasetEntityObj[entityType][entityName] = [entityRelativePath];
        } else {
          // If entityName exists, check if the entityRelativePath exists in the array
          // If it does, remove it, otherwise add it
          const index = state.datasetEntityObj[entityType][entityName].indexOf(entityRelativePath);
          if (index !== -1) {
            state.datasetEntityObj[entityType][entityName].splice(index, 1);
          } else {
            state.datasetEntityObj[entityType][entityName].push(entityRelativePath);
          }
        }

        // Remove the entityRelativePath from all other entities in the same entityType
        Object.keys(state.datasetEntityObj[entityType]).forEach((entity) => {
          if (entity !== entityName) {
            const index = state.datasetEntityObj[entityType][entity].indexOf(entityRelativePath);
            if (index !== -1) {
              state.datasetEntityObj[entityType][entity].splice(index, 1);
            }
          }
        });
      })
    );
  }
  if (action === "add") {
    useGlobalStore.setState(
      produce((state) => {
        // Check if entityType exists, if not, create it
        if (!state.datasetEntityObj[entityType]) {
          state.datasetEntityObj[entityType] = {};
        }

        // Check if entityName exists within the entityType, if not, create it as an array
        if (!state.datasetEntityObj[entityType][entityName]) {
          state.datasetEntityObj[entityType][entityName] = [entityRelativePath];
        } else {
          // If entityName exists, check if the entityRelativePath exists in the array
          // If it does, remove it, otherwise add it
          const index = state.datasetEntityObj[entityType][entityName].indexOf(entityRelativePath);
          if (index === -1) {
            state.datasetEntityObj[entityType][entityName].push(entityRelativePath);
          }
        }

        // Remove the entityRelativePath from all other entities in the same entityType
        Object.keys(state.datasetEntityObj[entityType]).forEach((entity) => {
          if (entity !== entityName) {
            const index = state.datasetEntityObj[entityType][entity].indexOf(entityRelativePath);
            if (index !== -1) {
              state.datasetEntityObj[entityType][entity].splice(index, 1);
            }
          }
        });
      })
    );
  }
  if (action === "remove") {
    useGlobalStore.setState(
      produce((state) => {
        // Check if entityType exists, if not, create it
        if (!state?.datasetEntityObj?.[entityType]?.[entityName]) {
          return;
        }
        const index = state.datasetEntityObj[entityType][entityName].indexOf(entityRelativePath);
        if (index !== -1) {
          state.datasetEntityObj[entityType][entityName].splice(index, 1);
        }
      })
    );
  }
};

export const getEntityForRelativePath = (datasetEntityObj, entityType, relativePath) => {
  // Ensure the datasetEntityObj and entityType are valid
  if (!datasetEntityObj || !entityType || !datasetEntityObj[entityType]) {
    return null;
  }

  // Iterate through all entities within the specified entityType
  for (const entityName in datasetEntityObj[entityType]) {
    // If the relativePath exists in the entity's list, return the entityName
    if (datasetEntityObj[entityType][entityName]?.includes(relativePath)) {
      return entityName;
    }
  }

  return null; // Return null if the relativePath is not found
};

export const getNumberFilesForEntity = (entityName) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  return datasetEntityObj?.[entityType]?.[entityName]?.length || 0;
};
