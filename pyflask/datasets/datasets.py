""""
Routes for performing operations on datasets
"""

from os import walk
from flask import abort
import requests
from utils import create_request_headers, connect_pennsieve_client, authenticate_user_with_client, get_dataset_id
from permissions import has_edit_permissions, bf_get_current_user_permission_agent_two
from authentication import get_access_token


PENNSIEVE_URL = "https://api.pennsieve.io"

def get_role(pennsieve_account, dataset):
    token = get_access_token()

    selected_dataset_id = get_dataset_id(token, dataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/role", headers=create_request_headers(token))
        r.raise_for_status()
        role = r.json()["role"]
        # role =  ps._api._get(f"/datasets/{selected_dataset_id}/role")["role"]
        return {"role": role}
    except Exception as e:
        if type(e).__name__ == "HTTPError":
            abort(400, e.response.json()["message"])
        abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")


def get_dataset_by_id(dataset_name_or_id):
    token = get_access_token()

    if dataset_name_or_id.startswith("N:dataset:"):
        selected_dataset_id = dataset_name_or_id
    else:
        selected_dataset_id = get_dataset_id(token, dataset_name_or_id)

    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(token))

    r.raise_for_status()

    return r.json()


def get_current_collection_names(account, dataset):
    """
    Function used to get collection names of the current dataset
    """
    token = get_access_token()

    selected_dataset_id = get_dataset_id(token, dataset)

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collections", headers=create_request_headers(token))
    r.raise_for_status()

    return r.json()


def upload_collection_names(account, dataset, tags):
    """
    Function used to upload the collection tags of a dataset to Pennsieve
    @params
        tags: List of the collection tag id's (int)
    """
    token = get_access_token()

    selected_dataset_id = get_dataset_id(token, dataset)

    if not has_edit_permissions(token, selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")
    

    store = []
    for tag in tags:
        jsonfile = {"collectionId": int(tag)}
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collections", json=jsonfile, headers=create_request_headers(token))
        r.raise_for_status()
        result = r.json()
        for res_object in result:
            # each result will hold the updated collection names/ids
            collection_id = res_object["id"]
            collection_name = res_object["name"]
            if store is None:
                store = []
            store.append({'id': collection_id, 'name': str(collection_name)})

    return {"collection": store}


def remove_collection_names(account, dataset, tags):
    """
    Function used to remove the tags the were assigned to a dataset
    @params
        tags: List of collection ids (int)
    """

    token = get_access_token()

    if dataset.startswith("N:dataset:"):
        selected_dataset_id = dataset
    else:
        selected_dataset_id = get_dataset_id(token, dataset)

    if not has_edit_permissions(token, selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")

    for tagid in tags:
        r = requests.delete(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/collections/{str(tagid)}", headers=create_request_headers(token))
        r.raise_for_status()

    return dict({"collection": "Collection removed"})


def reserve_dataset_doi(dataset):  # sourcery skip: extract-method
    """
    Function used to reserve a DOI after dataset has been published
    @params
        account: User's Pennsieve account (string)
        dataset: Dataset name (string)

    @endpoint response
        organizationID: Organization ID of the dataset (int)
        datasetId: Dataset ID of the dataset (int)
        DOI: DOI of the dataset (string)
        title: Title of the dataset (string)
        publisher: Publisher of the dataset (string) [Pennsieve Discover]
        createdAt: Date the DOI was created (string)
        state: State of the dataset (draft, published, etc.) (string)
        creators: List of creators of the dataset (list)
    """
    token = get_access_token()

    dataset_id = get_dataset_id(token, dataset)

    try:
        doi_request = requests.post(f"{PENNSIEVE_URL}/datasets/{dataset_id}/doi", headers=create_request_headers(token))
        doi_request.raise_for_status()
        return {"doi": doi_request.json()["doi"]}
    except Exception as e:
        if type(e).__name__ == "HTTPError":
            abort(400, e.response.json()["message"])
        abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")

def get_dataset_doi(dataset):
    """
    Function used to get the DOI of a dataset
    @params
        account: User's Pennsieve account (string)
        dataset: Dataset name (string)
    @endpoint response
        organizationID: Organization ID of the dataset (int)
        datasetId: Dataset ID of the dataset (int)
        DOI: DOI of the dataset (string)
        title: Title of the dataset (string)
        publisher: Publisher of the dataset (string) [Pennsieve Discover]
        createdAt: Date the DOI was created (string)
        state: State of the dataset (draft, published, etc.) (string)
        creators: List of creators of the dataset (list)
    """
    token = get_access_token()

    dataset_id = get_dataset_id(token, dataset)
    try:
        doi_request = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}/doi", headers=create_request_headers(token))
        if doi_request.status_code == 404:
            return {"doi": "No DOI found for this dataset"}
        doi_request.raise_for_status()
        return {"doi": doi_request.json()["doi"]}
    except Exception as e:
        if type(e).__name__ == "HTTPError":
            abort(400, e.response.json()["message"])
        abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")


def get_package_type_counts(dataset_name):

    token = get_access_token()

    dataset_id = get_dataset_id(token, dataset_name)

    r = requests.get(f"https://api.pennsieve.io/datasets/{dataset_id}/packageTypeCounts", headers=create_request_headers(token))
    r.raise_for_status()

    return r.json()

def get_total_items_in_local_dataset(dataset_path):
    # count the amount of items in folder
    create_soda_json_total_items = 0
    for _, dirs, filenames in walk(dataset_path):
        # walk through all folders and it's subfolders
        for Dir in dirs:
            # does not take hidden folders or manifest folders
            if Dir[:1] != ".":
                create_soda_json_total_items += 1
        for fileName in filenames:
            if fileName[:1] != ".":
                create_soda_json_total_items += 1

    return create_soda_json_total_items

