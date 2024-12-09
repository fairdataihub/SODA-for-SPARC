import requests
from flask import abort
from constants import PENNSIEVE_URL

def pennsieve_get_current_user_permissions(dataset_id, ps_or_token):

    if type(ps_or_token) is str:
        access_token = ps_or_token
    else:
        access_token = ps_or_token.get_user().session_token

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}/role", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()

    return r.json()



def has_edit_permissions(ps_or_token, selected_dataset_id):
    """
        Checks if the current user has permission to edit the given dataset.

        Input:
            selected_dataset_id: Pennsieve dataset ID to check permissions for
            ps: Pennsieve client object of a user that has been authenticated
    """
    try:
        role = pennsieve_get_current_user_permissions(selected_dataset_id, ps_or_token)["role"]
    except Exception as e:
        abort(500, "Could not get permissions for this dataset.")

    return role in ["owner", "manager", "editor"]  
