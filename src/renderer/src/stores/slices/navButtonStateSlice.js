import useGlobalStore from "../globalStore";

export const navButtonStateSlice = (set) => ({
  navigationButtonStates: {},
});

export const setNavButtonState = (buttonId, state) => {
  useGlobalStore.setState((prev) => ({
    navigationButtonStates: {
      ...prev.navigationButtonStates,
      [buttonId]: state,
    },
  }));
};
