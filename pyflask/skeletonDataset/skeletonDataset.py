"""
Given a sodaJSONObject dataset-structure key, create a skeleton of the dataset structure on the user's filesystem. 
Then pass the path to the skeleton to the validator.
Works within Organize Datasets to allow a user to validate their dataset before uploading it to Pennsieve/Generating it locally.
"""

import os
from posixpath import expanduser
import shutil
from xml.dom import InvalidStateErr
from pathlib import Path
from sparcur.simple.validate import main as validate
import copy
from .skeletonDatasetUtils import import_bf_metadata_files_skeleton, import_manifest_files_skeleton
from pennsieve2.pennsieve import Pennsieve
from manifest import ManifestBuilderBase, ManifestBuilder
# from organizeDatasets import import_pennsieve_dataset

path = os.path.join(expanduser("~"), "SODA", "skeleton")


def create_skeleton(dataset_structure, path):
    """
    Create a skeleton of the dataset structure on the user's filesystem.
    """
    for folder in dataset_structure["folders"]:
        os.mkdir(os.path.join(path, folder))
        create_skeleton(dataset_structure["folders"][folder], os.path.join(path, folder))
    for file in dataset_structure["files"]:
        # TODO: If the type is bf/virtual then create a generic file with the name of the file key ( and write information to it )
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

def create(soda_json_structure, selected_account, selected_dataset, pennsieve_pipeline):
    """
    Creates a skeleton dataset ( a set of empty data files but with valid metadata files ) of the given soda_json_structure on the local machine.
    Used for validating a user's dataset before uploading it to Pennsieve.
    NOTE: This function is only used for validating datasets ( both local and on Pennsieve ) that are being organized in the Organize Datasets feature of SODA.
    The reason for this being that those datasets may exist in multiple locations on a user's filesystem ( or even on multiple machines ) and therefore cannot be validated 
    until they have been put together in a single location.

    """
    path = os.path.join(expanduser("~"), "SODA", "skeleton")

    # check if the skeleton directory exists
    if os.path.exists(path):
        # remove the non-empty skeleton directory
        shutil.rmtree(path)

    # create a folder to hold the skeleton
    os.mkdir(path)

    ps = None 

    # create Pennsieve client if the user is validating a Pennsieve dataset  
    if pennsieve_pipeline or soda_json_structure["generate-dataset"]["destination"] == "bf":
        ps = Pennsieve()

    # create the manifest files for the skeleton dataset based off the SODA JSON object if the user requested it in the Organize Datasets 
    # workflow. Otherwise import the existing manifest files from Pennsieve if the user requested validation outside of the Organize Datasets workflow.
    if pennsieve_pipeline:
        import_manifest_files_skeleton(soda_json_structure, ps)
    else:
        mbs = ManifestBuilder(soda_json_structure, path)
        mbs.build( ps if ps != None  else None)

    create_skeleton(soda_json_structure["dataset-structure"], path)

    # Add the metadata files to the root of the skeleton dataset 
    if "metadata-files" in soda_json_structure:
        for metadata_file_name, props in soda_json_structure["metadata-files"].items():
            if props["type"] == "bf": 
                import_bf_metadata_files_skeleton(selected_dataset, ps)

                file_location = os.path.join(expanduser("~"), "SODA", "metadata_files", metadata_file_name)
            else:
                # get the file location from the user's computer
                file_location = props["path"]

            # create the file at the root of the skeleton dataset 
            shutil.copyfile(file_location, os.path.join(path, metadata_file_name))

    # # run the validator on the skeleton
    # norm_ds_path = Path(path)

    # # validate the dataset
    # blob = validate(norm_ds_path) 

    # print(blob)

    # validate_validation_result(blob)

    # # peel out the status object 
    # status = blob.get('status')

    # # peel out the path_error_report object
    # path_error_report = status.get('path_error_report')

    # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    # print(parse(path_error_report))


soda_json_structure = {
    "starting-point": {
        "type": "new"
    },
    "dataset-structure": {
        "folders": {
            "code": {
                "folders": {
                    "nested": {
                        "folders": {},
                        "files": {
                            "subjects.xlsx": {
                                "path": "{{path_to_test_files}}/subjects.xlsx",
                                "type": "local",
                                "description": "",
                                "additional-metadata": "",
                                "action": [
                                    "new", "updated"
                                ]
                            } 
                        },
                        "type": "bf",
                        "action": ["existing"], 
                        "path": "N:collection:d8ea5d4b-67d9-475e-91c9-9b203ade23a0"
                    }
                },
                "files": {
                    "code_description.xlsx": {
                        "path": "N:package:9e20b5c7-b03e-4ac5-b564-c20cd7e7e161",
                        "type": "bf",
                        "description": "",
                        "additional-metadata": "",
                        "action": [
                            "existing"
                        ]
                    }, 
                    "subjects.xlsx": {
                        "path": "N:package:e5f7027c-983d-4ef5-bfab-49ec561fe1ee",
                        "type": "bf",
                        "description": "",
                        "additional-metadata": "",
                        "action": [
                            "existing"
                        ]
                    }
                },
                "type": "bf",
                "action": [],
                "path": "N:collection:b52b05be-4aec-4540-a4c8-5a6d04229dbe"
            }, 
            "primary": {
                "folders": {},
                "files": {
                    "code_description.xlsx": {
                        "path": "N:package:ee8c3d56-fa40-4a03-bd61-f1be95b9ff50",
                        "type": "bf",
                        "description": "",
                        "additional-metadata": "",
                        "action": [
                            "existing"
                        ]
                    }, 
                    "subjects.xlsx": {
                        "path": "N:package:4d9d9dd5-06e4-48c2-a471-c2d3f133f324",
                        "type": "bf",
                        "description": "",
                        "additional-metadata": "",
                        "action": [
                            "existing"
                        ]
                    }, 
                    "submission.xlsx": {
                        "path": "{{path_to_test_files}}/submission.xlsx",
                        "type": "local",
                        "description": "",
                        "additional-metadata": "",
                        "action": [
                            "new"
                        ]
                    }
                },
                "type": "",
                "action": [], 
                "path": "N:collection:127b61fb-db00-4eba-a0f0-33828f536c9f"
            }
        },
        "files": {}
    },
    "metadata-files": {
        "subjects.xlsx": { 
            "action": ["new"],
            "destination": "generate-dataset",
            "path": "/home/cmarroquin/Desktop/subjects.xlsx",  
            "type": "local"
        }
    },
    "generate-dataset": {
        "destination": "bf",
        "generate-option": "existing-bf",
        "dataset-name": "974-files",
        "if-existing": "create-duplicate",
        "if-existing-files": "create-duplicate"
    },
    "bf-account-selected": {
        "account-name": "soda"
    }, 
    "bf-dataset-selected": {
                "dataset-name": "974-files"
            }
}


# create(soda_json_structure, "", "", False)





    