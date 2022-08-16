# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
import os
import os.path
from pathlib import Path
from urllib.error import HTTPError
import requests
import time 
import datetime

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


# for gevent
local_dataset_folder_path = ""
validation_json = {}


# retrieve the given dataset ID's export results; return to the user. 
# TODO: translate export results into a format that is easier to read
def validate_dataset_pipeline(ps_account, ps_dataset):
    # Basic flow. 
    # Assumes LATEST stores the export that completed after the most recent change in dataset permissions. 
    # Assumes there is an export ready to be retrieved and that we do not have to wait if this is generating a users first export.
    # Assumes the export is not of a failed validation run
    # Assumes the export is created on a dataset that has metadata files
    # TODO: handle edge cases
    #    - to handle case one: ensure that #/meta/timestamp_updated matches the dataset updated time you see on the Pennsieve portal.
    #    - to handle case two: expect 404s until the export is ready.  [ Done ]
    #    - to handle case three: Tom will look into adding ways having the exports contain metdata that indicates if the export is a success or failure. For now not sure.
    #    - to handle case four: Check if there are metadata files in the dataset. If not then alert the user validation can only be done with metadata files present.


    # remove the N:dataset text from the UUID
    ps_dataset_trimmed = ps_dataset.replace("N:dataset:", "")
        
    # 1. get the pennsieve export json file for the given dataset
    export_json = request_pennsieve_export(ps_dataset_trimmed)

    # 2. get the status of the export
    status = export_json.get('status')

    if "path_error_report" not in status:
        return "Cannot validate this dataset. No metadata files present?"

    # 3. get the path error report from the status
    path_error_report = status.get('path_error_report')

    # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    return parse(path_error_report)



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


# retrieves the latest export for a particular users dataset, if avaialble within 1 minute of
# requesting the export. 
def request_pennsieve_export(trimmed_dataset_id): 
    backoff_time = 0
    while backoff_time <= 30:
        print("Trying to get the export...")
        # wait for the backoff time 
        time.sleep(backoff_time)

        try:
            # 1. retrieve the exports json file for the given dataset
            r = requests.get(f"https://cassava.ucsd.edu/sparc/datasets/{trimmed_dataset_id}/LATEST/curation-export.json")

            r.raise_for_status()

            # TODO: check that there is no issue that will require re-running the request
            return r.json()

        except requests.exceptions.HTTPError as e:
            print(f"HTTPError: {e}")
            # if on the last request and we get an HTTP error show the user the error
            if backoff_time >= 30:
                return handle_http_error(e)
        
        # update the backoff time for the next request - we want 10, 20, 30 for a total of about a minute max wait time
        backoff_time += 10 



def utc_timestamp_strings_match(sparc_export_time, pennsieve_export_time):
    """
    compare the 'timestamp_updated' property retrieved from the export json file with the 'updated_at' timestamp of the Pennsieve dataset.
    True if they match, False if they do not match.
    constraints: timezones match this format 'yyyy-mm-ddThh:mm:ss.sssZ' where sss =  up to 6 digits of milliseconds
    """

    # replace sparc export ',' with a '.'
    sparc_export_time = sparc_export_time.replace(",", ".")

    # convert the timezone strings to datetime objects
    setdtime = datetime.datetime.strptime(sparc_export_time, "%Y-%m-%dT%H:%M:%S.%fZ")
    getdtime = datetime.datetime.strptime(pennsieve_export_time, "%Y-%m-%dT%H:%M:%S.%fZ")

    # compare the two times
    return setdtime == getdtime

