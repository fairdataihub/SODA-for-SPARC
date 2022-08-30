/**
 * Check if the user has a connected account with Pennsieve by checking the ini file.
 */

const { existsSync } = require("fs");

const hasConnectedAccountWithPennsieve = () => {
  log.info("Checking if the user has a connected account with Pennsieve...");
  const ini = require("ini");

  // get the path to home directory
  const homeDir = require("os").homedir();
  const path = require("path");
  const configFilePath = path.join(homeDir, ".pennsieve", "config.ini");

  if (!existsSync(configFilePath)) {
    return false;
  }

  // parse the config file
  let config = ini.parse(require("fs").readFileSync(configFilePath, "utf-8"));

  // search for a default profile key in the config
  let globalProfile = config.global;
  if (!globalProfile) return false;

  // check if default_profile has been set
  if (!globalProfile.default_profile) return false;

  let defaultProfileKey = globalProfile.default_profile;
  if (!config[defaultProfileKey]) return false;

  let defaultProfile = config[defaultProfileKey];

  // check if the default profile has a token key and secret key
  if (!defaultProfile.api_token || !defaultProfile.api_secret) return false;

  return true;
};

module.exports = { hasConnectedAccountWithPennsieve };
