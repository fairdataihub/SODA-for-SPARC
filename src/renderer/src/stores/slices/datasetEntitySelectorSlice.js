import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Initial state for managing entities in the dataset
const initialState = {
  entityList: [], // List of entities for the current context
  entityListName: "", // Name of the entity list being managed
  activeEntity: null, // The currently active entity
  entityType: null, // Type of the currently selected entity
  datasetEntityObj: {}, // Object storing all entities organized by type
};

// Define the slice for entity selector state
export const datasetEntitySelectorSlice = (set) => ({
  ...initialState,
});

// Resets the entity selector state to its initial configuration
export const resetDatasetEntitySelectorState = () => {
  useGlobalStore.setState(
    produce((state) => {
      Object.assign(state, initialState);
    })
  );
};

// Sets the entity list and its associated name in the global store
export const setEntityList = (entityList, entityListName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    entityList,
    entityListName,
  }));
};

// Retrieves the list of entities for a given entity type
export const getEntityListForEntityType = (entityListName) => {
  return useGlobalStore.getState()?.datasetEntityObj?.[entityListName] || {};
};

// Retrieves entities for a specific type from the datasetEntityObj
export const getEntitiesForType = (entityType) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  return datasetEntityObj?.[entityType] || {};
};

// Updates the currently active entity in the global store
export const setActiveEntity = (activeEntity) => {
  useGlobalStore.setState((state) => ({
    ...state,
    activeEntity,
  }));
};

// Updates the current entity type in the global store
export const setEntityType = (entityType) => {
  useGlobalStore.setState((state) => ({
    ...state,
    entityType,
  }));
};

// Updates the list of entities for a given entity type
export const setEntityListForEntityType = (entityType, entityListObj) => {
  if (!entityType || !entityListObj) {
    console.log("Aborting function: entityType or entityListObj is missing");
    console.log(entityType, entityListObj);
    return;
  }

  useGlobalStore.setState(
    produce((state) => {
      state.datasetEntityObj[entityType] = entityListObj;
    })
  );
};

// Sets the dataset entity object in the global store
export const setDatasetEntityObj = (datasetEntityObj) => {
  useGlobalStore.setState((state) => ({
    ...state,
    datasetEntityObj,
  }));
};

// Hierarchies defining relationships between entity types
const entityHierarchies = [
  ["subject-related-folders-and-files", "sample-related-folders-and-files"], // Sample is a subset of subject
];

// Modifies the dataset entity for a specific relative file path
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

      // Handle actions: toggle, add, or remove
      switch (action) {
        case "toggle":
          if (targetEntity.includes(entityRelativePath)) {
            entityEntries[entityName] = targetEntity.filter((path) => path !== entityRelativePath);
          } else {
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

// Removes a file path from all entities except the target entity
const removeFromOtherEntities = (entityEntries, targetEntityName, entityRelativePath) => {
  Object.keys(entityEntries).forEach((entity) => {
    if (entity !== targetEntityName) {
      entityEntries[entity] = entityEntries[entity].filter((path) => path !== entityRelativePath);
    }
  });

  // Handle hierarchies: if the entity is a subset of another, remove the path from the parent entity
  const entityExistsInHierarchy = entityHierarchies.find((hierarchy) =>
    hierarchy.includes(targetEntityName)
  );

  console.log("removeFromOtherEntities", {
    entityEntries,
    targetEntityName,
    entityRelativePath,
    entityExistsInHierarchy,
  });
};

// Retrieves the entity associated with a specific file path
export const getEntityForRelativePath = (datasetEntityObj, entityType, relativePath) => {
  if (!datasetEntityObj || !entityType || !datasetEntityObj[entityType]) {
    return null;
  }

  for (const entityName in datasetEntityObj[entityType]) {
    if (datasetEntityObj[entityType][entityName]?.includes(relativePath)) {
      return entityName;
    }
  }

  return null;
};

// Gets the number of files associated with a specific entity
export const getNumberFilesForEntity = (entityName) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  return datasetEntityObj?.[entityType]?.[entityName]?.length || 0;
};
