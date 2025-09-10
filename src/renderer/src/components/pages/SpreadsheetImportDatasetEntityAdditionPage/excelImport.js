import { swalFileListDoubleAction, swalConfirmAction } from "../../../scripts/utils/swal-utils";

export const handleEntityFileImport = async (files, entityType, setImportResults) => {
  if (!files?.length) return;

  const config = entityConfigs[entityType];
  if (!config) {
    window.notyf.open({
      type: "error",
      message: `Unsupported entity type: ${entityType}`,
    });
    return;
  }

  try {
    // Process file and get formatted entities
    const result = await importEntitiesFromExcel(files[0], entityType);
    if (!result.success) {
      window.notyf.open({
        type: "error",
        message: result.message,
      });
      return;
    }

    // Show confirmation with processed entities
    const entityList = result.entities.map((entity) => config.formatDisplayId(entity));

    const confirmed = await swalFileListDoubleAction(
      entityList,
      `Confirm ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Import`,
      `The following ${entityList.length} ${entityType} were detected in your spreadsheet and will be imported into SODA:`,
      "Import",
      "Cancel"
    );

    if (!confirmed) {
      window.notyf.open({
        type: "info",
        message: `${entityType} import cancelled`,
      });
      return;
    }

    // Save the entities to the data store
    const saveResult = saveEntities(result.entities, entityType);
    setImportResults((prev) => ({ ...prev, [entityType]: saveResult }));

    if (saveResult.success) {
      window.notyf.open({
        type: "success",
        message: saveResult.message,
      });
    } else {
      window.notyf.open({
        type: "error",
        message: saveResult.message,
      });
    }
  } catch (error) {
    window.notyf.open({
      type: "error",
      message: `Error importing ${entityType}: ${error.message}`,
    });
  }
};

export const handleDownloadTemplate = (entityType) => {
  console.log("Downloading template for:", entityType);
  const config = entityConfigs[entityType];
  if (!config) {
    window.notyf.open({
      type: "error",
      message: `No template available for entity type: ${entityType}`,
    });
    return;
  }

  try {
    window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", config.templateFileName);
  } catch (error) {
    console.error(`Error sending IPC message for ${entityType} template:`, error);
  }
};

export const handleFileRejection = () => {
  window.notyf.open({
    type: "error",
    message: "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
  });
};
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
    idField: "subject_id",
    prefix: "sub-",
    requiredFields: ["subject_id"],
    formatEntity: (item, id) => ({
      id,
      type: "subject",
      metadata: { ...item, subject_id: id },
    }),
    saveEntity: (entity) => addSubject(entity.id, entity.metadata),
    formatDisplayId: (entity) => entity.id,
    templateFileName: "subjects.xlsx",
  },

  samples: {
    idField: "sample_id",
    prefix: "sam-",
    requiredFields: ["sample_id", "subject_id"],
    formatEntity: (item, id) => {
      // Normalize the subject ID using the imported function
      const subjectId = normalizeEntityId("sub-", item["subject_id"]);

      return {
        id,
        type: "sample",
        parentSubject: subjectId,
        metadata: { ...item, sample_id: id, subject_id: subjectId },
      };
    },
    saveEntity: (entity) => addSampleToSubject(entity.parentSubject, entity.id, entity.metadata),
    formatDisplayId: (entity) => `${entity.id}`,
    templateFileName: "samples.xlsx",
  },

  sites: {
    idField: "site_id",
    prefix: "site-",
    requiredFields: ["site_id", "subject_id"],
    optionalFields: ["sample_id"],
    formatEntity: (item, id) => {
      // Normalize parent IDs consistently using the imported function
      const subjectId = normalizeEntityId("sub-", item["subject_id"]);

      // Create base entity with subject parent
      const entity = {
        id,
        type: "site",
        parentSubject: subjectId,
        metadata: { ...item, site_id: id, subject_id: subjectId },
      };

      // Add sample parent if it exists
      if (item["sample_id"]) {
        const sampleId = normalizeEntityId("sam-", item["sample_id"]);
        entity.parentSample = sampleId;
        entity.metadata["sample_id"] = sampleId;
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
    // Process and validate data
    const processResult = processEntityData(rawData, entityType);
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
