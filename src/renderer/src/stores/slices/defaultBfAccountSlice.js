import useGlobalStore from "../globalStore"; // Import the global state store
import { produce } from "immer"; // produce makes working with nested state modifications easier

export const defaultBfAccountSlice = (set) => ({
  defaultBfAccount: null, //Initial table state
});

export const updateDefaultBfAccount = (newBfAccount) => {
  useGlobalStore.setState(
    produce((state) => {
      console.log("Updating defaultBfAccount to: ", newBfAccount);
      state.defaultBfAccount = newBfAccount;
      console.log("Updated defaultBfAccount to: ", state.defaultBfAccount);
    })
  );
};
