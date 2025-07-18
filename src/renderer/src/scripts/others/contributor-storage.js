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

// Add a new contributor to the JSON file
// If a contributor with the same ORCiD already exists, update the existing contributor
window.addOrUpdateStoredContributor = (
  contributor_orcid_id,
  contributor_affiliation,
  contributor_name,
  contributor_role
) => {
  if (typeof contributor_orcid_id !== "string" || !contributor_orcid_id.length > 0) {
    window.log.info("Attempted to add contributor with invalid ORCiD");
    return;
  }
  if (typeof contributor_affiliation !== "string" || !contributor_affiliation.length > 0) {
    window.log.info("Invalid contributor affiliation");
    return;
  }
  if (typeof contributor_name !== "string" || !contributor_name.length > 0) {
    window.log.info("Invalid contributor name");
    return;
  }
  if (typeof contributor_role !== "string" || !contributor_role.length > 0) {
    window.log.info("Invalid contributor role");
    return;
  }

  // If the stored contributors file doesn't exist, create it and write an empty array to it
  if (!window.fs.existsSync(window.storedContributorsPath)) {
    try {
      window.fs.writeFileSync(window.storedContributorsPath, "[]");
    } catch (err) {
      window.log.info("Error creating stored contributors file: " + err);
      return;
    }
  }

  const contributorObj = {
    contributor_orcid_id,
    contributor_affiliation,
    contributor_name,
    contributor_role,
  };

  const storedContributorsArray = window.loadStoredContributors();

  const existingStoredContributorWithSameORCiDIndex = storedContributorsArray.findIndex(
    (contributorObj) => contributorObj.contributor_orcid_id === contributor_orcid_id
  );

  // If a contributor with the same ORCiD already exists, update the existing contributor
  if (existingStoredContributorWithSameORCiDIndex >= 0) {
    storedContributorsArray[existingStoredContributorWithSameORCiDIndex] = contributorObj;
  } else {
    // If a contributor with the same ORCiD doesn't exist, add the new contributor
    storedContributorsArray.push(contributorObj);
  }
  // Write the updated array to the JSON file
  window.saveStoredContributors(storedContributorsArray);
};
