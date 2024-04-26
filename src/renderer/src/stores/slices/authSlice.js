import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const authSlice = (set) => ({
  authenticatedBioLucidaUserName: [],
});

export const setAuthenticatedBioLucidaUserName = (userName) => {
  useGlobalStore.setState(
    produce((state) => {
      state.authenticatedBioLucidaUserName = userName;
    })
  );
};
