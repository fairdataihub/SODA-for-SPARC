import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "./utils.js";
// Import state management stores
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { setDropdownState } from "../../../../stores/slices/dropDownSlice";
import api from "../../../others/api/api";
import { clientError } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { setPageLoadingState } from "../navigationUtils/pageLoading.js";
import { setSelectedEntities } from "../../../../stores/slices/datasetContentSelectorSlice.js";
import client from "../../../client";

// TODO: Place this inside of a SODAJSONObj accessing file/function that is imported across all guided mode files

import { pageNeedsUpdateFromPennsieve } from "../../pennsieveUtils";

export const openPageCurationPreparation = async (targetPageID) => {
  console.log("Executing this thang now");
  if (targetPageID === "guided-ask-if-submission-is-sparc-funded-tab") {
    if (pageNeedsUpdateFromPennsieve(targetPageID)) {
      setPageLoadingState(true);
      try {
        // Get the submission metadata from Pennsieve
        const submissionMetadataRes = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "submission.xlsx",
          },
        });
        const submissionData = submissionMetadataRes.data;

        const pennsieveConsortiumDataStandard = submissionData["Consortium data standard"]
          .trim()
          .toUpperCase();

        if (pennsieveConsortiumDataStandard === "SPARC") {
          document.getElementById("guided-button-dataset-is-sparc-funded").click();
        } else if (pennsieveConsortiumDataStandard === "HEAL") {
          document.getElementById("guided-button-dataset-is-re-join-funded").click();
        } else {
          document.getElementById("guided-button-dataset-is-not-sparc-funded").click();
          document.getElementById("guided-button-non-sparc-user-has-contacted-sparc").click();
        }

        // Set the funding consortium
        const pennsieveFundingConsortium = submissionData["Funding consortium"]
          .trim()
          .toUpperCase();

        if (window.sparcFundingConsortiums.includes(pennsieveFundingConsortium)) {
          // Pre-set the funding consortium so it is set in the dropdown
          window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"] =
            pennsieveFundingConsortium;
        }
      } catch (error) {
        const emessage = userErrorMessage(error);
        console.error(emessage);
      }
    }

    // Set the funding consortium dropdown to the saved value (deafult is empty string before a user selects a value)
    const savedFundingConsortium =
      window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"];
    setDropdownState("guided-select-sparc-funding-consortium", savedFundingConsortium);
  }
};
