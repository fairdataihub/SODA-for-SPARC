# -*- coding: utf-8 -*-

### Import required python modules
from gevent import monkey

monkey.patch_all()
import os
from os import listdir, mkdir, walk
from os.path import (
    isdir,
    join,
    exists,
    expanduser,
    dirname,
    getsize,
)
import time
import shutil
from configparser import ConfigParser
import subprocess
from websocket import create_connection
import socket
import errno
import re
import gevent
from pennsieve import Pennsieve
from pennsieve.api.agent import (
    agent_cmd,
    validate_agent_installation,
    agent_env,
    agent_cmd,
)

from pennsieve.api.agent import AgentError, socket_address
from pennsieve import Settings
from threading import Thread

import platform


import boto3
import requests

from flask import abort 
from namespaces import NamespaceEnum, get_namespace_logger
from utils import get_dataset, get_authenticated_ps


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


def folder_size(path):
    """
    Provides the size of the folder indicated by path

    Args:
        path: path of the folder (string)
    Returns:
        total_size: total size of the folder in bytes (integer)
    """
    total_size = 0
    start_path = "."  # To get size of current directory
    for path, dirs, files in walk(path):
        for f in files:
            fp = join(path, f)
            total_size += getsize(fp)
    return total_size


def bf_dataset_size():
    """
    Function to get storage size of a dataset on Pennsieve
    """
    global bf
    global myds

    try:
        selected_dataset_id = myds.id
        bf_response = bf._api._get(f"/datasets/{str(selected_dataset_id)}")
        return bf_response["storage"] if "storage" in bf_response.keys() else 0
    except Exception as e:
        raise e


def time_format(elapsed_time):
    mins, secs = divmod(elapsed_time, 60)
    hours, mins = divmod(mins, 60)
    return "%dh:%02dmin:%02ds" % (hours, mins, secs)


def bf_keep_only_account(keyname):
    """
    Args:
        keyname: name of local Pennsieve account key (string)
    Action:
        Deletes account information from the Pennsieve config file
    """
    config = ConfigParser()
    config.read(configpath)
    config_sections = config.sections()

    for section in config_sections:
        if section not in ["agent", "global", keyname]:
            config.remove_section(section)
        with open(configpath, "w+") as configfile:
            config.write(configfile)


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

        bfpath = join(userpath, ".pennsieve")
        # Load existing or create new config file
        config = ConfigParser()
        if exists(configpath):
            config.read(configpath)
            if config.has_section(keyname):
                abort(400, "Key name already exists")
        else:
            if not exists(bfpath):
                mkdir(bfpath)
            if not exists(join(bfpath, "cache")):
                mkdir(join(bfpath, "cache"))

        # Add agent section
        agentkey = "agent"
        if not config.has_section(agentkey):
            config.add_section(agentkey)
            config.set(agentkey, "proxy_local_port", "8080")
            config.set(agentkey, "uploader", "true")
            config.set(agentkey, "cache_hard_cache_size", "10000000000")
            config.set(agentkey, "status_port", "11235")
            config.set(agentkey, "metrics", "true")
            config.set(agentkey, "cache_page_size", "100000")
            config.set(agentkey, "proxy", "true")
            config.set(agentkey, "cache_soft_cache_size", "5000000000")
            config.set(agentkey, "timeseries_local_port", "9090")
            config.set(agentkey, "timeseries", "true")

        # Add new account
        config.add_section(keyname)
        config.set(keyname, "api_token", key)
        config.set(keyname, "api_secret", secret)

        with open(configpath, "w") as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    # Check key and secret are valid, if not delete account from config
    try:
        bf = Pennsieve(keyname)

    except Exception:
        bf_delete_account(keyname)
        abort(401, 
            "Please check that key name, key, and secret are entered properly"
        )

    # Check that the Pennsieve account is in the SPARC Consortium organization
    try:
        org_id = bf.context.id

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
        else:
            if not exists(bfpath):
                mkdir(bfpath)
            if not exists(join(bfpath, "cache")):
                mkdir(join(bfpath, "cache"))

        # Add agent section
        agentkey = "agent"
        if not config.has_section(agentkey):
            config.add_section(agentkey)
            config.set(agentkey, "proxy_local_port", "8080")
            config.set(agentkey, "uploader", "true")
            config.set(agentkey, "cache_hard_cache_size", "10000000000")
            config.set(agentkey, "status_port", "11235")
            config.set(agentkey, "metrics", "true")
            config.set(agentkey, "cache_page_size", "100000")
            config.set(agentkey, "proxy", "true")
            config.set(agentkey, "cache_soft_cache_size", "5000000000")
            config.set(agentkey, "timeseries_local_port", "9090")
            config.set(agentkey, "timeseries", "true")

        # Add new account
        config.add_section(temp_keyname)
        config.set(temp_keyname, "api_token", key)
        config.set(temp_keyname, "api_secret", secret)

        with open(configpath, "w") as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    # Check key and secret are valid, if not delete account from config
    try:
        bf = Pennsieve(temp_keyname)
    except Exception:
        bf_delete_account(temp_keyname)
        abort(401, 
            "Please check that key name, key, and secret are entered properly"
        )

    # Check that the Pennsieve account is in the SPARC Consortium organization
    if bf.context.id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
        bf_delete_account(temp_keyname)
        abort(403,
            "Please check that your account is within the SPARC Consortium Organization"
        )

    try:
        if not config.has_section("global"):
            config.add_section("global")

        default_acc = config["global"]
        default_acc["default_profile"] = SODA_SPARC_API_KEY

        if not config.has_section(SODA_SPARC_API_KEY):
            config.add_section(SODA_SPARC_API_KEY)

        config.set(SODA_SPARC_API_KEY, "api_token", key)
        config.set(SODA_SPARC_API_KEY, "api_secret", secret)

        with open(configpath, "w+") as configfile:
            config.write(configfile)

        bf_delete_account(temp_keyname)

        return {"message": f"Successfully added account {str(bf)}"}

    except Exception as e:
        bf_delete_account(temp_keyname)
        raise e


def check_forbidden_characters(my_string):
    """
    Check for forbidden characters in file/folder name

    Args:
        my_string: string with characters (string)
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile("[" + forbidden_characters + "]")
    if regex.search(my_string) == None and "\\" not in r"%r" % my_string:
        return False
    else:
        return True


def check_forbidden_characters_bf(my_string):
    """
    Check for forbidden characters in Pennsieve file/folder name

    Args:
        my_string: string with characters (string)
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile("[" + forbidden_characters_bf + "]")
    if regex.search(my_string) == None and "\\" not in r"%r" % my_string:
        return False
    else:
        return True


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


# def bf_remove_additional_accounts():
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
        try:
            ps = Pennsieve(SODA_SPARC_API_KEY)
            return SODA_SPARC_API_KEY
        except Exception:
            pass
    elif "global" in accountname:
        if "default_profile" in config["global"]:
            default_profile = config["global"]["default_profile"]
            if default_profile in accountname:
                try:
                    ps = Pennsieve(default_profile)
                    return default_profile
                except Exception as e:
                    pass
    else:
        for account in accountname:
            ps = Pennsieve(account)
            acc_id = ps.context.id

            if acc_id == "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
                if not config.has_section("global"):
                    config.add_section("global")

                default_acc = config["global"]
                default_acc["default_profile"] = account

                with open(configpath, "w+") as configfile:
                    config.write(configfile)

                return account
    return ""


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


def bf_dataset_account(accountname):
    """
    This function filters dataset dropdowns across SODA by the permissions granted to users.

    Input: BFaccountname
    Output: a filtered dataset list with objects as elements: {"name": dataset's name, "id": dataset's id, "role": permission}

    """
    try:
        bf = Pennsieve(accountname)
    except Exception as e:
        abort(400, str(e))
    
    # bfaccountname = bf.profile.id
    datasets_list = bf.datasets()

    # all_bf_datasets = []

    def filter_dataset(datasets_list, store=None):
        if store is None:
            store = []
        for dataset in datasets_list:
            selected_dataset_id = dataset.id
            user_role = bf._api._get(f"/datasets/{str(selected_dataset_id)}/role")["role"]
            if user_role not in ["viewer", "editor"]:
                store.append(
                    {"id": selected_dataset_id, "name": dataset.name, "role": user_role}
                )
        return store

    # filter_dataset(datasets_list)
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
    Input: User's accountname and the name of the selected dataset

    Output: User's name
    """

    try:
        bf = Pennsieve(accountname)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account.")
    
    bfname = bf.profile.first_name + " " + bf.profile.last_name

    return {"username": bfname}


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
        bf = Pennsieve(accountname)
    except Exception as e:
        abort(400, str(e))

    acc_details = "User email: " + bf.profile.email + "<br>"
    acc_details = acc_details + "Organization: " + bf.context.name

    try: 
        if exists(configpath):
            config = ConfigParser()
            config.read(configpath)

        if not config.has_section("global"):
            config.add_section("global")
            config.set("global", "default_profile", accountname)
        else:
            config["global"]["default_profile"] = accountname

        with open(configpath, "w") as configfile:
            config.write(configfile)

        ## return account details and datasets where such an account has some permission
        return {"account_details": acc_details}

    except Exception as e:
        raise e


def bf_new_dataset_folder(datasetname, accountname):
    """
    Associated with 'Create' button in 'Create new dataset folder'

    Args:
        datasetname: name of the dataset to be created (string)
        accountname: account in which the dataset needs to be created (string)
    Action:
        Creates dataset for the account specified
    """
    try:
        error, c = "", 0
        datasetname = datasetname.strip()

        if check_forbidden_characters_bf(datasetname):
            error = (
                error
                + "A Pennsieve dataset name cannot contain any of the following characters: "
                + forbidden_characters_bf
                + "<br>"
            )
            c += 1

        if not datasetname:
            error = error + "Please enter valid dataset name" + "<br>"
            c += 1

        if datasetname.isspace():
            error = error + "Please enter valid dataset name" + "<br>"
            c += 1

        try:
            bf = Pennsieve(accountname)
        except Exception as e:
            error = error + "Please select a valid Pennsieve account" + "<br>"
            c += 1

        if c > 0:
            abort(400, error)

        dataset_list = [ds.name for ds in bf.datasets()]
        if datasetname in dataset_list:
            abort(400, "Dataset name already exists")
        else:
            d = bf.create_dataset(datasetname)
            return {"id": d.id}

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
        error = (
            error
            + "A Pennsieve dataset name cannot contain any of the following characters: "
            + forbidden_characters_bf
            + "<br>"
        )
        c += 1

    if not datasetname:
        error = error + "Please enter valid new dataset name" + "<br>"
        c += 1

    if datasetname.isspace():
        error = error + "Please enter valid new dataset name" + "<br>"
        c += 1

    try:
        bf = Pennsieve(accountname)
    except Exception as e:
        error = error + "Please select a valid Pennsieve account" + "<br>"
        c += 1

    if c > 0:
        abort(400, error)

    try:
        myds = bf.get_dataset(current_dataset_name)
    except Exception as e:
        error = "Please select a valid Pennsieve dataset"
        abort(400, error)

    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        error_message = "You don't have permissions to change the name of this Pennsieve dataset"
        abort(403, error_message)


    dataset_list = [ds.name for ds in bf.datasets()]
    if datasetname in dataset_list:
        raise Exception("Dataset name already exists")

    myds = bf.get_dataset(current_dataset_name)
    selected_dataset_id = myds.id
    jsonfile = {"name": datasetname}
    bf._api.datasets._put(f"/{str(selected_dataset_id)}", json=jsonfile)


def clear_queue():

    command = [agent_cmd(), "upload-status", "--cancel-all"]

    proc = subprocess.run(command, check=True)  # env=agent_env(?settings?)
    return proc


def agent_running():
    listen_port = 11235

    try:
        # x = "ws://127.0.0.1:11235"
        # create_connection(x).close()
        # CHANGE BACK
        create_connection(socket_address(listen_port)).close()

    except socket.error as e:

        if e.errno == errno.ECONNREFUSED:  # ConnectionRefusedError for Python 3
            return True
        else:
            raise e
    else:
        raise AgentError(
            "The Pennsieve agent is already running. Learn more about how to solve the issue <a href='https://github.com/bvhpatel/SODA/wiki/The-Pennsieve-agent-is-already-running' target='_blank'>here</a>."
        )


def check_agent_install():
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
    ## check if agent is installed
    try:
        validate_agent_installation(Settings())
        return agent_version(Settings())
    except AgentError as e:
        raise AgentError(
            "We highly recommend installing the Pennsieve agent and restarting SODA before you upload any files. Click <a href='https://github.com/bvhpatel/SODA/wiki/Installing-the-Pennsieve-agent' target='_blank'>here</a> for installation instructions."
        ) from e


def agent_version(settings):
    """
    Check whether the agent is installed and at least the minimum version.
    """
    try:
        env = agent_env(settings)
        env["PENNSIEVE_LOG_LEVEL"] = "ERROR"  # Avoid spurious output with the version
        version = subprocess.check_output([agent_cmd(), "version"], env=env)
        return {"agent_version": version.decode().strip()}
    except (AgentError, subprocess.CalledProcessError, EnvironmentError) as e:
        raise AgentError(
            "Agent not installed. Visit https://developer.pennsieve.io/agent for installation directions."
        ) from e


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

    try:
        bf = Pennsieve(accountname)
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    error_message, c = "", 0
    try:
        myds = bf.get_dataset(bfdataset)
    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        did_upload = False
        error_message = error_message + "Please select a valid Pennsieve dataset" + "<br>"
        c += 1

    if not isdir(pathdataset):
        submitdatastatus = "Done"
        error_message = error_message + "Please select a valid local dataset folder" + "<br>"
        did_fail = True
        did_upload = False
        c += 1

    if c > 0:
        abort(400, error_message)

    error, c = "", 0
    total_file_size = 1
    try:
        for path, dirs, files in walk(pathdataset):
            for f in files:
                fp = join(path, f)
                mypathsize = getsize(fp)
                if mypathsize == 0:
                    c += 1
                    error = error + fp + " is 0 KB <br>"
                elif f[0:1] == ".":
                    c += 1
                    error = (
                        error
                        + fp
                        + " is a hidden file not currently allowed during Pennsieve upload. <br>"
                    )
                else:
                    total_file_size += mypathsize
            for d in dirs:
                dp = join(path, d)
                myfoldersize = folder_size(dp)
                if myfoldersize == 0:
                    c += 1
                    error = error + dp + " is empty <br>"
    except Exception as e:
        raise e

    if c > 0:
        submitdatastatus = "Done"
        error = (
            error
            + "<br>Please remove invalid files/folders from your dataset before uploading. If you have hidden files present please remove them before upload. You can find more details <a href='https://github.com/bvhpatel/SODA/wiki/Issues-regarding-hidden-files-or-folders' target='_blank'>here </a> on how to fix this issue."
        )
        did_fail = True
        did_upload = False
        abort(400, error)

    total_file_size = total_file_size - 1

    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager", "editor"]:
        submitdatastatus = "Done"
        error_message = (
            "You don't have permissions for uploading to this Pennsieve dataset"
        )
        did_fail = True
        did_upload = False
        abort(403, error_message)

    ## check if agent is installed
    try:
        validate_agent_installation(Settings())
    except AgentError:
        did_fail = True
        did_upload = False
        raise AgentError(
            "The Pennsieve agent is not installed on your computer. Click <a href='https://github.com/bvhpatel/SODA/wiki/Installing-the-Pennsieve-agent' target='_blank'>here</a> for installation instructions."
        )

    try:
        ## check if agent is running in the background
        agent_running()

        # upload 500 files at a time per folder
        BUCKET_SIZE = 500

        def calluploadfolder():
            try:

                global submitdataprogress
                global submitdatastatus

                myds = bf.get_dataset(bfdataset)

                for filename in listdir(pathdataset):
                    filepath = join(pathdataset, filename)
                    if isdir(filepath):
                        submitdataprogress = (
                            "Uploading folder '%s' to dataset '%s \n' "
                            % (filepath, bfdataset)
                        )
                        # CHANGE BACK
                        # myds.upload(filepath, recursive=True, use_agent=True)
                        myds.upload(filepath, recursive=True)
                    else:
                        submitdataprogress = (
                            "Uploading file '%s' to dataset '%s \n' "
                            % (filepath, bfdataset)
                        )
                        # CHANGE BACK
                        # myds.upload(filepath, use_agent=True)
                        myds.upload(filepath)
                submitdataprogress = "Success: COMPLETED!"
                submitdatastatus = "Done"

            except Exception as e:
                raise e

        def upload_folder_in_buckets():
            global submitdataprogress
            global submitdatastatus
            global uploaded_files
            global did_upload
            global upload_folder_count

            # reset uploaded file counter
            uploaded_files = 0
            upload_folder_count = 0

            # tells the front end if
            did_upload = False

            myds = bf.get_dataset(bfdataset)

            # create the root directory on Pennsieve and store it for later
            root_folder_name = os.path.basename(os.path.normpath(pathdataset))
            root_pennsieve_folder = myds.create_collection(root_folder_name)
            myds.update()
            folders = {root_folder_name: root_pennsieve_folder}
            
            # top down scan through dataset to upload each file/folder
            for dirpath, child_dirs, files in os.walk(pathdataset, topdown=True):
                #  get the current root directory's name not its relative path
                name_of_current_root = os.path.basename(os.path.normpath(dirpath))

                # get the current folder out of the pennsieve folders storage
                current_folder = folders[name_of_current_root]

                # upload the current directory's child directories
                for child_dir in child_dirs:
                    child_dir_pennsieve = current_folder.create_collection(child_dir)
                    current_folder.update()
                    myds.update()
                    # store the folders by their name so they can be accessed when we
                    # need to upload their children folders and files into their directory
                    folders[child_dir] = child_dir_pennsieve

                # upload the current directories files in a bucket
                if len(files) > BUCKET_SIZE:
                    # bucket the upload
                    start_index = end_index = 0
                    # store the aggregate of the amount of files in the folder
                    total_files = len(files)

                    # while startIndex < files.length
                    while start_index < total_files:
                        # set the endIndex to startIndex plus 750
                        end_index = start_index + BUCKET_SIZE - 1

                        # check if the endIndex is out of bounds
                        if end_index >= total_files:
                            # if so set end index to files.length - 1
                            end_index = len(files) - 1

                        # get the 750 files between startIndex and endIndex (inclusive of endIndex)
                        upload_bucket = files[start_index : end_index + 1]

                        # TODO: Construct path in dictionary for better information messages
                        submitdataprogress = (
                            "Uploading folder '%s' to dataset '%s \n' "
                            % (dirpath, bfdataset)
                        )

                        files_with_destination = []

                        # construct upload destination for current bucket
                        for file in upload_bucket:
                            # add the Absolute path so the Agent can find the file
                            file_path = join(dirpath, file)
                            files_with_destination.append(file_path)

                        # get the current OS
                        current_os = platform.system()

                        # Mac builds not able to spawn subprocess from Python at the moment
                        if not current_os == "Darwin":
                            # clear the pennsieve queue
                            clear_queue()

                        # upload the current bucket
                        current_folder.upload(*files_with_destination)
                        current_folder.update()

                        # update the global that tracks the amount of files that have been successfully uploaded
                        # for this upload session
                        uploaded_files = BUCKET_SIZE

                        did_upload = True

                        upload_folder_count += 1

                        # update the start_index to end_index + 1
                        start_index = end_index + 1
                else:

                    if len(files) > 0:
                        submitdataprogress = (
                            "Uploading folder '%s' to dataset '%s \n' "
                            % (dirpath, bfdataset)
                        )

                        files_with_destination = []

                        for file in files:
                            file_path = join(dirpath, file)
                            files_with_destination.append(file_path)

                        # get the current OS
                        current_os = platform.system()

                        # Mac builds not able to spawn subprocess from Python at the moment
                        if not current_os == "Darwin":
                            # clear the pennsieve queue
                            clear_queue()

                        # upload the files
                        current_folder.upload(*files_with_destination)
                        current_folder.update()
                        myds.update()

                        uploaded_files = len(files)
                        upload_folder_count += 1
                        did_upload = True

            # upload completed
            submitdataprogress = "Success: COMPLETED!"
            submitdatastatus = "Done"

        submitprintstatus = "Uploading"
        start_time_bf_upload = time.time()
        initial_bfdataset_size_submit = bf_dataset_size()
        start_submit = 1
        gev = []
        gev.append(gevent.spawn(upload_folder_in_buckets))
        gevent.sleep(0)
        gevent.joinall(gev)
        submitdatastatus = "Done"

        try:
            return gev[0].get()
        except Exception as e:
            did_fail = True
            raise e

    except Exception as e:
        submitdatastatus = "Done"
        did_fail = True
        raise e


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
      selected_bfaccount: name of selected Pennsieve acccount (string)
    Retun:
        list_users : list of users (first name -- last name) associated with the organization of the
        selected Pennsieve account (list of string)
    """

    global namespace_logger
    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, f"{e}")
        
    try:
        # organization_name = bf.context.name
        organization_id = bf.context.id
        list_users = bf._api._get("/organizations/" + str(organization_id) + "/members")
        list_users_first_last = []
        for i in range(len(list_users)):
            # first_last = list_users[i]['firstName'] + ' ' + list_users[i]['lastName']
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
      selected_bfaccount: name of selected Pennsieve acccount (string)
    Return:
        list_teams : list of teams (name) associated with the organization of the
        selected Pennsieve account (list of string)
    Action:
        Provides list of teams belonging to the organization of
        the given Pennsieve account
    """
    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, f"{e}")

    try:
        organization_id = bf.context.id
        list_teams = bf._api._get(f"/organizations/{str(organization_id)}/teams")
        list_teams_name = [list_teams[i]["team"]["name"] for i in range(len(list_teams))]

        list_teams_name.sort()  # Returning the list of teams in alphabetical order
        return {"teams": list_teams_name}
    except Exception as e:
        raise e


def bf_get_permission(selected_bfaccount, selected_bfdataset):

    """
    Function to get permission for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Output:
        list_permission: list of permission (first name -- last name -- role) associated with the
        selected dataset (list of string)
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve account")

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, "Please select a valid Pennsieve dataset" + "<br>")

    try:
        # user permissions
        selected_dataset_id = myds.id
        list_dataset_permission = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/collaborators/users"
        )
        list_dataset_permission_first_last_role = []
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]["firstName"]
            last_name = list_dataset_permission[i]["lastName"]
            role = list_dataset_permission[i]["role"]
            list_dataset_permission_first_last_role.append(
                "User: " + first_name + " " + last_name + " , role: " + role
            )

        # team permissions
        list_dataset_permission_teams = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/collaborators/teams"
        )
        for i in range(len(list_dataset_permission_teams)):
            team_keys = list(list_dataset_permission_teams[i].keys())
            if "role" in team_keys:
                team_name = list_dataset_permission_teams[i]["name"]
                team_role = list_dataset_permission_teams[i]["role"]
                list_dataset_permission_first_last_role.append(
                    "Team: " + team_name + ", role: " + team_role
                )

        # Organization permissions
        list_dataset_permission_organizations = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/collaborators/organizations"
        )
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


def bf_get_current_user_permission(bf, myds):

    """
    Function to get the permission of currently logged in user for a selected dataset

    Args:
        bf: logged Pennsieve acccount (dict)
        myds: selected Pennsieve dataset (dict)
    Output:
        permission of current user (string)
    """

    try:
        selected_dataset_id = myds.id
        return bf._api._get(f"/datasets/{str(selected_dataset_id)}/role")["role"]

    except Exception as e:
        raise e


def bf_add_permission(
    selected_bfaccount, selected_bfdataset, selected_user, selected_role
):

    """
    Function to add/remove permission for a suser to a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_user: name (first name -- last name) of selected Pennsieve user (string)
        selected_role: desired role ('manager', 'viewer', 'editor', 'remove current permissions') (string)
    Return:
        success or error message (string)
    """
    selected_user_id = selected_user
    user_present = False
    error = ""

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        raise abort(400, "Please select a valid Pennsieve account") from e

    c = 0
    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = error + "Please select a valid Pennsieve dataset" + "<br>"
        c += 1

    try:
        # organization_name = bf.context.name
        organization_id = bf.context.id
        list_users = bf._api._get(f"/organizations/{str(organization_id)}/members")
        # dict_users = {}
        # list_users_firstlast = []
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
        raise abort(400, error)
    else:
        try:
            selected_dataset_id = myds.id

            # check that currently logged in user is a manager or a owner of the selected dataset (only manager and owner can change dataset permission)
            current_user = bf._api._get("/user")
            first_name_current_user = current_user["firstName"]
            last_name_current_user = current_user["lastName"]
            list_dataset_permission = bf._api._get(
                "/datasets/" + str(selected_dataset_id) + "/collaborators/users"
            )
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

                bf._api.datasets._del(
                    "/"
                    + str(selected_dataset_id)
                    + "/collaborators/users".format(dataset_id=selected_dataset_id),
                    json={"id": selected_user_id},
                )
                return {"message": "Permission removed for " + selected_user}
            elif selected_role == "owner":
                # check if currently logged in user is owner of selected dataset (only owner can change owner)

                # change owner
                bf._api.datasets._put(
                    "/"
                    + str(selected_dataset_id)
                    + "/collaborators/owner".format(dataset_id=selected_dataset_id),
                    json={"id": selected_user_id},
                )
                return {"message":  "Permission " + "'" + selected_role + "' " + " added for " + selected_user}
            else:
                bf._api.datasets._put(
                    "/"
                    + str(selected_dataset_id)
                    + "/collaborators/users".format(dataset_id=selected_dataset_id),
                    json={"id": selected_user_id, "role": selected_role},
                )
                return {"message": "Permission " + "'" + selected_role + "' " + " added for " + selected_user}
        except Exception as e:
            raise e


def bf_add_permission_team(
    selected_bfaccount, selected_bfdataset, selected_team, selected_role
):

    """
    Function to add/remove permission fo a team to a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_team: name of selected Pennsieve team (string)
        selected_role: desired role ('manager', 'viewer', 'editor', 'remove current permissions') (string)
    Return:
        success or error message (string)
    """

    error = ""

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)


    if selected_team == "SPARC Data Curation Team":
        if bf.context.id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
            abort(403, "Please login under the Pennsieve SPARC Consortium organization to share with the Curation Team")
    if selected_team == "SPARC Embargoed Data Sharing Group":
        if bf.context.id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0":
            abort(403, "Please login under the Pennsieve SPARC Consortium organization to share with the SPARC consortium group")


    c = 0

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = error + "Please select a valid Pennsieve dataset" + "<br>"
        c += 1

    try:
        # organization_name = bf.context.name
        organization_id = bf.context.id
        list_teams = bf._api._get("/organizations/" + str(organization_id) + "/teams")
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
        selected_dataset_id = myds.id
        selected_team_id = dict_teams[selected_team]

        # check that currently logged in user is a manager or a owner of the selected dataset (only manager and owner can change dataset permission)
        current_user = bf._api._get("/user")
        first_name_current_user = current_user["firstName"]
        last_name_current_user = current_user["lastName"]
        list_dataset_permission = bf._api._get(
            "/datasets/" + str(selected_dataset_id) + "/collaborators/users"
        )
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

            bf._api.datasets._del(
                "/"
                + str(selected_dataset_id)
                + "/collaborators/teams".format(dataset_id=selected_dataset_id),
                json={"id": selected_team_id},
            )
            return {"message": "Permission removed for " + selected_team}
        else:
            bf._api.datasets._put(
                "/"
                + str(selected_dataset_id)
                + "/collaborators/teams".format(dataset_id=selected_dataset_id),
                json={"id": selected_team_id, "role": selected_role},
            )
            return {"message": "Permission " + "'" + selected_role + "' " + " added for " + selected_team}
    except Exception as e:
        raise e





def bf_get_subtitle(selected_bfaccount, selected_bfdataset):
    """
    Function to get current subtitle associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        License name, if any, or "No license" message
    """


    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)

    try:
        selected_dataset_id = myds.id
        dataset_info = bf._api._get("/datasets/" + str(selected_dataset_id))

        res = ""
        if "description" in dataset_info["content"]:
            res = dataset_info["content"]["description"]
        return {"subtitle": res}
        # return json.dumps(dataset_info)
    except Exception as e:
        raise Exception(e)





def bf_add_subtitle(selected_bfaccount, selected_bfdataset, input_subtitle):
    """
    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        input_subtitle: subtitle limited to 256 characters (string)
    Action:
        Add/change subtitle for a selected dataset
    Return:
        Success messsge or error
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)

  
    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        error_message = "You don't have permissions for editing metadata on this Pennsieve dataset"
        abort(403, error_message)

    try:
        selected_dataset_id = myds.id
        jsonfile = {"description": input_subtitle}
        bf._api.datasets._put("/" + str(selected_dataset_id), json=jsonfile)
        return{ "message": "Subtitle added!"}
    except Exception as e:
        raise Exception(e)



def bf_get_description(selected_bfaccount, selected_bfdataset):
    """
    Function to get current description associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        Description (string with markdown code)
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)

    try:
        selected_dataset_id = myds.id
        dataset_readme_info = bf._api._get(f"/datasets/{str(selected_dataset_id)}/readme")

        res = dataset_readme_info["readme"]
        return {"description": res}
    except Exception as e:
        raise Exception(e)





def bf_add_description(selected_bfaccount, selected_bfdataset, markdown_input):
    """
    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        markdown_input: description with markdown formatting (string)
    Action:
        Add/change desciption for a selected dataset
    Return:
        Success messsge or error
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)


    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        error_message = "You don't have permissions for editing metadata on this Pennsieve dataset"
        abort(403, error_message)


    try:
        selected_dataset_id = myds.id
        jsonfile = {"readme": markdown_input}
        bf._api.datasets._put(f"/{str(selected_dataset_id)}/readme", json=jsonfile)
        return{ "message": "Description added!"}
    except Exception as e:
        raise Exception(e)





def bf_get_banner_image(selected_bfaccount, selected_bfdataset):
    """
    Function to get url of current banner image associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        url of banner image (string)
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)

    try:
        selected_dataset_id = myds.id
        dataset_banner_info = bf._api._get(f"/datasets/{str(selected_dataset_id)}/banner")

        list_keys = dataset_banner_info.keys()
        if "banner" in list_keys:
            res = dataset_banner_info["banner"]
        else:
            res = "No banner image"
        return {"banner_image": res}
    except Exception as e:
        raise Exception(e)





def bf_add_banner_image(selected_bfaccount, selected_bfdataset, banner_image_path):
    """
    Function to add banner to a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_banner_image: name of selected Pennsieve dataset (data-uri)
    Return:
        Success or error message
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)


    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        error_message = "You don't have permissions for editing metadata on this Pennsieve dataset"
        abort(403, error_message)


    try:
        selected_dataset_id = myds.id

        def upload_image():
            with open(banner_image_path, "rb") as f:
                bf._api._put(f"/datasets/{str(selected_dataset_id)}/banner", files={"banner": f})

        # delete banner image folder if it is located in SODA
        gevent.spawn(upload_image())
        image_folder = dirname(banner_image_path)
        if isdir(image_folder) and ("SODA" in image_folder):
            shutil.rmtree(image_folder, ignore_errors=True)
        return {"message": "Uploaded!"}
    except Exception as e:
        raise Exception(e)





def bf_get_license(selected_bfaccount, selected_bfdataset):
    """
    Function to get current license associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        License name, if any, or "No license" message
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)

    try:
        selected_dataset_id = myds.id
        dataset_info = bf._api._get(f"/datasets/{str(selected_dataset_id)}")
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
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_license: name of selected license (string)
    Action:
        Add/change license for a selected dataset
    Return:
        Success messsge or error
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)


    role = bf_get_current_user_permission(bf, myds)
    if role not in ["owner", "manager"]:
        error_message = "You don't have permissions for editing metadata on this Pennsieve dataset"
        abort(403, error_message)


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
        error = "Please select a valid license"
        abort(403, error)
    selected_dataset_id = myds.id
    jsonfile = {"license": selected_license}
    try: 
        bf._api.datasets._put(f"/{str(selected_dataset_id)}", json=jsonfile)
    except Exception as e:
        raise Exception(e) from e
    return {"message": "License added!"}






def bf_get_dataset_status(selected_bfaccount, selected_bfdataset):
    """
    Function to get current status for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
    Return:
        List of available status options for the account (list of string).
        Current dataset status (string)
    """

    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        error_message = "Please select a valid Pennsieve account"
        abort(400, error_message)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error_message = "Please select a valid Pennsieve dataset"
        abort(400, error_message)

    try:
        # get list of available status options
        organization_id = bf.context.id
        list_status = bf._api._get(f"/organizations/{str(organization_id)}/dataset-status")

        # get current status of select dataset
        selected_dataset_id = myds.id
        dataset_current_status = bf._api._get(f"/datasets/{str(selected_dataset_id)}")["content"]["status"]

        return {"status_options": list_status, "current_status": dataset_current_status}
    except Exception as e:
        raise e


"""
    Function to get current status for a selected dataset

    Args:
        selected_bfaccount: name of selected Pennsieve acccount (string)
        selected_bfdataset: name of selected Pennsieve dataset (string)
        selected_status: display name of selected status (string)
    Return:
        success message
    """


def bf_change_dataset_status(selected_bfaccount, selected_bfdataset, selected_status):
    try:
        bf = Pennsieve(selected_bfaccount)
    except Exception as e:
        abort(400, str(e))

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        abort(400, str(e))

    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner", "manager"]:
            abort(403, "You don't have permissions for changing the status of this Pennsieve dataset")
    except Exception as e:
        raise e

    try:
        # find name corresponding to display name or show error message
        organization_id = bf.context.id
        list_status = bf._api._get(
            "/organizations/" + str(organization_id) + "/dataset-status"
        )
        c = 0
        for option in list_status:
            if option["displayName"] == selected_status:
                new_status = option["name"]
                c += 1
                break
        if c == 0:
            abort(400, "Selected status is not available for this Pennsieve account.")

        # gchange dataset status
        selected_dataset_id = myds.id
        jsonfile = {"status": new_status}
        bf._api.datasets._put("/" + str(selected_dataset_id), json=jsonfile)
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

    ps = get_authenticated_ps(selected_account)

    myds = get_dataset(ps, selected_dataset)

    return ps._api._get(f"/datasets/{myds.id}/readme")



def update_dataset_readme(selected_account, selected_dataset, updated_readme):
    """
    Update the readme of a dataset on Pennsieve with the given readme string.
    """

    ps = get_authenticated_ps(selected_account)

    myds = get_dataset(ps, selected_dataset)

    role = bf_get_current_user_permission(ps, myds)
    if role not in ["owner", "manager"]:
        abort(403, "You don't have permissions to modify this dataset.")


    ps._api._put(f"/datasets/{myds.id}/readme", json={"readme": updated_readme})

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

    ps = get_authenticated_ps(selected_account)

    myds = get_dataset(ps, selected_dataset)

    resp = ps._api._get(f"/datasets/{myds.id}")

    tags = resp["content"]["tags"] if "tags" in resp["content"] else []

    return {"tags": tags}




def update_dataset_tags(selected_account, selected_dataset, updated_tags):
    """
    Update the tags of a dataset on Pennsieve with the given tags list.
    """

    ps = get_authenticated_ps(selected_account)

    myds = get_dataset(ps, selected_dataset)

    # check user permissions
    role = bf_get_current_user_permission(ps, myds)
    if role not in ["owner", "manager"]:
        abort(403, "You don't have permissions to modify this dataset.")


    ps._api._put(f"/datasets/{myds.id}", json={"tags": updated_tags})

    return {"message": "Tags updated"}

    