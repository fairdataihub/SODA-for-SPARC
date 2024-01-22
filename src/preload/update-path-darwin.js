// Purpose: When running GUI packaged app on MacOS, the PATH environment variable is not set correctly.
//         This script is to fix the issue by adding the missing paths to the PATH environment variable.

/**
 *  Fix the PATH environment variable on MacOS when running GUI packaged app by updating the process to have the missing PATHS.
 */
const fixPath = () => {
  if (window.process.platform == "darwin") {

    window.process.env.PATH = [
      "./node_modules/.bin",
      "/.nodebrew/current/bin",
      "/usr/local/bin",
      "/usr/local/opt",
      "/usr/local/opt/pennsieve", // Ventura installation folder; Note: On Ventura the Agent isn't added to the Path
      window.process.env.PATH,
    ].join(":");

  }
};

export default fixPath;
