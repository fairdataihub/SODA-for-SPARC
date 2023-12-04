// This file is used to download the metadata templates
// from the SODA-FOR-SPARC folder and save them to the local file system.

// Metadata Templates //
const downloadSubmission = document.getElementById("a-submission");
const downloadSamples = document.getElementById("a-samples");
const downloadSubjects = document.getElementById("a-subjects");
const downloadDescription = document.getElementById("a-description");
const downloadManifest = document.getElementById("a-manifest");

let templateArray = [
  "submission.xlsx",
  "dataset_description.xlsx",
  "subjects.xlsx",
  "samples.xlsx",
  "manifest.xlsx",
  "DataDeliverablesDocument-template.docx",
];

const downloadTemplates = (templateItem, destinationFolder) => {
  let templatePath = path.join(__dirname, "file_templates", templateItem);
  let destinationPath = path.join(destinationFolder, templateItem);

  if (fs.existsSync(destinationPath)) {
    let emessage = "File '" + templateItem + "' already exists in " + destinationFolder;
    Swal.fire({
      icon: "error",
      title: "Metadata file already exists",
      text: `${emessage}`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    ipcRenderer.send("track-event", "Error", `Download Template - ${templateItem}`);

    let templateLabel = Object.values(kombuchaEnums.Label).find((label) => {
      return label === templateItem;
    });

    ipcRenderer.send(
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
    fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath));
    let emessage = `Successfully saved '${templateItem}' to ${destinationFolder}`;

    Swal.fire({
      icon: "success",
      title: "Download successful",
      text: `${emessage}`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
    ipcRenderer.send("track-event", "Success", `Download Template - ${templateItem}`);

    let templateLabel = Object.values(kombuchaEnums.Label).find((label) => {
      return label === templateItem;
    });

    ipcRenderer.send(
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
};

downloadSubmission.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[0]);
});

downloadDescription.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[1]);
});

downloadSubjects.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[2]);
});

downloadSamples.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[3]);
});

downloadManifest.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", templateArray[4]);
});

document.querySelectorAll(".guided-data-deliverables-download-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    console.log("clicked");
    ipcRenderer.send("open-folder-dialog-save-metadata", "code_description.xlsx");
  });
});

document
  .querySelectorAll(".guided-subject-sample-pool-structure-download-button")
  .forEach((button) => {
    button.addEventListener("click", (event) => {
      ipcRenderer.send("open-folder-dialog-save-metadata", "subjects_pools_samples_structure.xlsx");
    });
  });

ipcRenderer.on("selected-metadata-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});

ipcRenderer.on("selected-DDD-download-folder", (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0]);
  }
});
