// Purpose: When running GUI packaged app on MacOS, the PATH environment variable is not set correctly.
//         This script is to fix the issue by adding the missing paths to the PATH environment variable.

/**
 *  Fix the PATH environment variable on MacOS when running GUI packaged app by updating the process to have the missing PATHS.
 */
const fixPath = () => {
  if (process.platform == "darwin") {
    process.env.PATH = [
      "./node_modules/.bin",
      "/.nodebrew/current/bin",
      "/usr/local/bin",
      "/usr/local/opt",
      process.env.PATH,
    ].join(":");
  }
};

module.exports = fixPath;
