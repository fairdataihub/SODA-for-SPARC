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
 * @param {Object} folderObj - The folder object to recursively process
 * @param {string} sourceBasePath - The base path to strip (e.g., "data/subjects/sub-1/")
 * @param {string} destinationPath - The destination path (e.g., "primary/sub-1/")
 */
const moveFilesFromFolderRecursively = (folderObj, sourceBasePath, destinationPath) => {
  if (folderObj?.files) {
    Object.values(folderObj.files).forEach((fileObj) => {
      if (fileObj.relativePath) {
        // Get the nested path within the source folder by removing the base path
        const nestedPath = fileObj.relativePath.substring(sourceBasePath.length);
        // Construct the final destination path
        const finalDestinationPath = destinationPath + nestedPath;

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
        }
      }
    });
  }

  if (folderObj?.folders) {
    Object.values(folderObj.folders).forEach((subFolder) => {
      moveFilesFromFolderRecursively(subFolder, sourceBasePath, destinationPath);
    });
  }
};

export const createStandardizedDatasetStructure = (datasetStructure, datasetEntityObj) => {
  console.log("createStandardizedDatasetStructure - Input dataset structure:", datasetStructure);
  console.log(
    "createStandardizedDatasetStructure - Input dataset entity object:",
    datasetEntityObj
  );

  // --- Step 1: Preserve the original global structure ---
  let originalStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  // Remove any empty folders from the original structure
  originalStructure = deleteEmptyFoldersFromStructure(originalStructure);

  const moveFilesByCategory = (categoryObj, destFolder) => {
    if (!categoryObj) return;

    Object.keys(categoryObj).forEach((file) => {
      moveFileToTargetLocation(file, destFolder);
    });
  };
  const datasetStructuringMethod = window.sodaJSONObj["dataset-structuring-method"];
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
      console.log(
        "createStandardizedDatasetStructure - Entity Buckets structuring method selected"
      );
      const subjects = getEntitiesByEntityType("subjects", false);
      const samples = getEntitiesByEntityType("non-derived-samples", false);
      const derivedSamples = getEntitiesByEntityType("derived-samples", false);
      const sites = getEntitiesByEntityType("sites", false);

      console.log(
        "createStandardizedDatasetStructure - Subjects:",
        JSON.stringify(subjects, null, 2)
      );
      console.log(
        "createStandardizedDatasetStructure - Samples:",
        JSON.stringify(samples, null, 2)
      );
      console.log(
        "createStandardizedDatasetStructure - Derived Samples:",
        JSON.stringify(derivedSamples, null, 2)
      );
      console.log("createStandardizedDatasetStructure - Sites:", JSON.stringify(sites, null, 2));

      // Helper function to determine if a file is categorized as Source or Derivative
      const getFileCategorySubfolder = (filePath) => {
        console.log("getFileCategorySubfolder - Checking file:", filePath);
        const sourceFiles = datasetEntityObj?.["experimental-data-categorization"]?.["Source"];
        console.log("getFileCategorySubfolder - Source files:", sourceFiles);
        const derivativeFiles =
          datasetEntityObj?.["experimental-data-categorization"]?.["Derivative"];

        if (sourceFiles && sourceFiles[filePath]) {
          return "source/";
        }
        if (derivativeFiles && derivativeFiles[filePath]) {
          return "derivative/";
        }
        return ""; // Default to root of entity folder
      };

      // Step 1: Move all subject folders to primary
      for (const subject of subjects) {
        console.log("Iterating over subject:", subject);
        const subjectId = subject.id;
        const subjectFolderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["subjects"]?.folders?.[
            subjectId
          ];

        if (subjectFolderLocation) {
          console.log(
            `createStandardizedDatasetStructure - Moving subject ${subjectId} files to Primary`
          );

          // Move each file, checking for source/derivative categorization
          const moveSubjectFilesRecursively = (folderObj, currentBasePath) => {
            if (folderObj?.files) {
              Object.values(folderObj.files).forEach((fileObj) => {
                if (fileObj.relativePath) {
                  const categorySubfolder = getFileCategorySubfolder(fileObj.relativePath);
                  moveFileToTargetLocation(
                    fileObj.relativePath,
                    `Primary/${subjectId}/${categorySubfolder}`
                  );
                }
              });
            }
            if (folderObj?.folders) {
              Object.values(folderObj.folders).forEach((subFolder) => {
                moveSubjectFilesRecursively(subFolder, currentBasePath);
              });
            }
          };

          moveSubjectFilesRecursively(subjectFolderLocation, `data/subjects/${subjectId}/`);
        }
      }

      // Step 2: Move all sample folders to their parent subject directories
      for (const sample of samples) {
        console.log("Iterating over sample:", sample);
        const sampleId = sample.id;
        const parentSubjectId = sample.parentSubject || sample.metadata?.subject_id;

        if (!parentSubjectId) {
          console.warn(`Sample ${sampleId} has no parent subject, skipping`);
          continue;
        }

        const sampleFolderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["samples"]?.folders?.[sampleId];
        if (sampleFolderLocation) {
          console.log(
            `createStandardizedDatasetStructure - Moving sample ${sampleId} files to Primary`
          );

          const moveSampleFilesRecursively = (folderObj) => {
            if (folderObj?.files) {
              Object.values(folderObj.files).forEach((fileObj) => {
                if (fileObj.relativePath) {
                  const categorySubfolder = getFileCategorySubfolder(fileObj.relativePath);
                  moveFileToTargetLocation(
                    fileObj.relativePath,
                    `Primary/${parentSubjectId}/${sampleId}/${categorySubfolder}`
                  );
                }
              });
            }
            if (folderObj?.folders) {
              Object.values(folderObj.folders).forEach((subFolder) => {
                moveSampleFilesRecursively(subFolder);
              });
            }
          };

          moveSampleFilesRecursively(sampleFolderLocation);
        }
      }

      // Step 3: Move all derived-sample folders to their parent sample directories
      for (const derivedSample of derivedSamples) {
        console.log("Iterating over derived-sample:", derivedSample);
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
          console.log(
            `createStandardizedDatasetStructure - Moving derived-sample ${derivedSampleId} files to Primary`
          );

          const moveDerivedSampleFilesRecursively = (folderObj) => {
            if (folderObj?.files) {
              Object.values(folderObj.files).forEach((fileObj) => {
                if (fileObj.relativePath) {
                  const categorySubfolder = getFileCategorySubfolder(fileObj.relativePath);
                  moveFileToTargetLocation(
                    fileObj.relativePath,
                    `Primary/${parentSubjectId}/${parentSampleId}/${derivedSampleId}/${categorySubfolder}`
                  );
                }
              });
            }
            if (folderObj?.folders) {
              Object.values(folderObj.folders).forEach((subFolder) => {
                moveDerivedSampleFilesRecursively(subFolder);
              });
            }
          };

          moveDerivedSampleFilesRecursively(derivedSampleFolderLocation);
        }
      }

      // Step 4: Move all site folders to their appropriate hierarchical locations
      for (const site of sites) {
        console.log("Iterating over site:", site);
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
            baseDestinationPath = `Primary/${parentSubjectId}/${parentSampleId}/${parentDerivedSampleId}/${siteId}/`;
            console.log(
              `createStandardizedDatasetStructure - Moving site ${siteId} under derived-sample to Primary`
            );
          } else if (parentSampleId) {
            baseDestinationPath = `Primary/${parentSubjectId}/${parentSampleId}/${siteId}/`;
            console.log(
              `createStandardizedDatasetStructure - Moving site ${siteId} under sample to Primary`
            );
          } else {
            baseDestinationPath = `Primary/${parentSubjectId}/${siteId}/`;
            console.log(
              `createStandardizedDatasetStructure - Moving site ${siteId} under subject to Primary`
            );
          }

          const moveSiteFilesRecursively = (folderObj) => {
            if (folderObj?.files) {
              Object.values(folderObj.files).forEach((fileObj) => {
                if (fileObj.relativePath) {
                  const categorySubfolder = getFileCategorySubfolder(fileObj.relativePath);
                  moveFileToTargetLocation(
                    fileObj.relativePath,
                    baseDestinationPath + categorySubfolder
                  );
                }
              });
            }
            if (folderObj?.folders) {
              Object.values(folderObj.folders).forEach((subFolder) => {
                moveSiteFilesRecursively(subFolder);
              });
            }
          };

          moveSiteFilesRecursively(siteFolderLocation);
        }
      }

      for (const folder of window.sodaJSONObj?.["non-data-folders"] || []) {
        console.log(
          `createStandardizedDatasetStructure - Moving non-data folder ${folder} to root`
        );
        const folderLocation =
          window.datasetStructureJSONObj?.folders?.data?.folders?.["non-data-folders"]?.folders?.[
            folder
          ];
        const folderLocationRelativePath = folderLocation?.relativePath;
        console.log(
          `createStandardizedDatasetStructure - Non-data folder ${folder} relative path: ${folderLocationRelativePath}`
        );
        if (folderLocation) {
          moveFilesFromFolderRecursively(folderLocation, `data/${folder}/`, `${folder}/`);
        }
      }
    }

    // Delete any empty folders in the dataset structure
    // (The window.datasetStructureJSONObj can be used since the move fns already update it)
    window.datasetStructureJSONObj = deleteEmptyFoldersFromStructure(
      window.datasetStructureJSONObj
    );

    // --- Step 6: Capture the modified structure before reverting changes ---
    const standardizedStructure = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

    useGlobalStore.setState({ datasetStructureJSONObj: standardizedStructure });
    // --- Step 7: Revert any global changes to window.datasetStructureJSONObj ---
    window.datasetStructureJSONObj = originalStructure;

    console.log(
      "createStandardizedDatasetStructure - Return standardized dataset structure:",
      standardizedStructure
    );
    return standardizedStructure;
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
