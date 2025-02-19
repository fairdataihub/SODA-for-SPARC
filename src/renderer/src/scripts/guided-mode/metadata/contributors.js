export const addContributor = (
  contributorFullName,
  contributorORCID,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  //Check if the contributor already exists

  if (getContributorByOrcid(contributorORCID)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }

  //If the contributorFullName has one comma, we can successfully split the name into first and last name
  //If not, they will remain as empty strings until they are edited
  let contributorFirstName = "";
  let contributorLastName = "";
  if (contributorFullName.split(",").length === 2) {
    [contributorLastName, contributorFirstName] = contributorFullName
      .split(",")
      .map((name) => name.trim());
  }

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"].push({
    contributorFirstName: contributorFirstName,
    contributorLastName: contributorLastName,
    conName: contributorFullName,
    conID: contributorORCID,
    conAffliation: contributorAffiliationsArray,
    conRole: contributorRolesArray,
  });

  // Store the contributor locally so they can import the contributor's data in the future
  try {
    window.addOrUpdateStoredContributor(
      contributorFirstName,
      contributorLastName,
      contributorORCID,
      contributorAffiliationsArray,
      contributorRolesArray
    );
  } catch (error) {
    console.error("Failed to store contributor locally" + error);
  }
};

export const renderDatasetDescriptionContributorsTable = () => {
  const contributorsTable = document.getElementById("guided-DD-connoributors-table");

  let contributorsTableHTML;

  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

  if (contributors.length === 0) {
    contributorsTableHTML = `
        <tr>
          <td colspan="6">
            <div style="margin-right:.5rem" class="alert alert-warning guided--alert" role="alert">
              No contributors have been added to your dataset. To add a contributor, click the "Add a new contributor" button below.
            </div>
          </td>
        </tr>
      `;
  } else {
    contributorsTableHTML = contributors
      .map((contributor, index) => {
        let contributorIndex = index + 1;
        return generateContributorTableRow(contributor, contributorIndex);
      })
      .join("\n");
  }
  contributorsTable.innerHTML = contributorsTableHTML;
};

export const getContributorByOrcid = (orcid) => {
  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const contributor = contributors.find((contributor) => {
    return contributor.conID == orcid;
  });
  return contributor;
};
