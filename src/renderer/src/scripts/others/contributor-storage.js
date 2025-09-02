while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Load the stored contributors array from the JSON file
// If the file doesn't exist, return an empty array
export const loadStoredContributors = () => {
  try {
    const contributorFileData = window.fs.readFileSync(window.storedContributorsPath, "utf8");
    const contributors = JSON.parse(contributorFileData);

    // Only return contributors that have the contributor_orcid_id field
    return contributors.filter((contributor) => contributor.contributor_orcid_id);
  } catch (err) {
    window.log.info("Error loading stored contributors file: " + err);
    window.log.info("Returning empty array instead");
    return [];
  }
};

export const addOrUpdateStoredContributor = (contributorObj) => {
  window.log.info("addOrUpdateStoredContributor called with:", contributorObj);
  const contributors = loadStoredContributors();
  const index = contributors.findIndex(
    (contributor) => contributor.contributor_orcid_id === contributorObj.contributor_orcid_id
  );

  if (index !== -1) {
    window.log.info(`Updating existing contributor at index ${index}:`, contributors[index]);
    contributors[index] = { ...contributors[index], ...contributorObj };
    window.log.info("Contributor updated:", contributors[index]);
  } else {
    window.log.info("Adding new contributor:", contributorObj);
    contributors.push(contributorObj);
  }

  try {
    window.fs.writeFileSync(window.storedContributorsPath, JSON.stringify(contributors));
    window.log.info("Stored contributors successfully written to file.");
  } catch (err) {
    window.log.info("Error saving stored contributors file: " + err);
  }
};
