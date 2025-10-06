import useGlobalStore from "../globalStore";
import {
  IconCirclePlus,
  IconDeviceFloppy,
  IconKeyboard,
  IconCloudUp,
  IconFileSpreadsheet,
  IconDeviceDesktop,
  IconFolderSymlink,
  IconBrowserPlus,
  IconCheckupList,
  IconReport,
} from "@tabler/icons-react";

export const checkboxCardSlice = (set) => ({
  cardData: {
    "dataset-upload-new-dataset": {
      title: "Create a new Pennsieve Dataset",
      description: null,
      Icon: IconCirclePlus,
      mutuallyExclusiveWithCards: ["dataset-upload-existing-dataset"],
      checked: false,
    },

    "dataset-upload-existing-dataset": {
      title: "Upload to an existing Pennsieve Dataset",
      description: null,
      Icon: IconCirclePlus,
      mutuallyExclusiveWithCards: ["dataset-upload-new-dataset"],
      checked: false,
      additionalClasses: "option-card radio-button",
    },
    "guided-button-start-new-curation": {
      title: "Prepare and share a new dataset test",
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
      comingSoon: true,
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
      Icon: IconCloudUp,
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
    "guided-button-user-has-protocols": {
      title: "Yes, my dataset's protocols are ready to enter",
      description: null,
      Icon: IconCheckupList,
      mutuallyExclusiveWithCards: ["guided-button-delay-protocol-entry"],
      nextElementID: "guided-div-protocols-import",
      checked: false,
      configValue: "user-has-protocols-to-enter",
      configValueState: "yes",
    },
    "guided-button-delay-protocol-entry": {
      title: "No, my protocols are not ready yet",
      description: null,
      Icon: IconReport,
      mutuallyExclusiveWithCards: ["guided-button-user-has-protocols"],
      nextElementID: "guided-div-wait-for-protocols",
      checked: false,
      configValue: "user-has-protocols-to-enter",
      configValueState: "no",
    },
    "modality-selection-yes": {
      simpleButtonType: "Positive",
      title: "Yes",
      description: null,
      Icon: null,
      mutuallyExclusiveWithCards: ["modality-selection-no"],
      nextElementID: "dataset-selection",
      checked: false,
      configValue: "multiple-modalities",
      configValueState: "yes",
    },
    "modality-selection-no": {
      simpleButtonType: "Negative",
      title: "No",
      description: null,
      Icon: null,
      mutuallyExclusiveWithCards: ["modality-selection-yes"],
      nextElementID: "no-modalities",
      checked: false,
      configValue: "multiple-modalities",
      configValueState: "no",
    },
    "guided-confirm-pennsieve-account-button": {
      simpleButtonType: "Positive",
      title: "Yes, this is the account",
      description: null,
      Icon: null,
      mutuallyExclusiveWithCards: ["guided-button-switch-account"],
      nextElementID: "guided-section-select-organization",
      checked: false,
      configValue: "pennsieve-account-has-been-confirmed",
      configValueState: "yes",
    },
    "guided-button-switch-account": {
      simpleButtonType: "Negative",
      title: "No, connect another account",
      description: null,
      Icon: null,
      mutuallyExclusiveWithCards: ["guided-confirm-pennsieve-account-button"],
      nextElementID: null,
      checked: false,
      configValue: null,
      configValueState: null,
      preventRadioHandler: true,
      customOnClick: "window.openDropdownPrompt(this, 'ps')",
    },
    "guided-confirm-pennsieve-organization-button": {
      simpleButtonType: "Positive",
      title: "Yes, this is the organization",
      description: null,
      Icon: null,
      mutuallyExclusiveWithCards: ["guided-button-switch-organization"],
      checked: false,
      configValue: "pennsieve-organization-has-been-confirmed",
      configValueState: "yes",
      customOnClick: "window.checkPennsieveAgent('guided-mode-post-log-in-pennsieve-agent-check')",
    },
    "guided-button-switch-organization": {
      simpleButtonType: "Negative",
      title: "No, switch organization",
      description: null,
      Icon: null,
      mutuallyExclusiveWithCards: ["guided-confirm-pennsieve-organization-button"],
      nextElementID: null,
      checked: false,
      configValue: null,
      configValueState: null,
      preventRadioHandler: true,
      additionalClasses: "change-current-account ds-dd organization guided-change-workspace",
    },
  },
});

export const getCheckboxDataByKey = (key) => {
  return useGlobalStore.getState().cardData[key];
};

export const setCheckboxCardChecked = (key) => {
  const cardData = useGlobalStore.getState().cardData;
  const card = cardData[key];
  useGlobalStore.setState((state) => {
    // Check this card
    state.cardData[key].checked = true;

    // Uncheck mutually exclusive cards and hide their next elements
    card.mutuallyExclusiveWithCards?.forEach((cardId) => {
      if (state.cardData[cardId]) {
        state.cardData[cardId].checked = false;
        // Hide their next element if defined
        const otherData = state.cardData[cardId];
        if (otherData.nextElementID) {
          const el = document.getElementById(otherData.nextElementID);
          if (el) el.classList.add("hidden");
        }
      }
    });

    // Show this card's next element if defined
    if (card.nextElementID) {
      const el = document.getElementById(card.nextElementID);
      if (el) el.classList.remove("hidden");
    }
  });
  // If the card has a config value, set it in sodaJSONObj (only if not preventRadioHandler)
  if (card.configValue && card.configValueState) {
    window.sodaJSONObj["button-config"][card.configValue] = card.configValueState;
  }
  if (card.customOnClick) {
    eval(card.customOnClick);
  }
};

export const setCheckboxCardUnchecked = (key) => {
  useGlobalStore.setState((state) => {
    state.cardData[key].checked = false;
  });

  const card = useGlobalStore.getState().cardData[key];
  // Hide this card's next element if defined
  if (card.nextElementID) {
    const el = document.getElementById(card.nextElementID);
    if (el) el.classList.add("hidden");
  }
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
