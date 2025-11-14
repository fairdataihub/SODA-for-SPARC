import {
  resetProgressCheckboxCard,
  getCheckboxDataByKey,
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../stores/slices/checkboxCardSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const resetGuidedRadioButtons = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);

  const reactComponentCards = parentPage.querySelectorAll("[data-checkbox-button-id]");

  // Process React component cards
  for (const reactCard of reactComponentCards) {
    const buttonId = reactCard.getAttribute("data-checkbox-button-id");
    if (buttonId) {
      resetProgressCheckboxCard(buttonId);
    } else {
      console.warn("🚨 React CheckboxCard is missing a data-checkbox-button-id:", reactCard);
    }
  }
};

export const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);

  // Look for both HTML renderer cards and React component cards
  const reactComponentCards = parentPage.querySelectorAll("[data-checkbox-button-id]");

  // Process React component cards
  for (const reactCard of reactComponentCards) {
    const buttonId = reactCard.getAttribute("data-checkbox-button-id");
    const checkboxData = getCheckboxDataByKey(buttonId);
    if (!buttonId) {
      console.error(
        "[updateGuidedRadioButtonsFromJSON] data-checkbox-button-id missing for React element:",
        reactCard
      );
      continue;
    }
    if (!checkboxData) {
      console.error(
        "[updateGuidedRadioButtonsFromJSON] No checkboxData found for React buttonId:",
        buttonId
      );
      continue;
    }
    const buttonConfigValue = checkboxData?.configValue;
    const buttonConfigValueState = checkboxData?.configValueState;

    if (buttonConfigValue) {
      if (window.sodaJSONObj["button-config"][buttonConfigValue] === buttonConfigValueState) {
        setCheckboxCardChecked(buttonId);
      }
    } else {
      setCheckboxCardUnchecked(buttonId);
    }
  }
};
