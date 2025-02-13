import Swal from "sweetalert2";
import {guidedTransitionFromHome} from "../pages/navigate";
import { checkIfDatasetExistsOnPennsieve } from "../pennsieveUtils";
import { attachGuidedMethodsToSodaJSONObj } from "../utils/sodaJSONObj";
import { guidedGetPageToReturnTo, guidedSkipPage, guidedUnSkipPage } from "../pages/pageSkipping";
import {guidedGetCurrentUserWorkSpace} from "../workspaces/workspaces"
import {openPage} from "../pages/openPage";
import api from "../../others/api/api"
import client from "../../client"

while (!window.baseHtmlLoaded) {
    await new Promise((resolve) => setTimeout(resolve, 100));
}




//Loads UI when continue curation button is pressed
window.guidedResumeProgress = async (datasetNameToResume) => {
    const loadingSwal = Swal.fire({
        title: "Resuming where you last left off",
        html: `
        <div class="guided--loading-div">
          <div class="lds-roller">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      `,
        width: 500,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        allowOutsideClick: false,
        showConfirmButton: false,
        showCancelButton: false,
    });

    // Wait for 2 seconds so that the loading icon can at least kind of be seen (This can be removed)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
        const datasetResumeJsonObj = await getProgressFileData(datasetNameToResume);

        // Datasets successfully uploaded will have the "previous-guided-upload-dataset-name" key
        const datasetHasAlreadyBeenSuccessfullyUploaded =
            datasetResumeJsonObj["previous-guided-upload-dataset-name"];

        // If the dataset had been previously successfully uploaded, check to make sure it exists on Pennsieve still.
        if (datasetHasAlreadyBeenSuccessfullyUploaded) {
            const previouslyUploadedDatasetId =
                datasetResumeJsonObj["digital-metadata"]["pennsieve-dataset-id"];
            const datasetToResumeExistsOnPennsieve = await checkIfDatasetExistsOnPennsieve(
                previouslyUploadedDatasetId
            );
            if (!datasetToResumeExistsOnPennsieve) {
                throw new Error(`This dataset no longer exists on Pennsieve`);
            }
        }

        if (!datasetHasAlreadyBeenSuccessfullyUploaded) {
            // If the dataset is being edited on Pensieve, check to make sure the folders and files are still the same.
            if (datasetResumeJsonObj["starting-point"]?.["type"] === "bf") {
                // Check to make sure the dataset is not locked
                const datasetIsLocked = await api.isDatasetLocked(
                    datasetResumeJsonObj["digital-metadata"]["pennsieve-dataset-id"]
                );
                if (datasetIsLocked) {
                    throw new Error(`
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a  target="_blank" rel="noopener noreferrer" href="mailto:curation@sparc.science">curation@sparc.science.</a>
            `);
                }

                if (Object.keys(datasetResumeJsonObj["previously-uploaded-data"]).length > 0) {
                    await Swal.fire({
                        icon: "info",
                        title: "Resuming a Pennsieve dataset upload that previously failed",
                        html: `
              Please note that any changes made to your dataset on Pennsieve since your last dataset upload
              was interrupted may be overwritten.
            `,
                        width: 500,
                        heightAuto: false,
                        backdrop: "rgba(0,0,0, 0.4)",
                        confirmButtonText: `I understand`,
                        focusConfirm: true,
                        allowOutsideClick: false,
                    });
                } else {
                    // Check to make sure the dataset structure on Pennsieve is the same as when the user started editing this dataset
                    let filesFoldersResponse = await client.post(
                        `/organize_datasets/dataset_files_and_folders`,
                        {
                            sodajsonobject: datasetResumeJsonObj,
                        },
                        { timeout: 0 }
                    );
                    let data = filesFoldersResponse.data;
                    const currentPennsieveDatasetStructure = data["soda_object"]["dataset-structure"];

                    const intitiallyPulledDatasetStructure =
                        datasetResumeJsonObj["initially-pulled-dataset-structure"];

                    // check to make sure current and initially pulled dataset structures are the same
                    if (
                        JSON.stringify(currentPennsieveDatasetStructure) !==
                        JSON.stringify(intitiallyPulledDatasetStructure)
                    ) {
                        throw new Error(
                            `The folders and/or files on Pennsieve have changed since you last edited this dataset in SODA.
                <br />
                <br />
                If you would like to update this dataset, please delete this progress file and start over.
                `
                        );
                    }
                }
            }
        }
        window.sodaJSONObj = datasetResumeJsonObj;
        attachGuidedMethodsToSodaJSONObj();

        //patches the sodajsonobj if it was created in a previous version of guided mode
        await patchPreviousGuidedModeVersions();

        window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
        window.subjectsTableData = window.sodaJSONObj["subjects-table-data"];
        window.samplesTableData = window.sodaJSONObj["samples-table-data"];

        // Save the skipped pages in a temp variable since guidedTransitionFromHome will remove them
        const prevSessionSkikppedPages = [...window.sodaJSONObj["skipped-pages"]];

        guidedTransitionFromHome();
        // Reskip the pages from a previous session
        for (const pageID of prevSessionSkikppedPages) {
            guidedSkipPage(pageID);
        }

        // Skip this page incase it was not skipped in a previous session
        guidedSkipPage("guided-select-starting-point-tab");

        // pageToReturnTo will be set to the page the user will return to
        const pageToReturnTo = await guidedGetPageToReturnTo(window.sodaJSONObj);

        await openPage(pageToReturnTo);

        // Close the loading screen, the user should be on the page they left off on now
        loadingSwal.close();
    } catch (error) {
        clientError(error);
        loadingSwal.close();
        await Swal.fire({
            icon: "info",
            title: "This dataset is not able to be resumed",
            html: `${error.message}`,
            width: 500,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: `I understand`,
            focusConfirm: true,
            allowOutsideClick: false,
        });
    }
};

const patchPreviousGuidedModeVersions = async () => {
    //temp patch contributor affiliations if they are still a string (they were added in the previous version)
  
    //Add key to track status of Pennsieve uploads
    if (!window.sodaJSONObj["pennsieve-upload-status"]) {
      window.sodaJSONObj["pennsieve-upload-status"] = {
        "dataset-metadata-pennsieve-genration-status": "not-started",
      };
    }
  
    if (!window.sodaJSONObj["previously-uploaded-data"]) {
      window.sodaJSONObj["previously-uploaded-data"] = {};
    }
  
    if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"]) {
      window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = [];
    }
  
    const contributors =
      window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
    if (contributors) {
      for (const contributor of window.sodaJSONObj["dataset-metadata"]["description-metadata"][
        "contributors"
      ]) {
        //if contributor is in old format (string), convert to new format (array)
        if (!Array.isArray(contributor.conAffliation)) {
          contributor.conAffliation = [contributor.conAffliation];
        }
        // Replace improperly named PrincipleInvestigator role with Principle Investigator
        if (contributor?.["conRole"].includes("PrincipleInvestigator")) {
          contributor["conRole"] = contributor["conRole"].filter(
            (role) => role !== "PrincipleInvestigator"
          );
          contributor["conRole"].unshift("PrincipalInvestigator");
        }
      }
    }
  
    if (!window.sodaJSONObj["button-config"]) {
      window.sodaJSONObj["button-config"] = {};
    }
  
    if (!window.sodaJSONObj["skipped-pages"]) {
      window.sodaJSONObj["skipped-pages"] = [];
    }
  
    if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"]) {
      window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"] = {};
    }
  
    if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]) {
      window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] = {};
    }
  
    if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"]) {
      window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [];
    }
  
    // If the user was on the airtable award page (does not exist anymore), send them to the create submission metadata page
    if (window.sodaJSONObj["page-before-exit"] === "guided-airtable-award-tab") {
      window.sodaJSONObj["page-before-exit"] = "guided-create-submission-metadata-tab";
    }
  
    if (!window.sodaJSONObj["last-version-of-soda-used"]) {
      // This is the first time the user has used SODA since the "last-version-of-soda-used" key was added
      window.sodaJSONObj["last-version-of-soda-used"] = "10.0.4";
    }
  
    // If the user started a dataset after version 10.0.4, skip CHANGES metadata pages
    if (!window.sodaJSONObj["skipped-pages"].includes("guided-create-changes-metadata-tab")) {
      if (window.sodaJSONObj["starting-point"]["type"] === "new") {
        window.sodaJSONObj["skipped-pages"].push("guided-create-changes-metadata-tab");
      }
    }
  
    // If the the last time the user worked on the dataset was before v11.0.0, skip the changes page unless
    // the dataset has already been published.
    if (window.sodaJSONObj["last-version-of-soda-used"] <= "11.0.0") {
      if (window.sodaJSONObj["starting-point"]["type"] === "bf") {
        const datasetsPennsieveID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
  
        // Skip/unSkip the changes metadata page based on publishing status
        // (if the changes file already exists, then still show it)
        const changesCheckRes = await checkIfChangesMetadataPageShouldBeShown(datasetsPennsieveID);
        if (changesCheckRes.shouldShow === true) {
          window.sodaJSONObj["dataset-metadata"]["CHANGES"] = changesCheckRes.changesMetadata;
          guidedUnSkipPage("guided-create-changes-metadata-tab");
        } else {
          window.sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
          guidedSkipPage("guided-create-changes-metadata-tab");
        }
  
        // Delete the saved button config for the code metadata page (The flow was slightly updated)
        // The user will have to reselect their option If they do not have a code-description file, otherwise
        // the new prompt will be shown.
        if (window.sodaJSONObj?.["button-config"]?.["dataset-contains-code-data"]) {
          delete window.sodaJSONObj["button-config"]["dataset-contains-code-data"];
        }
      }
    }
  
    if (window.sodaJSONObj?.["starting-point"]?.["type"] === "bf") {
      if (!window.sodaJSONObj?.["digital-metadata"]?.["dataset-workspace"]) {
        // Skip the log in page since we no longer need it
        guidedSkipPage("guided-pennsieve-intro-tab");
        window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = guidedGetCurrentUserWorkSpace();
      }
    }
  
    // No longer skip validation page for non-sparc datasts ("page should always be unskipped")
    if (window.sodaJSONObj["skipped-pages"].includes("guided-dataset-validation-tab")) {
      window.sodaJSONObj["skipped-pages"] = window.sodaJSONObj["skipped-pages"].filter(
        (page) => page !== "guided-dataset-validation-tab"
      );
    }
  
    //If the dataset was successfully uploaded, send the user to the share with curation team
    if (window.sodaJSONObj["previous-guided-upload-dataset-name"]) {
      return "guided-dataset-dissemination-tab";
    }
  
    // Change the award number variable from sparc-award to award-number
    if (window.sodaJSONObj?.["dataset-metadata"]?.["shared-metadata"]?.["sparc-award"]) {
      window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["award-number"] =
        window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
    }
    // If the consortium data standard is not defined, set it to an empty string
    if (
      !window.sodaJSONObj["dataset-metadata"]["submission-metadata"]?.["consortium-data-standard"]
    ) {
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] = "";
    }
    // If the funding consortium is not defined, set it to an empty string
    if (!window.sodaJSONObj["dataset-metadata"]["submission-metadata"]?.["funding-consortium"]) {
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] = "";
    }
  
    if (!window.sodaJSONObj["digital-metadata"]?.["license"]) {
      window.sodaJSONObj["digital-metadata"]["license"] = "";
    }
  
    if (!window.sodaJSONObj["curation-mode"]) {
      window.sodaJSONObj["cuartion-mode"] = "guided";
    }
  
    // If no other conditions are met, return the page the user was last on
    return window.sodaJSONObj["page-before-exit"];
  };

const getProgressFileData = async (progressFile) => {
    let progressFilePath = window.path.join(guidedProgressFilePath, progressFile + ".json");
    return readFileAsync(progressFilePath);
  };

const guidedRenderProgressCards = async () => {
    const progressCardsContainer = document.getElementById("guided-container-progress-cards");
    const progressCardLoadingDiv = document.getElementById("guided-section-loading-progress-cards");
    const progressCardLoadingDivText = document.getElementById(
        "guided-section-loading-progress-cards-para"
    );

    // Show the loading div and hide the progress cards container
    progressCardsContainer.classList.add("hidden");
    progressCardLoadingDiv.classList.remove("hidden");

    // if the user has an account connected with Pennsieve then verify the profile and workspace
    if (
        window.defaultBfAccount !== undefined ||
        (window.defaultBfAccount === undefined && hasConnectedAccountWithPennsieve())
    ) {
        try {
            progressCardLoadingDivText.textContent = "Verifying account information";
            await window.verifyProfile();
            progressCardLoadingDivText.textContent = "Verifying workspace information";
            await window.synchronizePennsieveWorkspace();
        } catch (e) {
            clientError(e);
            await swalShowInfo(
                "Something went wrong while verifying your profile",
                "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
            );
            loadingDiv.classList.add("hidden");
            return;
        }
    }

    //Check if Guided-Progress folder exists. If not, create it.
    if (!window.fs.existsSync(guidedProgressFilePath)) {
        window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
    }

    const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);

    // Filter out non .json files
    const jsonProgressFiles = guidedSavedProgressFiles.filter((file) => {
        return file.endsWith(".json");
    });

    const progressFileData = await getAllProgressFileData(jsonProgressFiles);

    // Sort by last modified date
    progressFileData.sort((a, b) => {
        return new Date(b["last-modified"]) - new Date(a["last-modified"]);
    });

    // If the workspace hasn't loaded yet, wait for it to load
    // This will stop after 6 seconds
    if (!guidedGetCurrentUserWorkSpace()) {
        for (let i = 0; i < 60; i++) {
            // If the workspace loaded, break out of the loop
            if (guidedGetCurrentUserWorkSpace()) {
                break;
            }
            // If the workspace didn't load, wait 100ms and try again
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    // If there are progress cards to display, display them
    if (progressFileData.length > 0) {
        // Add the title to the container
        progressCardsContainer.innerHTML = `
        <h2 class="text-sub-step-title">
          Select the dataset that you would like to continue working with and click "Continue"
        </h2>
      `;
        //Add the progress cards that have already been uploaded to Pennsieve
        //to their container (datasets that have the window.sodaJSONObj["previous-guided-upload-dataset-name"] property)
        progressCardsContainer.innerHTML += progressFileData
            .map((progressFile) => generateProgressCardElement(progressFile))
            .join("\n");

        tippy(".progress-card-popover", {
            allowHTML: true,
            interactive: true,
        });
    } else {
        progressCardsContainer.innerHTML = `
        <h2 class="guided--text-user-directions" style="color: var(--color-bg-plum) !important">
          No datasets in progress found.
        </h2>
      `;
    }

    // Hide the loading div and show the progress cards container
    progressCardsContainer.classList.remove("hidden");
    progressCardLoadingDiv.classList.add("hidden");
};

const generateProgressCardElement = (progressFileJSONObj) => {
    let progressFileImage = progressFileJSONObj["digital-metadata"]["banner-image-path"] || "";

    if (progressFileImage === "") {
        progressFileImage = `
        <img
          src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
          alt="Dataset banner image placeholder"
          style="height: 80px; width: 80px"
        />
      `;
    } else {
        progressFileImage = `
        <img
          src='file://${progressFileImage}'
          alt="Dataset banner image"
          style="height: 80px; width: 80px"
        />
      `;
    }
    const progressFileName = progressFileJSONObj["digital-metadata"]["name"] || "";
    const progressFileSubtitle =
        progressFileJSONObj["digital-metadata"]["subtitle"] || "No designated subtitle";
    const progressFileLastModified = new Date(progressFileJSONObj["last-modified"]).toLocaleString(
        [],
        {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        }
    );
    const savedUploadDataProgress =
        progressFileJSONObj["previously-uploaded-data"] &&
        Object.keys(progressFileJSONObj["previously-uploaded-data"]).length > 0;

    const datasetStartingPoint = progressFileJSONObj?.["starting-point"]?.["type"];

    let workspaceUserNeedsToSwitchTo = false;
    const datasetWorkspace = progressFileJSONObj?.["digital-metadata"]?.["dataset-workspace"];
    const currentWorkspace = guidedGetCurrentUserWorkSpace();
    if (datasetWorkspace && datasetWorkspace !== currentWorkspace) {
        workspaceUserNeedsToSwitchTo = datasetWorkspace;
    }

    // True if the progress file has already been uploaded to Pennsieve
    const alreadyUploadedToPennsieve = !!progressFileJSONObj["previous-guided-upload-dataset-name"];

    // Function to generate the button used to resume progress
    const generateProgressResumptionButton = (
        datasetStartingPoint,
        boolAlreadyUploadedToPennsieve,
        progressFileName,
        workspaceUserNeedsToSwitchTo
    ) => {
        if (workspaceUserNeedsToSwitchTo) {
            // If the progress file has an organization set but the user is no longer logged in,
            // prompt the user to log in
            if (!window.defaultBfAccount) {
                return `
            <button
              class="ui positive button guided--progress-button-login-to-pennsieve"
              data-reset-guided-mode-page="true"
              onclick="window.openDropdownPrompt(this, 'bf')"
            >
              Log in to Pennsieve to resume curation
            </button>
          `;
            }
            // If the user is logged in but the user needs to switch to a different workspace,
            // prompt the user to switch to the correct workspace
            return `
          <button
            class="ui positive button guided-change-workspace guided--progress-button-switch-workspace"
            onClick="window.openDropdownPrompt(this, 'organization')"
          >
            Switch to ${workspaceUserNeedsToSwitchTo} workspace to resume curation
          </button>
        `;
        }

        let buttonText;
        let buttonClass;

        if (boolAlreadyUploadedToPennsieve) {
            buttonText = "Share with the curation team";
            buttonClass = "guided--progress-button-share";
        } else if (datasetStartingPoint === "new") {
            buttonText = "Resume curation";
            buttonClass = "guided--progress-button-resume-curation";
        } else {
            buttonText = "Continue updating Pennsieve dataset";
            buttonClass = "guided--progress-button-resume-pennsieve";
        }

        return `
      <button
        class="ui positive button ${buttonClass}"
        onClick="window.guidedResumeProgress('${progressFileName}')"
      >
        ${buttonText}
      </button>
    `;
    };

    return `
      <div class="dataset-card">
        ${progressFileImage /* banner image */}     
  
        <div class="dataset-card-body">
          <div class="dataset-card-row">
            <h1
              class="dataset-card-title-text progress-file-name progress-card-popover"
              data-tippy-content="Dataset name: ${progressFileName}"
              rel="popover"
              placement="bottom"
              data-trigger="hover"
            >${progressFileName}</h1>
          </div>
          <div class="dataset-card-row">
            <h1 
              class="dataset-card-subtitle-text progress-card-popover"
              data-tippy-content="Dataset subtitle: ${progressFileSubtitle}"
              rel="popover"
              data-placement="bottom"
              data-trigger="hover"
              style="font-weight: 400;"
            >
                ${progressFileSubtitle.length > 70
            ? `${progressFileSubtitle.substring(0, 70)}...`
            : progressFileSubtitle
        }
            </h1>
          </div>
          <div class="dataset-card-row">
            <h2 class="dataset-card-clock-icon">
              <i
                class="fas fa-clock-o progress-card-popover"
                data-tippy-content="Last modified: ${progressFileLastModified}"
                rel="popover"
                data-placement="bottom"
                data-trigger="hover"
              ></i>
            </h2>
            <h1 class="dataset-card-date-text">${progressFileLastModified}</h1>
            ${savedUploadDataProgress
            ? `
                  <span class="badge badge-warning mx-2">Incomplete upload</span>
                `
            : ``
        }
          </div>
        </div>
        <div class="dataset-card-button-container align-right">
          ${generateProgressResumptionButton(
            datasetStartingPoint,
            alreadyUploadedToPennsieve,
            progressFileName,
            workspaceUserNeedsToSwitchTo
        )}
          <h2 class="dataset-card-button-delete" onclick="window.deleteProgressCard(this)">
            <i
              class="fas fa-trash mr-sm-1"
            ></i>
            Delete progress file
          </h2>
        </div>
      </div>
    `;
};

document
    .getElementById("guided-button-resume-progress-file")
    .addEventListener("click", async () => {
        await guidedRenderProgressCards();
    });