"""
Given a sodaJSONObject dataset-structure key, create a skeleton of the dataset structure on the user's filesystem. Then pass the path to the skeleton to the validator.
"""

import os
from posixpath import expanduser
import shutil
import subprocess
from xml.dom import InvalidStateErr
from pennsieve import Pennsieve
# from prepareMetadata import *
import pandas as pd
from pathlib import Path
from sparcur.simple.validate import main as validate
import copy


# TODO: Add the rest of the metadata files
METADATA_FILES = ["submission.xlsx", "README.txt", "CHANGES.txt", "dataset_description.xlsx", "subjects.xlsx", "samples.xlsx"]
HIGH_LEVEL_FOLDERS = ["primary", "code", "derivative", "docs", "source", "protocols"]

dataset_structure = {
    "files": {},
    "folders": {
        "code": {
            "type": "bf",
            "path": "N:collection:47f91fe1-4525-4842-a13f-c72c91dfd8db",
            "action": [
                "existing"
            ],
            "files": {
                "renderer.log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:22d6044d-adf5-4e7e-bd7c-a74602a25b3d",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-15T21:12:28,638373Z",
                    "type": "bf",
                    "description": "celery",
                    "additional-metadata": "",
                    "file type": ".log"
                },
                ".DS_Store": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:fd28f906-0811-4950-abd2-6a3aabb1241a",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-15T21:12:28,638373Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": "None"
                },
                "main.log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:336456fc-23c3-465d-971c-12ef3d49f1fe",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-15T21:12:41,933137Z",
                    "type": "bf",
                    "description": "salary",
                    "additional-metadata": "",
                    "file type": ".log"
                },
                "main (2).log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:d69166e9-0c3d-4419-b07a-64a34d0b39bf",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-20T12:47:32,868236Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": ".log"
                },
                " (2).DS_Store": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:9e6376e9-7317-42c0-a112-27c7b361deb4",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-20T12:47:32,868236Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": ".DS_Store"
                },
                "renderer (2).log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:ff85bbd3-0bea-495d-b1ee-168609ab0829",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-20T12:47:32,868236Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": ".log"
                }
            },
            "folders": {
                "homeilk": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:collection:99b90041-cf38-4909-ad61-ac75b29a16d7",
                    "bfpath": [
                        "code",
                        "homeilk"
                    ],
                    "files": {
                        "samples.xlsx": {
                            "action": [
                                "existing"
                            ],
                            "path": "N:package:47f931ce-f4dc-4b72-8a5b-a064db414b47",
                            "bfpath": [
                                "code",
                                "homeilk"
                            ],
                            "timestamp": "2022-09-15T21:12:28,638373Z",
                            "type": "bf",
                            "description": "marshmallow",
                            "additional-metadata": "",
                            "file type": ".xlsx"
                        },
                        "samples (2).xlsx": {
                            "action": [
                                "existing"
                            ],
                            "path": "N:package:b01cacaf-8100-4e82-bef7-81bdd8ac4351",
                            "bfpath": [
                                "code",
                                "homeilk"
                            ],
                            "timestamp": "2022-09-20T12:47:32,868236Z",
                            "type": "bf",
                            "additional-metadata": "",
                            "file type": ".xlsx"
                        }
                    },
                    "folders": {},
                    "type": "bf"
                }
            },
            "bfpath": [
                "code"
            ]
        }
    }
}

# place the high level metadata files at the root of the skeleton
metadata_files =  { 
    "metadata-files": {
        "dataset_description.xlsx": {
            "type": "bf",
            "action": [
                "existing"
            ],
            "path": "N:package:de839459-9847-4b51-bdba-ea89e892c4c0"
        },
        "subjects.xlsx": {
            "type": "bf",
            "action": [
                "existing"
            ],
            "path": "N:package:cd0b4ea1-3a9f-4921-becf-30f116156dab"
        },
        "submission.xlsx": {
            "type": "bf",
            "action": [
                "existing"
            ],
            "path": "N:package:21e76aef-7f98-454b-9964-a8eb5879d99b"
        }
    }
}


# obtain Pennsieve S3 URL for an existing metadata file
def returnFileURL(bf_object, item_id):

    file_details = bf_object._api._get(f"/packages/{str(item_id)}/view")
    file_id = file_details[0]["content"]["id"]
    file_url_info = bf_object._api._get(
        f"/packages/{str(item_id)}/files/{str(file_id)}"
    )


    return file_url_info["url"]


def column_check(x):
    return "unnamed" not in x.lower()


def import_metadata(url, filename):
    try:

        df = pd.read_excel(
            url, engine="openpyxl", usecols=column_check, header=0
        )
    except Exception as e:
        raise Exception(
            "SODA cannot read this file. If you are trying to retrieve a submission.xlsx file from Pennsieve, please make sure you are signed in with your Pennsieve account on SODA."
        ) from e

        
    final_path = os.path.join(path, filename)
    print(final_path)

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
def import_bf_metadata_files_skeleton(bfaccount, bfdataset):
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
        if myds.items[i].name in METADATA_FILES:

            item_id = myds.items[i].id
            url = returnFileURL(bf, item_id)

            import_metadata(url, myds.items[i].name)



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

def create_skeleton(dataset_structure, path):
    """
    Create a skeleton of the dataset structure on the user's filesystem.
    """
    for folder in dataset_structure["folders"]:
        os.mkdir(os.path.join(path, folder))
        create_skeleton(dataset_structure["folders"][folder], os.path.join(path, folder))
    for file in dataset_structure["files"]:
        with open(os.path.join(path, file), "w") as f:
            f.write("SODA")



def validate_validation_result(export):
    """
        Verifies the integriy of an export retrieved from remote or generated locally.
        Input: export - A dictionary with sparcur.simple.validate or remote validation results.
    """

    # 1. check if the export was not available for retrieval yet even afer waiting for the current maximum wait time
    if export is None:
        raise InvalidStateErr("We had trouble validating your dataset. Please try again. If the problem persists, please contact us at help@fairdataihub.org.")

    # 2. check if the export was a failed validation run TODO: discern between a failed validation run and a dataset with no metadata files 
    inputs = export.get('inputs')

    # NOTE: May not be possible to be None but just in case
    if inputs is None:
        InvalidStateErr("Please add metadata files to your dataset to receive a validation report.")


# # return the errors from the error_path_report that should be shown to the user.
# # as per Tom (developer of the Validator) for any paths (the keys in the Path_Error_Report object)
# # return the ones that do not have any errors in their subpaths. 
# # e.g., If given #/meta and #/meta/technique keys only return #/meta/technique (as this group doesn't have any subpaths)
def parse(error_path_report):

  user_errors = copy.deepcopy(error_path_report)

  keys = error_path_report.keys()

  # go through all paths and store the paths with the longest subpaths for each base 
  # also store matching subpath lengths together
  for k in keys:
    prefix = get_path_prefix(k)

    # check if the current path has inputs as a substring
    if prefix.find("inputs") != -1:
      # as per Tom ignore inputs paths' so
      # remove the given prefix with 'inputs' in its path
      del user_errors[k]
      continue 

    # check for a suffix indicator in the prefix (aka a forward slash at the end of the prefix)
    if prefix[-1] == "/":
      # if so remove the suffix and check if the resulting prefix is an existing path key
      # indicating it can be removed from the errors_for_users dictionary as the current path
      # will be an error in its subpath -- as stated in the function comment we avoid these errors 
      prefix_no_suffix_indicator = prefix[0 : len(prefix) - 1]

      if prefix_no_suffix_indicator in user_errors:
        del user_errors[prefix_no_suffix_indicator]


  
  return user_errors
  

def get_path_prefix(path):
  if path.count('/') == 1:
    # get the entire path as the "prefix" and return it
    return path
  # get the path up to the final "/" and return it as the prefix
  final_slash_idx = path.rfind("/")
  return path[:final_slash_idx + 1]

### START OF SCRIPT ###

path = os.path.join(expanduser("~"), "SODA", "skeleton")

# check if the skeleton directory exists
if os.path.exists(path):
    # remove the non-empty skeleton directory
    shutil.rmtree(path)

# create a folder to hold the skeleton
os.mkdir(path)

create_skeleton(dataset_structure, path)

import_bf_metadata_files_skeleton("SODA-Pennsieve", "974-filesss")

import_manifest_files_skeleton("SODA-Pennsieve", "974-filesss")

# run the validator on the skeleton
norm_ds_path = Path(path)

# validate the dataset
blob = validate(norm_ds_path) 

validate_validation_result(blob)

# peel out the status object 
status = blob.get('status')

# peel out the path_error_report object
path_error_report = status.get('path_error_report')

# get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
print(parse(path_error_report))








    