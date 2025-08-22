import os
import requests
from authentication import get_access_token
from utils import create_request_headers

from namespaces import NamespaceEnum, get_namespace_logger

namespace_logger = get_namespace_logger(NamespaceEnum.DATASETS)



PENNSIEVE_URL = "https://api.pennsieve.io"



def import_subfolders(subfolder, path):
    global PENNSIEVE_URL
    global namespace_logger
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
                pennsieve_dataset_paths[curr_path] = {"present": False, "id": child["content"]["id"]}
                curr_folder = {"folders": {}, "path": curr_path, "name": child["content"]["name"], "id": child["content"]["id"], "files": {}}
                subfolder["folders"][child["content"]["name"]] = curr_folder
            else:
                curr_path = f"{path}/{child['content']['name']}"
                pennsieve_dataset_paths[curr_path] = {"present": False, "id": child["content"]["id"]}
                curr_file = {"name": child["content"]["name"], "path": curr_path}
                subfolder["files"][child["content"]["name"]] = curr_file
        for folder_name, folder in subfolder["folders"].items():
            import_subfolders(folder, f"{path}/{folder_name}")
    except Exception as e:
        namespace_logger.info(f"Exception when calling API: {e}")
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
                pennsieve_dataset_paths[curr_path] = {"present": False, "id": child["content"]["id"]}
                curr_folder = {"path": curr_path, "name": child["content"]["name"], "id": child["content"]["id"], "folders": {}, "files": {}}
                pennsieve_dataset_structure["folders"][child["content"]["name"]] = curr_folder
            else:
                curr_path = f"{path}{child['content']['name']}"
                pennsieve_dataset_paths[curr_path] = {"present": False, "id": child["content"]["id"]}
                curr_file = {"name": child['content']['name'], "path": curr_path}
                pennsieve_dataset_structure["files"][child["content"]["name"]] = curr_file
        
        for folder_name, folder in pennsieve_dataset_structure["folders"].items():
            import_subfolders(folder, f"{folder_name}")
    except Exception as e:
        namespace_logger.info(f"Exception when calling API: {e}")
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
                local_dataset_path_in_ps_bool_dict[curr_path] =  False
                curr_file = {"name": child, "path": curr_path}
                local_dataset_structure["files"][child] = curr_file
        for folder_name, folder in local_dataset_structure["folders"].items():
            import_local_subfolders(folder, f"{path}/{folder_name}")
    except Exception as e:
        namespace_logger.info(f"Exception when calling API: {e}")
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
                local_dataset_path_in_ps_bool_dict[curr_path] =  False
                curr_folder = {"path": curr_path, "name": child, "folders": {}, "files": {}}
                subfolder["folders"][child] = curr_folder
            else:
                curr_path = f"{path}/{child}"
                local_dataset_path_in_ps_bool_dict[curr_path] = False
                curr_file = {"name": child, "path": curr_path}
                subfolder["files"][child] = curr_file
        for folder_name, folder in subfolder["folders"].items():
            import_local_subfolders(folder, f"{path}/{folder_name}")
    except Exception as e:
        namespace_logger.info(f"Exception when calling API: {e}")
        raise e


def compare_datasets(local_dataset_path):
    global local_dataset_path_in_ps_bool_dict
    global pennsieve_dataset_paths
    global namespace_logger


    only_on_pennsieve = []
    only_on_pennsieve_ids = []
    only_on_local = []

    for path in pennsieve_dataset_paths.keys():
        local_path = os.path.join(local_dataset_path, path)
        if local_path not in local_dataset_path_in_ps_bool_dict:
            only_on_pennsieve.append(path)
            only_on_pennsieve_ids.append(pennsieve_dataset_paths[path]["id"])

        else:
            local_dataset_path_in_ps_bool_dict[local_path] = True

    for path, package in local_dataset_path_in_ps_bool_dict.items():
        if not package:
            only_on_local.append(path)

    return {"files_only_on_pennsieve": only_on_pennsieve, "files_only_on_local": only_on_local, "files_only_on_pennsieve_ids": only_on_pennsieve_ids}

    

def run_comparison(dataset_id, local_dataset_path):
    global namespace_logger

    global pennsieve_dataset_structure
    global local_dataset_path_in_ps_bool_dict
    global pennsieve_dataset_paths

    if not os.path.exists(local_dataset_path) and  not os.path.isdir(local_dataset_path):
        raise FileNotFoundError(f"Path {local_dataset_path} does not exist or is not a directory")
    

    

    import_pennsieve_dataset(dataset_id, "")
    import_local_dataset(local_dataset_path)

    return compare_datasets(local_dataset_path)






