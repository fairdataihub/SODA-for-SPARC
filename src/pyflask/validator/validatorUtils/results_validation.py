from flask import abort


# an export stores which metadata files are present in the dataset 
# however they are named differently than our other lists of metadata files 
# NOTE: This list doesn't need to have - for now ( 08/17/2022 ) at least - performances, resources, or code_parameters 
# NOTE: manifest_files present in a dataset alone will not create a path_error_report. Meaning at least one of 
# the other metadata files need to be present in the dataset to have a useful validation report.
# TODO: This begs the question. If the manifest_file is not present in the dataset, but other metadata files are, will the path_error_report notify us of this so we can inform the user?
#       A: No, the path_error_report doesn't tell the user they need to have manifest files in the dataset. 
metadata_files = ["dataset_description_file", "samples_file", "subjects_file", "submission_file", "code_description_file"]


def validate_validation_result(export):
    """
        Verifies the integriy of an export retrieved from remote or generated locally.
        Input: export - A dictionary with sparcur.simple.validate or remote validation results.
    """
    # 1. check if the export was not available for retrieval yet even afer waiting for the current maximum wait time
    if export is None:
        abort(500, "We had trouble validating your dataset. Please try again. If the problem persists, please contact us at fairdataihub@gmail.com.")

    # 2. check if the export was a failed validation run TODO: discern between a failed validation run and a dataset with no metadata files 
    inputs = export.get('inputs')

    # NOTE: May not be possible to be None but just in case
    if inputs is None:
        abort(500, "We had trouble validating your dataset. Please try again. If the problem persists, please contact us at.")

    # 2.1. check if there are any metadata files for the dataset
    if not dataset_has_metadata_files(inputs):
        abort(400, "Your dataset cannot be validated until you add metadata files. Please add metadata files and try again.")
    
    # 2.2. check if the export was a failed validation run TODO: eventually figure this out
    print("TODO")

def dataset_has_metadata_files(inputs):
    return any(metadata_files_name in inputs for metadata_files_name in metadata_files)