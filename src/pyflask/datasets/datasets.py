""""
Routes for performing operations on datasets
"""

from flask import abort
import requests

from utils import get_authenticated_ps, get_dataset
from authentication import get_access_token


PENNSIEVE_URL = "https://api.pennsieve.io"

def get_role(pennsieve_account, dataset_name_or_id):
  ps = get_authenticated_ps(pennsieve_account)

  myds = get_dataset(ps, dataset_name_or_id)

  try:
    role =  ps._api._get(f"/datasets/{myds.id}/role")["role"]
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
    ps = get_authenticated_ps(account)

    myds = get_dataset(ps, dataset)
    dataset_id = myds.id

    return ps._api._get(f"/datasets/{str(dataset_id)}/collections")


def upload_collection_names(account, dataset, tags):
    """
    Function used to upload the collection tags of a dataset to Pennsieve
    @params
        tags: List of the collection tag id's (int)
    """
    ps = get_authenticated_ps(account)


    try:
        #get dataset and it's id
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id
        
        # check if they are the owner/manager of dataset
        current_user = ps._api._get("/user")
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        list_dataset_permission = ps._api._get(
           f"/datasets/{str(dataset_id)}/collaborators/users"
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
        abort(400, "Error: Please select a valid Pennsieve dataset")

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

    ps = get_authenticated_ps(account)

    try:
        #get dataset and it's id
        myds = get_dataset(ps, dataset)
        dataset_id = myds.id

        # check if they are the owner/manager of dataset
        current_user = ps._api._get("/user")
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        list_dataset_permission = ps._api._get(
            f"/datasets/{str(dataset_id)}/collaborators/users"
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
        abort(400, "Error: Please select a valid Pennsieve dataset")
    
    for tagid in tags:
        result = ps._api._del(f"/datasets/{str(dataset_id)}/collections/{str(tagid)}")
        statusResponses.append(result)

    result = dict({"collection": statusResponses})
    return result
