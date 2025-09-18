import {
  resetProgressCheckboxCard,
  getCheckboxDataByKey,
  setCheckboxCardChecked,
} from "../../../stores/slices/checkboxCardSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * @description Adds click handlers to the radio buttons in the Prepare Dataset Step-by-Step workflows.
 *              The click handlers make the buttons appear selected and deselects the other radio buttons in grouped to the active button.
 *              The clicked radio button also stores its config value in window.sodaJSONObj for reference when resuming progress.
 */
document.querySelectorAll(".guided--radio-button").forEach((button) => {
  button.addEventListener("click", async function () {
    const selectedButton = this;
    const notSelectedButtons = [
      ...selectedButton.parentElement.querySelectorAll(".guided--radio-button"),
    ].filter((btn) => btn !== selectedButton);

    // Reset other buttons
    notSelectedButtons.forEach((btn) => {
      btn.classList.remove("selected");
      btn.classList.add("not-selected", "basic");

      const nextElementId = btn.dataset.nextElement;
      if (nextElementId) {
        window.nextQuestionID = nextElementId;
        const el = document.getElementById(nextElementId);
        if (el) el.classList.add("hidden");
      }
    });

    // If handler should be prevented, stop here
    if (selectedButton.dataset.preventRadioHandler === "true") {
      return;
    }

    // Save button config to sodaJSONObj if available
    if (selectedButton.dataset.buttonConfigValue) {
      const buttonConfigValue = selectedButton.dataset.buttonConfigValue;
      const buttonConfigValueState = selectedButton.dataset.buttonConfigValueState;
      window.sodaJSONObj["button-config"][buttonConfigValue] = buttonConfigValueState;
    }

    // Mark selected button
    selectedButton.classList.remove("not-selected", "basic");
    selectedButton.classList.add("selected");

    // Show linked next element if it exists
    const nextElementId = selectedButton.dataset.nextElement;
    if (nextElementId) {
      window.nextQuestionID = nextElementId;
      const nextElement = document.getElementById(nextElementId);
      if (nextElement) {
        nextElement.classList.remove("hidden");
        nextElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

export const resetGuidedRadioButtons = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);

  const guidedRadioButtons = parentPage.querySelectorAll('[data-component-type="checkbox-card"]');
  for (const guidedRadioButton of guidedRadioButtons) {
    // Get the id of the button
    const buttonId = guidedRadioButton.id;
    if (buttonId) {
      resetProgressCheckboxCard(buttonId);
    } else {
      console.warn("🚨 Guided Radio Button is missing an ID:", guidedRadioButton);
    }
  }
};

export const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll('[data-component-type="checkbox-card"]');
  for (const guidedRadioButton of guidedRadioButtons) {
    //Get the button config value from the UI
    const buttonId = guidedRadioButton.id;
    const checkboxData = getCheckboxDataByKey(buttonId);
    console.log("Checkbox Data for", buttonId, ":", checkboxData);
    const buttonConfigValue = checkboxData?.configValue;
    const buttonConfigValueState = checkboxData?.configValueState;

    if (buttonConfigValue) {
      if (window.sodaJSONObj["button-config"][buttonConfigValue] === buttonConfigValueState) {
        setCheckboxCardChecked(buttonId);
      }
    }
  }
};
