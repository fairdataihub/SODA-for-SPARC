import {
  swalListDoubleAction,
  swalListSingleAction,
  swalListDisplayOnly,
  swalConfirmAction,
} from "../../../scripts/utils/swal-utils";
import Swal from "sweetalert2";
import { setImportedMetadataFilePath } from "../../../stores/slices/datasetContentSelectorSlice";
import * as XLSX from "xlsx";
import {
  addSubject,
  addSample,
  addSiteToSubject,
  addSiteToSample,
  normalizeEntityId,
  getExistingSubjects,
  getExistingSamples,
} from "../../../stores/slices/datasetEntityStructureSlice";
import useGlobalStore from "../../../stores/globalStore";

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

  const capitalizedPluralEntityType = entityType
    ? entityType.charAt(0).toUpperCase() + entityType.slice(1)
    : "entities";

  try {
    // Load and validate the file
    const entitiesMap = await parseExcelToEntityMap(files[0], entityType);

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

    // Save the file path to the store for tracking
    const filePath = files[0].path || files[0].name;
    setImportedMetadataFilePath(entityType, filePath);

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

const promptCountByEntity = async ({
  entityIds,
  title,
  promptText,
  inputIdPrefix,
  noEntitiesTitle,
  noEntitiesMessage,
}) => {
  if (entityIds.length === 0) {
    const response = await Swal.fire({
      icon: "info",
      title: noEntitiesTitle,
      html: noEntitiesMessage,
      showCancelButton: true,
      confirmButtonText: "Download blank template",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    return response.isConfirmed ? {} : null;
  }

  const popupHtml = `
    <div style="max-height: 380px; overflow-y: auto; text-align: left; padding-right: 0.5rem;">
      <p style="margin-bottom: 0.75rem;">${promptText}</p>
      ${entityIds
        .map(
          (entityId) => `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem;">
          <label for="${inputIdPrefix}-${entityId}" style="margin: 0; font-weight: 600;">${entityId}</label>
          <input
            id="${inputIdPrefix}-${entityId}"
            type="number"
            min="0"
            step="1"
            value="0"
            style="width: 120px; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
            class="swal2-input"
          />
        </div>
      `
        )
        .join("")}
    </div>
  `;

  const response = await Swal.fire({
    title,
    html: popupHtml,
    showCancelButton: true,
    confirmButtonText: "Continue",
    cancelButtonText: "Cancel",
    width: 700,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    focusConfirm: false,
    preConfirm: () => {
      const countsByEntity = {};

      for (const entityId of entityIds) {
        const inputEl = document.getElementById(`${inputIdPrefix}-${entityId}`);
        const rawValue = inputEl?.value ?? "0";
        const parsedValue = Number(rawValue);

        if (!Number.isInteger(parsedValue) || parsedValue < 0) {
          Swal.showValidationMessage(`Please enter a non-negative whole number for ${entityId}.`);
          return;
        }

        countsByEntity[entityId] = parsedValue;
      }

      return countsByEntity;
    },
  });

  return response.isConfirmed ? response.value : null;
};

const promptSamplesPerSubject = async () => {
  const subjectIds = getExistingSubjects().map((subject) => subject.id);

  // If no subjects, show the no entities dialog
  if (subjectIds.length === 0) {
    const response = await Swal.fire({
      icon: "info",
      title: "No subjects found",
      html: "Add or import subjects first to pre-populate samples by subject. A blank samples template will be downloaded.",
      showCancelButton: true,
      confirmButtonText: "Download blank template",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    return response.isConfirmed ? {} : null;
  }

  // Ask if all subjects have the same number of samples
  const sameCountResponse = await Swal.fire({
    title: "Sample Distribution",
    html: "Do all subjects have the same number of samples?",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Yes, same number",
    denyButtonText: "No, different amounts",
    cancelButtonText: "Cancel",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });

  if (
    sameCountResponse.isDismissed ||
    (!sameCountResponse.isConfirmed && !sameCountResponse.isDenied)
  ) {
    // Cancel was clicked
    return null;
  }

  if (sameCountResponse.isConfirmed) {
    // All subjects have the same number of samples - ask for a single number
    const countResponse = await Swal.fire({
      title: "Samples per subject",
      html: "Enter the number of samples each subject has:",
      input: "number",
      inputAttributes: {
        min: "0",
        step: "1",
      },
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 0) {
          return "Please enter a non-negative whole number.";
        }
      },
    });

    if (countResponse.isConfirmed) {
      const sampleCount = Number(countResponse.value);
      // Create a map with the same count for all subjects
      const countsBySubject = {};
      for (const subjectId of subjectIds) {
        countsBySubject[subjectId] = sampleCount;
      }
      return countsBySubject;
    } else {
      return null;
    }
  } else {
    // Different subjects - ask if they want to provide per-subject counts
    const provideCountsResponse = await Swal.fire({
      title: "Pre-populate samples by subject?",
      html: `<p>Would you like to specify how many samples each subject has?</p>
             <p style="font-size: 0.9em; color: #666; margin-top: 1rem;">
               <strong>Why this helps:</strong> This will pre-populate the subject ID column in the template, 
               making it easier to enter sample metadata. You'll have one row per sample, already assigned to the correct subject.
             </p>`,
      showCancelButton: true,
      confirmButtonText: "Yes, specify counts",
      cancelButtonText: "Skip, download blank template",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    if (!provideCountsResponse.isConfirmed) {
      return {};
    }

    // Use the existing prompt for per-subject counts
    return promptCountByEntity({
      entityIds: subjectIds,
      title: "Samples per subject",
      promptText: "Enter how many samples each subject has:",
      inputIdPrefix: "sample-count",
      noEntitiesTitle: "No subjects found",
      noEntitiesMessage:
        "Add or import subjects first to pre-populate samples by subject. A blank samples template will be downloaded.",
    });
  }
};

const promptSitesPerSubject = async () => {
  const subjectIds = getExistingSubjects().map((subject) => subject.id);

  // If no subjects, show the no entities dialog
  if (subjectIds.length === 0) {
    const response = await Swal.fire({
      icon: "info",
      title: "No subjects found",
      html: "Add or import subjects first to pre-populate subject sites. A blank sites template will be downloaded.",
      showCancelButton: true,
      confirmButtonText: "Download blank template",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    return response.isConfirmed ? {} : null;
  }

  // Ask if all subjects have the same number of sites
  const sameCountResponse = await Swal.fire({
    title: "Site Distribution",
    html: "Do all subjects have the same number of sites?",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Yes, same number",
    denyButtonText: "No, different amounts",
    cancelButtonText: "Cancel",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });

  if (
    sameCountResponse.isDismissed ||
    (!sameCountResponse.isConfirmed && !sameCountResponse.isDenied)
  ) {
    // Cancel was clicked
    return null;
  }

  if (sameCountResponse.isConfirmed) {
    // All subjects have the same number of sites - ask for a single number
    const countResponse = await Swal.fire({
      title: "Sites per subject",
      html: "Enter the number of sites each subject has:",
      input: "number",
      inputAttributes: {
        min: "0",
        step: "1",
      },
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 0) {
          return "Please enter a non-negative whole number.";
        }
      },
    });

    if (countResponse.isConfirmed) {
      const siteCount = Number(countResponse.value);
      // Create a map with the same count for all subjects
      const countsBySubject = {};
      for (const subjectId of subjectIds) {
        countsBySubject[subjectId] = siteCount;
      }
      return countsBySubject;
    } else {
      return null;
    }
  } else {
    // Different subjects - ask if they want to provide per-subject counts
    const provideCountsResponse = await Swal.fire({
      title: "Pre-populate sites by subject?",
      html: `<p>Would you like to specify how many sites each subject has?</p>
             <p style="font-size: 0.9em; color: #666; margin-top: 1rem;">
               <strong>Why this helps:</strong> This will pre-populate the specimen ID column in the template, 
               making it easier to enter site metadata. You'll have one row per site, already assigned to the correct subject.
             </p>`,
      showCancelButton: true,
      confirmButtonText: "Yes, specify counts",
      cancelButtonText: "Skip, download blank template",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    if (!provideCountsResponse.isConfirmed) {
      return {};
    }

    // Use the existing prompt for per-subject counts
    return promptCountByEntity({
      entityIds: subjectIds,
      title: "Sites per subject",
      promptText: "Enter how many sites each subject has:",
      inputIdPrefix: "subject-site-count",
      noEntitiesTitle: "No subjects found",
      noEntitiesMessage:
        "Add or import subjects first to pre-populate subject sites. A blank sites template will be downloaded.",
    });
  }
};

const promptSitesPerSample = async () => {
  const sampleIds = getExistingSamples().map((sample) => sample.id);

  // If no samples, show the no entities dialog
  if (sampleIds.length === 0) {
    const response = await Swal.fire({
      icon: "info",
      title: "No samples found",
      html: "Add or import samples first to pre-populate sample sites. A blank sites template will be downloaded.",
      showCancelButton: true,
      confirmButtonText: "Download blank template",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    return response.isConfirmed ? {} : null;
  }

  // Ask if all samples have the same number of sites
  const sameCountResponse = await Swal.fire({
    title: "Site Distribution",
    html: "Do all samples have the same number of sites?",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Yes, same number",
    denyButtonText: "No, different amounts",
    cancelButtonText: "Cancel",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });

  if (
    sameCountResponse.isDismissed ||
    (!sameCountResponse.isConfirmed && !sameCountResponse.isDenied)
  ) {
    // Cancel was clicked
    return null;
  }

  if (sameCountResponse.isConfirmed) {
    // All samples have the same number of sites - ask for a single number
    const countResponse = await Swal.fire({
      title: "Sites per sample",
      html: "Enter the number of sites each sample has:",
      input: "number",
      inputAttributes: {
        min: "0",
        step: "1",
      },
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 0) {
          return "Please enter a non-negative whole number.";
        }
      },
    });

    if (countResponse.isConfirmed) {
      const siteCount = Number(countResponse.value);
      // Create a map with the same count for all samples
      const countsBySample = {};
      for (const sampleId of sampleIds) {
        countsBySample[sampleId] = siteCount;
      }
      return countsBySample;
    } else {
      return null;
    }
  } else {
    // Different samples - ask if they want to provide per-sample counts
    const provideCountsResponse = await Swal.fire({
      title: "Pre-populate sites by sample?",
      html: `<p>Would you like to specify how many sites each sample has?</p>
             <p style="font-size: 0.9em; color: #666; margin-top: 1rem;">
               <strong>Why this helps:</strong> This will pre-populate the specimen ID column in the template, 
               making it easier to enter site metadata. You'll have one row per site, already assigned to the correct sample.
             </p>`,
      showCancelButton: true,
      confirmButtonText: "Yes, specify counts",
      cancelButtonText: "Skip, download blank template",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    if (!provideCountsResponse.isConfirmed) {
      return {};
    }

    // Use the existing prompt for per-sample counts
    return promptCountByEntity({
      entityIds: sampleIds,
      title: "Sites per sample",
      promptText: "Enter how many sites each sample has:",
      inputIdPrefix: "sample-site-count",
      noEntitiesTitle: "No samples found",
      noEntitiesMessage:
        "Add or import samples first to pre-populate sample sites. A blank sites template will be downloaded.",
    });
  }
};

export const handleDownloadTemplate = async (entityType, helperConfig) => {
  const config = entityConfigs[entityType];
  if (!config) {
    window.notyf.open({
      type: "error",
      message: `No template available for entity type: ${entityType}`,
    });
    return;
  }

  try {
    if (entityType === "samples") {
      const sampleCountsBySubject = await promptSamplesPerSubject();
      if (sampleCountsBySubject === null) {
        window.notyf.open({
          type: "info",
          message: "Template download cancelled",
        });
        return;
      }
      helperConfig.sampleCountsBySubject = sampleCountsBySubject;
    }

    if (entityType === "sites") {
      const selectedEntities = useGlobalStore.getState().selectedEntities || [];
      const hasSubjectSites = selectedEntities.includes("subjectSites");
      const hasSampleSites = selectedEntities.includes("sampleSites");

      if (hasSubjectSites) {
        const siteCountsBySubject = await promptSitesPerSubject();
        if (siteCountsBySubject === null) {
          window.notyf.open({
            type: "info",
            message: "Template download cancelled",
          });
          return;
        }
        helperConfig.siteCountsBySubject = siteCountsBySubject;
      }

      if (hasSampleSites) {
        const siteCountsBySample = await promptSitesPerSample();
        if (siteCountsBySample === null) {
          window.notyf.open({
            type: "info",
            message: "Template download cancelled",
          });
          return;
        }
        helperConfig.siteCountsBySample = siteCountsBySample;
      }
    }

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
        }

        const entitiesMap = {};
        const rowsWithoutId = [];
        const rowsWithInvalidPrefix = [];
        const rowsWithMissingFields = [];
        const rowsWithMissingParents = [];
        const derivativeSampleErrors = [];

        // For samples, pre-build a set of all sample IDs being imported to validate derivative samples
        let allSamplesBeingImported = new Set();
        if (entityType === "samples") {
          rawData.forEach((row) => {
            const hasData = Object.values(row).some((value) => String(value).trim() !== "");
            if (!hasData) return;

            const normalizedRow = normalizeRowIds(row);
            const transformedRow = transformRowKeys(normalizedRow);
            const entityId = String(transformedRow[idField] || "").trim();

            if (entityId && entityId.toLowerCase().startsWith(expectedPrefix)) {
              const normalizedEntityId = expectedPrefix + entityId.slice(expectedPrefix.length);
              allSamplesBeingImported.add(normalizedEntityId);
            }
          });
        }

        rawData.forEach((row, index) => {
          const rowNumber = index + 2;

          // Skip completely empty rows
          const hasData = Object.values(row).some((value) => String(value).trim() !== "");

          if (!hasData) return;

          // Normalize all ID fields in the row (sub-, sam-, site- prefixes)
          row = normalizeRowIds(row);

          // Transform row keys to snake_case (e.g., "subject id" -> "subject_id")
          row = transformRowKeys(row);

          let entityId = String(row[idField] || "").trim();

          // Rows with data must contain an ID
          if (!entityId) {
            rowsWithoutId.push(rowNumber);
            return;
          }

          // Validate ID prefix (case-sensitive after normalization)
          if (expectedPrefix && !entityId.startsWith(expectedPrefix)) {
            rowsWithInvalidPrefix.push({
              rowNumber,
              id: entityId,
            });
            return;
          }

          // Update the row with the normalized ID
          row[idField] = entityId;

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

          // Validate parent entities exist for samples and sites
          if (entityType === "samples") {
            const subjectIdRaw = String(row["subject_id"] || "").trim();
            const normalizedSubjectId = normalizeEntityId("sub-", subjectIdRaw);
            const existingSubjectIds = getExistingSubjects().map((s) => s.id);
            if (!existingSubjectIds.includes(normalizedSubjectId)) {
              rowsWithMissingParents.push({
                rowNumber,
                sampleId: entityId,
                issue: `subject_id "${normalizedSubjectId}" does not exist`,
              });
              return;
            }

            // Validate derivative samples if was_derived_from is specified
            const derivedFrom = row["was_derived_from"];
            if (derivedFrom && String(derivedFrom).trim()) {
              const derivedFromTrimmed = String(derivedFrom).trim();
              const allSubjectIds = new Set(getExistingSubjects().map((s) => s.id));

              // Check if was_derived_from is a sample
              if (derivedFromTrimmed.toLowerCase().startsWith("sam-")) {
                const derivedFromNormalized = normalizeEntityId("sam-", derivedFromTrimmed);

                // Check that the parent sample exists in this batch or was already imported
                if (!allSamplesBeingImported.has(derivedFromNormalized)) {
                  derivativeSampleErrors.push({
                    rowNumber,
                    sampleId: entityId,
                    error: `parent sample not found (${derivedFromNormalized}) - parent samples must be in the same import batch`,
                  });
                  return;
                }

                // Check that the parent sample belongs to the same subject
                const parentSample = entitiesMap[derivedFromNormalized];
                if (parentSample && parentSample.parentSubject !== normalizedSubjectId) {
                  derivativeSampleErrors.push({
                    rowNumber,
                    sampleId: entityId,
                    error: `parent sample (${derivedFromNormalized}) belongs to a different subject (${parentSample.parentSubject} instead of ${normalizedSubjectId})`,
                  });
                  return;
                }
              }
              // Check if was_derived_from is a subject
              else if (derivedFromTrimmed.toLowerCase().startsWith("sub-")) {
                const derivedFromNormalized = normalizeEntityId("sub-", derivedFromTrimmed);

                // Check that the subject exists
                if (!allSubjectIds.has(derivedFromNormalized)) {
                  derivativeSampleErrors.push({
                    rowNumber,
                    sampleId: entityId,
                    error: `parent subject not found (${derivedFromNormalized})`,
                  });
                  return;
                }

                // Check that the parent subject matches this sample's subject
                if (derivedFromNormalized !== normalizedSubjectId) {
                  derivativeSampleErrors.push({
                    rowNumber,
                    sampleId: entityId,
                    error: `parent subject (${derivedFromNormalized}) does not match the sample's subject (${normalizedSubjectId})`,
                  });
                  return;
                }
              } else {
                // was_derived_from must be either sam- or sub- prefixed
                derivativeSampleErrors.push({
                  rowNumber,
                  sampleId: entityId,
                  error: `was_derived_from value must start with either "sam-" or "sub-" (got: ${derivedFromTrimmed})`,
                });
                return;
              }
            }
          }

          if (entityType === "sites") {
            const specimenRaw = String(row["specimen_id"] || "").trim();
            const candidateSampleId = normalizeEntityId("sam-", specimenRaw);
            const candidateSubjectId = normalizeEntityId("sub-", specimenRaw);
            const existingSampleIds = getExistingSamples().map((s) => s.id);
            const existingSubjectIds = getExistingSubjects().map((s) => s.id);

            if (existingSampleIds.includes(candidateSampleId)) {
              // Site belongs to a sample - mark this for formatEntity
              row._parentType = "sample";
              row._parentId = candidateSampleId;
            } else if (existingSubjectIds.includes(candidateSubjectId)) {
              // Site belongs to a subject
              row._parentType = "subject";
              row._parentId = candidateSubjectId;
            } else {
              rowsWithMissingParents.push({
                rowNumber,
                siteId: entityId,
                missingParent: specimenRaw,
                issue: `specimen_id "${specimenRaw}" does not match any existing sample or subject`,
              });
              return;
            }
          }

          // Normalize the entity ID to the correct prefix and casing
          const normalizedEntityId = expectedPrefix + entityId.slice(expectedPrefix.length);

          // Format entity and store in map
          const entity = config.formatEntity(row, normalizedEntityId);
          entitiesMap[normalizedEntityId] = entity;
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

        if (rowsWithMissingParents.length > 0) {
          await swalListDisplayOnly(
            rowsWithMissingParents.map(
              ({ rowNumber, siteId, issue }) =>
                `Row ${rowNumber}${siteId ? ` (${siteId})` : ""}: ${issue}`
            ),
            `${capitalizedPluralEntityType} Metadata Import Failed`,
            `The following rows reference parent entities that do not exist:`,
            "Please add the parent subjects/samples to the dataset first and try again."
          );
          throw new Error(
            `${rowsWithMissingParents.length} row(s) reference parent entities that do not exist`
          );
        }

        if (derivativeSampleErrors.length > 0) {
          await swalListDisplayOnly(
            derivativeSampleErrors.map(
              ({ rowNumber, sampleId, error }) => `Row ${rowNumber} (${sampleId}): ${error}`
            ),
            `${capitalizedSingularEntityType} Derivative Sample Structure Failed`,
            `The following derivative samples have structural issues:`,
            "Please fix these issues in the spreadsheet and import again."
          );
          throw new Error(
            `${derivativeSampleErrors.length} derivative sample(s) have structural issues`
          );
        }

        // Validate field values against SDS requirements (entities already formatted in map)
        const entities = Object.values(entitiesMap);
        const validationErrors = validateFieldValues(entities, entityType, config);
        if (validationErrors.length > 0) {
          console.error(`Validation failed with ${validationErrors.length} error(s):`);
          validationErrors.forEach((err) => console.error("  -", err));
          await swalListDisplayOnly(
            validationErrors,
            `${capitalizedSingularEntityType} Metadata Validation Issues`,
            `The following validation issues were found:`,
            "Please fix these validation issues in the spreadsheet and import again."
          );

          throw new Error(`Validation failed with ${validationErrors.length} error(s)`);
        }

        resolve(entitiesMap);
      } catch (error) {
        reject(new Error(`${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Normalize all ID fields in a row (sub-, sam-, site- prefixes)
 */
const normalizeRowIds = (row) => {
  const normalized = { ...row };
  const idPrefixes = ["sub-", "sam-", "site-"];

  for (const [key, value] of Object.entries(normalized)) {
    if (typeof value === "string") {
      const valueTrimmed = value.trim();
      const valueLower = valueTrimmed.toLowerCase();

      // Check if this value starts with any of the ID prefixes
      for (const prefix of idPrefixes) {
        const prefixUpper = prefix.toUpperCase();
        if (valueLower.startsWith(prefix)) {
          // Already has correct prefix, just ensure it's lowercase
          normalized[key] = prefix + valueTrimmed.slice(prefix.length);
          break;
        } else if (valueTrimmed.toUpperCase().startsWith(prefixUpper)) {
          // Has uppercase prefix, normalize it
          normalized[key] = prefix + valueTrimmed.slice(prefixUpper.length);
          break;
        }
      }
    }
  }

  return normalized;
};

/**
 * Transform row keys from space-separated format (e.g., "subject id") to snake_case (e.g., "subject_id")
 * This ensures compatibility with the backend schema which expects snake_case keys
 */
const transformRowKeys = (row) => {
  const transformed = {};

  for (const [key, value] of Object.entries(row)) {
    // Convert spaces and hyphens to underscores, and normalize to lowercase
    const transformedKey = key.toLowerCase().trim().replace(/\s+/g, "_").replace(/-+/g, "_");

    transformed[transformedKey] = value;
  }

  return transformed;
};

/**
 * Convert all values in an object to strings
 * This ensures metadata is stored consistently as strings
 */
const convertMetadataToStrings = (metadata) => {
  const converted = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Convert all values to strings, handling null/undefined
    if (value === null || value === undefined) {
      converted[key] = "";
    } else {
      converted[key] = String(value);
    }
  }

  return converted;
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
 * Entity type configurations - using the three main entity types
 */
export const entityConfigs = {
  subjects: {
    idField: "subject_id",
    prefix: "sub-",
    requiredFields: ["subject_id", "species"],
    validationRules: [
      {
        field: "rrid_for_strain",
        rule: "string-is-valid-rrid",
        errorMessage:
          "Invalid strain RRID format. Use: RRID:rrid_identifier (e.g., RRID:IMSR_JAX:000664)",
      },
      {
        field: "protocol_url_or_doi",
        rule: "string-is-valid-url-or-doi",
        errorMessage:
          "Invalid format. URLs must begin with https://. Please enter a valid HTTPS URL, DOI, or DOI URL.",
      },
    ],
    formatEntity: (item, id) => ({
      id,
      type: "subject",
      metadata: convertMetadataToStrings({ ...item, subject_id: id }),
    }),
    saveEntity: (entity) => addSubject(entity.id, entity.metadata),
    formatDisplayId: (entity) => entity.id,
    templateFileName: "subjects.xlsx",
  },

  samples: {
    idField: "sample_id",
    prefix: "sam-",
    requiredFields: ["sample_id", "subject_id"],
    validationRules: [
      {
        field: "protocol_url_or_doi",
        rule: "string-is-valid-url-or-doi",
        errorMessage:
          "Invalid format. URLs must begin with https://. Please enter a valid HTTPS URL, DOI, or DOI URL.",
      },
    ],
    formatEntity: (item, id) => {
      // Normalize the subject ID using the imported function
      const subjectId = normalizeEntityId("sub-", item["subject_id"]);

      return {
        id,
        type: "sample",
        parentSubject: subjectId,
        metadata: convertMetadataToStrings({ ...item, sample_id: id, subject_id: subjectId }),
      };
    },
    saveEntity: (entity) => {
      const derivedFrom = entity.metadata?.was_derived_from;
      const parentSampleId =
        typeof derivedFrom === "string" && derivedFrom.trim().toLowerCase().startsWith("sam-")
          ? normalizeEntityId("sam-", derivedFrom)
          : null;

      addSample(entity.parentSubject, parentSampleId, entity.id, entity.metadata);
    },
    formatDisplayId: (entity) => `${entity.id}`,
    templateFileName: "samples.xlsx",
  },

  sites: {
    idField: "site_id",
    prefix: "site-",
    requiredFields: ["site_id", "specimen_id"],
    validationRules: [],
    formatEntity: (item, id) => {
      // Specimen ID should be either sub-xxx or sam-xxx
      const parentId = item._parentId;

      // Check if site belongs to a sample or subject
      if (item._parentType === "sample") {
        // Find the subject ID from the sample's parent
        const sample = getExistingSamples().find((s) => s.id === parentId);
        const subjectId = sample ? sample.parentSubject : parentId;

        return {
          id,
          type: "site",
          parentSubject: subjectId,
          parentSample: parentId,
          metadata: convertMetadataToStrings({ ...item, site_id: id, specimen_id: parentId }),
        };
      }

      // Default: site belongs to a subject
      return {
        id,
        type: "site",
        parentSubject: parentId,
        metadata: convertMetadataToStrings({ ...item, site_id: id, specimen_id: parentId }),
      };
    },
    saveEntity: (entity) => {
      if (entity.parentSample) {
        addSiteToSample(entity.parentSubject, entity.parentSample, entity.id, entity.metadata);
      } else {
        addSiteToSubject(entity.parentSubject, entity.id, entity.metadata);
      }
    },
    formatDisplayId: (entity) => entity.id,
    templateFileName: "sites.xlsx",
  },
};
