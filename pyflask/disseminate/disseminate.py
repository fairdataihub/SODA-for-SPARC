# -*- coding: utf-8 -*-

### Import required python modules
from flask import abort 
import requests
from permissions import bf_get_current_user_permission_agent_two, has_edit_permissions
from utils import connect_pennsieve_client, get_dataset_id, authenticate_user_with_client, create_request_headers
from errorHandlers import handle_http_error
import json
import io



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


    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/doi", headers=create_request_headers(ps))
        r.raise_for_status()
        print(r)

        # doi_status = bf._api._get(f"/datasets/{str(selected_dataset_id)}/doi")
        return {"doi": r["doi"]}
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

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")


    try:
        res = bf_get_doi(selected_bfaccount, selected_bfdataset)
        print("this is res")
        print(res)
        if res["doi"] != "None":
            abort(400, "A DOI has already been reserved for this dataset")
    except Exception as e:
        raise e

    contributors_found = True
    try:
        # contributors_list = bf._api._get(
        #     f"/datasets/{str(selected_dataset_id)}/contributors"
        # )
        print("before first")
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/contributors", headers=create_request_headers(ps))
        r.raise_for_status()
        print("after first request")
    except Exception as e:
        print("error below")
        handle_http_error(e)

    # ORIGINAL METHOD
    # creators_list = [
        #     item["firstName"] + " " + item["lastName"]
        #     for item in r
        # ]
    
    try:
        my_json = ""
        for item in r:
            # item is a byte array when printed
            print(item)
            # decode and store into string
            my_json += item.decode("utf-8").replace("'", '"')
            print(type(my_json))
            print(my_json)
            # print(decoded_item[0])

        # convert string into json 
        data = json.loads(my_json)
        s = json.dumps(data, indent=4, sort_keys=True)
        print("below we print the json")
        print(s)
        print("-" * 20)

        print(type(s));
        print(s[0])
    

        print("below is creators list")
        print(creators_list)

        jsonfile = {
            "title": selected_bfdataset,
            "creators": creators_list,
        }
        print("below is json file")
        print(jsonfile)
        # bf._api.datasets._post(f"/{str(selected_dataset_id)}/doi", json=jsonfile)
        
        r = requests.post(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/doi", headers=create_request_headers(ps), json=jsonfile)
        r.raise_for_status()

        return {"message": "Done!"}
    except Exception as e:
        handle_http_error(e)




def bf_get_publishing_status(selected_bfaccount, selected_bfdataset):
    """
    Function to get the review request status and publishing status of a dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current reqpusblishing status
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    headers= create_request_headers(ps)

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=headers)
    r.raise_for_status()
    review_request_status = r.json()["publication"]["status"]


    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/published", headers=headers)
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
