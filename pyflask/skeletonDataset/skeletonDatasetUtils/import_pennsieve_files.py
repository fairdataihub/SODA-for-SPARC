import os.path 
import pandas as pd
from pennsieve2.pennsieve import Pennsieve
import requests

#from utils import create_request_headers

# TODO: Add the rest of the metadata files
METADATA_FILES = ["submission.xlsx", "README.txt", "CHANGES.txt", "dataset_description.xlsx", "subjects.xlsx", "samples.xlsx"]
HIGH_LEVEL_FOLDERS = ["primary", "code", "derivative", "docs", "source", "protocols"]
PENNSIEVE_URL = "https://api.pennsieve.io"
path = os.path.join(os.path.expanduser("~"), "SODA", "skeleton")

def create_request_headers(ps_or_token):
    """
    Creates necessary HTTP headers for making Pennsieve API requests.
    Input: 
        ps: Pennsieve object for a user that has been authenticated
    """
    if type(ps_or_token) == str:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ps_or_token}",
        }
    
    return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ps_or_token.getUser()['session_token']}",
    }

# obtain Pennsieve S3 URL for an existing metadata file
def returnFileURL(ps, item_id):

    r = requests.get(f"{PENNSIEVE_URL}/packages/{item_id}/view", headers=create_request_headers(ps))
    r.raise_for_status()

    file_details = r.json()
    file_id = file_details[0]["content"]["id"]

    r = requests.get(
        f"{PENNSIEVE_URL}/packages/{item_id}/files/{file_id}",
        headers=create_request_headers(ps),
    )
    r.raise_for_status()

    file_url_info = r.json()
    return file_url_info["url"]


def column_check(x):
    return "unnamed" not in x.lower()

def import_metadata(url, filename):
    global path 
    try:
        if filename in ["README.txt", "CHANGES.txt"]:
            # import the file text from Pennsieve 
            r = requests.get(url)
            r.raise_for_status()

            # copy the text into a file in the root of the skeleton directory
            final_path = os.path.join(path, filename)

            # create the file at the final path 
            # and write the text from Pennsieve into the file
            with open(final_path, "w") as f:
                f.write(r.text)

            return 

        df = pd.read_excel(
            url, engine="openpyxl", usecols=column_check, header=0
        )
    except Exception as e:
        raise Exception(
            "SODA cannot read this file. If you are trying to retrieve a submission.xlsx file from Pennsieve, please make sure you are signed in with your Pennsieve account on SODA."
        ) from e

        
    final_path = os.path.join(path, filename)

    try:
        # write the metadata file to the skeleton directory's root folder
        df.to_excel(final_path, index=False, header=True)
    except Exception as e:
        print(e)


def import_manifest(url, path):
    try:
        df = pd.read_excel(
            url, engine="openpyxl", usecols=column_check, header=0
        )
    except Exception as e:
        raise Exception(
            "SODA cannot read this file. If you are trying to retrieve a submission.xlsx file from Pennsieve, please make sure you are signed in with your Pennsieve account on SODA."
        ) from e

    # write the manifest file to the skeleton directory's root folder
    final_path = os.path.join(path, "manifest.xlsx")
    df.to_excel(final_path, index=False, header=True)


# import existing metadata files except Readme and Changes from Pennsieve
def import_bf_metadata_files_skeleton(bfdataset):
    # sourcery skip: raise-specific-error
    try: 
        ps = Pennsieve()
    except Exception as e:
        raise Exception("Please select a valid Pennsieve account.") from e

    try: 
        selected_dataset_id = ps.getDatasets()[bfdataset]
    except Exception as e:
        raise Exception("Please select a valid Pennsieve dataset.") from e

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(ps))
    r.raise_for_status()

    dataset = r.json()

    for child in dataset["children"]:
        if child["content"]["packageType"] != "Collection" and child["content"]["name"] in METADATA_FILES:
                item_id = child["content"]["id"]
                url = returnFileURL(ps, item_id)
                import_metadata(url, child["content"]["name"])


import_bf_metadata_files_skeleton("974-files")


def import_manifest_files_skeleton(bfaccount, bfdataset):
    # sourcery skip: raise-specific-error
    try: 
        bf = Pennsieve(bfaccount)
    except Exception as e:
        raise Exception("Please select a valid Pennsieve account.") from e

    try: 
        myds = bf.get_dataset(bfdataset)
    except Exception as e:
        raise Exception("Please select a valid Pennsieve dataset.") from e

    for i in range(len(myds.items)):
        if myds.items[i].name in HIGH_LEVEL_FOLDERS:
            print("Whoopie")
            # check the folders children
            high_level_sparc_folder = bf._api._get(f"/packages/{str(myds.items[i].id)}")
            current_folder = myds.items[i].name
            
            # for each child
            for child in high_level_sparc_folder["children"]:
                # check if the file is a manifest.xlsx file
                if child['content']["name"] == "manifest.xlsx":
                    # get the file's AWS URL 
                    item_id = child['content']["id"]
                    url = returnFileURL(bf, item_id)

                    # write the file to the skeleton directory at the matching location in the pennsieve dataset that it was found in
                    import_manifest(url, os.path.join(path, current_folder))
