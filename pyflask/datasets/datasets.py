""""
Routes for performing operations on datasets
"""

from flask import abort
import requests
from utils import create_request_headers, connect_pennsieve_client, authenticate_user_with_client, get_dataset_id
from permissions import has_edit_permissions, bf_get_current_user_permission_agent_two
from authentication import get_access_token


PENNSIEVE_URL = "https://api.pennsieve.io"

def get_role(pennsieve_account, dataset):
    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, pennsieve_account)

    selected_dataset_id = get_dataset_id(ps, dataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/role", headers=create_request_headers(ps))
        r.raise_for_status()
        role = r.json()["role"]
        # role =  ps._api._get(f"/datasets/{selected_dataset_id}/role")["role"]
        return {"role": role}
    except Exception as e:
        if type(e).__name__ == "HTTPError":
            abort(400, e.response.json()["message"])
        abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")


def get_dataset_by_id(dataset_id):

    token = get_access_token()

    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    r = requests.put(f"{PENNSIEVE_URL}/datasets/{dataset_id}", headers=headers)

    # TODO: log r.text and r.status_code
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

    statusResponses = []

    token = get_access_token()

    selected_dataset_id = get_dataset_id(token, dataset)

    if not has_edit_permissions(token, selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")

    for tagid in tags:
        r = requests.delete(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/collections/{str(tagid)}", headers=create_request_headers(token))
        r.raise_for_status()
        # result = r.text
        # result = ps._api._del(f"/datasets/{str(dataset_id)}/collections/{str(tagid)}")
        # statusResponses.append(result)

    return dict({"collection": "Collection removed"})
