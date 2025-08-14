import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const dropDownSlice = (set) => ({
  dropDownState: {
    "guided-nih-funding-consortium": {
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
    "license-select": {
      label: "Select a license:",
      placeholder: "Select a license",
      options: [
        "*section-divider* Better for Data",
        "CC-BY-4.0 – Creative Commons Attribution",
        "CC0-1.0 – Creative Commons Zero 1.0 Universal",
        "CC-BY-SA-4.0 – Creative Commons Attribution-ShareAlike",
        "ODbL-1.0 – Open Data Commons Open Database License",
        "ODC-By-1.0 – Open Data Commons Attribution License",
        "PDDL-1.0 – Open Data Commons Public Domain Dedication and License",
        "CDLA-Permissive-1.0 – Community Data License Agreement – Permissive",
        "CDLA-Sharing-1.0 – Community Data License Agreement – Sharing",
        "*section-divider* Better for Code",
        "MIT – MIT License",
        "Apache-2.0 – Apache License 2.0",
        "GPL-3.0 – GNU General Public License",
        "LGPL-3.0 – GNU Lesser General Public License",
        "MPL-2.0 – Mozilla Public License 2.0",
      ],
      selectedValue: "",
    },
    "guided-funding-agency": {
      label: "Funding agency:",
      placeholder: "Select the agency that funded your research",
      description:
        "Select the agency that funded the creation of this dataset or 'Other' if your funding agency is not in the dropdown.",
      options: ["NIH", "Other"],
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

export const getDropDownState = (id) => {
  return useGlobalStore.getState().dropDownState?.[id]?.selectedValue || null;
};
