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
