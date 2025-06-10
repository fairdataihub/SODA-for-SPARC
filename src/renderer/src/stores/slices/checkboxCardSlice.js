import useGlobalStore from "../globalStore";

const initialCheckboxState = {
  checkboxes: {}, // key: boolean
};

export const checkboxCardSlice = (set) => ({
  ...initialCheckboxState,
});

export const setCheckboxCardChecked = (key) => {
  useGlobalStore.setState((state) => {
    state.checkboxes[key] = true;
  });
};

export const setCheckboxCardUnchecked = (key) => {
  useGlobalStore.setState((state) => {
    state.checkboxes[key] = false;
  });
};

export const clearAllCheckboxCardChecked = () => {
  useGlobalStore.setState((state) => {
    state.checkboxes = {};
  });
};
