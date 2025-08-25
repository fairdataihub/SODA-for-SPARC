import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedSkipPage,
  guidedUnSkipPage,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import api from "../../../others/api/api";
import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";
import { error } from "jquery";

export const savePagePennsieveDetails = async (pageBeingLeftID) => {
  const errorArray = [];
  /* if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
  
        const loggedInUserIsWorkspaceGuest = await window.isWorkspaceGuest();
        window.sodaJSONObj["last-confirmed-organization-guest-status"] = loggedInUserIsWorkspaceGuest;
  
        let userRole = null;
        let userCanModifyPennsieveMetadata = true;
  
        if (window.sodaJSONObj?.["starting-point"]?.["type"] === "bf") {
          try {
            ({ userRole, userCanModifyPennsieveMetadata } = await api.getDatasetAccessDetails(
              window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
            ));
  
            window.sodaJSONObj["last-confirmed-dataset-role"] = userRole;
          } catch (error) {
            errorArray.push({
              type: "notyf",
              message:
                "SODA was not able to determine if you have the correct permissions to edit this dataset. If you get stuck here, please contact us on the home page.",
            });
            log.error("Error determining user dataset role.", error);
            throw errorArray;
          }
        }
  
        // If the user is a workspace or guest, skip the permissions tab since they do not have permissions to modify them on Pennsieve
        if (loggedInUserIsWorkspaceGuest || !userCanModifyPennsieveMetadata) {
          guidedSkipPage("guided-designate-permissions-tab");
        } else {
          guidedUnSkipPage("guided-designate-permissions-tab");
        }
  
        if (!userCanModifyPennsieveMetadata) {
          guidedSkipPage("guided-banner-image-tab");
          guidedSkipPage("guided-assign-license-tab");
        } else {
          guidedUnSkipPage("guided-banner-image-tab");
          guidedUnSkipPage("guided-assign-license-tab");
        }
      }*/
  if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
    // Check if the user has confirmed their Pennsieve account
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
    // Check if the user has confirmed their organization
    const confirmOrganizationButton = document.getElementById(
      "guided-confirm-pennsieve-organization-button"
    );
    if (!confirmOrganizationButton.classList.contains("selected")) {
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
