# -*- coding: utf-8 -*-

### Import required python modules

from gevent import monkey

monkey.patch_all()

from pennsieve import Pennsieve
from flask import abort 
import requests

from manageDatasets import bf_get_current_user_permission
from utils import get_dataset, get_authenticated_ps
from authentication import get_access_token


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

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve dataset")


    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        abort(403, "You don't have permissions to view/edit DOI for this Pennsieve dataset")

    try:
        selected_dataset_id = myds.id
        doi_status = bf._api._get(f"/datasets/{str(selected_dataset_id)}/doi")
        return {"doi": doi_status["doi"]}
    except Exception as e:
        if "doi" in str(e) and "not found" in str(e):
            return {"doi": "None"}
        else:
            raise e





def bf_reserve_doi(selected_bfaccount, selected_bfdataset):
    """
    Function to reserve doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve dataset")

    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        abort(403, "You don't have permissions to view/edit DOI for this Pennsieve dataset")


    try:
        res = bf_get_doi(selected_bfaccount, selected_bfdataset)
        if res["doi"] != "None":
            abort(400, "A DOI has already been reserved for this dataset")
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        contributors_list = bf._api._get(
            f"/datasets/{str(selected_dataset_id)}/contributors"
        )

        creators_list = [
            item["firstName"] + " " + item["lastName"]
            for item in contributors_list
        ]

        jsonfile = {
            "title": selected_bfdataset,
            "creators": creators_list,
        }
        bf._api.datasets._post(f"/{str(selected_dataset_id)}/doi", json=jsonfile)
        return {"message": "Done!"}
    except Exception as e:
        raise e




def bf_get_publishing_status(selected_bfaccount, selected_bfdataset):
    """
    Function to get the review request status and publishing status of a dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current reqpusblishing status
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve dataset")

    try:
        selected_dataset_id = myds.id

        review_request_status = bf._api._get(f"/datasets/{str(selected_dataset_id)}")["publication"]["status"]

        publishing_status = bf._api._get(f"/datasets/{str(selected_dataset_id)}/published")["status"]


        return { 
            "publishing_status": review_request_status, 
            "review_request_status": publishing_status
        }
    except Exception as e:
        raise e



def construct_publication_qs(publication_type, embargo_release_date):
    """
    Function to construct the publication query string. Used in bf_submit_review_dataset.
    """
    return f"?publicationType={publication_type}&embargoReleaseDate={embargo_release_date}" if embargo_release_date else f"?publicationType={publication_type}"


def bf_submit_review_dataset(selected_bfaccount, selected_bfdataset,publication_type, embargo_release_date):
    """
        Function to publish for a selected dataset

        Args:
            selected_bfaccount: name of selected Pennsieve acccount (string)
            selected_bfdataset: name of selected Pennsieve dataset (string)
            publication_type: type of publication (string)
            embargo_release_date: (optional) date at which embargo lifts from dataset after publication
        Return:
            Success or error message
    """

    ps = get_authenticated_ps(selected_bfaccount)

    myds = get_dataset(ps, selected_bfdataset)

    role = bf_get_current_user_permission(ps, myds)

    if role not in ["owner"]:
        abort(403, "You must be dataset owner to send a dataset for review.")

    qs = construct_publication_qs(publication_type, embargo_release_date)

    return ps._api._post(f"/datasets/{myds.id}/publication/request{qs}")


def get_publication_type(ps, myds):

    """
    Function to get the publication type of a dataset
    """

     # get the dataset using the id 
    ds = ps._api._get(f"/datasets/{myds.id}")

    publication_type = ds["publication"]["type"] if "publication" in ds and "type" in ds["publication"] else None

    if not publication_type:
        abort(400, "Cannot cancel publication of a dataset that is not published.")

    return publication_type


def bf_withdraw_review_dataset(selected_bfaccount, selected_bfdataset):

    ps = get_authenticated_ps(selected_bfaccount)

    myds = get_dataset(ps, selected_bfdataset)

    role = bf_get_current_user_permission(ps, myds)

    if role not in ["owner"]:
        abort(403, "You must be dataset owner to cancel publication.")

    publication_type = get_publication_type(ps, myds)
   
    try:
        ps._api._post(f"/datasets/{myds.id}/publication/cancel?publicationType={publication_type}")
    except Exception as e:
        if type(e).__name__ == "HTTPError":
            abort(400, e.response.json()["message"])
        abort(500, "An internal server error prevented the request from being fulfilled. Please try again later.")

    return {"message": "Your dataset publication has been cancelled."}




def get_files_excluded_from_publishing(selected_dataset, pennsieve_account):
    """
    Function to get the files excluded from publishing

    Args:
        selected_dataset: name of selected Pennsieve dataset (string)
        pennsieve_account: name of selected Pennsieve account (string)
    Return:
        List of files excluded from publishing
    """

    ps = get_authenticated_ps(pennsieve_account)

    myds = get_dataset(ps, selected_dataset)

    ds_id = myds.id

    resp = ps._api._get(f"/datasets/{ds_id}/ignore-files")

    if "ignoreFiles" in resp:
        return {"ignore_files": resp["ignoreFiles"]}
    return {"ignore_files": []}




def update_files_excluded_from_publishing(selected_dataset_id, files_excluded_from_publishing):
    """
    Function to update the files excluded from publishing

    Args:
        selected_dataset: name of selected Pennsieve dataset (string)
        pennsieve_account: name of selected Pennsieve account (string)
        files_excluded_from_publishing: list of files excluded from publishing (list)
    Return:
        Success or error message
    """

    token = get_access_token()

    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/ignore-files", json=files_excluded_from_publishing, headers=headers)

    # TODO: log r.text and r.status_code

    r.raise_for_status()

    return {"message": "Files excluded from publishing."}





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

    ps = get_authenticated_ps(pennsieve_account)

    myds = get_dataset(ps, selected_dataset)

    resp = ps._api._get(f"/datasets/{myds.id}")

    if "children" not in resp:
        return {"metadata_files": []}

    children = resp["children"]

    # iterate through children check if content property has name property that equals one of the valid metadata file names and return it if so
    return {
        "metadata_files": [child["content"]["name"] for child in children if "content" in child and "name" in child["content"] and child["content"]["name"] in METADATA_FILES]
    }
