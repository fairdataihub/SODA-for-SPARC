from flask import abort
import requests 
from permissions import has_edit_permissions
from utils import get_dataset_id, create_request_headers
from constants import PENNSIEVE_URL
from authentication import get_access_token


def get_all_collections(account):
    """
    Function used to get the collections that belong to an organization
    """

    token = get_access_token()

    r = requests.get(f"{PENNSIEVE_URL}/collections", headers=create_request_headers(token))
    r.raise_for_status()

    return r.json()



def upload_new_names(account, dataset, tags):
    """
    Function is used to upload new collection tags that are not already on Pennsieve
    @params:
        tags: List of tag names (string)
    """

    statusResponses = []

    token = get_access_token()

    selected_dataset_id = get_dataset_id(dataset)

    if not has_edit_permissions(token, selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")


    for tag in tags:
        jsonfile = {"name": tag}
        r = requests.post(f"{PENNSIEVE_URL}/collections", headers=create_request_headers(token) ,json=jsonfile)
        r.raise_for_status()
        result = r.json()
        statusResponses.append(result)

    return dict({"collection": statusResponses})

    