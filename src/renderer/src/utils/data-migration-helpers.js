/**
 * Convert any array-based entity file mappings to object/map format
 * @param {Object} datasetEntityObj - The dataset entity object potentially containing array-based mappings
 * @returns {Object} Dataset entity object with all mappings in object/map format
 */
export const convertArrayMappingsToObjects = (datasetEntityObj) => {
  if (!datasetEntityObj) return {};

  const result = { ...datasetEntityObj };

  // Process each entity type
  Object.keys(result).forEach((entityType) => {
    const entities = result[entityType];

    // Process each entity in this type
    Object.keys(entities).forEach((entityId) => {
      const entityFiles = entities[entityId];

      // If this is still an array, convert it to an object
      if (Array.isArray(entityFiles)) {
        result[entityType][entityId] = entityFiles.reduce((acc, path) => {
          acc[path] = true;
          return acc;
        }, {});
      }
    });
  });

  return result;
};

/**
 * Get a count of files mapped to a specific entity
 * @param {Object} datasetEntityObj - The dataset entity object
 * @param {string} entityType - The type of entity
 * @param {string} entityId - The entity ID
 * @returns {number} Count of files mapped to this entity
 */
export const getEntityFileCount = (datasetEntityObj, entityType, entityId) => {
  if (!datasetEntityObj?.[entityType]?.[entityId]) return 0;

  const entityFiles = datasetEntityObj[entityType][entityId];

  // Handle both array and object formats
  if (Array.isArray(entityFiles)) {
    return entityFiles.length;
  }

  return Object.keys(entityFiles).length;
};

/**
 * Get all file paths for an entity
 * @param {Object} datasetEntityObj - The dataset entity object
 * @param {string} entityType - The type of entity
 * @param {string} entityId - The entity ID
 * @returns {Array} Array of file paths for this entity
 */
export const getEntityFilePaths = (datasetEntityObj, entityType, entityId) => {
  if (!datasetEntityObj?.[entityType]?.[entityId]) return [];

  const entityFiles = datasetEntityObj[entityType][entityId];

  // Handle both array and object formats
  if (Array.isArray(entityFiles)) {
    return entityFiles;
  }

  return Object.keys(entityFiles);
};
