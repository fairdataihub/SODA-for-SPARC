import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropDownSlice } from "./slices/dropDownSlice";
import { microscopyImageSlice } from "./slices/microscopyImageSlice";
import { authSlice } from "./slices/authSlice";

const useGlobalStore = create(
  immer((...a) => ({
    ...guidedModeSlice(...a),
    ...sideBarSlice(...a),
    ...dropDownSlice(...a),
    ...microscopyImageSlice(...a),
    ...authSlice(...a),
  }))
);

export default useGlobalStore;
