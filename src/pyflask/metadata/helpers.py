import requests
from constants import PENNSIEVE_URL
from authentication import get_access_token
from utils import get_dataset_id, create_request_headers, connect_pennsieve_client, PennsieveActionNoPermission, GenericUploadError, has_edit_permissions
from functools import partial
import time 
import os
import sys


def get_template_path(filename):
    """Get the path to a template file within the metadata_templates package."""
    
    # Method 1: Try PyInstaller bundle first (onefolder creates _MEIPASS)
    if hasattr(sys, '_MEIPASS'):
        # PyInstaller onefolder extracts to _MEIPASS/
        possible_paths = [
            os.path.join(sys._MEIPASS, "pysoda", "core", "metadata_templates", filename),
            os.path.join(sys._MEIPASS, "metadata_templates", filename),
            os.path.join(sys._MEIPASS, filename)
        ]
        for path in possible_paths:
            if os.path.exists(path):
                logger.info(f"Template found in PyInstaller bundle: {path}")
                return path
    
    # Method 2: Try to import the metadata_templates module (works if PyPI package is properly installed)
    try:
        from . import metadata_templates
        templates_dir = os.path.dirname(metadata_templates.__file__)
        template_path = os.path.join(templates_dir, filename)
        if os.path.exists(template_path):
            logger.info(f"Template found in metadata_templates module: {template_path}")
            return template_path
    except (ImportError, ModuleNotFoundError, AttributeError):
        pass
    
    # Method 3: Search in the Flask app's directory structure
    current_file = os.path.abspath(__file__)
    current_dir = os.path.dirname(current_file)
    
    # Walk up the directory tree to find the templates
    search_paths = [
        os.path.join(current_dir, '..', 'metadata_templates', filename),
        os.path.join(current_dir, 'metadata_templates', filename),
    ]
    
    # Also check if we're in a site-packages structure
    site_packages_paths = []
    path_parts = current_file.split(os.sep)
    for i, part in enumerate(path_parts):
        if part == 'site-packages':
            site_packages_root = os.sep.join(path_parts[:i+1])
            site_packages_paths.extend([
                os.path.join(site_packages_root, 'pysoda', 'core', 'metadata_templates', filename),
                os.path.join(site_packages_root, 'pysoda_fairdataihub_tools', 'pysoda', 'core', 'metadata_templates', filename)
            ])
    
    all_paths = search_paths + site_packages_paths
    
    for path in all_paths:
        if os.path.exists(path):
            logger.info(f"Template found in directory structure: {path}")
            return path
    
    # Method 4: Try to find in Electron app resources (if not using PyInstaller)
    try:
        # Look for Electron app structure
        current_path = current_dir
        while current_path and current_path != os.path.dirname(current_path):
            electron_paths = [
                os.path.join(current_path, 'resources', 'app', 'node_modules', 'pysoda', 'core', 'metadata_templates', filename),
                os.path.join(current_path, 'resources', 'pysoda', 'core', 'metadata_templates', filename),
                os.path.join(current_path, 'app', 'pysoda', 'core', 'metadata_templates', filename)
            ]
            for path in electron_paths:
                if os.path.exists(path):
                    logger.info(f"Template found in Electron app resources: {path}")
                    return path
            current_path = os.path.dirname(current_path)
    except Exception:
        pass


    # Method 5: Try to find in Electron Resources folder
    try:
        # Find the Electron Resources folder
        current_path = current_dir
        resources_folder = None
        
        # Walk up the directory tree to find the Resources folder
        while current_path and current_path != os.path.dirname(current_path):
            # Check common Electron Resources locations
            possible_resources = [
                os.path.join(current_path, 'Resources'),  # macOS
                os.path.join(current_path, 'resources'),  # Windows/Linux
                os.path.join(current_path, 'Contents', 'Resources'),  # macOS app bundle
            ]
            
            for resource_path in possible_resources:
                if os.path.exists(resource_path):
                    resources_folder = resource_path
                    break
            
            if resources_folder:
                break
                
            current_path = os.path.dirname(current_path)
        
        # If we found the Resources folder, look for metadata_templates inside it
        if resources_folder:
            template_path = os.path.join(resources_folder, 'metadata_templates', filename)
            logger.info(f"Searching for template file in Electron Resources: {template_path}")

            if os.path.exists(template_path):
                logger.info(f"Template found in Electron Resources: {template_path}")
                return template_path
                
    except Exception as e:
        logger.warning(f"Failed to search Electron Resources: {e}")
        pass

    # Method 6: Use importlib_resources as fallback (Python 3.7+)
    try:
        from importlib import resources
        with resources.path('metadata_templates', filename) as template_path:
            logger.info(f"Using template path: {template_path}")

            if template_path.exists():
                logger.info(f"Template found using importlib_resources: {template_path}")
                return str(template_path)
    except (ImportError, ModuleNotFoundError, AttributeError):
        # Fallback to other methods if importlib_resources is not available
        pass
    

        
    except Exception as e:
        logger.error(f"Failed to create fallback template: {e}")
        raise ImportError(f"Could not locate or create template file {filename}. Error: {e}")



# helper function to process custom fields (users add and name them) for subjects and samples files
def getMetadataCustomFields(matrix):
    return [column for column in matrix if any(column[1:])]


# transpose a matrix (array of arrays)
# The transpose of a matrix is found by interchanging its rows into columns or columns into rows.
# REFERENCE: https://byjus.com/maths/transpose-of-a-matrix/
def transposeMatrix(matrix):
    return [[matrix[j][i] for j in range(len(matrix))] for i in range(len(matrix[0]))]

# needed to sort subjects and samples table data to match the UI fields
def sortedSubjectsTableData(matrix, fields):
    sortedMatrix = []
    for field in fields:
        for column in matrix:
            if column[0].lower() == field:
                sortedMatrix.append(column)
                break

    customHeaderMatrix = [
        column for column in matrix if column[0].lower() not in fields
    ]

    return (
        np.concatenate((sortedMatrix, customHeaderMatrix)).tolist()
        if customHeaderMatrix
        else sortedMatrix
    )



def upload_metadata_file(file_name, soda, path_to_file, delete_after_upload=True):
    global logger

    if "ps-account-selected" in soda:
        ps_account = soda["ps-account-selected"]["account-name"]
    
    if "ps-dataset-selected" in soda:
        ps_dataset = soda["ps-dataset-selected"]["dataset-name"]
    
    # check that the Pennsieve dataset is valid
    selected_dataset_id = get_dataset_id(ps_dataset)

    # check that the user has permissions for uploading and modifying the dataset
    if not has_edit_permissions(get_access_token(), selected_dataset_id):
        raise PennsieveActionNoPermission("edit" + selected_dataset_id)
    headers = create_request_headers(get_access_token())
    # handle duplicates on Pennsieve: first, obtain the existing file ID
    r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=headers)
    r.raise_for_status()
    ds_items = r.json()
    # go through the content in the dataset and find the file ID of the file to be uploaded
    for item in ds_items["children"]:
        if item["content"]["name"] == file_name:
            item_id = item["content"]["id"]
            jsonfile = {
                "things": [item_id]
            }
            # then, delete it using Pennsieve method delete(id)\vf = Pennsieve()
            r = requests.post(f"{PENNSIEVE_URL}/data/delete",json=jsonfile, headers=headers)
            r.raise_for_status()
    try:
        ps = connect_pennsieve_client(ps_account)
        # create a new manifest for the metadata file
        ps.use_dataset(selected_dataset_id)
        manifest = ps.manifest.create(path_to_file)
        m_id = manifest.manifest_id
    except Exception as e:
        logger.error(e)
        error_message = "Could not create manifest file for this dataset"
        raise GenericUploadError(error_message)
    
    # upload the manifest file
    try: 
        ps.manifest.upload(m_id)
        # create a subscriber function with ps attached so it can be used to unusbscribe
        subscriber_metadata_ps_client = partial(subscriber_metadata, ps)
        # subscribe for the upload to finish
        ps.subscribe(10, False, subscriber_metadata_ps_client)
    except Exception as e:
        logger.error("Error uploading dataset files")
        logger.error(e)
        raise Exception("The Pennsieve Agent has encountered an issue while uploading. Please retry the upload. If this issue persists please follow this <a target='_blank' rel='noopener noreferrer' href='https://docs.sodaforsparc.io/docs/how-to/how-to-reinstall-the-pennsieve-agent'> guide</a> on performing a full reinstallation of the Pennsieve Agent to fix the problem.")


    # before we can remove files we need to wait for all of the Agent's threads/subprocesses to finish
    # elsewise we get an error that the file is in use and therefore cannot be deleted
    time.sleep(5)

    # delete the local file that was created for the purpose of uploading to Pennsieve
    if delete_after_upload:
        os.remove(path_to_file)



def subscriber_metadata(ps, events_dict):
    global logger
    if events_dict["type"] == 1:
        fileid = events_dict["upload_status"].file_id
        total_bytes_to_upload = events_dict["upload_status"].total
        current_bytes_uploaded = events_dict["upload_status"].current
        if current_bytes_uploaded == total_bytes_to_upload and fileid != "":
            logger.info("File upload complete")
            ps.unsubscribe(10)