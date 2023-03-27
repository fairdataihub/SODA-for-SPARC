const storedContributorsPath = path.join(homeDirectory, "SODA", "stored-contributors.json");

// If the stored contributors file doesn't exist, create it and write an empty array to it
if (!fs.existsSync(storedContributorsPath)) {
  try {
    fs.writeFileSync(storedContributorsPath, "[]");
  } catch (err) {
    log.info("Error creating stored contributors file: " + err);
  }
}

// Save the contributors array to the JSON file
const saveStoredContributors = (contributors) => {
  fs.writeFileSync(storedContributorsPath, JSON.stringify(contributors));
};

// Load the stored contributors array from the JSON file
// If the file doesn't exist, return an empty array
const loadStoredContributors = () => {
  try {
    const contributorFileData = fs.readFileSync(storedContributorsPath);
    const arrayOfStoredContributors = JSON.parse(contributorFileData);
    return arrayOfStoredContributors;
  } catch (err) {
    return [];
  }
};

// Add a new contributor to the JSON file
// If a contributor with the same ORCiD already exists, update the existing contributor
function addOrUpdateStoredContributor(firstName, lastName, ORCiD, affiliationsArray, rolesArray) {
  const contributorObj = {
    firstName: firstName,
    lastName: lastName,
    ORCiD: ORCiD,
    affiliations: affiliationsArray,
    roles: rolesArray,
  };
  const storedContributorsArray = loadStoredContributors();

  const existingStoredContributorWithSameORCiDIndex = storedContributorsArray.findIndex(
    (contributorObj) => contributorObj.ORCiD === ORCiD
  );

  // If a contributor with the same ORCiD already exists, update the existing contributor
  if (existingStoredContributorWithSameORCiDIndex >= 0) {
    console.log("Updating existing contributor");
    storedContributorsArray[existingStoredContributorWithSameORCiDIndex] = contributorObj;
  } else {
    // If a contributor with the same ORCiD doesn't exist, add the new contributor
    console.log("Adding new contributor");
    storedContributorsArray.push(contributorObj);
  }
  // Write the updated array to the JSON file
  saveStoredContributors(storedContributorsArray);
}
