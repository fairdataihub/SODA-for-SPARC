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
import { performancesSlice } from "./slices/performancesSlice";
import { modalitiesSlice } from "./slices/modalitiesSlice";
import { datasetMetadataSlice } from "./slices/datasetMetadataSlice";
import { resourceMetadataSlice } from "./slices/resourceMetadataSlice";
import { checkboxCardSlice } from "./slices/checkboxCardSlice";

const useGlobalStore = create(
  immer((set, ...a) => ({
    ...guidedModeSlice(set, ...a),
    ...sideBarSlice(set, ...a),
    ...dropDownSlice(set, ...a),
    ...singleColumnTableSlice(set, ...a),
    ...backgroundServicesSlice(set, ...a),
    ...datasetEntitySelectorSlice(set, ...a),
    ...datasetTreeViewSlice(set, ...a),
    ...datasetContentSelectorSlice(set, ...a),
    ...datasetEntityStructureSlice(set, ...a),
    ...performancesSlice(set, ...a),
    ...modalitiesSlice(set, ...a),
    ...datasetMetadataSlice(set, ...a),
    ...resourceMetadataSlice(set, ...a),
    ...checkboxCardSlice(set, ...a),
  }))
);

export default useGlobalStore;
