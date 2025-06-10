import useGlobalStore from "../globalStore";

const initialCheckboxState = {
  checkboxes: {}, // key: boolean
};

export const checkboxCardSlice = (set) => ({
  ...initialCheckboxState,
});

export const setCheckboxCardChecked = (key, checked) => {
  useGlobalStore.setState((state) => {
    state.checkboxes[key] = checked;
  });
};

export const toggleCheckboxCardChecked = (key) => {
  useGlobalStore.setState((state) => {
    state.checkboxes[key] = !state.checkboxes[key];
  });
};

export const isCheckboxCardChecked = (key) => {
  return !!useGlobalStore.getState().checkboxes[key];
};

export const getAllCheckboxCardChecked = () => {
  return { ...useGlobalStore.getState().checkboxes };
};

export const clearAllCheckboxCardChecked = () => {
  useGlobalStore.setState((state) => {
    state.checkboxes = {};
  });
};
