from collections import defaultdict
from flask import abort
from gevent import monkey

monkey.patch_all()
from pennsieve import Pennsieve
from pennsieve.api.agent import (
    agent_cmd,
    validate_agent_installation,
    agent_env,
)
from pennsieve import Settings
from namespaces import NamespaceEnum, get_namespace_logger
from utils import get_dataset, get_authenticated_ps



def get_all_collections(account):
    """
    Function used to get the collections that belong to an organization
    """

    try:
        ps = get_authenticated_ps(account)
    except Exception as e:
        error = "Error: Please select a valid Pennsieve account"
        raise Exception(error)

    return ps._api._get(f"/collections/")



def get_current_collection_names(account, dataset):
    """
    Function used to get collection names of the current dataset
    """
    try:
        ps = get_authenticated_ps(account)
    except Exception as error:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    try:
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)


    return ps._api._get(f"/datasets/{str(dataset_id)}/collections")



def upload_collection_names(account, dataset, tags):
    """
    Function used to upload the collection tags of a dataset to Pennsieve
    @params
        tags: List of the collection tag id's (int)
    """
    try:
        ps = get_authenticated_ps(account)
    except Exception as e:
        error ="Error: Please select a valid Pennsieve account"
        raise Exception(error)

    try:
        #get dataset and it's id
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id
        
        # check if they are the owner/manager of dataset
        current_user = ps._api._get("/user")
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        list_dataset_permission = ps._api._get(
            "/datasets/" + str(dataset_id) + "/collaborators/users"
        )
        c = 0
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]

            if(
                first_name == first_name_current_user
                and last_name == last_name_current_user
            ):
                if role not in ["owner", "manager"]:
                    abort(403, "You must be the dataset owner or manager to add/remove from a collection")
                else:
                    c += 1

        if c == 0:
            abort(403, "You must be the dataset owner or manager to add/remove from a collection")

    except Exception as e:
        error = "Error: Please select a valid dataset"
        raise Exception(error)

    store = []
    for tag in tags:
        jsonfile = {"collectionId": int(tag)}
        result = ps._api._put(f"/datasets/{dataset_id}/collections" ,json=jsonfile)
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

    try:
        ps = get_authenticated_ps(account)
    except Exception as e:
        error = "Error: Please select a valid account"
        raise Exception(error)

    try:
        #get dataset and it's id
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id

        # check if they are the owner/manager of dataset
        current_user = ps._api._get("/user")
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        list_dataset_permission = ps._api._get(
            "/datasets/" + str(dataset_id) + "/collaborators/users"
        )
        c = 0
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]

            if(
                first_name == first_name_current_user
                and last_name == last_name_current_user
            ):
                if role not in ["owner", "manager"]:
                    abort(403, "You must be the dataset owner or manager to add/remove from a collection")
                else:
                    c += 1

        if c == 0:
            abort(403, "You must be the dataset owner or manager to add/remove from a collection")

    except Exception as e:
        error = "Error: Please select a valid dataset"
        raise Exception(error)
    
    for tagid in tags:
        result = ps._api._del(f"/datasets/{str(dataset_id)}/collections/{str(tagid)}")
        statusResponses.append(result)

    result = dict({"collection": statusResponses})
    return result

def upload_new_names(account, dataset, tags):
    """
    Function is used to upload new collection tags that are not already on Pennsieve
    @params:
        tags: List of tag names (string)
    """

    statusResponses = []

    try:
        ps = get_authenticated_ps(account)
    except Exception as e:
        error = "Error: Please select a valid account"
        raise Exception(error)

    try:
        #get dataset and it's id
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id
        
        # check if they are the owner/manager of dataset
        current_user = ps._api._get("/user")
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        list_dataset_permission = ps._api._get(
            "/datasets/" + str(dataset_id) + "/collaborators/users"
        )
        c = 0
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]

            if(
                first_name == first_name_current_user
                and last_name == last_name_current_user
            ):
                if role not in ["owner", "manager"]:
                    abort(403, "You must be the dataset owner or manager to add/remove from a collection")
                else:
                    c += 1

        if c == 0:
            abort(403, "You must be the dataset owner or manager to add/remove from a collection")

    except Exception as e:
        error = "Error: Please select a valid dataset"
        raise Exception(error)

    for tag in tags:
        jsonfile = {"name": tag}
        result = ps._api._post(f"/collections", json=jsonfile)
        statusResponses.append(result)

    return dict({"collection": statusResponses})

    