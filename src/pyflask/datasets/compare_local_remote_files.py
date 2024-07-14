import os
import requests
from authentication import get_access_token
from utils import create_request_headers
from os.path import expanduser, join

from namespaces import NamespaceEnum, get_namespace_logger

namespace_logger = get_namespace_logger(NamespaceEnum.DATASETS)



sds_compliant_folder_names = ["primary", "source", "derivative", "code", "docs", "protocol", "stimulus", "analysis"]
PENNSIEVE_URL = "https://api.pennsieve.io"

folders_in_local_dataset_but_not_on_pennsieve = []
files_in_local_dataset_but_not_on_pennsieve = []
zero_kb_files_in_local_dataset_but_not_on_pennsieve = []

folder_on_pennsieve_but_not_in_local_dataset = []
file_on_pennsieve_but_not_in_local_dataset = []
empty_local_folders_on_pennsieve = []



def get_sds_compliant_folders_package_ids(dataset_id):
    global PENNSIEVE_URL
    try:
        headers = create_request_headers(get_access_token())
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}", headers=headers)
        r.raise_for_status()
        response = r.json()
        dataset_root_children = response["children"]
        return get_all_children_package_files(dataset_root_children)
    except Exception as e:
        namespace_logger.error(f"Exception when calling API: {e}")
        raise e


def get_packages_folders_and_files(package_children):
    folders = []
    files = []
    for child in package_children:
        if child["content"]["packageType"] == "Collection":
            folders.append(child["content"])
        else:
            files.append(child["content"])
    return folders, files


def get_package_children(package_id):
    try:
        headers = create_request_headers(get_access_token())
        r = requests.get(f"{PENNSIEVE_URL}/packages/{package_id}", headers=headers)
        r.raise_for_status()
        response = r.json()
        package_children = response["children"]
        return package_children
    except Exception as e:
        print(f"Exception when calling API: {e}")
        raise e


# recursively get all the files from the current folder and its subfolder
def get_all_children_package_files(package_id):
    # recursively get all the files from the current folder and its subfolder
    try:
        headers = create_request_headers(get_access_token())
        r = requests.get(f"{PENNSIEVE_URL}/packages/{package_id}", headers=headers)
        r.raise_for_status()
        response = r.json()
        package_children = response["children"]
        files = []
        for child in package_children:
            if child["content"]["packageType"] == "Collection":
                files += get_all_children_package_files(child["content"]["id"])
            else:
                files.append(child["content"]["name"])
        return files
    except Exception as e:
        print(f"Exception when calling API: {e}")
        raise e

def verify_local_folders_and_files_exist_on_pennsieve(
    local_path, pennsieve_package_id, recursivePath
):  
    global namespace_logger
    global folders_in_local_dataset_but_not_on_pennsieve 
    global files_in_local_dataset_but_not_on_pennsieve 
    global zero_kb_files_in_local_dataset_but_not_on_pennsieve

    global folder_on_pennsieve_but_not_in_local_dataset 
    global file_on_pennsieve_but_not_in_local_dataset 
    global empty_local_folders_on_pennsieve 
    
    # Step 1: Get the children of the Pennsieve package
    package_children = get_package_children(pennsieve_package_id)
    namespace_logger.info(f"Getting package children for {pennsieve_package_id}: {package_children}")

    folders_on_pennsieve, files_on_pennsieve = get_packages_folders_and_files(
        package_children
    )

    # Step 1: Create a list of the names of the folders and files on Pennsieve
    folder_names_on_pennsieve = []
    file_names_on_pennsieve = []
    for folder in folders_on_pennsieve:
        folder_names_on_pennsieve.append(folder["name"])
    for file in files_on_pennsieve:
        file_names_on_pennsieve.append(file["name"])

    # Step 2: Get the children of the local path
    if not os.path.exists(local_path):
        namespace_logger.info(f"Path {local_path} does not exist")
        # TODO: Add recursive path to list
        file_on_pennsieve_but_not_in_local_dataset += file_names_on_pennsieve
        # TODO: FUnction that recursively imports all files from the current folder including from its subfolders
        file_on_pennsieve_but_not_in_local_dataset += get_all_children_package_files(pennsieve_package_id)
    else:
        local_path_children = os.listdir(local_path)
        local_folders = []
        local_files = []
        empty_local_folders = []
        local_zero_kb_files = []
        for child in local_path_children:
            child_path = os.path.join(local_path, child)
            if os.path.isdir(child_path):
                if os.listdir(child_path) == []:
                    empty_local_folders.append(child)
                else:
                    local_folders.append(child)
            else:
                if os.path.getsize(child_path) == 0:
                    local_zero_kb_files.append(child)
                else:
                    local_files.append(child)
        folders_local_and_pennsieve = []
        # Step 3: Add local folders that are not on Pennsieve to a list
        for folder in local_folders:
            if folder not in folder_names_on_pennsieve:
                folders_in_local_dataset_but_not_on_pennsieve.append(
                    f"{recursivePath}{folder}"
                )
            # If the folder is in both the local dataset and on Pennsieve, add it to a list
            else:
                for folder_on_pennsieve in folders_on_pennsieve:
                    if folder_on_pennsieve["name"] == folder:
                        folders_local_and_pennsieve.append(folder_on_pennsieve)

        # Step 3 B: Add local empty folders that on Pennsieve to a list
        for folder in empty_local_folders:
            if folder in folder_names_on_pennsieve:
                empty_local_folders_on_pennsieve.append(f"{recursivePath}{folder}")

        # Step 4: Add local files that are not on Pennsieve to a list (excludes 0kb files)
        for file in local_files:
            if file not in file_names_on_pennsieve:
                files_in_local_dataset_but_not_on_pennsieve.append(f"{recursivePath}{file}")

        # Step 4 B: Add local 0kb files that are not on Pennsieve to a list
        for file in local_zero_kb_files:
            if file not in file_names_on_pennsieve:
                zero_kb_files_in_local_dataset_but_not_on_pennsieve.append(
                    f"{recursivePath}{file}"
                )

        # Step 5: Add Pennsieve folders that are not on the local dataset to a list
        for folder in folder_names_on_pennsieve:
            if folder not in local_folders:
                folder_on_pennsieve_but_not_in_local_dataset.append(
                    f"{recursivePath}{folder}"
                )

        # Step 6: Add Pennsieve files that are not on the local dataset to a list
        for file in file_names_on_pennsieve:
            if file not in local_files:
                file_on_pennsieve_but_not_in_local_dataset.append(f"{recursivePath}{file}")

        # Step 7: Recursively call this function on each folder in the local dataset that is on Pennsieve
        for folder in folders_local_and_pennsieve:
            local_folder_path_to_verify = os.path.join(local_path, folder["name"])
            verify_local_folders_and_files_exist_on_pennsieve(
                local_folder_path_to_verify,
                folder["id"],
                f"{recursivePath}{folder['name']}/",
            )


def import_subfolders(subfolder, path):
    global PENNSIEVE_URL
    global pennsieve_dataset_paths
    folder_id = subfolder["id"]
    try:
        headers = create_request_headers(get_access_token())
        r = requests.get(f"{PENNSIEVE_URL}/packages/{folder_id}", headers=headers)
        r.raise_for_status()
        response = r.json()
        folder_children = response["children"]
        for child in folder_children:
            if child["content"]["packageType"] == "Collection":
                curr_path = f"{path}/{child['content']['name']}"
                pennsieve_dataset_paths[curr_path] = False
                curr_folder = {"folders": {}, "path": curr_path, "name": child["content"]["name"], "id": child["content"]["id"], "files": {}}
                subfolder["folders"][child["content"]["name"]] = curr_folder
            else:
                curr_path = f"{path}/{child['content']['name']}"
                pennsieve_dataset_paths[curr_path] = False
                curr_file = {"name": child["content"]["name"], "path": curr_path}
                subfolder["files"][child["content"]["name"]] = curr_file
        for folder_name, folder in subfolder["folders"].items():
            namespace_logger.info(f"Importing subfolders for {folder_name}")
            import_subfolders(folder, f"{path}/{folder_name}")
    except Exception as e:
        print(f"Exception when calling API: {e}")
        raise e


pennsieve_dataset_structure = {"folders": {}, "files": {}}
pennsieve_dataset_paths = {}
# import the pennsieve dataset and store the files and folder in a dictionary with the following recursive  structure: {"folders": [], "files": []}
def import_pennsieve_dataset(dataset_id, path):
    global PENNSIEVE_URL
    global pennsieve_dataset_structure
    global pennsieve_dataset_paths
    try:
        headers = create_request_headers(get_access_token())
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{dataset_id}", headers=headers)
        r.raise_for_status()
        response = r.json()
        dataset_root_children = response["children"]


        for child in dataset_root_children:
            if child["content"]["packageType"] == "Collection":
                curr_path = f"{path}{child['content']['name']}"
                pennsieve_dataset_paths[curr_path] = False
                curr_folder = {"path": curr_path, "name": child["content"]["name"], "id": child["content"]["id"], "folders": {}, "files": {}}
                pennsieve_dataset_structure["folders"][child["content"]["name"]] = curr_folder
            else:
                curr_path = f"{path}{child['content']['name']}"
                pennsieve_dataset_paths[curr_path] = False
                curr_file = {"name": child['content']['name'], "path": curr_path}
                pennsieve_dataset_structure["files"][child["content"]["name"]] = curr_file
        
        for folder_name, folder in pennsieve_dataset_structure["folders"].items():
            namespace_logger.info(f"Importing subfolders for {folder_name}")
            import_subfolders(folder, f"{folder_name}")
    except Exception as e:
        print(f"Exception when calling API: {e}")
        raise e


local_dataset_structure = {"folders": {}, "files": {}}
local_dataset_path_in_ps_bool_dict = {}

# replicate the logic of import_pennsieve_dataset and import_subfolders but for a dataset on the users computer at a given path
def import_local_dataset(path):
    global local_dataset_structure
    global local_dataset_path_in_ps_bool_dict
    try:
        local_path_children = os.listdir(path)
        for child in local_path_children:
            child_path = os.path.join(path, child)
            if os.path.isdir(child_path):
                curr_path = f"{path}/{child}"
                curr_folder = {"path": curr_path, "name": child, "folders": {}, "files": {}}
                local_dataset_path_in_ps_bool_dict[curr_path] = False
                local_dataset_structure["folders"][child] = curr_folder
            else:
                curr_path = f"{path}/{child}"
                local_dataset_path_in_ps_bool_dict[curr_path] = False
                curr_file = {"name": child, "path": curr_path}
                local_dataset_structure["files"][child] = curr_file
        for folder_name, folder in local_dataset_structure["folders"].items():
            namespace_logger.info(f"Importing subfolders for {folder_name}")
            import_local_subfolders(folder, f"{path}/{folder_name}")
    except Exception as e:
        print(f"Exception when calling API: {e}")
        raise e


# replicate the logic of import_subfolders for a local dataset
def import_local_subfolders(subfolder, path):
    global local_dataset_structure
    global local_dataset_path_in_ps_bool_dict
    try:
        local_path_children = os.listdir(path)
        for child in local_path_children:
            child_path = os.path.join(path, child)
            if os.path.isdir(child_path):
                curr_path = f"{path}/{child}"
                local_dataset_path_in_ps_bool_dict[curr_path] = False
                curr_folder = {"path": curr_path, "name": child, "folders": {}, "files": {}}
                subfolder["folders"][child] = curr_folder
            else:
                curr_path = f"{path}/{child}"
                local_dataset_path_in_ps_bool_dict[curr_path] = False
                curr_file = {"name": child, "path": curr_path}
                subfolder["files"][child] = curr_file
        for folder_name, folder in subfolder["folders"].items():
            namespace_logger.info(f"Importing subfolders for {folder_name}")
            import_local_subfolders(folder, f"{path}/{folder_name}")
    except Exception as e:
        print(f"Exception when calling API: {e}")
        raise e


def compare_datasets(local_dataset_path):
    global local_dataset_path_in_ps_bool_dict
    global pennsieve_dataset_paths


    only_on_pennsieve = []
    only_on_local = []

    for path in pennsieve_dataset_paths.keys():
        local_path = local_dataset_path + path
        if local_path not in local_dataset_path_in_ps_bool_dict:
            only_on_pennsieve.append(path)
            print(f"Path {path} only exists on Pennsieve")

        else:
            local_dataset_path_in_ps_bool_dict[local_path] = True

    for path, exists in local_dataset_path_in_ps_bool_dict.items():
        if not exists:
            only_on_local.append(path)
            print(f"Path {path} only exists on local dataset")

    return {"files_only_on_pennsieve": only_on_pennsieve, "files_only_on_local": only_on_local}

    

def run_comparison(dataset_id, local_dataset_path):
    global namespace_logger
    global folders_in_local_dataset_but_not_on_pennsieve 
    global files_in_local_dataset_but_not_on_pennsieve 
    global zero_kb_files_in_local_dataset_but_not_on_pennsieve

    global folder_on_pennsieve_but_not_in_local_dataset 
    global file_on_pennsieve_but_not_in_local_dataset 
    global empty_local_folders_on_pennsieve
    global pennsieve_dataset_structure
    global local_dataset_path_in_ps_bool_dict
    global pennsieve_dataset_paths

    if not os.path.exists(local_dataset_path) and  not os.path.isdir(local_dataset_path):
        print(f"Path {local_dataset_path} does not exist or is not a directory")
        raise FileNotFoundError(f"Path {local_dataset_path} does not exist or is not a directory")
    
    namespace_logger.info("Finished path check")


    import_pennsieve_dataset(dataset_id, "")
    import_local_dataset(local_dataset_path)

    return compare_datasets(local_dataset_path)






