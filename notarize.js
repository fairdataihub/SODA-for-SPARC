import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { notarize } from "@electron/notarize";

config();

export default async function (params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== "darwin") {
    console.log(
      "No notarization needed for current platform. This process is only intended for macOS."
    );
    return;
  }
  console.log("afterSign hook triggered", params);

  // Same appId in electron-builder.
  let appId = "com.fairdataihub.sodaforsparc";

  let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    await notarize({
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

  console.log(`Done notarizing ${appId}`);
}
