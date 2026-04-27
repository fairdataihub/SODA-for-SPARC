import useGlobalStore from "../globalStore";

export const navButtonStateSlice = (set) => ({
  navigationButtonStates: {},
});

export const setNavButtonDisabled = (buttonId, isDisabled) => {
  useGlobalStore.setState((prev) => ({
    navigationButtonStates: {
      ...prev.navigationButtonStates,
      [buttonId]: {
        ...(prev.navigationButtonStates[buttonId] || {}),
        disabled: isDisabled,
      },
    },
  }));
};

export const setNavButtonHidden = (buttonId, isHidden) => {
  useGlobalStore.setState((prev) => ({
    navigationButtonStates: {
      ...prev.navigationButtonStates,
      [buttonId]: {
        ...(prev.navigationButtonStates[buttonId] || {}),
        hidden: isHidden,
      },
    },
  }));
};
