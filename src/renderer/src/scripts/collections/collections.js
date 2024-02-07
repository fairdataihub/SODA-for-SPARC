import Swal from "sweetalert2";
import { clientError } from "../others/http-error-handler/error-handler";
import api from "../others/api/api";
import kombuchaEnums from "../analytics/analytics-enums";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// this function runs when the DOM is ready, i.e. when the document has been parsed
$(document).ready(function () {
  //upload new collection tags or check if none
  $("#button-bf-collection").on("click", async () => {
    setTimeout(async () => {
      let selectedDataset = window.defaultBfDataset;
      let newCollectionTags = [];
      let whiteListTags = [];
      let newTags = [];
      let removeTags = [];
      let success = [];

      Swal.fire({
        title: `Modifying collection for ${selectedDataset}`,
        html: "Please wait...",
        // timer: 5000,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      //user selected/created collection tags are gathered
      for (let i = 0; i < collectionDatasetTags.value.length; i++) {
        let tagName = collectionDatasetTags.value[i]["value"];
        if (tagName.includes("，")) {
          let originalCommaName = tagName.replace(/，/g, ",");
          newCollectionTags.push(originalCommaName);
        } else {
          newCollectionTags.push(tagName);
        }
      }

      //check if old collections tags are still there
      for (var [key, value] of Object.entries(window.currentTags)) {
        if (key.includes("，")) {
          //key was modified so compare with original-name
          if (!newCollectionTags.includes(value["original-name"])) {
            //did not match with original name so it was removed
            removeTags.push(value["id"]);
          }
        } else {
          //key was not modified
          if (!newCollectionTags.includes(key)) {
            //key is not in updated tags so it was removed
            removeTags.push(value["id"]);
          }
        }
      }

      //iterate through new collection tags and separate accordingly
      //whiteListedTags: tags that have already been created on Pennsieve
      //newTags: tags that are new and need to be created on Pennsieve before assigning to dataset
      //removeTags: tags that are not in newCollectionTag array and will be removed from dataset
      for (let i = 0; i < newCollectionTags.length; i++) {
        if (newCollectionTags[i].includes(",")) {
          //need to compare with original name
          let comparison = newCollectionTags[i].replace(/,/g, "，");
          if (comparison in window.allCollectionTags) {
            //modified comma name in whitelist
            //check if in old tags
            if (!(comparison in window.currentTags)) {
              //modified comma name not in window.currentTags and is in window.allCollectionTags
              whiteListTags.push(window.allCollectionTags[comparison]["id"]);
            } //else is in whitelist but in current tags so do nothing
          } else {
            //not in the whitelist so either new or removed
            newTags.push(newCollectionTags[i]);
          }
        } else {
          //tag element does not have commas so just compare
          if (newCollectionTags[i] in window.allCollectionTags) {
            //tag is in whitelist but check if already added to dataset
            if (!(newCollectionTags[i] in window.currentTags)) {
              //not in removed ts and so tag is new
              whiteListTags.push(window.allCollectionTags[newCollectionTags[i]]["id"]);
            }
          } else {
            //not in whitelist so either new or removed tag
            newTags.push(newCollectionTags[i]);
          }
        }
      }

      if (whiteListTags.length > 0) {
        //collection names that are already have an ID
        try {
          let uploadTagsStatus = await api.uploadCollectionTags(
            window.defaultBfAccount,
            window.defaultBfDataset,
            whiteListTags
          );
          if (uploadTagsStatus === false) {
            success.push(false);
          } else {
            success.push(true);
          }
        } catch (error) {
          success[0] = false;
          clientError(error);
        }
      }

      if (removeTags.length > 0) {
        //remove collection names
        try {
          let removeStatus = await api.removeCollectionTags(
            window.defaultBfAccount,
            window.defaultBfDataset,
            removeTags
          );
          if (removeStatus === false) {
            success.push(false);
          } else {
            success.push(true);
          }
        } catch (error) {
          clientError(error);
        }
      }

      if (newTags.length > 0) {
        //upload tags that haven't been created on pennsieve (no ID)
        try {
          let newTagsStatus = await api.uploadNewTags(
            window.defaultBfAccount,
            window.defaultBfDataset,
            newTags
          );
          if (newTagsStatus === false) {
            success.push(false);
          } else {
            success.push(true);
          }
        } catch (error) {
          clientError(error);
        }
      }

      await updateCollectionWhiteList();
      Swal.close();
      if (!success.includes(false)) {
        Swal.fire({
          title: `Successfully updated collection from ${defaultBfDataset}`,
          icon: "success",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.COLLECTIONS,
          kombuchaEnums.Status.SUCCESS,
          {
            value: whiteListTags.length + newTags.length - removeTags.length,
            dataset_name: window.defaultBfDataset,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      } else {
        Swal.fire({
          title: "Something went wrong trying to modify collections",
          text: "Please try again later.",
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.MANAGE_DATASETS,
          kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
          kombuchaEnums.Label.COLLECTIONS,
          kombuchaEnums.Status.FAIL,
          {
            value: 1,
            dataset_name: window.defaultBfDataset,
            dataset_id: window.defaultBfDatasetId,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      log.info(`Adding dataset '${selectedDataset}' to Collection'`);
    }, delayAnimation);
  });

  const updateCollectionWhiteList = async () => {
    let collection_list = await api.getAllCollectionTags(window.defaultBfAccount);
    let currentCollectionList = await api.getCurrentCollectionTags(
      window.defaultBfAccount,
      window.defaultBfDataset
    );

    let currentCollectionNames = Object.keys(currentCollectionList);
    let collectionNames = Object.keys(collection_list);

    currentCollectionNames.sort();
    collectionNames.sort();

    //remove old tags before attaching current collection tags
    collectionDatasetTags.removeAllTags();
    collectionDatasetTags.addTags(currentCollectionNames);

    //add collection tags to whitelist of tagify
    collectionDatasetTags.settings.whitelist = collectionNames;
  };

  //object with both id and name of collection tags
  $("#button-collection-dataset-confirm").on("click", async () => {
    let collection_section = document.getElementById("add_edit_bf_dataset_collection-section");

    //sweet alert will show only if user is on the collections section
    if (collection_section.classList.contains("is-shown")) {
      let dataset_name = $(
        "#collection_BF_account_tab .change-current-account.ds-dd.dataset-name h5"
      ).html();
      Swal.fire({
        title: `Getting collection of dataset: ${dataset_name}`,
        html: "Please wait...",
        // timer: 5000,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    let collection_list = await api.getAllCollectionTags(window.defaultBfAccount);
    let current_tags = await api.getCurrentCollectionTags(
      window.defaultBfAccount,
      window.defaultBfDataset
    );

    let collectionNames = Object.keys(collection_list);
    let currentCollectionNames = Object.keys(current_tags);

    currentCollectionNames.sort();
    collectionNames.sort();

    //put the gathered collection names to the tagify whitelist
    collectionDatasetTags.settings.whitelist = collectionNames;
    window.currentCollectionTags = currentCollectionNames;
    collectionDatasetTags.removeAllTags();
    collectionDatasetTags.addTags(currentCollectionNames);

    //if on collection section close the shown sweet alert
    if (collection_section.classList.contains("is-shown")) {
      Swal.close();
    }
  });
});
