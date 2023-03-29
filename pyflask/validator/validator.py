# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
from flask_restx import abort
from sparcur.paths import Path as SparCurPath
from sparcur.simple.validate import main as validate
from configparser import ConfigParser
import os
import os.path
import sys
import yaml
from pathlib import Path
from .validatorUtils import parse

userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')
sodavalidatorpath = os.path.join(userpath, 'SODA', 'SODA_Validator_Dataset')



def has_required_metadata_files(ds_path):
    """
    Checks that the dataset has the required metadata files. These are: dataset_description.xlsx, 
    subjects.xlsx, samples.xlsx, and submission.xlsx. 
    """

    REQUIRED_METADATA_FILES = {
        "submission": False, 
        "dataset_description": False,
        "subjects": False,
        "samples": False,
    }

    EXTENSIONS = [".xlsx", ".csv", ".json"]

    # read the files at the top level directory at the given path 
    files = os.listdir(os.path.join(userpath, ds_path.strip()))

    for file in files:
        if file in REQUIRED_METADATA_FILES and Path(file).suffix in EXTENSIONS:
            REQUIRED_METADATA_FILES[file] = True
            

    # return True if all the required metadata files are present
    return all(REQUIRED_METADATA_FILES.values())

def create_validation_error_message(base_message, ds_path):
    error_message = base_message
    if not has_required_metadata_files(ds_path):
        error_message += "Please make sure that you have the required metadata files in your dataset."
    error_message += f"To view the raw report, please see the validation.json file in your SODA folder at {userpath}/SODA/validation.json"
    return error_message

def get_home_directory(folder):
    if sys.platform == "win32":
        return str(Path.home()) + "/AppData/Local/" + folder
    elif sys.platform == "linux":
        return str(Path.home()) + "/.config/" + folder
    elif sys.platform == "darwin":
        return str(Path.home()) + "/AppData/Local/" + folder 


# validate a local dataset at the target directory 
def val_dataset_local_pipeline(ds_path):
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

    # write the blob to a file for the user to view if they would like
    with open(f'{userpath}/SODA/validation.json', "w") as file:
        file.write(str(blob))

    if 'status' not in blob or 'path_error_report' not in blob['status']:
        msg = create_validation_error_message(
            "Incomplete validation. Cannot give a cleaned report.",
            ds_path,
        )
        abort(400, msg)
    # peel out the status object 
    status = blob.get('status')

    # peel out the path_error_report object
    path_error_report = status.get('path_error_report')

    # get the errors out of the report that do not have errors in their subpaths (see function comments for the explanation)
    parsed_path_error_report = parse(path_error_report)

    return parsed_path_error_report



local_sparc_dataset_location = str(Path.home()) + "/files/sparc-datasets"
sparc_organization_id = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"
parent_folder = SparCurPath(local_sparc_dataset_location).expanduser()


# for gevent
local_dataset_folder_path = ""
validation_json = {}

# config file locations
orthauth_path = SparCurPath(get_home_directory("orthauth")).expanduser()
orthauth_path_secrets = SparCurPath(get_home_directory("orthauth") + '/secrets.yaml').expanduser()
pyontutils_path = SparCurPath(get_home_directory("pyontutils")).expanduser()
pyontutils_path_config = SparCurPath(get_home_directory("pyontutils") + '/config.yaml').expanduser()

# min template for orthauth config file
orthauth_path_secrets_min_template = {
    "pennsieve": {
        "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0": { 
             "key": "", 
             "secret": ""
            }
        }
    }

# min template for pyontutils config file
pyontutils_config = {
    'auth-stores': {
        'secrets': {
            'path': '{:user-config-path}/orthauth/secrets.yaml'
            }
        },
    'auth-variables': {
        'curies': None,
        'git-local-base': None,
        'git-remote-base': None,
        'google-api-creds-file': None,
        'google-api-service-account-file': None,
        'google-api-store-file': None,
        'google-api-store-file-readonly': None,
        'nifstd-checkout-ok': None,
        'ontology-local-repo': None,
        'ontology-org': None,
        'ontology-repo': None,
        'patch-config': None,
        'resources': None,
        'scigraph-api': "https://scigraph.olympiangods.org/scigraph",
        'scigraph-api-key': None,
        'scigraph-graphload': None,
        'scigraph-services': None,
        'zip-location': None
        }
    }

# If orthauth yaml file doesn't exist, or isn't valid
# delete it and create a fresh copy with the specified Pennsieve account
def add_orthauth_yaml(ps_account):
    os.chmod(orthauth_path, 0o0700) # might not be required

    config = ConfigParser()
    if os.path.exists(configpath):
        config.read(configpath)

    yml_obj = orthauth_path_secrets_min_template.copy()

    yml_obj["pennsieve"][sparc_organization_id]["key"] = config[ps_account]["api_token"]
    yml_obj["pennsieve"][sparc_organization_id]["secret"] = config[ps_account]["api_secret"]

    # delete pre-existing file
    if os.path.exists(orthauth_path_secrets):
        os.remove(orthauth_path_secrets)

    # write yaml object to the secrets file.
    with open(orthauth_path_secrets, 'w') as file:
        yaml.dump(yml_obj, file)

    os.chmod(orthauth_path_secrets, 0o0600) # required for the validator

    return "Valid"

# Check that all the keys are accounted for
def check_prerequisites(ps_account):
    ## pyontutils config
    if not os.path.exists(pyontutils_path):
        pyontutils_path.mkdir(parents = True, exist_ok = True)

    with open(pyontutils_path_config, 'w') as file:
        yaml.dump(pyontutils_config, file)
    
    # orthauth config folder path
    if not os.path.exists(orthauth_path):
        orthauth_path.mkdir(parents = True, exist_ok = True)

    # Create yaml if doesn't exist
    if os.path.exists(orthauth_path_secrets):
        with open(orthauth_path_secrets) as file:
            yml_obj = yaml.full_load(file)

            if "pennsieve" in yml_obj:
                if sparc_organization_id in yml_obj["pennsieve"]:
                    if "key" in yml_obj["pennsieve"][sparc_organization_id]:
                        if "secret" in yml_obj["pennsieve"][sparc_organization_id]:
                            return "Valid"

    return add_orthauth_yaml(ps_account)

