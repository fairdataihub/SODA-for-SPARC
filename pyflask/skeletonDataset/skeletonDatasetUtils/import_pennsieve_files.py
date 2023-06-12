import os.path 
import pandas as pd
import requests
from utils import create_request_headers, load_manifest_to_dataframe, get_dataset_id
from authentication import get_access_token


#from utils import create_request_headers

# TODO: Add the rest of the metadata files
METADATA_FILES = ["submission.xlsx", "README.txt", "CHANGES.txt", "dataset_description.xlsx", "subjects.xlsx", "samples.xlsx"]
HIGH_LEVEL_FOLDERS = ["primary", "code", "derivative", "docs", "source", "protocols"]
PENNSIEVE_URL = "https://api.pennsieve.io"
path = os.path.join(os.path.expanduser("~"), "SODA", "skeleton")


# obtain Pennsieve S3 URL for an existing metadata file
def returnFileURL(token, item_id):

    r = requests.get(f"{PENNSIEVE_URL}/packages/{item_id}/view", headers=create_request_headers(token))
    r.raise_for_status()

    file_details = r.json()
    file_id = file_details[0]["content"]["id"]

    r = requests.get(
        f"{PENNSIEVE_URL}/packages/{item_id}/files/{file_id}",
        headers=create_request_headers(token),
    )
    r.raise_for_status()

    file_url_info = r.json()
    return file_url_info["url"]


def column_check(x):
    return "unnamed" not in x.lower()

def import_xlsx_metadata(url, filename):
    """
    Imports an existing .xlsx metadata file from Pennsieve into the skeleton directory.
    """
    global path 

    df = pd.read_excel( url, engine="openpyxl", usecols=column_check, header=0 )

    return df.to_json()


def import_RC_metadata(url, filename):
    """
    Import an existing README.txt or CHANGES.txt file from Pennsieve into the skeleton directory.
    """
    global path 

    # import the file text from Pennsieve 
    r = requests.get(url)
    r.raise_for_status()

    # copy the text into a file in the root of the skeleton directory
    final_path = os.path.join(path, filename)

    # create the file at the final path 
    # and write the text from Pennsieve into the file
    with open(final_path, "w") as f:
        f.write(r.text)

    return r.text


def import_metadata(url, filename):
    """
    Imports an existing metadata file from Pennsieve into the skeleton directory.
    """
    try:
        if filename in ["README.txt", "CHANGES.txt"]:
            return import_RC_metadata(url, filename)
        else:
            return import_xlsx_metadata(url, filename)
    except Exception as e:
        raise Exception(
            "SODA cannot read this file. If you are trying to retrieve a submission.xlsx file from Pennsieve, please make sure you are signed in with your Pennsieve account on SODA."
        ) from e
    

# import existing metadata files except Readme and Changes from Pennsieve
def import_bf_metadata_files_skeleton(bfdataset, metadata_files):

    if not os.path.exists(path):
        os.makedirs(path)

    token = get_access_token()
        
    try: 
        selected_dataset_id = get_dataset_id(token, bfdataset)
    except Exception as e:
        raise Exception("Please select a valid Pennsieve dataset.") from e


    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(token))
    r.raise_for_status()

    dataset = r.json()

    for child in dataset["children"]:
        if child["content"]["packageType"] != "Collection" and child["content"]["name"] in METADATA_FILES:
                item_id = child["content"]["id"]
                if child["content"]["name"] in ["README.txt", "CHANGES.txt"]:
                    # make a request to the zipit service directly
                    url = returnFileURL(token, item_id)
                    r = requests.get(url)
                    metadata_files[child["content"]["name"]] = r.text
                else:
                    dataframe = load_manifest_to_dataframe(item_id, "xlsx", token)
                    metadata_json = dataframe.to_json()
                    metadata_files[child["content"]["name"]] = metadata_json

                # write the content name to a text file
                with open(os.path.join(path, "metadata_files.txt"), "a") as f:
                    f.write(child["content"]["name"] )

    return metadata_files