import axios from "axios";

export const LAST_TESTED_PENNSIEVE_AGENT_VERSION = "v2.0.4";

/**
 *
 * @param {*} partialStringToSearch - The partial string to search for in the release name
 * @param {*} releaseList - The list of Pennsieve agent releases to search for the partial string
 * @returns - The download URL for the Pennsieve agent release that contains the partial string
 */

const findDownloadURL = (partialStringToSearch, releaseList) => {
  for (const release of releaseList) {
    const releaseName = release.name;
    if (releaseName.includes(partialStringToSearch)) {
      return release.browser_download_url;
    }
  }
  return undefined;
};

export const PennsieveAgentResolver = {
  getLastTestedPennsieveAgentUrl: async () => {
    // get the current OS
    const usersPlatform = window.process.platform();
    let platformSpecificAgentDownloadURL;

    const updatedReleaseAsset = await axios.get(
      `https://api.github.com/repos/Pennsieve/pennsieve-agent/releases/tags/${LAST_TESTED_PENNSIEVE_AGENT_VERSION}`
    );

    let latestReleaseAssets = updatedReleaseAsset.data.assets;
    let latestPennsieveAgentVersion = updatedReleaseAsset.data.tag_name;

    // Find the platform specific agent download url based on the user's platform
    let systemArchitecture;
    switch (usersPlatform) {
      case "darwin":
        // The Pennsieve has different agent releases for different architectures on MacOS
        systemArchitecture = window.process.architecture();
        if (systemArchitecture === "x64") {
          platformSpecificAgentDownloadURL = findDownloadURL("x86_64.pkg", latestReleaseAssets);
        }
        if (systemArchitecture === "arm64") {
          platformSpecificAgentDownloadURL = findDownloadURL("arm64.pkg", latestReleaseAssets);
        }
        if (!platformSpecificAgentDownloadURL) {
          platformSpecificAgentDownloadURL = findDownloadURL(".pkg", latestReleaseAssets);
        }
        break;
      case "win32":
        platformSpecificAgentDownloadURL = findDownloadURL(".msi", latestReleaseAssets);
        break;
      case "linux":
        platformSpecificAgentDownloadURL = findDownloadURL(".deb", latestReleaseAssets);
        break;
      default:
        throw new Error(`Unsupported platform: ${usersPlatform}`);
    }

    return platformSpecificAgentDownloadURL;
  },
  getLatestPennsieveAgentVersion: async () => {
    const res = await axios.get(
      "https://api.github.com/repos/Pennsieve/pennsieve-agent/releases/latest"
    );

    let latestReleaseAssets = res.data?.assets;
    let latestPennsieveAgentVersion = res.data?.tag_name;

    if (!latestReleaseAssets) {
      throw new Error("Failed to extract assets from the latest Pennsieve agent release");
    }

    if (!latestPennsieveAgentVersion) {
      throw new Error("Failed to retrieve the latest Pennsieve agent version");
    }

    const usersPlatform = window.process.platform();
    let platformSpecificAgentDownloadURL;

    if (latestPennsieveAgentVersion.includes("1.8.13") && usersPlatform === "darwin") {
      // change asset information to 1.8.9
      const updatedReleaseAsset = await axios.get(
        "https://api.github.com/repos/Pennsieve/pennsieve-agent/releases/tags/1.8.9"
      );
      latestReleaseAssets = updatedReleaseAsset.data.assets;
      latestPennsieveAgentVersion = updatedReleaseAsset.data.tag_name;
    }

    // Find the platform specific agent download url based on the user's platform
    let systemArchitecture;
    switch (usersPlatform) {
      case "darwin":
        // The Pennsieve has different agent releases for different architectures on MacOS
        systemArchitecture = window.process.architecture();
        if (systemArchitecture === "x64") {
          platformSpecificAgentDownloadURL = findDownloadURL("x86_64.pkg", latestReleaseAssets);
        }
        if (systemArchitecture === "arm64") {
          platformSpecificAgentDownloadURL = findDownloadURL("arm64.pkg", latestReleaseAssets);
        }
        if (!platformSpecificAgentDownloadURL) {
          platformSpecificAgentDownloadURL = findDownloadURL(".pkg", latestReleaseAssets);
        }
        break;
      case "win32":
        platformSpecificAgentDownloadURL = findDownloadURL(".msi", latestReleaseAssets);
        break;
      case "linux":
        platformSpecificAgentDownloadURL = findDownloadURL(".deb", latestReleaseAssets);
        break;
      default:
        throw new Error(`Unsupported platform: ${usersPlatform}`);
    }

    // Throw an error if a download url for the user's platform could not be found in the latest release
    if (!platformSpecificAgentDownloadURL) {
      throw new Error(
        `SODA has detected that a new version of the Pennsieve agent has been released, but could not find the ${usersPlatform} version.`
      );
    }

    // returning an object makes the caller code clearer and easier to extend
    return {
      platformSpecificAgentDownloadURL,
      latestPennsieveAgentVersion,
    };
  },
};
