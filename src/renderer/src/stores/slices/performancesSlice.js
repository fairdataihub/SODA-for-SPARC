import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const performancesSlice = (set, get) => ({
  // UI state
  IsPerformanceFormVisible: false,

  // Form field values - store raw ID without prefix
  performanceId: "",
  protocolUrl: "",
  startDateTime: null,
  endDateTime: null,

  // Performance list
  performanceList: [],

  // Edit mode state
  isEditMode: false,
  originalPerformanceId: "",
});

export const setIsEditMode = (isEditMode) => {
  useGlobalStore.setState(
    produce((state) => {
      state.isEditMode = isEditMode;
    })
  );
};

export const setOriginalPerformanceId = (id) => {
  useGlobalStore.setState(
    produce((state) => {
      state.originalPerformanceId = id;
    })
  );
};

// Set form visibility
export const setPerformanceFormVisible = (IsPerformanceFormVisible) => {
  useGlobalStore.setState(
    produce((state) => {
      state.IsPerformanceFormVisible = IsPerformanceFormVisible;

      // Reset form fields when closing the form
      if (!IsPerformanceFormVisible) {
        state.performanceId = "";
        state.protocolUrl = "";
        state.startDateTime = null;
        state.endDateTime = null;
      }
    })
  );
};

// Update performance ID - strip prefix if present
export const setPerformanceId = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      // Remove "perf-" prefix if user enters it
      if (value.startsWith("perf-")) {
        state.performanceId = value.substring(5);
      } else {
        state.performanceId = value;
      }
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

export const deletePerformance = (performanceId) => {
  useGlobalStore.setState(
    produce((state) => {
      state.performanceList = state.performanceList.filter(
        (performance) => performance.performanceId !== performanceId
      );
    })
  );
};

// Add performance to the dataset
export const addPerformance = () => {
  const state = useGlobalStore.getState();

  // Get raw ID from state (without prefix)
  const rawId = state.performanceId.trim();

  // Validate ID is not empty
  if (!rawId) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Performance ID cannot be empty.",
    });
    return false;
  }

  // Construct full ID with prefix
  const performanceId = `perf-${rawId}`;

  // Get other values from state
  const protocolUrl = state.protocolUrl;
  const startDateTime = state.startDateTime;
  const endDateTime = state.endDateTime;

  // Check for duplicates in existing list
  const isDuplicate = state.performanceList.some(
    (performance) => performance.performanceId === performanceId
  );

  if (isDuplicate) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: `Performance ID "${performanceId}" already exists.`,
    });
    return false;
  }

  // Add performance to the list with properly prefixed ID
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

  window.notyf.open({
    duration: "4000",
    type: "success",
    message: `Performance ${performanceId} added successfully.`,
  });

  // Close form after adding
  setPerformanceFormVisible(false);

  return true;
};

// Update an existing performance
export const updatePerformance = () => {
  const state = useGlobalStore.getState();

  // Get the original and new IDs
  const originalId = state.originalPerformanceId;
  const rawId = state.performanceId.trim();

  // Validate ID is not empty
  if (!rawId) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Performance ID cannot be empty.",
    });
    return false;
  }

  // Construct full ID with prefix
  const newPerformanceId = `perf-${rawId}`;

  // Get other values from state
  const protocolUrl = state.protocolUrl;
  const startDateTime = state.startDateTime;
  const endDateTime = state.endDateTime;

  // Check for duplicates only if ID has changed
  if (newPerformanceId !== originalId) {
    const isDuplicate = state.performanceList.some(
      (performance) => performance.performanceId === newPerformanceId
    );

    if (isDuplicate) {
      window.notyf.open({
        duration: "4000",
        type: "error",
        message: `Performance ID "${newPerformanceId}" already exists.`,
      });
      return false;
    }
  }

  // Update performance in the list
  useGlobalStore.setState(
    produce((state) => {
      // Remove the old performance
      state.performanceList = state.performanceList.filter(
        (performance) => performance.performanceId !== originalId
      );

      // Add the updated performance
      state.performanceList.push({
        performanceId: newPerformanceId,
        protocolUrl,
        startDateTime,
        endDateTime,
      });

      // Reset edit mode
      state.isEditMode = false;
      state.originalPerformanceId = "";
    })
  );

  window.notyf.open({
    duration: "4000",
    type: "success",
    message: `Performance ${newPerformanceId} updated successfully.`,
  });

  // Close form after updating
  setPerformanceFormVisible(false);
  return true;
};

export const setPerformanceList = (performanceList) => {
  useGlobalStore.setState(
    produce((state) => {
      state.performanceList = performanceList;
    })
  );
};
