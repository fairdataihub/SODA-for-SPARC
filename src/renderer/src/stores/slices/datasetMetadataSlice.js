import useGlobalStore from "../globalStore";

export const initialState = {
  otherFundingConsortium: "",
  otherFundingAgency: "",
  awardNumber: "",
  submissionMilestones: [],
  completionDateChecked: false,
  milestoneDate: null,
};

export const datasetMetadataSlice = (set) => ({
  ...initialState,
});

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

export const toggleCompletionDateChecked = () => {
  useGlobalStore.setState((state) => ({
    completionDateChecked: !state.completionDateChecked,
  }));
};

export const setMilestoneDate = (date) => {
  useGlobalStore.setState({
    milestoneDate: date,
  });
};
