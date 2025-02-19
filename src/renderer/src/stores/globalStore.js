import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { guidedModeSlice } from "./slices/guidedModeSlice";
import { sideBarSlice } from "./slices/sideBarSlice";
import { dropDownSlice } from "./slices/dropDownSlice";
import { singleColumnTableSlice } from "./slices/tableRowSlice";
import { backgroundServicesSlice } from "./slices/backgroundServicesSlice";
import { datasetEntitySelectorSlice } from "./slices/datasetEntitySelectorSlice";
import { datasetTreeViewSlice } from "./slices/datasetTreeViewSlice";
import { datasetContentSelectorSlice } from "./slices/datasetContentSelectorSlice";
import { datasetEntityStructureSlice } from "./slices/datasetEntityStructureSlice";

const useGlobalStore = create(
  immer((...a) => ({
    ...guidedModeSlice(...a),
    ...sideBarSlice(...a),
    ...dropDownSlice(...a),
    ...singleColumnTableSlice(...a),
    ...backgroundServicesSlice(...a),
    ...datasetEntitySelectorSlice(...a),
    ...datasetTreeViewSlice(...a),
    ...datasetContentSelectorSlice(...a),
    ...datasetEntityStructureSlice(...a),
  }))
);

export default useGlobalStore;
