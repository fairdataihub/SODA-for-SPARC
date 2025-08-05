import useGlobalStore from "../globalStore";

const initialSodaTextInputState = {
  sodaTextInputs: {}, // key: string
};

export const sodaTextInputSlice = (set) => ({
  ...initialSodaTextInputState,
});

export const setSodaTextInputValue = (key, value) => {
  useGlobalStore.setState((state) => {
    state.sodaTextInputs = { ...(state.sodaTextInputs || {}), [key]: value };
  });
};

export const clearAllSodaTextInputs = () => {
  useGlobalStore.setState((state) => {
    state.sodaTextInputs = {};
  });
};

export const getSodaTextInputValue = (key) => {
  return useGlobalStore.getState().sodaTextInputs?.[key] || "";
};
