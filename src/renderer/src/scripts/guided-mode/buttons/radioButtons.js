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

  const guidedRadioButtons = parentPage.querySelectorAll('[data-component-type="checkbox-card"]');
  for (const guidedRadioButton of guidedRadioButtons) {
    // Get the button id from data-button-id attribute
    const buttonId = guidedRadioButton.getAttribute("data-button-id");
    if (buttonId) {
      resetProgressCheckboxCard(buttonId);
    } else {
      console.warn("🚨 Guided Radio Button is missing a data-button-id:", guidedRadioButton);
    }
  }
};

export const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll('[data-component-type="checkbox-card"]');
  for (const guidedRadioButton of guidedRadioButtons) {
    // Get the button id from data-button-id attribute
    const buttonId = guidedRadioButton.getAttribute("data-button-id");
    const checkboxData = getCheckboxDataByKey(buttonId);
      console.log("[updateGuidedRadioButtonsFromJSON] Checkbox Data for", buttonId, ":", checkboxData);
      if (!buttonId) {
        console.error("[updateGuidedRadioButtonsFromJSON] data-button-id missing for element:", guidedRadioButton);
        continue;
      }
      if (!checkboxData) {
        console.error("[updateGuidedRadioButtonsFromJSON] No checkboxData found for buttonId:", buttonId);
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
