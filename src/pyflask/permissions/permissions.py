import requests
from flask import abort
from constants import PENNSIEVE_URL

def pennsieve_get_current_user_permissions(dataset_id, ps_or_token):

    if type(ps_or_token) is str:
        access_token = ps_or_token
    else:
        access_token = ps_or_token.get_user().session_token

    # get the user id 
    r = requests.get(f"{PENNSIEVE_URL}/user", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()
    user_id = r.json()["id"]

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}/collaborators/users", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()

    collab_users = r.json()

    for collaborator in collab_users:
        if collaborator["id"] == user_id:
            return collaborator["role"]

    return "None"



def has_edit_permissions(ps_or_token, selected_dataset_id):
    """
        Checks if the current user has permission to edit the given dataset.

        Input:
            selected_dataset_id: Pennsieve dataset ID to check permissions for
            ps: Pennsieve client object of a user that has been authenticated
    """
    try:
        role = pennsieve_get_current_user_permissions(selected_dataset_id, ps_or_token)
    except Exception as e:
        abort(500, "Could not get permissions for this dataset.")

    return role in ["owner", "manager"]  
