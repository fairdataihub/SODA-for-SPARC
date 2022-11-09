const saveSubPageChanges = async (openSubPageID) => {
  const errorArray = [];
  try {
    if (openSubPageID === "guided-specify-subjects-page") {
      const buttonYesSubjects = document.getElementById("guided-button-add-subjects-table");
      const buttonNoSubjects = document.getElementById("guided-button-no-subjects");
      if (
        !buttonYesSubjects.classList.contains("selected") &&
        !buttonNoSubjects.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if your dataset contains subjects.",
        });
        throw errorArray;
      }
      if (buttonYesSubjects.classList.contains("selected")) {
        //Get the count of all subjects in and outside of pools
        const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
        const subjectsCount = [...subjectsInPools, ...subjectsOutsidePools].length;

        //Check to see if any subjects were added, and if not, disallow the user
        //from progressing until they add at least one subject or select that they do not
        if (subjectsCount === 0) {
          errorArray.push({
            type: "error",
            message:
              "Please add at least one subject or indicate that your dataset does not contain subjects.",
          });
          throw errorArray;
        }

        $(".guided-subject-sample-data-addition-page").attr("data-skip-page", "false");
      }
    }

    if (openSubPageID === "guided-organize-subjects-into-pools-page") {
      const buttonYesPools = document.getElementById("guided-button-organize-subjects-into-pools");
      const buttonNoPools = document.getElementById("guided-button-no-pools");
      if (
        !buttonYesPools.classList.contains("selected") &&
        !buttonNoPools.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you would like to organize your subjects into pools.",
        });
        throw errorArray;
      }

      if (buttonYesPools.classList.contains("selected")) {
        const pools = sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"];

        //Check to see if any pools were added, and if not, disallow the user
        //from progressing until they add at least one pool or select that they do not
        //have any pools
        if (Object.keys(pools).length === 0) {
          errorArray.push({
            type: "error",
            message:
              "Please add at least one pool or indicate that your dataset does not contain pools.",
          });
          throw errorArray;
        }
        //delete empty pools
        for (const pool of Object.keys(pools)) {
          if (
            Object.keys(
              sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"][pool]
            ).length === 0
          ) {
            errorArray.push({
              type: "error",
              message:
                "Empty data pools are not allowed. Please add at least one subject to each pool or delete the empty pool.",
            });
            throw errorArray;
          }
        }

        document
          .getElementById("guided-primary-pools-organization-page")
          .setAttribute("data-skip-sub-page", "false");
        document
          .getElementById("guided-source-pools-organization-page")
          .setAttribute("data-skip-sub-page", "false");
        document
          .getElementById("guided-derivative-pools-organization-page")
          .setAttribute("data-skip-sub-page", "false");
      }

      if (buttonNoPools.classList.contains("selected")) {
        const pools = sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"];

        //If any pools exist, delete them
        for (const pool of Object.keys(pools)) {
          sodaJSONObj.deletePool(pool);
        }

        document
          .getElementById("guided-primary-pools-organization-page")
          .setAttribute("data-skip-sub-page", "true");
        document
          .getElementById("guided-source-pools-organization-page")
          .setAttribute("data-skip-sub-page", "true");
        document
          .getElementById("guided-derivative-pools-organization-page")
          .setAttribute("data-skip-sub-page", "true");
      }
    }

    if (openSubPageID === "guided-specify-samples-page") {
      const buttonYesSamples = document.getElementById("guided-button-add-samples-tables");
      const buttonNoSamples = document.getElementById("guided-button-no-samples");
      if (
        !buttonYesSamples.classList.contains("selected") &&
        !buttonNoSamples.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if your dataset's subjects have samples.",
        });
        throw errorArray;
      }
      if (buttonYesSamples.classList.contains("selected")) {
        const [samplesInPools, samplesOutsidePools] = sodaJSONObj.getAllSamplesFromSubjects();
        //Combine sample data from samples in and out of pools
        const samplesCount = [...samplesInPools, ...samplesOutsidePools].length;
        //Check to see if any samples were added, and if not, disallow the user
        //from progressing until they add at least one sample or select that they do not
        //have any samples
        if (samplesCount === 0) {
          errorArray.push({
            type: "error",
            message:
              "Please add at least one sample or indicate that your dataset does not contain samples.",
          });
          throw errorArray;
        }

        document
          .getElementById("guided-primary-samples-organization-page")
          .setAttribute("data-skip-sub-page", "false");
        document
          .getElementById("guided-source-samples-organization-page")
          .setAttribute("data-skip-sub-page", "false");
        document
          .getElementById("guided-derivative-samples-organization-page")
          .setAttribute("data-skip-sub-page", "false");
      }
      if (buttonNoSamples.classList.contains("selected")) {
        //add skip-sub-page attribute to element
        document
          .getElementById("guided-primary-samples-organization-page")
          .setAttribute("data-skip-sub-page", "true");
        document
          .getElementById("guided-source-samples-organization-page")
          .setAttribute("data-skip-sub-page", "true");
        document
          .getElementById("guided-derivative-samples-organization-page")
          .setAttribute("data-skip-sub-page", "true");
      }
    }

    if (openSubPageID === "guided-primary-samples-organization-page") {
      const buttonYesPrimarySampleData = document.getElementById(
        "guided-button-add-sample-primary-data"
      );
      const buttonNoPrimarySampleData = document.getElementById(
        "guided-button-no-sample-primary-data"
      );
      if (
        !buttonYesPrimarySampleData.classList.contains("selected") &&
        !buttonNoPrimarySampleData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you have primary data to add to your samples.",
        });
        throw errorArray;
      }
      if (buttonYesPrimarySampleData.classList.contains("selected")) {
        const continueWithoutAddingPrimaryDataToAllSamples =
          await cleanUpEmptyGuidedStructureFolders("primary", "samples", false);
        if (continueWithoutAddingPrimaryDataToAllSamples) {
          setActiveSubPage("guided-primary-subjects-organization-page");
        }
      }
      if (buttonNoPrimarySampleData.classList.contains("selected")) {
        const continueAfterDeletingAllPrimarySampleFolders =
          await cleanUpEmptyGuidedStructureFolders("primary", "samples", true);
        if (continueAfterDeletingAllPrimarySampleFolders) {
          setActiveSubPage("guided-primary-subjects-organization-page");
        }
      }
    }

    if (openSubPageID === "guided-primary-subjects-organization-page") {
      const buttonYesPrimarySubjectData = document.getElementById(
        "guided-button-add-subject-primary-data"
      );
      const buttonNoPrimarySubjectData = document.getElementById(
        "guided-button-no-subject-primary-data"
      );
      if (
        !buttonYesPrimarySubjectData.classList.contains("selected") &&
        !buttonNoPrimarySubjectData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you have primary data to add to your subjects.",
        });
        throw errorArray;
      }
      if (buttonYesPrimarySubjectData.classList.contains("selected")) {
        const continueWithoutAddingPrimaryDataToAllSubjects =
          await cleanUpEmptyGuidedStructureFolders("primary", "subjects", false);
        if (continueWithoutAddingPrimaryDataToAllSubjects) {
          hideSubNavAndShowMainNav("next");
        }
      }
      if (buttonNoPrimarySubjectData.classList.contains("selected")) {
        const continueAfterDeletingAllPrimaryPoolsAndSubjects =
          await cleanUpEmptyGuidedStructureFolders("primary", "subjects", true);
        if (continueAfterDeletingAllPrimaryPoolsAndSubjects) {
          hideSubNavAndShowMainNav("next");
        }
      }
    }

    if (openSubPageID === "guided-source-samples-organization-page") {
      const buttonYesSourceSampleData = document.getElementById(
        "guided-button-add-sample-source-data"
      );
      const buttonNoSourceSampleData = document.getElementById(
        "guided-button-no-sample-source-data"
      );
      if (
        !buttonYesSourceSampleData.classList.contains("selected") &&
        !buttonNoSourceSampleData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you have source data to add to your samples.",
        });
        throw errorArray;
      }
      if (buttonYesSourceSampleData.classList.contains("selected")) {
        const continueWithoutAddingSourceDataToAllSamples =
          await cleanUpEmptyGuidedStructureFolders("source", "samples", false);
        if (continueWithoutAddingSourceDataToAllSamples) {
          setActiveSubPage("guided-source-subjects-organization-page");
        }
      }
      if (buttonNoSourceSampleData.classList.contains("selected")) {
        const continueAfterDeletingAllSourceSampleFolders =
          await cleanUpEmptyGuidedStructureFolders("source", "samples", true);
        if (continueAfterDeletingAllSourceSampleFolders) {
          setActiveSubPage("guided-source-subjects-organization-page");
        }
      }
    }

    if (openSubPageID === "guided-source-subjects-organization-page") {
      const buttonYesSourceSubjectData = document.getElementById(
        "guided-button-add-subject-source-data"
      );
      const buttonNoSourceSubjectData = document.getElementById(
        "guided-button-no-subject-source-data"
      );
      if (
        !buttonYesSourceSubjectData.classList.contains("selected") &&
        !buttonNoSourceSubjectData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you have source data to add to your subjects.",
        });
        throw errorArray;
      }
      if (buttonYesSourceSubjectData.classList.contains("selected")) {
        const continueWithoutAddingSourceDataToAllSubjects =
          await cleanUpEmptyGuidedStructureFolders("source", "subjects", false);
        if (continueWithoutAddingSourceDataToAllSubjects) {
          hideSubNavAndShowMainNav("next");
        }
      }
      if (buttonNoSourceSubjectData.classList.contains("selected")) {
        const continueAfterDeletingAllSourcePoolsAndSubjects =
          await cleanUpEmptyGuidedStructureFolders("source", "subjects", true);
        if (continueAfterDeletingAllSourcePoolsAndSubjects) {
          hideSubNavAndShowMainNav("next");
        }
      }
    }

    if (openSubPageID === "guided-derivative-samples-organization-page") {
      const buttonYesDerivativeSampleData = document.getElementById(
        "guided-button-add-sample-derivative-data"
      );
      const buttonNoDerivativeSampleData = document.getElementById(
        "guided-button-no-sample-derivative-data"
      );
      if (
        !buttonYesDerivativeSampleData.classList.contains("selected") &&
        !buttonNoDerivativeSampleData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you have derivative data to add to your samples.",
        });
        throw errorArray;
      }
      if (buttonYesDerivativeSampleData.classList.contains("selected")) {
        const continueWithoutAddingDerivativeDataToAllSamples =
          await cleanUpEmptyGuidedStructureFolders("derivative", "samples", false);
        if (continueWithoutAddingDerivativeDataToAllSamples) {
          setActiveSubPage("guided-derivative-subjects-organization-page");
        }
      }
      if (buttonNoDerivativeSampleData.classList.contains("selected")) {
        const continueAfterDeletingAllDerivativeSampleFolders =
          await cleanUpEmptyGuidedStructureFolders("derivative", "samples", true);
        if (continueAfterDeletingAllDerivativeSampleFolders) {
          setActiveSubPage("guided-derivative-subjects-organization-page");
        }
      }
    }

    if (openSubPageID === "guided-derivative-subjects-organization-page") {
      const buttonYesDerivativeSubjectData = document.getElementById(
        "guided-button-add-subject-derivative-data"
      );
      const buttonNoDerivativeSubjectData = document.getElementById(
        "guided-button-no-subject-derivative-data"
      );
      if (
        !buttonYesDerivativeSubjectData.classList.contains("selected") &&
        !buttonNoDerivativeSubjectData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you have derivative data to add to your subjects.",
        });
        throw errorArray;
      }
      if (buttonYesDerivativeSubjectData.classList.contains("selected")) {
        const continueWithoutAddingDerivativeDataToAllSubjects =
          await cleanUpEmptyGuidedStructureFolders("derivative", "subjects", false);
        if (continueWithoutAddingDerivativeDataToAllSubjects) {
          hideSubNavAndShowMainNav("next");
        }
      }
      if (buttonNoDerivativeSubjectData.classList.contains("selected")) {
        const continueAfterDeletingAllDerivativePoolsAndSubjects =
          await cleanUpEmptyGuidedStructureFolders("derivative", "subjects", true);
        if (continueAfterDeletingAllDerivativePoolsAndSubjects) {
          hideSubNavAndShowMainNav("next");
        }
      }
    }

    if (CURRENT_PAGE.attr("id") === "guided-create-submission-metadata-tab") {
      const buttonYesImportDataDerivatives = document.getElementById(
        "guided-button-import-data-deliverables"
      );
      const buttonNoEnterSubmissionDataManually = document.getElementById(
        "guided-button-enter-submission-metadata-manually"
      );
      if (
        !buttonYesImportDataDerivatives.classList.contains("selected") &&
        !buttonNoEnterSubmissionDataManually.classList.contains("selected")
      ) {
        errorArray.push({
          type: "error",
          message: "Please indicate if you would like to import milestone data.",
        });
        throw errorArray;
      }
      if (buttonYesImportDataDerivatives.classList.contains("selected")) {
        if (openSubPageID === "guided-data-derivative-import-page") {
          const checkedMilestoneData = getCheckedMilestones();
          if (checkedMilestoneData.length === 0) {
            errorArray.push({
              type: "error",
              message: "Please select at least one milestone",
            });
            throw errorArray;
          }

          sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-selected-milestones"] =
            checkedMilestoneData;
          setActiveSubPage("guided-completion-date-selection-page");
        }

        if (openSubPageID === "guided-completion-date-selection-page") {
          const selectedCompletionDate = document.querySelector(
            "input[name='completion-date']:checked"
          );
          if (!selectedCompletionDate) {
            errorArray.push({
              type: "error",
              message: "Please select a completion date",
            });
            throw errorArray;
          }

          const completionDate = selectedCompletionDate.value;
          sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
            completionDate;
          setActiveSubPage("guided-submission-metadata-page");
        }

        if (openSubPageID === "guided-submission-metadata-page") {
          const award = $("#guided-submission-sparc-award").val();
          const date = $("#guided-submission-completion-date").val();
          const milestones = getTagsFromTagifyElement(guidedSubmissionTagsTagify);

          if (award === "") {
            errorArray.push({
              type: "error",
              message: "Please add a SPARC award number to your submission metadata",
            });
          }
          if (date === "Enter my own date") {
            errorArray.push({
              type: "error",
              message: "Please add a completion date to your submission metadata",
            });
          }
          if (milestones.length === 0) {
            errorArray.push({
              type: "error",
              message: "Please add at least one milestone to your submission metadata",
            });
          }
          if (errorArray.length > 0) {
            throw errorArray;
          }
          // save the award string to JSONObj to be shared with other award inputs
          sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = award;
          //Save the data and milestones to the sodaJSONObj
          sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = milestones;
          sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] = date;
          sodaJSONObj["dataset-metadata"]["submission-metadata"]["submission-data-entry"] =
            "import";

          hideSubNavAndShowMainNav("next");
        }
      }
      if (buttonNoEnterSubmissionDataManually.classList.contains("selected")) {
        const award = $("#guided-submission-sparc-award-manual").val();
        const date = $("#guided-submission-completion-date-manual").val();
        const milestones = getTagsFromTagifyElement(guidedSubmissionTagsTagifyManual);
        //validate manually entered submission metadata
        if (award === "") {
          errorArray.push({
            type: "error",
            message: "Please add a SPARC award number to your submission metadata",
          });
        }
        if (date === "Enter my own date") {
          errorArray.push({
            type: "error",
            message: "Please add a completion date to your submission metadata",
          });
        }
        if (milestones.length === 0) {
          errorArray.push({
            type: "error",
            message: "Please add at least one milestone to your submission metadata",
          });
        }
        if (errorArray.length > 0) {
          throw errorArray;
        }
        // save the award string to JSONObj to be shared with other award inputs
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = award;
        //Save the data and milestones to the sodaJSONObj
        sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = milestones;
        sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] = date;
        sodaJSONObj["dataset-metadata"]["submission-metadata"]["submission-data-entry"] = "manual";

        hideSubNavAndShowMainNav("next");
      }
    }

    saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
