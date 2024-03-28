# -*- coding: utf-8 -*-

### Import required python modules
from venv import create
from flask import abort 
import requests
from permissions import pennsieve_get_current_user_permissions, has_edit_permissions
from utils import connect_pennsieve_client, get_dataset_id, authenticate_user_with_client, create_request_headers
from errorHandlers import handle_http_error
from authentication import get_access_token
from namespaces import NamespaceEnum, get_namespace_logger

namespace_logger = get_namespace_logger(NamespaceEnum.MANAGE_DATASETS)




PENNSIEVE_URL = "https://api.pennsieve.io"


def bf_get_doi(selected_bfaccount, selected_bfdataset):
    """
    Function to get current doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current doi or "None"
    """
    selected_dataset_id = get_dataset_id(selected_bfdataset)

    if not has_edit_permissions(get_access_token(), selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/doi", headers=create_request_headers(get_access_token()))
        r.raise_for_status()
        result = r.json()

        return {"doi": result["doi"]}
    except Exception as e:
        if "404" in str(e):
            return {"doi": "None"}
        handle_http_error(e)


def bf_reserve_doi(selected_bfaccount, selected_bfdataset):
    """
    Function to reserve doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
    """
    selected_dataset_id = get_dataset_id(selected_bfdataset)

    if not has_edit_permissions(get_access_token(), selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")

    try:
        res = bf_get_doi(selected_bfaccount, selected_bfdataset)
        if res["doi"] != "None":
            abort(400, "A DOI has already been reserved for this dataset")
    except Exception as e:
        raise e

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/contributors", headers=create_request_headers(get_access_token()))
        r.raise_for_status()
        contributors = r.json()
        creators_list = [
            item["firstName"] + " " + item["lastName"]
            for item in contributors
        ]
    except Exception as e:
        handle_http_error(e)
    
    try:
        jsonfile = {
            "title": selected_bfdataset,
            "creators": creators_list,
        }
        
        r = requests.post(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/doi", headers=create_request_headers(get_access_token()), json=jsonfile)
        r.raise_for_status()

        return {"message": "Done!"}
    except Exception as e:
        handle_http_error(e)



def bf_get_publishing_status(selected_bfaccount, selected_bfdataset):
    """
    Function to get the review request status and publishing status of a dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current req publishing status
    """
    selected_dataset_id = get_dataset_id(selected_bfdataset)


    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}?includePublishedDataset=true", headers=create_request_headers(get_access_token()))
    r.raise_for_status()
    review_request_status = r.json()["publication"]["status"]



    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/published", headers=create_request_headers(get_access_token()))
    r.raise_for_status()
    publishing_status = r.json()["status"]


    return { 
        "publishing_status": publishing_status, 
        "review_request_status": review_request_status
    }




def construct_publication_qs(publication_type, embargo_release_date):
    """
    Function to construct the publication query string. Used in bf_submit_review_dataset.
    """
    return f"?publicationType={publication_type}&embargoReleaseDate={embargo_release_date}" if embargo_release_date else f"?publicationType={publication_type}"


def bf_submit_review_dataset(selected_bfaccount, selected_bfdataset, publication_type, embargo_release_date):
    """
        Function to publish for a selected dataset

        Args:
            selected_bfaccount: name of selected Pennsieve account (string)
            selected_bfdataset: name of selected Pennsieve dataset (string)
            publication_type: type of publication (string)
            embargo_release_date: (optional) date at which embargo lifts from dataset after publication
        Return:
            Success or error message
    """
    selected_dataset_id = get_dataset_id(selected_bfdataset)

    if not has_edit_permissions(get_access_token(), selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")
        
    qs = construct_publication_qs(publication_type, embargo_release_date)

    try:
        r = requests.post(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/publication/request{qs}", headers=create_request_headers(get_access_token()))
        r.raise_for_status()
        return r.json()
    except Exception as e:
        handle_http_error(e)


def get_publication_type(ps_or_token, selected_dataset_id):

    """
    Function to get the publication type of a dataset
    """
    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}?includePublishedDataset=true", headers=create_request_headers(ps_or_token))
    r.raise_for_status()
    ds = r.json()

    publication_type = ds["publication"]["type"] if "publication" in ds and "type" in ds["publication"] else None

    if not publication_type:
        abort(400, "Cannot cancel publication of a dataset that is not published.")

    return publication_type



def bf_withdraw_review_dataset(selected_bfaccount, selected_bfdataset):

    selected_dataset_id = get_dataset_id(selected_bfdataset)

    if not has_edit_permissions(get_access_token(), selected_dataset_id):
        abort(403, "You do not have permission to edit this dataset.")

    publication_type = get_publication_type(get_access_token(), selected_dataset_id)

    try:
        r = requests.post(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/publication/cancel?publicationType={publication_type}", headers=create_request_headers(get_access_token()))
        r.raise_for_status()
        return {"message": "Your dataset publication has been cancelled."}
    except Exception as e:
        if type(e).__name__ == "HTTPError":
            abort(400, e.response.json()["message"])
        abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")




METADATA_FILES = [
    "submission.xlsx", 
    "code_description.xlsx", 
    "dataset_description.xlsx", 
    "outputs_metadata.xlsx", 
    "inputs_metadata.xlsx", 
    "CHANGES.txt", 
    "README.txt", 
    "samples.xlsx", 
    "subjects.xlsx"
]

def get_metadata_files(selected_dataset, pennsieve_account):
    """
    Function to get the metadata files

    Args:
        selected_dataset: name of selected Pennsieve dataset (string)
        pennsieve_account: name of selected Pennsieve account (string)
    Return:
        List of metadata files
    """
    selected_dataset_id = get_dataset_id(selected_dataset)

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(get_access_token()))
    r.raise_for_status()
    resp = r.json()
    if "children" not in resp:
        return {"metadata_files": []}

    children = resp["children"]

    # iterate through children check if content property has name property that equals one of the valid metadata file names and return it if so
    return {
        "metadata_files": [child["content"]["name"] for child in children if "content" in child and "name" in child["content"] and child["content"]["name"] in METADATA_FILES]
    }
