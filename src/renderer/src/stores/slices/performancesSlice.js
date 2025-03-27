import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const performancesSlice = (set) => ({
  // UI state
  IsPerformanceFormVisible: false,

  // Form field values
  performanceId: "",
  performanceType: "",
  protocolUrl: "",
  startDateTime: null,
  endDateTime: null,

  // Performance list
  performanceList: [],
});

// Set form visibility
export const setPerformanceFormVisible = (IsPerformanceFormVisible) => {
  useGlobalStore.setState(
    produce((state) => {
      state.IsPerformanceFormVisible = IsPerformanceFormVisible;

      // Reset form fields when closing the form
      if (!IsPerformanceFormVisible) {
        state.performanceId = "";
        state.performanceType = "";
        state.protocolUrl = "";
        state.startDateTime = null;
        state.endDateTime = null;
      }
    })
  );
};

// Update performance ID
export const setPerformanceId = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.performanceId = value;
    })
  );
};

// Update performance type
export const setPerformanceType = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.performanceType = value;
    })
  );
};

// Update protocol URL
export const setProtocolUrl = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.protocolUrl = value;
    })
  );
};

// Update start date/time
export const setStartDateTime = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.startDateTime = value;
    })
  );
};

// Update end date/time
export const setEndDateTime = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.endDateTime = value;
    })
  );
};

// Add performance to the dataset
export const addPerformance = () => {
  const state = useGlobalStore.getState();

  // Get values from state
  const performanceId = state.performanceId;
  const protocolUrl = state.protocolUrl;
  const startDateTime = state.startDateTime;
  const endDateTime = state.endDateTime;

  console.log("Adding performance:", {
    performanceId,
    protocolUrl,
    startDateTime,
    endDateTime,
  });

  // Add performance to the list
  useGlobalStore.setState(
    produce((state) => {
      state.performanceList.push({
        performanceId,
        protocolUrl,
        startDateTime,
        endDateTime,
      });
    })
  );

  // Close form after adding
  setPerformanceFormVisible(false);
};
