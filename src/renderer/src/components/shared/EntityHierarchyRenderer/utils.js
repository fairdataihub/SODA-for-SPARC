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
