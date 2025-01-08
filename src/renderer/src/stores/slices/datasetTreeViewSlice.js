import { produce } from "immer";
import useGlobalStore from "../globalStore";

// Initial state for managing dataset structure and filters
const initialState = {
  datasetStructureJSONObj: null,
  renderDatasetStructureJSONObj: null,
  datasetStructureSearchFilter: "",
  pathToRender: [],
  contextMenuIsOpened: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItemType: null,
  contextMenuData: null,
  folderMoveMode: false,
  folderMoveData: null,
};

// Dataset tree view slice
export const datasetTreeViewSlice = (set) => ({
  ...initialState,
});

// Helper function to traverse dataset structure by path
const traverseStructureByPath = (structure, pathToRender) => {
  return pathToRender.reduce((current, subFolder) => current?.folders?.[subFolder], structure);
};

// Search filter matching logic
const folderObjMatchesSearch = (folderObj, searchFilter) => {
  if (!searchFilter)
    return { matchesDirectly: true, matchesFilesDirectly: true, passThrough: false };

  const lowerSearch = searchFilter.toLowerCase();
  const folderRelativePath = folderObj.relativePath.toLowerCase();
  const matchesDirectly = folderRelativePath.includes(lowerSearch);

  const matchesFilesDirectly = Object.values(folderObj.files || {}).some((file) =>
    file.relativePath.toLowerCase().includes(lowerSearch)
  );

  const passThrough = Object.values(folderObj.folders || {}).some((subFolder) => {
    const result = folderObjMatchesSearch(subFolder, searchFilter);
    return result.matchesDirectly || result.matchesFilesDirectly || result.passThrough;
  });

  return { matchesDirectly, matchesFilesDirectly, passThrough };
};

// Filter structure using Immer
const filterStructure = (structure, searchFilter) => {
  if (!searchFilter) return structure;

  const pruneStructure = (folderObj) => {
    const { matchesDirectly, matchesFilesDirectly, passThrough } = folderObjMatchesSearch(
      folderObj,
      searchFilter
    );

    if (!matchesDirectly && !matchesFilesDirectly && !passThrough) return null;

    return produce(folderObj, (draft) => {
      draft.matchesDirectly = matchesDirectly;
      draft.matchesFilesDirectly = matchesFilesDirectly;
      draft.passThrough = passThrough;

      for (const subFolder in draft.folders || {}) {
        if (!pruneStructure(draft.folders[subFolder])) {
          delete draft.folders[subFolder];
        }
      }

      for (const fileName in draft.files || {}) {
        if (!draft.files[fileName].relativePath.toLowerCase().includes(searchFilter)) {
          delete draft.files[fileName];
        }
      }
    });
  };

  return pruneStructure(structure);
};

// Update dataset search filter
export const setDatasetStructureSearchFilter = (searchFilter) => {
  const globalStore = useGlobalStore.getState();

  const filteredStructure = produce(globalStore.datasetStructureJSONObj, (draft) => {
    const structureToFilter = traverseStructureByPath(draft, globalStore.pathToRender);
    return filterStructure(structureToFilter, searchFilter);
  });

  useGlobalStore.setState((state) =>
    produce(state, (draft) => {
      draft.datasetStructureSearchFilter = searchFilter;
      draft.renderDatasetStructureJSONObj = filteredStructure;
    })
  );
};

// Set dataset structure and prepare path rendering
export const setTreeViewDatasetStructure = (datasetStructure, pathToRender) => {
  const addRelativePaths = (obj, currentPath = []) => {
    for (const folderName in obj?.folders || {}) {
      obj.folders[folderName].relativePath = [...currentPath, folderName].join("/") + "/";
      addRelativePaths(obj.folders[folderName], [...currentPath, folderName]);
    }

    for (const fileName in obj?.files || {}) {
      obj.files[fileName].relativePath = [...currentPath, fileName].join("/");
    }
  };

  useGlobalStore.setState(
    produce((draft) => {
      draft.datasetStructureJSONObj = datasetStructure;
      draft.pathToRender = pathToRender;
      addRelativePaths(draft.datasetStructureJSONObj);
      const renderStructureRef = traverseStructureByPath(
        draft.datasetStructureJSONObj,
        pathToRender
      );
      addRelativePaths(renderStructureRef, pathToRender);
      draft.renderDatasetStructureJSONObj = renderStructureRef;
      draft.datasetStructureSearchFilter = "";
    })
  );
};

// Context menu actions
export const openContextMenu = (itemPosition, itemType, itemName, itemContent) => {
  useGlobalStore.setState(
    produce((draft) => {
      draft.contextMenuIsOpened = true;
      draft.contextMenuPosition = itemPosition;
      draft.contextMenuItemType = itemType;
      draft.contextMenuItemName = itemName;
      draft.contextMenuItemData = itemContent;
    })
  );
};

export const closeContextMenu = () => {
  useGlobalStore.setState(
    produce((draft) => {
      draft.contextMenuIsOpened = false;
      draft.contextMenuPosition = { x: 0, y: 0 };
      draft.contextMenuItemType = null;
      draft.contextMenuItemName = null;
      draft.contextMenuData = null;
    })
  );
};

// Get folder structure by path
export const getFolderStructureJsonByPath = (path) => {
  if (typeof path === "string") path = path.split("/").filter(Boolean);
  if (!Array.isArray(path)) throw new Error("Path must be a string or an array");

  return path.reduce((current, folder) => {
    if (!current?.folders?.[folder]) throw new Error(`Folder "${folder}" does not exist`);
    return current.folders[folder];
  }, useGlobalStore.getState().datasetStructureJSONObj);
};

// Get file structure by path
export const getFileStructureJsonByPath = (path) => {
  if (typeof path === "string") path = path.split("/").filter(Boolean);
  if (!Array.isArray(path)) throw new Error("Path must be a string or an array");

  const fileName = path.pop();
  const folderStructure = getFolderStructureJsonByPath(path);
  return folderStructure.files?.[fileName];
};

// Delete files by relative paths
export const deleteFilesByRelativePath = (relativePaths) => {
  useGlobalStore.setState(
    produce((draft) => {
      relativePaths.forEach((relativePath) => {
        const pathSegments = relativePath.split("/").filter(Boolean);
        const fileName = pathSegments.pop();
        const folderJson = traverseStructureByPath(draft.datasetStructureJSONObj, pathSegments);
        if (folderJson?.files?.[fileName]) delete folderJson.files[fileName];
      });
    })
  );
};

// Folder move operations
export const setFolderMoveMode = (moveMode) => {
  useGlobalStore.setState(
    produce((draft) => {
      draft.folderMoveMode = moveMode;
    })
  );
};

export const setFolderDataToMoveToNewLocation = (folderMoveData) => {
  useGlobalStore.setState(
    produce((draft) => {
      draft.folderMoveData = folderMoveData;
    })
  );
};

export const moveFolderToNewLocation = (
  relativeFolderPathToMoveTarget,
  relativePathOfDataToMove
) => {
  useGlobalStore.setState(
    produce((draft) => {
      const folderToMove = getFolderStructureJsonByPath(relativePathOfDataToMove);
      const folderToMoveParent = getFolderStructureJsonByPath(
        relativePathOfDataToMove.split("/").slice(0, -1)
      );
      const targetFolder = getFolderStructureJsonByPath(relativeFolderPathToMoveTarget);

      targetFolder.folders[folderToMove.name] = folderToMove;
      delete folderToMoveParent.folders[folderToMove.name];
    })
  );
};
