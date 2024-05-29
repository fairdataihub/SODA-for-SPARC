import { all } from "axios";
import useGlobalStore from "../globalStore";
import { produce } from "immer";

const initialState = {
  internetConnectionStatus: false,
  pennsieveAgentInstalled: false,
  pennsieveAgentDownloadURL: null,
  pennsieveAgentUpToDate: true,
  pennsieveAgentRunning: false,
  pennsieveAgentErrorMessage: null,
  allServicesPassing: false,
};

export const backgroundServicesSlice = (set) => ({
  ...initialState,
});

export const resetBackgroundServicesState = () => {
  useGlobalStore.setState(
    produce((state) => {
      Object.assign(state, initialState);
    })
  );
};

export const setInternetConnectionStatus = (connectionStatus) => {
  useGlobalStore.setState(
    produce((state) => {
      state.internetConnectionStatus = connectionStatus;
    })
  );
};

export const setPennsieveAgentInstalled = (installed) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentInstalled = installed;
    })
  );
};

export const setPennsieveAgentDownloadURL = (downloadURL) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentDownloadURL = downloadURL;
    })
  );
};

export const setPennsieveAgentUpToDate = (upToDate) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentUpToDate = upToDate;
    })
  );
};

export const setPennsieveAgentRunning = (running) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentRunning = running;
    })
  );
};

export const setPennsieveAgentErrorMessage = (errorMessage) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentErrorMessage = errorMessage;
    })
  );
};
