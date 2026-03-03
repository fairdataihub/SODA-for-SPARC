import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";
import { guidedGetCurrentUserWorkSpace } from "../../workspaces/workspaces";

export const savePageSharedWorkflowSteps = async (pageBeingLeftID) => {
  const errorArray = [];
  if (
    pageBeingLeftID === "gm-pennsieve-login-tab" ||
    pageBeingLeftID === "ffm-pennsieve-login-tab"
  ) {
    const prefix = pageBeingLeftID === "gm-pennsieve-login-tab" ? "guided" : "ffm";
    const confirmAccountButtonId = `${prefix}-confirm-pennsieve-account-button`;
    const confirmOrgButtonId = `${prefix}-confirm-pennsieve-organization-button`;

    // Check if the user has confirmed their Pennsieve account
    const userConfirmedPennsieveAccount = isCheckboxCardChecked(confirmAccountButtonId);
    if (!userConfirmedPennsieveAccount) {
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
    // Check if the user has confirmed their organization
    const userConfirmedOrganization = isCheckboxCardChecked(confirmOrgButtonId);
    if (!userConfirmedOrganization) {
      // If the user has not confirmed their organization, throw an error
      errorArray.push({
        type: "notyf",
        message: "Please confirm your organization before continuing",
      });
      throw errorArray;
    }
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
    if (userSelectedWorkSpace === "Welcome") {
      errorArray.push({
        type: "notyf",
        message: "Please change to a workspace other than 'Welcome' before continuing",
      });
      throw errorArray;
    }

    const pennsieveAgentChecksPassed = await window.getPennsieveAgentStatus();
    if (!pennsieveAgentChecksPassed) {
      const agentCheckElementId = `${prefix}-mode-post-log-in-pennsieve-agent-check`;
      window.unHideAndSmoothScrollToElement(agentCheckElementId);
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
