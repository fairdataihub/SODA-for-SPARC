import useGlobalStore from "../globalStore";
export const dropDownSlice = (set) => ({
  dropDownState: {
    "guided-select-sparc-funding-consortium": {
      label: "SPARC Funding Consortium",
      placeholder: "Select a SPARC Funding Consortium",
      options: ["SPARC", "SPARC-2", "VESPA", "REVA", "HORNET"],
      selectedValue: "",
    },
  },
});

export const setDropdownState = (id, selectedValue) => {
  useGlobalStore.setState((state) => ({
    ...state,
    dropDownState: {
      ...state.dropDownState,
      [id]: {
        ...state.dropDownState[id],
        selectedValue: state.dropDownState[id].options
          .map((option) => option.toLowerCase()) // Convert options to lowercase
          .includes(selectedValue.toLowerCase()) // Case-insensitive comparison
          ? selectedValue
          : state.dropDownState[id].selectedValue || "", // Maintain previous selection or default to empty string
      },
    },
  }));
};
