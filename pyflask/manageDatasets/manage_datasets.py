# -*- coding: utf-8 -*-

### Import required python modules
import contextlib
import json
from unicodedata import name
from urllib import request
import cv2
import os
from os import listdir, mkdir, walk
from os.path import (
    isdir,
    join,
    exists,
    expanduser,
    dirname,
    getsize
)
import time
import shutil
from configparser import ConfigParser
import subprocess
# from websocket import create_connection
import socket
import errno
import re
import gevent

from pennsieve2.pennsieve import Pennsieve
from threading import Thread

import platform


import boto3
import requests

from flask import abort
from namespaces import NamespaceEnum, get_namespace_logger
#from utils import get_dataset, get_authenticated_ps, get_dataset_size
from utils import ( 
    get_dataset_size, 
    create_request_headers, 
    connect_pennsieve_client, 
    authenticate_user_with_client, 
    get_dataset_id
)
from authentication import get_access_token
from users import get_user_information, update_config_account_name
from permissions import has_edit_permissions, bf_get_current_user_permission_agent_two


### Global variables
namespace_logger = get_namespace_logger(NamespaceEnum.MANAGE_DATASETS)
curateprogress = " "
curatestatus = " "
curateprintstatus = " "
total_dataset_size = 1
curated_dataset_size = 0
start_time = 0

userpath = expanduser("~")
configpath = join(userpath, ".pennsieve", "config.ini")
submitdataprogress = " "
submitdatastatus = " "
submitprintstatus = " "
total_file_size = 1
uploaded_file_size = 0
uploaded_files = 0
did_upload = False
did_fail = False
upload_folder_count = 0
start_time_bf_upload = 0
start_submit = 0
metadatapath = join(userpath, "SODA", "SODA_metadata")

bf = ""
myds = ""
initial_bfdataset_size = 0
upload_directly_to_bf = 0
initial_bfdataset_size_submit = 0

forbidden_characters = '<>:"/\|?*'
forbidden_characters_bf = '\/:*?"<>'

SODA_SPARC_API_KEY = "SODA-Pennsieve"

DEV_TEMPLATE_PATH = join(dirname(__file__), "..", "file_templates")

# once pysoda has been packaged with pyinstaller
# it becomes nested into the pysodadist/api directory
PROD_TEMPLATE_PATH = join(dirname(__file__), "..", "..", "file_templates")
TEMPLATE_PATH = DEV_TEMPLATE_PATH if exists(DEV_TEMPLATE_PATH) else PROD_TEMPLATE_PATH


PENNSIEVE_URL = "https://api.pennsieve.io"

def bf_dataset_size(dataset_id):
    """
    Function to get storage size of a dataset on Pennsieve
    """
    PENNSIEVE_URL = "https://api.pennsieve.io"

    try:
        # get access token 
        token = get_access_token()

        headers = {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

 
        # get the 
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{str(dataset_id)}", headers=headers)
        r.raise_for_status()

        dataset_obj = r.json()

        return dataset_obj["storage"] if "storage" in dataset_obj.keys() else 0
    except Exception as e:
        raise e


# def time_format(elapsed_time):
#     mins, secs = divmod(elapsed_time, 60)
#     hours, mins = divmod(mins, 60)
#     return "%dh:%02dmin:%02ds" % (hours, mins, secs)


# def bf_keep_only_account(keyname):
#     """
#     Args:
#         keyname: name of local Pennsieve account key (string)
#     Action:
#         Deletes account information from the Pennsieve config file
#     """
#     config = ConfigParser()
#     config.read(configpath)
#     config_sections = config.sections()

#     for section in config_sections:
#         if section not in ["agent", "global", keyname]:
#             config.remove_section(section)
#         with open(configpath, "w+") as configfile:
#             config.write(configfile)


### Manage datasets (Pennsieve interface)
def bf_add_account_api_key(keyname, key, secret):
    """
    Associated with 'Add account' button in 'Login to your Pennsieve account' section of SODA

    Args:
        keyname: Name of the account to be associated with the given credentials (string)
        key: API key (string)
        secret: API Secret (string)
    Action:
        Adds account to the Pennsieve configuration file (local machine)
    """
    try:
        error = ""
        keyname = keyname.strip()
        if (not keyname) or (not key) or (not secret):
            abort(401, "Please enter valid keyname, key, and/or secret")

        if (keyname.isspace()) or (key.isspace()) or (secret.isspace()):
            abort(401, "Please enter valid keyname, key, and/or secret")

        ps_path = join(userpath, ".pennsieve")
        # Load existing or create new config file
        config = ConfigParser()
        if exists(configpath):
            config.read(configpath)
            if config.has_section(keyname):
                abort(400, "Key name already exists")
        else:
            if not exists(ps_path):
                mkdir(ps_path)
            if not exists(join(ps_path, "cache")):
                mkdir(join(ps_path, "cache"))

        # Add agent section
        agentkey = "agent"
        if not config.has_section(agentkey):
            config.add_section(agentkey)
            config.set(agentkey, "port", "9000")
            config.set(agentkey, "upload_workers", "10")
            config.set(agentkey, "upload_chunk_size", "32")

        # Add new account
        config.add_section(keyname)
        config.set(keyname, "api_token", key)
        config.set(keyname, "api_secret", secret)
        config.set(keyname, "api_host", "https://api.pennsieve.io")

        with open(configpath, "w") as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    # Check key and secret are valid, if not delete account from config
    try:
        ps = Pennsieve()
        ps.user.switch(keyname)
        ps.user.reauthenticate()

    except Exception as e:
        namespace_logger.error(e)
        bf_delete_account(keyname)
        abort(401, 
            "Please check that key name, key, and secret are entered properly"
        )

    # Check that the Pennsieve account is in the SPARC Consortium organization
    try:
        org_id = ps.getUser()["organization_id"]

        # CHANGE BACK
        if org_id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
            abort(403,
                "Please check that your account is within the SPARC Consortium Organization"
            )

        if not config.has_section("global"):
            config.add_section("global")

        default_acc = config["global"]
        default_acc["default_profile"] = keyname

        with open(configpath, "w") as configfile:
            config.write(configfile)

        return {"message": f"Successfully added account {str(bf)}"}

    except Exception as e:
        bf_delete_account(keyname)
        raise e


def bf_add_account_username(keyname, key, secret):
    """
    Associated with 'Add account' button in 'Login to your Pennsieve account' section of SODA

    Args:
        keyname: Name of the account to be associated with the given credentials (string)
        key: API key (string)
        secret: API Secret (string)
    Action:
        Adds account to the Pennsieve configuration file (local machine)
    """
    temp_keyname = "SODA_temp_generated"
    try:
        keyname = keyname.strip()

        bfpath = join(userpath, ".pennsieve")
        # Load existing or create new config file
        config = ConfigParser()
        if exists(configpath):
            config.read(configpath)
        elif not exists(bfpath):
            mkdir(bfpath)

        # Add agent section
        agentkey = "agent"
        if not config.has_section(agentkey):
            config.add_section(agentkey)
            config.set(agentkey, "port", "9000")
            config.set(agentkey, "upload_workers", "10")
            config.set(agentkey, "upload_chunk_size", "32")

        # Add new account
        if not config.has_section(keyname):
            config.add_section(keyname)
            config.set(keyname, "api_token", key)
            config.set(keyname, "api_secret", secret)
            config.set(keyname, "api_host", "https://api.pennsieve.io")

        with open(configpath, "w") as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    # Check key and secret are valid, if not delete account from config
    try:
        ps = Pennsieve()
        ps.user.switch(keyname)
    except Exception:
        bf_delete_account(keyname)
        abort(401, 
            "Please check that key name, key, and secret are entered properly"
        )

    

    # Check that the Pennsieve account is in the SPARC Consortium organization
    organization_id = ps.getUser()["organization_id"]
    if organization_id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
        bf_delete_account(keyname)
        abort(403,
            "Please check that your account is within the SPARC Consortium Organization"
        )

    try:
        if not config.has_section("global"):
            config.add_section("global")

        default_acc = config["global"]
        default_acc["default_profile"] = keyname

        with open(configpath, "w+") as configfile:
            config.write(configfile)

        return {"message": f"Successfully added account {keyname}"}

    except Exception as e:
        bf_delete_account(keyname)
        raise e


def bf_delete_account(keyname):
    """
    Args:
        keyname: name of local Pennsieve account key (string)
    Action:
        Deletes account information from the Pennsieve config file
    """
    config = ConfigParser()
    config.read(configpath)
    config.remove_section(keyname)
    with open(configpath, "w") as configfile:
        config.write(configfile)


def check_forbidden_characters_bf(my_string):
    """
    Check for forbidden characters in Pennsieve file/folder name

    Args:
        my_string: string with characters (string)
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile(f"[{forbidden_characters_bf}]")
    if regex.search(my_string) == None and "\\" not in r"%r" % my_string:
        return False
    else:
        return True



def bf_account_list():
    """
    Action:
        Returns list of accounts stored in the system
    """
    try:
        accountlist = ["Select"]
        if exists(configpath):
            # # CHANGE BACK
            valid_account = bf_get_accounts()
            if valid_account != "":
                accountlist.append(valid_account)
        return {"accounts": accountlist}
        # My accountlist

    except Exception as e:
        raise e


def bf_default_account_load():
    """
    Action:
        Returns the first valid account as the default account
    """
    try:
        accountlist = []
        if exists(configpath):
            valid_account = bf_get_accounts()
            if valid_account != "":
                accountlist.append(valid_account)
        return {"defaultAccounts": accountlist}
    except Exception as e:
        raise e



def bf_get_accounts():
    """
    Args:
        None
    Action:
        Gets the appropriate SPARC account from the config file
    """
    config = ConfigParser()
    config.read(configpath)
    accountname = config.sections()

    if SODA_SPARC_API_KEY in accountname:
        with contextlib.suppress(Exception):
            ps = Pennsieve()
            ps.user.switch(SODA_SPARC_API_KEY)
            return SODA_SPARC_API_KEY
    elif "global" in accountname:
        if "default_profile" in config["global"]:
            default_profile = config["global"]["default_profile"]
            if default_profile in accountname:
                with contextlib.suppress(Exception):
                    ps = Pennsieve()
                    ps.user.switch(default_profile)
                    return default_profile
    else:
        for account in accountname:
            if account != 'agent':
                with contextlib.suppress(Exception):
                    ps = Pennsieve()
                    ps.user.switch(account)
                    org_id = ps.getUser()['organization_id']

                    if org_id == "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
                        if not config.has_section("global"):
                            config.add_section("global")

                        default_acc = config["global"]
                        default_acc["default_profile"] = account

                        with open(configpath, "w+") as configfile:
                            config.write(configfile)

                        return account
    return ""



def bf_dataset_account(accountname):
    """
    This function filters dataset dropdowns across SODA by the permissions granted to users.

    Input: BFaccountname
    Output: a filtered dataset list with objects as elements: {"name": dataset's name, "id": dataset's id, "role": permission}

    """
    PENNSIEVE_URL = "https://api.pennsieve.io"

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, accountname)
    
    datasets_dict = ps.getDatasets()

    # get the session token
    headers = create_request_headers(ps)

    datasets_list = []
    for name in datasets_dict.keys():
        datasets_list.append({"name": name, "id": datasets_dict[name]})

    def filter_dataset(datasets_list, store=None):
        if store is None:
            store = []
        for dataset in datasets_list:
            selected_dataset_id = dataset['id']
            r = requests.get(f"{PENNSIEVE_URL}/datasets/{str(selected_dataset_id)}/role", headers=headers)
            r.raise_for_status()
            user_role = r.json()["role"]
            if user_role not in ["viewer", "editor"]:
                store.append(
                    {"id": selected_dataset_id, "name": dataset['name'], "role": user_role}
                )
        return store

    store = []
    threads = []
    nthreads = 8
    # create the threads
    for i in range(nthreads):
        sub_datasets_list = datasets_list[i::nthreads]
        t = Thread(target=filter_dataset, args=(sub_datasets_list, store))
        threads.append(t)

    # start the threads
    [t.start() for t in threads]
    # wait for the threads to finish
    [t.join() for t in threads]

    sorted_bf_datasets = sorted(store, key=lambda k: k["name"].upper())
    return {"datasets": sorted_bf_datasets}


def get_username(accountname):
    """
    Input: User's account name

    Output: User's first and last name for display in SODA's UI.
    """

    # ensure the given account name is a valid profile saved in the .pennsieve/config file 
    try:
        ps = Pennsieve()
        ps.user.switch(accountname)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account.")

    # reauthenticate the user
    ps.user.reauthenticate()

    # get the api access token for the user's current session
    token = ps.getUser()["session_token"]

    # request the user's first and last name stored on Pennsieve
    try:
        user_info = get_user_information(token)
    except Exception as e:
        abort(500, "Something went wrong while authenticating the user or connecting to Pennsieve.")
    
    username = f"{user_info['firstName']} {user_info['lastName']}"

    return {"username": username}


def bf_account_details(accountname):
    """
    Args:
        accountname: name of local Pennsieve account key (string)
    Return:
        acc_details: account user email and organization (string)
    Action:
        Returns: return details of user associated with the account
    """
    try:
        ps = Pennsieve()
        ps.user.switch(accountname)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account.")

    
    # authenticate the user
    ps.user.reauthenticate()

    # get the access token 
    token = ps.getUser()["session_token"]

    try:
        user_info = get_user_information(token)
    except Exception as e:
        abort(500, "Something went wrong while authenticating the user or connecting to Pennsieve.")

    acc_details = f"User email: {user_info['email']}<br>"
    acc_details = f"{acc_details}Organization: {user_info['preferredOrganization']}"

    try:
        # if a user hasn't added their account name to their config file then we want to write it now
        # TODO: Ensure this is necessary. I think we may do this just in case at startup this gets called before something else
        #       that may also want to update the account name if possible? 
        update_config_account_name(accountname)
        
        ## return account details and datasets where such an account has some permission
        return {"account_details": acc_details}

    except Exception as e:
        raise e


def create_new_dataset(datasetname, accountname):
    """
    Associated with 'Create' button in 'Create new dataset folder'

    Args:
        datasetname: name of the dataset to be created (string)
        accountname: account in which the dataset needs to be created (string)
    Action:
        Creates dataset for the account specified
    """
    try:
        datasetname = datasetname.strip()

        if check_forbidden_characters_bf(datasetname):
            error = (
                "A Pennsieve dataset name cannot contain any of the following characters: "
                + forbidden_characters_bf
                + "<br>"
            )
            abort(400, error)

        if not datasetname or datasetname.isspace():
            error = f"{error}Please enter valid dataset name."
            abort(400, error)

        ps = connect_pennsieve_client()

        authenticate_user_with_client(ps, accountname)

        ds = ps.getDatasets()

        if datasetname in ds:
            abort(400, "Dataset name already exists")
        else:
            r = requests.post(f"{PENNSIEVE_URL}/datasets", headers=create_request_headers(ps), json={"name": datasetname})
            r.raise_for_status()
            ds_id = r.json()['content']['id']
            return {"id": ds_id}

    except Exception as e:
        raise e


def bf_rename_dataset(accountname, current_dataset_name, renamed_dataset_name):
    """
    Args:
        accountname: account in which the dataset needs to be created (string)
        current_dataset_name: current name of the dataset
        renamed_dataset_name: new name of the dataset

    Action:
        Creates dataset for the account specified
    """
    error, c = "", 0
    datasetname = renamed_dataset_name.strip()

    if check_forbidden_characters_bf(datasetname):
        error = f"{error}A Pennsieve dataset name cannot contain any of the following characters: {forbidden_characters_bf}<br>"

        c += 1

    if not datasetname:
        error = f"{error}Please enter valid new dataset name<br>"
        c += 1

    if datasetname.isspace():
        error = f"{error}Please enter valid new dataset name<br>"
        c += 1

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, accountname)

    selected_dataset_id = get_dataset_id(ps, current_dataset_name)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    dataset_list = [ds.name for ds in ps.getDatasets()]
    if datasetname in dataset_list:
        abort(400, "Dataset name already exists.")

    jsonfile = {"name": renamed_dataset_name}
    try: 
        r = requests.put(f"{PENNSIEVE_URL}/{str(selected_dataset_id)}", json=jsonfile, headers=create_request_headers(ps))
        r.raise_for_status()
        return {"message": f"Dataset renamed to {renamed_dataset_name}"}
    except Exception as e:
        raise Exception(e) from e


# def clear_queue():

#     command = [agent_cmd(), "upload-status", "--cancel-all"]

#     return subprocess.run(command, check=True)  # env=agent_env(?settings?)


# def agent_running():
#     listen_port = 11235

#     try:
#         # x = "ws://127.0.0.1:11235"
#         # create_connection(x).close()
#         # CHANGE BACK
#         create_connection(socket_address(listen_port)).close()

#     except socket.error as e:

#         if e.errno == errno.ECONNREFUSED:  # ConnectionRefusedError for Python 3
#             return True
#         else:
#             raise e
#     else:
#         raise AgentError(
#             "The Pennsieve agent is already running. Learn more about how to solve the issue <a href='https://docs.sodaforsparc.io/docs/common-errors/pennsieve-agent-is-already-running' target='_blank'>here</a>."
#         )


# def check_agent_install():
#     """
#     Associated with 'Submit dataset' button in 'Submit new dataset' section
#     Uploads the specified folder to the specified dataset on Pennsieve account

#     Input:
#         accountname: account in which the dataset needs to be created (string)
#         bfdataset: name of the dataset on Pennsieve (string)
#         pathdataset: path of dataset on local machine (string)
#     Action:
#         Uploads dataset on Pennsieve account
#     """
#     ## check if agent is installed
#     try:
#         validate_agent_installation(Settings())
#         return agent_version(Settings())
#     except AgentError as e:
#         raise AgentError(
#             "We highly recommend installing the Pennsieve agent and restarting SODA before you upload any files."
#         ) from e


# def agent_version(settings):
#     """
#     Check whether the agent is installed and at least the minimum version.
#     """
#     try:
#         env = agent_env(settings)
#         env["PENNSIEVE_LOG_LEVEL"] = "ERROR"  # Avoid spurious output with the version
#         version = subprocess.check_output([agent_cmd(), "version"], env=env)
#         return {"agent_version": version.decode().strip()}
#     except (AgentError, subprocess.CalledProcessError, EnvironmentError) as e:
#         raise AgentError(
#             "Agent not installed. Visit https://developer.pennsieve.io/agent for installation directions."
#         ) from e


def bf_submit_dataset(accountname, bfdataset, pathdataset):
    """
    Associated with 'Submit dataset' button in 'Submit new dataset' section
    Uploads the specified folder to the specified dataset on Pennsieve account

    Input:
        accountname: account in which the dataset needs to be created (string)
        bfdataset: name of the dataset on Pennsieve (string)
        pathdataset: path of dataset on local machine (string)
    Action:
        Uploads dataset on Pennsieve account
    """
    global submitdataprogress
    global submitdatastatus
    global total_file_size
    global uploaded_file_size
    global submitprintstatus
    global start_time_bf_upload
    global bf
    global myds
    global start_submit
    global initial_bfdataset_size_submit
    global did_upload
    global did_fail
    global upload_folder_count
    global namespace_logger

    submitdataprogress = " "
    submitdatastatus = " "
    uploaded_file_size = 0
    submitprintstatus = " "
    start_time_bf_upload = 0
    initial_bfdataset_size_submit = 0
    start_submit = 0
    did_upload = False
    did_fail = False
    upload_folder_count = 0

    namespace_logger.info("Yes we are here")

    

    # check if the local dataset folder exists
    if not isdir(pathdataset):
        submitdatastatus = "Done"
        error_message = (
            f"{error_message} Please select a valid local dataset folder<br>"
        )
        did_fail = True
        did_upload = False
        abort(400, error_message)

    namespace_logger.info("Dataset folder exists")

    total_file_size = 1
   

    # initialize the Pennsieve client 
    try:
        ps = Pennsieve()
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = "Please select a valid Pennsieve account"
        abort(500, e)

    namespace_logger.info("Created a ps instance")


    # select the user
    try:
        ps.user.switch(accountname)
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)


    # reauthenticate the user
    try:
        ps.user.reauthenticate()
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = "Could not reauthenticate this user"
        abort(400, error_message)

    # select the dataset 
    try:
        ps.useDataset(bfdataset)
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)



    # get the dataset size before starting the upload
    total_file_size, invalid_dataset_messages = get_dataset_size(pathdataset)

    if invalid_dataset_messages != "":
        submitdatastatus = "Done"
        invalid_dataset_messages = (
            invalid_dataset_messages
            + "<br>Please remove invalid files/folders from your dataset before uploading. If you have hidden files present please remove them before upload. You can find more details <a href='https://docs.sodaforsparc.io/docs/common-errors/issues-regarding-hidden-files-or-folders' target='_blank'>here </a> on how to fix this issue."
        )
        did_fail = True
        did_upload = False
        abort(400, invalid_dataset_messages)

    total_file_size = total_file_size - 1

    role = bf_get_current_user_permission_agent_two(bfdataset)["role"]
    if role not in ["owner", "manager", "editor"]:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        abort(403, "You don't have permissions for uploading to this Pennsieve dataset")

    ## check if agent is installed
    # try:
    #     validate_agent_installation(Settings())
    # except AgentError:
    #     did_fail = True
    #     did_upload = False
    #     raise AgentError(
    #         "The Pennsieve agent is not installed on your computer. Click <a href='https://docs.sodaforsparc.io/docs/common-errors/installing-the-pennsieve-agent' target='_blank'>here</a> for installation instructions."
    #     )


    # create the manifest file for the dataset
    try:
        ps.manifest.create(pathdataset)
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = "Could not create manifest file for this dataset"
        abort(500, e)
    

    # upload the dataset
    try:
        submitprintstatus = "Uploading"
        start_time_bf_upload = time.time()
        initial_bfdataset_size_submit = bf_dataset_size(bfdataset)
        start_submit = 1
        ps.manifest.upload(2)
        res = ps.subscribe(2)
        namespace_logger.info(res)

        submitdatastatus = "Done"
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        raise e

    return "Done"


# sends back the current amount of files that have been uploaded by bf_submit_dataset
def bf_submit_dataset_upload_details():
    """
    Function frequently called by front end to help keep track of the amount of files that have
    been successfully uploaded to Pennsieve, and the size of the uploaded files

    Returns: 
        uploaded_files - 
        uploaded_file_size - 
        did_fail - 
        did_upload -  to inform the user that the upload failed and that it failed after uploading data - important for logging upload sessions
        upload_folder_count - the number of folders that have been uploaded

    """
    global uploaded_file_size
    global uploaded_files
    global did_fail
    global did_upload
    global upload_folder_count

    return {
        "uploaded_files": uploaded_files,
        "uploaded_file_size": uploaded_file_size,
        "did_fail": did_fail,
        "did_upload": did_upload,
        "upload_folder_count": upload_folder_count,
    }


def submit_dataset_progress():
    """
    Keeps track of the dataset submission progress
    """
    global submitdataprogress
    global submitdatastatus
    global submitprintstatus
    global total_file_size
    global uploaded_file_size
    global start_time_bf_upload
    global start_submit
    global initial_bfdataset_size_submit

    if start_submit == 1:
        uploaded_file_size = bf_dataset_size() - initial_bfdataset_size_submit
        elapsed_time = time.time() - start_time_bf_upload
        elapsed_time_formatted = time_format(elapsed_time)
        elapsed_time_formatted_display = (
            "<br>" + "Elapsed time: " + elapsed_time_formatted + "<br>"
        )
    else:
        uploaded_file_size = 0
        elapsed_time_formatted = 0
        elapsed_time_formatted_display = "<br>" + "Initiating..." + "<br>"
    # gevent.sleep(0)
    return {
        'progress': submitdataprogress + elapsed_time_formatted_display,
        'submit_dataset_status': submitdatastatus,
        'submit_print_status': submitprintstatus,
        'total_file_size': total_file_size,
        'upload_file_size': uploaded_file_size,
        'elapsed_time_formatted': elapsed_time_formatted,
    }


def bf_get_users(selected_bfaccount):
    """
    Function to get list of users belonging to the organization of
    the given Pennsieve account

    Args:
      selected_bfaccount: name of selected Pennsieve account (string)
    Return:
        list_users : list of users (first name -- last name) associated with the organization of the
        selected Pennsieve account (list of string)
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)
        
    try:
        global PENNSIEVE_URL
        organization_id = ps.getUser()["organization_id"]
        r = requests.get(f"{PENNSIEVE_URL}/organizations/{str(organization_id)}/members", headers=create_request_headers(ps))
        r.raise_for_status()
        list_users = r.json()
        list_users_first_last = []
        for i in range(len(list_users)):
            first_last = (
                list_users[i]["firstName"].capitalize()
                + " "
                + list_users[i]["lastName"].capitalize()
                + " ("
                + list_users[i]["email"]
                + ") !|**|!"
                + list_users[i]["id"]
            )
            list_users_first_last.append(first_last)
        list_users_first_last.sort()  # Returning the list of users in alphabetical order
        return {"users": list_users_first_last}
    except Exception as e:
        raise e


def bf_get_teams(selected_bfaccount):
    """
    Args:
      selected_bfaccount: name of selected Pennsieve account (string)
    Return:
        list_teams : list of teams (name) associated with the organization of the
        selected Pennsieve account (list of string)
    Action:
        Provides list of teams belonging to the organization of
        the given Pennsieve account
    """
    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    try:
        organization_id = ps.getUser()["organization_id"]
        global PENNSIEVE_URL
        r = requests.get(f"{PENNSIEVE_URL}/organizations/{str(organization_id)}/teams", headers=create_request_headers(ps))
        r.raise_for_status()
        list_teams = r.json()
        list_teams_name = [list_teams[i]["team"]["name"] for i in range(len(list_teams))]

        list_teams_name.sort()  # Returning the list of teams in alphabetical order
        return {"teams": list_teams_name}
    except Exception as e:
        raise e


def bf_get_permission(selected_bfaccount, selected_bfdataset):

    """
    Function to get permission for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Output:
        list_permission: list of permission (first name -- last name -- role) associated with the
        selected dataset (list of string)
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    try:
        global PENNSIEVE_URL
        headers = create_request_headers(ps)
        # user permissions
        r = requests.get(
            f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/users", headers=headers
        )
        r.raise_for_status()
        list_dataset_permission = r.json()
        list_dataset_permission_first_last_role = []
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]
            list_dataset_permission_first_last_role.append(
                f"User: {first_name} {last_name} , role: {role}"
            )

        # team permissions
        r = requests.get(
            f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/teams", headers=headers
        )
        r.raise_for_status()
        list_dataset_permission_teams = r.json()
        for i in range(len(list_dataset_permission_teams)):
            team_keys = list(list_dataset_permission_teams[i].keys())
            if "role" in team_keys:
                team_name = list_dataset_permission_teams[i]["name"]
                team_role = list_dataset_permission_teams[i]["role"]
                list_dataset_permission_first_last_role.append(
                    "Team: " + team_name + ", role: " + team_role
                )

        # Organization permissions
        r = requests.get(
            f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/organizations", headers=headers
        )
        r.raise_for_status()
        list_dataset_permission_organizations = r.json()
        if type(list_dataset_permission_organizations) is dict:
            organization_keys = list(list_dataset_permission_organizations.keys())
            if "role" in organization_keys:
                organization_name = list_dataset_permission_organizations["name"]
                organization_role = list_dataset_permission_organizations["role"]
                list_dataset_permission_first_last_role.append(
                    "Organization: "
                    + organization_name
                    + ", role: "
                    + organization_role
                )
        else:
            for i in range(len(list_dataset_permission_organizations)):
                organization_keys = list(
                    list_dataset_permission_organizations[i].keys()
                )
                if "role" in organization_keys:
                    organization_name = list_dataset_permission_organizations[i]["name"]
                    organization_role = list_dataset_permission_organizations[i]["role"]
                    list_dataset_permission_first_last_role.append(
                        "Organization: "
                        + organization_name
                        + ", role: "
                        + organization_role
                    )

        return {"permissions": list_dataset_permission_first_last_role}

    except Exception as e:
        raise e



def bf_add_permission(
    selected_bfaccount, selected_bfdataset, selected_user, selected_role
):

    """
    Function to add/remove permission for a user to a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_user: name (first name -- last name) of selected Pennsieve user (string)
        selected_role: desired role ('manager', 'viewer', 'editor', 'remove current permissions') (string)
    Return:
        success or error message (string)
    """
    selected_user_id = selected_user
    user_present = False
    error = ""

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    headers = create_request_headers(ps)

    try:
        c = 0
        organization_id = ps.getUser()["organization_id"]
        r  = requests.get(f"{PENNSIEVE_URL}/{organization_id}/members", headers=headers)
        r.raise_for_status()
        list_users = r.json()
        for i in range(len(list_users)):
            selected_user = list_users[i]["firstName"] + " " + list_users[i]["lastName"]
            if selected_user_id == list_users[i]["id"]:
                user_present = True
                break
        if user_present == False:
            error = error + "Please select a valid user" + "<br>"
            c += 1
    except Exception as e:
        raise e
    if selected_role not in [
        "manager",
        "viewer",
        "editor",
        "owner",
        "remove current permissions",
    ]:
        error = error + "Please select a valid role" + "<br>"
        c += 1

    if c > 0:
        abort(400, error)
    
    try:
        selected_dataset_id = myds[selected_bfdataset]

        # check that currently logged in user is a manager or a owner of the selected dataset (only manager and owner can change dataset permission)
        r = requests.get(f"{PENNSIEVE_URL}/user", headers=headers)
        r.raise_for_status()
        current_user = r.json()
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]

        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/users", headers=headers)
        r.raise_for_status()
        list_dataset_permission = r.json()
        c = 0
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]
            user_id = list_dataset_permission[i]["id"]
            if (
                first_name == first_name_current_user
                and last_name == last_name_current_user
            ):
                if role not in ["owner", "manager"]:
                    abort(403, "You must be dataset owner or manager to change its permissions")
                elif selected_role == "owner" and role != "owner":
                    abort(403,"You must be dataset owner to change the ownership")
                else:
                    c += 1
            # check if selected user is owner, dataset permission cannot be changed for owner
            if user_id == selected_user_id and role == "owner":
                abort(400, "Owner's permission cannot be changed")

        if c == 0:
            abort(403,"You must be dataset owner or manager to change its permissions")

        if selected_role == "remove current permissions":
            try:
                jsonfile = {"id": selected_user_id}
                r = requests.delete(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/users", json=jsonfile, headers=headers)
                r.raise_for_status()
            except Exception as e:
                raise Exception(e) from e
            return {"message": "Permission removed for " + selected_user}
        elif selected_role == "owner":
            # check if currently logged in user is owner of selected dataset (only owner can change owner)

            # change owner
            jsonfile = {"id": selected_user_id}
            r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/users", json=jsonfile, headers=headers)
            r.raise_for_status()
            return {"message":  "Permission " + "'" + selected_role + "' " + " added for " + selected_user}
        else:
            jsonfile = {"id": selected_dataset_id, "role": selected_role}
            r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/users", json=jsonfile, headers=headers)
            r.raise_for_status()
            return {"message": "Permission " + "'" + selected_role + "' " + " added for " + selected_user}
    except Exception as e:
        raise e


def bf_add_permission_team(
    selected_bfaccount, selected_bfdataset, selected_team, selected_role
):

    """
    Function to add/remove permission fo a team to a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_team: name of selected Pennsieve team (string)
        selected_role: desired role ('manager', 'viewer', 'editor', 'remove current permissions') (string)
    Return:
        success or error message (string)
    """

    error = ""

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    organization_id = ps.getUser()["organization_id"]
    if selected_team == "SPARC Data Curation Team":
        if organization_id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
            abort(403, "Please login under the Pennsieve SPARC Consortium organization to share with the Curation Team")
    if selected_team == "SPARC Embargoed Data Sharing Group":
        if organization_id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
            abort(403, "Please login under the Pennsieve SPARC Consortium organization to share with the SPARC consortium group")


    c = 0

    try:
        myds = ps.getDatasets()
        selected_dataset_id = myds[selected_bfdataset]
    except Exception as e:
        error = error + "Please select a valid Pennsieve dataset" + "<br>"
        c += 1

    headers = create_request_headers(ps)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/organizations/{organization_id}/teams", headers=headers)
        r.raise_for_status()
        list_teams = r.json()
        dict_teams = {}
        list_teams_name = []
        for i in range(len(list_teams)):
            list_teams_name.append(list_teams[i]["team"]["name"])
            dict_teams[list_teams_name[i]] = list_teams[i]["team"]["id"]
        if selected_team not in list_teams_name:
            error = error + "Please select a valid team" + "<br>"
            c += 1
    except Exception as e:
        raise e

    if selected_role not in [
        "manager",
        "viewer",
        "editor",
        "remove current permissions",
    ]:
        error = error + "Please select a valid role" + "<br>"
        c += 1

    if c > 0:
        # can either be error with dataset, team, or role validity
        abort(400, error)

    try:
        selected_team_id = dict_teams[selected_team]

        # check that currently logged in user is a manager or a owner of the selected dataset (only manager and owner can change dataset permission)
        r = requests.get(f"{PENNSIEVE_URL}/user", headers=headers)
        r.raise_for_status()
        current_user = r.json()
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/collaborators/users", headers=headers)
        r.raise_for_status
        list_dataset_permission = r.json()
        c = 0
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]
            # user_id = list_dataset_permission[i]['id']
            if (
                first_name == first_name_current_user
                and last_name == last_name_current_user
            ):
                if role not in ["owner", "manager"]:
                    abort(403, "You must be dataset owner or manager to change its permissions")
                else:
                    c += 1
        if c == 0:
            abort(400, "You must be dataset owner or manager to change its permissions")

        if selected_role == "remove current permissions":
            jsonfile = {"id": selected_team_id}
            r = requests.get(f"{PENNSIEVE_URL}/{selected_dataset_id}/collaborators/teams", json=jsonfile, headers=headers)
            r.raise_for_status()
            return {"message": "Permission removed for " + selected_team}
        else:
            jsonfile = {"id": selected_team_id, "role": selected_role}
            r = requests.put(f"{PENNSIEVE_URL}/{selected_dataset_id}/collaborators/teams", json=jsonfile, headers=headers)
            r.raise_for_status()
            return {"message": "Permission " + "'" + selected_role + "' " + " added for " + selected_team}
    except Exception as e:
        raise e





def bf_get_subtitle(selected_bfaccount, selected_bfdataset):
    """
    Function to get current subtitle associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        License name, if any, or "No license" message
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(ps))
        r.raise_for_status()

        dataset_info = r.json()

        res = ""
        if "description" in dataset_info["content"]:
            res = dataset_info["content"]["description"]
        return {"subtitle": res}
    except Exception as e:
        raise Exception(e) from e





def bf_add_subtitle(selected_bfaccount, selected_bfdataset, input_subtitle):
    """
    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        input_subtitle: subtitle limited to 256 characters (string)
    Action:
        Add/change subtitle for a selected dataset
    Return:
        Success message or error
    """
    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        jsonfile = {"description": input_subtitle}
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", json=jsonfile, headers=create_request_headers(ps))
        r.raise_for_status()
        return{ "message": "Subtitle added!"}
    except Exception as e:
        raise Exception(e)



def bf_get_description(selected_bfaccount, selected_bfdataset):
    """
    Function to get current description associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Description (string with markdown code)
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/readme", headers=create_request_headers(ps))
        r.raise_for_status()

        dataset_readme_info = r.json()
        res = dataset_readme_info["readme"]
        return {"description": res}
    except Exception as e:
        raise Exception(e) from e





def bf_add_description(selected_bfaccount, selected_bfdataset, markdown_input):
    """
    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        markdown_input: description with markdown formatting (string)
    Action:
        Add/change description for a selected dataset
    Return:
        Success message or error
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        jsonfile = {"readme": markdown_input}
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/readme", headers=create_request_headers(ps), json=jsonfile)
        r.raise_for_status()
        return{ "message": "Description added!"}
    except Exception as e:
        raise Exception(e) from e





def bf_get_banner_image(selected_bfaccount, selected_bfdataset):
    """
    Function to get url of current banner image associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        url of banner image (string)
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/banner", headers=create_request_headers(ps))
        r.raise_for_status()

        dataset_banner_info = r.json()
        list_keys = dataset_banner_info.keys()
        if "banner" in list_keys:
            res = dataset_banner_info["banner"]
        else:
            res = "No banner image"
        return {"banner_image": res}
    except Exception as e:
        raise Exception(e) from e





def bf_add_banner_image(selected_bfaccount, selected_bfdataset, banner_image_path):
    """
    Function to add banner to a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_banner_image: name of selected Pennsieve dataset (data-uri)
    Return:
        Success or error message
    """
    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        def upload_image():
            with open(banner_image_path, "rb") as f:
                requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/banner", files={"banner": f}, headers=create_request_headers(ps))

        # delete banner image folder if it is located in SODA
        upload_image()
        image_folder = dirname(banner_image_path)
        if (
            isdir(image_folder)
            and ("SODA" in image_folder)
            and ("guided-banner-images" not in image_folder)
        ):
            shutil.rmtree(image_folder, ignore_errors=True)
        return {"message": "Uploaded!"}
    except Exception as e:
        raise Exception(e)





def bf_get_license(selected_bfaccount, selected_bfdataset):
    """
    Function to get current license associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        License name, if any, or "No license" message
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    try:
        r  = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(ps))
        r.raise_for_status()
        dataset_info = r.json()
        list_keys = dataset_info["content"].keys()
        if "license" in list_keys:
            res = dataset_info["content"]["license"]
        else:
            res = "No license is currently assigned to this dataset"
        return {"license": res}
    except Exception as e:
        raise Exception(e)





def bf_add_license(selected_bfaccount, selected_bfdataset, selected_license):
    """
    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_license: name of selected license (string)
    Action:
        Add/change license for a selected dataset
    Return:
        Success message or error
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")


    allowed_licenses_list = [
        "Community Data License Agreement – Permissive",
        "Community Data License Agreement – Sharing",
        "Creative Commons Zero 1.0 Universal",
        "Creative Commons Attribution",
        "Creative Commons Attribution - ShareAlike",
        "Open Data Commons Open Database",
        "Open Data Commons Attribution",
        "Open Data Commons Public Domain Dedication and License",
        "Apache 2.0",
        "GNU General Public License v3.0",
        "GNU Lesser General Public License",
        "MIT",
        "Mozilla Public License 2.0",
    ]
    if selected_license not in allowed_licenses_list:
        abort(403, "Please select a valid license.")
    jsonfile = {"license": selected_license}
    try: 
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", json=jsonfile, headers=create_request_headers(ps))
        r.raise_for_status()
    except Exception as e:
        raise Exception(e) from e
    return {"message": "License added!"}






def bf_get_dataset_status(selected_bfaccount, selected_bfdataset):
    """
    Function to get current status for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve account (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        List of available status options for the account (list of string).
        Current dataset status (string)
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    try:
        headers = create_request_headers(ps)

        # get list of available status options
        organization_id = ps.getUser()['organization_id']
        r = requests.get(f"{PENNSIEVE_URL}/organizations/{organization_id}/dataset-status", headers=headers)
        r.raise_for_status()
        list_status = r.json()

        # get current status of select dataset
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=headers) 
        r.raise_for_status()
        dataset_current_status = r.json()["content"]["status"]

        return {"status_options": list_status, "current_status": dataset_current_status}
    except Exception as e:
        raise e




def bf_change_dataset_status(selected_bfaccount, selected_bfdataset, selected_status):
    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_bfaccount)

    selected_dataset_id = get_dataset_id(ps, selected_bfdataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        headers = create_request_headers(ps)
        # find name corresponding to display name or show error message
        organization_id = ps.getUser()['organization_id']
        r = requests.get(
            f"{PENNSIEVE_URL}/organizations/{organization_id}/dataset-status", headers=headers
        )
        r.raise_for_status()
        list_status = r.json()
        c = 0
        for option in list_status:
            if option["displayName"] == selected_status:
                new_status = option["name"]
                c += 1
                break
        if c == 0:
            abort(400, "Selected status is not available for this Pennsieve account.")

        # gchange dataset status
        jsonfile = {"status": new_status}
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", json=jsonfile, headers=headers)
        r.raise_for_status()
        return { "message": "Success: Changed dataset status to '" + selected_status + "'" }
    except Exception as e:
        raise e


def get_number_of_files_and_folders_locally(filepath):
    """
    Function to get number of files and folders in a local dataset

    Args:
        filepath: local dataset location
    Return:
        Number of files and folders
    """
    global namespace_logger

    totalDir = 0
    totalFiles = 0
    for base, dirs, files in os.walk(filepath):
        for _ in dirs:
            totalDir += 1
        for _ in files:
            totalFiles += 1

    namespace_logger.info(f"Number of files: {str(totalFiles)}")
    namespace_logger.info(f"Number of folders: {str(totalDir)}")

    return {"totalFiles": totalFiles, "totalDir": totalDir}


def get_pennsieve_api_key_secret(email, password, keyname):

    PENNSIEVE_URL = "https://api.pennsieve.io"

    try:
        response = requests.get(f"{PENNSIEVE_URL}/authentication/cognito-config")
        response.raise_for_status()
        cognito_app_client_id = response.json()["userPool"]["appClientId"]
        cognito_region = response.json()["userPool"]["region"]
        cognito_client = boto3.client(
            "cognito-idp",
            region_name=cognito_region,
            aws_access_key_id="",
            aws_secret_access_key="",
        )
    except Exception as e:
        raise Exception(e)

    try:
        login_response = cognito_client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
            ClientId=cognito_app_client_id,
        )
    except Exception as e:
        abort(400, "Username or password was incorrect.")

    try:
        api_key = login_response["AuthenticationResult"]["AccessToken"]
        response = requests.get(
            f"{PENNSIEVE_URL}/user", headers={"Authorization": f"Bearer {api_key}"}
        )
        response.raise_for_status()
    except Exception as e:
        raise e

    try:
        url = "https://api.pennsieve.io/session/switch-organization"

        sparc_org_id = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"
        querystring = {
            "organization_id": "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"
        }

        headers = {"Accept": "application/json", "Authorization": f"Bearer {api_key}"}

        response = requests.request("PUT", url, headers=headers, params=querystring)
    except Exception as e:
        raise e

    try:
        url = "https://api.pennsieve.io/session/switch-organization"

        querystring = {
            "organization_id": "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0"
        }

        headers = {"Accept": "application/json", "Authorization": f"Bearer {api_key}"}

        response = requests.request("PUT", url, headers=headers, params=querystring)

        response = requests.get(
            f"{PENNSIEVE_URL}/user", headers={"Authorization": f"Bearer {api_key}"}
        )
        response.raise_for_status()
        response = response.json()
        if "preferredOrganization" in response:
            if response["preferredOrganization"] != sparc_org_id:
                error = "Could not switch to the SPARC Consortium organization. Please log in and switch to the organization and try again."
                raise Exception(error)
        else:
            error = "Could not switch to the SPARC Consortium organization. Please log in and switch to the organization and try again."
            raise Exception(error)
    except Exception as error:
        error = "Could not switch to the SPARC Consortium organization. Please log in and switch to the organization and try again."
        raise error

    try:
        url = "https://api.pennsieve.io/token/"

        payload = {"name": f"{keyname}"}
        headers = {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }

        response = requests.request("POST", url, json=payload, headers=headers)
        response.raise_for_status()
        response = response.json()
        return { 
            "success": "success", 
            "key": response["key"], 
            "secret": response["secret"], 
            "name": response["name"]
        }
    except Exception as e:
        raise e



def get_dataset_readme(selected_account, selected_dataset):
    """
    Function to get readme for a dataset
    
        Args:
            selected_account: account name
            selected_dataset: dataset name
        Return:
            Readme for the dataset
    """
    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_account)

    selected_dataset_id = get_dataset_id(ps, selected_dataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/readme", headers=create_request_headers(ps))
        r.raise_for_status()

        readme = r.json()
    except Exception as e:
        raise Exception(e)

    return readme



def update_dataset_readme(selected_account, selected_dataset, updated_readme):
    """
    Update the readme of a dataset on Pennsieve with the given readme string.
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_account)

    selected_dataset_id = get_dataset_id(ps, selected_dataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/readme", json={"readme": updated_readme}, headers=create_request_headers(ps))
        r.raise_for_status()
    except Exception as e:
        raise Exception(e) from e

    return {"message": "Readme updated"}


def get_dataset_tags(selected_account, selected_dataset):
    """
    Function to get tags for a dataset
    
        Args:
            selected_account: account name
            selected_dataset: dataset name
        Return:
            Tags for the dataset
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_account)

    selected_dataset_id = get_dataset_id(ps, selected_dataset)

    try:
        r = requests.get(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}", headers=create_request_headers(ps))
        r.raise_for_status()

        dataset_info = r.json()
        tags = dataset_info["content"]["tags"] if "tags" in dataset_info["content"] else []
        return {"tags": tags}
    except Exception as e:
        raise Exception(e) from e


def update_dataset_tags(selected_account, selected_dataset, updated_tags):
    """
    Update the tags of a dataset on Pennsieve with the given tags list.
    """

    ps = connect_pennsieve_client()

    authenticate_user_with_client(ps, selected_account)

    selected_dataset_id = get_dataset_id(ps, selected_dataset)

    if not has_edit_permissions(ps, selected_dataset_id):
        abort(401, "You do not have permission to edit this dataset.")

    try:
        jsonfile = {"tags": updated_tags}
        r = requests.put(f"{PENNSIEVE_URL}/datasets/{selected_dataset_id}/readme", headers=create_request_headers(ps), json=jsonfile)
        r.raise_for_status()
        return {"message": "Tags updated"}
    except Exception as e:
        raise Exception(e) from e



def scale_image(imagePath):
    """
    Scale the image to be within the file size limit for banner images (5MB)
    """
    max_image_size = 2048
    filename, file_extension = os.path.splitext(imagePath)
    img = cv2.imread(imagePath)
    original_width = int(img.shape[1])
    original_height = int(img.shape[0])
    home_path = os.path.expanduser('~')
    store_image_path = os.path.join(home_path, 'SODA', 'banner-image', (filename + file_extension))
    #file size is greater than 5mb
    if original_width > max_image_size or original_height > max_image_size:
        width = 2048
        height = 2048
        dim = (width, height)

        # resize image into 2048x2048
        resized_image = cv2.resize(img, dim, interpolation = cv2.INTER_AREA)
        cv2.imwrite(store_image_path, resized_image)

    return { "scaled_image_path": store_image_path }

