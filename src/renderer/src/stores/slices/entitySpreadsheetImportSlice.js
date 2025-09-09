import useGlobalStore from "../globalStore";

const initialState = {
  entityIdStepHasBeenCompleted: false,
  entityMetadataStepHasBeenCompleted: false,
};

export const entitySpreadsheetImportSlice = (set) => ({
  ...initialState,
});

export const setEntityIdStepHasBeenCompleted = (hasBeenCompleted) => {
  useGlobalStore.setState({
    entityIdStepHasBeenCompleted: hasBeenCompleted,
  });
};

export const setEntityMetadataStepHasBeenCompleted = (hasBeenCompleted) => {
  useGlobalStore.setState({
    entityMetadataStepHasBeenCompleted: hasBeenCompleted,
  });
};
