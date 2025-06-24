/**
 * Generates a single manifest file from guided manifest data and adds it to the dataset structure.
 * - Empties the manifest directory before creation.
 * - Converts manifest data to XLSX and saves it.
 * - Registers the manifest in the dataset structure JSON.
 */
export const guidedCreateManifestFilesAndAddToDatasetStructure = async () => {
  // Clear the manifest directory to remove any old files
  window.fs.emptyDirSync(window.guidedManifestFilePath);

  // Retrieve manifest data from the global SODA JSON object
  const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"];
  const manifestJson = window.processManifestInfo(
    guidedManifestData["headers"],
    guidedManifestData["data"]
  );

  // Ensure the manifest directory exists
  window.fs.mkdirSync(window.guidedManifestFilePath, { recursive: true });

  // Write the manifest as an XLSX file
  const manifestPath = window.path.join(window.guidedManifestFilePath, "manifest.xlsx");
  await window.convertJSONToXlsx(manifestJson, manifestPath);

  // Register the manifest in the dataset structure JSON
  window.datasetStructureJSONObj["files"]["manifest.xlsx"] = {
    action: ["new"],
    path: manifestPath,
    location: "local",
  };

  // Wait briefly to ensure file system operations complete
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

/**
 * Renders a card UI for the manifest file with a preview/edit button.
 * Scrolls smoothly to the card after rendering.
 */
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
