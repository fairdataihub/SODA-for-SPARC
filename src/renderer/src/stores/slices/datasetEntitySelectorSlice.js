import useGlobalStore from "../globalStore";
import { produce } from "immer";

// Slice initialization for the entity selector state
export const datasetEntitySelectorSlice = (set) => ({
  activeEntity: null, // Currently active entity
  entityType: null, // Type of the selected entity
  datasetEntityObj: {}, // Stores entities grouped by type
  entityStructureObj: {
    subjects: {},
  }, // Example structure: { sub-01: { samples: { sam-01: { performances: [], sites: [] } } } }
});

// SUBJECT MANAGEMENT
export const addSubject = (subjectID) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.entityStructureObj.subjects[subjectID]) {
        state.entityStructureObj.subjects[subjectID] = { samples: {} };
      }
    })
  );
};

export const removeSubject = (subjectID) => {
  useGlobalStore.setState(
    produce((state) => {
      delete state.entityStructureObj.subjects[subjectID];
    })
  );
};

// SAMPLE MANAGEMENT
export const addSample = (subjectID, sampleID) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.entityStructureObj.subjects[subjectID]) {
        state.entityStructureObj.subjects[subjectID].samples[sampleID] = {
          performances: [],
          sites: [],
        };
      }
    })
  );
};

export const removeSample = (subjectID, sampleID) => {
  useGlobalStore.setState(
    produce((state) => {
      delete state.entityStructureObj.subjects[subjectID]?.samples[sampleID];
    })
  );
};

// PERFORMANCE & SITE MANAGEMENT
export const addPerformance = (subjectID, sampleID, performanceID) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.entityStructureObj.subjects[subjectID]?.samples[sampleID]) {
        state.entityStructureObj.subjects[subjectID].samples[sampleID].performances.push(
          performanceID
        );
      }
    })
  );
};

export const removePerformance = (subjectID, sampleID, performanceID) => {
  useGlobalStore.setState(
    produce((state) => {
      const performances =
        state.entityStructureObj.subjects[subjectID]?.samples[sampleID]?.performances;
      if (performances) {
        state.entityStructureObj.subjects[subjectID].samples[sampleID].performances =
          performances.filter((id) => id !== performanceID);
      }
    })
  );
};

export const addSite = (subjectID, sampleID, siteID) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.entityStructureObj.subjects[subjectID]?.samples[sampleID]) {
        state.entityStructureObj.subjects[subjectID].samples[sampleID].sites.push(siteID);
      }
    })
  );
};

export const removeSite = (subjectID, sampleID, siteID) => {
  useGlobalStore.setState(
    produce((state) => {
      const sites = state.entityStructureObj.subjects[subjectID]?.samples[sampleID]?.sites;
      if (sites) {
        state.entityStructureObj.subjects[subjectID].samples[sampleID].sites = sites.filter(
          (id) => id !== siteID
        );
      }
    })
  );
};

export const addSubjectToEntityStructure = (subjectID) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.entityStructureObj) {
        state.entityStructureObj = {};
      }

      if (!state.entityStructureObj["subjects"]) {
        state.entityStructureObj["subjects"] = {};
      }

      if (!state.entityStructureObj["subjects"][subjectID]) {
        state.entityStructureObj["subjects"][subjectID] = [];
      }
    })
  );
};

export const removeSubjectFromEntityStructure = (subjectID) => {
  useGlobalStore.setState(
    produce((state) => {
      delete state.entityStructureObj?.["subjects"]?.[subjectID];
    })
  );
};

export const addSampleToEntityStructure = (subjectID, sampleID) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.entityStructureObj) {
        state.entityStructureObj = {};
      }

      if (!state.entityStructureObj["samples"]) {
        state.entityStructureObj["samples"] = {};
      }

      if (!state.entityStructureObj["samples"][subjectID]) {
        state.entityStructureObj["samples"][subjectID] = {};
      }

      if (!state.entityStructureObj["samples"][subjectID][sampleID]) {
        state.entityStructureObj["samples"][subjectID][sampleID] = [];
      }
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

export const setEntityListUsingArray = (entityType, entityArray) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.datasetEntityObj) {
        state.datasetEntityObj = {};
      }

      if (!state.datasetEntityObj[entityType]) {
        state.datasetEntityObj[entityType] = {};
      }

      entityArray.forEach((entity) => {
        state.datasetEntityObj[entityType][entity] = [];
      });
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

// Helper function to recursively traverse the dataset structure and collect matching paths
const findMatchingRelativePaths = (obj, entityTypeLowerCased, matchingPaths) => {
  // Check files for matches
  for (const fileName in obj?.files || {}) {
    const file = obj.files[fileName];
    const fileRelativePath = file.relativePath.toLowerCase();

    if (file.relativePath.toLowerCase().includes(entityTypeLowerCased)) {
      console.log("Found matching file: ", file.relativePath);
      matchingPaths.push(file.relativePath);
    }
  }

  // Check folders and recurse
  for (const folderName in obj?.folders || {}) {
    const folder = obj.folders[folderName];
    if (folder.relativePath.toLowerCase().includes(entityTypeLowerCased)) {
      matchingPaths.push(folder.relativePath);
    }
    findMatchingRelativePaths(folder, entityTypeLowerCased, matchingPaths);
  }
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

// Remove default value to require explicit parameter
export const modifyDatasetEntityForRelativeFilePath = (
  entityType,
  entityName,
  entityRelativePath,
  action,
  mutuallyExclusive
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
      // Ensure the entityType object exists
      if (!state.datasetEntityObj) {
        state.datasetEntityObj = {};
      }

      if (!state.datasetEntityObj[entityType]) {
        state.datasetEntityObj[entityType] = {};
      }

      if (!state.datasetEntityObj[entityType][entityName]) {
        state.datasetEntityObj[entityType][entityName] = {};
      }

      const targetEntity = state.datasetEntityObj[entityType][entityName];

      switch (action) {
        case "toggle":
          if (targetEntity[entityRelativePath]) {
            delete targetEntity[entityRelativePath];
          } else {
            targetEntity[entityRelativePath] = true;
            // Only remove from other entities if mutuallyExclusive is true
            if (mutuallyExclusive) {
              removeFromOtherEntities(
                state.datasetEntityObj[entityType],
                entityName,
                entityRelativePath
              );
            }
          }
          break;

        case "add":
          targetEntity[entityRelativePath] = true;
          // Only remove from other entities if mutuallyExclusive is true
          if (mutuallyExclusive) {
            removeFromOtherEntities(
              state.datasetEntityObj[entityType],
              entityName,
              entityRelativePath
            );
          }
          break;

        case "remove":
          delete targetEntity[entityRelativePath];
          break;

        default:
          console.error(`Unsupported action: ${action}`);
      }
    })
  );
};

// Remove a file path from all entities except the specified target
const removeFromOtherEntities = (entityEntries, targetEntityName, entityRelativePath) => {
  // Remove the file path from all other entities
  Object.keys(entityEntries).forEach((entity) => {
    if (entity !== targetEntityName && entityEntries[entity]) {
      delete entityEntries[entity][entityRelativePath];
    }
  });
}; // Added missing closing brace

// Update this function to include entityType parameter
export const checkIfRelativePathBelongsToEntity = (entityId, relativePath, entityType) => {
  console.log("Checking if relative path belongs to entity", {
    entityId,
    relativePath,
    entityType,
  });
  console.log("entityId", entityId);
  console.log("relativePath", relativePath);
  console.log("entityType", entityType);
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Use provided entityType or default to "entity-to-file-mapping"
  const typeToCheck = entityType || "entity-to-file-mapping";

  console.log("datasetEntityObj?.[typeToCheck]", datasetEntityObj?.[typeToCheck]);
  console.log(
    "datasetEntityObj?.[typeToCheck]?.[entityId]",
    datasetEntityObj?.[typeToCheck]?.[entityId]
  );

  return Boolean(datasetEntityObj?.[typeToCheck]?.[entityId]?.[relativePath]);
};

// Get the number of files associated with a specific entity
export const getNumberFilesForEntity = (entityName) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  return datasetEntityObj?.[entityType]?.[entityName]?.length || 0;
};

// Get the entity associated with a specific file path
export const getEntityForRelativePath = (datasetEntityObj, entityType, relativePath) => {
  const entities = datasetEntityObj?.[entityType];
  if (!entities) return null;

  // Find the entity that has this file path in its map
  return Object.keys(entities).find((entityName) => {
    return Boolean(entities[entityName]?.[relativePath]);
  });
};
