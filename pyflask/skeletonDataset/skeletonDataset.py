"""
Given a sodaJSONObject dataset-structure key, create a skeleton of the dataset structure on the user's filesystem. 
Then pass the path to the skeleton to the validator.
Works within Organize Datasets to allow a user to validate their dataset before uploading it to Pennsieve/Generating it locally.
"""

import os
import shutil
from xml.dom import InvalidStateErr
import copy
import time
from os.path import expanduser
from .skeletonDatasetUtils import import_bf_metadata_files_skeleton, import_manifest_files_skeleton, import_bf_metadata_files_skeleton_base
from pennsieve2.pennsieve import Pennsieve
import pandas as pd 
from prepareMetadata import save_submission_file, save_subjects_file, save_samples_file, save_ds_description_file, upload_RC_file
from namespaces import NamespaceEnum, get_namespace_logger



path = os.path.join(expanduser("~"), "SODA", "skeleton")

#import the namespace_logger 
namespace_logger = get_namespace_logger(NamespaceEnum.SKELETON_DATASET)


def create_skeleton(dataset_structure, path):
    """
    Create a skeleton of the dataset structure on the user's filesystem.
    """
    for folder in dataset_structure["folders"]:
        dp = (os.path.join(path, folder)) 
        if not os.path.exists(dp):
            os.mkdir(dp)

        create_skeleton(dataset_structure["folders"][folder], os.path.join(path, folder))
    for file_key in dataset_structure["files"]:
        # TODO: If the type is bf then create a generic file with the name of the file key ( and write information to it )
        # if dataset_structure["files"][file_key]["type"] in ["bf"]:
        #     continue
            
        with open(os.path.join(path, file_key), "w") as f:
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

def create(soda_json_structure):
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

    # if validating for a local dataset pull the metadata files from their source destination into the skeleton directory
    if soda_json_structure["starting-point"]["type"] != "bf":
       for _, file_properties in soda_json_structure["metadata-files"].items():
          print(file_properties)
          shutil.copy(file_properties["path"] , path)
          print("asd")
          
    else:
      ps = Pennsieve()

      import_bf_metadata_files_skeleton_base(soda_json_structure["bf-dataset-selected"]["dataset-name"] , ps)

    get_manifests_base(soda_json_structure)

    return {"path_to_skeleton_dataset": path}


def createGuidedMode(soda_json_structure):
  dataset_structure = soda_json_structure["saved-datset-structure-json-obj"]

  path = os.path.join(expanduser("~"), "SODA", "skeleton")

  # check if the skeleton directory exists
  if os.path.exists(path):
      # remove the non-empty skeleton directory
      shutil.rmtree(path)

  # create a folder to hold the skeleton
  os.mkdir(path)

  create_skeleton(dataset_structure, path)

  # create metadata files
  create_metadata_files(soda_json_structure, path)

  # copy the manifest files from the guided mode directory to the skeleton directory 
  guided_manifest_files = os.path.join(expanduser("~"), "SODA", "guided_manifest_files")
  for folder in dataset_structure["folders"].keys():
     guided_manifest_files_high_level_dir = os.path.join(guided_manifest_files, folder)
     if os.path.exists(guided_manifest_files_high_level_dir):
        manifest_path = os.path.join(guided_manifest_files_high_level_dir, "manifest.xlsx")
        manifest_path_destination = os.path.join(path, folder)
        shutil.copy(manifest_path, manifest_path_destination)


  return {"path_to_skeleton_dataset": path}


def create_metadata_files(dataset_structure, path):
    # get the table data for subjects and samples 
    subject_table_data = dataset_structure["subjects-table-data"]
    samples_table_data = dataset_structure["samples-table-data"]

    if len(subject_table_data) > 0:
      save_subjects_file(False, None, None, path + "/subjects.xlsx", subject_table_data)
    if len(samples_table_data) > 0:
      save_samples_file(False, None, None, path + "/samples.xlsx", samples_table_data)

    guidedSparcAward = dataset_structure["dataset-metadata"]["shared-metadata"]["sparc-award"];
    guidedMilestones = dataset_structure["dataset-metadata"]["submission-metadata"]["milestones"];
    guidedCompletionDate = dataset_structure["dataset-metadata"]["submission-metadata"]["completion-date"];
    guidedSubmissionMetadataJSON = [{
       "award": guidedSparcAward,
       "date": guidedCompletionDate,
       "milestone": guidedMilestones[0],
    }]
    guidedSubmissionMetadataJSON.extend(
        {
            "award": "",
            "date": "",
            "milestone": milestone,
        }
        for milestone in guidedMilestones
    )
    save_submission_file(False, None, None, path + "/submission.xlsx", guidedSubmissionMetadataJSON)

    # dataset description 
    guidedDatasetInformation = dataset_structure["dataset-metadata"]["description-metadata"]["dataset-information"];

    guidedStudyInformation = dataset_structure["dataset-metadata"]["description-metadata"]["study-information"];

    guidedContributorInformation = dataset_structure["dataset-metadata"]["description-metadata"]["contributor-information"]
    
    if guidedSparcAward not in guidedContributorInformation["funding"]:
      guidedContributorInformation["funding"].insert(0, guidedSparcAward);
  
    contributors = dataset_structure["dataset-metadata"]["description-metadata"]["contributors"];

    guidedContributorInformation["contributors"] = [
      {
        "conAffliation": ', '.join(contributor["conAffliation"]),
        "conID": contributor["conID"],
        "conName": contributor["conName"],
        "conRole": ', '.join(contributor["conRole"]),
        "contributorFirstName": contributor["contributorFirstName"],
        "contributorLastName": contributor["contributorLastName"],
      } for contributor in contributors ]
    

    guidedAdditionalLinks = dataset_structure["dataset-metadata"]["description-metadata"]["additional-links"];
    guidedProtocols = dataset_structure["dataset-metadata"]["description-metadata"]["protocols"];
    allDatasetLinks = guidedAdditionalLinks + guidedProtocols

    save_ds_description_file(False, None, None, path + "/dataset_description.xlsx", guidedDatasetInformation, guidedStudyInformation, guidedContributorInformation, allDatasetLinks)

    ## README and CHANGES Metadata variables
    guidedReadMeMetadata = dataset_structure["dataset-metadata"]["README"];
    guidedChangesMetadata = dataset_structure["dataset-metadata"]["CHANGES"];

    # create text file called readme.txt in skeleton directory 
    file_path = os.path.join(path, "README.txt")

    with open(file_path, "w") as f:
        f.write(guidedReadMeMetadata)

    file_path = os.path.join(path, "CHANGES.txt")
    if len(guidedChangesMetadata) > 0:
       with open(file_path, "w") as f:
          f.write(guidedChangesMetadata)


    ## TODO: Code description
    # if (fs.existsSync(sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"])) {
    #     let codeDescriptionRes = await guidedUploadCodeDescriptionMetadata(
    #       guidedBfAccount,
    #       guidedDatasetName,
    #       sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]
    #     );
    #   }



def get_manifests_base(soda_json_structure):
    # Add the manifest files to the high level folders of the skeleton dataset
    if ("manifest-files" in soda_json_structure and "auto-generated" in soda_json_structure["manifest-files"]):
        # auto gen'd was selected so gather the paths for the high lvl folders
        for high_lvl_folder in soda_json_structure["dataset-structure"]["folders"].keys():
          #for free form mode we will get manifest files from ~/SODA/manifest_files/<high_lvl_folder_name>
          manifest_location = os.path.join(expanduser("~"), "SODA", "manifest_files", high_lvl_folder, "manifest.xlsx")
          if os.path.exists(manifest_location):
            # copy this into the skeleton dataset directory 
            shutil.copy(manifest_location, os.path.join(path, high_lvl_folder, "manifest.xlsx"))


def get_manifests(soda_json_structure):
    manifests = {}
      # Add the manifest files to the high level folders of the skeleton dataset
    if ("manifest-files" in soda_json_structure and "auto-generated" in soda_json_structure["manifest-files"]):
        # auto gen'd was selected so gather the paths for the high lvl folders
        for high_lvl_folder in soda_json_structure["dataset-structure"]["folders"].keys():
          #for free form mode we will get manifest files from ~/SODA/manifest_files/<high_lvl_folder_name>
          manifest_location = os.path.join(expanduser("~"), "SODA", "manifest_files", high_lvl_folder, "manifest.xlsx")
          if os.path.exists(manifest_location):
            df = pd.read_excel(manifest_location)
            manifests[high_lvl_folder] = df.to_json()

    return manifests


def get_metadata_files_json(soda_json_structure):
    metadata_files = {}
    # Add the metadata files to the root of the skeleton dataset
    if "metadata-files" in soda_json_structure:
        for metadata_file_name, props in soda_json_structure["metadata-files"].items():
            if props["type"] == "bf": 
                selected_dataset = soda_json_structure["bf-dataset-selected"]["dataset-name"]
                ps = Pennsieve()
                # TODO: Update the import xlsx funcs to use the new func that avoids SSL errors
                import_bf_metadata_files_skeleton(selected_dataset, ps, metadata_files)
            else:
                # get the file location from the user's computer
                file_location = props["path"]
                # if file name is not readme or changes
                if metadata_file_name in ["README.txt", "CHANGES.txt"]:
                    # read the file and add it to the metadata_files dict
                    with open(file_location, "r") as f:
                        metadata_files[metadata_file_name] = f.read()
                else:
                  df = pd.read_excel(file_location)
                  metadata_files[metadata_file_name] = df.to_json()

    return metadata_files



    