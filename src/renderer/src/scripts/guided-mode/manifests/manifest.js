export const guidedCreateManifestFilesAndAddToDatasetStructure = async () => {
  // First, empty the guided_manifest_files so we can add the new manifest files
  window.fs.emptyDirSync(window.guidedManifestFilePath);

  const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"];
  for (const [highLevelFolder, _] of Object.entries(guidedManifestData)) {
    let manifestJSON = window.processManifestInfo(
      guidedManifestData[highLevelFolder]["headers"],
      guidedManifestData[highLevelFolder]["data"]
    );

    let jsonManifest = JSON.stringify(manifestJSON);

    const manifestPath = window.path.join(
      window.guidedManifestFilePath,
      highLevelFolder,
      "manifest.xlsx"
    );

    window.fs.mkdirSync(window.path.join(window.guidedManifestFilePath, highLevelFolder), {
      recursive: true,
    });

    await window.convertJSONToXlsx(JSON.parse(jsonManifest), manifestPath);
    window.datasetStructureJSONObj["folders"][highLevelFolder]["files"]["manifest.xlsx"] = {
      action: ["new"],
      path: manifestPath,
      type: "local",
    };
  }

  // wait for the manifest files to be created before continuing
  await new Promise((resolve) => setTimeout(resolve, 1000));
};


export const renderManifestCards = () => {
  const manifestCard = `
    <div class="dataset-card">        
      <div class="dataset-card-body shrink">
        <div class="dataset-card-row">
          <h1 class="dataset-card-title-text">
            <span class="manifest-folder-name">View Manifest</span>
          </h1>
        </div>
      </div>
      <div class="dataset-card-button-container">
        <button
          class="ui primary button dataset-card-button-confirm"
          style="
            width: 302px !important;
            height: 40px;
          "
          onClick="window.guidedOpenManifestEditSwal()"
        >
          Preview/Edit manifest file
        </button>
      </div>
    </div>
  `;

  const manifestFilesCardsContainer = document.getElementById(
    "guided-container-manifest-file-cards"
  );

  manifestFilesCardsContainer.innerHTML = manifestCard;

  window.smoothScrollToElement(manifestFilesCardsContainer);
};