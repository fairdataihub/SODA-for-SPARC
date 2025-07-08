import * as XLSX from "xlsx";
import {
  addSubject,
  addSampleToSubject,
  addSiteToSubject,
  addSiteToSample,
  normalizeEntityId,
} from "../../../stores/slices/datasetEntityStructureSlice";

/**
 * Read an Excel file and convert to JSON data
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        resolve(XLSX.utils.sheet_to_json(worksheet, { defval: "" }));
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Entity type configurations - using the three main entity types
 */
export const entityConfigs = {
  subjects: {
    idField: "subject id",
    prefix: "sub-",
    requiredFields: ["subject id"],
    formatEntity: (item, id) => ({
      id,
      type: "subject",
      metadata: { ...item, "subject id": id },
    }),
    saveEntity: (entity) => addSubject(entity.id, entity.metadata),
    formatDisplayId: (entity) => entity.id,
    templateFileName: "subjects.xlsx",
  },

  samples: {
    idField: "sample id",
    prefix: "sam-",
    requiredFields: ["sample id", "subject id"],
    formatEntity: (item, id) => {
      // Normalize the subject ID using the imported function
      const subjectId = normalizeEntityId("sub-", item["subject id"]);

      return {
        id,
        type: "sample",
        parentSubject: subjectId,
        metadata: { ...item, "sample id": id, "subject id": subjectId },
      };
    },
    saveEntity: (entity) => addSampleToSubject(entity.parentSubject, entity.id, entity.metadata),
    formatDisplayId: (entity) => `${entity.id}`,
    templateFileName: "samples.xlsx",
  },

  sites: {
    idField: "site id",
    prefix: "site-",
    requiredFields: ["site id", "subject id"],
    optionalFields: ["sample id"],
    formatEntity: (item, id) => {
      // Normalize parent IDs consistently using the imported function
      const subjectId = normalizeEntityId("sub-", item["subject id"]);

      // Create base entity with subject parent
      const entity = {
        id,
        type: "site",
        parentSubject: subjectId,
        metadata: { ...item, "site id": id, "subject id": subjectId },
      };

      // Add sample parent if it exists
      if (item["sample id"]) {
        const sampleId = normalizeEntityId("sam-", item["sample id"]);
        entity.parentSample = sampleId;
        entity.metadata["sample id"] = sampleId;
      }

      return entity;
    },
    saveEntity: (entity) => {
      if (entity.parentSample) {
        // Site belongs to a sample
        addSiteToSample(entity.parentSubject, entity.parentSample, entity.id, entity.metadata);
      } else {
        // Site belongs directly to a subject
        addSiteToSubject(entity.parentSubject, entity.id, entity.metadata);
      }
    },
    formatDisplayId: (entity) => {
      if (entity.parentSample) {
        return `${entity.id} (Sample: ${entity.parentSample}, Subject: ${entity.parentSubject})`;
      }
      return `${entity.id} (Subject: ${entity.parentSubject})`;
    },
    templateFileName: "sites.xlsx",
  },
};

/**
 * Process entities from Excel file with validation
 */
export const processEntityData = (rawData, entityType) => {
  const config = entityConfigs[entityType];
  if (!config) {
    return {
      success: false,
      message: `Unknown entity type: ${entityType}`,
      entities: [],
    };
  }

  const { idField, prefix, requiredFields } = config;

  // Check if data exists
  if (!rawData || rawData.length === 0) {
    return {
      success: false,
      message: `No ${entityType} data found in the file`,
      entities: [],
    };
  }

  // Validate required fields
  const missingFieldItems = rawData.filter((item) => requiredFields.some((field) => !item[field]));

  if (missingFieldItems.length > 0) {
    return {
      success: false,
      message: `${missingFieldItems.length} entries are missing required fields`,
      entities: [],
    };
  }

  // Format the entities using the config's format function and normalized IDs
  const entities = rawData.map((item) => {
    // Get the original ID and normalize it
    let originalId = item[idField];
    // Coerce to string to avoid issues with numbers from Excel
    if (originalId !== undefined && originalId !== null) {
      originalId = String(originalId);
    }
    console.log("originalId", originalId, "idField", idField, "item", item, "prefix", prefix);
    const normalizedId = normalizeEntityId(prefix, originalId);

    // For debugging - log if there's a potential issue with normalization
    if (normalizedId && normalizedId.toLowerCase().includes(prefix.toLowerCase().repeat(2))) {
      console.warn(`Potential ID normalization issue: ${originalId} -> ${normalizedId}`);
    }

    return config.formatEntity(item, normalizedId);
  });

  return {
    success: true,
    message: `Found ${entities.length} valid ${entityType}`,
    entities,
  };
};

/**
 * Generic function to import entities from Excel
 */
export const importEntitiesFromExcel = async (file, entityType) => {
  if (!entityConfigs[entityType]) {
    return {
      success: false,
      message: `Unsupported entity type: ${entityType}`,
      entities: [],
    };
  }

  try {
    // Read the data
    const rawData = await readExcelFile(file);

    console.log("rawData", rawData);

    // Process and validate data
    const processResult = processEntityData(rawData, entityType);
    console.log("processResult", processResult);

    return processResult;
  } catch (error) {
    console.error(`Error processing ${entityType} data:`, error);
    return {
      success: false,
      message: `Failed to process ${entityType}: ${error.message}`,
      entities: [],
    };
  }
};

/**
 * Save entities to the data store
 */
export const saveEntities = (entities, entityType) => {
  const config = entityConfigs[entityType];
  if (!config) {
    return {
      success: false,
      message: `Unknown entity type: ${entityType}`,
      imported: 0,
    };
  }

  let importedCount = 0;
  const errors = [];
  const savedEntities = [];

  for (const entity of entities) {
    try {
      config.saveEntity(entity);
      importedCount++;
      savedEntities.push(entity);
    } catch (error) {
      errors.push(`Failed to import ${entity.id}: ${error.message}`);
    }
  }

  return {
    success: importedCount > 0,
    message: errors.length
      ? `Imported ${importedCount} ${entityType} with ${errors.length} errors`
      : `Successfully imported ${importedCount} ${entityType}`,
    imported: importedCount,
    errors: errors.length ? errors : undefined,
    entities: savedEntities,
  };
};
