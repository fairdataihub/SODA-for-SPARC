from sparcur.paths import Path as SparCurPath
from .path_utils import get_home_directory, configpath
import os 
from configparser import ConfigParser
import yaml


sparc_organization_id = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"

# min template for orthauth config file
orthauth_path_secrets_min_template = {
    "pennsieve": {
        "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0": { 
             "key": "", 
             "secret": ""
            }
        },
    "scicrunch": {
        "api": None
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
        'scigraph-api-key': {
            'path': None
        },
        'scigraph-graphload': None,
        'scigraph-services': None,
        'zip-location': None
        }
    }

# config file locations
orthauth_path = SparCurPath(get_home_directory("orthauth")).expanduser()
orthauth_path_secrets = SparCurPath(get_home_directory("orthauth") + '/secrets.yaml').expanduser()
pyontutils_path = SparCurPath(get_home_directory("pyontutils")).expanduser()
pyontutils_path_config = SparCurPath(get_home_directory("pyontutils") + '/config.yaml').expanduser()

# Check that all the keys are accounted for
def check_prerequisites(ps_account):
    ## pyontutils config
    if not os.path.exists(pyontutils_path):
        pyontutils_path.mkdir(parents = True, exist_ok = True)

    # read the pyontutils config file
    with open(pyontutils_path_config) as file:
        config = yaml.full_load(file)

        # check if the (scigraph-api-key path => ) path exists and has a value
        if "auth-variables" in config:
            if "scigraph-api-key" in config["auth-variables"]:
                if config["auth-variables"]["scigraph-api-key"]["path"] != "":
                    # assume the scigraph-api-key path is valid
                    # store the path in the config object 
                    pyontutils_config["auth-variables"]["scigraph-api-key"]["path"] = config["auth-variables"]["scigraph-api-key"]["path"]


    with open(pyontutils_path_config, 'w') as file:
        yaml.dump(pyontutils_config, file)
    
    # orthauth config folder path
    if not os.path.exists(orthauth_path):
        orthauth_path.mkdir(parents = True, exist_ok = True)

    has_prereqs = [False, False]

    # Create yaml if doesn't exist
    if os.path.exists(orthauth_path_secrets):
        with open(orthauth_path_secrets) as file:
            yml_obj = yaml.full_load(file)

            if "pennsieve" in yml_obj:
                if sparc_organization_id in yml_obj["pennsieve"]:
                    if "key" in yml_obj["pennsieve"][sparc_organization_id]:
                        if "secret" in yml_obj["pennsieve"][sparc_organization_id]:
                            has_prereqs[0] = True
            
            if "scicrunch" in yml_obj:
                if "api" in yml_obj["scicrunch"]:
                    if yml_obj["scicrunch"]["api"] != "":
                        has_prereqs[1] = True

    
    if has_prereqs[0] and has_prereqs[1]:
        return "Valid"

    return add_orthauth_yaml(ps_account)



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

    # check if the ( scicrunch api key-name => ) path exists and has a value
    if os.path.exists(orthauth_path_secrets):
        with open(orthauth_path_secrets) as file:
            old_yml_obj = yaml.full_load(file)

            if "scicrunch" in old_yml_obj:
                if "api" in old_yml_obj["scicrunch"]:
                    if old_yml_obj["scicrunch"]["api"] != "":
                        # assume the api key and secret is valid
                        # store the scicrunch api key in the new secrets.yaml file
                        yml_obj["scicrunch"]["api"] = old_yml_obj["scicrunch"]["api"]
    
    
    # delete pre-existing file
    if os.path.exists(orthauth_path_secrets):
        os.remove(orthauth_path_secrets)

    # write yaml object to the secrets file.
    with open(orthauth_path_secrets, 'w') as file:
        yaml.dump(yml_obj, file)

    os.chmod(orthauth_path_secrets, 0o0600) # required for the validator

    return "Valid"



# adds the scigraph api key to the orthauth secrets.yaml file 
def add_scicrunch_api_key(api_key, api_key_name):
    with open(orthauth_path_secrets) as file:
        yml_obj = yaml.full_load(file)
        yml_obj["scicrunch"]["api"] = {api_key_name: api_key}



# adds the scigraph key name to the pyontutils config file
def add_scigraph_path(api_key_name):
    with open(pyontutils_path_config) as file:
        yml_obj = yaml.full_load(file)
        yml_obj["auth-variables"]["scigraph-api-key"]["path"]= f"scicrunch api {api_key_name}"