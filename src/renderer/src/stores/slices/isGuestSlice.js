import useGlobalStore from "../globalStore";

export const isGuestSlice = (set) => ({
  isGuest: false,
});

export const setIsGuest = (isGuest) => {
  useGlobalStore.setState({
    isGuest: isGuest,
  });
};
