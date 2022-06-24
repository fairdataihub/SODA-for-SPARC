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

  let datasetResponse = await client.get(`/datasets/${datasetId}`);
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

};

/**
 * Withdraw any dataset from a pre-publishing review submission
 * @param {string} datasetIdOrName
 * @returns {Promise<void>}
 */
const withdrawDatasetReviewSubmission = async (datasetIdOrName) => {
  await client.post(
    `/disseminate_datasets/datasets/${datasetIdOrName}/publication/cancel`
  );

};

const getFilesExcludedFromPublishing = async (datasetIdOrName) => {
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

};

// tell Pennsieve to ignore a set of user selected files when publishing their dataset.
// this keeps those files hidden from the public but visible to publishers and collaboraors.
// I:
//  datasetIdOrName: string - A dataset id or name
//  files: [{fileName: string}] - An array of file name objects
const updateDatasetExcludedFiles = async (datasetIdOrName, files) => {
  // create the request options
  await client.put(
    `/disseminate_datasets/datasets/${datasetIdOrName}/ignore-files`,
    {
      ignore_files: files,
    }
  );

};

// retrieves the currently selected dataset's metadata files
// I:
//  datasetIdOrName: string - A dataset id or name
const getDatasetMetadataFiles = async (datasetIdOrName) => {
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

};

const getDatasetPermissions = async (selected_account, selected_dataset) => {
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
};

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
  let getSubtitleResponse = await client.get(
    `/manage_datasets/bf_dataset_subtitle`,
    {
      params: {
        selected_account,
        selected_dataset,
      },
    }
  );

  let { subtitle } = getSubtitleResponse.data;

  return subtitle;
};

const getDatasetReadme = async (selected_account, selected_dataset) => {
  let readmeResponse = await client.get(
    `/manage_datasets/datasets/${selected_dataset}/readme`,
    { params: { selected_account } }
  );

  let { readme } = readmeResponse.data;

  return readme;
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
  getDatasetSubtitle,
};

module.exports = api;
