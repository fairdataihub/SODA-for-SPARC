import useGlobalStore from "../globalStore";
import { reRenderTreeView, traverseStructureByPath } from "./datasetTreeViewSlice";

// Zustand slice for file explorer state
export const fileExplorerStateSlice = (set) => ({
  fileExplorerState: {
    selectedFile: null,
    folderState: {}, // Stores open/closed state per folder path
    searchQuery: "",
  },
});

// Internal helper to update a folder's open state
const setFolderOpenState = (folderPath, isOpen) => {
  useGlobalStore.setState((state) => ({
    fileExplorerState: {
      ...state.fileExplorerState,
      folderState: {
        ...state.fileExplorerState.folderState,
        [folderPath]: { isOpen },
      },
    },
  }));
};

// Toggle a folder's open/closed state
export const toggleFolder = (folderPath) => {
  const current =
    useGlobalStore.getState().fileExplorerState.folderState[folderPath]?.isOpen || false;
  setFolderOpenState(folderPath, !current);
};

// Open a folder and re-render the tree view
export const openFolder = (folderPath) => {
  setFolderOpenState(folderPath, true);
  reRenderTreeView();
};

// Close a folder and re-render the tree view
export const closeFolder = (folderPath) => {
  setFolderOpenState(folderPath, false);
  reRenderTreeView();
};

// Reset all folders to closed, then open those at the current render path
export const resetOpenFoldersState = (pathToRender, datasetStructureJSONObj) => {
  const renderStructure = traverseStructureByPath(datasetStructureJSONObj, pathToRender);

  // Close all folders
  useGlobalStore.setState((state) => ({
    fileExplorerState: {
      ...state.fileExplorerState,
      folderState: {},
    },
  }));

  // Open folders that are at the first level of the renderStructure
  for (const folderName of Object.keys(renderStructure?.folders || {})) {
    setFolderOpenState(renderStructure.folders[folderName]?.relativePath, true);
  }
};

// Check if a folder is open, defaulting "data" to always open
export const isFolderOpen = (folderPath) => {
  if (folderPath === "data/" || folderPath === "data") return true;
  return useGlobalStore.getState().fileExplorerState.folderState[folderPath]?.isOpen || false;
};
