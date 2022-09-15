from flask import abort
from gevent import monkey
from manageDatasets import bf_get_current_user_permission

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
        role = bf_get_current_user_permission(ps, myds)
        if role not in ["owner", "manager"]:
            abort(403, "You do not have permission to view/edit DOI for this Pennsieve dataset.")

    except Exception as e:
        abort(400, "Error: Please select a valid Pennsieve dataset")

    for tag in tags:
        jsonfile = {"name": tag}
        result = ps._api._post("/collections", json=jsonfile)
        statusResponses.append(result)

    return dict({"collection": statusResponses})

    