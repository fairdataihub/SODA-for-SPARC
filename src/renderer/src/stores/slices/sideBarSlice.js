import useGlobalStore from "../globalStore";

export const sideBarSlice = (set) => ({
  isSidebarOpen: true,
  activeTab: "guided_mode",
  guidedModeSidebarDatasetName: null,
  guidedModePageStructureObject: {},
  showGuidedModePageNavigation: true,
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

export const setGuidedModePageStructureObject = (structureObject) => {
  useGlobalStore.setState((state) => ({
    ...state,
    guidedModePageStructureObject: structureObject,
  }));
};

export const setShowGuidedModePageNavigation = (showNavigation) => {
  useGlobalStore.setState((state) => ({
    ...state,
    showGuidedModePageNavigation: showNavigation,
  }));
};

export const setOpenSidebarTab = (tabName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    openSidebarTab: tabName,
  }));
};
