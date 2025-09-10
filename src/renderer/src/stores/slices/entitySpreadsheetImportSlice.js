import useGlobalStore from "../globalStore";

const initialState = {
  entityImportCompletionStatus: {
    entityIds: false,
    subjectsMetadata: false,
    samplesMetadata: false,
    sitesMetadata: false,
  },
};

export const entitySpreadsheetImportSlice = (set) => ({
  ...initialState,
});

// Set completion for a specific step
export const setEntityImportStepCompleted = (stepKey, completed) => {
  useGlobalStore.setState((state) => ({
    entityImportCompletionStatus: {
      ...state.entityImportCompletionStatus,
      [stepKey]: completed,
    },
  }));
};
