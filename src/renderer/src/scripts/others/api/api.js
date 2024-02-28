/*
Purpose: An abstraction layer between the client and making HTTP requests via Axios. This layer handles the error parsing and logging.
*/
import client from "../../client";
import { clientError, userErrorMessage } from "../http-error-handler/error-handler";

const getUserInformation = async () => {
  let userResponse = await client.get(`/user`, {
    params: {
      pennsieve_account: window.defaultBfDataset,
    },
  });

  return userResponse.data;
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

const isDatasetLocked = async (account, datasetNameOrId) => {
  try {
    // get the logged in user's information which will be used to check if the user is a member of the "Publishers" team
    const currentUserInformation = await getUserInformation();
    const currentUserID = currentUserInformation.id;

    // Get the teams in the user's organization
    // Note that this will fail for guest accounts, so the array will be empty, and
    // the user will not be checked for membership in the "Publishers" team
    let teamsInCurrentUsersOrganization = [];
    try {
      const teamsReq = await client.get(
        `manage_datasets/ps_get_teams?selected_account=${window.defaultBfDataset}`
      );
      teamsInCurrentUsersOrganization = teamsReq.data.teams;
    } catch (error) {
      userErrorMessage(error);
    }

    // Get the team with the name "Publishers" (if it exists)
    const publishersTeam = teamsInCurrentUsersOrganization.find(
      (teamElement) => teamElement.team.name === "Publishers"
    );

    // If a "Publishers" team exists, get the IDs of the team's administrators
    if (publishersTeam) {
      const publishersTeamIDs = publishersTeam.administrators.map(
        (administrator) => administrator.id
      );
      // Check too see if the current user is a member of the "Publishers" team
      if (publishersTeamIDs.includes(currentUserID)) {
        // If the user is a member of the "Publishers" team, return false since the dataset should not be locked for them
        return false;
      }
    }

    // If the user is not a member of the "Publishers" team, check to see if the dataset is locked
    const datasetRoleResponse = await client.get(`/datasets/${datasetNameOrId}`);
    // Return the dataset's lock status (true or false)
    return datasetRoleResponse.data.locked;
  } catch (err) {
    clientError(err);
    // If the dataset is locked, the server will return a 423 status code, so return true if that is the case
    if (err.response.status == 423) {
      return true;
    } else {
      return false;
    }
  }
};

const getDatasetRole = async (datasetNameOrId) => {
  if (datasetNameOrId != undefined || datasetNameOrId != "") {
    window.defaultBfDataset = datasetNameOrId;
  }

  let datasetRoleResponse = await client.get(`/datasets/${window.defaultBfDataset}/role`);

  let { role } = datasetRoleResponse.data;

  return role;
};

const getDatasetInformation = async (account, datasetNameOrId) => {
  const datasetInformationResponse = await client.get(`/datasets/${datasetNameOrId}`, {
    params: {
      pennsieve_account: account,
    },
  });
  // Returns information about the dataset (locked, published, etc.)
  return datasetInformationResponse.data;
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

// retrieves the currently selected dataset's metadata files
// I:
//  datasetName: string - Selected dataset name
const getDatasetMetadataFiles = async (datasetName) => {
  // get the metadata files for the dataset
  let datasetwithChildrenResponse = await client.get(
    `/disseminate_datasets/datasets/${datasetName}/metadata-files`,
    {
      params: {
        selected_account: window.defaultBfDataset,
      },
    }
  );

  let { metadata_files } = datasetwithChildrenResponse.data;

  // return the metdata files to the client
  return metadata_files;
};

const setDatasetPermissions = async (selected_account, selected_dataset, params) => {};

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

  try {
    let doiReserve = await client.post(`datasets/${dataset}/reserve-doi`);
    return doiReserve.data.doi;
  } catch (err) {
    let errorMessage = userErrorMessage(err);
    clientError(err);
    if (errorMessage.includes("is locked")) {
      return "locked";
    }
    return false;
  }
};

const getDatasetDOI = async (account, dataset) => {
  // reference: https://docs.pennsieve.io/reference/getdoi

  try {
    let doi = await client.get(`datasets/${dataset}/reserve-doi`);
    return doi.data.doi;
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
};

const getLockStatus = async (datasetNameOrId) => {
  try {
    let lockStatusResponse = await client.get(`/datasets/${datasetNameOrId}/lock-status`);
    return lockStatusResponse.data;
  } catch (err) {
    clientError(err);
    userErrorMessage(err);
  }
};

// TODO: Add api function for setting dataset permissions

const getDatasetsForAccount = async (selected_account) => {
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
  window.currentTags = {};
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
        window.currentTags[replaced_name] = { id: id, "original-name": name };
      } else {
        window.currentTags[name] = { id: id };
      }
    }
    return window.currentTags;
  } catch (error) {
    clientError(error);
  }
};

//Function used to get all collections that belong to the Org
const getAllCollectionTags = async (account) => {
  window.allCollectionTags = {};
  try {
    let result = await client.get(`/collections/`, {
      params: { selected_account: account },
    });
    let res = result.data;
    for (let i = 0; i < res.length; i++) {
      let name = res[i]["name"];
      let id = res[i]["id"];
      if (name.includes(",")) {
        let replaced_name = res[i]["name"].replace(/,/g, "，");
        window.allCollectionTags[replaced_name] = {
          id: id,
          "original-name": name,
        };
      } else {
        window.allCollectionTags[name] = { id: id };
      }
    }
    return window.allCollectionTags;
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
    return false;
  }

  //if response200 = true then previous call succeeded and new IDs are in newUploadedTags array
  if (response200) {
    //put collection ids to dataset
    try {
      let newTagsUpload = await client.put(
        `datasets/${window.defaultBfDataset}/collections?selected_account=${window.defaultBfDataset}`,
        {
          collection: newUploadedTags,
        }
      );
      return newTagsUpload.data;
    } catch (error) {
      clientError(error);
      return false;
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
    return false;
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
    return false;
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
  const itemCountsResponse = await client.get(
    `/datasets/local/item_count?dataset_path=${datasetPath}`
  );
  return itemCountsResponse.data;
};

const setPreferredOrganization = async (
  email,
  password,
  organization,
  machineUsernameSpecifier
) => {
  const response = await client.put("/user/organizations/preferred", {
    organization_id: organization,
    email,
    password,
    machine_username_specifier: machineUsernameSpecifier,
  });
  return response.data;
};

const getOrganizations = async (profile) => {
  let organizations = await client.get("/user/organizations");
  return organizations.data;
};

const setDefaultProfile = async (targetProfile) => {
  const response = await client.put("/user/default_profile", {
    target_profile: targetProfile,
  });
  return response.data;
};

const createProfileName = async (email, password, machineUsernameSpecifier) => {
  const response = await client.post("/user/default_profile", {
    email: email,
    password: password,
    machineUsernameSpecifier: machineUsernameSpecifier,
  });

  return response.data;
};

const getUserPoolAccessToken = async (email, password) => {
  const response = await client.post("/manage_datasets/userpool_access_token", {
    email: email,
    password: password,
  });

  return response.data;
};

const getDatasetFileCount = async (datasetId) => {
  const response = await client.get(`/datasets/${datasetId}/file_count`);
  return response.data;
};

const api = {
  getUserInformation,
  getDataset,
  getDatasetReadme,
  getDatasetBannerImageURL,
  getDatasetRole,
  withdrawDatasetReviewSubmission,
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
  isDatasetLocked,
  getDatasetInformation,
  getNumberOfPackagesInDataset,
  getNumberOfItemsInLocalDataset,
  setPreferredOrganization,
  getUserPoolAccessToken,
  setDefaultProfile,
  createProfileName,
  getOrganizations,
  getDatasetFileCount,
};

export default api;
