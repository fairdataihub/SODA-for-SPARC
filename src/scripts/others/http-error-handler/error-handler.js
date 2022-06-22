/**
 * Logs an Axios error to the console and the electron logs file
 * based off the type of error (request, response, and error).
 *
 * @param {HTTP Error} error - An Axios erro object
 */
function clientError(error) {
  let error_message = error.response.data.message;
  let error_status = error.response.status;
  let error_headers = error.response.headers;

  log.error("Error caused from: " + JSON.stringify(error_message));
  log.error("Response Status: " + JSON.stringify(error_status));
  log.error("Headers: ");
  log.error(error_headers);

  console.log("Error caused from: " + JSON.stringify(error_message));
  console.log("Response Status: " + JSON.stringify(error_status));
  console.log("Headers: ");
  console.log(error_headers);
}

/**
 *
 * @param {HTTP Error} error - The error object returned from an Axios HTTP request
 * @returns {string} - The error message to display to the user
 */
function getAxiosErrorMessage(error) {
  let errorMessage = "";
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    errorMessage = `${error.response.status} ${error.response.data.message}`;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    errorMessage =
      "The server did not respond to the request. Please try again later or contact the soda team at help@fairdataihub.org if this issue persits.";
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }

  return errorMessage;
}

module.exports = { clientError, getAxiosErrorMessage };
