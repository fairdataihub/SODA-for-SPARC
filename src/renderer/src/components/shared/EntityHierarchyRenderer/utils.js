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
} from "../../../stores/slices/datasetEntityStructureSlice";
export const guidedOpenEntityAdditionSwal = async ({ entityType, subjectId, sampleId }) => {
  console.log("guidedOpenEntityAdditionSwal called");
  console.log("entityType", entityType);
  console.log("subjectId", subjectId);
  console.log("sampleId", sampleId);
  // Get a list of the existing entities so we can check for duplicates
  // const subjects = window.getExistingSubjectNames();
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
  `${entityNameSingular} addition`;
  const additionConfirmed = await Swal.fire({
    title: `my cool title`,
    html: `
      <p class="help-text">
        Enter a unique ${entityNameSingular} ID and press enter or the
        'Add ${entityNameSingular}' button for each ${entityNameSingular} in your dataset.
        <br />
      </p>
      <div class="space-between w-100 align-flex-center">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input id='input-entity-addition' class='guided--input' type='text' name='guided-subject-id' placeholder='Enter ${entityNameSingular} ID and press enter'/>
        <button
          class="ui positive button soda-green-background ml-1"
          style="width: 180px;"
          id="guided-button-add-subject-in-swal"
        >
          Add ${entityNameSingular}
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
    confirmButtonText: `Confirm`,
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
        Swal.showValidationMessage(`Please add at least one ${entityNameSingular} or click Cancel`);
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
          addPerformanceToSample(performanceId, subjectId, sampleId);
        }
      } else {
        for (const performanceId of newEntities) {
          addPerformanceToSubject(subjectId, performanceId);
        }
      }
    }
  }
};

export const guidedOpenEntityEditSwal = async ({ entityType, subjectName, sampleName }) => {
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;

  if (entityName.startsWith("sub-")) {
    preExistingEntities = window.getExistingSubjectNames();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  }
  if (entityName.startsWith("pool-")) {
    preExistingEntities = getExistingPoolNames();
    entityNameSingular = "pool";
    entityPrefix = "pool-";
  }
  if (entityName.startsWith("sam-")) {
    preExistingEntities = getExistingSampleNames();
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  }

  let newEntityName;

  const entityEditConfirmed = await Swal.fire({
    title: `Editing ${entityNameSingular} ${entityName}`,
    html: `
      <p class="help-text text-center">
        Enter the new name for the ${entityNameSingular} below and press edit.
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
        return;
      }

      newEntityName = `${entityPrefix}${newEntityInputValue}`;
      if (newEntityName === entityName) {
        Swal.close();
      }
      const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
        newEntityName,
        "string-adheres-to-identifier-conventions"
      );
      if (!entityNameIsValid) {
        Swal.showValidationMessage(
          `${entityNameSingular} names can not contain spaces or special characters`
        );
        return;
      }
      if (preExistingEntities.includes(newEntityName)) {
        Swal.showValidationMessage(`A ${entityNameSingular} with that name already exists`);
        return;
      }
    },
  });

  if (entityEditConfirmed.isConfirmed) {
    if (entityName.startsWith("sub-")) {
      window.sodaJSONObj.renameSubject(entityName, newEntityName);
      renderSubjectsTable();
    }
    if (entityName.startsWith("pool-")) {
      window.sodaJSONObj.renamePool(entityName, newEntityName);
      renderPoolsTable();
    }
    if (entityName.startsWith("sam-")) {
      window.sodaJSONObj.renameSample(entityName, newEntityName);
      renderSamplesTable();
    }
  }
};
