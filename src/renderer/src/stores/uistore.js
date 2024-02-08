import { create } from "zustand";

const uiStore = create((set) => ({
  isSidebarOpen: true,
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen: isSidebarOpen }),
}));

export default uiStore;
