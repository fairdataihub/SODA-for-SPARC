from pennsieve2.pennsieve import Pennsieve
from flask import abort
import requests

from namespaces import NamespaceEnum, get_namespace_logger
namespace_logger = get_namespace_logger(NamespaceEnum.MANAGE_DATASETS)

def connect_pennsieve_client(account_name):
    """
        Connects to Pennsieve Python client to the Agent and returns the initialized Pennsieve object.
    """
    try:
        return Pennsieve(profile_name=account_name)
    except Exception as e:
        abort(500, f"Could not connect to the Pennsieve agent: {e}")


def authenticate_user_with_client(ps, selected_account):
    """
        Authenticates the given user with the Pennsieve client.
        Input:
            ps: An initialized Pennsieve object
            selected_account: Pennsieve account to authenticate with
    """
    try:
        ps.user.switch(selected_account)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account.")

    try:
        ps.user.reauthenticate()
    except Exception as e:
        abort(401, "Could not reauthenticate this account with Pennsieve.")


def multi_attempt_request(url, headers):
        max_attempts = 3
        retry_delay = 2
        response = None  # Initialize response variable
        for attempt in range(max_attempts):
            try:
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                namespace_logger.info(f"Attempt {attempt + 1} successful")
                return response  # Return successful response
            except Exception as e:
                namespace_logger.info(f"Attempt error {attempt + 1}: {e}")
                if attempt < max_attempts - 1:
                    namespace_logger.info(f"Retrying for the {attempt} time in {retry_delay} seconds...")

        return response  # Return last response

def get_dataset_id(ps_or_token, selected_dataset):
    """
        Returns the dataset ID for the given dataset name.
        If the dataset ID was provided instead of the name, the ID will be returned. *Common for Guided Mode*
        Input:
            ps_or_token: An initialized Pennsieve object or a Pennsieve access token
            selected_dataset: Pennsieve dataset to get the ID for
    """
    try:
        if selected_dataset.startswith("N:dataset:"):
            return selected_dataset

        namespace_logger.info("Getting dataset ID from Pennsieve API")
        r = multi_attempt_request("https://api.pennsieve.io/datasets", headers={"Authorization": f"Bearer {ps_or_token}"})
        r.raise_for_status()

        datasets = r.json()
        
        for dataset in datasets:
            if dataset["content"]["name"] == selected_dataset:
                namespace_logger.info(f"Found dataset ID: {dataset['content']['id']}")
                return dataset["content"]["id"]
        abort(400, "Please select a valid Pennsieve dataset.")
        
    except Exception as e:
        namespace_logger.error(f"Could not get dataset ID from Pennsieve: {e}")
        abort(500, f"Could not get dataset ID from Pennsieve: {e}")



