import { create } from "zustand";

const useTestStore = create((set) => ({
  name: "",
  setName: (name) => set({ name }),

  subtitle: "",
  setSubtitle: (subtitle) => set({ subtitle }),

  reset: () => set({ name: "", subtitle: "" }),
}));

export default useTestStore;
