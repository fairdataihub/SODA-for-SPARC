while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Save the contributors array to the JSON file
window.saveStoredContributors = (contributors) => {
  // Map contributors to schema before saving
  const mappedContributors = contributors.map((contributor) => ({
    contributor_orcid_id: contributor.contributor_orcid_id,
    contributor_affiliation: contributor.contributor_affiliation,
    contributor_name: contributor.contributor_name,
    contributor_role: contributor.contributor_role,
  }));
  try {
    window.fs.writeFileSync(window.storedContributorsPath, JSON.stringify(mappedContributors));
  } catch (err) {
    window.log.info("Error saving stored contributors file: " + err);
  }
};

// Load the stored contributors array from the JSON file
// If the file doesn't exist, return an empty array
window.loadStoredContributors = () => {
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
