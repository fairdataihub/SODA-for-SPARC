const api = require("../api/api");

/**
 * Logs an error object to the console and SODA logs. Handles general errors and Axios errors.
 *
 * @param {error} error - A general or Axios error object
 */
const clientError = (error) => {
  // Handles gneral errors and getting basic information from Axios errors
  console.error(error);
  log.error(JSON.stringify(error));

  // Handle logging for Axios errors in greater detail
  if (error.response) {
    let error_message = error.response.data.message;
    let error_status = error.response.status;
    let error_headers = error.response.headers;

    log.error("Error message: " + JSON.stringify(error_message));
    log.error("Response Status: " + JSON.stringify(error_status));
    log.error("Request config: ");
    log.error(JSON.stringify(error.config));
    log.error("Response Headers: ");
    log.error(JSON.stringify(error_headers));

    console.log(`Error caused from: ${error_message}`);
    console.log(`Response Status: ${error_status}`);
    console.log("Headers:");
    console.log(error_headers);
  } else if (error.request) {
    // The request was made but no response was received
    log.error(error.request);
  }
};

/**
 * Given an error object, take the message out of the appropriate error property and present it in a readable format.
 * Useful for getting a useful error message out of both Axios and general errors.
 * @param {Error} error - The error object. Can be a general Error or an Axios subclass.
 * @returns {string} - The error message to display to the user
 */
const userErrorMessage = (error) => {
  let errorMessage = "";
  if (error.response) {
    console.log("userResponse");
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    errorMessage = `${error.response.data.message}`;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.error(error);
    errorMessage =
      "The server did not respond to the request. Please try again later or contact the soda team at help@fairdataihub.org if this issue persits.";
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }

  // If the error message contains a 423, it means the dataset is locked.
  if (errorMessage.includes("423")) {
    errorMessage = `Your dataset is locked. If you would like to make changes to this dataset, please reach out to the SPARC Curation Team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>`;
  }

  return errorMessage;
};

const authenticationError = (error) => {
  console.log("Is auhenticaiton error check happening");
  if (!error.response) return false;
  return error.response.status === 401;
};

const defaultProfileMatchesCurrentWorkspace = async () => {
  let userInfo = await api.getUserInformation();
  let currentWorkspace = userInfo["preferredOrganization"];
  // the default profile value, if one exists, has the current workspace id
  // as a suffix: soda-pennsieve-51b6-cmarroquin-n:organization:f08e188e-2316-4668-ae2c-8a20dc88502f
  // get the workspace id that starts with n:organization out of the above string
  // NOTE: The 'N' is lowercased when stored in the config.ini file hence the difference in casing
  let defaultProfileWorkspace = defaultBfAccount.slice(
    defaultBfAccount.indexOf("n:organization") + 15
  );
  currentWorkspace = currentWorkspace.slice(currentWorkspace.indexOf("N:organization") + 15);

  console.log(defaultProfileWorkspace);
  console.log(currentWorkspace);

  return defaultProfileWorkspace === currentWorkspace;
};

const switchToCurrentWorkspace = async () => {
  let workspacesMatch = await defaultProfileMatchesCurrentWorkspace();

  if (workspacesMatch) {
    // obsolete/invalid api key and secret needs to be replaced
    await addBfAccount(null, false);
    return;
  }

  // we are in the wrong workspace
  // check if there is a profile with a valid api key and secret for this user for their current workspace
  const { username } = os.userInfo();
  let userInfo = await api.getUserInformation();
  let currentWorkspace = userInfo["preferredOrganization"];
  let emailSuffix = userInfo["email"].split("@")[0];

  // let emailSuffix = defaultBfAccount.
  let targetProfile = `soda-pennsieve-${localStorage.getItem(
    username
  )}-${emailSuffix}-${currentWorkspace.toLowerCase()}`;
  targetProfile = targetProfile.toLowerCase();

  console.log("Switching to the target profile: " + targetProfile);

  try {
    // set the target profile as the default if it is a valid profile that exists
    await api.setDefaultProfile(targetProfile);
    defaultBfAccount = targetProfile;
    console.log("Switched the profile successfully");
    // // return as we have successfully set the default profile to the one that matches the current workspace
    // TODO: Reset the UI to reflect the new default profile
    try {
      let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
        params: {
          selected_account: defaultBfAccount,
        },
      });
      // reset the dataset field values
      $("#current-bf-dataset").text("None");
      $("#current-bf-dataset-generate").text("None");
      $(".bf-dataset-span").html("None");
      $("#para-continue-bf-dataset-getting-started").text("");

      // set the workspace field values to the user's current workspace
      let org = bf_account_details_req.data.organization;
      $(".bf-organization-span").text(org);

      showHideDropdownButtons("account", "show");
      confirm_click_account_function();
      updateBfAccountList();

      //   // If the clicked button has the data attribute "reset-guided-mode-page" and the value is "true"
      //   // then reset the guided mode page
      //   if (ev?.getAttribute("data-reset-guided-mode-page") == "true") {
      //     // Get the current page that the user is on in the guided mode
      //     const currentPage = CURRENT_PAGE.id;
      //     if (currentPage) {
      //       await openPage(currentPage);
      //     }
      //   }
    } catch (error) {
      clientError(error);
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        text: "Something went wrong!",
        footer:
          '<a target="_blank" href="https://docs.pennsieve.io/docs/configuring-the-client-credentials">Why do I have this issue?</a>',
      });
      showHideDropdownButtons("account", "hide");
      confirm_click_account_function();
    }

    datasetList = [];
    defaultBfDataset = null;
    clearDatasetDropdowns();
    return;
  } catch (err) {
    clientError(err);
    console.log("Target profile did not have a valid api key and secret for the current workspace");
  }

  // if not have them log in to add a new profile/overwrite the invalid/obsolete api key and secret for the current workspace
  await addBfAccount(null, true);
};

export {
  clientError,
  userErrorMessage,
  authenticationError,
  switchToCurrentWorkspace,
  defaultProfileMatchesCurrentWorkspace,
};
