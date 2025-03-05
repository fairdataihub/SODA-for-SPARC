import Swal from "sweetalert2";
import useGlobalStore from "../../../stores/globalStore";
import {
  addSubject,
  getExistingSubjectIds,
  getExistingSampleIds,
  getExistingPerformanceIds,
  getExistingSiteIds,
  addSampleToSubject,
  addPerformanceToSubject,
  addPerformanceToSample,
  addSiteToSample,
  addSiteToSubject,
} from "../../../stores/slices/datasetEntityStructureSlice";
export const guidedOpenEntityAdditionSwal = async ({ entityType, subjectId, sampleId }) => {
  console.log("guidedOpenEntityAdditionSwal called");
  console.log("entityType", entityType);
  console.log("subjectId", subjectId);
  console.log("sampleId", sampleId);
  // Get a list of the existing entities so we can check for duplicates
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;

  const datasetEntityArray = useGlobalStore.getState().datasetEntityArray;
  console.log("datasetEntityArray", datasetEntityArray);

  // case when adding subjects
  if (entityType === "subjects") {
    preExistingEntities = getExistingSubjectIds();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  }

  if (entityType === "samples") {
    preExistingEntities = getExistingSampleIds();
    console.log("preExistingEntities", preExistingEntities);
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  }

  if (entityType === "performances") {
    preExistingEntities = getExistingPerformanceIds();
    console.log("preExistingEntities", preExistingEntities);
    entityNameSingular = "performance";
    entityPrefix = "perf-";
  }

  // Add sites entity type
  if (entityType === "sites") {
    preExistingEntities = getExistingSiteIds();
    console.log("preExistingEntities", preExistingEntities);
    entityNameSingular = "site";
    entityPrefix = "site-";
  }

  let newEntities = [];

  const handleSwalEntityAddition = (entityName) => {
    if (entityName.length < 1) {
      throw new Error(`Please enter a ${entityNameSingular} name`);
    }
    // Check to see if the subjectName starts with sub- otherwise prepend sub- to it
    if (!entityName.startsWith(entityPrefix)) {
      entityName = `${entityPrefix}${entityName}`;
    }
    // Check to see if the subjectName already exists
    if (preExistingEntities.includes(entityName) || newEntities.includes(entityName)) {
      throw new Error(`${entityNameSingular} name has already been added`);
    }

    const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
      entityName,
      "string-adheres-to-identifier-conventions"
    );

    if (!entityNameIsValid) {
      throw new Error(`${entityNameSingular} names may not contain spaces or special characters`);
    }

    // Hide any validation messages that may exist in the sweet alert
    Swal.resetValidationMessage();

    // Add the subject to the beginning of the subjects array
    newEntities.unshift(entityName);
    // Re-render the subjects in the Swal
    renderEntitiesInSwal();
  };

  const deleteSwalEntity = (entityName) => {
    // Remove subject from subjects array
    const index = newEntities.indexOf(entityName);
    if (index > -1) {
      newEntities.splice(index, 1);
    }
    Swal.resetValidationMessage();
    renderEntitiesInSwal();
  };

  const renderEntitiesInSwal = () => {
    const entitiesList = document.getElementById("entities-list");
    if (newEntities.length === 0) {
      entitiesList.classList.add("hidden");
    } else {
      entitiesList.classList.remove("hidden");
      entitiesList.innerHTML = newEntities
        .map(
          (entity) => `
            <div class="swal-file-row px-2">
              <span class="swal-file-text">${entity}</span>
              <button class="delete-button btn btn-sm btn-outline-danger" data-entity-name="${entity}">Delete</button>
            </div>
          `
        )
        .join("");

      entitiesList.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", () => {
          deleteSwalEntity(button.dataset.entityName);
        });
      });
    }
  };

  // Generate a simpler title based on the entity type
  const getSwalTitle = () => {
    // Default case - no context
    if (entityType === "subjects") {
      return "Add Subject IDs";
    }

    // Simple titles for other entity types
    if (entityType === "samples") {
      return `Add Sample IDs for Subject ${subjectId}`;
    }

    if (entityType === "sites") {
      if (sampleId) {
        return `Add Site IDs for Sample ${sampleId}`;
      }
      if (subjectId) {
        return `Add Site IDs for Subject ${subjectId}`;
      }

      return "Add Site IDs";
    }

    if (entityType === "performances") {
      if (sampleId) {
        return `Add Performance IDs for Sample ${sampleId}`;
      }
      if (subjectId) {
        return `Add Performance IDs for Subject ${subjectId}`;
      }
      return "Add Performance IDs";
    }

    // Fallback
    return `Add ${entityType} IDs`;
  };

  // Get help text that explains what IDs are used for - simplified for all entity types
  const getHelpText = () => {
    // Simple, concise help text for all entity types
    if (entityType === "subjects") {
      return "Enter a unique ID for each subject that data was collected from during your study.";
    } else if (entityType === "samples") {
      return `Enter a unique ID for each sample taken from subject ${subjectId}.`;
    } else if (entityType === "sites") {
      if (sampleId) {
        return `Enter a unique ID for each site data was extracted from for sample ${sampleId}.`;
      } else {
        return `Enter a unique ID for each site data was extracted from for subject ${subjectId}.`;
      }
    } else if (entityType === "performances") {
      if (sampleId) {
        return `Enter a unique ID for each protocol performance performed on sample ${sampleId}.`;
      } else {
        return `Enter a unique ID for each protocol performance performed on subject ${subjectId}.`;
      }
    }

    return "Enter unique identifiers for your dataset entities.";
  };

  const additionConfirmed = await Swal.fire({
    title: getSwalTitle(),
    html: `
      <p class="help-text">
        ${getHelpText()}
        <br />
        <br />
        To add a new ${entityNameSingular} ID, enter the ID in the input field below and press enter or click the "Add ${entityNameSingular} ID" button. Once you have added all the ${entityNameSingular} IDs, click "Confirm IDs" to save them.
      </p>
      <div class="space-between w-100 align-flex-center mb-lg">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input id='input-entity-addition' class='guided--input' type='text' name='guided-subject-id' placeholder='Enter ${entityNameSingular} ID and press enter'/>
        <button
          class="ui positive button soda-green-background ml-1"
          style="width: 190px;"
          id="guided-button-add-subject-in-swal"
        >
          Add ${entityNameSingular} ID
        </button>
      </div>
      <div id="entities-list" class="swal-file-list my-3"></div>
    `,
    width: 850,
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    allowOutsideClick: false,
    confirmButtonText: `Confirm IDs`,
    cancelButtonText: `Cancel`,
    didOpen: () => {
      // Render the initial subjects in the Swal
      renderEntitiesInSwal();
      const swalEntityNameInput = document.getElementById("input-entity-addition");

      // Add an event listener for the enter key so the user can press enter to add the subject
      swalEntityNameInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          try {
            handleSwalEntityAddition(swalEntityNameInput.value);
            swalEntityNameInput.value = "";
          } catch (error) {
            Swal.showValidationMessage(error);
          }
        }
      });

      const addEntityButton = document.getElementById("guided-button-add-subject-in-swal");
      addEntityButton.addEventListener("click", () => {
        try {
          handleSwalEntityAddition(swalEntityNameInput.value);
          swalEntityNameInput.value = "";
        } catch (error) {
          Swal.showValidationMessage(error);
        }
      });
    },
    preConfirm: () => {
      if (newEntities.length === 0) {
        Swal.showValidationMessage(
          `Please define at least one ${entityNameSingular} ID or click Cancel`
        );
      }
    },
  });

  // If the user confirmed the addition of the entities, add them to the sodaJSONObj
  // and re-render the table
  if (additionConfirmed.isConfirmed) {
    // reverse newEntities array
    newEntities.reverse();
    if (entityType === "subjects") {
      for (const subjectId of newEntities) {
        console.log("Adding subject", subjectId);
        addSubject(subjectId);
      }
    }

    if (entityType === "samples") {
      for (const sampleId of newEntities) {
        addSampleToSubject(subjectId, sampleId);
      }
    }

    if (entityType === "performances") {
      console.log("subjectId", subjectId);
      console.log("sampleId", sampleId);
      if (sampleId) {
        for (const performanceId of newEntities) {
          console.log("Adding performance", performanceId);
          console.log("subjectId", subjectId);
          console.log("sampleId", sampleId);
          addPerformanceToSample(subjectId, sampleId, performanceId);
        }
      } else {
        for (const performanceId of newEntities) {
          addPerformanceToSubject(subjectId, performanceId);
        }
      }
    }

    // Add sites handling
    if (entityType === "sites") {
      console.log("subjectId", subjectId);
      console.log("sampleId", sampleId);
      if (sampleId) {
        for (const siteId of newEntities) {
          console.log("Adding site", siteId);
          console.log("subjectId", subjectId);
          console.log("sampleId", sampleId);
          addSiteToSample(subjectId, sampleId, siteId);
        }
      } else {
        for (const siteId of newEntities) {
          addSiteToSubject(subjectId, siteId);
        }
      }
    }
  }
};

export const guidedOpenEntityEditSwal = async ({ entityType, entityData, parentEntityData }) => {
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;
  let entityName = "";

  if (entityType === "subject") {
    entityName = entityData.subjectId;
    preExistingEntities = getExistingSubjectIds();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  } else if (entityType === "sample") {
    entityName = entityData.sampleId;
    preExistingEntities = getExistingSampleIds();
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  } else if (entityType === "performance") {
    entityName = entityData.performanceId;
    preExistingEntities = getExistingPerformanceIds();
    entityNameSingular = "performance";
    entityPrefix = "perf-";
  } else if (entityType === "site") {
    entityName = entityData.siteId;
    preExistingEntities = getExistingSiteIds();
    entityNameSingular = "site";
    entityPrefix = "site-";
  }

  // Remove the current entity ID from the list to prevent false duplication error
  preExistingEntities = preExistingEntities.filter((id) => id !== entityName);

  let newEntityName;

  const entityEditConfirmed = await Swal.fire({
    title: `Change ${entityNameSingular} ID`,
    html: `
      <p class="help-text text-center">
        Enter a new identifier to replace "${entityName}".
        <br />
      </p>
      <div class="space-between w-100 align-flex-center">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input value="${entityName.replace(
          entityPrefix,
          ""
        )}" id='input-new-entity-name' class='guided--input' type='text' placeholder='Enter new ${entityNameSingular} name and press edit'/>
      </div>
    `,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    confirmButtonText: `Edit`,
    cancelButtonText: `Cancel`,
    didOpen: () => {
      // Add event listener to the input to enable the confirm button when the input is changed
      document.getElementById("input-new-entity-name").addEventListener("keyup", () => {
        Swal.resetValidationMessage();
        Swal.enableButtons();
      });
    },
    preConfirm: () => {
      let newEntityInputValue = document.getElementById("input-new-entity-name").value;
      if (newEntityInputValue.length === 0) {
        Swal.showValidationMessage(`Please enter a new ${entityNameSingular} name`);
        return false;
      }

      newEntityName = `${entityPrefix}${newEntityInputValue}`;
      if (newEntityName === entityName) {
        Swal.close();
        return false;
      }

      const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
        newEntityName,
        "string-adheres-to-identifier-conventions"
      );

      if (!entityNameIsValid) {
        Swal.showValidationMessage(
          `${entityNameSingular} names can not contain spaces or special characters`
        );
        return false;
      }

      if (preExistingEntities.includes(newEntityName)) {
        Swal.showValidationMessage(`A ${entityNameSingular} with that name already exists`);
        return false;
      }

      return true;
    },
  });

  if (entityEditConfirmed.isConfirmed) {
    return { oldName: entityName, newName: newEntityName };
  }

  return null;
};
