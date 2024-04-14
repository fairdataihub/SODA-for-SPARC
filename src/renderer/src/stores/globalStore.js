import { create } from "zustand";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";

const useGlobalStore = create((...a) => ({
  ...guidedModeSlice(...a),
  ...sideBarSlice(...a),
}));

export default useGlobalStore;
