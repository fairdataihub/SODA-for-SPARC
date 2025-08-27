import useGlobalStore from "../globalStore";
import { produce } from "immer";
import { isFolderOpen } from "./fileExplorerStateSlice";
import { newEmptyFolderObj } from "../../scripts/utils/datasetStructure";
import { getFolderDetailsByRelativePath } from "../../scripts/utils/datasetStructure";

const initialState = {
  datasetStructureJSONObj: null,
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

export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});

const safeDeepCopy = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

const traverseStructureByPath = (structure, pathToRender) => {
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

  if (include.length === 0 && exclude.length === 0) return true;

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
  if (include.length === 0) return true;
  return isAssociatedWithFilters(include);
};

const pruneFolder = (folder, searchFilter, entityFilterConfig = null) => {
  if (!folder) return null;

  const search = searchFilter.toLowerCase();
  const folderMatches = folder.relativePath?.toLowerCase().includes(search);

  const matchingFiles = {};
  for (const [key, file] of Object.entries(folder.files || {})) {
    const matchesSearch = !search || file.relativePath?.toLowerCase().includes(search);

    if (entityFilterConfig?.active) {
      if (
        matchesSearch &&
        checkIfFilePassesEntityFilter(file.relativePath, entityFilterConfig.filters)
      ) {
        matchingFiles[key] = file;
      }
    } else if (matchesSearch) {
      matchingFiles[key] = file;
    }
  }

  const prunedSubfolders = {};
  for (const [key, subfolder] of Object.entries(folder.folders || {})) {
    const pruned = pruneFolder(subfolder, searchFilter, entityFilterConfig);
    if (pruned) prunedSubfolders[key] = pruned;
  }

  if (
    folderMatches ||
    Object.keys(matchingFiles).length > 0 ||
    Object.keys(prunedSubfolders).length > 0
  ) {
    return {
      ...folder,
      passThrough: !folderMatches && Object.keys(matchingFiles).length === 0,
      folders: prunedSubfolders,
      files: matchingFiles,
    };
  }

  return null;
};

export const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure;
  return pruneFolder(structure, searchFilter);
};

export const setDatasetStructureSearchFilter = (searchFilter) => {
  useGlobalStore.setState({
    datasetStructureSearchFilter: searchFilter || "",
    datasetRenderArrayIsLoading: false,
  });
  /*
  try {
    useGlobalStore.setState({
      datasetStructureSearchFilter: searchFilter || "",
      datasetRenderArrayIsLoading: true,
    });

    const { datasetStructureJSONObj, pathToRender, entityFilterActive, entityFilters } =
      useGlobalStore.getState();

    if (!datasetStructureJSONObj) {
      console.warn("Original structure is missing");
      return useGlobalStore.setState({
        datasetRenderArray: null,
        datasetRenderArrayIsLoading: false,
      });
    }

    let structureToFilter = traverseStructureByPath(datasetStructureJSONObj, pathToRender);
    if (!structureToFilter) {
      console.warn("Path to filter not found");
      return useGlobalStore.setState({
        datasetRenderArray: null,
        datasetRenderArrayIsLoading: false,
      });
    }

    structureToFilter = safeDeepCopy(structureToFilter);
    const entityFilterConfig = entityFilterActive ? { active: true, filters: entityFilters } : null;
    let filtered = pruneFolder(structureToFilter, searchFilter, entityFilterConfig);
    filtered = deleteEmptyFoldersFromStructure(filtered);

    useGlobalStore.setState({
      datasetRenderArray: filtered,
      datasetRenderArrayIsLoading: false,
    });
  } catch (error) {
    console.error("Error in setDatasetStructureSearchFilter:", error);
    useGlobalStore.setState({ datasetRenderArray: null, datasetRenderArrayIsLoading: false });
  }*/
};

export const externallySetSearchFilterValue = (value) => {
  useGlobalStore.setState({ externallySetSearchFilterValue: value || "" });
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

export const reRenderTreeView = () => {
  try {
    const pathToRender = useGlobalStore.getState().pathToRender || [];
    const datasetStructure = useGlobalStore.getState().datasetStructureJSONObj;
    const datasetStructureSearchFilter = useGlobalStore.getState().datasetStructureSearchFilter;
    if (!datasetStructure) return console.warn("Dataset structure missing");

    const updatedStructure = safeDeepCopy(datasetStructure);
    addRelativePaths(updatedStructure);

    // Natural sort helper
    const naturalSort = (a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

    const isFileSelected = (relativePath) => {
      const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
      if (!datasetEntityObj) return false;
      const activeEntity = useGlobalStore.getState().activeEntity;
      console.log("activeEntity", activeEntity);
      if (!entityType) return false;

      const activeEntityFiles =
        datasetEntityObj?.[activeEntity.entityType]?.[activeEntity.entityId] || {};
      return !!activeEntityFiles[relativePath];
    };
    const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
    function invertDatasetEntityObj(datasetEntityObj) {
      const inverted = {};
      for (const entityType in datasetEntityObj) {
        const entityGroup = datasetEntityObj[entityType];
        for (const entityName in entityGroup) {
          const fileMap = entityGroup[entityName];
          for (const fileRelativePath in fileMap) {
            if (fileMap[fileRelativePath]) {
              if (!inverted[fileRelativePath]) inverted[fileRelativePath] = [];
              inverted[fileRelativePath].push({ entityType, entityName });
            }
          }
        }
      }
      return inverted;
    }

    const invertedDatasetEntityObj = invertDatasetEntityObj(datasetEntityObj);

    console.log("Inverted Dataset Entity Object:", invertedDatasetEntityObj);
    const convertDatasetStructureToArray = (structure) => {
      const result = [];
      let itemIndex = 0;

      // Traverse to the folder specified by pathToRender
      let node = structure;
      for (const folderName of pathToRender) {
        node = node?.folders?.[folderName];
      }

      const traverse = (node, depth = 0) => {
        // Filter and sort folder names in one step
        const folderNames = Object.keys(node.folders || {}).sort(naturalSort);
        for (const folderName of folderNames) {
          const folder = node.folders[folderName];
          const relativePath = folder.relativePath;
          const folderMeetsSearchCriteria = relativePath
            .toLowerCase()
            .includes(datasetStructureSearchFilter.toLowerCase());

          const { childrenFileRelativePaths } = getFolderDetailsByRelativePath(relativePath);
          const childrenFilesMeetSearchCriteria = childrenFileRelativePaths.some((filePath) =>
            filePath.toLowerCase().includes(datasetStructureSearchFilter.toLowerCase())
          );
          if (!folderMeetsSearchCriteria && !childrenFilesMeetSearchCriteria) continue; // Break out if folder doesn't meet search criteria
          console.log("Children File Relative Paths:", childrenFileRelativePaths);

          result.push({
            itemType: "folder",
            folderName,
            relativePath,
            folderIsSelected: Math.random() < 0.5, // random true or false
            entitiesAssociatedWithFolder: ["sub-1", "sub-2"],
            itemIndent: depth,
            itemIndex: itemIndex++,
          });

          // Only add files if folder is open
          if (isFolderOpen(relativePath)) {
            console.log("Folder is open:", relativePath);
            console.log("Folder object:", folder);
            // ...existing getAssociatedEntities code...
            const fileNames = Object.keys(folder.files || {}).sort(naturalSort);
            console.log("File names:", fileNames);
            for (const fileName of fileNames) {
              const file = folder.files[fileName];
              const relativePath = file.relativePath;
              console.log("Processing file:", relativePath);

              if (!relativePath.toLowerCase().includes(datasetStructureSearchFilter.toLowerCase()))
                continue;
              result.push({
                itemType: "file",
                fileName,
                relativePath,
                fileIsSelected: Math.random() < 0.5, // random true or false
                entitiesAssociatedWithFile: ["sub-1"],
                itemIndent: depth + 1,
                itemIndex: itemIndex++,
              });
            }
            // Traverse subfolders if open
            traverse(folder, depth + 1);
          } else {
            console.log("Folder is closed:", relativePath);
          }
        }
        // Handle files in the root node if any
        if (depth === 0) {
          const rootFileNames = Object.keys(node.files || {}).sort(naturalSort);
          for (const fileName of rootFileNames) {
            const file = node.files[fileName];
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
    console.log("datasetRenderArray", datasetRenderArray);

    const renderStructure = traverseStructureByPath(updatedStructure, pathToRender);
    if (renderStructure) addRelativePaths(renderStructure, pathToRender);

    if (window.datasetStructureJSONObj) addRelativePaths(window.datasetStructureJSONObj, []);

    useGlobalStore.setState({
      datasetStructureJSONObj: updatedStructure,
      datasetRenderArray: datasetRenderArray,
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

    // You may need to fetch the folder object by relativePath if needed
    // Example: const folderObj = traverseStructureByPath(original, segments);
    // If you need to move the actual folder object, update this logic accordingly
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
  // First make sure the path exists in the window.datasetStructureJSONObj
  let currentStructure = window.datasetStructureJSONObj;
  for (const folderName of pathToRender) {
    if (!currentStructure?.["folders"]?.[folderName]) {
      console.log("Folder not found, creating:", folderName);
      currentStructure["folders"][folderName] = newEmptyFolderObj();
    }
    currentStructure = currentStructure["folders"][folderName];
  }
  useGlobalStore.setState({ pathToRender });
};

export const setAllowDatasetStructureEditing = (allow) => {
  useGlobalStore.setState({ allowDatasetStructureEditing: allow });
};
