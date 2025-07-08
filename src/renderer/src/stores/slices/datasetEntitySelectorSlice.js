import useGlobalStore from "../globalStore";
import { produce } from "immer";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
  getExistingPerformancesR,
} from "./datasetEntityStructureSlice";
import { setEntityFilter } from "./datasetTreeViewSlice";
import { getItemAtPath } from "../../scripts/utils/datasetStructure";

// Slice initialization for the entity selector state
export const datasetEntitySelectorSlice = (set) => ({
  activeEntity: null, // Currently active entity
  entityType: null, // Type of the selected entity
  datasetEntityObj: {}, // Stores entities grouped by type
  entityStructureObj: {
    subjects: {},
  }, // Example structure: { sub-01: { samples: { sam-01: { performances: [], sites: [] } } } }
  showFullMetadataFormFields: false, // Flag to show full metadata form fields
});

// Add an entity to the specified entity type's list
export const addEntityToEntityList = (entityType, entityName) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.datasetEntityObj) {
        state.datasetEntityObj = {};
      }

      if (!state.datasetEntityObj[entityType]) {
        state.datasetEntityObj[entityType] = {};
      }

      if (!state.datasetEntityObj[entityType][entityName]) {
        state.datasetEntityObj[entityType][entityName] = {};
      } // Initialize the entity list where folder and file paths will be added
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
      delete state.datasetEntityObj?.[entityType]?.[entityName];
    })
  );
};

// Get the obj of entities for a specific entity type
export const getEntityObjForEntityType = (entityType) => {
  return useGlobalStore.getState()?.datasetEntityObj?.[entityType] || {};
};

export const setShowFullMetadataFormFields = (showFullMetadataFormFields) => {
  useGlobalStore.setState((state) => ({
    ...state,
    showFullMetadataFormFields,
  }));
};

// Set the currently active entity
export const setActiveEntity = (activeEntity) => {
  // combine existing entity IDs and see if the entity being set is an entity
  // Check to see if the activeEntity is a site entity

  if (!activeEntity) {
    useGlobalStore.setState((state) => ({
      ...state,
      activeEntity: null,
    })); // Reset active entity if null
    return;
  }

  useGlobalStore.setState((state) => ({
    ...state,
    activeEntity,
  }));

  if (activeEntity.startsWith("site-") || activeEntity.startsWith("perf-")) {
    setEntityFilter(
      [{ type: "high-level-folder-data-categorization", names: ["Experimental"] }],
      []
    );
  }

  if (activeEntity.startsWith("sam-")) {
    const existingSiteIds = getExistingSites().map((site) => site.id);
    console.log("Existing sites: ", getExistingSites());
    const siteFilter = [
      {
        type: "sites",
        names: existingSiteIds,
      },
    ];
    setEntityFilter(
      [{ type: "high-level-folder-data-categorization", names: ["Experimental"] }],
      siteFilter
    );
  }

  if (activeEntity.startsWith("sub-")) {
    const existingSiteIds = getExistingSites().map((site) => site.id);
    const existingSampleIds = getExistingSamples().map((sample) => sample.id);
    const siteFilter = [
      {
        type: "sites",
        names: existingSiteIds,
      },
    ];
    const sampleFilter = [
      {
        type: "samples",
        names: existingSampleIds,
      },
    ];
    const combinedFilter = [...siteFilter, ...sampleFilter];
    console.log("Setting entity filter: ", combinedFilter);
    setEntityFilter(
      [{ type: "high-level-folder-data-categorization", names: ["Experimental"] }],
      combinedFilter
    );
  }
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

// Filter out any entities in the savedDatasetEntityObj that no longer exist in the
// dataset structure (for example if the user went back and deleted some folders/files)
export const filterRemovedFilesFromDatasetEntityObj = (entityObj) => {
  const filteredEntityObj = {};

  // Loop through each entity type in the savedDatasetEntityObj
  // For example , "high-level-folder-data-categorization", "modalities" etc
  for (const [entityType, entities] of Object.entries(entityObj)) {
    filteredEntityObj[entityType] = {};

    // Loop through the entities of the current entity type
    // For example "Code", "Experimental", "Protocol" etc
    for (const [entityName, entityData] of Object.entries(entities)) {
      // Loop through the files and if they exist re-add them to the filteredEntityObj
      for (const fileName of Object.keys(entityData)) {
        const itemAtPath = getItemAtPath(fileName, "file");
        // If the file still exists in the dataset structure, add it to the filteredEntityObj
        if (itemAtPath) {
          if (!filteredEntityObj[entityType][entityName]) {
            filteredEntityObj[entityType][entityName] = {};
          }
          filteredEntityObj[entityType][entityName][fileName] = entityData[fileName];
        } else {
          console.log(
            `File ${fileName} in entity ${entityName} of type ${entityType} has been removed from the dataset structure.`
          );
        }
      }
    }
  }
  return filteredEntityObj;
};
export const getSubjectEntities = () => {
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
  console.log("datasetEntityObj", datasetEntityObj);
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
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Use provided entityType or default to "entity-to-file-mapping"
  const typeToCheck = entityType || "entity-to-file-mapping";

  return Boolean(datasetEntityObj?.[typeToCheck]?.[entityId]?.[relativePath]);
};

/**
 * Recursively checks if a folder and all its contents belong to a specific entity
 * @param {string} entityId - The entity ID to check for
 * @param {object} folderContents - The folder contents object with structure {files, folders, relativePath}
 * @param {string} entityType - The type of entity (e.g., "Code", "Experimental")
 * @returns {boolean} - True if the folder or all its contents belong to the entity
 */
export const checkIfFolderBelongsToEntity = (entityId, folderContents, entityType) => {
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
  if (!datasetEntityObj || !entityType || !datasetEntityObj[entityType] || !entityId) {
    return false;
  }

  // First check: If the folder itself is directly associated with the entity
  const folderPath = folderContents.relativePath;
  if (datasetEntityObj[entityType][entityId]?.[folderPath]) {
    return true;
  }

  // Check if the folder has any content
  const hasFiles = folderContents.files && Object.keys(folderContents.files).length > 0;
  const hasFolders = folderContents.folders && Object.keys(folderContents.folders).length > 0;

  if (!hasFiles && !hasFolders) {
    return false; // Empty folder, not associated
  }

  // Check all files in this folder
  if (hasFiles) {
    const allFiles = Object.values(folderContents.files);
    // If any file is not associated with the entity, the folder doesn't fully belong
    for (const file of allFiles) {
      if (!datasetEntityObj[entityType][entityId]?.[file.relativePath]) {
        return false;
      }
    }
  }

  // Check all subfolders recursively
  if (hasFolders) {
    const allSubfolders = Object.values(folderContents.folders);
    for (const subfolder of allSubfolders) {
      if (!checkIfFolderBelongsToEntity(entityId, subfolder, entityType)) {
        return false;
      }
    }
  }

  // If we got here, all files and subfolders are associated with the entity
  return true;
};

// Add this new function as a separate top-level export
export const areAllFilesInFolderSelectedForEntity = (entityId, folderContents, entityType) => {
  // Check if the store is available
  const state = useGlobalStore.getState();
  if (!state || !state.datasetEntityObj) {
    return false;
  }

  // Check all files in this folder
  const allFiles = Object.values(folderContents.files);
  for (const file of allFiles) {
    if (!checkIfRelativePathBelongsToEntity(entityId, file.relativePath, entityType)) {
      return false; // Found a file that's not selected
    }
  }

  // Recursively check all subfolders
  const allSubfolders = Object.values(folderContents.folders);
  for (const subfolder of allSubfolders) {
    if (!areAllFilesInFolderSelectedForEntity(entityId, subfolder, entityType)) {
      return false; // Found a subfolder with unselected files
    }
  }

  // If we got here, all files in this folder and subfolders are selected
  return true;
};
