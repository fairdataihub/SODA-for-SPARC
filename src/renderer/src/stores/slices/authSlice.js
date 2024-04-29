import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const authSlice = (set) => ({
  userAuthenticatedToBioLucida: false,
  bioLucidaUsername: "",
  bioLucidaAuthToken: "",
  BioLucidaAuthTokenExpiration: "",
});

export const setBioLucidaCredentials = (userName, token) => {
  // generate token expiration state one hour from now
  const tokenExpiration = new Date();
  tokenExpiration.setHours(tokenExpiration.getHours() + 1);
  useGlobalStore.setState(
    produce((state) => {
      state.userAuthenticatedToBioLucida = true;
      state.bioLucidaUsername = userName;
      state.bioLucidaAuthToken = token;
      state.BioLucidaAuthTokenExpiration = tokenExpiration;
    })
  );
};

export const clearBioLucidaCredentials = () => {
  useGlobalStore.setState(
    produce((state) => {
      state.userAuthenticatedToBioLucida = false;
      state.bioLucidaUsername = "";
      state.bioLucidaAuthToken = "";
      state.BioLucidaAuthTokenExpiration = "";
    })
  );
};
