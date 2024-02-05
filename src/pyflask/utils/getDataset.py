from flask import abort
import requests

from utils import create_request_headers

PENNSIEVE_URL = "https://api.pennsieve.io"

def get_dataset(ps, selected_dataset):
    """
    Function to get the dataset using the Pennsieve python client.
    """

    try:
        myds = ps.get_dataset(selected_dataset)
    except Exception as e:
        # TODO: Account for 500 errors
        abort(400, "Please select a valid Pennsieve dataset")

    
    return myds


def get_dataset_http(selected_dataset, access_token):
    """
    Function to get the dataset via HTTP using a Pennsieve aws cognito access token.
    """
    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset}", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()

    return r.json()


def get_users_dataset_list(token):
    """
        Returns a list of datasets the user has access to.
        Input:
            token: Pennsieve access token
    """

    # The number of datasets to retrieve per chunk
    NUMBER_OF_DATASETS_PER_CHUNK = 200
    # The total number of datasets the user has access to (set after the first request)
    NUMBER_OF_DATASETS_USER_HAS_ACCESS_TO = None

    # The offset is the number of datasets to skip before retrieving the next chunk of datasets (starts at 0, then increases by the number of datasets per chunk)
    current_offset = 0
    # The list of datasets the user has access to (datasets are added to this list after each request and then returned)
    datasets = []

    try:
        # Get the first chunk of datasets as well as the total number of datasets the user has access to
        r = requests.get(f"{PENNSIEVE_URL}/datasets/paginated", headers=create_request_headers(token), params={"offset": current_offset, "limit": NUMBER_OF_DATASETS_PER_CHUNK})
        r.raise_for_status()
        responseJSON = r.json()
        datasets.extend(responseJSON["datasets"])
        NUMBER_OF_DATASETS_USER_HAS_ACCESS_TO = responseJSON["totalCount"]

        # If the number of datasets the user has access to is less than the number of datasets per chunk, we don't need to retrieve any more datasets
        if NUMBER_OF_DATASETS_USER_HAS_ACCESS_TO < NUMBER_OF_DATASETS_PER_CHUNK:
            return datasets
        
        # Otherwise, we need to retrieve the rest of the datasets.
        # We do this by retrieving chunks of datasets until the number of datasets retrieved is equal to the number of datasets the user has access to
        while len(datasets) < NUMBER_OF_DATASETS_USER_HAS_ACCESS_TO:
            # Increase the offset by the number of datasets per chunk (e.g. if 200 datasets per chunk, then increase the offset by 200)
            current_offset += NUMBER_OF_DATASETS_PER_CHUNK
            r = requests.get(f"{PENNSIEVE_URL}/datasets/paginated", headers=create_request_headers(token), params={"offset": current_offset, "limit": NUMBER_OF_DATASETS_PER_CHUNK})
            r.raise_for_status()
            responseJSON = r.json()
            datasets.extend(responseJSON["datasets"])

        return datasets
    except Exception as e:
        raise e
    

def get_dataset_id(token, selected_dataset):
    """
        Returns the dataset ID for the given dataset name.
        If the dataset ID was provided instead of the name, the ID will be returned. *Common for Guided Mode*
        Input:
            ps_or_token: An initialized Pennsieve object or a Pennsieve access token
            selected_dataset: Pennsieve dataset to get the ID for
    """
    if selected_dataset.startswith("N:dataset:"):
        return selected_dataset
    
    try:
        dataset_list = get_users_dataset_list(token)
    except Exception as e:
        abort(500, "Error: Failed to retrieve datasets from Pennsieve. Please try again later.")
    for dataset in dataset_list:
        if dataset["content"]["name"] == selected_dataset:
            return dataset["content"]["id"]
    abort(400, "Please select a valid Pennsieve dataset.")
  
    
