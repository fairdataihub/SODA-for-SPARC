import useGlobalStore from "../globalStore";

export const sideBarSlice = (set) => ({
  isSidebarOpen: true,
  activeTab: "guided_mode",
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
