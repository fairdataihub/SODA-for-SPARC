import useGlobalStore from "../globalStore";
import { filterStructure, addRelativePaths } from "./datasetTreeViewSlice";
import { swalFileListDoubleAction } from "../../scripts/utils/swal-utils";
import { produce } from "immer";

// Initial state for managing dataset entities
const initialState = {
  activeEntity: null, // Currently active entity
  entityType: null, // Type of the selected entity
  datasetEntityObj: {}, // Stores entities grouped by type
  entityStructureObj: {
    subjects: {},
  }, // Example structure: { sub-01: { samples: { sam-01: { performances: [], sites: [] } } } }
};

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

// Slice initialization for the entity selector state
export const datasetEntitySelectorSlice = (set) => ({
  ...initialState,
});

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

export const autoSelectDatasetFoldersAndFilesForEnteredEntityIds = async (
  datasetStructure,
  entityType,
  entityTypeStringSingular
) => {
  console.log("Starting auto-selection process", { datasetStructure, entityType });

  // Deep copy the dataset structure to ensure original data remains untouched
  const structureCopy = JSON.parse(JSON.stringify(datasetStructure));

  // Retrieve the dataset entity object and extract the relevant entity list
  const datasetEntityObj = getDatasetEntityObj();
  const entityList = Object.keys(datasetEntityObj[entityType] || {});

  // Collect matching paths for each entity ID
  const additions = entityList.reduce((acc, entityID) => {
    console.log("Searching entityID" + entityID);

    // Extract everything after the first dash
    const entityName = entityID.substring(entityID.indexOf("-") + 1);

    console.log("Searching entityName" + entityName);

    const matchingPaths = [];
    findMatchingRelativePaths(structureCopy, entityName, matchingPaths);

    console.log("Entity processing", { entityID, entityName, matchingPaths });

    if (matchingPaths.length > 0) {
      acc[entityID] = matchingPaths;
    }

    return acc;
  }, {});

  // Create a list of confirmation items
  const confirmationItems = Object.entries(additions).flatMap(([entityID, paths]) =>
    paths.map((path) => `${entityID} - ${path}`)
  );

  console.log("confirmationItems", confirmationItems);
  if (confirmationItems.length > 0) {
    // Display confirmation dialog with SweetAlert
    const autoSelectDetectedEntityItems = await swalFileListDoubleAction(
      confirmationItems,
      `SODA detected ${confirmationItems.length} folders and files that match the ${entityTypeStringSingular} IDs entered`,
      ``,
      "Auto-associate detected folders and files",
      "Do not auto-associate",
      "Would you like SODA to auto-associate these folders and files with the entered IDs?"
    );

    if (autoSelectDetectedEntityItems) {
      // Apply the additions
      Object.entries(additions).forEach(([entityID, paths]) => {
        paths.forEach((relativePath) => {
          modifyDatasetEntityForRelativeFilePath(entityType, entityID, relativePath, "add");
          console.log("Added path to dataset entity", { entityType, entityID, relativePath });
        });
      });
      console.log("All additions confirmed and applied.");
    } else {
      console.log("Additions were canceled by the user.");
    }
  }
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
