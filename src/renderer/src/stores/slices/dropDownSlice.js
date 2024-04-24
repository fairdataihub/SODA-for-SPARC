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
      const dropDownOptions = useGlobalStore.getState().dropDownState[id].options;
      console.log("Drop down options for ", id, " are: ", dropDownOptions);
      console.log("New selected value: ", selectedValue);
      if (!dropDownOptions.includes(selectedValue)) {
        console.log("Invalid value selected: ", selectedValue);
        return;
      }
      state.dropDownState[id].selectedValue = selectedValue || "";
    })
  );
};
