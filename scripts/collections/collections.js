//upload new collection tags or check if none
$("#button-bf-collection").on("click", async () => {
  setTimeout(async () => {
    let selectedDataset = defaultBfDataset;
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
    for (var [key, value] of Object.entries(currentTags)) {
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
        if (comparison in allCollectionTags) {
          //modified comma name in whitelist
          //check if in old tags
          if (!(comparison in currentTags)) {
            //modified comma name not in currentTags and is in allcollectiontags
            whiteListTags.push(allCollectionTags[comparison]["id"]);
          } //else is in whitelist but in current tags so do nothing
        } else {
          //not in the whitelist so either new or removed
          newTags.push(newCollectionTags[i]);
        }
      } else {
        //tag element does not have commas so just compare
        if (newCollectionTags[i] in allCollectionTags) {
          //tag is in whitelist but check if already added to dataset
          if (!(newCollectionTags[i] in currentTags)) {
            //not in removed ts and so tag is new
            whiteListTags.push(allCollectionTags[newCollectionTags[i]]["id"]);
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
        await api.uploadCollectionTags(defaultBfAccount, defaultBfDataset, whiteListTags);
        success.push(true);
      } catch (error) {
        clientError(error);
        success.push(false);
      }
    }

    if (removeTags.length > 0) {
      //remove collection names
      try {
        await api.removeCollectionTags(defaultBfAccount, defaultBfDataset, removeTags);
        success.push(true);
      } catch (error) {
        clientError(error);
        success.push(false);
      }
    }

    if (newTags.length > 0) {
      //upload tags that haven't been created on pennsieve (no ID)
      try {
        await api.uploadNewTags(defaultBfAccount, defaultBfDataset, newTags);
        success.push(true);
      } catch (error) {
        clientError(error);
        success.push(false);
      }
    }

    await updateCollectionWhiteList();
    Swal.close();
    if (!success.includes(false)) {
      Swal.fire({
        title: "Successfully updated collection from " + defaultBfDataset,
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    } else {
      Swal.fire({
        title: "Something went wrong trying to modify collections",
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }

    log.info(`Adding dataset '${selectedDataset}' to Collection'`);
  }, delayAnimation);
});

const updateCollectionWhiteList = async () => {
  let collection_list = await api.getAllCollectionTags(defaultBfAccount);
  let currentCollectionList = await api.getCurrentCollectionTags(
    defaultBfAccount,
    defaultBfDataset
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
    let datasetName = document.getElementById("collection_dataset_name").innerText;
    Swal.fire({
      title: `Getting collection of dataset: ${datasetName}`,
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

  let collection_list = await api.getAllCollectionTags(defaultBfAccount);
  let current_tags = await api.getCurrentCollectionTags(defaultBfAccount, defaultBfDataset);

  let collectionNames = Object.keys(collection_list);
  let currentCollectionNames = Object.keys(current_tags);

  currentCollectionNames.sort();
  collectionNames.sort();

  //put the gathered collection names to the tagify whitelist
  collectionDatasetTags.settings.whitelist = collectionNames;
  currentCollectionTags = currentCollectionNames;
  collectionDatasetTags.removeAllTags();
  collectionDatasetTags.addTags(currentCollectionNames);

  //if on collection section close the shown sweet alert
  if (collection_section.classList.contains("is-shown")) Swal.close();
});
