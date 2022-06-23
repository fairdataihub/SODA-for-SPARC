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
 * @param {string} datasetId - the current dataset id
 * @returns {datasetObject} dataset - the dataset object
 */
const getDataset = async (datasetId) => {
  try {
    let datasetResponse = await client.get(`/datasets/${datasetId}`);
    return datasetResponse.data;
  } catch (e) {
    clientError(e);
    throw new Error(`${userErrorMessage(e)}`);
  }
};

/**
 *
 * @param {string} datasetNameOrId
 * @returns {string} readme - The given dataset's readme
 */
const getDatasetReadme = async (datasetNameOrId) => {
  try {
    // TODO: Error handling testing
    let readmeResponse = await client.get(
      `/manage_datasets/datasets/${datasetNameOrId}/readme`,
      { params: { selected_account: defaultBfAccount } }
    );

    let { readme } = readmeResponse.data;

    return readme;
  } catch (e) {
    clientError(e);
    throw new Error(`${userErrorMessage(e)}`);
  }
};

const getDatasetBannerImageURL = async (datasetNameOrId) => {
  try {
    let bannerResponse = await client.get(`/manage_datasets/bf_banner_image`, {
      params: {
        selected_account: defaultBfAccount,
        selected_dataset: defaultBfDataset,
      },
    });

    let { banner_image } = bannerResponse.data;

    return banner_image;
  } catch (e) {
    clientError(e);
    throw new Error(`${userErrorMessage(e)}`);
  }
};

const getDatasetRole = async (datasetNameOrId) => {
  try {
    let datasetRoleResponse = await client.get(
      `/datasets/${defaultBfDataset}/role`,
      {
        params: {
          pennsieve_account: defaultBfAccount,
        },
      }
    );

    let { role } = datasetRoleResponse.data;

    return role;
  } catch (e) {
    clientError(e);
    throw new Error(`${userErrorMessage(e)}`);
  }
};

/**
 * Withdraw any dataset from a pre-publishing review submission
 * @param {string} datasetIdOrName
 * @returns {Promise<void>}
 */
const withdrawDatasetReviewSubmission = async (datasetIdOrName) => {
  try {
    await client.post(
      `/disseminate_datasets/datasets/${datasetIdOrName}/publication/cancel`
    );
  } catch (error) {
    clientError(error);
    throw new Error(userErrorMessage(error));
  }
};

const getFilesExcludedFromPublishing = async (datasetIdOrName) => {
  try {
    // get the excluded files
    let excludedFilesRes = await client.get(
      `/disseminate_datasets/datasets/${datasetIdOrName}/ignore-files`,
      {
        params: {
          selected_account: defaultBfAccount,
        },
      }
    );

    let { ignore_files } = excludedFilesRes.data;

    return ignore_files;
  } catch (error) {
    clientError(error);
    throw new Error(userErrorMessage(error));
  }
};

// tell Pennsieve to ignore a set of user selected files when publishing their dataset.
// this keeps those files hidden from the public but visible to publishers and collaboraors.
// I:
//  datasetIdOrName: string - A dataset id or name
//  files: [{fileName: string}] - An array of file name objects
const updateDatasetExcludedFiles = async (datasetIdOrName, files) => {
  // create the request options
  try {
    await client.put(
      `/disseminate_datasets/datasets/${datasetIdOrName}/ignore-files`,
      {
        ignore_files: files,
      }
    );
  } catch (error) {
    clientError(error);
    throw new Error(userErrorMessage(error));
  }
};

// retrieves the currently selected dataset's metadata files
// I:
//  datasetIdOrName: string - A dataset id or name
const getDatasetMetadataFiles = async (datasetIdOrName) => {
  try {
    // get the metadata files for the dataset
    let datasetwithChildrenResponse = client.get(
      `/disseminate_datasets/datasets/${datasetIdOrName}/metadata-files`,
      {
        params: {
          selected_account: defaultBfAccount,
        },
      }
    );

    let { metadata_files } = datasetwithChildrenResponse.data;

    // return the metdata files to the client
    return metadata_files;
  } catch (error) {
    clientError(error);
    throw new Error(userErrorMessage(error));
  }
};

const getDatasetPermissions = async (selected_account, selected_dataset) => {
  try {
    let getDatasetPermissionsResponse = await client.get(
      `/manage_datasets/bf_dataset_permissions`,
      {
        params: {
          selected_account,
          selected_dataset,
        },
      }
    );

    let { permissions } = getDatasetPermissionsResponse.data;

    return permissions;
  } catch (error) {
    clientError(error);
    throw new Error(userErrorMessage(error));
  }
};

const getDatasetsForAccount = async (selected_account) => {
  let responseObject = await client.get(
    `manage_datasets/bf_dataset_account`,
    {
      params: {
        selected_account,
      },
    }
  );

  let { datasets } = responseObject.data;

  return datasets;

};

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
};

module.exports = api;
