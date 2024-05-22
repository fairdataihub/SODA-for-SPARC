import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const backgroundServicesSlice = (set) => ({
  internetConnectionStatus: false,
  pennsieveAgentInstalled: false,
  pennsieveAgentDownloadURL: null,
  pennsieveAgentUpToDate: false,
  pennsieveAgentRunning: false,
});

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
