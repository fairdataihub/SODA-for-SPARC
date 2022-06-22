/*
Purpose: An abstraction layer between the client and making HTTP requests via Axios. This layer handles the error parsing and logging.
*/

const getUserInformation = async () => {
  let userResponse;
  try {
    userResponse = await client.get(`/user`, {
      params: {
        pennsieve_account: defaultBfAccount,
      },
    });
  } catch (e) {
    clientError(e);
    throw new Error(getAxiosErrorMessage(e));
  }

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
    throw new Error(`${getAxiosErrorMessage(e)}`);
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
    throw new Error(`${getAxiosErrorMessage(e)}`);
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
    throw new Error(`${getAxiosErrorMessage(e)}`);
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
    throw new Error(`${getAxiosErrorMessage(e)}`);
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
    clientError(error)
    throw new Error(getAxiosErrorMessage(error))
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
        }
      }
    );

    let { ignore_files } = excludedFilesRes.data;

    return ignore_files;
  } catch (error) {
    clientError(error)
    throw new Error(getAxiosErrorMessage(error))
  }
};

const api = {
  getUserInformation,
  getDataset,
  getDatasetReadme,
  getDatasetBannerImageURL,
  getDatasetRole,
  withdrawDatasetReviewSubmission,
  getFilesExcludedFromPublishing
};

module.exports = api;
