import { addOrUpdateStoredContributor } from "../../../others/contributor-storage";
import { CONTRIBUTORS_REGEX } from "./contributorsValidation";

// Contributor role value/display mapping for reuse throughout the app
// Note that the order of the roles here is intentional (from highest to lowest priority),
// so if you modify this list, please keep that in mind.
export const CONTRIBUTOR_ROLE_OPTIONS = {
  PrincipalInvestigator: "Principal Investigator",
  Sponsor: "Sponsor",
  ProjectLeader: "Project Leader",
  Supervisor: "Supervisor",
  CorrespondingAuthor: "Corresponding Author",
  CoInvestigator: "Co-Investigator",
  WorkPackageLeader: "Work Package Leader",
  Researcher: "Researcher",
  Creator: "Creator",
  Producer: "Producer",
  Editor: "Editor",
  DataManager: "Data Manager",
  DataCurator: "Data Curator",
  ProjectManager: "Project Manager",
  ContactPerson: "Contact Person",
  RightsHolder: "Rights Holder",
  Distributor: "Distributor",
  HostingInstitution: "Hosting Institution",
  ResearchGroup: "Research Group",
  RegistrationAuthority: "Registration Authority",
  RegistrationAgency: "Registration Agency",
  DataCollector: "Data Collector",
  ProjectMember: "Project Member",
  RelatedPerson: "Related Person",
  Other: "Other",
};

// Function that sorts an array of contributor roles based on the order defined in CONTRIBUTOR_ROLE_OPTIONS
export const sortContributorRoles = (rolesArray) => {
  const roleOrder = Object.keys(CONTRIBUTOR_ROLE_OPTIONS);
  const input = rolesArray.slice();
  const sorted = input.sort(
    (a, b) =>
      (roleOrder.indexOf(a) === -1 ? Infinity : roleOrder.indexOf(a)) -
      (roleOrder.indexOf(b) === -1 ? Infinity : roleOrder.indexOf(b))
  );

  return sorted;
};

export const addContributor = (
  contributor_name,
  contributor_orcid_id, // string: ORCID
  contributor_affiliation, // string: affiliation
  contributor_roles // array: roles
) => {
  // Check if the contributor already exists
  if (getContributorByOrcid(contributor_orcid_id)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }
  const contributorObj = {
    contributor_name,
    contributor_orcid_id,
    contributor_affiliation,
    contributor_roles,
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
  contributorName,
  newContributorOrcid,
  contributor_affiliation,
  contributor_roles
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
    contributor_name: contributorName,
    contributor_affiliation: contributor_affiliation,
    contributor_roles: contributor_roles,
  };
  window.sodaJSONObj["dataset_contributors"][contributorsIndex] = updatedContributorObj;
  // Update local storage for the contributor
  try {
    addOrUpdateStoredContributor(updatedContributorObj);
  } catch (error) {
    console.error("Failed to update stored contributor: " + error);
  }
};

const handleContributorNormalization = (contributors) => {
  // Normalize the contributor names to "Last, First MI" format; in the past the name fields were separated
  return contributors.map((contributor) => {
    if (contributor["contributor_last_name"] && contributor["contributor_first_name"]) {
      contributor["contributor_name"] =
        `${contributor["contributor_last_name"]}, ${contributor["contributor_first_name"]}`.trim();
      delete contributor["contributor_last_name"];
      delete contributor["contributor_first_name"];
    }
    return contributor;
  });
};

export const renderContributorsTable = () => {
  const contributorsTable = document.getElementById("guided-DD-connoributors-table");
  let contributorsTableHTML;
  const contributors = handleContributorNormalization(window.sodaJSONObj["dataset_contributors"]);
  window.sodaJSONObj["dataset_contributors"] = contributors; // Update the global object with normalized names

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
  const contributorFullName = contributorObj["contributor_name"];
  const contributorOrcid = contributorObj["contributor_orcid_id"];
  const contributorRoleString = sortContributorRoles(contributorObj.contributor_roles || [])
    .map((role) => CONTRIBUTOR_ROLE_OPTIONS[role] ?? role)
    .join(", ");

  let validContributorName = CONTRIBUTORS_REGEX.test(contributorFullName);
  return `
    <tr 
      data-contributor-orcid="${contributorOrcid}"
      draggable="true"
      ondragstart="window.handleContributorDragStart(event)"
      ondragover="window.handleContributorDragOver(event)"
      ondragend="window.handleContributorDrop(event)"
      style="cursor: move;"
      class="${!validContributorName ? "invalid-contributor" : ""}"
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
          style="color: white; background-color: var(--color-soda-primary); border-color: var(--color-soda-primary);"
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
