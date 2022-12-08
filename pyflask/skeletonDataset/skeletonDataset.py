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

path = os.path.join(expanduser("~"), "SODA", "skeleton")

soda_json_structure = {
    "bf-account-selected": {
        "account-name": "SODA-Pennsieve"
    },
    "bf-dataset-selected": { 
        "dataset-name": "carloss"
    },
    "metadata-files": {

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
    global path 
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



def import_pennsieve_dataset(soda_json_structure, requested_sparc_only=True):
    high_level_sparc_folders = [
        "code",
        "derivative",
        "docs",
        "primary",
        "protocol",
        "source",
    ]
    manifest_sparc = ["manifest.xlsx", "manifest.csv"]
    high_level_metadata_sparc = [
        "submission.xlsx",
        "submission.csv",
        "submission.json",
        "dataset_description.xlsx",
        "dataset_description.csv",
        "dataset_description.json",
        "subjects.xlsx",
        "subjects.csv",
        "subjects.json",
        "samples.xlsx",
        "samples.csv",
        "samples.json",
        "README.txt",
        "CHANGES.txt",
        "code_description.xlsx",
        "inputs_metadata.xlsx",
        "outputs_metadata.xlsx",
    ]

    double_extensions = [
        ".ome.tiff",
        ".ome.tif",
        ".ome.tf2,",
        ".ome.tf8",
        ".ome.btf",
        ".ome.xml",
        ".brukertiff.gz",
        ".mefd.gz",
        ".moberg.gz",
        ".nii.gz",
        ".mgh.gz",
        ".tar.gz",
        ".bcl.gz",
    ]

    global create_soda_json_completed
    global create_soda_json_total_items
    global create_soda_json_progress
    create_soda_json_progress = 0
    create_soda_json_total_items = 0
    create_soda_json_completed = 0

    def verify_file_name(file_name, extension):
        if extension == "":
            return file_name

        double_ext = False
        for ext in double_extensions:
            if file_name.find(ext) != -1:
                double_ext = True
                break
                
        extension_from_name = ""

        if double_ext == False:
            extension_from_name = os.path.splitext(file_name)[1]
        else:
            extension_from_name = (
                os.path.splitext(os.path.splitext(file_name)[0])[1]
                + os.path.splitext(file_name)[1]
            )

        if extension_from_name == ("." + extension):
            return file_name
        else:
            return file_name + ("." + extension)

    

    def createFolderStructure(subfolder_json, pennsieve_account, manifest):
        # root level folder will pass subfolders into this function and will recursively check if there are subfolders while creating the json structure
        global create_soda_json_progress
        
        collection_id = subfolder_json["path"]
        bf = pennsieve_account
        subfolder = bf._api._get("/packages/" + str(collection_id))
        children_content = subfolder["children"]
        for items in children_content:
            item_name = items["content"]["name"]
            create_soda_json_progress += 1
            item_id = items["content"]["id"]
            if item_id[2:9] == "package":
                # if it is a file name check if there are additional manifest information to attach to files
                if (
                    item_name[0:8] != "manifest"
                ):  # manifest files are not being included json structure

                    #verify file name first
                    if("extension" not in children_content):
                        item_name = verify_file_name(item_name, "")
                    else:
                        item_name = verify_file_name(item_name, children_content["extension"])
                        
                    ## verify timestamps
                    timestamp = items["content"]["createdAt"]
                    formatted_timestamp = timestamp.replace('.', ',')
                    subfolder_json["files"][item_name] = {
                        "action": ["existing"],
                        "path": item_id,
                        "bfpath": [],
                        "timestamp": formatted_timestamp,
                        "type": "bf",
                    }
                    for paths in subfolder_json["bfpath"]:
                        subfolder_json["files"][item_name]["bfpath"].append(paths)

                    
                    # creates path for item_name (stored in temp_name)
                    if len(subfolder_json["files"][item_name]["bfpath"]) > 1:
                        temp_name = ""
                        for i in range(
                            len(subfolder_json["files"][item_name]["bfpath"])
                        ):
                            if i == 0:
                                continue
                            temp_name += (
                                subfolder_json["files"][item_name]["bfpath"][i] + "/"
                            )
                        temp_name += item_name
                    else:
                        temp_name = item_name
                    if len(manifest.keys()) > 0:
                        if "filename" in manifest:
                            if temp_name in manifest["filename"].values():
                                location_index = list(manifest["filename"].values()).index(
                                    temp_name
                                )
                                if manifest["description"][location_index] != "":
                                    subfolder_json["files"][item_name][
                                        "description"
                                    ] = manifest["description"][location_index]
                                if manifest["Additional Metadata"] != "":
                                    subfolder_json["files"][item_name][
                                        "additional-metadata"
                                    ] = manifest["Additional Metadata"][location_index]
                                if manifest["file type"][location_index] != "":
                                        subfolder_json["files"][item_name]["file type"] = manifest["file type"][location_index]
                        elif "File Name" in manifest:
                            if temp_name in manifest["File Name"].values():
                                location_index = list(manifest["File Name"].values()).index(
                                    temp_name
                                )
                                if manifest["description"][location_index] != "":
                                    subfolder_json["files"][item_name][
                                        "description"
                                    ] = manifest["description"][location_index]
                                if manifest["Additional Metadata"] != "":
                                    subfolder_json["files"][item_name][
                                        "additional-metadata"
                                    ] = manifest["Additional Metadata"][location_index]
                                if manifest["file type"][location_index] != "":
                                        subfolder_json["files"][item_name]["file type"] = manifest["file type"][location_index]
            else:  # another subfolder found
                subfolder_json["folders"][item_name] = {
                    "action": ["existing"],
                    "path": item_id,
                    "bfpath": [],
                    "files": {},
                    "folders": {},
                    "type": "bf",
                }
                for paths in subfolder_json["bfpath"]:
                    subfolder_json["folders"][item_name]["bfpath"].append(paths)
                subfolder_json["folders"][item_name]["bfpath"].append(item_name)

                # go through recursive again through subfolder

        if len(subfolder_json["folders"].keys()) != 0:  # there are subfolders
            for folder in subfolder_json["folders"].keys():
                subfolder = subfolder_json["folders"][folder]
                createFolderStructure(subfolder, bf, manifest)

    # START

    error = []

    # check that the Pennsieve account is valid
    try:
        bf_account_name = soda_json_structure["bf-account-selected"]["account-name"]
    except Exception as e:
        raise e

    try:
        bf = Pennsieve(bf_account_name)
    except Exception as e:
        error.append("Please select a valid Pennsieve account")
        raise Exception(error)

    # check that the Pennsieve dataset is valid
    try:
        bf_dataset_name = soda_json_structure["bf-dataset-selected"]["dataset-name"]
    except Exception as e:
        raise e
    try:
        myds = bf.get_dataset(bf_dataset_name)
        dataset_id = myds.id
    except Exception as e:
        error.append("Please select a valid Pennsieve dataset")
        raise Exception(error)


    # surface layer of dataset is pulled. then go through through the children to get information on subfolders
    manifest_dict = {}
    manifest_error_message = []
    soda_json_structure["dataset-structure"] = {
        "files": {},
        "folders": {},
    }

    # root of dataset is pulled here
    # root_children is the files and folders within root
    root_folder = bf._api._get("/datasets/" + str(dataset_id))
    packages_list = bf._api._get("/datasets/" + str(dataset_id) + "/packageTypeCounts")
    for count in packages_list.values():
        create_soda_json_total_items += int(count)
    root_children = root_folder["children"]

    for items in root_children:
        item_id = items["content"]["id"]
        item_name = items["content"]["name"]
        if (item_id[2:9]) == "package":
            if item_name in high_level_metadata_sparc:
                create_soda_json_progress += 1
                # is a metadata file
                soda_json_structure["metadata-files"][item_name] = {
                    "type": "bf",
                    "action": ["existing"],
                    "path": item_id,
                }
        else:
            if item_name in high_level_sparc_folders:
                create_soda_json_progress += 1
                # is a SPARC folder and will be checked recursively
                soda_json_structure["dataset-structure"]["folders"][item_name] = {
                    "type": "bf",
                    "path": item_id,
                    "action": ["existing"],
                    "files": {},
                    "folders": {},
                    "bfpath": [item_name],
                }


    # manifest information is needed so it is looked for before the recursive calls are made
    if len(soda_json_structure["dataset-structure"]["folders"].keys()) != 0:
        for folder in soda_json_structure["dataset-structure"]["folders"].keys():
            collection_id = soda_json_structure["dataset-structure"]["folders"][folder][
                "path"
            ]
            subfolder = bf._api._get("/packages/" + str(collection_id))
            children_content = subfolder["children"]
            manifest_dict[folder] = {}
            for items in children_content:
                # check subfolders surface to see if manifest files exist to then use within recursive_subfolder_check
                package_name = items["content"]["name"]
                package_id = items["content"]["id"]
                if package_name in manifest_sparc:
                    # item is manifest
                    file_details = bf._api._get(
                        "/packages/" + str(package_id) + "/view"
                    )
                    file_id = file_details[0]["content"]["id"]
                    manifest_url = bf._api._get(
                        "/packages/" + str(package_id) + "/files/" + str(file_id)
                    )
                    df = ""
                    try:
                        if package_name.lower() == "manifest.xlsx":
                            df = pd.read_excel(manifest_url["url"], engine="openpyxl")
                            df = df.fillna("")
                        else:
                            df = pd.read_csv(manifest_url["url"])
                            df = df.fillna("")
                        manifest_dict[folder].update(df.to_dict())
                    except Exception as e:
                        manifest_error_message.append(
                            items["parent"]["content"]["name"]
                        )
            subfolder_section = soda_json_structure["dataset-structure"]["folders"][
                folder
            ]

            if folder in manifest_dict:
                createFolderStructure(
                    subfolder_section, bf, manifest_dict[folder]
                )  # passing item's json and the collection ID

    success_message = (
        "Data files under a valid high-level SPARC folders have been imported"
    )
    create_soda_json_completed = 1

    
    return {
        "soda_object": soda_json_structure,
        "success_message": success_message,
        "manifest_error_message": manifest_error_message,
        "import_progress": create_soda_json_progress,
        "import_total_items": create_soda_json_total_items,
    }

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

def create(soda_json_structure, selected_account, selected_dataset):
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

    create_skeleton(soda_json_structure["dataset-structure"], path)

    import_bf_metadata_files_skeleton(selected_account, selected_dataset)

    import_manifest_files_skeleton(selected_account, selected_dataset)

    # # run the validator on the skeleton
    # norm_ds_path = Path(path)

    # # validate the dataset
    # blob = validate(norm_ds_path) 

    # validate_validation_result(blob)

    # # peel out the status object 
    # status = blob.get('status')

    # # peel out the path_error_report object
    # path_error_report = status.get('path_error_report')

    # # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    # print(parse(path_error_report))





    