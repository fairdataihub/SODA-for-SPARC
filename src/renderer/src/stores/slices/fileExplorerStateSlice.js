import useGlobalStore from "../globalStore";

export const fileExplorerStateSlice = (set) => ({
  fileExplorerState: {
    selectedFile: null,
    openFolders: new Set(),
    searchQuery: "",
  },
});

// Utility functions for openFolders
export const openFolder = (folderPath) => {
  useGlobalStore.setState((state) => {
    const openFolders = new Set(state.fileExplorerState.openFolders);
    openFolders.add(folderPath);
    return {
      fileExplorerState: {
        ...state.fileExplorerState,
        openFolders,
      },
    };
  });
};

export const closeFolder = (folderPath) => {
  useGlobalStore.setState((state) => {
    const openFolders = new Set(state.fileExplorerState.openFolders);
    openFolders.delete(folderPath);
    return {
      fileExplorerState: {
        ...state.fileExplorerState,
        openFolders,
      },
    };
  });
};

export const isFolderOpen = (folderPath) => {
  const openFolders = useGlobalStore.getState().fileExplorerState.openFolders;
  return openFolders.has(folderPath);
};
