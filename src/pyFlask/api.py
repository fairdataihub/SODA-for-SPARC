from pint import get_application_registry
import werkzeug
from validator import val_dataset_local_pipeline
from flask import Flask, jsonify, request, json
import os.path
from os.path import expanduser
# from organize_datasets import ps_retrieve_dataset
from sparcur.simple.validate import main as validate
from sparcur.simple.retrieve import main as retrieve
from pathlib import Path
from sparcur.config import auth
from sparcur.simple.utils import backend_pennsieve
# project_id = auth.get('remote-organization')
userpath = expanduser("~")
from sparcur.config import auth
from sparcur.simple.utils import backend_pennsieve
from sparcur.paths import Path as SparCurPath
from configparser import ConfigParser
import sys
import yaml
from sparcur.utils import PennsieveId
import subprocess

from json import JSONEncoder
from collections import deque

class DequeEncoder(JSONEncoder):
    def default(self, obj):
       if isinstance(obj, deque):
          return list(obj)
       return JSONEncoder.default(self, obj)

app = Flask(__name__)

@app.route("/")
def hello_world():
    return jsonify("Hello world")


@app.route("/api_validate_pennsieve_dataset")
def api_ps_retrieve_dataset():
    check_prerequisites("SODA-Pennsieve")

    p = PennsieveId('N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0')
    d = PennsieveId('N:dataset:ada590fe-3556-4fa4-8476-0f085a00d781')
    ppp = Path('~/temp-datasets').expanduser().resolve()

    local_dataset = retrieve(id=d, dataset_id=d, project_id=p, parent_parent_path=ppp)

    return "SHSAD"

    #blob = validate(Path(local_dataset))

    #status = blob.get('status')

    # peel out the path_error_report object
    #path_error_report = status.get('path_error_report')

    #path_error_report = json.dumps(path_error_report, indent=4, default=str)

    #return path_error_report


@app.route("/api_validate_dataset_pipeline")
@app.errorhandler(werkzeug.exceptions.BadRequest)
def api_validate_dataset_pipeline():

    # get the dataset relative path
    ds_path = request.args.get("dataset-path")

    validation_errors = None 
    try:
        # validate and get dictionary back
        validation_errors = val_dataset_local_pipeline(ds_path)
        
    except Exception as e:
        if type(e).__name__ == "OSError":
            return str(e), 400
        # currently the validator throws a name error
        # do nothing as validation still works
        elif type(e).__name__ == "NameError":
            pass
        else:
            return "An error occurred while validating your dataset", 500

    # convert to JSON
    validation_errors = json.dumps(validation_errors, indent=4, default=str)

    return validation_errors



def get_home_directory(folder):
    if sys.platform == "win32":
        return str(Path.home()) + "/AppData/Local/" + folder
    elif sys.platform == "linux":
        return str(Path.home()) + "/.config/" + folder
    elif sys.platform == "darwin":
        return str(Path.home()) + "/AppData/Local/" + folder

orthauth_path = SparCurPath(get_home_directory("orthauth")).expanduser()
orthauth_path_secrets = SparCurPath(get_home_directory("orthauth") + '/secrets.yaml').expanduser()
configpath = os.path.join(userpath, '.pennsieve', 'config.ini')
sparc_organization_id = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"

pyontutils_path = SparCurPath(get_home_directory("pyontutils")).expanduser()
pyontutils_path_config = SparCurPath(get_home_directory("pyontutils") + '/config.yaml').expanduser()
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

# min template for orthauth config file
orthauth_path_secrets_min_template = {
    "pennsieve": {
        "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0": { 
             "key": "", 
             "secret": ""
            }
        }
    }


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


# hardcode for now 
path_source_dir =  "C:\\Users\\CMarroquin\\temp-datasets"  # Path('~/temp-datasets').expanduser().resolve()

print(dir(path_source_dir))


def argv_simple_retrieve(dataset_id):
    return [
        sys.executable,
        '-m',
        'sparcur.simple.retrieve',
        '--sparse-limit',
        '-1',
        '--dataset-id',
        dataset_id,
        '--parent-parent-path',
        path_source_dir]


argv_spc_find_meta = [
    sys.executable,
    '-m',
    'sparcur.cli',
    "find",
    "--name", "*.xlsx",
    "--name", "*.xml",
    "--name", "submission*",
    "--name", "code_description*",
    "--name", "dataset_description*",
    "--name", "subjects*",
    "--name", "samples*",
    "--name", "manifest*",
    "--name", "resources*",
    "--name", "README*",
    '--no-network',
    "--limit", "-1",
    "--fetch"]

argv_spc_export = [
    sys.executable,
    '-m',
    'sparcur.cli',
    'export',
    '--no-network']


# dataset_id = "N:dataset:ada590fe-3556-4fa4-8476-0f085a00d781"

# execute_me_to_retrieve = argv_simple_retrieve(dataset_id)
# print(execute_me_to_retrieve)

# try:
#     p1 = subprocess.Popen(argv_simple_retrieve(dataset_id))
#     out1 = p1.communicate()
#     if p1.returncode != 0:
#         raise Exception(f'oops return code was {p1.returncode}')
# except KeyboardInterrupt as e:
#     p1.send_signal(signal.SIGINT)
#     print(e)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
    # app.run(host="127.0.0.1", port=7632, debug=True)