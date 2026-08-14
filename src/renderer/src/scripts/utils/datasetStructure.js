import useGlobalStore from "../../stores/globalStore";
import { reRenderTreeView } from "../../stores/slices/datasetTreeViewSlice";
import {
  deleteEmptyFoldersFromStructure,
  getInvertedDatasetEntityObj,
  filePassesAllFilters,
} from "../../stores/slices/datasetTreeViewSlice";
import { modifyDatasetEntityForRelativeFilePath } from "../../stores/slices/datasetEntitySelectorSlice";
import { getEntitiesByEntityType } from "../../stores/slices/datasetEntityStructureSlice";

export const countFilesInDatasetStructure = (datasetStructure) => {
  // If datasetStructure is an array (datasetRenderArray), count file items
  if (Array.isArray(datasetStructure)) {
    return datasetStructure.filter((item) => item.itemType === "file").length;
  }

  // Otherwise, fallback to legacy recursive count
  if (!datasetStructure || typeof datasetStructure !== "object") return 0;

  let totalFiles = 0;

  if (datasetStructure.files && typeof datasetStructure.files === "object") {
    totalFiles += Object.keys(datasetStructure.files).length;
  }

  if (datasetStructure.folders && typeof datasetStructure.folders === "object") {
    for (const folder of Object.values(datasetStructure.folders)) {
      totalFiles += countFilesInDatasetStructure(folder);
    }
  }

  return totalFiles;
};

export const countFilesByDatasetStructureRelativePath = (relativePath) => {
  const { itemObject } = getFolderDetailsByRelativePath(relativePath);
  if (!itemObject) return 0;
  return countFilesInDatasetStructure(itemObject);
};

export const getFileTypesArrayInDatasetStructure = (datasetStructure) => {
  // Collect unique file extensions from a nested dataset structure and return them sorted.

  const fileTypes = new Set();

  const walk = (node) => {
    if (node.files) {
      for (const fileObj of Object.values(node.files)) {
        if (typeof fileObj.extension === "string") {
          fileTypes.add(fileObj.extension);
        }
      }
    }

    if (node.folders) {
      for (const folderObj of Object.values(node.folders)) {
        walk(folderObj);
      }
    }
  };

  walk(datasetStructure);

  return Array.from(fileTypes).sort((a, b) => a.localeCompare(b));
};

/**
 * Creates a new empty folder object with standard properties
 * @returns {Object} A new empty folder object
 */
export const newEmptyFolderObj = () => {
  return { folders: {}, files: {}, type: "virtual", action: ["new"], location: "local" };
};

export const countSelectedFilesByEntityType = (entityType) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  if (!datasetEntityObj?.[entityType]) return 0;

  // Count total files across all entities using the map structure
  let totalCount = 0;
  const allEntities = Object.values(datasetEntityObj[entityType] || {});

  allEntities.forEach((entityFiles) => {
    // Each entry in entityFiles is a file path, so this is already counting only files
    totalCount += Object.keys(entityFiles).length;
  });

  return totalCount;
};

/**
 * Gets an array of file paths that are attributed to specific entity type(s)
 * @param {string|Array<string>} entityType - The entity type(s) to get files for (e.g., "data-folders", ["subjects", "samples"])
 * @param {string} [entityName] - Optional specific entity name to get files for
 * @returns {Array} Array of file relative paths attributed to the entity type(s)/name
 */
export const getFilesByEntityType = (entityType, entityName = null) => {
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Handle both string and array inputs
  const entityTypes = Array.isArray(entityType) ? entityType : [entityType];
  let allFilePaths = [];

  entityTypes.forEach((type) => {
    if (!datasetEntityObj?.[type]) return;

    if (entityName) {
      // Get files for a specific entity within the type
      const entityFiles = datasetEntityObj[type][entityName] || {};
      const filePaths = Object.keys(entityFiles).filter((filePath) => entityFiles[filePath]);
      allFilePaths = allFilePaths.concat(filePaths);
    } else {
      // Get files for all entities of this type
      const allEntities = Object.values(datasetEntityObj[type] || {});
      allEntities.forEach((entityFiles) => {
        const filePaths = Object.keys(entityFiles).filter((filePath) => entityFiles[filePath]);
        allFilePaths = allFilePaths.concat(filePaths);
      });
    }
  });

  return allFilePaths;
};

const getNestedObjectAtPathArray = (pathArray) => {
  let current = window.datasetStructureJSONObj;
  for (const folder of pathArray) {
    if (!current || !current.folders || !current.folders[folder]) {
      return null;
    }
    current = current.folders[folder];
  }
  return current;
};

export const getFolderDetailsByRelativePath = (relativePath) => {
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const folderName = pathSegments.pop();
  const parentFolder = getNestedObjectAtPathArray(pathSegments);
  const folderObject = parentFolder?.folders?.[folderName];
  const datasetStructureSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
  const entityFilters = useGlobalStore.getState().entityFilters;
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Recursively collect all fileObj.relativePath values in this folder and subfolders as an array, filtered
  const collectFileRelativePathsRecursively = (folderObj) => {
    let result = [];
    if (folderObj?.files) {
      Object.values(folderObj.files).forEach((fileObj) => {
        if (
          fileObj.relativePath &&
          filePassesAllFilters({
            filePath: fileObj.relativePath,
            entityFilters,
            searchFilter: datasetStructureSearchFilter,
            datasetEntityObj,
          })
        ) {
          result.push(fileObj.relativePath);
        }
      });
    }
    if (folderObj?.folders) {
      Object.values(folderObj.folders).forEach((subfolderObj) => {
        result = result.concat(collectFileRelativePathsRecursively(subfolderObj));
      });
    }
    return result;
  };

  let childrenFileRelativePaths = [];
  if (folderObject) {
    childrenFileRelativePaths = collectFileRelativePathsRecursively(folderObject);
  }

  return {
    parentFolder,
    itemName: folderName,
    itemObject: folderObject,
    childrenFileRelativePaths,
  };
};

export const getFileDetailsByRelativePath = (relativePath) => {
  const pathSegments = relativePath.split("/").filter((segment) => segment !== "");
  const fileName = pathSegments.pop();
  const parentFolder = getNestedObjectAtPathArray(pathSegments);
  const fileObject = parentFolder?.files?.[fileName];
  return { parentFolder, itemName: fileName, itemObject: fileObject };
};

export const deleteFoldersByRelativePath = (arrayOfRelativePaths) => {
  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } =
      getFolderDetailsByRelativePath(relativePathToDelete);
    if (itemObject["location"] === "ps") {
      itemObject["action"].push("deleted");
    } else {
      delete parentFolder["folders"][itemName];
    }
  }
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const deleteFilesByRelativePath = (arrayOfRelativePaths) => {
  // Get the inverted entity object to find which entities each file belongs to
  const invertedDatasetEntityObj = getInvertedDatasetEntityObj();

  for (const relativePathToDelete of arrayOfRelativePaths) {
    const { parentFolder, itemName, itemObject } =
      getFileDetailsByRelativePath(relativePathToDelete);
    if (itemObject["location"] === "ps") {
      itemObject["action"].push("deleted");
    } else {
      delete parentFolder["files"][itemName];
    }

    // Remove from datasetEntityObj using existing utility functions
    const fileEntityMapping = invertedDatasetEntityObj[relativePathToDelete];
    if (fileEntityMapping) {
      Object.keys(fileEntityMapping).forEach((entityType) => {
        const entityNames = fileEntityMapping[entityType];
        entityNames.forEach((entityName) => {
          modifyDatasetEntityForRelativeFilePath(
            entityType,
            entityName,
            relativePathToDelete,
            "remove",
            false
          );
        });
      });
    }
  }
  useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
  reRenderTreeView();
};

export const moveFileToTargetLocation = (relativePathToMove, destionationRelativeFolderPath) => {
  const { parentFolder, itemName, itemObject } = getFileDetailsByRelativePath(relativePathToMove);

  // Check if the file exists before trying to move it
  if (!itemObject || !parentFolder || !parentFolder.files || !parentFolder.files[itemName]) {
    console.warn(`moveFileToTargetLocation: File not found, skipping: ${relativePathToMove}`);
    return;
  }

  const filePathSegments = relativePathToMove.split("/").filter(Boolean);
  const subfolders = filePathSegments.slice(1, -1);
  const destinationPathSegments = destionationRelativeFolderPath
    .split("/")
    .filter(Boolean)
    .concat(subfolders);

  let currentFolder = window.datasetStructureJSONObj;
  for (const segment of destinationPathSegments) {
    if (!currentFolder || !currentFolder.folders) {
      if (!currentFolder) {
        console.error("moveFileToTargetLocation: currentFolder is null/undefined");
        return;
      }
      currentFolder.folders = {};
    }
    if (!currentFolder.folders[segment]) {
      currentFolder.folders[segment] = newEmptyFolderObj();
    }
    currentFolder = currentFolder.folders[segment];
  }

  if (!currentFolder) {
    console.error("moveFileToTargetLocation: target folder is null after path traversal");
    return;
  }

  if (!currentFolder.files) {
    currentFolder.files = {};
  }

  currentFolder["files"][itemName] = itemObject;
  delete parentFolder["files"][itemName];
};

/**
 * Recursively moves files from a folder to a destination, stripping the source base path
 * Also checks if files are categorized in entity-associated-data-categorization and routes them accordingly
 * @param {Object} folderObj - The folder object to recursively process
 * @param {string} sourceBasePath - The base path to strip (e.g., "data/subjects/sub-1/")
 * @param {string} destinationPath - The destination path (e.g., "primary/sub-1/")
 * @param {Object} fileToSourceMap - (Optional) Object to track file moves: { newPath: { sourcePath, entity } }
 * @param {string} entityId - The entity ID to associate with moved files
 * @param {Object} categoryMapping - (Optional) Map of file paths to their categories (Source/Derivative)
 */
const moveFilesFromFolderRecursively = (
  folderObj,
  sourceBasePath,
  destinationPath,
  fileToSourceMap = null,
  entityId = null,
  categoryMapping = null
) => {
  if (folderObj?.files) {
    Object.values(folderObj.files).forEach((fileObj) => {
      if (fileObj.relativePath) {
        // Check if this file is categorized in entity-associated-data-categorization
        let finalDestination = destinationPath;

        if (categoryMapping && categoryMapping[fileObj.relativePath]) {
          // Route categorized files to source/subjectId/[sample]/[site]/ or derivative/subjectId/[sample]/[site]/
          const category = categoryMapping[fileObj.relativePath];
          // Extract the full hierarchical path from the destination (everything after "primary/")
          const hierarchicalPath = destinationPath.substring("primary/".length);
          finalDestination = `${category.toLowerCase()}/${hierarchicalPath}`;
        }

        // Get the nested path within the source folder by removing the base path
        const nestedPath = fileObj.relativePath.substring(sourceBasePath.length);
        // Construct the final destination path
        const finalDestinationPath = finalDestination + nestedPath;

        // Manually move the file to preserve only the nested structure
        const destinationSegments = finalDestinationPath.split("/").filter(Boolean);
        const fileName = destinationSegments.pop();

        let currentFolder = window.datasetStructureJSONObj;
        for (const segment of destinationSegments) {
          if (!currentFolder.folders[segment]) {
            currentFolder.folders[segment] = newEmptyFolderObj();
          }
          currentFolder = currentFolder.folders[segment];
        }

        if (!currentFolder.files) {
          currentFolder.files = {};
        }

        // Find source file and move it
        const { parentFolder: srcParent, itemName } = getFileDetailsByRelativePath(
          fileObj.relativePath
        );
        if (srcParent?.files?.[itemName]) {
          currentFolder.files[fileName] = srcParent.files[itemName];
          delete srcParent.files[itemName];

          // Track the path mapping if provided - use the file's original relativePath
          if (fileToSourceMap && entityId) {
            fileToSourceMap[finalDestinationPath] = {
              sourcePath: fileObj.relativePath,
              entity: entityId,
            };
          }
        }
      }
    });
  }

  if (folderObj?.folders) {
    Object.values(folderObj.folders).forEach((subFolder) => {
      moveFilesFromFolderRecursively(
        subFolder,
        sourceBasePath,
        destinationPath,
        fileToSourceMap,
        entityId,
        categoryMapping
      );
    });
  }
};

/**
 * Creates a standardized dataset structure where files are reorganized based on the dataset structuring method.
 * Also returns a mapping of which files came from which entity folders.
 *
 * For entity-association mode: Files are moved into Primary/Source/Derivative/Code/Docs/Protocol categories.
 * For entity-buckets mode: Files are reorganized into hierarchical entity structures (e.g., primary/sub-123/file.txt).
 *
 * @param {Object} datasetStructure - The original dataset structure (currently unused, kept for compatibility)
 * @param {Object} datasetEntityObj - Object containing entity-to-file mappings and categorizations
 * @returns {Object} An object containing:
 *   - structure: The reorganized dataset structure
 *   - fileToSourceMap: Object mapping new paths to mapping information
 *                  Each value is an object with:
 *                    - sourcePath: The original source base path (e.g., "data/subjects/sub-123/")
 *                    - entity: The entity ID extracted from the source path (e.g., "sub-123")
 *                  Example: {
 *                    "primary/sub-123/file.txt": {
 *                      sourcePath: "data/subjects/sub-123/",
 *                      entity: "sub-123"
 *                    }
 *                  }
 *
 * @example
 * const { structure, fileToSourceMap } = createStandardizedDatasetStructure(
 *   window.datasetStructureJSONObj,
 *   window.sodaJSONObj["dataset-entity-obj"]
 * );
 *
 * // Use the structure for rendering or backend operations
 * useGlobalStore.setState({ datasetStructureJSONObj: structure });
 *
 * // Use the path mapping to identify entity origins
 * for (const [newPath, mapping] of Object.entries(fileToSourceMap)) {
 *   console.log(`File ${newPath} came from entity ${mapping.entity} at ${mapping.sourcePath}`);
 * }
 */
export const createStandardizedDatasetStructure = () => {
  // --- Step 1: Preserve the original global structure ---
  let originalStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  // Remove any empty folders from the original structure
  originalStructure = deleteEmptyFoldersFromStructure(originalStructure);

  console.log("createStandardizedDatasetStructure - originalStructure:", originalStructure);

  // Initialize path mapping to track file moves
  const fileToSourceMap = {};

  const moveFilesByCategory = (categoryObj, destFolder) => {
    if (!categoryObj) return;

    Object.keys(categoryObj).forEach((file) => {
      moveFileToTargetLocation(file, destFolder);
    });
  };
  const datasetStructuringMethod = window.sodaJSONObj["dataset-structuring-method"];
  const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

  console.log("createStandardizedDatasetStructure - datasetEntityObj:", datasetEntityObj);
  try {
    if (datasetStructuringMethod === "entity-association") {
      // Move Code files into the code/ folder
      moveFilesByCategory(datasetEntityObj?.["non-data-folders"]?.["Code"], "code/");
      moveFilesByCategory(datasetEntityObj?.["non-data-folders"]?.["Docs"], "docs/");
      moveFilesByCategory(datasetEntityObj?.["non-data-folders"]?.["Protocol"], "protocol/");

      // Move Primary files into the primary/ folder
      // (Files that are marked as primary during the computational workflow)
      moveFilesByCategory(
        datasetEntityObj?.["experimental-data-categorization"]?.["Source"],
        "source/"
      );
      moveFilesByCategory(
        datasetEntityObj?.["experimental-data-categorization"]?.["Derivative"],
        "derivative/"
      );

      // Get list of files in data folder and move them to primary
      const getDataFolderFiles = () => {
        const dataFolder = window.datasetStructureJSONObj?.folders?.data;
        if (!dataFolder) return [];

        const collectFiles = (folderObj) => {
          let files = [];
          if (folderObj?.files) {
            Object.values(folderObj.files).forEach((fileObj) => {
              if (fileObj.relativePath) {
                files.push(fileObj.relativePath);
              }
            });
          }
          if (folderObj?.folders) {
            Object.values(folderObj.folders).forEach((subFolder) => {
              files = files.concat(collectFiles(subFolder));
            });
          }
          return files;
        };

        return collectFiles(dataFolder);
      };

      const dataFolderFiles = getDataFolderFiles();
      dataFolderFiles.forEach((filePath) => moveFileToTargetLocation(filePath, "primary/"));
    }

    if (datasetStructuringMethod === "entity-buckets") {
      // Build a mapping of file paths to their categories (Source/Derivative) for entity-associated-data-categorization
      const categoryMapping = {};
      const sourceFiles =
        datasetEntityObj?.["entity-associated-data-categorization"]?.["Source"] || {};
      const derivativeFiles =
        datasetEntityObj?.["entity-associated-data-categorization"]?.["Derivative"] || {};

      Object.keys(sourceFiles).forEach((filePath) => {
        categoryMapping[filePath] = "source";
      });
      Object.keys(derivativeFiles).forEach((filePath) => {
        categoryMapping[filePath] = "derivative";
      });

      const subjects = getEntitiesByEntityType("subjects", false);
      const samples = getEntitiesByEntityType("non-derived-samples", false);
      const derivedSamples = getEntitiesByEntityType("derived-samples", false);
      const sites = getEntitiesByEntityType("sites", false);

      // Step 1: Move all subject folders to primary
      for (const subject of subjects) {
        const subjectId = subject.id;
        const subjectFolderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["subjects"]?.folders?.[
            subjectId
          ];

        if (subjectFolderLocation) {
          // Move all files and folders from the subject folder to primary, preserving structure
          moveFilesFromFolderRecursively(
            subjectFolderLocation,
            `data/subjects/${subjectId}/`,
            `primary/${subjectId}/`,
            fileToSourceMap,
            subjectId,
            categoryMapping
          );
        }
      }

      // Step 2: Move all sample folders to their parent subject directories
      for (const sample of samples) {
        const sampleId = sample.id;
        const parentSubjectId = sample.parentSubject || sample.metadata?.subject_id;

        if (!parentSubjectId) {
          console.warn(`Sample ${sampleId} has no parent subject, skipping`);
          continue;
        }

        const sampleFolderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["non-derived-samples"]
            ?.folders?.[sampleId];
        if (sampleFolderLocation) {
          // Move all files and folders from the sample folder to primary, preserving structure
          moveFilesFromFolderRecursively(
            sampleFolderLocation,
            `data/non-derived-samples/${sampleId}/`,
            `primary/${parentSubjectId}/${sampleId}/`,
            fileToSourceMap,
            sampleId,
            categoryMapping
          );
        }
      }

      // Step 3: Move all derived-sample folders to their parent sample directories
      for (const derivedSample of derivedSamples) {
        const derivedSampleId = derivedSample.id;
        const parentSubjectId = derivedSample.parentSubject || derivedSample.metadata?.subject_id;
        const parentSampleId = derivedSample.metadata?.was_derived_from;

        if (!parentSubjectId || !parentSampleId) {
          console.warn(
            `Derived-sample ${derivedSampleId} has missing parent info (subject: ${parentSubjectId}, sample: ${parentSampleId}), skipping`
          );
          continue;
        }

        const derivedSampleFolderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["derived-samples"]?.folders?.[
            derivedSampleId
          ];
        if (derivedSampleFolderLocation) {
          // Move all files and folders from the derived-sample folder to primary, preserving structure
          moveFilesFromFolderRecursively(
            derivedSampleFolderLocation,
            `data/derived-samples/${derivedSampleId}/`,
            `primary/${parentSubjectId}/${parentSampleId}/${derivedSampleId}/`,
            fileToSourceMap,
            derivedSampleId,
            categoryMapping
          );
        }
      }

      // Step 4: Move all site folders to their appropriate hierarchical locations
      for (const site of sites) {
        const siteId = site.id;
        const parentSubjectId = site.parentSubject || site.metadata?.subject_id;
        const parentSampleId = site.parentSample || site.metadata?.sample_id;
        const parentDerivedSampleId = site.metadata?.derived_sample_id;

        if (!parentSubjectId) {
          console.warn(`Site ${siteId} has no parent subject, skipping`);
          continue;
        }

        const siteFolderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["sites"]?.folders?.[siteId];

        if (siteFolderLocation) {
          let baseDestinationPath;

          if (parentDerivedSampleId) {
            baseDestinationPath = `primary/${parentSubjectId}/${parentSampleId}/${parentDerivedSampleId}/${siteId}/`;
          } else if (parentSampleId) {
            baseDestinationPath = `primary/${parentSubjectId}/${parentSampleId}/${siteId}/`;
          } else {
            baseDestinationPath = `primary/${parentSubjectId}/${siteId}/`;
          }

          console.log(`Moving site ${siteId} to ${baseDestinationPath}`);

          // Move all files and folders from the site folder to primary, preserving structure
          moveFilesFromFolderRecursively(
            siteFolderLocation,
            `data/sites/${siteId}/`,
            baseDestinationPath,
            fileToSourceMap,
            siteId,
            categoryMapping
          );
        } else {
          console.warn(`Site folder not found for ${siteId} at data/sites/${siteId}/`);
        }
      }

      for (const folder of window.sodaJSONObj?.["non-data-folders"] || []) {
        const folderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["non-data-folders"]?.folders?.[
            folder
          ];

        if (folderLocation) {
          moveFilesFromFolderRecursively(
            folderLocation,
            `data/non-data-folders/${folder}/`,
            `${folder.toLowerCase()}/`,
            fileToSourceMap,
            folder,
            categoryMapping
          );
        }
      }
    }

    // Delete any empty folders in the dataset structure
    // (The window.datasetStructureJSONObj can be used since the move fns already update it)
    window.datasetStructureJSONObj = deleteEmptyFoldersFromStructure(
      window.datasetStructureJSONObj
    );

    // --- Step 6: Capture the modified structure before reverting changes ---
    const standardizedDatasetStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

    useGlobalStore.setState({ datasetStructureJSONObj: standardizedDatasetStructure });
    // --- Step 7: Revert any global changes to window.datasetStructureJSONObj ---
    window.datasetStructureJSONObj = originalStructure;

    // Return both the structure and the path mapping
    const result = {
      standardizedDatasetStructure,
      fileToSourceMap: fileToSourceMap,
    };
    console.log("createStandardizedDatasetStructure - returning:", result);
    return result;
  } catch (error) {
    console.error("Error while creating standardized dataset structure:", error);
    window.datasetStructureJSONObj = originalStructure;
    throw error;
  }
};

export const addImportedMetadataFilesToStructure = (datasetStructure) => {
  const entityAdditionMethod = window.sodaJSONObj?.["entity-addition-method"];
  if (entityAdditionMethod === "spreadsheet") {
    const importedMetadataFilePaths = window.sodaJSONObj?.["imported-metadata-file-paths"];
    if (importedMetadataFilePaths && typeof importedMetadataFilePaths === "object") {
      if (!datasetStructure.files) {
        datasetStructure.files = {};
      }
      for (const [metadataKey, filePath] of Object.entries(importedMetadataFilePaths)) {
        if (!filePath) continue;
        const fileName = `${metadataKey}.xlsx`;
        datasetStructure.files[fileName] = {
          action: ["new"],
          "additional-metadata": "",
          description: "",
          location: "local",
          path: filePath,
          relativePath: fileName,
        };
      }
    }
  }
};
