import requests
from flask import abort

def bf_get_current_user_permission_agent_two(dataset_id, ps):
    PENNSIEVE_URL = "https://api.pennsieve.io"

    access_token = ps.getUser()["session_token"]

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}/role", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()

    return r.json()



def has_edit_permissions(ps, selected_dataset_id):
    """
        Checks if the current user has permission to edit the given dataset.

        Input:
            selected_dataset_id: Pennsieve dataset ID to check permissions for
            ps: Pennsieve client object of a user that has been authenticated
    """
    try:
        role = bf_get_current_user_permission_agent_two(selected_dataset_id, ps)["role"]
    except Exception as e:
        abort(500, "Could not get permissions for this dataset.")

    return role in ["owner", "manager"]  
