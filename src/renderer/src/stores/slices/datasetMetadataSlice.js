import useGlobalStore from "../globalStore";

export const initialState = {
  otherFundingConsortium: "",
  otherFundingAgency: "",
};

export const datasetMetadataSlice = (set) => ({
  ...initialState,
});

export const setOtherFundingConsortium = (otherFundingConsortium) => {
  useGlobalStore.setState({
    otherFundingConsortium,
  });
};

export const setOtherFundingAgency = (otherFundingAgency) => {
  useGlobalStore.setState({
    otherFundingAgency,
  });
};
