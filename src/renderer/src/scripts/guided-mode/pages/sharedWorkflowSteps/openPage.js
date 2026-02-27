import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils.js";
import { guidedResetSkippedPages } from "../navigationUtils/pageSkipping.js";
import { guidedCheckIfUserNeedsToReconfirmAccountDetails } from "../../guided-curate-dataset.js";
import api from "../../../others/api/api.js";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice.js";

export const openPageSharedWorkflowSteps = async (targetPageID) => {
  if (targetPageID === "guided-pennsieve-login-tab" || targetPageID === "ffm-pennsieve-login-tab") {
    const tabType = targetPageID.includes("ffm") ? "ffm" : "guided";
    const prefix = tabType;
    const agentCheckElementId = `${prefix}-section-pennsieve-agent-check`;
    const selectAccountId = `${prefix}-select-pennsieve-account`;
    const confirmAccountId = `${prefix}-confirm-pennsieve-account`;
    const confirmAccountButtonId = `${prefix}-confirm-pennsieve-account-button`;
    const confirmOrgButtonId = `${prefix}-confirm-pennsieve-organization-button`;
    const psAccountTextId = `${prefix}-pennsieve-intro-ps-account`;

    console.log(
      `Opening ${prefix}-pennsieve-login-tab, checking if user needs to reconfirm account details`
    );

    // Hide the Pennsieve agent check section initially (it gets shown after confirming organization)
    document.getElementById(agentCheckElementId).classList.add("hidden");

    // Check if this page has been completed before
    const completedIntro = window.sodaJSONObj?.["completed-tabs"]?.includes(targetPageID) || false;

    if (completedIntro) {
      const { accountSame, workspaceSame } = guidedCheckIfUserNeedsToReconfirmAccountDetails();

      const signInUI = document.getElementById(selectAccountId);
      const confirmAccountUi = document.getElementById(confirmAccountId);

      if (!window.defaultBfAccount) {
        signInUI.classList.remove("hidden");
        confirmAccountUi.classList.add("hidden");
      } else {
        signInUI.classList.add("hidden");
        confirmAccountUi.classList.remove("hidden");
        if (accountSame) {
          // Since this is the same account as last time, auto-click the confirm account checkbox
          document.getElementById(confirmAccountButtonId).click();
        }

        if (workspaceSame) {
          // Since this is the same workspace as last time, auto-click the confirm organization checkbox
          document.getElementById(confirmOrgButtonId).click();
        }

        const pennsieveIntroText = document.getElementById(psAccountTextId);
        // fetch the user's email and set that as the account field's value
        try {
          const userInformation = await api.getUserInformation();
          const userEmail = userInformation.email;
          console.log("user email: ", userEmail);
          pennsieveIntroText.innerHTML = userEmail;
        } catch (err) {
          pennsieveIntroText.innerHTML = "";
        }
      }
    }
  }
  if (targetPageID === "ffm-select-starting-point-tab") {
    //initializeGuidedDatasetObject();
    guidedResetSkippedPages("ffm");
  }
  if (targetPageID === "guided-select-starting-point-tab") {
    //initializeGuidedDatasetObject();
    guidedResetSkippedPages("gm");
  }

  if (targetPageID === "guided-name-subtitle-tab") {
    // Get the dataset name and subtitle from the JSON obj
    const datasetName = getGuidedDatasetName() || "";

    // Set the zustand datasetName state value to the dataset name
    setGuidedDatasetName(datasetName);

    const datasetSubtitle = getGuidedDatasetSubtitle();
    setGuidedDatasetSubtitle(datasetSubtitle);
  }
};
