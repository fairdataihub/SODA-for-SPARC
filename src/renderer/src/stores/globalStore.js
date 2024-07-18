import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropDownSlice } from "./slices/dropDownSlice";
import { microscopyImageSlice } from "./slices/microscopyImageSlice";
import { authSlice } from "./slices/authSlice";
import { microscopyImageMetadataSlice } from "./slices/microscopyImageMetadataSlice";
import { bioLucidaSlice } from "./slices/bioLucidaSlice";
import { singleColumnTableSlice } from "./slices/tableRowSlice";
import { backgroundServicesSlice } from "./slices/backgroundServicesSlice";

const useGlobalStore = create(
  immer((...a) => ({
    ...guidedModeSlice(...a),
    ...sideBarSlice(...a),
    ...dropDownSlice(...a),
    ...microscopyImageSlice(...a),
    ...authSlice(...a),
    ...microscopyImageMetadataSlice(...a),
    ...bioLucidaSlice(...a),
    ...singleColumnTableSlice(...a),
    ...backgroundServicesSlice(...a),
  }))
);

export default useGlobalStore;
