import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const dropDownSlice = (set) => ({
  dropDownState: {
    "guided-select-sparc-funding-consortium": {
      label: "Funding Consortium:",
      placeholder: "Select a NIH Funding Consortium",
      description:
        "Select the NIH Funding Consortium that funded the creation of this dataset or 'Other' if your funding consortium is not in the dropdown.",
      options: [
        "SPARC",
        "SPARC-2",
        "VESPA",
        "REVA",
        "HORNET",
        "HEAL",
        "HEAL-REJOIN",
        "HEAL-PRECISION",
        "Other",
      ],
      selectedValue: "",
    },
    "guided-select-funding-agency": {
      label: "Funding agency:",
      placeholder: "Select the agency that funded your research",
      description:
        "Select the agency that funded the creation of this dataset or 'Other' if your funding agency is not in the dropdown.",
      options: ["NIH", "Other"],
      selectedValue: "",
    },
    "guided-select-license": {
      label: "",
      placeholder: "Select a license for your dataset",
      description:
        "Select a license for your dataset or 'Other' if your license is not in the dropdown.",
      options: [
        "CC0 1.0 Universal (CC0 1.0)",
        "CC BY 4.0 International (CC BY 4.0)",
        "CC BY-NC 4.0 International (CC BY-NC 4.0)",
        "SPARC Data Use Agreement",
        "Other",
      ],
      selectedValue: "",
      required: true,
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

export const getDropDownState = (id) => {
  return useGlobalStore.getState().dropDownState?.[id]?.selectedValue || null;
};
