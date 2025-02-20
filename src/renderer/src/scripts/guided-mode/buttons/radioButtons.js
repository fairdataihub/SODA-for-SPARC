while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * @description Adds click handlers to the radio buttons in the Prepare Dataset Step-by-Step workflows.
 *              The click handlers make the buttons appear selected and deselects the other radio buttons in grouped to the active button.
 *              The clicked radio button also stores its config value in window.sodaJSONObj for reference when resuming progress.
 */
$(".guided--radio-button").on("click", async function () {
  const selectedButton = $(this);
  const notSelectedButton = $(this).siblings(".guided--radio-button");

  notSelectedButton.removeClass("selected");
  notSelectedButton.addClass("not-selected basic");

  //Hide all child containers of non-selected buttons
  notSelectedButton.each(function () {
    if ($(this).data("next-element")) {
      window.nextQuestionID = $(this).data("next-element");
      $(`#${window.nextQuestionID}`).addClass("hidden");
    }
  });

  //If button has prevent-radio-handler data attribute, other buttons, will be deselected
  //but all other radio button functions will be halted
  if (selectedButton.data("prevent-radio-handler") === true) {
    return;
  }

  //Store the button's config value in window.sodaJSONObj
  if (selectedButton.data("button-config-value")) {
    let buttonConfigValue = selectedButton.data("button-config-value");
    let buttonConfigValueState = selectedButton.data("button-config-value-state");
    window.sodaJSONObj["button-config"][buttonConfigValue] = buttonConfigValueState;
  }

  selectedButton.removeClass("not-selected basic");
  selectedButton.addClass("selected");

  //Display and scroll to selected element container if data-next-element exists
  if (selectedButton.data("next-element")) {
    window.nextQuestionID = selectedButton.data("next-element");
    let nextQuestionElement = document.getElementById(window.nextQuestionID);
    nextQuestionElement.classList.remove("hidden");

    //slow scroll to the next question
    //temp fix to prevent scrolling error
    const elementsToNotScrollTo = [
      "guided-add-samples-table",
      "guided-add-pools-table",
      "guided-div-add-subjects-table",
      "guided-div-resume-progress-cards",
      "guided-div-update-uploaded-cards",
    ];
    if (!elementsToNotScrollTo.includes(nextQuestionID)) {
      nextQuestionElement.scrollIntoView({
        behavior: "smooth",
      });
    }
  }
});

export const resetGuidedRadioButtons = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
  for (const guidedRadioButton of guidedRadioButtons) {
    guidedRadioButton.classList.remove("selected");
    guidedRadioButton.classList.remove("not-selected");
    guidedRadioButton.classList.add("basic");

    //get the data-next-element attribute
    const elementButtonControls = guidedRadioButton.getAttribute("data-next-element");
    if (elementButtonControls) {
      const elementToHide = document.getElementById(elementButtonControls);
      if (!elementToHide) {
        console.error(`Element with id ${elementButtonControls} does not exist`);
      }
      elementToHide.classList.add("hidden");
    }
  }
};

export const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
  for (const guidedRadioButton of guidedRadioButtons) {
    //Get the button config value from the UI
    const buttonConfigValue = guidedRadioButton.getAttribute("data-button-config-value");
    if (buttonConfigValue) {
      const buttonConfigValueState = guidedRadioButton.getAttribute(
        "data-button-config-value-state"
      );
      if (window.sodaJSONObj["button-config"][buttonConfigValue] === buttonConfigValueState) {
        //click the button
        guidedRadioButton.click();
      }
    }
  }
};


