"""
Given a sodaJSONObject dataset-structure key, create a skeleton of the dataset structure on the user's filesystem. 
Then pass the path to the skeleton to the validator.
Works within Organize Datasets to allow a user to validate their dataset before uploading it to Pennsieve/Generating it locally.
"""

import os
from os.path import expanduser
from .skeletonDatasetUtils import import_bf_metadata_files_skeleton
from pennsieve2.pennsieve import Pennsieve
import pandas as pd 
from namespaces import NamespaceEnum, get_namespace_logger



path = os.path.join(expanduser("~"), "SODA", "skeleton")

#import the namespace_logger 
namespace_logger = get_namespace_logger(NamespaceEnum.SKELETON_DATASET)


def get_manifests(soda_json_structure):
    manifests = {}

    namespace_logger.info("Getting manifests")

    # chceck if guided mode
    if "guided-options" in soda_json_structure:
        namespace_logger.info("Guided Mode detected")
        # go through the high level folders in the dataset structure and get the manifest files
        for folder_name, folder_information in soda_json_structure["saved-datset-structure-json-obj"]["folders"].items():
           
           if "manifest.xlsx" in folder_information["files"]:
              # get the xlsx path 
              path_man = folder_information["files"]["manifest.xlsx"]["path"]
              namespace_logger.info("Found manifest file at: " + path_man)
              # read the xlsx file
              df = pd.read_excel(path_man)
              # convert to json
              manifests[folder_name] = df.to_json()
      # Add the manifest files to the high level folders of the skeleton dataset
    elif ("manifest-files" in soda_json_structure and "auto-generated" in soda_json_structure["manifest-files"]):
        # auto gen'd was selected so gather the paths for the high lvl folders
        for high_lvl_folder in soda_json_structure["dataset-structure"]["folders"].keys():
          #for free form mode we will get manifest files from ~/SODA/manifest_files/<high_lvl_folder_name>
          manifest_location = os.path.join(expanduser("~"), "SODA", "manifest_files", high_lvl_folder, "manifest.xlsx")
          if os.path.exists(manifest_location):
            df = pd.read_excel(manifest_location)
            manifests[high_lvl_folder] = df.to_json()

    return manifests


def get_metadata_files_json(soda_json_structure):
    metadata_files = {}
    # Add the metadata files to the root of the skeleton dataset
    if "metadata-files" in soda_json_structure:
        for metadata_file_name, props in soda_json_structure["metadata-files"].items():
            if props["type"] == "bf": 
                selected_dataset = soda_json_structure["bf-dataset-selected"]["dataset-name"]
                ps = Pennsieve()
                # TODO: Update the import xlsx funcs to use the new func that avoids SSL errors
                import_bf_metadata_files_skeleton(selected_dataset, ps, metadata_files)
            else:
                # get the file location from the user's computer
                file_location = props["path"]
                # if file name is not readme or changes
                if metadata_file_name in ["README.txt", "CHANGES.txt"]:
                    # read the file and add it to the metadata_files dict
                    with open(file_location, "r") as f:
                        metadata_files[metadata_file_name] = f.read()
                else:
                  df = pd.read_excel(file_location)
                  metadata_files[metadata_file_name] = df.to_json()

    return metadata_files



    