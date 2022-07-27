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

    error = []
    try:
        bf = get_authenticated_ps(account)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    collection_names = bf._api._get(f"/collections/")

    return collection_names


def get_current_collection_tags(account, dataset):
    """
    Function used to get collection names of the current dataset
    """
    error = []
    try:
        bf = get_authenticated_ps(account)
    except Exception as error:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    try:
        myds = get_dataset(bf, dataset)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)


    currentCollectionTags = bf._api._get(f"/datasets/" + {dataset_id} + "/collections")
    return currentCollectionTags


def upload_collection_tags(account, dataset, tags):
    """
    Function used to upload the collection tags of a dataset to Pennsieve
    @params
        tags: List of the collection tag id's (int)
    """

    error = []
    statusResponses = []
    try:
        bf = get_authenticated_ps(account)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    try:
        myds = get_dataset(bf, dataset)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)

    for tag in tags:
        jsonfile = {"collectionId": tag}
        result = bf._api._put(f"/datasets/" + {dataset_id} + "/collections" ,json=jsonfile)
        statusResponses.append(result)

    return statusResponses


def remove_collection_tags(account, dataset, tags):
    """
    Function used to remove the tags the were assigned to a dataset
    @params
        tags: List of collection ids (int)
    """

    error = []
    statusResponses = []

    try:
        bf = get_authenticated_ps(account)
    except Exception as e:
        error.append("Error: Please select a valid account")
        raise Exception(error)

    try:
        myds = get_dataset(bf, dataset)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid dataset")
        raise Exception(error)

    for tag in tags:
        result = bf._api._del(f"/datasets/" + {dataset_id} + "/collections/" + {tag})
        statusResponses.append(result)

    return statusResponses


def upload_new_tags(account, dataset, tags):
    """
    Function is used to upload new collection tags that are not already on Pennsieve
    @params:
        tags: List of tag names (string)
    """

    error = []
    statusResponses = []

    try:
        bf = get_authenticated_ps(account)
    except Exception as e:
        error.append("Error: Please select a valid account")
        raise Exception(error)

    for tag in tags:
        jsonfile = {"name": tag}
        result = bf._api._post(f"/collections", json=jsonfile)
        statusResponses.append(result)

    return statusResponses

    