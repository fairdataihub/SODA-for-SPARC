import useGlobalStore from "../globalStore";
import { produce } from "immer";

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
  useGlobalStore.setState(
    produce((state) => {
      // Get the options for the dropdown related to the id passed in
      const dropDownOptions = useGlobalStore
        .getState()
        .dropDownState[id].options.filter((option) => option !== "");

      // If the selected value is not in the dropdown options, set the value
      // to an empty string and add an empty string to the dropdown options
      if (!dropDownOptions.includes(selectedValue)) {
        state.dropDownState[id].options = ["", ...dropDownOptions];
        state.dropDownState[id].selectedValue = "";
      } else {
        // If the selected value is in the dropdown options, set the selected value
        // to the selected value passed in and set the dropdown options to the
        // dropdown options (To remove the empty string if it exists)
        state.dropDownState[id].options = dropDownOptions;
        state.dropDownState[id].selectedValue = selectedValue;
      }
    })
  );
};
