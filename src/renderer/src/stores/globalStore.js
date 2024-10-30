import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropDownSlice } from "./slices/dropDownSlice";
import { singleColumnTableSlice } from "./slices/tableRowSlice";
import { backgroundServicesSlice } from "./slices/backgroundServicesSlice";
import { manifestEntitySelectorSlice } from "./slices/manifestEntitySelectorSlice";
import { datasetTreeViewSlice } from "./slices/datasetTreeViewSlice";

const useGlobalStore = create(
  immer((...a) => ({
    ...guidedModeSlice(...a),
    ...sideBarSlice(...a),
    ...dropDownSlice(...a),
    ...singleColumnTableSlice(...a),
    ...backgroundServicesSlice(...a),
    ...manifestEntitySelectorSlice(...a),
    ...datasetTreeViewSlice(...a),
  }))
);

export default useGlobalStore;
