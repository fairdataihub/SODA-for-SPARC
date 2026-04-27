import useGlobalStore from "../globalStore";

export const appConfigSlice = (set) => ({
  appVersion: [],
});

export const setAppVersion = (appVersion) => {
  useGlobalStore.setState({ appVersion });
};
