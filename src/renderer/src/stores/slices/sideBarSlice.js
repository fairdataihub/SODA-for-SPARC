import useGlobalStore from "../globalStore";

export const sideBarSlice = (set) => ({
  isSidebarOpen: true,
  activeTab: "guided_mode",
  guidedModeSidebarDatasetName: null,
  guidedModePageNavigationVisible: true,
  guidedModePageStructureObject: {},
});

export const setSidebarOpenState = (boolTrueOrFalse) => {
  useGlobalStore.setState((state) => ({
    ...state,
    isSidebarOpen: boolTrueOrFalse,
  }));
};

export const setActiveSidebarTab = (tabName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    activeTab: tabName,
  }));
};

export const setGuidedModeSidebarDatasetName = (datasetName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    guidedModeSidebarDatasetName: datasetName,
  }));
};

export const setGuidedModePageNavigationVisible = (isVisible) => {
  useGlobalStore.setState((state) => ({
    ...state,
    guidedModePageNavigationVisible: isVisible,
  }));
};

export const setGuidedModePageStructureObject = (structureObject) => {
  useGlobalStore.setState((state) => ({
    ...state,
    guidedModePageStructureObject: structureObject,
  }));
};
