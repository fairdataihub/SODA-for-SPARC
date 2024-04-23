import { create } from "zustand";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropDownSlice } from "./slices/dropDownSlice";

const useGlobalStore = create((...a) => ({
  ...guidedModeSlice(...a),
  ...sideBarSlice(...a),
  ...dropDownSlice(...a),
}));

export default useGlobalStore;
