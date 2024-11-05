import axios from "axios";

/**
 * This function checks if the client is blocked by an external firewall.
 * Assumptions: The client is connected to the internet.
 * Returns: true if the client is blocked by an external firewall, false otherwise.
 */
export const clientBlockedByExternalFirewall = async (url) => {
  // check that the client can make an api request to Pennsieve's public API
  //make an axios request to this public endpoint: https://api.pennsieve.io/discover/datasets
  //if the request fails, the client is blocked by an external firewall
  try {
    await axios.get(url);
    return false;
  } catch (error) {
    return true;
  }
};

export const blockedMessage =
  "SODA is unable to reach Pennsieve. Please check that you are connected to the internet. On rare occasions Pennsieve is not available for short periods of time. If you intend to upload to the Pennsieve platform please try again later. If this issue persists and you have confirmed internet connectivity then it is possible that your network is blocking access to Pennsieve from SODA. You may need to contact your network administrator for assistance.";
export const hostFirewallMessage =
  "SODA is unable to communicate with its server.  If this issue persists it is possible that your network is blocking access. You may need to contact your network administrator for assistance.";
