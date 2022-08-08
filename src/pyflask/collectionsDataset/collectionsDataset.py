from flask import abort
from gevent import monkey

monkey.patch_all()

from utils import get_dataset, get_authenticated_ps



def get_all_collections(account):
    """
    Function used to get the collections that belong to an organization
    """

    ps = get_authenticated_ps(account)

    return ps._api._get("/collections/")



def upload_new_names(account, dataset, tags):
    """
    Function is used to upload new collection tags that are not already on Pennsieve
    @params:
        tags: List of tag names (string)
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

    for tag in tags:
        jsonfile = {"name": tag}
        result = ps._api._post("/collections", json=jsonfile)
        statusResponses.append(result)

    return dict({"collection": statusResponses})

    