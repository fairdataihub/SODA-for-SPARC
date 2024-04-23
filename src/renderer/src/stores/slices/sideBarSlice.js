import { produce } from "immer";
export const sideBarSlice = (set) => ({
  isSidebarOpen: true,
});

export const setSidebarOpenState = (boolTrueOrFalse) => {
  useGlobalStore.setState(
    produce((state) => {
      state.isSidebarOpen = boolTrueOrFalse;
    })
  );
};
