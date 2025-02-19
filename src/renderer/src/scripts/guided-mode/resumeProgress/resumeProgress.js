import Swal from "sweetalert2";
import { guidedTransitionFromHome } from "../pages/navigate";
import { checkIfDatasetExistsOnPennsieve } from "../pennsieveUtils";
import { attachGuidedMethodsToSodaJSONObj } from "../utils/sodaJSONObj";
import { guidedSkipPage, guidedUnSkipPage, getNonSkippedGuidedModePages } from "../pages/navigationUtils/pageSkipping";
import {guidedGetCurrentUserWorkSpace} from "../workspaces/workspaces"
import { getProgressFileData } from "./progressFile";
import { openPage } from "../pages/openPage";
import api from "../../others/api/api"
import client from "../../client"
import { clientError } from "../../others/http-error-handler/error-handler";

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


const guidedGetPageToReturnTo = async () => {
    // Set by openPage function
    const usersPageBeforeExit = window.sodaJSONObj["page-before-exit"];

    //If the dataset was successfully uploaded, send the user to the share with curation team
    if (window.sodaJSONObj["previous-guided-upload-dataset-name"]) {
        return "guided-dataset-dissemination-tab";
    }

    // returns the id of the first page of guided mode
    const firstPageID = getNonSkippedGuidedModePages(document)[0].id;

    const currentSodaVersion = document.getElementById("version").innerHTML;
    const lastVersionOfSodaUsedOnProgressFile = window.sodaJSONObj["last-version-of-soda-used"];

    if (lastVersionOfSodaUsedOnProgressFile != currentSodaVersion) {
        // If the progress file was last edited in a previous SODA version, reset to the first page
        await swalShowInfo(
            "SODA has been updated since you last worked on this dataset.",
            "You'll be taken to the first page to ensure compatibility with the latest workflow. Your previous work is saved and accessible."
        );
        return firstPageID;
    }

    if (guidedCheckIfUserNeedsToReconfirmAccountDetails() === true) {
        return "guided-pennsieve-intro-tab";
    }

    // If the page the user was last on no longer exists, return them to the first page
    if (!document.getElementById(usersPageBeforeExit)) {
        return firstPageID;
    }

    // If the user left while the upload was in progress, send the user to the upload confirmation page
    if (usersPageBeforeExit === "guided-dataset-generation-tab") {
        return "guided-dataset-generation-confirmation-tab";
    }
    // If no special cases apply, return the user to the page they were on before they left
    return usersPageBeforeExit;
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

const guidedCheckIfUserNeedsToReconfirmAccountDetails = () => {
    if (!window.sodaJSONObj["completed-tabs"].includes("guided-pennsieve-intro-tab")) {
        return false;
    }
    // If the user has changed their Pennsieve account, they need to confirm their new Pennsieve account and workspace
    if (window.sodaJSONObj?.["last-confirmed-bf-account-details"] !== window.defaultBfAccount) {
        if (window.sodaJSONObj["button-config"]?.["pennsieve-account-has-been-confirmed"]) {
            delete window.sodaJSONObj["button-config"]["pennsieve-account-has-been-confirmed"];
        }
        if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
            delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
        }
        return true;
    }
    // If the user has changed their Pennsieve workspace, they need to confirm their new workspace
    if (
        guidedGetCurrentUserWorkSpace() !=
        window.sodaJSONObj?.["last-confirmed-pennsieve-workspace-details"]
    ) {
        if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
            delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
        }
        return true;
    }
    // Return false if the user does not need to reconfirm their account details
    return false;
};


