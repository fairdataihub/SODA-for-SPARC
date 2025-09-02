import useGlobalStore from "../globalStore";
import { produce } from "immer";
import { isFolderOpen, resetOpenFoldersState } from "./fileExplorerStateSlice";
import { newEmptyFolderObj } from "../../scripts/utils/datasetStructure";
import { getFolderDetailsByRelativePath } from "../../scripts/utils/datasetStructure";

const initialState = {
  datasetStructureJSONObj: null,
  calculateEntities: false,
  datasetRenderArray: null,
  datasetRenderArrayIsLoading: false,
  datasetStructureSearchFilter: "",
  pathToRender: [],
  contextMenuIsOpened: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItemName: null,
  contextMenuItemType: null,
  contextMenuRelativePath: null,
  externallySetSearchFilterValue: "",
  entityFilterActive: false,
  entityFilters: { include: [], exclude: [] },
  datasetMetadataToPreview: null,
  activeFileExplorer: null,
  allowDatasetStructureEditing: false,
};

export const datasetTreeViewSlice = (set) => ({ ...initialState });

const safeDeepCopy = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

export const traverseStructureByPath = (structure, pathToRender) => {
  let ref = structure;
  for (const subFolder of pathToRender) {
    ref = ref?.folders?.[subFolder];
  }
  return ref;
};

export const setRenderDatasetStructureJSONObjIsLoading = (isLoading) => {
  useGlobalStore.setState({ datasetRenderArrayIsLoading: isLoading });
};

const checkIfFilePassesEntityFilter = (filePath, entityFilters) => {
  const { datasetEntityObj } = useGlobalStore.getState();
  if (!datasetEntityObj) return false;

  const { include, exclude } = entityFilters;
  if (!include.length && !exclude.length) return true;

  const isAssociatedWithFilters = (filters) => {
    for (const { type, names } of filters) {
      if (!type || !Array.isArray(names) || names.length === 0) continue;
      const entities = datasetEntityObj[type];
      if (!entities) continue;
      for (const name of names) {
        if (entities[name]?.[filePath]) return true;
      }
    }
    return false;
  };

  if (isAssociatedWithFilters(exclude)) return false;
  if (!include.length) return true;
  return isAssociatedWithFilters(include);
};

export const setDatasetStructureSearchFilter = (searchFilter) => {
  useGlobalStore.setState({
    datasetStructureSearchFilter: searchFilter || "",
    datasetRenderArrayIsLoading: false,
  });
};

export const externallySetSearchFilterValue = (value) => {
  useGlobalStore.setState({
    externallySetSearchFilterValue: value || "",
  });
};

export const addRelativePaths = (obj, currentPath = []) => {
  if (!obj) return;
  obj.relativePath = currentPath.join("/") + "/";

  for (const [folderName, folder] of Object.entries(obj.folders || {})) {
    folder.relativePath = [...currentPath, folderName].join("/") + "/";
    addRelativePaths(folder, [...currentPath, folderName]);
  }

  for (const [fileName, file] of Object.entries(obj.files || {})) {
    file.relativePath = [...currentPath, fileName].join("/");
  }
};

export const deleteEmptyFoldersFromStructure = (structure) => {
  if (!structure) return null;

  const cleanedFolders = {};
  for (const [name, folder] of Object.entries(structure.folders || {})) {
    const cleaned = deleteEmptyFoldersFromStructure(folder);
    if (cleaned) cleanedFolders[name] = cleaned;
  }

  const hasFiles = Object.keys(structure.files || {}).length > 0;
  const hasFolders = Object.keys(cleanedFolders).length > 0;

  return hasFiles || hasFolders
    ? { ...structure, folders: cleanedFolders, files: hasFiles ? structure.files : {} }
    : null;
};
export const getInvertedDatasetEntityObj = () => {
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
  const inverted = {};
  if (!datasetEntityObj) return inverted;
  for (const entityType in datasetEntityObj) {
    for (const entityName in datasetEntityObj[entityType]) {
      for (const fileRelativePath in datasetEntityObj[entityType][entityName]) {
        if (!datasetEntityObj[entityType][entityName][fileRelativePath]) continue;
        if (!inverted[fileRelativePath]) inverted[fileRelativePath] = {};
        if (!inverted[fileRelativePath][entityType])
          inverted[fileRelativePath][entityType] = new Set();
        inverted[fileRelativePath][entityType].add(entityName);
      }
    }
  }
  return inverted;
};

export const getFileEntitySet = (relativePath, entityType, invertedDatasetEntityObj) => {
  return invertedDatasetEntityObj[relativePath]?.[entityType];
};

export const isAssociatedWithFilters = (filters) => {
  for (const { type, names } of filters) {
    if (!type || !Array.isArray(names) || names.length === 0) continue;
    const entities = datasetEntityObj[type];
    if (!entities) continue;
    for (const name of names) {
      if (entities[name]?.[filePath]) return true;
    }
  }
  return false;
};

export const filePassesAllFilters = ({
  filePath,
  entityFilters,
  searchFilter,
  datasetEntityObj,
}) => {
  // Search filter logic first
  if (searchFilter) {
    if (!filePath.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
  }
  // Entity filter logic
  let passesEntityFilters = true;
  if (entityFilters) {
    const { include, exclude } = entityFilters;
    const isAssociatedWithFilters = (filters) => {
      for (const { type, names } of filters) {
        if (!type || !Array.isArray(names) || names.length === 0) continue;
        const entities = datasetEntityObj[type];
        if (!entities) continue;
        for (const name of names) {
          if (entities[name]?.[filePath]) return true;
        }
      }
      return false;
    };
    if (isAssociatedWithFilters(exclude)) passesEntityFilters = false;
    if (include.length > 0 && !isAssociatedWithFilters(include)) passesEntityFilters = false;
  }
  return passesEntityFilters;
};

export const reRenderTreeView = (resetOpenFolders = false) => {
  try {
    const pathToRender = useGlobalStore.getState().pathToRender;
    const datasetStructureJSONObj = useGlobalStore.getState().datasetStructureJSONObj;
    const datasetStructureSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
    const entityFilterActive = useGlobalStore.getState().entityFilterActive;
    const entityFilters = useGlobalStore.getState().entityFilters;
    const calculateEntities = useGlobalStore.getState().calculateEntities;
    const datasetMetadataToPreview = useGlobalStore.getState().datasetMetadataToPreview;
    const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

    const updatedStructure = safeDeepCopy(datasetStructureJSONObj);
    addRelativePaths(updatedStructure);

    if (resetOpenFolders) {
      resetOpenFoldersState(pathToRender, updatedStructure);
    }

    const naturalSort = (a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

    const invertedDatasetEntityObj = getInvertedDatasetEntityObj();

    const convertDatasetStructureToArray = (structure) => {
      const result = [];
      let itemIndex = 0;

      // Traverse to starting folder
      let node = structure;

      for (const folderName of pathToRender) node = node?.folders?.[folderName];

      const traverse = (node, depth = 0, allFolderChildrenAreSelected = false) => {
        const folderNames = Object.keys(node.folders || {}).sort(naturalSort);
        const { entityType, activeEntity } = useGlobalStore.getState();

        for (const folderName of folderNames) {
          const folder = node.folders[folderName];
          const relativePath = folder.relativePath;

          const { childrenFileRelativePaths } = calculateEntities
            ? getFolderDetailsByRelativePath(relativePath)
            : { childrenFileRelativePaths: [] };

          // Filter children based on entity filters
          const filteredChildrenFileRelativePaths = childrenFileRelativePaths.filter((filePath) =>
            filePassesAllFilters({
              filePath,
              entityFilters,
              searchFilter: datasetStructureSearchFilter,
              datasetEntityObj,
            })
          );

          // Skip folders that don't match search that have no matching children
          if (
            !relativePath.toLowerCase().includes(datasetStructureSearchFilter.toLowerCase()) &&
            filteredChildrenFileRelativePaths.length === 0
          ) {
            continue;
          }

          const allFilesSelected =
            allFolderChildrenAreSelected ||
            (filteredChildrenFileRelativePaths.length > 0 &&
              filteredChildrenFileRelativePaths.every((filePath) => {
                const entitySet = getFileEntitySet(filePath, entityType, invertedDatasetEntityObj);
                return entitySet && activeEntity ? entitySet.has(activeEntity) : false;
              }));

          // Skip folders that don't have matching files
          const childrenFilesMeetSearchCriteria = filteredChildrenFileRelativePaths.some(
            (filePath) =>
              filePath.toLowerCase().includes(datasetStructureSearchFilter.toLowerCase())
          );
          if (!childrenFilesMeetSearchCriteria && calculateEntities) {
            continue;
          }

          const folderEntityNames = new Set();
          filteredChildrenFileRelativePaths.forEach((filePath) => {
            const fileAssociations = invertedDatasetEntityObj[filePath];
            const entitySet = fileAssociations?.[entityType];
            if (entitySet) entitySet.forEach((entityName) => folderEntityNames.add(entityName));
          });

          result.push({
            itemType: "folder",
            folderName,
            relativePath,
            folderIsSelected: allFilesSelected,
            entitiesAssociatedWithFolder: Array.from(folderEntityNames),
            itemIndent: depth,
            itemIndex: itemIndex++,
          });

          if (isFolderOpen(relativePath)) {
            const fileNames = Object.keys(folder.files || {}).sort(naturalSort);
            for (const fileName of fileNames) {
              const file = folder.files[fileName];
              const relativePath = file.relativePath;

              if (
                !relativePath.toLowerCase().includes(datasetStructureSearchFilter.toLowerCase())
              ) {
                continue;
              }
              if (
                !filePassesAllFilters({
                  filePath: relativePath,
                  entityFilters,
                  searchFilter: datasetStructureSearchFilter,
                  datasetEntityObj,
                })
              ) {
                continue;
              }

              const entitySet = getFileEntitySet(
                relativePath,
                entityType,
                invertedDatasetEntityObj
              );
              const fileIsSelected =
                entitySet && activeEntity ? entitySet.has(activeEntity) : false;
              const entitiesAssociatedWithFile = entitySet ? Array.from(entitySet) : [];

              result.push({
                itemType: "file",
                fileName,
                relativePath,
                fileIsSelected,
                entitiesAssociatedWithFile,
                itemIndent: depth + 1,
                itemIndex: itemIndex++,
              });
            }
            traverse(folder, depth + 1, allFilesSelected);
          }
        }

        // Handle files at root level
        if (depth === 0) {
          const rootFileNames = Object.keys(node.files || {}).sort(naturalSort);
          for (const fileName of rootFileNames) {
            const file = node.files[fileName];
            if (
              !filePassesAllFilters({
                filePath: file.relativePath,
                entityFilters,
                searchFilter: datasetStructureSearchFilter,
                datasetEntityObj,
              })
            ) {
              continue;
            }
            result.push({
              itemType: "file",
              itemIndex: itemIndex++,
              itemIndent: depth + 1,
              fileName,
              content: file,
              ...file,
            });
          }
        }
      };

      traverse(node, 0);
      return result;
    };

    const datasetRenderArray = convertDatasetStructureToArray(updatedStructure);

    const renderStructure = traverseStructureByPath(updatedStructure, pathToRender);
    if (renderStructure) addRelativePaths(renderStructure, pathToRender);
    if (window.datasetStructureJSONObj) addRelativePaths(window.datasetStructureJSONObj, []);

    // Only iterate if datasetMetadataToPreview is a non-null array
    if (Array.isArray(datasetMetadataToPreview)) {
      const metadataKeyToFileNameMapping = {
        subjects: "subjects.xlsx",
        samples: "samples.xlsx",
        code_description: "code_description.xlsx",
        dataset_description: "dataset_description.xlsx",
        performances: "performances.xlsx",
        resources: "resources.xlsx",
        sites: "sites.xlsx",
        submission: "submission.xlsx",
        "README.md": "README.md",
        CHANGES: "CHANGES",
        LICENSE: "LICENSE",
        manifest_file: "manifest.xlsx",
      };
      let metadataItemIndex = datasetRenderArray.length;
      for (const metadataKey of datasetMetadataToPreview) {
        const fileName = metadataKeyToFileNameMapping[metadataKey] || metadataKey;
        datasetRenderArray.push({
          itemType: "metadataFile",
          fileName,
          relativePath: `metadata/${metadataKey}`,
          fileIsSelected: false,
          entitiesAssociatedWithFile: [],
          itemIndent: 0,
          itemIndex: metadataItemIndex++,
        });
      }
    }

    useGlobalStore.setState({
      datasetStructureJSONObj: updatedStructure,
      datasetRenderArray,
      datasetRenderArrayIsLoading: false,
    });
  } catch (error) {
    console.error("Error in reRenderTreeView:", error);
  }
};

export const openContextMenu = (pos, type, name, relativePath) => {
  useGlobalStore.setState({
    contextMenuIsOpened: true,
    contextMenuPosition: pos,
    contextMenuItemName: name,
    contextMenuItemType: type,
    contextMenuRelativePath: relativePath,
  });
};

export const closeContextMenu = () => {
  useGlobalStore.setState({ contextMenuIsOpened: false });
};

export const getFolderStructureJsonByPath = (path) => {
  try {
    const globalStore = useGlobalStore.getState();
    const pathArray = typeof path === "string" ? path.split("/").filter(Boolean) : path;
    let structure = globalStore.datasetStructureJSONObj;

    for (const folder of pathArray) {
      structure = structure?.folders?.[folder];
      if (!structure) throw new Error(`Folder "${folder}" does not exist`);
    }

    return safeDeepCopy(structure);
  } catch (error) {
    console.error("Error in getFolderStructureJsonByPath:", error);
    return { folders: {}, files: {} };
  }
};

export const setFolderMoveMode = (active) => {
  useGlobalStore.setState({ folderMoveModeIsActive: active });
};

export const moveFolderToNewLocation = (targetPath) => {
  try {
    const globalStore = useGlobalStore.getState();
    const { contextMenuItemName, contextMenuRelativePath } = globalStore;
    if (!contextMenuItemName || !contextMenuRelativePath)
      throw new Error("Invalid context menu data");

    const targetFolder = getFolderStructureJsonByPath(targetPath);
    if (!targetFolder) throw new Error(`Target folder "${targetPath}" not found`);

    const original = globalStore.datasetStructureJSONObj;
    const segments = contextMenuRelativePath.split("/").filter(Boolean);
    const parentFolder = traverseStructureByPath(original, segments.slice(0, -1));
    if (!parentFolder?.folders?.[contextMenuItemName])
      throw new Error(`Folder "${contextMenuItemName}" not found`);

    reRenderTreeView();
  } catch (error) {
    console.error("Error in moveFolderToNewLocation:", error);
  }
};

export const setEntityFilter = (include = [], exclude = []) => {
  const active = include.length > 0 || exclude.length > 0;
  useGlobalStore.setState({
    entityFilterActive: active,
    entityFilters: { include, exclude },
  });
};

export const clearEntityFilter = () => {
  useGlobalStore.setState({
    entityFilterActive: false,
    entityFilters: { include: [], exclude: [] },
  });
};

export const setDatasetMetadataToPreview = (metadataKeys) => {
  useGlobalStore.setState({ datasetMetadataToPreview: metadataKeys });
};

export const setActiveFileExplorer = (id) => {
  useGlobalStore.setState({ activeFileExplorer: id });
};

export const setPathToRender = (pathToRender) => {
  // Ensure the path exists in window.datasetStructureJSONObj
  let currentStructure = window.datasetStructureJSONObj;
  for (const folderName of pathToRender) {
    if (!currentStructure?.folders?.[folderName]) {
      currentStructure.folders[folderName] = newEmptyFolderObj();
    }
    currentStructure = currentStructure.folders[folderName];
  }
  useGlobalStore.setState({ pathToRender });
};

export const setAllowDatasetStructureEditing = (allow) => {
  useGlobalStore.setState({ allowDatasetStructureEditing: allow });
};
