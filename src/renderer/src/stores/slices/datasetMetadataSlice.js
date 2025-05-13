import useGlobalStore from "../globalStore";

export const initialState = {
  otherFundingConsortium: "",
  otherFundingAgency: "",
  awardNumber: "",
  submissionMilestones: [],
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

export const setAwardNumber = (awardNumber) => {
  useGlobalStore.setState({
    awardNumber,
  });
};

export const setSubmissionMilestones = (submissionMilestones) => {
  useGlobalStore.setState({
    submissionMilestones,
  });
};

export const setMilestones = (milestones) => {
  useGlobalStore.setState((state) => ({
    milestones,
  }));
};
