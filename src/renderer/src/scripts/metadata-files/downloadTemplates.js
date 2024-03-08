// This file is used to download the metadata templates
// from the SODA-FOR-SPARC folder and save them to the local file system.
import kombuchaEnums from "../analytics/analytics-enums";
import Swal from "sweetalert2";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Metadata Templates //
const downloadHighLvlFolders = document.getElementById("download-high-level-folders-btn");
const downloadMetadataFiles = document.getElementById("download-manifest-only-btn");

let templateArray = [
  "submission.xlsx",
  "dataset_description.xlsx",
  "subjects.xlsx",
  "samples.xlsx",
  "manifest.xlsx",
  "DataDeliverablesDocument-template.docx",
  "code_description.xlsx",
  "resources.xlsx",
  "performances.xlsx",
  "code_description.xlsx",
  "code_parameters.xlsx",
];

let templateHighLvlFolders = ["code", "derivative", "docs", "primary", "protocol", "source"];

const downloadTemplates = async (templateItem, destinationFolder) => {
  let currentDirectory = await window.electron.ipcRenderer.invoke("get-current-directory");

  if (Array.isArray(templateItem)) {
    for (let i = 0; i < templateItem.length; i++) {
      // Create a path for each template index

      let templatePath = window.path.join(
        currentDirectory,
        "..",
        "renderer",
        "file_templates",
        templateItem[i]
      );

      // Verify if SDS Templates folder exists
      let templatesFolderPath = window.path.join(destinationFolder, "SDS Templates");
      if (!fs.existsSync(templatesFolderPath)) {
        fs.mkdirSync(templatesFolderPath);
      }

      // Verify if templateItem[i] is a high level folder
      if (templateHighLvlFolders.includes(templateItem[i])) {
        let destinationPath = window.path.join(templatesFolderPath, templateItem[i]);

        if (!fs.existsSync(destinationPath)) {
          // Create the folder if it does not exist
          fs.mkdirSync(destinationPath);
        } else {
          // Create a duplicate folder with a number appended to the end
          let j = 1;
          while (
            fs.existsSync(window.path.join(templatesFolderPath, templateItem[i] + "(" + j + ")"))
          ) {
            j++;
          }
          destinationPath = window.path.join(templatesFolderPath, templateItem[i] + "(" + j + ")");
          console.log(destinationPath);
          fs.mkdirSync(destinationPath);
        }
        // The create a .gitkeep file in the destinationPath
        console.log(destinationPath);
        fs.writeFileSync(window.path.join(destinationPath, ".gitkeep"), "");
        continue;
      }
      let destinationPath = window.path.join(destinationFolder, "SDS Templates", templateItem[i]);

      if (window.fs.existsSync(destinationPath)) {
        // Create a duplicate file with a number appended to the end
        let j = 1;
        while (
          window.fs.existsSync(
            window.path.join(templatesFolderPath, templateItem[i] + "(" + j + ")")
          )
        ) {
          j++;
        }
        destinationPath = window.path.join(templatesFolderPath, templateItem[i] + "(" + j + ")");
        // Create the file before writing to it
        // fs.appendFile(destinationPath, "");
        // console.log(destinationPath);
        await window.electron.ipcRenderer.invoke("write-template", templatePath, destinationPath);
      } else {
        // console.log("doesn't exist");
        // console.log(destinationPath);
        // Create the file before writing to it
        // fs.appendFile(destinationPath, "");
        await window.electron.ipcRenderer.invoke("write-template", templatePath, destinationPath);
      }
    }
    let emessage = `Successfully saved to ${destinationFolder}`;
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

    // let templateLabel = Object.values(kombuchaEnums.Label).find((label) => {
    //   return label === templateItem;
    // });

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
    let templatePath = window.path.join(
      currentDirectory,
      "..",
      "renderer",
      "file_templates",
      templateItem
    );

    if (window.fs.existsSync(destinationPath)) {
      let emessage = "File '" + templateItem + "' already exists in " + destinationFolder;
      Swal.fire({
        icon: "error",
        title: "Metadata file already exists",
        text: `${emessage}`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      window.electron.ipcRenderer.send(
        "track-event",
        "Error",
        `Download Template - ${templateItem}`
      );

      let templateLabel = Object.values(kombuchaEnums.Label).find((label) => {
        return label === templateItem;
      });

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
    } else {
      await window.electron.ipcRenderer.invoke("write-template", templatePath, destinationPath);
      let emessage = `Successfully saved '${templateItem}' to ${destinationFolder}`;

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

      let templateLabel = Object.values(kombuchaEnums.Label).find((label) => {
        return label === templateItem;
      });

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
  }
};

downloadHighLvlFolders.addEventListener("click", (event) => {
  const combinedArray = [...templateHighLvlFolders, ...templateArray];
  console.log("Downloading high level folders");
  console.log(combinedArray);
  window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", combinedArray);
});

// Rest of the code...

downloadMetadataFiles.addEventListener("click", (event) => {
  window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", templateArray);
});

document
  .querySelectorAll(".guided-subject-sample-pool-structure-download-button")
  .forEach((button) => {
    button.addEventListener("click", (event) => {
      window.electron.ipcRenderer.send(
        "open-folder-dialog-save-metadata",
        "subjects_pools_samples_structure.xlsx"
      );
    });
  });

window.electron.ipcRenderer.on("selected-metadata-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});

window.electron.ipcRenderer.on("selected-DDD-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});
