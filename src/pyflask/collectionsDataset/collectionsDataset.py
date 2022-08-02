from collections import defaultdict
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
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id
    except Exception as e:
        error = "Error: Please select a valid Pennsieve dataset"
        raise Exception(error)

# TODO: modify response to create object to return
# arrays are not accepted and will need to convert final call in tags list as the object to return
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

    print({"collection": store})
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
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id
    except Exception as e:
        error = "Error: Please select a valid dataset"
        raise Exception(error)

    store = []
    threads = []
    nthreads = 8
    
    for tagid in tags:
        result = ps._api._del(f"/datasets/{str(dataset_id)}/collections/{str(tagid)}")
        statusResponses.append(result)
        print(result)
        print("uhhh")

    result = dict({"collection_ids": statusResponses})
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

    for tag in tags:
        jsonfile = {"name": tag}
        result = ps._api._post(f"/collections", json=jsonfile)
        statusResponses.append(result)

    result = dict({"collection_ids": statusResponses})
    print(result)
    return result

    