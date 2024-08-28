import useGlobalStore from "../globalStore"; // Import the global state store
import { produce } from "immer"; // produce makes working with nested state modifications easier

export const defaultWorkspaceSlice = (set) => ({
  defaultWorkspace: null, //Initial table state
});

export const updateDefaultWorkspace = (newWorkspace) => {
  useGlobalStore.setState(
    produce((state) => {
      console.log("Updating defaultWorkspace to: ", newWorkspace);
      state.defaultWorkspace = newWorkspace;
      console.log("Updated defaultWorkspace to: ", state.defaultWorkspace);
    })
  );
};
