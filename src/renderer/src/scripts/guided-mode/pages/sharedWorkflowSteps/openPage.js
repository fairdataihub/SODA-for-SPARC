import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils.js";
import { guidedResetSkippedPages } from "../navigationUtils/pageSkipping.js";
import { guidedCheckIfUserNeedsToReconfirmAccountDetails } from "../../guided-curate-dataset.js";
import { initializeGuidedDatasetObject } from "../../utils/sodaJSONObj.js";
import { guidedGetCurrentUserWorkSpace } from "../../workspaces/workspaces.js";
import api from "../../../others/api/api.js";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice.js";

export const openPageSharedWorkflowSteps = async (targetPageID) => {
  if (targetPageID === "guided-pennsieve-login-tab" || targetPageID === "ffm-pennsieve-login-tab") {
    if (targetPageID === "ffm-pennsieve-login-tab") {
      initializeGuidedDatasetObject();
      guidedResetSkippedPages("ffm");
    }
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

    const elementsToShowWhenLoggedInToPennsieve = document.querySelectorAll(".show-when-logged-in");
    const elementsToShowWhenNotLoggedInToPennsieve =
      document.querySelectorAll(".show-when-logged-out");

    if (!window.defaultBfAccount) {
      elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
        element.classList.add("hidden");
      });
      elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
        element.classList.remove("hidden");
      });
    } else {
      elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
        element.classList.remove("hidden");
      });
      elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
        element.classList.add("hidden");
      });

      // Auto select the confirm account checkbox if the user has already logged in to Pennsieve
      // and hasn't changed their account
      const lastConfirmedAccount = window.sodaJSONObj?.["last-confirmed-ps-account-details"];
      if (window.defaultBfAccount === lastConfirmedAccount) {
        document.getElementById(confirmAccountButtonId).click();
      }

      const pennsieveIntroText = document.getElementById(psAccountTextId);
      // fetch the user's email and set that as the account field's value
      try {
        const userInformation = await api.getUserInformation();
        const userEmail = userInformation.email;
        console.log("user email: ", userEmail);
        pennsieveIntroText.innerHTML = userEmail;
      } catch (err) {
        console.error("Error fetching user email:", err);
        pennsieveIntroText.innerHTML = "";
      }

      try {
        if (window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"]) {
          if (
            window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] ===
            guidedGetCurrentUserWorkSpace()
          ) {
            console.log(
              "Auto-confirming organization since user is on the same workspace as last time: ",
              guidedGetCurrentUserWorkSpace()
            );
            document.getElementById(confirmOrgButtonId).click();
          }
        }
      } catch (error) {
        console.error("Error auto-confirming organization: ", error);
      }
    }
  }
};
