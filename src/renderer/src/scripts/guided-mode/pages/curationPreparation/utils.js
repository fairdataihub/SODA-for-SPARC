while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const getGuidedDatasetName = () => {
  return window.sodaJSONObj["digital-metadata"]["name"] || "";
};

export const getGuidedDatasetSubtitle = () => {
  return window.sodaJSONObj["digital-metadata"]["subtitle"] || "";
};
