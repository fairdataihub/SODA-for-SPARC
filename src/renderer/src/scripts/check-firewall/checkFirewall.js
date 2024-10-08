while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * This function checks if the client is blocked by an external firewall.
 * Assumptions: The client is connected to the internet.
 * Returns: true if the client is blocked by an external firewall, false otherwise.
 */
const clientBlockedByExternalFirewall = async () => {
  // check that the client can make an api request to Pennsieve's public API
  //make an axios request to this public endpoint: https://api.pennsieve.io/discover/datasets
  //if the request fails, the client is blocked by an external firewall
  const pennsieveURL = "https://api.pennsieve.io/discover/datasets";
  try {
    await axios.get(pennsieveURL);
    return false;
  } catch (error) {
    return true;
  }
};

// Text if there is an error:
// "We are having trouble reaching Pennsieve. Please try again later. If this issue persists it is possible that your network is blocking access to Pennsieve. Please contact your network administrator for assistance."
