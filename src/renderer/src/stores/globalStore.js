import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropDownSlice } from "./slices/dropDownSlice";

const useGlobalStore = create(
  immer((...a) => ({
    ...guidedModeSlice(...a),
    ...sideBarSlice(...a),
    ...dropDownSlice(...a),
  }))
);

export default useGlobalStore;
