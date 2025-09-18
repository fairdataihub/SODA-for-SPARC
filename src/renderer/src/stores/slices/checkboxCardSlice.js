import useGlobalStore from "../globalStore";
import {
  IconCirclePlus,
  IconDeviceFloppy,
  IconKeyboard,
  IconFileSpreadsheet,
  IconDeviceDesktop,
  IconFolderSymlink,
  IconBrowserPlus,
} from "@tabler/icons-react";
import pennsieveLogo from "../../assets/img/pennsieveLogo.png";

export const checkboxCardSlice = (set) => ({
  cardData: {
    "guided-button-start-new-curation": {
      title: "Prepare and share a new dataset",
      description: null,
      Icon: IconCirclePlus,
      mutuallyExclusiveWithCards: ["guided-button-resume-progress-file"],
      nextElementID: "guided-section-start-new-curation",
      checked: false,
    },
    "guided-button-resume-progress-file": {
      title: "Continue a dataset saved in SODA",
      description: null,
      Icon: IconDeviceFloppy,
      mutuallyExclusiveWithCards: ["guided-button-start-new-curation"],
      nextElementID: "guided-section-resume-progress-cards",
      checked: false,
    },
    "guided-button-add-entities-manually": {
      title: "Enter entity IDs manually in the SODA ui",
      description: null,
      Icon: IconKeyboard,
      mutuallyExclusiveWithCards: ["guided-button-add-entities-via-spreadsheet"],
      configValue: "entity-addition-method",
      configValueState: "manual",
      checked: false,
    },
    "guided-button-add-entities-via-spreadsheet": {
      title: "Import entity IDs using a spreadsheet",
      description: null,
      Icon: IconFileSpreadsheet,
      mutuallyExclusiveWithCards: ["guided-button-add-entities-manually"],
      configValue: "entity-addition-method",
      configValueState: "spreadsheet",
      // comingSoon: true,
      checked: false,
    },
    "generate-dataset-locally": {
      title: "Generate dataset locally",
      description: "Create a local copy of the dataset on your computer",
      Icon: IconDeviceDesktop,
      checked: false,
    },
    "generate-dataset-on-pennsieve": {
      title: "Generate dataset on Pennsieve",
      description: "Pennsieve is the official data management platform for the SPARC program.",
      image: pennsieveLogo,
      checked: false,
    },
    "generate-on-existing-pennsieve-dataset": {
      title: "Upload to an existing empty dataset on Pennsieve",
      description:
        "Select this option if you have an existing dataset on Pennsieve you would like to use.",
      Icon: IconFolderSymlink,
      mutuallyExclusiveWithCards: ["generate-on-new-pennsieve-dataset"],
      checked: false,
    },
    "generate-on-new-pennsieve-dataset": {
      title: "Create a new dataset on Pennsieve",
      description:
        "Select this option if you would like SODA to create a new dataset for you on Pennsieve.",
      Icon: IconBrowserPlus,
      mutuallyExclusiveWithCards: ["generate-on-existing-pennsieve-dataset"],
      checked: false,
    },
  },
});

export const getCheckboxDataByKey = (key) => {
  return useGlobalStore.getState().cardData[key];
};

export const setCheckboxCardChecked = (key) => {
  useGlobalStore.setState((state) => {
    state.cardData[key].checked = true;
  });
  // If the card has a config value, set it in sodaJSONObj
  const cardData = useGlobalStore.getState().cardData;
  const card = cardData[key];
  if (card && card.configValue && card.configValueState) {
    console.log(
      `Setting sodaJSONObj["button-config"][${card.configValue}] = ${card.configValueState}`
    );
    window.sodaJSONObj["button-config"][card.configValue] = card.configValueState;
  }
};

export const setCheckboxCardUnchecked = (key) => {
  useGlobalStore.setState((state) => {
    state.cardData[key].checked = false;
  });
};

export const clearAllCheckboxCardChecked = () => {
  useGlobalStore.setState((state) => {
    Object.keys(state.cardData).forEach((key) => {
      state.cardData[key].checked = false;
    });
  });
};

export const isCheckboxCardChecked = (key) => {
  return useGlobalStore.getState().cardData[key]?.checked || false;
};

export const getCheckboxCardDataMap = () => {
  return useGlobalStore.getState().cardData;
};

export const resetProgressCheckboxCard = (id) => {
  const checkboxConfig = useGlobalStore.getState().cardData[id];
  if (!checkboxConfig) return;
  setCheckboxCardUnchecked(id);
  // Hide their next element if defined
  if (checkboxConfig.nextElementID) {
    const el = document.getElementById(checkboxConfig.nextElementID);
    if (el) el.classList.add("hidden");
  }
};
