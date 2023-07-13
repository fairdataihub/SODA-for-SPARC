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
    console.log("user.message");
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }

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

const handleAuthenticationError = async () => {
  let workspacesMatch = await defaultProfileMatchesCurrentWorkspace();

  if (workspacesMatch) {
    await addBfAccount(null, false);
    return;
  }

  await addBfAccount(null, true);
};

module.exports = {
  clientError,
  userErrorMessage,
  authenticationError,
  handleAuthenticationError,
  defaultProfileMatchesCurrentWorkspace,
};
