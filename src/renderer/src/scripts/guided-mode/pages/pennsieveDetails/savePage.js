import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedSkipPage,
  guidedUnSkipPage,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";

export const savePagePennsieveDetails = async (pageBeingLeftID) => {
  const errorArray = [];
  if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
    const confirmAccountbutton = document.getElementById("guided-confirm-pennsieve-account-button");
    if (!confirmAccountbutton.classList.contains("selected")) {
      if (!window.defaultBfAccount) {
        // If the user has not logged in, throw an error
        errorArray.push({
          type: "notyf",
          message: "Please sign in to Pennsieve before continuing",
        });
        throw errorArray;
      } else {
        // If the user has not confirmed their account, throw an error
        errorArray.push({
          type: "notyf",
          message: "Please confirm your account before continuing",
        });
        throw errorArray;
      }
    }
    const confirmOrganizationButton = document.getElementById(
      "guided-confirm-pennsieve-organization-button"
    );
    const userSelectedWorkSpace = guidedGetCurrentUserWorkSpace();
    if (!userSelectedWorkSpace) {
      // If the user has not selected an organization, throw an error
      errorArray.push({
        type: "notyf",
        message: "Please select an organization before continuing",
      });
      throw errorArray;
    } else {
      window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = userSelectedWorkSpace;
    }
    if (!confirmOrganizationButton.classList.contains("selected")) {
      // If the user has not confirmed their organization, throw an error
      errorArray.push({
        type: "notyf",
        message: "Please confirm your organization before continuing",
      });
      throw errorArray;
    }
    const pennsieveAgentChecksPassed = await window.getPennsieveAgentStatus();
    if (!pennsieveAgentChecksPassed) {
      window.unHideAndSmoothScrollToElement("guided-mode-post-log-in-pennsieve-agent-check");
      errorArray.push({
        type: "notyf",
        message: "The Pennsieve Agent must be installed and running to continue.",
      });
      throw errorArray;
    }
    window.sodaJSONObj["last-confirmed-ps-account-details"] = window.defaultBfAccount;
    window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] = userSelectedWorkSpace;
  }
};
