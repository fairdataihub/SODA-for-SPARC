const fs = require("fs");
const path = require("path");
require("dotenv").config();
var electron_notarize = require("electron-notarize");

module.exports = async function (params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== "darwin") {
    return;
  }

  // Same appId in electron-builder.
  let appId = "com.fairdataihub.sodaforsparc";

  let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  try {
    await electron_notarize.notarize({
      tool: "notarytool",
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword,
      teamId: "7KPPP4K323",
    });
  } catch (error) {
    console.error(`Error notarizing ${appId}: ${error}`);
  }
};
