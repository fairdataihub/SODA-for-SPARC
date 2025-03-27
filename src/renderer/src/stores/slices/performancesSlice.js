import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const performancesSlice = (set) => ({
  IsPerformanceFormVisible: false,
});

export const setPerformanceFormVisible = (IsPerformanceFormVisible) => {
  useGlobalStore.setState(
    produce((state) => {
      state.IsPerformanceFormVisible = IsPerformanceFormVisible;
    })
  );
};
