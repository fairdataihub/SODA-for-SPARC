import requests
from constants import PENNSIEVE_2_URL
from authentication import get_access_token
from .httpUtils import create_request_headers




def get_files_for_manifest(manifest_id, limit, continuation_token=None):
    """
    Get the number of verified files in an upload manifest. For a file to be verified its status must be 
    one of the following: VERIFIED | FAILED | FINALIZED.
    """




    if continuation_token is None or continuation_token == "":
        r = requests.get(f"{PENNSIEVE_2_URL}/manifest/files?manifest_id={manifest_id}&limit={limit}", headers=create_request_headers(get_access_token()))
    else:
        r = requests.get(f"{PENNSIEVE_2_URL}/manifest/files?manifest_id={manifest_id}&limit={limit}&continuation_token={continuation_token}", headers=create_request_headers(get_access_token()))
    r.raise_for_status()
    return r.json()



def get_upload_manifests(dataset_id):
    """
    Get the ids of all upload manifests that have been initiated by the Pennsieve Agent.
    """



    r = requests.get(f"{PENNSIEVE_2_URL}/manifest?dataset_id={dataset_id}", headers=create_request_headers(get_access_token()))
    r.raise_for_status()

    return r.json()