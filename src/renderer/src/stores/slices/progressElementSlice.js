import useGlobalStore from "../globalStore"; // Import the global state store
import { produce } from "immer"; // produce makes working with nested state modifications easier

export const progressElementSlice = (set) => ({
  progressElementData: {},
});

export const setProgressElementData = (progressElementId, currentTask, taskProgress) => {
  useGlobalStore.setState(
    produce((state) => {
      // Initialize the array if it does not exist
      if (!state.progressElementData[progressElementId]) {
        state.progressElementData[progressElementId] = {};
      }

      // Update the progress of the current task
      state.progressElementData[progressElementId]["currentTask"] = currentTask;
      state.progressElementData[progressElementId]["taskProgress"] = taskProgress;
    })
  );
};

export const removeProgressElementData = (progressElementId) => {
  useGlobalStore.setState(
    produce((state) => {
      state.progressElementData[progressElementId] = {};
    })
  );
};
