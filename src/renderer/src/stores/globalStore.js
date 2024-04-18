import { create } from "zustand";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropdownSelectSlice } from "./slices/dropdownSelectSlice";

const useGlobalStore = create((...a) => ({
  ...guidedModeSlice(...a),
  ...sideBarSlice(...a),
  ...dropdownSelectSlice(...a),
}));

export default useGlobalStore;
