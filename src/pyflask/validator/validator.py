# -*- coding: utf-8 -*-
# from gevent import monkey; monkey.patch_all(ssl=False)
from sparcur.paths import Path as SparCurPath
from sparcur.utils import PennsieveId
from sparcur.simple.validate import main as validate
from sparcur.simple.retrieve import main as retrieve
from configparser import ConfigParser
import gevent
import os
import os.path
import sys
import shutil
import yaml
from pathlib import Path
from .validatorUtils import parse

userpath = os.path.expanduser("~")
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')
sodavalidatorpath = os.path.join(userpath, 'SODA', 'SODA_Validator_Dataset')


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

# This pipeline first retrieves a datset to a local folder 
# and then validates the local dataset
def validate_dataset_pipeline(ps_account, ps_dataset):
    # return
    # global local_dataset_folder_path
    # global validation_json

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

    # local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    

    # def temp_retrieve_function(sparc_dataset, organization, parent_folder):
    #     global local_dataset_folder_path
    #     gevent.sleep(0)
    #     local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    #     gevent.sleep(0)
    
    # gev = []
    # try:
    #     # retrieve the dataset from Pennsive. --check for heartbeat errors here
    #     if organization != "" and sparc_dataset != "":
    #         gevent.sleep(0)
    #         gev.append(gevent.spawn(temp_retrieve_function, sparc_dataset, organization, parent_folder))
    #         gevent.sleep(0)
    #         gevent.joinall(gev) 
    #         gevent.sleep(0)
    #         try:
    #             gev[0].get()
    #         except Exception as e:
    #             raise e
    #     else:
    #         raise Exception("Retrieve Errror")
    # except Exception as e:
    #     raise e

    validation_json = {}
    validation_json = validate(local_dataset_folder_path)


    # def temp_validate_function(local_dataset_folder_path):
    #     global validation_json
    #     gevent.sleep(0)
    #     validation_json = validate(local_dataset_folder_path)
    #     gevent.sleep(0)

    # local_dataset_folder_path = r"/home/dev/files/sparc-datasets/2f4afec4-6e4d-4c20-b913-8e115fc8631b/Acute effects of gastric electrical stimulation (GES) settings on neural activity accessed with functional magnetic resonance maging (fMRI) in rats"

    # try:
    #     gevent.sleep(0)
    #     gev.append(gevent.spawn(temp_validate_function, local_dataset_folder_path))
    #     gevent.sleep(0)
    #     gevent.joinall(gev) 
    #     gevent.sleep(0)
    #     try:
    #         gev[0].get()
    #     except Exception as e:
    #         raise e
    # except Exception as e:
    #     raise e

    try:
        path_error_report = validation_json["status"]["path_error_report"]
    except Exception as e:
        path_error_report = validation_json["status"]

    # path_error_report = validation_json["status"]["path_error_report"]
    # path_error_report = {}
    # blob = json.dumps(validation_json, indent=4, sort_keys=True, default=str)

    # Delete the local dataset. 
    # FUTURE: Look into setting an expiration date for this one.
    dir_path = SparCurPath(local_sparc_dataset_location + '/' + sparc_dataset_uuid).expanduser()
    try:
        shutil.rmtree(dir_path)
    except OSError as e:
        # no folder present
        print("Error: %s : %s" % (dir_path, e.strerror))

    # return the error report. We can deal with the validation on the front end.
    return path_error_report

    # global local_dataset_folder_path
    # global validation_json

    # check_prerequisites(ps_account)

    # sparc_dataset_id = ps_dataset
    # sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")

    # try:
    #     organization = PennsieveId(sparc_organization_id)
    #     sparc_dataset = PennsieveId(sparc_dataset_id)
    # except Exception as e:
    #     raise e

    # # create dataset folder for the retrieve
    # if not os.path.exists(parent_folder):
    #     parent_folder.mkdir(parents = True, exist_ok = True)

    # def temp_retrieve_function(sparc_dataset, organization, parent_folder):
    #     global local_dataset_folder_path
    #     local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    #     return
    
    # gev = []
    # try:
    #     # retrieve the dataset from Pennsive. --check for heartbeat errors here
    #     if organization != "" and sparc_dataset != "":
    #         gevent.sleep(0)
    #         # gev.append(gevent.spawn(temp_retrieve_function, sparc_dataset, organization, parent_folder))
    #         local_dataset_folder_path = retrieve(id = sparc_dataset, dataset_id = sparc_dataset, project_id = organization, parent_parent_path = parent_folder)
    #         # gevent.sleep(0)
    #         # gevent.joinall(gev) 
    #         # gevent.sleep(0)
    #         # try:
    #         #     gev[0].get()
    #         # except Exception as e:
    #         #     raise e
    #     else:
    #         raise Exception("Retrieve Errror")

    #     return str(local_dataset_folder_path)
    # except Exception as e:
    #     raise e









def val_dataset_pipeline(ps_account, ps_dataset):
    global validation_json

    # sparc_dataset_id = ps_dataset
    # sparc_dataset_uuid = sparc_dataset_id.replace("N:dataset:", "")

    validation_json = {}
    def temp_validate_function(local_dataset_folder):
        global validation_json
        # validation_json = validate(local_dataset_folder)

    # local_dataset_folder_path = r"/home/dev/files/sparc-datasets/2f4afec4-6e4d-4c20-b913-8e115fc8631b/Acute effects of gastric electrical stimulation (GES) settings on neural activity accessed with functional magnetic resonance maging (fMRI) in rats"
    gev = []
    try:
        gevent.sleep(0)
        gev.append(gevent.spawn(temp_validate_function, Path(sodavalidatorpath)))
        # validation_json = validate(local_dataset_folder_path)
        gevent.sleep(0)
        gevent.joinall(gev) 
        # gevent.sleep(0)
        try:
            gev[0].get()
        except Exception as e:
            raise e
    except Exception as e:
        raise e

    try:
        path_error_report = validation_json["status"]["path_error_report"]
    except Exception as e:
        path_error_report = validation_json["status"]
    # path_error_report = {}
    # blob = json.dumps(validation_json, indent=4, sort_keys=True, default=str)

    # dir_path = Path(sodavalidatorpath)
    # try:
    #     shutil.rmtree(dir_path)
    # except OSError as e:
    #     # no folder present
    #     print("Error: %s : %s" % (dir_path, e.strerror))

    # Delete the local dataset. 
    # FUTURE: Look into setting an expiration date for this one.
    # dir_path = SparCurPath(local_sparc_dataset_location + '/' + sparc_dataset_uuid).expanduser()
    # try:
    #     shutil.rmtree(dir_path)
    # except OSError as e:
    #     # no folder present
    #     print("Error: %s : %s" % (dir_path, e.strerror))

    # return the error report. We can deal with the validation on the front end.
    return path_error_report