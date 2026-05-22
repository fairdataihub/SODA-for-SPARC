import {
  swalListDoubleAction,
  swalListSingleAction,
  swalConfirmAction,
} from "../../../scripts/utils/swal-utils";
import {
  addSuccessfullyImportedEntityType,
  removeSuccessfullyImportedEntityType,
} from "../../../stores/slices/datasetContentSelectorSlice";

export const handleEntityFileImport = async (files, entityType) => {
  if (!files?.length) {
    window.notyf.open({
      type: "error",
      message: "No file selected. Please select an Excel file to import.",
    });
    return;
  }

  const config = entityConfigs[entityType];
  if (!config) {
    window.notyf.open({
      type: "error",
      message: `Unsupported entity type: ${entityType}`,
    });
    return;
  }

  try {
    // Load and validate the file
    const result = await handleEntityMetadataFileImport(files[0], entityType);

    // Handle validation/processing errors
    if (!result.success) {
      const errors = result.message.split("\n").filter((line) => line.trim());
      await swalListSingleAction(
        errors,
        `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Import Failed`,
        "The following errors were found in your spreadsheet:",
        "OK"
      );
      return;
    }

    // Show confirmation with valid entities
    const entityList = result.entities.map((entity) => config.formatDisplayId(entity));
    const confirmed = await swalListDoubleAction(
      entityList,
      `Confirm ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Import`,
      `The following ${entityList.length} ${entityType} will be imported into SODA:`,
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

    // Save entities to store
    const saveResult = saveEntities(result.entities, entityType);

    if (saveResult.success) {
      addSuccessfullyImportedEntityType(entityType);
      window.notyf.open({ type: "success", message: saveResult.message });
    } else {
      removeSuccessfullyImportedEntityType(entityType);
      window.notyf.open({ type: "error", message: saveResult.message });
    }
  } catch (error) {
    window.notyf.open({
      type: "error",
      message: `Error importing ${entityType}: ${error.message}`,
    });
  }
};

export const handleDownloadTemplate = (entityType, helperConfig) => {
  console.log("Downloading template for:", entityType);
  console.log("Helper config:", helperConfig);
  const config = entityConfigs[entityType];
  if (!config) {
    window.notyf.open({
      type: "error",
      message: `No template available for entity type: ${entityType}`,
    });
    return;
  }

  try {
    window.electron.ipcRenderer.send(
      "open-folder-dialog-save-metadata",
      config.templateFileName,
      helperConfig
    );
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
  addSample,
  addSiteToSubject,
  addSiteToSample,
  normalizeEntityId,
} from "../../../stores/slices/datasetEntityStructureSlice";

/**
 * Parse an Excel file and return entities as a map keyed by entity ID (with prefix)
 */
export const parseExcelToEntityMap = (file, entityType) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        let rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        // Filter out __EMPTY columns only
        if (rawData.length > 0) {
          rawData = rawData.map((row) => {
            const cleaned = {};
            for (const [key, value] of Object.entries(row)) {
              // Skip __EMPTY columns, but keep all other columns including empty strings
              if (!key.startsWith("__EMPTY")) {
                cleaned[key] = value;
              }
            }
            return cleaned;
          });
        }

        // Convert array to map keyed by entity ID
        const entitiesMap = {};
        const config = entityType ? entityConfigs[entityType] : null;
        const idField = config?.idField;
        const expectedPrefix = config?.prefix;

        rawData.forEach((row, index) => {
          // Get the ID value from the appropriate field
          let idValue = row[idField];

          // Check if row has any data (not completely empty)
          const hasData = Object.values(row).some((val) => val && String(val).trim());

          if (hasData) {
            // Row has data, so it MUST have a valid ID
            if (!idValue || !String(idValue).trim()) {
              throw new Error(`Row ${index + 2} has data but is missing the ${idField} field`);
            }

            const entityId = String(idValue).trim();

            // Validate that the ID starts with the expected prefix
            if (expectedPrefix && !entityId.startsWith(expectedPrefix)) {
              throw new Error(
                `Row ${
                  index + 2
                }: Invalid ID format. Expected prefix "${expectedPrefix}", got "${entityId}"`
              );
            }

            entitiesMap[entityId] = row;
          }
        });

        resolve(entitiesMap);
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
    requiredFields: ["subject id", "species"],
    validationRules: [
      {
        field: "RRID for strain",
        rule: "string-is-valid-rrid",
        errorMessage:
          "Invalid strain RRID format. Use: RRID:rrid_identifier (e.g., RRID:IMSR_JAX:000664)",
      },
      {
        field: "protocol url or doi",
        rule: "string-is-valid-url-or-doi",
        errorMessage: "Invalid format. Please enter a valid HTTPS URL, DOI, or DOI URL.",
      },
    ],
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
    validationRules: [
      {
        field: "protocol url or doi",
        rule: "string-is-valid-url-or-doi",
        errorMessage: "Invalid format. Please enter a valid HTTPS URL, DOI, or DOI URL.",
      },
    ],
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
    saveEntity: (entity) => addSample(entity.parentSubject, null, entity.id, entity.metadata),
    formatDisplayId: (entity) => `${entity.id}`,
    templateFileName: "samples.xlsx",
  },

  sites: {
    idField: "site id",
    prefix: "site-",
    requiredFields: ["site id", "subject id"],
    optionalFields: ["sample id"],
    validationRules: [],
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

      // Add sample parent if it exists (spreadsheet header "sample id")
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
 * Validate entity file structure and data integrity (standalone validation)
 */
const validateEntityFile = (entitiesMap, entityType) => {
  console.log("=== validateEntityFile START ===");
  console.log("Entity type:", entityType);
  const entitiesArray = Object.values(entitiesMap);
  console.log("Entity rows:", entitiesArray.length);

  if (entitiesArray.length === 0) {
    console.error("No data found in spreadsheet");
    throw new Error("No data found in spreadsheet");
  }

  const config = entityConfigs[entityType];
  if (!config) {
    console.error("No config found for entity type:", entityType);
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  // Check for required fields
  const requiredFields = config.requiredFields || [];
  console.log("Required fields:", requiredFields);

  const missingFieldItems = entitiesArray.filter((item) =>
    requiredFields.some((field) => !item[field] || String(item[field]).trim() === "")
  );

  if (missingFieldItems.length > 0) {
    console.error(`Found ${missingFieldItems.length} rows with missing required fields`);
    throw new Error(
      `${missingFieldItems.length} row(s) are missing required fields: ${requiredFields.join(", ")}`
    );
  }
  console.log("All rows have required fields ✓");

  // Check for ID field presence
  console.log("Checking ID field:", config.idField);
  const missingIdItems = entitiesArray.filter(
    (item) => !item[config.idField] || String(item[config.idField]).trim() === ""
  );
  if (missingIdItems.length > 0) {
    console.error(`Found ${missingIdItems.length} rows with missing ID field`);
    throw new Error(`${missingIdItems.length} row(s) are missing the ${config.idField} field`);
  }
  console.log("All rows have ID field ✓");

  console.log("=== validateEntityFile SUCCESS ===");
};

/**
 * Validate field values against SDS requirements for specific fields
 */
const validateFieldValues = (entities, entityType, config) => {
  const rules = config.validationRules || [];
  const validationErrors = [];

  for (const entity of entities) {
    for (const rule of rules) {
      const fieldValue = entity.metadata[rule.field];
      // Only validate if the field has a value
      if (fieldValue && String(fieldValue).trim().length > 0) {
        const isValid = window.evaluateStringAgainstSdsRequirements?.(fieldValue, rule.rule);
        if (!isValid) {
          validationErrors.push(`${entity.id}: Field "${rule.field}" - ${rule.errorMessage}`);
        }
      }
    }
  }

  return validationErrors;
};

/**
 * Process and validate entity data from Excel entities map
 */
const processEntityData = (entitiesMap, entityType) => {
  console.log("=== processEntityData START ===");
  console.log("Entity type:", entityType);
  const entitiesArray = Object.values(entitiesMap);
  console.log("Entity rows:", entitiesArray.length);

  const config = entityConfigs[entityType];
  if (!config) {
    console.error("No config found for entity type:", entityType);
    return {
      success: false,
      message: `Unsupported entity type: ${entityType}`,
      entities: [],
    };
  }

  // Check for required fields
  const requiredFields = config.requiredFields || [];
  console.log("Required fields:", requiredFields);

  const missingFieldItems = entitiesArray.filter((item) =>
    requiredFields.some((field) => !item[field] || String(item[field]).trim() === "")
  );

  if (missingFieldItems.length > 0) {
    console.error(`Found ${missingFieldItems.length} rows with missing required fields`);
    return {
      success: false,
      message: `${
        missingFieldItems.length
      } row(s) are missing required fields: ${requiredFields.join(", ")}`,
      entities: [],
    };
  }
  console.log("All rows have required fields ✓");

  // Format entities with IDs
  const entities = [];
  console.log("Formatting entities with ID field:", config.idField);
  for (const item of entitiesArray) {
    const idValue = item[config.idField];
    if (!idValue) {
      console.warn("Skipping item with no ID value:", item);
      continue;
    }

    const id = config.prefix + String(idValue).trim();
    const entity = config.formatEntity(item, id);
    entities.push(entity);
  }
  console.log("Formatted entities:", entities.length);

  if (entities.length === 0) {
    console.error("No valid entities found in the spreadsheet");
    return {
      success: false,
      message: `No valid entities found in the spreadsheet`,
      entities: [],
    };
  }

  // Validate field values against SDS requirements
  console.log("Validating field values for", entities.length, "entities");
  const validationErrors = validateFieldValues(entities, entityType, config);
  if (validationErrors.length > 0) {
    console.error(`Validation failed with ${validationErrors.length} error(s):`);
    validationErrors.forEach((err) => console.error("  -", err));
    return {
      success: false,
      message: `Validation failed:\n${validationErrors.join("\n")}`,
      entities: [],
    };
  }
  console.log("All validations passed ✓");

  console.log("=== processEntityData SUCCESS ===");
  return {
    success: true,
    message: `Successfully processed ${entities.length} ${entityType}`,
    entities,
  };
};

/**
 * Generic function to import entities from Excel
 */
export const handleEntityMetadataFileImport = async (file, entityType) => {
  if (!entityConfigs[entityType]) {
    return {
      success: false,
      message: `Unsupported entity type: ${entityType}`,
      entities: [],
    };
  }

  try {
    // Read the data
    const entitiesMap = await parseExcelToEntityMap(file, entityType);
    console.log("Entities map from Excel for", entityType, ":", entitiesMap);
    // Process and validate data
    const processResult = processEntityData(entitiesMap, entityType);
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
      // Fail-fast: stop importing further entities if any save/validation error occurs
      const msg = `Failed to import ${entity.id}: ${error.message}`;
      console.error(`Error saving entity ${entity.id}:`, error);
      return {
        success: false,
        message: msg,
        imported: importedCount,
        errors: [msg],
        entities: savedEntities,
      };
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
