import useGlobalStore from "../../../../stores/globalStore.js";
import { guidedResetSkippedPages } from "../navigationUtils/pageSkipping.js";
import { guidedCheckIfUserNeedsToReconfirmAccountDetails } from "../../guided-curate-dataset.js";
import { initializeGuidedDatasetObject } from "../../utils/sodaJSONObj.js";
import { guidedGetCurrentUserWorkSpace } from "../../workspaces/workspaces.js";
import api from "../../../others/api/api.js";
import { setPreferredPennsieveDatasetId } from "../../../../stores/slices/pennsieveDatasetSelectSlice.js";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../../stores/slices/checkboxCardSlice.js";
import { setFreeFormDatasetName } from "../../../../stores/slices/guidedModeSlice.js";
import { guidedRenderProgressCards } from "../../resumeProgress/progressCards.js";
export const openPageSharedWorkflowSteps = async (targetPageID) => {
  if (targetPageID === "guided-select-starting-point-tab") {
    initializeGuidedDatasetObject("guided");
    guidedResetSkippedPages("gm");
    guidedRenderProgressCards("gm");
  }
  if (targetPageID === "ffm-select-starting-point-tab") {
    initializeGuidedDatasetObject("free-form");
    guidedResetSkippedPages("ffm");
    guidedRenderProgressCards("ffm");
  }
  if (targetPageID === "gm-pennsieve-login-tab" || targetPageID === "ffm-pennsieve-login-tab") {
    let prefix = targetPageID === "gm-pennsieve-login-tab" ? "gm" : "ffm";
    const agentCheckElementId = `${prefix}-section-pennsieve-agent-check`;
    const confirmAccountButtonId = `${prefix}-confirm-pennsieve-account-button`;
    const confirmOrgButtonId = `${prefix}-confirm-pennsieve-organization-button`;
    const psAccountTextId = `${prefix}-pennsieve-intro-ps-account`;

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
            document.getElementById(confirmOrgButtonId).click();
          }
        }
      } catch (error) {
        console.error("Error auto-confirming organization: ", error);
      }
    }
  }
  if (
    targetPageID === "guided-pennsieve-generate-target-tab" ||
    targetPageID === "ffm-pennsieve-generate-target-tab"
  ) {
    let prefix;
    if (targetPageID === "guided-pennsieve-generate-target-tab") {
      prefix = "gm";
    } else {
      prefix = "ffm";
      window.sodaJSONObj["generate-dataset"]["dataset-name"];
      setFreeFormDatasetName(window.sodaJSONObj?.["generate-dataset"]?.["dataset-name"] || "");
    }

    console.log(
      `Opening ${prefix}-pennsieve-generate-target-tab, checking if user needs to reconfirm account details`
    );
    await guidedCheckIfUserNeedsToReconfirmAccountDetails(prefix);
    setCheckboxCardUnchecked(`${prefix}-generate-on-new-pennsieve-dataset`);
    setCheckboxCardUnchecked(`${prefix}-generate-on-existing-pennsieve-dataset`);
    const previouslySelectedDatasetIdToUploadDataTo =
      window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"] || null;
    // If the user selected to generate on an existing Pennsieve dataset, check the corresponding checkbox card
    setPreferredPennsieveDatasetId(previouslySelectedDatasetIdToUploadDataTo);
    let isGuest = await api.userIsWorkspaceGuest();
    useGlobalStore.setState({ isGuest: isGuest });

    const pennsieveGenerationTarget = window.sodaJSONObj["pennsieve-generation-target"];
    if (pennsieveGenerationTarget === "new") {
      // If the user selected to generate on a new Pennsieve dataset, check the corresponding checkbox card
      setCheckboxCardChecked(`${prefix}-generate-on-new-pennsieve-dataset`);
    }

    if (pennsieveGenerationTarget === "existing") {
      const previouslySelectedDatasetIdToUploadDataTo =
        window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"] || null;
      // If the user selected to generate on an existing Pennsieve dataset, check the corresponding checkbox card
      setPreferredPennsieveDatasetId(previouslySelectedDatasetIdToUploadDataTo);
      setCheckboxCardChecked(`${prefix}-generate-on-existing-pennsieve-dataset`);
    }
  }
};
