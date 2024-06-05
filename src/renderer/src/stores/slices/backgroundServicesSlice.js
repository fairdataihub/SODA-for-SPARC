import useGlobalStore from "../globalStore";
import { produce } from "immer";

const initialState = {
  backgroundServicesChecksInProgress: true,
  backgroundServicesChecksSuccessful: false,
  backgroundServicesError: null,
  pennsieveAgentInstalled: false,
  pennsieveAgentDownloadURL: null,
  pennsieveAgentUpToDate: true,
  pennsieveAgentOutputErrorMessage: null,
  usersPennsieveAgentVersion: null,
  latestPennsieveAgentVersion: null,
};

export const backgroundServicesSlice = (set) => ({
  ...initialState,
});

export const setBackgroundServicesChecksInProgress = (inProgress) => {
  useGlobalStore.setState(
    produce((state) => {
      state.backgroundServicesChecksInProgress = inProgress;
    })
  );
};

export const setBackgroundServicesError = (title, message) => {
  useGlobalStore.setState(
    produce((state) => {
      state.backgroundServicesError = { title, message };
      state.backgroundServicesChecksInProgress = false;
      state.backgroundServicesChecksSuccessful = false;
    })
  );
};

export const setBackgroundServicesChecksSuccessful = (successful) => {
  useGlobalStore.setState(
    produce((state) => {
      state.backgroundServicesChecksInProgress = false;
      state.backgroundServicesChecksSuccessful = successful;
    })
  );
};

export const resetBackgroundServicesState = () => {
  useGlobalStore.setState(
    produce((state) => {
      Object.assign(state, initialState);
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

export const setPennsieveAgentOutOfDate = (usersAgentVersion, latestAgentVersion) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentUpToDate = false;
      state.usersPennsieveAgentVersion = usersAgentVersion;
      state.latestPennsieveAgentVersion = latestAgentVersion;
      state.backgroundServicesChecksInProgress = false;
      state.backgroundServicesChecksSuccessful = false;
    })
  );
};

export const setUsersPennsieveAgentVersion = (usersAgentVersion) => {
  useGlobalStore.setState(
    produce((state) => {
      state.usersPennsieveAgentVersion = usersAgentVersion;
    })
  );
};

export const setLatestPennsieveAgentVersion = (latestAgentVersion) => {
  useGlobalStore.setState(
    produce((state) => {
      state.latestPennsieveAgentVersion = latestAgentVersion;
    })
  );
};

export const setPennsieveAgentOutputErrorMessage = (errorMessage) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentOutputErrorMessage = errorMessage;
      state.backgroundServicesChecksInProgress = false;
      state.backgroundServicesChecksSuccessful = false;
    })
  );
};
