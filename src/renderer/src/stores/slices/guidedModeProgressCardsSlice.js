import useGlobalStore from "../globalStore";

export const guidedModeProgressCardsSlice = (set) => ({
  guidedModeProgressCardsLoading: false,
  guidedModeProgressCardsDataArray: [],
});

export const setGuidedModeProgressCardsLoading = (isLoading) => {
  useGlobalStore.setState({
    guidedModeProgressCardsLoading: isLoading,
  });
};
export const setGuidedModeProgressCardsDataArray = (dataArray) => {
  useGlobalStore.setState({
    guidedModeProgressCardsDataArray: dataArray,
  });
};
