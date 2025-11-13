import useGlobalStore from "../globalStore";

export const guidedModeProgressCardsSlice = (set) => ({
  guidedModeProgressCardsLoadingText: null,
  guidedModeProgressCardsDataArray: [],
});

export const setGuidedModeProgressCardsText = (loadingText) => {
  useGlobalStore.setState({
    guidedModeProgressCardsLoadingText: loadingText,
  });
};
export const setGuidedModeProgressCardsDataArray = (dataArray) => {
  useGlobalStore.setState({
    guidedModeProgressCardsDataArray: dataArray,
  });
};
