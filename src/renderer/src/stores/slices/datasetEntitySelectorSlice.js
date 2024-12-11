import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Initial state for managing dataset entities
const initialState = {
  activeEntity: null, // Currently active entity
  entityType: null, // Type of the selected entity
  datasetEntityObj: {}, // Stores entities grouped by type
};

// Slice initialization for the entity selector state
export const datasetEntitySelectorSlice = (set) => ({
  ...initialState,
});

// Reset the entity selector state to its initial configuration
export const resetDatasetEntitySelectorState = () => {
  useGlobalStore.setState(
    produce((state) => {
      Object.assign(state, initialState);
    })
  );
};

// Add an entity to the specified entity type's list
export const addEntityToEntityList = (entityType, entityName) => {
  console.log("datasetEntityObj: ", useGlobalStore.getState().datasetEntityObj);
  console.log("Adding entity: ", entityName);
  console.log("Entity type: ", entityType);
  console.log("Active entity: ", useGlobalStore.getState().activeEntity);
  useGlobalStore.setState(
    produce((state) => {
      if (!state.datasetEntityObj) {
        state.datasetEntityObj = {};
      }

      if (!state.datasetEntityObj[entityType]) {
        state.datasetEntityObj[entityType] = {};
      }

      if (!state.datasetEntityObj[entityType][entityName]) {
        state.datasetEntityObj[entityType][entityName] = []; // Initialize the entity list where folder and file paths will be added
      }
    })
  );
};

// Remove an entity from the specified entity type's list
export const removeEntityFromEntityList = (entityType, entityName) => {
  useGlobalStore.setState(
    produce((state) => {
      console.log("Removing entity: ", entityName);

      delete state.datasetEntityObj?.[entityType]?.[entityName];
    })
  );
};

// Get the obj of entities for a specific entity type
export const getEntityObjForEntityType = (entityType) => {
  return useGlobalStore.getState()?.datasetEntityObj?.[entityType] || {};
};

// Set the currently active entity
export const setActiveEntity = (activeEntity) => {
  useGlobalStore.setState((state) => ({
    ...state,
    activeEntity,
  }));
};

// Set the current entity type
export const setEntityType = (entityType) => {
  useGlobalStore.setState((state) => ({
    ...state,
    entityType,
  }));
};

// Update the list of entities for a specific entity type
export const setEntityListForEntityType = (entityType, entityListObj) => {
  if (!entityType || !entityListObj) {
    console.error("Missing parameters: entityType or entityListObj", { entityType, entityListObj });
    return;
  }

  useGlobalStore.setState(
    produce((state) => {
      state.datasetEntityObj[entityType] = entityListObj;
    })
  );
};

// Set the dataset entity object directly
export const setDatasetEntityObj = (datasetEntityObj) => {
  useGlobalStore.setState((state) => ({
    ...state,
    datasetEntityObj,
  }));
};

export const getDatasetEntityObj = () => {
  return useGlobalStore.getState().datasetEntityObj;
};

// Modify an entity's relative file path based on the specified action
export const modifyDatasetEntityForRelativeFilePath = (
  entityType,
  entityName,
  entityRelativePath,
  action
) => {
  if (!entityType || !entityName || !entityRelativePath) {
    console.error("Missing parameters for modification", {
      entityType,
      entityName,
      entityRelativePath,
    });
    return;
  }

  useGlobalStore.setState(
    produce((state) => {
      const entityEntries = state.datasetEntityObj[entityType] || {};
      const targetEntity = entityEntries[entityName] || [];

      switch (action) {
        case "toggle":
          entityEntries[entityName] = targetEntity.includes(entityRelativePath)
            ? targetEntity.filter((path) => path !== entityRelativePath)
            : [...targetEntity, entityRelativePath];
          removeFromOtherEntities(entityEntries, entityName, entityRelativePath);
          break;

        case "add":
          if (!targetEntity.includes(entityRelativePath)) {
            entityEntries[entityName] = [...targetEntity, entityRelativePath];
            removeFromOtherEntities(entityEntries, entityName, entityRelativePath);
          }
          break;

        case "remove":
          entityEntries[entityName] = targetEntity.filter((path) => path !== entityRelativePath);
          break;

        default:
          console.error(`Unsupported action: ${action}`);
      }

      state.datasetEntityObj[entityType] = entityEntries;
    })
  );
};

// Remove a file path from all entities except the specified target
const removeFromOtherEntities = (entityEntries, targetEntityName, entityRelativePath) => {
  // Remove the file path from all other entities
  Object.keys(entityEntries).forEach((entity) => {
    if (entity !== targetEntityName) {
      entityEntries[entity] = entityEntries[entity].filter((path) => path !== entityRelativePath);
    }
  });
};

// Get the entity associated with a specific file path
export const getEntityForRelativePath = (datasetEntityObj, entityType, relativePath) => {
  const entities = datasetEntityObj?.[entityType];
  if (!entities) return null;

  return Object.keys(entities).find((entityName) => entities[entityName]?.includes(relativePath));
};

// Get the number of files associated with a specific entity
export const getNumberFilesForEntity = (entityName) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  return datasetEntityObj?.[entityType]?.[entityName]?.length || 0;
};
