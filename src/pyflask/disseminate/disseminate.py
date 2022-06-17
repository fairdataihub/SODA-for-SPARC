# -*- coding: utf-8 -*-

### Import required python modules

from gevent import monkey

monkey.patch_all()

from pennsieve import Pennsieve
from manageDatasets import bf_get_current_user_permission
from flask import abort 




def bf_get_doi(selected_bfaccount, selected_bfdataset):
    """
    Function to get current doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Current doi or "None"
    """

    print(selected_bfaccount)

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, "Error: Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Error: Please select a valid Pennsieve dataset")


    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        abort(403, "Error: You don't have permissions to view/edit DOI for this Pennsieve dataset")

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
        abort(400, "Error: Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Error: Please select a valid Pennsieve dataset")

    
    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        abort(403, "Error: You don't have permissions to view/edit DOI for this Pennsieve dataset")


    try:
        res = bf_get_doi(selected_bfaccount, selected_bfdataset)
        if res != "None":
            abort(400, "Error: A DOI has already been reserved for this dataset")
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        contributors_list = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/contributors"
        )
        creators_list = []
        for item in contributors_list:
            creators_list.append(item["firstName"] + " " + item["lastName"])
        jsonfile = {
            "title": selected_bfdataset,
            "creators": creators_list,
        }
        bf._api.datasets._post("/" + str(selected_dataset_id) + "/doi", json=jsonfile)
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
        abort(400, "Error: Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Error: Please select a valid Pennsieve dataset")

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


"""
    Function to publish for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
"""


def bf_submit_review_dataset(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner"]:
            error = "Error: You must be dataset owner to send a dataset for review"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        request_publish = bf._api._post(
            "/datasets/"
            + str(selected_dataset_id)
            + "/publication/request?publicationType="
            + "publication"
        )
        return request_publish
    except Exception as e:
        raise e


def bf_withdraw_review_dataset(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner"]:
            error = "Error: You must be dataset owner to withdraw a dataset from review"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        withdraw_review = bf._api._post(
            "/datasets/"
            + str(selected_dataset_id)
            + "/publication/cancel?publicationType="
            + "publication"
        )
        return withdraw_review
    except Exception as e:
        raise e


"""
    DEPRECATED

    Function to publish for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Success or error message
"""


def bf_publish_dataset(selected_bfaccount, selected_bfdataset):

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner"]:
            error = "Error: You must be dataset owner to publish a dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        request_publish = bf._api._post(
            "/datasets/" + str(selected_dataset_id) + "/publish"
        )
        return request_publish["status"]
    except Exception as e:
        raise e




def get_files_excluded_from_publishing(selected_dataset, pennsieve_account):
    """
    Function to get the files excluded from publishing

    Args:
        selected_dataset: name of selected Pennsieve dataset (string)
        pennsieve_account: name of selected Pennsieve account (string)
    Return:
        List of files excluded from publishing
    """

    try:
        bf = Pennsieve(pennsieve_account)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_dataset)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve dataset")

    try:
        selected_dataset_id = myds.id
        return bf._api._get(f"/datasets/{selected_dataset_id}/ignore-files")

    except Exception as e:
        raise e