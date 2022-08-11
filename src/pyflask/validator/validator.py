# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
import os
import os.path
from pathlib import Path

from sparcur.utils import PennsieveId
from sparcur.simple.validate import main as validate
from sparcur.simple.retrieve import main as retrieve

from .validatorUtils import ( 
    parse, 
    userpath, 
    check_prerequisites, 
    sparc_organization_id, 
    parent_folder, 
    pyontutils_path, 
    orthauth_path, 
    add_scigraph_path, 
    add_scicrunch_api_key
)


# for gevent
local_dataset_folder_path = ""
validation_json = {}


def validate_dataset_pipeline(ps_account, ps_dataset):
    check_prerequisites(ps_account)

    sparc_dataset_id = ps_dataset
    sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")

    try:
        organization = PennsieveId(sparc_organization_id)
        sparc_dataset = PennsieveId(sparc_dataset_id)
    except Exception as e:
        raise e

    # create dataset folder for the retrieve
    if not os.path.exists(parent_folder):
        parent_folder.mkdir(parents = True, exist_ok = True)

    local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)

    blob = validate(local_dataset_folder_path)

    status = blob.get("status")

    # peel out the path_error_report object
    path_error_report = status.get('path_error_report')

    # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    parsed_path_error_report = parse(path_error_report)

    # TODO: Add a cleanup section to remove the dataset folder

    return parsed_path_error_report


# validate a local dataset at the target directory 
def validate_local_dataset(ds_path):
    # convert the path to absolute from user's home directory
    joined_path = os.path.join(userpath, ds_path.strip())

    # check that the directory exists 
    valid_directory = os.path.isdir(joined_path)

    # give user an error 
    if not valid_directory:
        raise OSError(f"The given directory does not exist: {joined_path}")

    # convert to Path object for Validator to function properly
    norm_ds_path = Path(joined_path)

    # validate the dataset
    blob = validate(norm_ds_path)

    # peel out the status object 
    status = blob.get('status')

    if 'path_error_report' not in status:
        return "TODO: Handle this case later"

    # peel out the path_error_report object
    path_error_report = status.get('path_error_report')

    # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    parsed_path_error_report = parse(path_error_report)

    return parsed_path_error_report


# add scicrunch api key and api key name to the validator config files
def add_scicrunch_to_validator_config(api_key, api_key_name, selected_account):
    # create the config files and folders if they do not already exist
    check_prerequisites(selected_account)

    # add the scicrunch api key to the orthauth secrets yaml
    add_scicrunch_api_key(api_key, api_key_name)

    # add the scigraph path to the pyontutils config yaml
    add_scigraph_path(api_key_name)
