# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
import requests
import time 
from sparcur.simple.validate import main as validate
from errorHandlers import handle_http_error
from .validatorUtils import ( 
    parse, 
    create_normalized_ds_path,
    verified_latest_export,
    validate_validation_result
)
from datasets import get_dataset_by_id


# TODO: translate export results into a format that is easier to read
# TODO: Calibrate an ideal wait time if we keep one at all
def validate_pennsieve_dataset_pipeline(ps_dataset_id):

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
        

    # get the timestamp marking the latest change made to the given pennsieve dataset
    updated_at_timestamp = get_dataset_by_id(ps_dataset_id)["content"]["updatedAt"]
    
    # 1. get the pennsieve export object for the given dataset
    export = request_pennsieve_export(ps_dataset_id, updated_at_timestamp)

    # 2. validate the export
    validate_validation_result(export)
    
    # 3. get the status of the export
    status = export.get('status')

    # 4. get the path error report from the status
    path_error_report = status.get('path_error_report')

    # 5. get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    return parse(path_error_report)

def request_pennsieve_export(ps_dataset_id, dataset_latest_updated_at_timestamp):
    """ 
    Retrieves the latest export for a particular users dataset, if available within 1 minute of
    requesting the export. 
    """

    # remove the N:dataset text from the UUID
    ps_dataset_id_trimmed = ps_dataset_id.replace("N:dataset:", "")

    for backoff_time in range(0, 51, 10):
        # wait for the backoff time 
        time.sleep(backoff_time)

        try:
            # retrieve the exports json file for the given dataset
            r = requests.get(f"https://cassava.ucsd.edu/sparc/datasets/{ps_dataset_id_trimmed}/LATEST/curation-export.json")

            r.raise_for_status()

            export = r.json()

            # check if the LATEST export file is the one corresponding to the most recent change in the dataset
            if verified_latest_export(export, dataset_latest_updated_at_timestamp):
                return export

        except requests.exceptions.HTTPError as e:
            # if on the last request and we get an HTTP error show the user the error
            if backoff_time == 50:
                return handle_http_error(e)

    # a pennsieve export for the given dataset does not exist yet; or there is not one that matches the most recent change in the dataset
    return None

def validate_local_dataset_pipeline(ds_path):

    norm_ds_path = create_normalized_ds_path(ds_path)

    # validate the dataset
    blob = validate(norm_ds_path)

    validate_validation_result(blob)

    # peel out the status object 
    status = blob.get('status')

    # peel out the path_error_report object
    path_error_report = status.get('path_error_report')

    # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    return parse(path_error_report)






