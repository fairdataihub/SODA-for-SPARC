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

export const getEntityListForEntityType = (entityListName) => {
  return useGlobalStore.getState()?.datasetEntityObj?.[entityListName] || {};
};

export const getEntitiesForType = (entityType) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  return datasetEntityObj?.[entityType] || {};
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

export const setEntityListForEntityType = (entityType, entityListObj) => {
  if (!entityType || !entityListObj) {
    console.log("Aborting function: entityType or entityListObj is missing");
    console.log(entityType, entityListObj);
  }

  useGlobalStore.setState(
    produce((state) => {
      state.datasetEntityObj[entityType] = entityListObj;
    })
  );
};

export const setdatasetEntityObj = (datasetEntityObj) => {
  useGlobalStore.setState((state) => ({
    ...state,
    datasetEntityObj,
  }));
};

const entityHeirarchies = [
  ["subject-related-folders-and-files", "sample-related-folders-and-files"], // Sample folders and files are a subset of subject folders and files
];

// Function to add or update a specific value (relative path) in datasetEntityObj
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

  useGlobalStore.setState(
    produce((state) => {
      const datasetEntity = state.datasetEntityObj;
      if (!datasetEntity[entityType]) {
        datasetEntity[entityType] = {};
      }

      const entityEntries = datasetEntity[entityType];
      const targetEntity = entityEntries[entityName] || [];

      // Action handling
      switch (action) {
        case "toggle":
          console.log("Toggling entity for relative path", entityRelativePath);
          if (targetEntity.includes(entityRelativePath)) {
            // Remove if it exists
            entityEntries[entityName] = targetEntity.filter((path) => path !== entityRelativePath);
          } else {
            // Add and ensure exclusivity across other entities
            entityEntries[entityName] = [...targetEntity, entityRelativePath];
            removeFromOtherEntities(entityEntries, entityName, entityRelativePath);
          }
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
          console.log(`Unsupported action: ${action}`);
      }
    })
  );
};

// Helper function to remove a path from all other entities in the same entityType
const removeFromOtherEntities = (entityEntries, targetEntityName, entityRelativePath) => {
  Object.keys(entityEntries).forEach((entity) => {
    console.log("entity", entity);
    if (entity !== targetEntityName) {
      entityEntries[entity] = entityEntries[entity].filter((path) => path !== entityRelativePath);
    }
  });
  // If the entity is a subset of another entity, remove the path from the parent entity
  const entityExistsInHeirarchy = entityHeirarchies.find((heirarchy) =>
    heirarchy.includes(targetEntityName)
  );

  console.log("removeFromOtherEntities");
  console.log(entityEntries);
  console.log(targetEntityName);
  console.log(entityRelativePath);
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
