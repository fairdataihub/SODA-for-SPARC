import {
  swalListDoubleAction,
  swalListSingleAction,
  swalListDisplayOnly,
  swalConfirmAction,
} from "../../../scripts/utils/swal-utils";
import {
  addSuccessfullyImportedEntityType,
  removeSuccessfullyImportedEntityType,
} from "../../../stores/slices/datasetContentSelectorSlice";
import * as XLSX from "xlsx";
import {
  addSubject,
  addSample,
  addSiteToSubject,
  addSiteToSample,
  normalizeEntityId,
} from "../../../stores/slices/datasetEntityStructureSlice";

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

  const singularEntityType = entityType ? entityType.slice(0, -1) : "entity";
  const capitalizedSingularEntityType =
    singularEntityType.charAt(0).toUpperCase() + singularEntityType.slice(1);
  const capitalizedPluralEntityType = entityType
    ? entityType.charAt(0).toUpperCase() + entityType.slice(1)
    : "entities";

  try {
    // Load and validate the file
    const entitiesMap = await parseExcelToEntityMap(files[0], entityType);
    console.log("Entities map from Excel for", entityType, ":", entitiesMap);
    const notSureWhatReturnIs = validateAndFormatEntities(entitiesMap, entityType);

    // Show confirmation with valid entities
    const entityList = Object.keys(entitiesMap).map((entityId) =>
      config.formatDisplayId(entitiesMap[entityId])
    );
    const confirmed = await swalListDoubleAction(
      entityList,
      `Confirm ${capitalizedPluralEntityType} Import`,
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
    const entities = Object.values(entitiesMap);
    for (const entity of entities) {
      config.saveEntity(entity);
    }
    addSuccessfullyImportedEntityType(entityType);
    window.notyf.open({
      type: "success",
      message: `Successfully imported ${entities.length} ${entityType}`,
    });
  } catch (error) {
    console.error(`Error importing ${entityType}:`, error);
    window.notyf.open({
      type: "error",
      message: `Error importing ${entityType} metadata: ${error.message}`,
      duration: 8000,
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

/**
 * Parse an Excel file and return entities as a map keyed by entity ID (with prefix)
 */
export const parseExcelToEntityMap = async (file, entityType) => {
  const config = entityType ? entityConfigs[entityType] : null;
  const idField = config?.idField;
  const expectedPrefix = config?.prefix;
  const singularEntityType = entityType ? entityType.slice(0, -1) : "entity";
  const capitalizedSingularEntityType =
    singularEntityType.charAt(0).toUpperCase() + singularEntityType.slice(1);
  const capitalizedPluralEntityType = entityType
    ? entityType.charAt(0).toUpperCase() + entityType.slice(1)
    : "entities";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async ({ target }) => {
      try {
        const workbook = XLSX.read(target.result, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet || !worksheet["!ref"]) {
          throw new Error(
            "The worksheet appears to be empty. Please add metadata rows and import again."
          );
        }

        const rawData = XLSX.utils
          .sheet_to_json(worksheet, { defval: "" })
          .map((row) =>
            Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith("__EMPTY")))
          );

        if (rawData.length === 0) {
          throw new Error(
            "The worksheet has no metadata entries. Please add metadata rows and import again."
          );
        } else {
          console.log("Raw data extracted from Excel:", rawData);
        }

        const entitiesMap = {};
        const rowsWithoutId = [];
        const rowsWithInvalidPrefix = [];
        const rowsWithMissingFields = [];

        rawData.forEach((row, index) => {
          const rowNumber = index + 2;

          // Skip completely empty rows
          const hasData = Object.values(row).some((value) => String(value).trim() !== "");

          if (!hasData) return;

          const entityId = String(row[idField] || "").trim();

          // Rows with data must contain an ID
          if (!entityId) {
            rowsWithoutId.push(rowNumber);
            return;
          }

          // Validate ID prefix
          if (expectedPrefix && !entityId.startsWith(expectedPrefix)) {
            rowsWithInvalidPrefix.push({
              rowNumber,
              id: entityId,
            });

            return;
          }

          // Check for required fields
          const requiredFields = config.requiredFields || [];
          const missingFields = requiredFields.filter(
            (field) => !row[field] || String(row[field]).trim() === ""
          );

          if (missingFields.length > 0) {
            missingFields.forEach((field) => {
              rowsWithMissingFields.push({ rowNumber, field });
            });
            return;
          }

          // Format entity and store in map
          const entity = config.formatEntity(row, entityId);
          entitiesMap[entityId] = entity;
        });

        if (rowsWithoutId.length > 0) {
          await swalListDisplayOnly(
            rowsWithoutId.map(
              (rowNumber) => `Row ${rowNumber}: has metadata but is missing the ${idField} field`
            ),
            `${capitalizedSingularEntityType} Metadata Import Failed`,
            `The following rows have data but are missing the required ID field:`,
            "Please fix these issues in the spreadsheet and import again."
          );
          throw new Error("Please ensure every row with data has a value in the ID column.");
        }

        if (rowsWithInvalidPrefix.length > 0) {
          await swalListDisplayOnly(
            rowsWithInvalidPrefix.map(({ rowNumber, id }) => `Row ${rowNumber}: "${id}"`),
            `${capitalizedPluralEntityType} Metadata Import Failed`,
            `The following rows have invalid ID prefixes (${capitalizedPluralEntityType} IDs are expected to start with ${expectedPrefix}):`,
            "Please fix these issues in the spreadsheet and import again."
          );
          throw new Error(
            `Please ensure all IDs start with the expected prefix: ${expectedPrefix}`
          );
        }

        if (rowsWithMissingFields.length > 0) {
          await swalListDisplayOnly(
            rowsWithMissingFields.map(
              ({ rowNumber, field }) => `Row ${rowNumber}: missing ${field}`
            ),
            `${capitalizedSingularEntityType} Metadata Import Failed`,
            `The following rows are missing required fields:`,
            "Please fix these issues in the spreadsheet and import again."
          );
          throw new Error(`${rowsWithMissingFields.length} row(s) are missing required fields`);
        }

        // Validate field values against SDS requirements (entities already formatted in map)
        const entities = Object.values(entitiesMap);
        console.log("Validating field values for", entities.length, "entities");
        const validationErrors = validateFieldValues(entities, entityType, config);
        if (validationErrors.length > 0) {
          console.error(`Validation failed with ${validationErrors.length} error(s):`);
          validationErrors.forEach((err) => console.error("  -", err));
          await swalListDisplayOnly(
            validationErrors,
            `${capitalizedSingularEntityType} Metadata Import Failed`,
            `The following validation errors were found:`,
            "Please fix these issues in the spreadsheet and import again."
          );
          throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
        }

        resolve(entitiesMap);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

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
 * Validate and format entity data from Excel entities map
 */
const validateAndFormatEntities = (entitiesMap, entityType) => {
  console.log("=== validateAndFormatEntities START ===");
  console.log("Entity type:", entityType);
  const entitiesArray = Object.values(entitiesMap);
  console.log("Entity rows:", entitiesArray.length);

  const config = entityConfigs[entityType];

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

  // Format entities with IDs (IDs already validated upstream)
  const entities = [];
  console.log("Formatting entities from validated data");
  for (const [entityId, item] of Object.entries(entitiesMap)) {
    const entity = config.formatEntity(item, entityId);
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

  console.log("=== validateAndFormatEntities SUCCESS ===");
  return {
    success: true,
    message: `Successfully processed ${entities.length} ${entityType}`,
    entities,
  };
};

/**
 * Generic function to import entities from Excel
 */
export const importEntitiesFromExcel = async (file, entityType) => {
  try {
    // Read the data
    const entitiesMap = await parseExcelToEntityMap(file, entityType);
    console.log("Entities map from Excel for", entityType, ":", entitiesMap);
    // Validate and format data
    const processResult = validateAndFormatEntities(entitiesMap, entityType);
    return processResult;
  } catch (error) {
    console.error(`Error importing ${entityType} from Excel:`, error);
    throw new Error(`Failed to import ${entityType} metadata: ${error.message}`);
  }
};
