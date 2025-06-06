/**
 * Check if the user has a connected account with Pennsieve by checking the ini file.
 */
import * as ini from "ini";

const hasConnectedAccountWithPennsieve = () => {
  window.log.info("Checking if the user has a connected account with Pennsieve...");

  // get the path to home directory
  let defaultProfile = window.getDefaultProfile();

  if (!defaultProfile) {
    return false;
  }

  // check if the default profile has a token key and secret key
  if (!defaultProfile.api_token || !defaultProfile.api_secret) {
    return false;
  }

  return true;
};

window.getDefaultProfile = () => {
  const homeDir = window.os.homedir();
  const configFilePath = window.path.join(homeDir, ".pennsieve", "config.ini");

  if (!window.fs.existsSync(configFilePath)) {
    return false;
  }

  // parse the config file
  let config = ini.parse(window.fs.readFileSync(configFilePath, "utf-8"));

  // search for a default profile key in the config
  let globalProfile = config.global;
  if (!globalProfile) {
    return false;
  }

  // check if default_profile has been set
  if (!globalProfile.default_profile) {
    return false;
  }

  let defaultProfileKey = globalProfile.default_profile;
  if (!config[defaultProfileKey]) {
    return false;
  }

  let defaultProfile = config[defaultProfileKey];

  defaultProfile["profile_key"] = defaultProfileKey;

  return defaultProfile;
};

export default hasConnectedAccountWithPennsieve;
