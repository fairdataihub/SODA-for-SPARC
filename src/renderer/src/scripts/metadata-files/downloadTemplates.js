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
const templateArray = [
  "CHANGES",
  "code_description.xlsx",
  "code_parameters.xlsx",
  "dataset_description.xlsx",
  "LICENSE",
  "manifest.xlsx",
  "performances.xlsx",
  "README.md",
  "resources.xlsx",
  "samples.xlsx",
  "sites.xlsx",
  "subjects.xlsx",
  ".dss",
  "submission.xlsx",
];

const templateHighLvlFolders = ["code", "derivative", "docs", "primary", "protocol", "source"];

const resolveTemplatePath = async (templateName) => {
  const appPath = await window.electron.ipcRenderer.invoke("get-app-path");
  const templatePath = window.path.join(appPath, "file_templates", templateName);

  if (!window.fs.existsSync(templatePath)) {
    throw new Error(`Could not locate template '${templateName}'. Checked: ${templatePath}`);
  }

  return templatePath;
};

const downloadTemplates = async (templateItem, destinationFolder, helperConfig) => {
  const isMultipleTemplates = Array.isArray(templateItem);
  const templatesToDownload = isMultipleTemplates ? templateItem : [templateItem];

  let templatesFolderPath = destinationFolder;

  if (isMultipleTemplates) {
    const baseFolderName = "SDS Templates";
    let folderName = baseFolderName;
    let duplicateIndex = 1;

    templatesFolderPath = window.path.join(destinationFolder, folderName);

    while (window.fs.existsSync(templatesFolderPath)) {
      folderName = `${baseFolderName}(${duplicateIndex})`;
      templatesFolderPath = window.path.join(destinationFolder, folderName);
      duplicateIndex++;
    }

    window.fs.mkdirSync(templatesFolderPath);
  }

  for (const templateName of templatesToDownload) {
    const isHighLevelFolder = templateHighLvlFolders.includes(templateName);

    if (isHighLevelFolder) {
      const folderPath = window.path.join(templatesFolderPath, templateName);

      if (!window.fs.existsSync(folderPath)) {
        window.fs.mkdirSync(folderPath);
      }

      continue;
    }

    let templatePath;

    try {
      templatePath = await resolveTemplatePath(templateName);
    } catch (err) {
      if (isMultipleTemplates) {
        console.warn(`Template not found for '${templateName}':`, err.message);

        window.log?.warn?.(`Template not found for '${templateName}'`, err.message);

        continue;
      }

      throw err;
    }

    const destinationPath = window.path.join(
      isMultipleTemplates ? templatesFolderPath : destinationFolder,
      templateName
    );

    const fileExists = window.fs.existsSync(destinationPath);

    if (!isMultipleTemplates && fileExists) {
      const isConfirmed = await swalConfirmAction(
        "warning",
        "Metadata file already exists",
        `File '${templateName}' already exists in ${destinationFolder}. Do you want to replace it?`,
        "Replace",
        "Cancel"
      );

      if (!isConfirmed) {
        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          `Download Template - ${templateName} (User cancelled replace)`
        );

        return;
      }
    }

    if (!fileExists || !isMultipleTemplates) {
      await window.electron.ipcRenderer.invoke(
        "write-template",
        templatePath,
        destinationPath,
        helperConfig
      );
    }
  }

  const successMessage = isMultipleTemplates
    ? `Successfully saved to ${destinationFolder}`
    : `Successfully saved '${templateItem}' to ${destinationFolder}`;

  Swal.fire({
    icon: "success",
    title: "Download successful",
    text: successMessage,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });

  window.electron.ipcRenderer.send("track-event", "Success", `Download Template - ${templateItem}`);

  const kombuchaLabel = isMultipleTemplates
    ? templateItem
    : Object.values(kombuchaEnums.Label).find((label) => label === templateItem);

  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.PREPARE_METADATA,
    kombuchaEnums.Action.DOWNLOAD_TEMPLATES,
    kombuchaLabel,
    kombuchaEnums.Status.SUCCESS,
    {
      value: 1,
    }
  );
};
downloadHighLvlFolders.addEventListener("click", () => {
  const combinedArray = [...templateHighLvlFolders, ...templateArray];
  window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", combinedArray, null);
});

downloadMetadataFiles.addEventListener("click", () => {
  window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", templateArray, null);
});

window.electron.ipcRenderer.on(
  "selected-metadata-download-folder",
  (event, path, filename, helperConfig) => {
    window.log.info("selected-metadata-download-folder", { path, filename, helperConfig });
    if (Array.isArray(path) && path.length > 0) {
      try {
        downloadTemplates(filename, path[0], helperConfig);
      } catch (err) {
        window.log.error("downloadTemplates failed", err);
        console.error("downloadTemplates failed", err);
        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          `Download Template - ${filename} (Error)`
        );
      }
    } else {
      window.log.warn("No path selected for metadata download", { filename });
      console.warn("No path selected for metadata download", filename);
    }
  }
);

window.electron.ipcRenderer.on("selected-DDD-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});
