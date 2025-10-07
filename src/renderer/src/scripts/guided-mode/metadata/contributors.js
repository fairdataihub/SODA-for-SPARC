import { addOrUpdateStoredContributor } from "../../others/contributor-storage";

export const addContributor = (
  contributor_last_name, // string: last name
  contributor_first_name, // string: first name
  contributor_orcid_id, // string: ORCID
  contributor_affiliation, // string: affiliation
  contributor_role // string: role (not array)
) => {
  // Check if the contributor already exists
  if (getContributorByOrcid(contributor_orcid_id)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }
  const contributorObj = {
    contributor_last_name,
    contributor_first_name,
    contributor_orcid_id,
    contributor_affiliation,
    contributor_role,
  };

  // Add to dataset_contributors using new schema
  window.sodaJSONObj["dataset_contributors"].push(contributorObj);

  // Store the contributor locally so they can import the contributor's data in the future
  try {
    addOrUpdateStoredContributor(contributorObj);
  } catch (error) {
    console.error("Failed to store contributor: " + error);
  }
};

export const editContributorByOrcid = (
  prevContributorOrcid,
  contributorLastName,
  contributorFirstName,
  newContributorOrcid,
  contributor_affiliation,
  contributor_role
) => {
  // Get the index of the contributor to edit
  const contributorsIndex = window.sodaJSONObj["dataset_contributors"].findIndex(
    (contributor) => contributor["contributor_orcid_id"] === prevContributorOrcid
  );

  if (contributorsIndex === -1) {
    throw new Error("No contributor with the entered ORCID exists");
  }

  if (prevContributorOrcid !== newContributorOrcid) {
    if (getContributorByOrcid(newContributorOrcid)) {
      throw new Error("A contributor with the entered ORCID already exists");
    }
  }

  // Update the contributor's information
  const updatedContributorObj = {
    contributor_orcid_id: newContributorOrcid,
    contributor_first_name: contributorFirstName,
    contributor_last_name: contributorLastName,
    contributor_affiliation: contributor_affiliation,
    contributor_role: contributor_role,
  };
  window.sodaJSONObj["dataset_contributors"][contributorsIndex] = updatedContributorObj;
  // Update local storage for the contributor
  try {
    addOrUpdateStoredContributor(updatedContributorObj);
  } catch (error) {
    console.error("Failed to update stored contributor: " + error);
  }
};

export const renderContributorsTable = () => {
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
  const contributorFullName = `${contributorObj["contributor_last_name"]}, ${contributorObj["contributor_first_name"]}`;
  const contributorOrcid = contributorObj["contributor_orcid_id"];
  const contributorRoleString = contributorObj["contributor_role"];

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
         <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-primary); border-color: var(--color-primary);"
          onclick="window.guidedOpenAddOrEditContributorSwal('${contributorOrcid}')"
        >
          Edit
        </button>
      </td>
      <td class="middle aligned">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="window.deleteContributor('${contributorOrcid}')"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};
