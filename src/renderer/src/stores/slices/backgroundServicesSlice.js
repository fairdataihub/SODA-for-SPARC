import useGlobalStore from "../globalStore";
import { produce } from "immer";

const initialState = {
  pennsieveAgentCheckInProgress: false,
  pennsieveAgentCheckSuccessful: null,
  pennsieveAgentCheckError: null,
  pennsieveAgentInstalled: null,
  pennsieveAgentDownloadURL: null,
  pennsieveAgentUpToDate: null,
  pennsieveAgentOutputErrorMessage: null,
  usersPennsieveAgentVersion: null,
  latestPennsieveAgentVersion: null,
  postPennsieveAgentCheckAction: null,
  microFilePlusInstalled: null,
  usersPlatformIsMicroFilePlusCompatable: null,
};

export const backgroundServicesSlice = (set) => ({
  ...initialState,
});

export const setPennsieveAgentCheckError = (title, message) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentCheckError = { title, message };
    })
  );
};

export const setPennsieveAgentCheckInProgress = (inProgress) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentCheckInProgress = inProgress;
    })
  );
};

export const setPennsieveAgentCheckSuccessful = (successful) => {
  useGlobalStore.setState(
    produce((state) => {
      state.pennsieveAgentCheckInProgress = false;
      state.pennsieveAgentCheckSuccessful = successful;
    })
  );
};

export const resetPennsieveAgentCheckState = () => {
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
    })
  );
};

export const setPostPennsieveAgentCheckAction = (action) => {
  useGlobalStore.setState(
    produce((state) => {
      state.postPennsieveAgentCheckAction = action;
    })
  );
};

export const setMicroFilePlusInstalledStatus = (
  mfpIsInstalled,
  usersPlatformIsMicroFilePlusCompatable
) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microFilePlusInstalled = mfpIsInstalled;
      state.usersPlatformIsMicroFilePlusCompatable = usersPlatformIsMicroFilePlusCompatable;
    })
  );
};
