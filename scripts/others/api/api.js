/*
Purpose: An abstraction layer between the client and making HTTP requests via Axios. This layer handles the error parsing and logging.
*/

const getUserInformation = async () => {
  let userResponse = await client.get(`/user`, {
    params: {
      pennsieve_account: defaultBfAccount,
    },
  });

  let user = userResponse.data;
  return user;
};

/**
 *
 * @param {string} datasetNameOrID - the current dataset name or id
 * @returns {datasetObject} dataset - the dataset object
 */
const getDataset = async (datasetNameOrID) => {
  let datasetResponse = await client.get(`/datasets/${datasetNameOrID}`);
  return datasetResponse.data;
};

const getDatasetBannerImageURL = async (selected_account, selected_dataset) => {
  let bannerResponse = await client.get(`/manage_datasets/bf_banner_image`, {
    params: {
      selected_account,
      selected_dataset,
    },
  });

  let { banner_image } = bannerResponse.data;

  return banner_image;
};

const getDatasetRole = async (datasetNameOrId) => {
  console.log(datasetNameOrId);
  if (datasetNameOrId != undefined || datasetNameOrId != "") {
    defaultBfDataset = datasetNameOrId;
  }

  console.log(defaultBfDataset);
  let datasetRoleResponse = await client.get(`/datasets/${defaultBfDataset}/role`, {
    params: {
      pennsieve_account: defaultBfAccount,
    },
  });

  let { role } = datasetRoleResponse.data;

  return role;
};

/**
 * Withdraw any dataset from a pre-publishing review submission
 * @param {string} datasetIdOrName
 * @returns {Promise<void>}
 */
const withdrawDatasetReviewSubmission = async (datasetName, selected_account) => {
  await client.post(`/disseminate_datasets/datasets/${datasetName}/publication/cancel`, {
    selected_account,
  });
};

const getFilesExcludedFromPublishing = async (datasetName) => {
  // get the excluded files
  let excludedFilesRes = await client.get(
    `/disseminate_datasets/datasets/${datasetName}/ignore-files`,
    {
      params: {
        selected_account: defaultBfAccount,
      },
    }
  );

  let { ignore_files } = excludedFilesRes.data;

  return ignore_files;
};

// tell Pennsieve to ignore a set of user selected files when publishing their dataset.
// this keeps those files hidden from the public but visible to publishers and collaboraors.
// I:
//  datasetIdOrName: string - dataset name
//  files: [{fileName: string}] - An array of file name objects
const updateDatasetExcludedFiles = async (account, datasetName, files) => {
  // create the request options
  await client.put(`/disseminate_datasets/datasets/${datasetName}/ignore-files`, {
    ignore_files: files,
    selected_account: account,
  });
};

// retrieves the currently selected dataset's metadata files
// I:
//  datasetName: string - Selected dataset name
const getDatasetMetadataFiles = async (datasetName) => {
  // get the metadata files for the dataset
  let datasetwithChildrenResponse = await client.get(
    `/disseminate_datasets/datasets/${datasetName}/metadata-files`,
    {
      params: {
        selected_account: defaultBfAccount,
      },
    }
  );

  let { metadata_files } = datasetwithChildrenResponse.data;

  // return the metdata files to the client
  return metadata_files;
};

const getDatasetPermissions = async (selected_account, selected_dataset, boolReturnAll) => {
  let getDatasetPermissionsResponse = await client.get(`/manage_datasets/bf_dataset_permissions`, {
    params: {
      selected_account,
      selected_dataset,
    },
  });

  let { permissions } = getDatasetPermissionsResponse.data;

  if (boolReturnAll) {
    // Return all permissions data: permissions array, team_ids object
    return getDatasetPermissionsResponse.data;
  } else {
    // Return only the permissions array
    return permissions;
  }
};

// This function will be call after a dataset has been shared with the curation team
// Users will be able to reserve DOI's for their datasets
const reserveDOI = async (account, dataset) => {
  // reference: https://docs.pennsieve.io/reference/reservedoi
  // information: https://docs.pennsieve.io/docs/digital-object-identifiers-dois#assigning-doi-to-your-pennsieve-dataset

  console.log(account);
  console.log(dataset);

  // TODO: Create endpoint to reserve DOI
  try {
    let doiReserve = await client.post(`datasets/${dataset}/reserve-doi`);
    console.log(doiReserve);
    // Save DOI to SODAJSONObj
    return doiReserve.data.doi;
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
};

const getDatasetDOI = async (account, dataset) => {
  // reference: https://docs.pennsieve.io/reference/getdoi
  console.log(account);
  console.log(dataset);

  try {
    let doi = await client.get(`datasets/${dataset}/reserve-doi`);
    return doi.data.doi;
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
};

// TODO: Add api function for setting dataset permissions

const getDatasetsForAccount = async (selected_account) => {
  console.log(selected_account);
  let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
    params: {
      selected_account,
    },
  });

  let { datasets } = responseObject.data;

  return datasets;
};

const getDatasetSubtitle = async (selected_account, selected_dataset) => {
  let getSubtitleResponse = await client.get(`/manage_datasets/bf_dataset_subtitle`, {
    params: {
      selected_account,
      selected_dataset,
    },
  });

  let { subtitle } = getSubtitleResponse.data;

  return subtitle;
};

const getDatasetReadme = async (selected_account, selected_dataset) => {
  let readmeResponse = await client.get(`/manage_datasets/datasets/${selected_dataset}/readme`, {
    params: { selected_account },
  });

  let { readme } = readmeResponse.data;

  return readme;
};

// Submits the selected dataset for review by the publishers within a given user's organization.
// Note: To be run after the pre-publishing validation checks have all passed.
// I:
//  pennsieveAccount: string - the SODA user's pennsieve account
//  datasetIdOrName: string - the id/name of the dataset being submitted for publication
//  embargoReleaseDate?: string  - in yyyy-mm-dd format. Represents the day an embargo will be lifted on this dataset; at which point the dataset will be made public.
// O: void
// TODO: Replace the share with curation team endpoints/functions with the function below
const submitDatasetForPublication = async (
  pennsieveAccount,
  datasetName,
  embargoReleaseDate,
  publicationType
) => {
  // request that the dataset be sent in for publication/publication review
  await client.post(
    `/disseminate_datasets/datasets/${datasetName}/publication/request`,
    {
      publication_type: publicationType,
      embargo_release_date: embargoReleaseDate,
    },
    {
      params: {
        selected_account: pennsieveAccount,
      },
    }
  );
};

const getCurrentCollectionTags = async (account, dataset) => {
  currentTags = {};
  try {
    let result = await client.get(`/datasets/${dataset}/collections`, {
      params: {
        selected_account: account,
      },
    });
    let res = result.data;
    for (let i = 0; i < res.length; i++) {
      let name = res[i]["name"];
      let id = res[i]["id"];
      if (name.includes(",")) {
        let replaced_name = name.replace(/,/g, "，");
        currentTags[replaced_name] = { id: id, "original-name": name };
      } else {
        currentTags[name] = { id: id };
      }
    }
    return currentTags;
  } catch (error) {
    clientError(error);
  }
};

//Function used to get all collections that belong to the Org
const getAllCollectionTags = async (account) => {
  allCollectionTags = {};
  try {
    result = await client.get(`/collections/`, {
      params: { selected_account: account },
    });
    let res = result.data;
    for (let i = 0; i < res.length; i++) {
      let name = res[i]["name"];
      let id = res[i]["id"];
      if (name.includes(",")) {
        let replaced_name = res[i]["name"].replace(/,/g, "，");
        allCollectionTags[replaced_name] = {
          id: id,
          "original-name": name,
        };
      } else {
        allCollectionTags[name] = { id: id };
      }
    }
    return allCollectionTags;
  } catch (error) {
    clientError(error);
  }
};

//function is for uploading collection names that haven't been created on Pennsieve yet
//First it will upload the new names to then receive their ID's
//Then with those IDs we will associate them to the given dataset
const uploadNewTags = async (account, dataset, tags) => {
  //upload names first to then get their ids to add to dataset
  //PARAMS: tags = list of collection names
  let newUploadedTags = [];
  let response200 = false;

  try {
    let newCollectionNames = await client.post(
      `collections/?selected_account=${account}&selected_dataset=${dataset}`,
      {
        collection: tags,
      }
    );

    let res = newCollectionNames.data.collection;
    //store ids into an array for next call
    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        //only need the id's to set to dataset
        newUploadedTags.push(res[i]["id"]);
      }
      response200 = true;
    }
  } catch (error) {
    clientError(error);
  }

  //if response200 = true then previous call succeeded and new IDs are in newUploadedTags array
  if (response200) {
    //put collection ids to dataset
    try {
      let newTagsUpload = await client.put(
        `datasets/${defaultBfDataset}/collections?selected_account=${defaultBfAccount}`,
        {
          collection: newUploadedTags,
        }
      );
      return newTagsUpload.data;
    } catch (error) {
      clientError(error);
    }
  }
};

const removeCollectionTags = async (account, dataset, tags) => {
  //remove collection names from a dataset with their given IDs
  //PARAMS: tags = list of collection IDs
  try {
    let removedTags = await client.delete(
      `datasets/${dataset}/collections?selected_account=${account}`,
      {
        data: { collection: tags },
      }
    );
    return removedTags.data;
  } catch (error) {
    clientError(error);
  }
};

const uploadCollectionTags = async (account, dataset, tags) => {
  //upload tags that have already been created on Pennsieve
  //PARAMS: tags = list of collection IDs
  try {
    let uploadedTags = await client.put(
      `datasets/${dataset}/collections`,
      {
        collection: tags,
      },
      {
        params: {
          selected_account: account,
        },
      }
    );
    return uploadedTags.data;
  } catch (error) {
    clientError(error);
  }
};

/**
 *
 * @param {*} formattedPennsieveSODAJSONObj - A soda json object that contains an imported Pennsieve dataset that has been formatted for curation.
 *
 * Mutates the argument object by performing the user actions (replace, rename, move, delete) stored in the argument object.
 * The actions stored in the argument object are reflective of user actions performed in SODA's File Viewer UIs ( found in Organize Datasets step 5, Guided Mode, etc ).
 * IMP: These actions are performed in the /curation endpoint. However, this endpoint exists in order to provide a local copy of the argument object post mutation
 *      without having to generate the object on Pennsieve.
 * Use Cases For Mutated Argument: Generating manifest files in Organize & Guided Mode, generating local copies of Pennsieve datasets for Validation, etc.
 */
const performUserActions = async (formattedPennsieveSODAJSONObj) => {
  let cleanCopyResponse;
  // handle renaming, moving, replace, and deleting files and folders
  try {
    cleanCopyResponse = await client.post("/curate_datasets/clean-dataset", {
      soda_json_structure: formattedPennsieveSODAJSONObj,
    });
  } catch (error) {
    clientError(error);
  }

  formattedPennsieveSODAJSONObj = cleanCopyResponse.data.soda_json_structure;
};

const createSkeletonDataset = async (sodaJSONObj) => {
  const response = await client.post("/skeleton_dataset", {
    sodajsonobject: sodaJSONObj,
  });
  let data = response.data;
  console.log(data);
  return data["path_to_skeleton_dataset"];
};

const validateLocalDataset = async (datasetPath) => {
  const validationResponse = await client.post("/validator/local", {
    dataset_path: datasetPath,
  });
  return validationResponse.data;
};

const getNumberOfPackagesInDataset = async (datasetName) => {
  const packageCountsResponse = await client.get(`/datasets/${datasetName}/packageTypeCounts`);
  return packageCountsResponse.data;
};

const getNumberOfItemsInLocalDataset = async (datasetPath) => {
  const itemCountsResponse = await client.get(`/datasets/local/item_count?dataset_path=${datasetPath}`)
  return itemCountsResponse.data;
}

const api = {
  getUserInformation,
  getDataset,
  getDatasetReadme,
  getDatasetBannerImageURL,
  getDatasetRole,
  withdrawDatasetReviewSubmission,
  getFilesExcludedFromPublishing,
  updateDatasetExcludedFiles,
  getDatasetMetadataFiles,
  getDatasetPermissions,
  getDatasetsForAccount,
  getDatasetSubtitle,
  submitDatasetForPublication,
  getAllCollectionTags,
  getCurrentCollectionTags,
  uploadCollectionTags,
  removeCollectionTags,
  uploadNewTags,
  performUserActions,
  createSkeletonDataset,
  validateLocalDataset,
  getDatasetDOI,
  reserveDOI,
  getNumberOfPackagesInDataset,
  getNumberOfItemsInLocalDataset
};

module.exports = api;
