import useGlobalStore from "../globalStore";
import { reRenderTreeView } from "./datasetTreeViewSlice";

export const fileExplorerStateSlice = (set) => ({
  fileExplorerState: {
    selectedFile: null,
    folderState: {}, // Stores open/closed state per folder path
    searchQuery: "",
  },
});

export const toggleFolder = (folderPath) => {
  useGlobalStore.setState((state) => {
    const current = state.fileExplorerState.folderState[folderPath]?.isOpen || false;
    return {
      fileExplorerState: {
        ...state.fileExplorerState,
        folderState: {
          ...state.fileExplorerState.folderState,
          [folderPath]: { isOpen: !current },
        },
      },
    };
  });
};

export const openFolder = (folderPath) => {
  useGlobalStore.setState((state) => ({
    fileExplorerState: {
      ...state.fileExplorerState,
      folderState: {
        ...state.fileExplorerState.folderState,
        [folderPath]: { isOpen: true },
      },
    },
  }));
  // ReRender the file explorer
  reRenderTreeView();
};

export const closeFolder = (folderPath) => {
  useGlobalStore.setState((state) => ({
    fileExplorerState: {
      ...state.fileExplorerState,
      folderState: {
        ...state.fileExplorerState.folderState,
        [folderPath]: { isOpen: false },
      },
    },
  }));
  // ReRender the file explorer
  reRenderTreeView();
};

export const isFolderOpen = (folderPath) => {
  if (folderPath === "data/" || folderPath == "data") {
    return true;
  }
  const { folderState } = useGlobalStore.getState().fileExplorerState;
  console.log(`${folderPath} is open ${folderState[folderPath]?.isOpen || false}`);
  return folderState[folderPath]?.isOpen || false;
};
