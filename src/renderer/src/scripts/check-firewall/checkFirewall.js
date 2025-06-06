import axios from "axios";
import { clientError } from "../others/http-error-handler/error-handler";

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
    clientError(error);
    if (!error.response) {
      // the request was made but no response was received. May be a firewall issue or the client
      // may just need to wait to try again later.
      return true;
    }

    // there is not a firewall issue if we get an actual repsonse from the server
    return false;
  }
};

let docsUrl = "https://docs.sodaforsparc.io/how-to/how-to-resolve-network-issues";
const copyClientIdToClipboard = () => {
  window.electron.ipcRenderer.invoke("clipboard-write", docsUrl, "clipboard");
};

const commonHTML = `<p style="text-align:left;">Please refer to the SODA documentation page on resolving this issue by either clicking <a href="https://docs.sodaforsparc.io/how-to/how-to-resolve-network-issues" target="_blank">here</a> or by copying the url to the documentation page with the copy icon below.</p>
  
  <div style="display:flex; margin:auto;">
    <p style="margin-right: 10px;">${docsUrl}</p>
    <div><i class="fas fa-copy" id="copy-icon-firewall-docs" click=${copyClientIdToClipboard()}></i></div>
  </div>`;

export const blockedMessage = `
  <p style="text-align:left;">SODA is unable to reach Pennsieve. Please confirm that you are connected to the internet.
  If you are connected and this issue persists it is possible that your network is blocking access to Pennsieve from SODA.
  </p>
  ${commonHTML}`;

export const hostFirewallMessage = `<p text-align:left;>SODA is unable to communicate with its server.  
    If this issue persists it is possible that your network is blocking access.
  </p>
   ${commonHTML}`;
