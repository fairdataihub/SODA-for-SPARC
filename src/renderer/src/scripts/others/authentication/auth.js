/**
 * Check if the user has a connected account with Pennsieve by checking the ini file.
 */
import * as ini from "ini"


const hasConnectedAccountWithPennsieve = () => {
  log.info("Checking if the user has a connected account with Pennsieve...");
  console.log("Checking if account connected with PS")

  // get the path to home directory
  const homeDir = window.os.homedir() 
  const configFilePath = window.path.join(homeDir, ".pennsieve", "config.ini");

  if (!window.fs.existsSync(configFilePath)) {
    console.log("failed here")
    return false;
  }

  // parse the config file
  let config = ini.parse(window.fs.readFileSync(configFilePath, "utf-8"));

  // search for a default profile key in the config
  let globalProfile = config.global;
  if (!globalProfile) {
    console.log("failed here")
    return false;
  }

  console.log("pass here")


  // check if default_profile has been set
  if (!globalProfile.default_profile) {
    console.log("failed here")
    return false;
  }

  let defaultProfileKey = globalProfile.default_profile;
  if (!config[defaultProfileKey]) {
    console.log("failed here")
    return false;
  }

  let defaultProfile = config[defaultProfileKey];

  // check if the default profile has a token key and secret key
  if (!defaultProfile.api_token || !defaultProfile.api_secret) {
    console.log("failed here")
    return false;
  }

  console.log("GOt to end of config check")
  return true;
};

export default hasConnectedAccountWithPennsieve
