export const addContributor = (
  contributor_name, // string: full name
  contributor_orcid_id, // string: ORCID
  contributor_affiliation, // string: affiliation
  contributor_role // string: role (not array)
) => {
  // Check if the contributor already exists
  if (getContributorByOrcid(contributor_orcid_id)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }

  // Add to dataset_contributors using new schema
  window.sodaJSONObj["dataset_contributors"].push({
    contributor_name,
    contributor_orcid_id,
    contributor_affiliation,
    contributor_role,
  });

  // Store the contributor locally so they can import the contributor's data in the future
};

export const editContributorByID = (
  prev_contributor_orcid_id, // string: ORCID of the contributor to edit
  contributor_name, // string: full name
  contributor_orcid_id, // string: ORCID
  contributor_affiliation, // string: affiliation
  contributor_role // string: role (not array)
) => {
  // Find the contributor by ORCID
  const contributor = getContributorByOrcid(prev_contributor_orcid_id);
  if (!contributor) {
    throw new Error("Contributor with the specified ORCID does not exist");
  }
  // Update the contributor's details
  contributor.contributor_name = contributor_name;
  contributor.contributor_orcid_id = contributor_orcid_id;
  contributor.contributor_affiliation = contributor_affiliation;
  contributor.contributor_role = contributor_role;
  // Update the stored contributor data
  try {
    window.addOrUpdateStoredContributor(
      contributor_name,
      contributor_orcid_id,
      contributor_affiliation,
      contributor_role
    );
  } catch (error) {
    console.error("Failed to update stored contributor: " + error);
  }
};

export const renderDatasetDescriptionContributorsTable = () => {
  const contributorsTable = document.getElementById("guided-DD-connoributors-table");
  let contributorsTableHTML;
  const contributors = window.sodaJSONObj["dataset_contributors"];

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
  const contributors = window.sodaJSONObj["dataset_contributors"];
  return contributors.find((contributor) => contributor.contributor_orcid_id === orcid);
};

const generateContributorTableRow = (contributorObj, contributorIndex) => {
  const contributorObjIsValid = window.contributorDataIsValid(contributorObj);
  const contributorFullName = contributorObj["contributor_name"];
  const contributorOrcid = contributorObj["contributor_orcid_id"];
  const contributorRoleString = contributorObj["contributor_role"];
  const contributorAffiliation = contributorObj["contributor_affiliation"];

  return `
    <tr 
      data-contributor-orcid="${contributorOrcid}"
      draggable="true"
      ondragstart="window.handleContributorDragStart(event)"
      ondragover="window.handleContributorDragOver(event)"
      ondragend="window.handleContributorDrop(event)"
      style="cursor: move;"
    >
      <td class="middle aligned collapsing text-center">
        ${contributorIndex}
      </td>
      <td class="middle aligned">
        ${contributorFullName}
      </td>
      <td class="middle aligned">
        ${contributorRoleString}
      </td>
      <td class="middle aligned">
        ${contributorAffiliation}
      </td>
      <td class="middle aligned collapsing text-center">
        ${
          contributorObjIsValid
            ? `<span class="badge badge-pill badge-success">Valid</span>`
            : `<span class="badge badge-pill badge-warning">Needs Modification</span>`
        }
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
          onclick="window.openGuidedContributorSwal('${contributorOrcid}')"
        >
          Edit
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="window.deleteContributor(this, '${contributorOrcid}')"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};
