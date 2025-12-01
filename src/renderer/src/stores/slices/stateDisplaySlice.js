import useGlobalStore from "../globalStore";

// Slice definition
export const stateDisplaySlice = (set) => ({
  stateDisplay: {},
});

// Separate exportable setter (if you want it outside the slice)
export const setStateDisplayData = (key, value) => {
  useGlobalStore.setState((state) => {
    const newState = {
      stateDisplay: {
        ...state.stateDisplay,
        [key]: value,
      },
    };
    return newState;
  });
};
