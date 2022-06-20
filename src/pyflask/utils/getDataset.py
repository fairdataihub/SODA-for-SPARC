from flask import abort
import requests

PENNSIEVE_URL = "https://api.pennsieve.io"

def get_dataset(ps, selected_dataset):
    """
    Function to get the dataset using the Pennsieve python client.
    """

    try:
        myds = ps.get_dataset(selected_dataset)
    except Exception as e:
        # TODO: Account for 500 errors
        abort(400, "Please select a valid Pennsieve dataset")

    
    return myds


def get_dataset_http(selected_dataset, access_token):
    """
    Function to get the dataset via HTTP using a Pennsieve aws cognito access token.
    """
    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset}", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()

    return r.json()

    