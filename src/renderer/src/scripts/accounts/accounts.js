// Purpose: Front end script for the compare local and remote dataset feature in the Advanced Features tab.
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
import * as ini from "ini";
import { addRows, removeRows } from "../../stores/slices/tableRowSlice";
import { swalShowSuccess } from "../utils/swal-utils";

const addAccountOptions = () => {
  // set default state
  addRows("account-options-table", [
    "Connect Your Pennsieve Account",
    "Change Workspace",
    "Disconnect Your Pennsieve Account",
    "Test Connection With Pennsieve",
  ]);
  // add a subscriber that listens for changes in the bf-account-span class
  $(".bf-account-span").on("DOMSubtreeModified", function () {
    if ($(this).text() === "None") {
      removeRows("account-options-table");
      addRows("account-options-table", [
        "Connect Your Pennsieve Account",
        "Change Workspace",
        "Disconnect Your Pennsieve Account",
        "Test Connection With Pennsieve",
      ]);
    } else {
      removeRows("account-options-table");
      addRows("account-options-table", [
        "Connect Another Pennsieve Account",
        "Change Workspace",
        "Disconnect Your Pennsieve Account",
        "Test Connection With Pennsieve",
      ]);
    }
  });
};

addAccountOptions();

const removeAccountInformationFromServer = (profileKey) => {
  // get every character in profileKey before the substring 'n:organization'
  let profileKeyBeforeOrg = profileKey.substring(0, profileKey.indexOf("n:organization"));

  // remove every entry in the .ini file that has the profileKeyBeforeOrg
  let homeDir = window.os.homedir();
  let configFilePath = window.path.join(homeDir, ".pennsieve", "config.ini");
  let config = ini.parse(window.fs.readFileSync(configFilePath, "utf-8"));

  if (!profileKeyBeforeOrg) {
    // NOTE: This means that the user created their account with an API Key or an older version of SODA
    // only remove the profileKey that matches the default profile value
    let defaultProfile = config["global"]["default_profile"];
    delete config[defaultProfile];
  } else {
    // delete any matching key
    Object.keys(config).forEach((key) => {
      if (key.includes(profileKeyBeforeOrg)) {
        delete config[key];
      }
    });
  }

  delete config["global"]["default_profile"];

  let text = ini.stringify(config);

  window.fs.writeFileSync(configFilePath, text);
};

window.disconnectPennsieveAccount = async (profileKey) => {
  removeAccountInformationFromServer(profileKey);

  window.defaultBfAccount = null;
  window.defaultBfDataset = null;
  window.defaultBfDatasetId = null;

  // update the account cards so that all their values are None
  // reset the dataset field values
  $("#current-bf-dataset").text("None");
  $("#current-bf-dataset-generate").text("None");
  $(".bf-dataset-span").html("None");
  $("#para-continue-bf-dataset-getting-started").text("");
  $(".bf-account-span").text("None");
  $(".bf-organization-span").text("None");

  await swalShowSuccess("Success", "Your Pennsieve account has been disconnected.");
};
