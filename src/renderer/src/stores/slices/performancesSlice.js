import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const performancesSlice = (set, get) => ({
  // UI state
  IsPerformanceFormVisible: false,

  // Form field values (schema-compliant)
  performance_id: "",
  protocol_url_or_doi: "",
  start_datetime: "",
  end_datetime: "",

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
        state.performance_id = "";
        state.protocol_url_or_doi = "";
        state.start_datetime = "";
        state.end_datetime = "";
      }
    })
  );
};

// Update performance_id - strip prefix if present
export const setPerformanceId = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      // Remove "perf-" prefix if user enters it
      if (value.startsWith("perf-")) {
        state.performance_id = value.substring(5);
      } else {
        state.performance_id = value;
      }
    })
  );
};

// Update protocol_url_or_doi
export const setProtocolUrlOrDoi = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.protocol_url_or_doi = value;
    })
  );
};

// Update start_datetime
export const setStartDatetime = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.start_datetime = value;
    })
  );
};

// Update end_datetime
export const setEndDatetime = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      state.end_datetime = value;
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

export const deletePerformance = (performance_id) => {
  useGlobalStore.setState(
    produce((state) => {
      state.performanceList = state.performanceList.filter(
        (performance) => performance.performance_id !== performance_id
      );
    })
  );
};

// Add performance to the dataset
export const addPerformance = () => {
  const state = useGlobalStore.getState();

  // Get raw ID from state (without prefix)
  const rawId = state.performance_id.trim();

  // Validate ID is not empty
  if (!rawId) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Performance ID cannot be empty.",
    });
    return false;
  }

  // Validate SDS identifier conventions
  if (
    !window.evaluateStringAgainstSdsRequirements(rawId, "string-adheres-to-identifier-conventions")
  ) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Performance ID can only contain letters, numbers, and hyphens.",
    });
    return false;
  }

  // Validate protocol_url_or_doi pattern only if a value is present
  const protocolPattern = /^(https?:\/\/|doi:).+/;
  if (state.protocol_url_or_doi && !protocolPattern.test(state.protocol_url_or_doi)) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Protocol URL or DOI must start with 'https://' or 'doi:'.",
    });
    return false;
  }

  // Construct full ID with prefix
  const performance_id = `perf-${rawId}`;

  // Get other values from state
  const protocol_url_or_doi = state.protocol_url_or_doi;
  const start_datetime = state.start_datetime;
  const end_datetime = state.end_datetime;

  // Check for duplicates in existing list
  const isDuplicate = state.performanceList.some(
    (performance) => performance.performance_id === performance_id
  );

  if (isDuplicate) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: `Performance ID "${performance_id}" already exists.`,
    });
    return false;
  }

  // Add performance to the list with properly prefixed ID and schema fields
  useGlobalStore.setState(
    produce((state) => {
      state.performanceList.push({
        performance_id,
        protocol_url_or_doi,
        start_datetime,
        end_datetime,
      });
    })
  );

  window.notyf.open({
    duration: "4000",
    type: "success",
    message: `Performance ${performance_id} added successfully.`,
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
  const rawId = state.performance_id.trim();

  // Validate ID is not empty
  if (!rawId) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Performance ID cannot be empty.",
    });
    return false;
  }

  // Validate SDS identifier conventions
  if (
    !window.evaluateStringAgainstSdsRequirements(rawId, "string-adheres-to-identifier-conventions")
  ) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Performance ID can only contain letters, numbers, and hyphens.",
    });
    return false;
  }

  // Validate protocol_url_or_doi pattern only if a value is present
  const protocolPattern = /^(https?:\/\/|doi:).+/;
  if (state.protocol_url_or_doi && !protocolPattern.test(state.protocol_url_or_doi)) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: "Protocol URL or DOI must start with 'https://' or 'doi:'.",
    });
    return false;
  }

  // Construct full ID with prefix
  const newPerformanceId = `perf-${rawId}`;

  // Get other values from state
  const protocol_url_or_doi = state.protocol_url_or_doi;
  const start_datetime = state.start_datetime;
  const end_datetime = state.end_datetime;

  // Check for duplicates only if ID has changed
  if (newPerformanceId !== originalId) {
    const isDuplicate = state.performanceList.some(
      (performance) => performance.performance_id === newPerformanceId
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
        (performance) => performance.performance_id !== originalId
      );

      // Add the updated performance
      state.performanceList.push({
        performance_id: newPerformanceId,
        protocol_url_or_doi,
        start_datetime,
        end_datetime,
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
