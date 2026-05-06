// This file is used to download the metadata templates
// from the SODA-FOR-SPARC folder and save them to the local file system.
import kombuchaEnums from "../analytics/analytics-enums";
import Swal from "sweetalert2";
import { swalConfirmAction } from "../utils/swal-utils";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Metadata Templates //
const downloadHighLvlFolders = document.getElementById("download-high-level-folders-btn");
const downloadMetadataFiles = document.getElementById("download-manifest-only-btn");

// If files are added or removed from the file_templates folder, update the templateArray and templateHighLvlFolders
let templateArray = [
  "submission.xlsx",
  "dataset_description.xlsx",
  "subjects.xlsx",
  "samples.xlsx",
  "manifest.xlsx",
  "code_description.xlsx",
  "resources.xlsx",
  "performances.xlsx",
  "code_description.xlsx",
  "CHANGES",
  "README.md",
  ".dss",
];

let templateHighLvlFolders = ["code", "derivative", "docs", "primary", "protocol", "source"];

const resolveTemplatePath = async (templateName) => {
  const currentDirectory = await window.electron.ipcRenderer.invoke("get-current-directory");
  const appPath = await window.electron.ipcRenderer.invoke("get-app-path");

  const candidateTemplateDirs = [
    // Dev/workspace root
    window.path.join(appPath, "file_templates"),
    // Renderer public assets location
    window.path.join(appPath, "src", "renderer", "public", "file_templates"),
    // Legacy path from main build output
    window.path.join(currentDirectory, "..", "renderer", "file_templates"),
  ];

  console.log("Template directory candidates:", candidateTemplateDirs);

  for (const templateDir of candidateTemplateDirs) {
    const candidatePath = window.path.join(templateDir, templateName);
    if (window.fs.existsSync(candidatePath)) {
      console.log("Resolved template path:", candidatePath);
      return candidatePath;
    }
  }

  throw new Error(
    `Could not locate template '${templateName}'. Checked: ${candidateTemplateDirs.join(", ")}`
  );
};

const downloadTemplates = async (templateItem, destinationFolder) => {
  console.log("downloadTemplates called", { templateItem, destinationFolder });

  const ensureDir = (dirPath) => {
    if (!window.fs.existsSync(dirPath)) {
      window.fs.mkdirSync(dirPath);
    }
  };

  if (Array.isArray(templateItem)) {
    // Verify if SDS Templates folder exists
    let sds_folder = "SDS Templates";
    let templatesFolderPath = window.path.join(destinationFolder, sds_folder);
    if (!window.fs.existsSync(templatesFolderPath)) {
      window.fs.mkdirSync(templatesFolderPath);
    } else {
      // Create a duplicate folder with a number appended to the end
      let j = 1;
      while (
        window.fs.existsSync(window.path.join(destinationFolder, sds_folder + "(" + j + ")"))
      ) {
        j++;
      }
      templatesFolderPath = window.path.join(
        window.path.join(destinationFolder, sds_folder + "(" + j + ")")
      );
      sds_folder = sds_folder + "(" + j + ")";
      window.fs.mkdirSync(templatesFolderPath);
    }

    for (const name of templateItem) {
      // High-level folder: create directory and skip file resolution
      if (templateHighLvlFolders.includes(name)) {
        const destinationPath = window.path.join(templatesFolderPath, name);
        ensureDir(destinationPath);
        continue;
      }

      // Resolve actual template file path for non-folder entries
      let templatePath;
      try {
        templatePath = await resolveTemplatePath(name);
      } catch (err) {
        // Log and skip missing optional templates instead of throwing
        console.warn(`Template not found for '${name}':`, err.message);
        window.log?.warn && window.log.warn(`Template not found for '${name}'`, err.message);
        continue;
      }

      const destinationPath = window.path.join(destinationFolder, sds_folder, name);
      if (!window.fs.existsSync(destinationPath)) {
        await window.electron.ipcRenderer.invoke("write-template", templatePath, destinationPath);
      }
    }

    const emessage = `Successfully saved to ${destinationFolder}`;
    Swal.fire({
      icon: "success",
      title: "Download successful",
      text: `${emessage}`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    window.electron.ipcRenderer.send(
      "track-event",
      "Success",
      `Download Template - ${templateItem}`
    );

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.DOWNLOAD_TEMPLATES,
      templateItem,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
      }
    );
  } else {
    const templatePath = await resolveTemplatePath(templateItem);

    // Fix: Define destinationPath before using it
    const destinationPath = window.path.join(destinationFolder, templateItem);

    if (window.fs.existsSync(destinationPath)) {
      const isConfirmed = await swalConfirmAction(
        "warning",
        "Metadata file already exists",
        `File '${templateItem}' already exists in ${destinationFolder}. Do you want to replace it?`,
        "Replace",
        "Cancel"
      );
      if (!isConfirmed) {
        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          `Download Template - ${templateItem} (User cancelled replace)`
        );
        return;
      }
    }

    await window.electron.ipcRenderer.invoke("write-template", templatePath, destinationPath);
    const emessage = `Successfully saved '${templateItem}' to ${destinationFolder}`;

    Swal.fire({
      icon: "success",
      title: "Download successful",
      text: `${emessage}`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    window.electron.ipcRenderer.send(
      "track-event",
      "Success",
      `Download Template - ${templateItem}`
    );
    const templateLabel = Object.values(kombuchaEnums.Label).find(
      (label) => label === templateItem
    );
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.DOWNLOAD_TEMPLATES,
      templateLabel,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
      }
    );
  }

  console.log("downloadTemplates completed", { templateItem, destinationFolder });
};

downloadHighLvlFolders.addEventListener("click", () => {
  const combinedArray = [...templateHighLvlFolders, ...templateArray];
  window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", combinedArray);
});

downloadMetadataFiles.addEventListener("click", () => {
  window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", templateArray);
});

document
  .querySelectorAll(".guided-subject-sample-pool-structure-download-button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      window.electron.ipcRenderer.send(
        "open-folder-dialog-save-metadata",
        "subjects_pools_samples_structure.xlsx"
      );
    });
  });

window.electron.ipcRenderer.on("selected-metadata-download-folder", (event, path, filename) => {
  window.log?.info && window.log.info("selected-metadata-download-folder", { path, filename });
  console.log("selected-metadata-download-folder", { path, filename });
  if (Array.isArray(path) && path.length > 0) {
    try {
      downloadTemplates(filename, path[0]);
      window.log?.info &&
        window.log.info("downloadTemplates invoked", { filename, destination: path[0] });
    } catch (err) {
      window.log?.error && window.log.error("downloadTemplates failed", err);
      console.error("downloadTemplates failed", err);
      window.electron.ipcRenderer.send(
        "track-event",
        "Error",
        `Download Template - ${filename} (Error)`
      );
    }
  } else {
    window.log?.warn && window.log.warn("No path selected for metadata download", { filename });
    console.warn("No path selected for metadata download", filename);
  }
});

window.electron.ipcRenderer.on("selected-DDD-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});
