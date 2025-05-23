import { pageNeedsUpdateFromPennsieve } from "../../pennsieveUtils";
import { setPageLoadingState } from "../navigationUtils/pageLoading";
import {
  addContributor,
  renderDatasetDescriptionContributorsTable,
} from "../../metadata/contributors";
import { addGuidedProtocol } from "../../metadata/protocols";
import Swal from "sweetalert2";
import Cropper from "cropperjs";
import client from "../../../client";
import api from "../../../others/api/api";
import { clientError, userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";
import { createParsedReadme } from "../../../metadata-files/datasetDescription";
import { renderManifestCards } from "../../manifests/manifest";
import { setTreeViewDatasetStructure } from "../../../../stores/slices/datasetTreeViewSlice";
import {
  setEntityType,
  setEntityListForEntityType,
  setActiveEntity,
} from "../../../../stores/slices/datasetEntitySelectorSlice";
import {
  guidedStudyOrganSystemsTagify,
  guidedStudyApproachTagify,
  guidedStudyTechniquesTagify,
  guidedOtherFundingsourcesTagify,
} from "../../tagifies/tagifies";
import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";
import { dragDrop, successCheck } from "../../../../assets/lotties/lotties";
import { renderProtocolsTable } from "../../metadata/protocols";
import { swalFileListSingleAction, swalShowInfo } from "../../../utils/swal-utils";
import { guidedDatasetKeywordsTagify } from "../../tagifies/tagifies";
import lottie from "lottie-web";
import { renderAdditionalLinksTable } from "../../guided-curate-dataset";
import { datasetIsSparcFunded } from "../../utils/sodaJSONObj";
import { setDropdownState } from "../../../../stores/slices/dropDownSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export const openPagePrepareMetadata = async (targetPageID) => {
  console.log(`Opening prepare metadata page: ${targetPageID}`);

  if (targetPageID === "guided-banner-image-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-banner-image-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      // If the fetch fails, (they don't have a banner image yet)
      const datasetName = window.sodaJSONObj["digital-metadata"]["name"];
      const datasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
      try {
        // pass in the id in case the name of the dataset has been
        // changed from the original Pennsieve dataset name
        let res = await api.getDatasetBannerImageURL(datasetID);
        if (res != "No banner image") {
          //Banner is returned as an s3 bucket url but image needs to be converted as
          //base64 to save and write to users local system
          let img_base64 = await window.getBase64(res); // encode image to base64
          let guided_img_url = res;
          let imageType = "";
          let fullBase64Image = "";
          let position = guided_img_url.search("X-Amz-Security-Token");
          if (position != -1) {
            // The image url will be before the security token
            let new_img_src = guided_img_url.substring(0, position - 1);
            let new_position = new_img_src.lastIndexOf("."); //
            if (new_position != -1) {
              window.imageExtension = new_img_src.substring(new_position + 1);
              if (window.imageExtension.toLowerCase() == "png") {
                fullBase64Image = "data:image/png;base64," + img_base64;
                imageType = "png";
              } else if (
                window.imageExtension.toLowerCase() == "jpeg" ||
                window.imageExtension.toLowerCase() == "jpg"
              ) {
                fullBase64Image = "data:image/jpg;base64," + img_base64;
                imageType = "jpg";
              } else {
                window.log.error(`An error happened: ${guided_img_url}`);
                Swal.fire({
                  icon: "error",
                  text: "An error occurred when importing the image. Please try again later.",
                  showConfirmButton: "OK",
                  backdrop: "rgba(0,0,0, 0.4)",
                  heightAuto: false,
                });
                window.logGeneralOperationsForAnalytics(
                  "Error",
                  window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
                  window.AnalyticsGranularity.ALL_LEVELS,
                  ["Importing Banner Image"]
                );
              }
            }
          }
          const homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");
          let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
          if (!window.fs.existsSync(imageFolder)) {
            //create SODA/guided-banner-images if it doesn't exist
            window.fs.mkdirSync(imageFolder, { recursive: true });
          }
          let imagePath = window.path.join(imageFolder, `${datasetName}.` + imageType);
          //store file at imagePath destination
          await window.electron.ipcRenderer.invoke("write-banner-image", img_base64, imagePath);
          //save imagePath to sodaJson
          window.sodaJSONObj["digital-metadata"]["banner-image-path"] = imagePath;
          //add image to modal and display image on main banner import page
          $("#guided-image-banner").attr("src", fullBase64Image);
          $("#guided-para-path-image").html(imagePath);
          document.getElementById("guided-div-img-container-holder").style.display = "none";
          document.getElementById("guided-div-img-container").style.display = "block";
          //set new cropper for imported image
          window.myCropper.destroy();
          window.myCropper = new Cropper(
            window.guidedBfViewImportedImage,
            window.guidedCropOptions
          );
          $("#guided-save-banner-image").css("visibility", "visible");
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
      } catch (error) {
        clientError(error);
        const emessage = userErrorMessage(error);
        await guidedShowOptionalRetrySwal(emessage, "guided-banner-image-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
      }
    }
    if (window.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
      //added extra param to function to prevent modification of URL
      guidedShowBannerImagePreview(
        window.sodaJSONObj["digital-metadata"]["banner-image-path"],
        true
      );
      document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
    } else {
      //reset the banner image page
      $("#guided-button-add-banner-image").html("Add banner image");
      $("#guided-banner-image-preview-container").hide();
    }
  }

  if (targetPageID === "guided-pennsieve-metadata-intro-tab") {
    console.log("Opening Pennsieve metadata intro page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "guided-pennsieve-intro-tab") {
    const elementsToShowWhenLoggedInToPennsieve = document.querySelectorAll(".show-when-logged-in");
    const elementsToShowWhenNotLoggedInToPennsieve =
      document.querySelectorAll(".show-when-logged-out");
    if (!window.defaultBfAccount) {
      elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
        element.classList.add("hidden");
      });
      elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
        element.classList.remove("hidden");
      });
    } else {
      elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
        element.classList.remove("hidden");
      });
      elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
        element.classList.add("hidden");
      });

      const pennsieveIntroText = document.getElementById("guided-pennsive-intro-ps-account");
      // fetch the user's email and set that as the account field's value
      const userInformation = await api.getUserInformation();
      const userEmail = userInformation.email;
      pennsieveIntroText.innerHTML = userEmail;

      try {
        if (window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"]) {
          if (
            window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] ===
            guidedGetCurrentUserWorkSpace()
          ) {
            document.getElementById("guided-confirm-pennsieve-organization-button").click();
          }
        }
      } catch (error) {
        pennsieveIntroAccountDetailsText.innerHTML = "Error loading account details";
      }
    }
  }

  if (targetPageID === "guided-designate-permissions-tab") {
    console.log("Opening Pennsieve user permissions page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "guided-assign-license-tab") {
    console.log("Opening sharing license page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "guided-aux-folder-tab") {
    console.log("Opening auxiliary data import page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "guided-contributors-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-contributors-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "dataset_description.xlsx",
          },
        });
        let contributorData = metadata_import.data["Contributor information"];
        //Filter out returned rows that only contain empty srings (first name is checked)
        const currentContributorFullNames = getContributorFullNames();
        contributorData = contributorData = contributorData.filter((row) => {
          return row[0] !== "" && !currentContributorFullNames.includes(row[0]);
        });

        // Loop through the contributorData array besides the first row (which is the header)
        for (let i = 1; i < contributorData.length; i++) {
          const contributors = contributorData[i];
          // split the name into first and last name with the first name being the first element and last name being the rest of the elements
          const contributorFullName = contributors[0];
          const contributorID = contributors[1];
          const contributorAffiliation = contributors[2].split(", ");
          const contributorRoles = contributors[3].split(", ");
          try {
            addContributor(
              contributorFullName,
              contributorID,
              contributorAffiliation,
              contributorRoles
            );
          } catch (error) {
            console.log(error);
          }
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, "guided-contributors-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
      }
    }

    renderDatasetDescriptionContributorsTable();
  }

  if (targetPageID === "guided-protocols-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-protocols-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "dataset_description.xlsx",
          },
        });
        let relatedInformationData = metadata_import.data["Related information"];
        const protocolsFromPennsieve = relatedInformationData.filter((relatedInformationArray) => {
          return (
            relatedInformationArray[1] === "IsProtocolFor" && relatedInformationArray[2] !== ""
          );
        });

        for (const protocol of protocolsFromPennsieve) {
          const protocolLink = protocol[2];
          const protocolDescription = protocol[0];
          const protocolType = protocol[3];
          try {
            addGuidedProtocol(protocolLink, protocolDescription, protocolType);
          } catch (error) {
            console.log(error);
          }
        }
        // Click the yes protocol button if protocols were imported
        if (protocolsFromPennsieve.length > 0) {
          document.getElementById("guided-button-user-has-protocols").click();
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, "guided-protocols-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
      }
    }
    renderProtocolsTable();
  }

  if (targetPageID === "guided-create-readme-metadata-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-create-readme-metadata-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        let readme_import = await client.get(`/prepare_metadata/readme_changes_file`, {
          params: {
            file_type: "README",

            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
          },
        });
        let readme_text = readme_import.data.text;
        window.sodaJSONObj["dataset_metadata"]["README"] = readme_text;
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
          "guided-create-readme-metadata-tab"
        );
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, "guided-create-readme-metadata-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
          "guided-create-readme-metadata-tab"
        );
      }
    }
    const readMeTextArea = document.getElementById("guided-textarea-create-readme");

    const readMe = window.sodaJSONObj["dataset_metadata"]["README"];

    if (readMe) {
      readMeTextArea.value = readMe;
    } else {
      readMeTextArea.value = "";
    }
  }

  if (targetPageID === "guided-add-code-metadata-tab") {
    const startNewCodeDescYesNoContainer = document.getElementById(
      "guided-section-start-new-code-metadata-query"
    );
    const startPennsieveCodeDescYesNoContainer = document.getElementById(
      "guided-section-start-from-pennsieve-code-metadata-query"
    );
    if (pageNeedsUpdateFromPennsieve("guided-add-code-metadata-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            file_type: "code_description.xlsx",
          },
        });
        window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] = "yes";
      } catch (error) {
        console.error("code_description file does not exist");
      }
    }
    // If the code_description file has been detected on the dataset on Pennsieve, show the
    // "Start from Pennsieve" option, otherwise show the "Start new" option
    if (window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] === "yes") {
      startNewCodeDescYesNoContainer.classList.add("hidden");
      startPennsieveCodeDescYesNoContainer.classList.remove("hidden");
    } else {
      startNewCodeDescYesNoContainer.classList.remove("hidden");
      startPennsieveCodeDescYesNoContainer.classList.add("hidden");
    }

    const codeDescriptionPath =
      window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"];

    const codeDescriptionLottieContainer = document.getElementById(
      "code-description-lottie-container"
    );
    const codeDescriptionParaText = document.getElementById("guided-code-description-para-text");

    if (codeDescriptionPath) {
      codeDescriptionLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: codeDescriptionLottieContainer,
        animationData: successCheck,
        renderer: "svg",
        loop: false,
        autoplay: true,
      });
      codeDescriptionParaText.innerHTML = codeDescriptionPath;
    } else {
      //reset the code metadata lotties and para text
      codeDescriptionLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: codeDescriptionLottieContainer,
        animationData: dragDrop,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      codeDescriptionParaText.innerHTML = "";
    }
  }

  if (targetPageID === "guided-create-description-metadata-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-create-description-metadata-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      try {
        let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
          params: {
            selected_account: window.defaultBfAccount,
            selected_dataset: window.sodaJSONObj["ps-dataset-selected"]["dataset-name"],
            file_type: "dataset_description.xlsx",
          },
        });
        // guidedLoadDescriptionDatasetInformation
        let basicInformation = metadata_import.data["Basic information"];

        // First try to get the keywords from the imported dataset description metadata
        if (basicInformation[3][0] === "Keywords") {
          const studyKeywords = basicInformation[3].slice(1).filter((keyword) => keyword !== "");

          // If more than 1 keyword is found, add store them to be loaded into the UI
          // Otherwise, use the tags on Pennsieve
          if (studyKeywords.length != 0) {
            window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"][
              "keywords"
            ] = studyKeywords;
          }
        }

        // guidedLoadDescriptionStudyInformation
        let studyInformation = metadata_import.data["Study information"];

        // Declare an object and add all of the study information to it
        const studyInformationObject = {};
        for (let i = 0; i < studyInformation.length; i++) {
          const studyInformationArray = studyInformation[i];
          // Lowercase the key (e.g. Study approach -> study approach)
          const studyInformationKey = studyInformationArray[0].toLowerCase();
          // The value is the second element in the array
          const studyInformationValue = studyInformationArray[1];

          studyInformationObject[studyInformationKey] = studyInformationValue;
        }

        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"] =
          studyInformationObject;

        // guidedLoadDescriptionStudyDesign
        let awardInformation = metadata_import.data["Award information"];
        if (awardInformation[0][0] === "Funding" && awardInformation[1][0] === "Acknowledgments") {
          const studyFunding = awardInformation[1].slice(1).filter((funding) => funding !== "");
          const studyAcknowledgements = awardInformation[1]
            .slice(1)
            .filter((acknowledgement) => acknowledgement !== "");

          window.sodaJSONObj["dataset_metadata"]["description-metadata"][
            "contributor-information"
          ] = {
            funding: studyFunding,
            acknowledgment: studyAcknowledgements,
          };
        }
        // Add  the related Links
        let relatedInformationData = metadata_import.data["Related information"];

        // Filter out invalid Links and protocol links
        const additionalLinksFromPennsieve = relatedInformationData
          .slice(1)
          .filter((relatedInformationArray) => {
            return (
              relatedInformationArray[0] !== "" &&
              relatedInformationArray[1] != "IsProtocolFor" &&
              relatedInformationArray[2] !== "" &&
              relatedInformationArray[3] !== ""
            );
          });
        const currentAddtionalLinks = getGuidedAdditionalLinks();
        for (const link of additionalLinksFromPennsieve) {
          const additionalLinkDescription = link[0];
          const additionalLinkRelation = link[1];
          const additionalLinkLink = link[2];
          const additionalLinkType = link[3];
          // If the ink has already been added, delete it and add the updated data
          // from Pennsieve
          if (currentAddtionalLinks.includes(additionalLinkLink)) {
            window.deleteAdditionalLink(additionalLinkLink);
          }
          window.sodaJSONObj["dataset_metadata"]["description-metadata"]["additional-links"].push({
            link: additionalLinkLink,
            relation: additionalLinkRelation,
            description: additionalLinkDescription,
            type: additionalLinkType,
            isFair: true,
          });
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
          "guided-create-description-metadata-tab"
        );
      } catch (error) {
        clientError(error);
        const emessage = error.response.data.message;
        await guidedShowOptionalRetrySwal(emessage, "guided-create-description-metadata-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
          "guided-create-description-metadata-tab"
        );
      }
      // If the dataset keywords were not set from the imported metadata, try to get them from the Pennsieve tags
      const keywordsDerivedFromDescriptionMetadata =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"]?.[
          "keywords"
        ];
      if (!keywordsDerivedFromDescriptionMetadata) {
        try {
          const currentDatasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
          const tagsReq = await client.get(`/manage_datasets/datasets/${currentDatasetID}/tags`, {
            params: { selected_account: window.defaultBfAccount },
          });
          const { tags } = tagsReq.data;
          if (tags.length > 0) {
            window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"][
              "keywords"
            ] = tags;
          }
        } catch (error) {
          // We don't need to do anything if this fails, but the user will have to enter the new tags before continuing
          clientError(error);
        }
      }

      // If the study information was not set from the imported metadata, try to extract it from the Pennsieve dataset description
      const studyPurpose =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study purpose"
        ];
      const studyDataCollection =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study data collection"
        ];
      const studyPrimaryConclusion =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study primary conclusion"
        ];

      if (!studyPurpose && !studyDataCollection && !studyPrimaryConclusion) {
        try {
          const pennsieveDatasetDescription = await api.getDatasetReadme(
            window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
          );
          const parsedDescription = createParsedReadme(pennsieveDatasetDescription);
          if (parsedDescription["Study Purpose"]) {
            window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"][
              "study purpose"
            ] = parsedDescription["Study Purpose"].replace(/\r?\n|\r/g, "").trim();
          }
          if (parsedDescription["Data Collection"]) {
            window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"][
              "study data collection"
            ] = parsedDescription["Data Collection"].replace(/\r?\n|\r/g, "").trim();
          }
          if (parsedDescription["Primary Conclusion"]) {
            window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"][
              "study primary conclusion"
            ] = parsedDescription["Primary Conclusion"].replace(/\r?\n|\r/g, "").trim();
          }
        } catch (error) {
          // We don't need to do anything if this fails, but the user will have to enter the study information before continuing
          clientError(error);
        }
      }
    }

    const guidedLoadDescriptionDatasetInformation = () => {
      // Reset the keywords tags and add the stored ones if they exist in the JSON
      guidedDatasetKeywordsTagify.removeAllTags();
      const datasetKeyWords =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"]?.[
          "keywords"
        ];
      if (datasetKeyWords) {
        guidedDatasetKeywordsTagify.addTags(datasetKeyWords);
      }
    };
    guidedLoadDescriptionDatasetInformation();

    const guidedLoadDescriptionStudyInformation = () => {
      const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
      const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
      const studyPrimaryConclusionInput = document.getElementById(
        "guided-ds-study-primary-conclusion"
      );
      const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");

      //reset the inputs
      studyPurposeInput.value = "";
      studyDataCollectionInput.value = "";
      studyPrimaryConclusionInput.value = "";
      studyCollectionTitleInput.value = "";
      guidedStudyOrganSystemsTagify.removeAllTags();
      guidedStudyApproachTagify.removeAllTags();
      guidedStudyTechniquesTagify.removeAllTags();

      // Set the inputs if their respective keys exist in the JSON
      // (if not, the input will remain blank)
      const studyPurpose =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study purpose"
        ];
      if (studyPurpose) {
        studyPurposeInput.value = studyPurpose;
      }

      const studyDataCollection =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study data collection"
        ];
      if (studyDataCollection) {
        studyDataCollectionInput.value = studyDataCollection;
      }

      const studyPrimaryConclusion =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study primary conclusion"
        ];
      if (studyPrimaryConclusion) {
        studyPrimaryConclusionInput.value = studyPrimaryConclusion;
      }

      const studyCollectionTitle =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study collection title"
        ];
      if (studyCollectionTitle) {
        studyCollectionTitleInput.value = studyCollectionTitle;
      }

      const studyOrganSystems =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study organ system"
        ];
      if (studyOrganSystems) {
        guidedStudyOrganSystemsTagify.addTags(studyOrganSystems);
      }

      const studyApproach =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study approach"
        ];
      if (studyApproach) {
        guidedStudyApproachTagify.addTags(studyApproach);
      }

      const studyTechniques =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"]?.[
          "study technique"
        ];
      if (studyTechniques) {
        guidedStudyTechniquesTagify.addTags(studyTechniques);
      }
    };
    guidedLoadDescriptionStudyInformation();

    const guidedLoadDescriptionContributorInformation = () => {
      const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
      const contributorInformationMetadata =
        window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributor-information"];

      guidedOtherFundingsourcesTagify.removeAllTags();

      if (contributorInformationMetadata) {
        acknowledgementsInput.value = contributorInformationMetadata["acknowledgment"];
        guidedOtherFundingsourcesTagify.addTags(contributorInformationMetadata["funding"]);
      } else {
        acknowledgementsInput.value = "";
        guidedOtherFundingsourcesTagify.removeAllTags();
      }
    };
    guidedLoadDescriptionContributorInformation();

    renderAdditionalLinksTable();

    const otherFundingLabel = document.getElementById("SPARC-award-other-funding-label");

    if (datasetIsSparcFunded()) {
      otherFundingLabel.innerHTML = ` besides the SPARC Award: ${window.sodaJSONObj["dataset_metadata"]["shared-metadata"]["sparc-award"]}`;
    } else {
      otherFundingLabel.innerHTML = "";
    }
  }

  if (targetPageID === "guided-dataset-metadata-intro-tab") {
    console.log("Opening dataset metadata intro page");
    // Initialize any required components or state for the intro page
  }

  if (targetPageID === "guided-subjects-metadata-tab") {
    console.log("Opening subjects metadata page");
    // This has componentType "entity-metadata-page" which likely handles most of the page functionality
    setEntityType("subjects");
  }

  if (targetPageID === "guided-samples-metadata-tab") {
    console.log("Opening samples metadata page");
    // This has componentType "entity-metadata-page" which likely handles most of the page functionality
    setEntityType("samples");
  }

  if (targetPageID === "guided-resources-entity-addition-tab") {
    console.log("Opening experimental resources page");
    // This has componentType "resources-management-page" which likely handles most of the page functionality
  }

  if (targetPageID === "guided-create-changes-metadata-tab") {
    console.log("Opening CHANGES metadata page");

    // Handle loading existing CHANGES content if available
    const changesMetadata = window.sodaJSONObj["dataset_metadata"]["CHANGES"];
    const changesTextArea = document.getElementById("guided-textarea-create-changes");

    if (changesTextArea && changesMetadata) {
      changesTextArea.value = changesMetadata;
    } else if (changesTextArea) {
      changesTextArea.value = "";
    }
  }

  if (targetPageID === "guided-create-local-copy-tab") {
    console.log("Opening complete dataset structure review page");
    // Initialize the dataset structure review, possibly updating tree views or summaries

    // Update tree view if that component is used here
    if (window.datasetStructureJSONObj) {
      setTreeViewDatasetStructure(window.datasetStructureJSONObj, []);
    }
  }
};

const getContributorFullNames = () => {
  return window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributors"].map(
    (contributor) => {
      return contributor.conName;
    }
  );
};

const getGuidedAdditionalLinks = () => {
  return window.sodaJSONObj["dataset_metadata"]["description-metadata"]["additional-links"].map(
    (link) => link.link
  );
};
