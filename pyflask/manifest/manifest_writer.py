"""
Classes for creating manifest files for a dataset stored locally/on Pennsieve. 
"""

from os.path import join, exists, expanduser, isdir
from os import makedirs, remove
import datetime
import pathlib
import shutil 

import pandas as pd
import requests 

from utils import create_request_headers, column_check, returnFileURL, remove_high_level_folder_from_path, get_name_extension, get_dataset_id, TZLOCAL

userpath = expanduser("~")

PENNSIEVE_URL = "https://api.pennsieve.io"
manifest_folder_path = join(userpath, "SODA", "manifest_files")



def update_existing_pennsieve_manifest_files(ps, soda_json_structure, high_level_folders, manifest_progress):

    dataset_id = get_dataset_id(ps, soda_json_structure["bf-dataset-selected"]["name"])

    r = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}/packages", headers=create_request_headers(ps))
    r.raise_for_status()

    ds_items = r.json()["packages"]

    dataset_structure = soda_json_structure["dataset-structure"]

    # handle updating any existing manifest files on Pennsieve
    for i in ds_items:
        if i["content"]["name"] in [
            "code",
            "derivative",
            "docs",
            "primary",
            "protocol",
            "source",
        ]:
            # request the packages of that folder
            folder_name = i["content"]["name"]
            folder_collection_id = i["content"]["nodeId"]
            r = requests.get(f"{PENNSIEVE_URL}/packages/{folder_collection_id}", headers=create_request_headers(ps))
            r.raise_for_status()

            packageItems = r.json()["children"]
            for j in packageItems:
                if j["content"]["name"] == "manifest.xlsx":
                    manifest_folder = join(manifest_folder_path, folder_name)
                    if not exists(manifest_folder):
                        # create the path
                        makedirs(manifest_folder)
                    elif exists(join(manifest_folder, "manifest.xlsx")):
                        remove(join(manifest_folder, "manifest.xlsx"))

                    item_id = j["content"]["nodeId"]
                    url = returnFileURL(ps, item_id)

                    manifest_df = pd.read_excel(
                        url, engine="openpyxl", usecols=column_check, header=0
                    )

                    filepath = join(
                        manifest_folder_path, folder_name, "manifest.xlsx"
                    )
                    # print(filepath)

                    high_level_folders.remove(folder_name)

                    updated_manifest_dict = update_existing_pennsieve_manifest_file(dataset_structure["folders"][folder_name], manifest_df)
                    # print(updated_manifest_dict)

                    if not exists(join(manifest_folder_path, folder_name)):
                        # create the path
                        makedirs(join(manifest_folder_path, folder_name))

                    new_manifest = pd.DataFrame.from_dict(updated_manifest_dict)
                    new_manifest.to_excel(filepath, index=False)

                    manifest_progress["manifest_files_uploaded"] += 1

                    no_manifest_boolean = True

                    # break because we only need to read the "manifest.xlsx" file in each high level folder.
                    break



def update_existing_pennsieve_manifest_file(high_level_folder, manifest_df):
    """
        Given a high level folder and the existing manifest file therein, create a new updated manifest file. 
        This manifest file needs to have files that only exist in the high level folder. Additionally, it needs to 
        retain any custom metadata that the user has added to the old manifest file for entries that still exist. 
    """

    new_manifest_dict = {'filename': [], 'timestamp': [], 'description': [], 'file type': [], 'Additional Metadata': []}
    SET_COLUMNS = ['filename', 'timestamp', 'description', 'file type', 'Additional Metadata']
    for column in manifest_df.columns: 
        if column not in new_manifest_dict:
            new_manifest_dict[column] = []
            SET_COLUMNS.append(column)

    # convert the old manifest into a dictionary to optimize the lookup time
    old_manifest_dict = {x: manifest_df[x].values.tolist() for x in manifest_df}
    print(old_manifest_dict)
    print("#"*30)
    # old_manifest_dict = {x:manifest_df[x].values.tolist() for x in manifest_df}

    # create a mapping of filename to the idx of the row in the old_manidest_dict
    if "filename" in manifest_df:
        filename_idx_map = {x:i for i, x in enumerate(manifest_df['filename'])}
    if "File Name" in manifest_df:
        filename_idx_map = {x:i for i, x in enumerate(manifest_df['File Name'])}

    # traverse through the high level folder items
    update_existing_pennsieve_manifest_file_helper(high_level_folder, old_manifest_dict, new_manifest_dict, filename_idx_map, manifest_columns=SET_COLUMNS)

    # write the new manifest_df to the correct location as an excel file 
    return new_manifest_dict



def update_existing_pennsieve_manifest_file_helper(folder, old_manifest_dict, new_manifest_dict, filename_idx_map, manifest_columns):
    """
        Traverse through each high level folder in the dataset and update the new manifest data frame.
    """

    if "files" in folder.keys():
        for file in list(folder["files"]):
            file_path = remove_high_level_folder_from_path(folder["files"][file]["folderpath"]) + f"{file}"

            # select the row in the old manifest file that has the same file path as the file in the current folder
            # rationale: this means the file still exists in the user's dataset
            row_idx = filename_idx_map.get(file_path, None)

            if row_idx is None:
                for key in new_manifest_dict.keys():
                    if key == "filename":
                        new_manifest_dict["filename"].append(file_path)   
                    elif key == "timestamp":
                        new_manifest_dict["timestamp"].append(folder["files"][file]["timestamp"]), 
                    elif key == "description": 
                        new_manifest_dict["description"].append(folder["files"][file].get("description", ""))
                    elif key == "file type":
                        unused_file_name, file_extension = get_name_extension(file)
                        new_manifest_dict["file type"].append(file_extension), 
                    elif key == "Additional Metadata":
                        new_manifest_dict["Additional Metadata"].append(folder["files"][file].get("additional-metadata", ""))
                    else:
                        new_manifest_dict[key].append("")
                    

            else:
                # add the existing rows to the new manifest dictionary's arrays
                # TODO: Confirm it adds NULL/NaN if the value is empty
                for column in manifest_columns:
                    new_manifest_dict[column].append(old_manifest_dict[column][row_idx])

    if "folders" in folder.keys():
        for current_folder in list(folder["folders"]):
            update_existing_pennsieve_manifest_file_helper(folder["folders"][current_folder], old_manifest_dict, new_manifest_dict, filename_idx_map, manifest_columns)

    return 



def create_high_level_manifest_files_existing_bf_starting_point(soda_json_structure, high_level_folders=["code", "derivative", "docs", "primary", "protocol", "source" ], manifest_progress={}):
    """
    Function to create manifest files for each high-level SPARC folder for an existing Pennsieve dataset.
    Args:
        soda_json_structure: soda dict with information about the dataset to be generated/modified
        high_level_folders: (optional) list of high-level folders to generate manifests for. Defaults to all primary folders.
        manifest_progress: (optional) dictionary with information about the progress of the manifest generation. Defaults to empty dictionary.
    Action:
        manifest_files_structure: dict including the local path of the manifest files
    """
    high_level_folders_present = []
    manifest_files_structure = {}
    local_timezone = TZLOCAL()

    # global namespace_logger

    # namespace_logger.info("create_high_level_manifest_files_existing_bf_starting_point step 1")

    def recursive_folder_traversal(folder, dict_folder_manifest):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                relative_file_name = ""
                i = 1
                while i < len(folder["files"][item]["folderpath"]):
                    relative_file_name += folder["files"][item]["folderpath"][i] + "/"
                    i += 1
                relative_file_name += item
                relative_file_name.replace("\\", "/")
                dict_folder_manifest["filename"].append(relative_file_name)
                unused_file_name, file_extension = get_name_extension(item)
                if file_extension == "":
                    file_extension = "None"
                dict_folder_manifest["file type"].append(file_extension)

                if "type" in folder["files"][item].keys():
                    if folder["files"][item]["type"] == "bf":
                        dict_folder_manifest["timestamp"].append(
                            folder["files"][item]["timestamp"]
                        )
                    elif folder["files"][item]["type"] == "local":
                        file_path = folder["files"][item]["path"]
                        filepath = pathlib.Path(file_path)
                        mtime = filepath.stat().st_mtime
                        lastmodtime = datetime.fromtimestamp(mtime).astimezone(
                            local_timezone
                        )

                        tm = lastmodtime.isoformat().replace(".", ",").replace("+00:00", "Z")
                        dict_folder_manifest["timestamp"].append(tm)
                else:
                    dict_folder_manifest["timestamp"].append("")

                if "description" in folder["files"][item].keys():
                    dict_folder_manifest["description"].append(
                        folder["files"][item]["description"]
                    )
                else:
                    dict_folder_manifest["description"].append("")

                if "additional-metadata" in folder["files"][item].keys():
                    dict_folder_manifest["Additional Metadata"].append(
                        folder["files"][item]["additional-metadata"]
                    )
                else:
                    dict_folder_manifest["Additional Metadata"].append("")

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                recursive_folder_traversal(
                    folder["folders"][item], dict_folder_manifest
                )

        return

    dataset_structure = soda_json_structure["dataset-structure"]

    # create local folder to save manifest files temporarily if the existing files are stale (i.e. not from updating existing manfiest files)
    if len(high_level_folders) == 6:
        shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0
        makedirs(manifest_folder_path)

    for high_level_folder in list(dataset_structure["folders"]):

        # do not overwrite an existing manifest file 
        if high_level_folder not in high_level_folders:
            continue
        
        if dataset_structure["folders"][high_level_folder]["files"] == {} and dataset_structure["folders"][high_level_folder]["folders"] == {}:
            continue


        high_level_folders_present.append(high_level_folder)

        folderpath = join(manifest_folder_path, high_level_folder)
        makedirs(folderpath)
        manifestfilepath = join(folderpath, "manifest.xlsx")

        # Initialize dict where manifest info will be stored
        dict_folder_manifest = {}
        dict_folder_manifest["filename"] = []
        dict_folder_manifest["timestamp"] = []
        dict_folder_manifest["description"] = []
        dict_folder_manifest["file type"] = []
        dict_folder_manifest["Additional Metadata"] = []

        recursive_folder_traversal(
            dataset_structure["folders"][high_level_folder], dict_folder_manifest
        )

        df = pd.DataFrame.from_dict(dict_folder_manifest)
        df.to_excel(manifestfilepath, index=None, header=True)

        # update the progress of manifest file generation
        if manifest_progress != {}:
            print(manifest_progress["manifest_files_uploaded"]) 
            manifest_progress["manifest_files_uploaded"] += 1
        
        # add the path to the manifest into the structure
        manifest_files_structure[high_level_folder] = manifestfilepath

    return manifest_files_structure


class ManifestWriter(object):
    """
    Writes manifest files for a dataset stored locally or on Pennsieve.
    """

    def __init__(self, soda_json_structure, path):
        """
        Constructor.
        """
        self.soda_json_structure = soda_json_structure
        # where the manifest file(s) will be written to
        self.manifest_path = path


    def write(self, soda_json_structure, ps):
        """
        Writes the manifest file for the dataset. Abstract.
        """
        raise NotImplementedError("Please Implement this method")


class ManifestWriterStandaloneAlgorithm(ManifestWriter):
    """
    Writes manifest files for a dataset that is stored on Pennsieve and has local changes.
    """

    def __init__(self, soda_json_structure, path):
        """
        Constructor.
        """
        super(ManifestWriterStandaloneAlgorithm, self).__init__(soda_json_structure, path)


    def write(self, soda_json_structure, ps):
        """
        Writes the manifest file for the dataset.
        """

        high_level_folders = ["code", "derivative", "docs", "primary", "protocol", "source"]

        manifest_progress = {
            "total_manifest_files": 0,
            "manifest_files_uploaded": 0,
            "finished": False
        }

        # create the manifest file
        # handle updating any existing manifest files on Pennsieve
        update_existing_pennsieve_manifest_files(ps, soda_json_structure, high_level_folders, manifest_progress)

        # create manifest files from scratch for any high level folders that don't have a manifest file on Pennsieve
        create_high_level_manifest_files_existing_bf_starting_point(soda_json_structure, high_level_folders, manifest_progress)
        

        # write the manifest file to the skeleton directory's root folder
