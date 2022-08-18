# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
import os
import os.path
from pathlib import Path
from urllib.error import HTTPError
import requests
import time 
import datetime
from flask import abort

from sparcur.utils import PennsieveId
from sparcur.simple.validate import main as validate

from errorHandlers import handle_http_error

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

from datasets import get_dataset_by_id


# for gevent
local_dataset_folder_path = ""
validation_json = {}


# an export stores which metadata files are present in the dataset 
# however they are named differently than our other lists of metadata files 
# NOTE: This list doesn't need to have - for now ( 08/17/2022 ) at least - performances, resources, or code_parameters 
# NOTE: manifest_files present in a dataset alone will not create a path_error_report. Meaning at least one of 
# the other metadata files need to be present in the dataset to have a useful validation report.
# TODO: This begs the question. If the manifest_file is not present in the dataset, but other metadata files are, will the path_error_report notify us of this so we can inform the user?
#       A: No, the path_error_report doesn't tell the user they need to have manifest files in the dataset. 
metadata_files = ["dataset_description_file", "samples_file", "subjects_file", "submission_file", "code_description_file"]

# retrieve the given dataset ID's export results; return to the user. 
# TODO: translate export results into a format that is easier to read
# TODO: Calibrate an ideal wait time if we keep one at all
def validate_dataset_pipeline(ps_account, ps_dataset_id):

    """
        Retrieves the given dataset's export results, if the export is valid and available within 1 minute of requesting the export.
        Valid exports come from datasets that have metadata files and have a timestamp matching the given Pennsieve dataset's 'updatedAt' timestamp.
    """

    # Constraints:
    #    - LATEST stores the export that completed after the most recent change in dataset.
    # Cases to handle: 
    #    - An export in LATEST has a timestamp that does not correspond to the updatedAt timestamp for the Pennsieve dataset.
    #    - An export does not exist at the time of requesting it.
    #    - The export is of a failed validation run.
    #    - An export is missing metadata files necessary to generate a path_error_report. 
    # NOTE: the code handles/will handle the above cases in this way:
    #    - to handle case one: ensure that #/meta/timestamp_updated matches the dataset updated time you see on the Pennsieve portal. Use a backoff to wait until they sync. [ Done ]
    #    - to handle case two: expect 404s until the export is ready. Use a backoff to wait until it is. [ Done ]
    #    - to handle case three: Tom will look into adding ways having the exports contain metdata that indicates if the export is a success or failure. For now not sure. [ TODO: WIP ]
    #    - to handle case four: Check if there are metadata files in the dataset. If not then alert the user validation can only be done with metadata files present. [ Done ]
    #    - to handle case five: If there is only a manifest file it will not generate a path_error_report ( TODO: Double check ) so if none of the listed metadata files 
    #      exist in the dataset then return back to the user they need metadta files to get a result. [ Done ]
        

    # get the timestamp for the latest change to the given pennsieve dataset
    updated_at_timestamp = get_dataset_by_id(ps_dataset_id)["content"]["updatedAt"]
    
    # 1. get the pennsieve export json file for the given dataset
    export_json = request_pennsieve_export(ps_dataset_id, updated_at_timestamp)

    # 2. check if the export was not available for retrieval yet even afer waiting for the current maximum wait time
    if export_json == None:
        abort(500, "We had trouble validating your dataset. Please try again. If the problem persists, please contact us at fairdataihub@gmail.com.")

    # 3. check if the export was a failed validation run TODO: discern between a failed validation run and a dataset with no metadata files
    # TODO: Check that all exports have an inputs. lol 
    inputs = export_json.get('inputs')

    # 3.1. check if there are any metadata files for the dataset
    if not dataset_has_metadata_files(inputs):
        abort(400, "Your dataset cannot be validated until you add metadata files. Please add metadata files and try again.")
    
    # 3.2. check if the export was a failed validation run TODO: eventually figure this out
    
    # 4. get the status of the export
    status = export_json.get('status')

    # 5. get the path error report from the status
    path_error_report = status.get('path_error_report')

    # 6. get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    return parse(path_error_report)


def dataset_has_metadata_files(inputs):
    return any(metadata_files_name in inputs for metadata_files_name in metadata_files) 


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

    print(path_error_report)

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


def request_pennsieve_export(ps_dataset_id, dataset_latest_updated_at_timestamp):
    """ 
    Retrieves the latest export for a particular users dataset, if available within 1 minute of
    requesting the export. 
    """

    # remove the N:dataset text from the UUID
    ps_dataset_id_trimmed = ps_dataset_id.replace("N:dataset:", "")

    backoff_time = 0
    while backoff_time <= 30:
        print("Trying to get the export...")
        # wait for the backoff time 
        time.sleep(backoff_time)

        try:
            # retrieve the exports json file for the given dataset
            r = requests.get(f"https://cassava.ucsd.edu/sparc/datasets/{ps_dataset_id_trimmed}/LATEST/curation-export.json")

            r.raise_for_status()

            export_json = r.json()

            # check if the LATEST export file is the one corresponding to the most recent change in the dataset
            if verified_latest_export(export_json, dataset_latest_updated_at_timestamp):
                print("They are the same!")
                return export_json

        except requests.exceptions.HTTPError as e:
            print(f"HTTPError: {e}")
            # if on the last request and we get an HTTP error show the user the error
            if backoff_time >= 30:
                return handle_http_error(e)
        
        # update the backoff time for the next request - we want 10, 20, 30 for a total of about a minute max wait time
        backoff_time += 10 

    # there is no pennsieve export for the given dataset; or there is not one that matches the most recent change in the dataset
    return None


def verified_latest_export(export_json, dataset_latest_updated_at_timestamp):
    """
    Check if the LATEST export 'timestamp_updated' property matches the corresponding property on the given Pennsieve dataset.
    If not this means we need to wait longer before the export corresponding to the most recent modification on the given dataset is available.
    In short, LATEST isn't really LATEST until its 'timestamp_updated' timestamp matches the Pennsieve 'updated_at' timestamp.
    """

    # get the meta object from the export json file
    meta = export_json.get('meta')

    # get the timestamp_updated property from the meta object
    timestamp_updated = meta.get('timestamp_updated')

    print(f"export timestamp: {timestamp_updated}")
    print(f"dataset timestamp: {dataset_latest_updated_at_timestamp}")

    return utc_timestamp_strings_match(timestamp_updated, dataset_latest_updated_at_timestamp)




def utc_timestamp_strings_match(sparc_export_time, pennsieve_export_time):
    """
    Compares utc timestamps that are currently in string representation against each other.
    Returns True if they represent the same time, False if they do not.
    constraints: timezones match this format 'yyyy-mm-ddThh:mm:ss.sssZ' where sss =  up to 6 digits of milliseconds
    """

    # replace sparc export ',' with a '.'
    sparc_export_time = sparc_export_time.replace(",", ".")

    # remove the milliseconds and Zulu timezone from the sparc export time
    sparc_export_time = sparc_export_time.split(".")[0]
    pennsieve_export_time = pennsieve_export_time.split(".")[0]

    # convert the timezone strings to datetime objects
    setdtime = datetime.datetime.strptime(sparc_export_time, "%Y-%m-%dT%H:%M:%S")
    getdtime = datetime.datetime.strptime(pennsieve_export_time, "%Y-%m-%dT%H:%M:%S")

    print(f"setdtime: {setdtime}")
    print(f"getdtime: {getdtime}")

    print(f"setdtime.tzinfo: {setdtime.date()}")
    print(f"setdtime.tzinfo: {setdtime.time()}")

    print(f"getdtime: {getdtime.date()}")
    print(f"getdtime: {getdtime.time()}")

    # compare the two times
    return setdtime.date() == getdtime.date() and setdtime.time() == getdtime.time()

