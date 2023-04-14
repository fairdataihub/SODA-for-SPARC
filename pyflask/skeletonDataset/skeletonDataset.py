"""
Given a sodaJSONObject dataset-structure key, create a skeleton of the dataset structure on the user's filesystem. 
Then pass the path to the skeleton to the validator.
Works within Organize Datasets to allow a user to validate their dataset before uploading it to Pennsieve/Generating it locally.
"""

import os
import time
from os.path import expanduser
from .skeletonDatasetUtils import import_bf_metadata_files_skeleton
from pennsieve2.pennsieve import Pennsieve
import pandas as pd 
import requests
from namespaces import NamespaceEnum, get_namespace_logger
from authentication import get_access_token
from utils import get_dataset_id, create_request_headers, load_manifest_to_dataframe




path = os.path.join(expanduser("~"), "SODA", "skeleton")

#import the namespace_logger 
namespace_logger = get_namespace_logger(NamespaceEnum.SKELETON_DATASET)


def get_manifests(soda_json_structure):
    manifests = {}

    # check if guided mode
    if "guided-options" in soda_json_structure:
        # go through the high level folders in the dataset structure and get the manifest files
        for folder_name, folder_information in soda_json_structure["saved-datset-structure-json-obj"]["folders"].items():
           if "manifest.xlsx" in folder_information["files"]:
              # get the xlsx path 
              path_man = folder_information["files"]["manifest.xlsx"]["path"]
              # check if the file exists, if not, wait 1 second then check again
              while not os.path.exists(path_man):
                time.sleep(1)
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
    elif "starting-point" in soda_json_structure and "type" in soda_json_structure["starting-point"] and soda_json_structure["starting-point"]["type"] == "local":
        # we are dealing with a dataset that was imported from a local path and did not have manifest files auto-generated
        # check if there are any manifest files in their dataset  to validate off of 
        # if there are, add them to the manifests dict
        starting_point_dict = soda_json_structure["starting-point"]
        for key in starting_point_dict.keys():
           if key in ["primary", "code", "derivative", "source", "docs", "protocol", "derivative"]:
                # read the file as a dataframe
                if "path" in starting_point_dict[key] and starting_point_dict[key]["path"] is not '':
                  df = pd.read_excel(starting_point_dict[key]["path"])
                  # convert to json
                  manifests[key] = df.to_json()
    elif "starting-point" in soda_json_structure and "type" in soda_json_structure["starting-point"] and soda_json_structure["starting-point"]["type"] == "bf":
      # check if the user has manifest files in their dataset's primary folders
      # if they do, add them to the manifests dict
      token = get_access_token()

      # get the dataset name
      dataset_name = soda_json_structure["bf-dataset-selected"]["dataset-name"]
      
      selected_dataset_id = get_dataset_id(token, dataset_name)

      
      # get the dataset id
      # headers for making requests to Pennsieve's api
      headers = create_request_headers(token)
      
      high_level_sparc_folders = [
        "code",
        "derivative",
        "docs",
        "primary",
        "protocol",
        "source",
      ]
      PENNSIEVE_URL = "https://api.pennsieve.io"
      


      # root of dataset is pulled here
      # root_children is the files and folders within root
      r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=headers)
      r.raise_for_status()
      root_folder = r.json()
      root_children = root_folder["children"]
      


      for items in root_children:
        item_id = items["content"]["id"]
        item_name = items["content"]["name"]
        if items["content"]["packageType"] == "Collection" and item_name in high_level_sparc_folders:
          r = requests.get(f"{PENNSIEVE_URL}/packages/{item_id}", headers=headers)
          r.raise_for_status()
          subfolder = r.json()

          # get the manifest file from the subfolder
          for subfolder_item in subfolder["children"]:
              if subfolder_item["content"]["name"] == "manifest.xlsx":
                namespace_logger.info(subfolder_item)
                # get the manifest file
                man_id = subfolder_item["content"]["id"]
                df = load_manifest_to_dataframe(man_id, "xlsx", token)
                # convert to json
                manifests[item_name] = df.to_json()


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



    