while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
// Save the contributors array to the JSON file
const saveStoredContributors = (contributors) => {
  try {
    window.fs.writeFileSync(window.storedContributorsPath, JSON.stringify(contributors));
  } catch (err) {
    window.log.info("Error saving stored contributors file: " + err);
  }
};

// Load the stored contributors array from the JSON file
// If the file doesn't exist, return an empty array
window.loadStoredContributors = () => {
  try {
    const contributorFileData = window.fs.readFileSync(window.storedContributorsPath, "utf8");
    return JSON.parse(contributorFileData);
  } catch (err) {
    window.log.info("Error loading stored contributors file: " + err);
    window.log.info("Returning empty array instead");
    return [];
  }
};

// Add a new contributor to the JSON file
// If a contributor with the same ORCiD already exists, update the existing contributor
window.addOrUpdateStoredContributor = (
  firstName,
  lastName,
  ORCiD,
  affiliationsArray,
  rolesArray
) => {
  if (typeof firstName !== "string" || !firstName.length > 0) {
    window.log.info("Attempted to add contributor with invalid first name");
    return;
  }
  if (typeof lastName !== "string" || !lastName.length > 0) {
    window.log.info("Attempted to add contributor with invalid last name");
    return;
  }
  if (typeof ORCiD !== "string" || !ORCiD.length > 0) {
    window.log.info("Attempted to add contributor with invalid ORCiD");
    return;
  }
  if (!Array.isArray(affiliationsArray) || affiliationsArray.length === 0) {
    window.log.info("Invalid affiliations array");
    return;
  }
  if (!Array.isArray(rolesArray) || rolesArray.length === 0) {
    window.log.info("Invalid roles array");
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
    firstName: firstName,
    lastName: lastName,
    ORCiD: ORCiD,
    affiliations: affiliationsArray,
    roles: rolesArray,
  };

  const storedContributorsArray = window.loadStoredContributors();

  const existingStoredContributorWithSameORCiDIndex = storedContributorsArray.findIndex(
    (contributorObj) => contributorObj.ORCiD === ORCiD
  );

  // If a contributor with the same ORCiD already exists, update the existing contributor
  if (existingStoredContributorWithSameORCiDIndex >= 0) {
    storedContributorsArray[existingStoredContributorWithSameORCiDIndex] = contributorObj;
  } else {
    // If a contributor with the same ORCiD doesn't exist, add the new contributor
    storedContributorsArray.push(contributorObj);
  }
  // Write the updated array to the JSON file
  saveStoredContributors(storedContributorsArray);
};
