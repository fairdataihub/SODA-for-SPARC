### Import required python modules
from logging import exception
from tabnanny import check
from turtle import update
from gevent import monkey

monkey.patch_all()
import platform
import os
from os import listdir, replace, stat, makedirs, mkdir, walk, remove, pardir
from os.path import (
    isdir,
    isfile,
    join,
    splitext,
    getmtime,
    basename,
    normpath,
    exists,
    expanduser,
    split,
    dirname,
    getsize,
    abspath,
)
import pandas as pd
import time
from time import strftime, localtime
import shutil
from shutil import copy2
from configparser import ConfigParser
import numpy as np
from collections import defaultdict
import subprocess
from websocket import create_connection
import socket
import errno
import re
import gevent
from pennsieve import Pennsieve
from pennsieve.log import get_logger
from pennsieve.api.agent import agent_cmd
from pennsieve.api.agent import AgentError, check_port, socket_address
from urllib.request import urlopen
import json
import collections
from threading import Thread
import pathlib

from openpyxl import load_workbook
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font
from docx import Document

from datetime import datetime, timezone

from pysoda import bf_get_current_user_permission


### Global variables
create_soda_json_progress = 0
create_soda_json_total_items = 0
create_soda_json_completed = 0
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

## these subsequent CheckLeafValue and traverseForLeafNodes functions check for the validity of file paths,
## and folder and file size

### Internal functions
def TZLOCAL():
    return datetime.now(timezone.utc).astimezone().tzinfo


def checkLeafValue(leafName, leafNodeValue):

    error, c = "", 0
    total_dataset_size = 1
    curatestatus = ""

    if isinstance(leafNodeValue, list):
        filePath = leafNodeValue[0]

        if exists(filePath):
            filePathSize = getsize(filePath)
            if filePathSize == 0:
                c += 1
                error = error + filePath + " is 0 KB <br>"
            else:
                total_dataset_size += filePathSize
        else:
            c += 1
            error = error + filePath + " doesn not exist! <br>"

    elif isinstance(leafNodeValue, dict):
        c += 1
        error = error + leafName + " is empty <br>"

    if c > 0:
        error = (
            error
            + "<br>Please remove invalid files/folders from your dataset and try again"
        )
        curatestatus = "Done"
        raise Exception(error)

    else:
        return [True, total_dataset_size - 1]


def traverseForLeafNodes(jsonStructure):

    total_dataset_size = 1

    for key in jsonStructure:
        if isinstance(jsonStructure[key], list):

            returnedOutput = checkLeafValue(key, jsonStructure[key])

            # returnedOutput = [True, total_dataset_size-1]
            if returnedOutput[0]:
                total_dataset_size += returnedOutput[1]

        else:

            if len(jsonStructure[key]) == 0:
                returnedOutput = checkLeafValue(key, jsonStructure[key])

            else:
                # going one step down in the object tree
                traverseForLeafNodes(jsonStructure[key])

    return total_dataset_size


######## CREATE FILES FOR CURATE_DATASET FUNCTION
def createFiles(jsonpath, fileKey, distdir, listallfiles):
    # fileKey is the key in json structure that is a file (meaning that its value is an array)
    # note: this fileKey can be the new name of the file (if renamed by users in SODA)
    # (or can be the original basename)

    srcfile = jsonpath[fileKey][0]
    distfile = distdir
    listallfiles.append([srcfile, distfile])


def ignore_empty_high_level_folders(jsonObject):
    items_to_delete = [
        folder for folder in jsonObject.keys() if len(jsonObject[folder].keys()) == 0
    ]

    for item in items_to_delete:
        del jsonObject[item]

    return jsonObject


def generate_dataset_locally(destinationdataset, pathdataset, newdatasetname, jsonpath):
    """
    Associated with 'Generate' button in the 'Generate dataset' section of SODA interface
    Checks validity of files / paths / folders and then generates the files and folders
    as requested along with progress status

    Args:
        destinationdataset: type of destination dataset ('modify existing', 'create new', or 'upload to Pennsieve')
        pathdataset: destination path of new dataset if created locally or name of Pennsieve account (string)
        newdatasetname: name of the local dataset or name of the dataset on Pennsieve (string)
        manifeststatus: boolean to check if user request manifest files
        jsonpath: path of the files to be included in the dataset (dictionary)
    """
    global curatestatus  # set to 'Done' when completed or error to stop progress tracking from front-end
    global curateprogress  # GUI messages shown to user to provide update on progress
    global curateprintstatus  # If = "Curating" Progress messages are shown to user
    global total_dataset_size  # total size of the dataset to be generated
    global curated_dataset_size  # total size of the dataset generated (locally or on Pennsieve) at a given time
    global start_time
    global bf
    global myds
    global upload_directly_to_bf
    global start_submit
    global initial_bfdataset_size

    curateprogress = " "
    curatestatus = ""
    curateprintstatus = " "
    error, c = "", 0
    curated_dataset_size = 0
    start_time = 0
    upload_directly_to_bf = 0
    start_submit = 0
    initial_bfdataset_size = 0

    jsonstructure_non_empty = ignore_empty_high_level_folders(jsonpath)

    if destinationdataset == "create new":
        if not isdir(pathdataset):
            curatestatus = "Done"
            raise Exception("Error: Please select a valid folder for new dataset")
        if not newdatasetname:
            curatestatus = "Done"
            raise Exception("Error: Please enter a valid name for new dataset folder")
        if check_forbidden_characters(newdatasetname):
            curatestatus = "Done"
            raise Exception(
                "Error: A folder name cannot contain any of the following characters "
                + forbidden_characters
            )

    total_dataset_size = 1

    # check if path in jsonpath are valid and calculate total dataset size
    total_dataset_size = traverseForLeafNodes(jsonstructure_non_empty)
    total_dataset_size = total_dataset_size - 1

    # CREATE NEW
    if destinationdataset == "create new":
        try:
            listallfiles = []
            pathnewdatasetfolder = join(pathdataset, newdatasetname)
            pathnewdatasetfolder = return_new_path(pathnewdatasetfolder)
            open_file(pathnewdatasetfolder)

            curateprogress = "Started"
            curateprintstatus = "Curating"
            start_time = time.time()
            start_submit = 1

            pathdataset = pathnewdatasetfolder
            mkdir(pathdataset)
            create_dataset(pathdataset, jsonstructure_non_empty, listallfiles)

            curateprogress = "New dataset created"
            curateprogress = "Success: COMPLETED!"
            curatestatus = "Done"

        except Exception as e:
            curatestatus = "Done"
            raise e


def create_folder_level_manifest(jsonpath, jsondescription):
    """
    Function to create manifest files for each SPARC folder.
    Files are created in a temporary folder

    Args:
        datasetpath: path of the dataset (string)
        jsonpath: all paths in json format with key being SPARC folder names (dictionary)
        jsondescription: description associated with each path (dictionary)
    Action:
        Creates manifest files in xslx format for each SPARC folder
    """
    global total_dataset_size
    local_timezone = TZLOCAL()

    try:
        datasetpath = metadatapath
        shutil.rmtree(datasetpath) if isdir(datasetpath) else 0
        makedirs(datasetpath)
        folders = list(jsonpath.keys())
        if "main" in folders:
            folders.remove("main")
        # In each SPARC folder, generate a manifest file
        for folder in folders:
            if jsonpath[folder] != []:
                # Initialize dataframe where manifest info will be stored
                df = pd.DataFrame(
                    columns=[
                        "filename",
                        "timestamp",
                        "description",
                        "file type",
                        "Additional Metadata",
                    ]
                )
                # Get list of files/folders in the the folder
                # Remove manifest file from the list if already exists
                folderpath = join(datasetpath, folder)
                allfiles = jsonpath[folder]
                alldescription = jsondescription[folder + "_description"]
                manifestexists = join(folderpath, "manifest.xlsx")

                countpath = -1
                for pathname in allfiles:
                    countpath += 1
                    if (
                        basename(pathname) == "manifest.csv"
                        or basename(pathname) == "manifest.xlsx"
                    ):
                        allfiles.pop(countpath)
                        alldescription.pop(countpath)

                # Populate manifest dataframe
                filename, timestamp, filetype, filedescription = [], [], [], []
                countpath = -1
                for paths in allfiles:
                    if isdir(paths):
                        key = basename(paths)
                        alldescription.pop(0)
                        for subdir, dirs, files in os.walk(paths):
                            for file in files:
                                gevent.sleep(0)
                                filepath = pathlib.Path(paths) / subdir / file
                                mtime = filepath.stat().st_mtime
                                lastmodtime = datetime.fromtimestamp(mtime).astimezone(
                                    local_timezone
                                )
                                timestamp.append(
                                    lastmodtime.isoformat()
                                    .replace(".", ",")
                                    .replace("+00:00", "Z")
                                )
                                full_filename = filepath.name

                                if folder == "main":  # if file in main folder
                                    filename.append(
                                        full_filename
                                    ) if folder == "" else filename.append(
                                        join(folder, full_filename)
                                    )
                                else:
                                    subdirname = os.path.relpath(
                                        subdir, paths
                                    )  # gives relative path of the directory of the file w.r.t paths
                                    if subdirname == ".":
                                        filename.append(join(key, full_filename))
                                    else:
                                        filename.append(
                                            join(key, subdirname, full_filename)
                                        )

                                fileextension = splitext(full_filename)[1]
                                if (
                                    not fileextension
                                ):  # if empty (happens e.g. with Readme files)
                                    fileextension = "None"
                                filetype.append(fileextension)
                                filedescription.append("")
                    else:
                        gevent.sleep(0)
                        countpath += 1
                        filepath = pathlib.Path(paths)
                        file = filepath.name
                        filename.append(file)
                        mtime = filepath.stat().st_mtime
                        lastmodtime = datetime.fromtimestamp(mtime).astimezone(
                            local_timezone
                        )
                        timestamp.append(
                            lastmodtime.isoformat()
                            .replace(".", ",")
                            .replace("+00:00", "Z")
                        )
                        filedescription.append(alldescription[countpath])
                        if isdir(paths):
                            filetype.append("folder")
                        else:
                            fileextension = splitext(file)[1]
                            if (
                                not fileextension
                            ):  # if empty (happens e.g. with Readme files)
                                fileextension = "None"
                            filetype.append(fileextension)

                df["filename"] = filename
                df["timestamp"] = timestamp
                df["file type"] = filetype
                df["description"] = filedescription

                makedirs(folderpath)
                # Save manifest as Excel sheet
                manifestfile = join(folderpath, "manifest.xlsx")
                df.to_excel(manifestfile, index=None, header=True)
                total_dataset_size += path_size(manifestfile)
                jsonpath[folder].append(manifestfile)

        return jsonpath

    except Exception as e:
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


def open_file(file_path):
    """
    Opening folder on all platforms
    https://stackoverflow.com/questions/6631299/python-opening-a-folder-in-explorer-nautilus-mac-thingie

    Args:
        file_path: path of the folder (string)
    Action:
        Opens file explorer window to the given path
    """
    try:
        if platform.system() == "Windows":
            subprocess.Popen(r"explorer /select," + str(file_path))
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", file_path])
        else:
            subprocess.Popen(["xdg-open", file_path])
    except Exception as e:
        raise e


def bf_dataset_size():
    """
    Function to get storage size of a dataset on Pennsieve
    """
    global bf
    global myds

    try:
        selected_dataset_id = myds.id
        bf_response = bf._api._get("/datasets/" + str(selected_dataset_id))
        return bf_response["storage"] if "storage" in bf_response.keys() else 0
    except Exception as e:
        raise e


def path_size(path):
    """
    Returns size of the path, after checking if it's a folder or a file
    Args:
        path: path of the file/folder (string)
    Returns:
        total_size: total size of the file/folder in bytes (integer)
    """
    if isdir(path):
        return folder_size(path)
    else:
        return getsize(path)


def mycopyfile_with_metadata(src, dst, *, follow_symlinks=True):
    """
    Copy file src to dst with metadata (timestamp, permission, etc.) conserved

    Args:
        src: source file (string)
        dst: destination file (string)
    Returns:
        dst
    """
    if not follow_symlinks and os.path.islink(src):
        os.symlink(os.readlink(src), dst)
    else:
        with open(src, "rb") as fsrc:
            with open(dst, "wb") as fdst:
                mycopyfileobj(fsrc, fdst)
    shutil.copystat(src, dst)
    return dst


def mycopyfileobj(fsrc, fdst, length=16 * 1024 * 16):
    """
    Helper function to copy file

    Args:
        fsrc: source file opened in python (file-like object)
        fdst: destination file accessed in python (file-like object)
        length: copied buffer size in bytes (integer)
    """
    global curateprogress
    global total_dataset_size
    global curated_dataset_size
    while True:
        buf = fsrc.read(length)
        if not buf:
            break
        gevent.sleep(0)
        fdst.write(buf)
        curated_dataset_size += len(buf)


def return_new_path(topath):
    """
    This function checks if a folder already exists and in such cases,
    appends (2) or (3) etc. to the folder name

    Args:
        topath: path where the folder is supposed to be created (string)
    Returns:
        topath: new folder name based on the availability in destination folder (string)
    """
    if exists(topath):
        i = 2
        while True:
            if not exists(topath + " (" + str(i) + ")"):
                return topath + " (" + str(i) + ")"
            i += 1
    else:
        return topath


def create_dataset(recursivePath, jsonStructure, listallfiles):
    """
    Associated with 'Create new dataset locally' option of SODA interface
    for creating requested folders and files to the destination path specified

    Args:
        recursivePath: destination path for creating new folders and files (recursively) (string)
        jsonStructure: all paths (dictionary)
    Action:
        Creates the folders and files specified
    """

    global curateprogress

    for key in jsonStructure:

        if isinstance(jsonStructure[key], dict):

            if not exists(join(recursivePath, key)):
                mkdir(join(recursivePath, key))

            outputpath = join(recursivePath, key)

            create_dataset(outputpath, jsonStructure[key], listallfiles)

        elif isinstance(jsonStructure[key], list):

            outputpath = join(recursivePath, key)

            createFiles(jsonStructure, key, outputpath, listallfiles)

            for fileinfo in listallfiles:
                srcfile = fileinfo[0]
                distfile = fileinfo[1]
                curateprogress = "Copying " + str(srcfile)

                mycopyfile_with_metadata(srcfile, distfile)


def create_soda_json_object_backend(
    soda_json_structure, root_folder_path, irregularFolders, replaced
):
    """
    Function for importing files from local machine into json structure
    """
    global create_soda_json_progress  # amount of items counted during recursion
    global create_soda_json_total_items  # counts the total items in folder
    global create_soda_json_completed  # completed progress is either 0 or 1

    high_level_sparc_folders = [
        "code",
        "derivative",
        "docs",
        "primary",
        "protocol",
        "source",
    ]

    dataset_folder = soda_json_structure["dataset-structure"] = {"folders": {}}

    def recursive_structure_create(dataset_structure, folder_path):
        global create_soda_json_progress
        # going within high level folders
        # add manifest details if manifest exists
        manifest_object = {
            "filename": "",
            "timestamp": "",
            "description": "",
            "additional-metadata": "",
        }

        lastSlash = folder_path.rfind("/") + 1
        folder_name = folder_path[lastSlash:]
        if folder_name in replaced:
            folder_name = (
                folder_path[:lastSlash]
                + dataset_structure[folder_name]["original-name"]
            )
        # finds the last / in the path and that is the folder name
        if folder_path in irregularFolders:
            index_check = irregularFolders.index(folder_path)
            modified_name = replaced[index_check]
            folder_path = irregularFolders[index_check]
        entries = os.listdir(folder_path)
        for entry in entries:
            gevent.sleep(0)
            check_path = folder_path + "/" + entry
            if os.path.isfile(check_path) is True:
                # check manifest to add metadata
                if entry[0:1] != ".":
                    create_soda_json_progress += 1
                if entry[0:1] != "." and entry[0:8] != "manifest":
                    # no hidden files or manifest files included
                    if folder_name in soda_json_structure["starting-point"]:
                        if (
                            soda_json_structure["starting-point"][folder_name]["path"]
                            != ""
                        ):
                            # checks if there is a path to a manifest
                            manifest_path = soda_json_structure["starting-point"][
                                folder_name
                            ]["path"]
                            ext_index = manifest_path.rfind(".")
                            extension = manifest_path[ext_index:]
                            if extension == ".xlsx":
                                for key in soda_json_structure["starting-point"][
                                    folder_name
                                ]["manifest"]:
                                    # description metadata
                                    if key["filename"] == entry:
                                        if key["description"] != "":
                                            manifest_object["description"] = key[
                                                "description"
                                            ]
                                        else:
                                            manifest_object["description"] = ""
                                    # additional metadata
                                    if key["Additional Metadata"] != "":
                                        manifest_object["additional-metadata"] = key[
                                            "Additional Metadata"
                                        ]
                                    else:
                                        manifest_object["additional-metadata"] = ""
                            elif extension == ".csv":
                                for key in soda_json_structure["starting-point"][
                                    folder_name
                                ]["manifest"]:
                                    if (
                                        soda_json_structure["starting-point"][
                                            folder_name
                                        ]["manifest"][key]["filename"]
                                        == entry
                                    ):
                                        if (
                                            soda_json_structure["starting-point"][
                                                folder_name
                                            ][key]["description"]
                                            != None
                                        ):
                                            manifest_object[
                                                "description"
                                            ] = soda_json_structure["starting-point"][
                                                folder_name
                                            ][
                                                key
                                            ][
                                                "description"
                                            ]
                                        else:
                                            manifest_object["description"] = ""
                                    if (
                                        soda_json_structure["starting-point"][
                                            folder_name
                                        ]["manifest"][key]["Additional Metadata"]
                                        != None
                                    ):
                                        manifest_object[
                                            "additional-metadata"
                                        ] = soda_json_structure["starting-point"][
                                            folder_name
                                        ][
                                            "manifest"
                                        ][
                                            key
                                        ][
                                            "Additional Metadata"
                                        ]
                                    else:
                                        manifest_object["additional-metadata"] = ""
                    # create json
                    dataset_structure["files"][entry] = {
                        "path": check_path,
                        "type": "local",
                        "action": ["existing"],
                        "description": manifest_object["description"],
                        "additional-metadata": manifest_object["additional-metadata"],
                    }
            elif os.path.isdir(check_path) is True:
                create_soda_json_progress += 1
                if check_path in irregularFolders:
                    index_check = irregularFolders.index(check_path)
                    modified_name = replaced[index_check]

                    dataset_structure["folders"][modified_name] = {
                        "folders": {},
                        "files": {},
                        "path": check_path,
                        "type": "local",
                        "action": ["existing"],
                        "original-name": entry,
                    }
                    for folder in dataset_structure["folders"][modified_name][
                        "folders"
                    ]:
                        updated_path = dataset_structure["folders"][modified_name][
                            folder
                        ]["path"]
                        recursive_structure_create(
                            dataset_structure["folders"][modified_name][folder],
                            updated_path,
                        )
                else:
                    dataset_structure["folders"][entry] = {
                        "folders": {},
                        "files": {},
                        "path": check_path,
                        "type": "local",
                        "action": ["existing"],
                    }

        for folder in dataset_structure["folders"]:
            updated_path = dataset_structure["folders"][folder]["path"]
            recursive_structure_create(
                dataset_structure["folders"][folder], updated_path
            )

    # BEGIN

    # count the amount of items in folder
    create_soda_json_total_items = 0
    for root, dirs, filenames in os.walk(root_folder_path):
        for Dir in dirs:
            if Dir[0:1] != "." and Dir[0:8] != "manifest":
                create_soda_json_total_items += 1
        for fileName in filenames:
            if fileName[0:1] != ".":
                create_soda_json_total_items += 1

    # reading high level folders
    create_soda_json_completed = 0
    create_soda_json_progress = 0
    entries = os.listdir(root_folder_path)

    for entry in entries:
        gevent.sleep(0)
        item_path = root_folder_path + "/" + entry
        if os.path.isfile(item_path) is True:
            if entry[0:1] != ".":
                create_soda_json_progress += 1
                soda_json_structure["metadata-files"][entry] = {
                    "path": item_path,
                    "type": "local",
                    "action": ["existing"],
                }
            # do file work here
        elif os.path.isdir(item_path) is True:
            create_soda_json_progress += 1
            # add item to soda
            if item_path in irregularFolders:
                index_check = irregularFolders.index(item_path)
                modified_name = replaced[index_check]
                folder_name = modified_name
                dataset_folder["folders"][folder_name] = {
                    "folders": {},
                    "files": {},
                    "path": item_path,
                    "type": "local",
                    "action": ["existing"],
                    "original-basename": item_path[(item_path.rfind("/") + 1) :],
                }
            else:
                if entry in high_level_sparc_folders:
                    dataset_folder["folders"][entry] = {
                        "folders": {},
                        "files": {},
                        "path": item_path,
                        "type": "local",
                        "action": ["existing"],
                    }
            soda_json_structure["starting-point"][entry] = {"path": ""}

    for folder in dataset_folder["folders"]:
        high_lvl_path = root_folder_path + "/" + folder
        temp_csv = high_lvl_path + "/manifest.csv"
        temp_xlsx = high_lvl_path + "/manifest.xlsx"
        if os.path.exists(temp_csv) == True:
            temp_file_path_csv = root_folder_path + "/" + folder + "/" + "manifest.csv"
            csv_data = pd.read_csv(temp_file_path_csv)
            csv_data.fillna("", inplace=True)
            json_format = csv_data.to_dict(orient="records")
            soda_json_structure["starting-point"][folder]["path"] = temp_file_path_csv
            soda_json_structure["starting-point"][folder]["manifest"] = json_format
        if os.path.exists(temp_xlsx) == True:
            temp_file_path_xlsx = (
                root_folder_path + "/" + folder + "/" + "manifest.xlsx"
            )
            excel_data = pd.read_excel(temp_file_path_xlsx, sheet_name="Sheet1")
            excel_data.fillna("", inplace=True)
            json_format = excel_data.to_dict(orient="records")
            soda_json_structure["starting-point"][folder]["path"] = temp_file_path_xlsx
            soda_json_structure["starting-point"][folder]["manifest"] = json_format
        recursive_structure_create(dataset_folder["folders"][folder], high_lvl_path)

    create_soda_json_completed = 1
    return soda_json_structure


def monitor_local_json_progress():
    """
    Function for monitoring progress of json_object_creation
    Used for progress bar
    """
    global create_soda_json_completed
    global create_soda_json_total_items
    global create_soda_json_progress
    progress_percentage = (
        create_soda_json_progress / create_soda_json_total_items
    ) * 100

    res = [
        create_soda_json_progress,
        create_soda_json_total_items,
        progress_percentage,
        create_soda_json_completed,
    ]
    return res


def bf_get_dataset_files_folders(soda_json_structure, requested_sparc_only=True):
    """
    Function for importing Pennsieve data files info into the "dataset-structure" key of the soda json structure,
    including metadata from any existing manifest files in the high-level folders
    (name, id, timestamp, description, additional metadata)

    Args:
        soda_json_structure: soda structure with bf account and dataset info available
    Output:
        same soda structure with Pennsieve data file info included under the "dataset-structure" key
    """

    high_level_sparc_folders = [
        "code",
        "derivative",
        "docs",
        "primary",
        "protocol",
        "source",
    ]
    manifest_sparc = ["manifest.xlsx", "manifest.csv"]
    high_level_metadata_sparc = [
        "submission.xlsx",
        "submission.csv",
        "submission.json",
        "dataset_description.xlsx",
        "dataset_description.csv",
        "dataset_description.json",
        "subjects.xlsx",
        "subjects.csv",
        "subjects.json",
        "samples.xlsx",
        "samples.csv",
        "samples.json",
        "README.txt",
        "CHANGES.txt",
        "code_description.xlsx",
        "inputs_metadata.xlsx",
        "outputs_metadata.xlsx",
    ]
    manifest_error_message = []
    double_extensions = [
        ".ome.tiff",
        ".ome.tif",
        ".ome.tf2,",
        ".ome.tf8",
        ".ome.btf",
        ".ome.xml",
        ".brukertiff.gz",
        ".mefd.gz",
        ".moberg.gz",
        ".nii.gz",
        ".mgh.gz",
        ".tar.gz",
        ".bcl.gz",
    ]

    # f = open("dataset_contents.soda", "a")

    def verify_file_name(file_name, extension):
        if extension == "":
            return file_name

        double_ext = False
        for ext in double_extensions:
            if file_name.find(ext) != -1:
                double_ext = True
                break

        extension_from_name = ""

        if double_ext == False:
            extension_from_name = os.path.splitext(file_name)[1]
        else:
            extension_from_name = (
                os.path.splitext(os.path.splitext(file_name)[0])[1]
                + os.path.splitext(file_name)[1]
            )

        if extension_from_name == ("." + extension):
            return file_name
        else:
            return file_name + ("." + extension)

    # Add a new key containing the path to all the files and folders on the
    # local data structure..
    def recursive_item_path_create(folder, path):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if "bfpath" not in folder["files"][item]:
                    folder["files"][item]["bfpath"] = path[:]

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                if "bfpath" not in folder["folders"][item]:
                    folder["folders"][item]["bfpath"] = path[:]
                    folder["folders"][item]["bfpath"].append(item)
                recursive_item_path_create(
                    folder["folders"][item], folder["folders"][item]["bfpath"][:]
                )
        return

    level = 0

    def recursive_dataset_import(
        my_item, dataset_folder, metadata_files, my_folder_name, my_level, manifest_dict
    ):
        level = 0
        col_count = 0
        file_count = 0

        for item in my_item:
            if item.type == "Collection":
                if "folders" not in dataset_folder:
                    dataset_folder["folders"] = {}
                if "files" not in dataset_folder:
                    dataset_folder["files"] = {}
                col_count += 1
                folder_name = item.name
                if (
                    my_level == 0
                    and folder_name not in high_level_sparc_folders
                    and requested_sparc_only
                ):  # only import SPARC folders
                    col_count -= 1
                    continue
                if col_count == 1:
                    level = my_level + 1
                dataset_folder["folders"][folder_name] = {
                    "type": "bf",
                    "action": ["existing"],
                    "path": item.id,
                }
                sub_folder = dataset_folder["folders"][folder_name]
                if "folders" not in sub_folder:
                    sub_folder["folders"] = {}
                if "files" not in sub_folder:
                    sub_folder["files"] = {}
                recursive_dataset_import(
                    item, sub_folder, metadata_files, folder_name, level, manifest_dict
                )
            else:
                if "folders" not in dataset_folder:
                    dataset_folder["folders"] = {}
                if "files" not in dataset_folder:
                    dataset_folder["files"] = {}
                package_id = item.id
                package_details = bf._api._get("/packages/" + str(package_id))
                if "extension" not in package_details:
                    file_name = verify_file_name(package_details["content"]["name"], "")
                else:
                    file_name = verify_file_name(
                        package_details["content"]["name"], package_details["extension"]
                    )

                if my_level == 0 and file_name in high_level_metadata_sparc:
                    metadata_files[file_name] = {
                        "type": "bf",
                        "action": ["existing"],
                        "path": item.id,
                    }

                else:
                    file_count += 1
                    if my_level == 1 and file_name in manifest_sparc:
                        file_details = bf._api._get(
                            "/packages/" + str(package_id) + "/view"
                        )
                        file_id = file_details[0]["content"]["id"]
                        manifest_url = bf._api._get(
                            "/packages/" + str(package_id) + "/files/" + str(file_id)
                        )
                        df = ""
                        try:
                            if file_name.lower() == "manifest.xlsx":
                                df = pd.read_excel(
                                    manifest_url["url"], engine="openpyxl"
                                )
                            else:
                                df = pd.read_csv(manifest_url["url"])
                            manifest_dict[my_folder_name] = df
                        except Exception as e:
                            manifest_error_message.append(
                                package_details["parent"]["content"]["name"]
                            )
                            pass
                    else:
                        timestamp = (
                            package_details["content"]["createdAt"]
                            .replace(".", ",")
                            .replace("+00:00", "Z")
                        )
                        dataset_folder["files"][file_name] = {
                            "type": "bf",
                            "action": ["existing"],
                            "path": item.id,
                            "timestamp": timestamp,
                        }

    def recursive_manifest_info_import(my_folder, my_relative_path, manifest_df):

        if "files" in my_folder.keys():
            for file_key, file in my_folder["files"].items():
                filename = join(my_relative_path, file_key)
                colum_headers = manifest_df.columns.tolist()
                filename = filename.replace("\\", "/")

                if filename in list(manifest_df["filename"].values):
                    if "description" in colum_headers:
                        mydescription = manifest_df[
                            manifest_df["filename"] == filename
                        ]["description"].values[0]
                        if mydescription:
                            file["description"] = mydescription
                    if "Additional Metadata" in colum_headers:
                        my_additional_medata = manifest_df[
                            manifest_df["filename"] == filename
                        ]["Additional Metadata"].values[0]
                        if my_additional_medata:
                            file["additional-metadata"] = my_additional_medata
                    if "timestamp" in colum_headers:
                        my_timestamp = manifest_df[manifest_df["filename"] == filename][
                            "timestamp"
                        ].values[0]
                        if my_timestamp:
                            file["timestamp"] = my_timestamp

        if "folders" in my_folder.keys():
            for folder_key, folder in my_folder["folders"].items():
                relative_path = join(my_relative_path, folder_key)

                recursive_manifest_info_import(folder, relative_path, manifest_df)

    # START

    error = []

    # check that the Pennsieve account is valid
    try:
        bf_account_name = soda_json_structure["bf-account-selected"]["account-name"]
    except Exception as e:
        raise e

    try:
        bf = Pennsieve(bf_account_name)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    # check that the Pennsieve dataset is valid
    try:
        bf_dataset_name = soda_json_structure["bf-dataset-selected"]["dataset-name"]
    except Exception as e:
        raise e
    try:
        myds = bf.get_dataset(bf_dataset_name)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)

    # check that the user has permission to edit this dataset
    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner", "manager", "editor"]:
            curatestatus = "Done"
            error.append(
                "Error: You don't have permissions for uploading to this Pennsieve dataset"
            )
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        # import files and folders in the soda json structure
        soda_json_structure["dataset-structure"] = {}
        soda_json_structure["metadata-files"] = {}
        dataset_folder = soda_json_structure["dataset-structure"]
        metadata_files = soda_json_structure["metadata-files"]
        manifest_dict = {}
        folder_name = ""
        recursive_dataset_import(
            myds, dataset_folder, metadata_files, folder_name, level, manifest_dict
        )

        # remove metadata files keys if empty
        metadata_files = soda_json_structure["metadata-files"]
        if not metadata_files:
            del soda_json_structure["metadata-files"]

        dataset_folder = soda_json_structure["dataset-structure"]
        # pull information from the manifest files if they satisfy the SPARC format
        if "folders" in dataset_folder.keys():
            for folder_key in manifest_dict.keys():
                manifest_df = manifest_dict[folder_key]
                manifest_df = manifest_df.fillna("")
                colum_headers = manifest_df.columns.tolist()
                folder = dataset_folder["folders"][folder_key]
                if "filename" in colum_headers:
                    if (
                        "description" in colum_headers
                        or "Additional Metadata" in colum_headers
                    ):
                        relative_path = ""
                        recursive_manifest_info_import(
                            folder, relative_path, manifest_df
                        )

        recursive_item_path_create(soda_json_structure["dataset-structure"], [])
        success_message = (
            "Data files under a valid high-level SPARC folders have been imported"
        )
        return [soda_json_structure, success_message, manifest_error_message]

    except Exception as e:
        raise e


def import_pennsieve_dataset(soda_json_structure, requested_sparc_only=True):
    high_level_sparc_folders = [
        "code",
        "derivative",
        "docs",
        "primary",
        "protocol",
        "source",
    ]
    manifest_sparc = ["manifest.xlsx", "manifest.csv"]
    high_level_metadata_sparc = [
        "submission.xlsx",
        "submission.csv",
        "submission.json",
        "dataset_description.xlsx",
        "dataset_description.csv",
        "dataset_description.json",
        "subjects.xlsx",
        "subjects.csv",
        "subjects.json",
        "samples.xlsx",
        "samples.csv",
        "samples.json",
        "README.txt",
        "CHANGES.txt",
        "code_description.xlsx",
        "inputs_metadata.xlsx",
        "outputs_metadata.xlsx",
    ]
    global create_soda_json_completed
    global create_soda_json_total_items
    global create_soda_json_progress
    create_soda_json_progress = 0
    create_soda_json_total_items = 0
    create_soda_json_completed = 0

    def createFolderStructure(subfolder_json, pennsieve_account, manifest):
        # root level folder will pass subfolders into this function and will recursively check if there are subfolders while creating the json structure
        global create_soda_json_progress
        collection_id = subfolder_json["path"]
        bf = pennsieve_account
        subfolder = bf._api._get("/packages/" + str(collection_id))
        children_content = subfolder["children"]
        for items in children_content:
            item_name = items["content"]["name"]
            create_soda_json_progress += 1
            item_id = items["content"]["id"]
            if item_id[2:9] == "package":
                # if it is a file name check if there are additional manifest information to attach to files
                if (
                    item_name[0:8] != "manifest"
                ):  # manifest files are not being included json structure
                    subfolder_json["files"][item_name] = {
                        "action": ["existing"],
                        "path": item_id,
                        "bfpath": [],
                        "timestamp": items["content"]["createdAt"],
                        "type": "bf",
                    }
                    for paths in subfolder_json["bfpath"]:
                        subfolder_json["files"][item_name]["bfpath"].append(paths)

                    if len(subfolder_json["files"][item_name]["bfpath"]) > 1:
                        temp_name = ""
                        for i in range(
                            len(subfolder_json["files"][item_name]["bfpath"])
                        ):
                            if i == 0:
                                continue
                            temp_name += (
                                subfolder_json["files"][item_name]["bfpath"][i] + "/"
                            )
                        temp_name += item_name
                    else:
                        temp_name = item_name
                    if len(manifest.keys()) > 0:
                        if temp_name in manifest["filename"].values():
                            location_index = list(manifest["filename"].values()).index(
                                temp_name
                            )
                            if manifest["description"][location_index] != "":
                                subfolder_json["files"][item_name][
                                    "description"
                                ] = manifest["description"][location_index]
                            if manifest["Additional Metadata"] != "":
                                subfolder_json["files"][item_name][
                                    "additional-metadata"
                                ] = manifest["Additional Metadata"][location_index]
            else:  # another subfolder found
                subfolder_json["folders"][item_name] = {
                    "action": ["existing"],
                    "path": item_id,
                    "bfpath": [],
                    "files": {},
                    "folders": {},
                    "type": "bf",
                }
                for paths in subfolder_json["bfpath"]:
                    subfolder_json["folders"][item_name]["bfpath"].append(paths)
                subfolder_json["folders"][item_name]["bfpath"].append(item_name)

                # go through recursive again through subfolder

        if len(subfolder_json["folders"].keys()) != 0:  # there are subfolders
            for folder in subfolder_json["folders"].keys():
                subfolder = subfolder_json["folders"][folder]
                createFolderStructure(subfolder, bf, manifest)

    # START

    error = []

    # check that the Pennsieve account is valid
    try:
        bf_account_name = soda_json_structure["bf-account-selected"]["account-name"]
    except Exception as e:
        raise e

    try:
        bf = Pennsieve(bf_account_name)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    # check that the Pennsieve dataset is valid
    try:
        bf_dataset_name = soda_json_structure["bf-dataset-selected"]["dataset-name"]
    except Exception as e:
        raise e
    try:
        myds = bf.get_dataset(bf_dataset_name)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)

    # check that the user has permission to edit this dataset
    try:
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner", "manager", "editor"]:
            curatestatus = "Done"
            error.append(
                "Error: You don't have permissions for uploading to this Pennsieve dataset"
            )
            raise Exception(error)
    except Exception as e:
        raise e

    # surface layer of dataset is pulled. then go through through the children to get information on subfolders
    manifest_dict = {}
    manifest_error_message = []
    soda_json_structure["dataset-structure"] = {
        "files": {},
        "folders": {},
    }

    # root of dataset is pulled here
    # root_children is the files and folders within root
    root_folder = bf._api._get("/datasets/" + str(dataset_id))
    packages_list = bf._api._get("/datasets/" + str(dataset_id) + "/packageTypeCounts")
    for count in packages_list.values():
        create_soda_json_total_items += int(count)
    root_children = root_folder["children"]

    for items in root_children:
        item_id = items["content"]["id"]
        item_name = items["content"]["name"]
        if (item_id[2:9]) == "package":
            if item_name in high_level_metadata_sparc:
                create_soda_json_progress += 1
                # is a metadata file
                soda_json_structure["metadata-files"][item_name] = {
                    "type": "bf",
                    "action": ["existing"],
                    "path": item_id,
                }
        else:
            if item_name in high_level_sparc_folders:
                create_soda_json_progress += 1
                # is a SPARC folder and will be checked recursively
                soda_json_structure["dataset-structure"]["folders"][item_name] = {
                    "type": "bf",
                    "path": item_id,
                    "action": ["existing"],
                    "files": {},
                    "folders": {},
                    "bfpath": [item_name],
                }

    # manifest information is needed so it is looked for before the recursive calls are made
    if len(soda_json_structure["dataset-structure"]["folders"].keys()) != 0:
        for folder in soda_json_structure["dataset-structure"]["folders"].keys():
            collection_id = soda_json_structure["dataset-structure"]["folders"][folder][
                "path"
            ]
            subfolder = bf._api._get("/packages/" + str(collection_id))
            children_content = subfolder["children"]
            for items in children_content:
                # check subfolders surface to see if manifest files exist to then use within recursive_subfolder_check
                manifest_dict[folder] = {}
                package_name = items["content"]["name"]
                package_id = items["content"]["id"]
                if package_name in manifest_sparc:
                    # item is manifest
                    file_details = bf._api._get(
                        "/packages/" + str(package_id) + "/view"
                    )
                    file_id = file_details[0]["content"]["id"]
                    manifest_url = bf._api._get(
                        "/packages/" + str(package_id) + "/files/" + str(file_id)
                    )
                    df = ""
                    try:
                        if package_name.lower() == "manifest.xlsx":
                            df = pd.read_excel(manifest_url["url"], engine="openpyxl")
                            df = df.fillna("")
                        else:
                            df = pd.read_csv(manifest_url["url"])
                            df = df.fillna("")
                        manifest_dict[folder] = df.to_dict()
                    except Exception as e:
                        manifest_error_message.append(
                            items["parent"]["content"]["name"]
                        )
            subfolder_section = soda_json_structure["dataset-structure"]["folders"][
                folder
            ]
            createFolderStructure(
                subfolder_section, bf, manifest_dict[folder]
            )  # passing item's json and the collection ID

    success_message = (
        "Data files under a valid high-level SPARC folders have been imported"
    )
    create_soda_json_completed = 1
    return [
        soda_json_structure,
        success_message,
        manifest_error_message,
        create_soda_json_progress,
        create_soda_json_total_items,
    ]

    # now that we have the user and account info pull the top layer


def monitor_pennsieve_json_progress():
    """
    Function for monitoring progress of soda_json object
    Used for progress bar
    """
    global create_soda_json_completed
    global create_soda_json_total_items
    global create_soda_json_progress
    if create_soda_json_progress != 0:
        progress_percentage = (
            create_soda_json_progress / create_soda_json_total_items
        ) * 100
    else:
        progress_percentage = 0
    res = [
        create_soda_json_progress,
        create_soda_json_total_items,
        progress_percentage,
        create_soda_json_completed,
    ]
    return res


def getCollections(account):
    """
    Function used to get the collections that belong to an organization
    """

    error = []
    try:
        bf = Pennsieve(account)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    collection_names = bf._api._get("/collections/")

    return collection_names


def getCurrentCollectionTags(account, dataset):
    """
    Function used to get collection names of the current dataset
    """
    error = []
    try:
        bf = Pennsieve(account)
    except Exception as error:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    try:
        myds = bf.get_dataset(dataset)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)

    currentCollectionTags = bf._api._get(
        "/datasets/" + str(dataset_id) + "/collections"
    )
    return currentCollectionTags


def uploadCollectionTags(account, dataset, tags):
    """
    Function used to upload the collection tags of a dataset to Pennsieve
    """

    error = []
    statusResponses = []
    try:
        bf = Pennsieve(account)
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve account")
        raise Exception(error)

    try:
        myds = bf.get_dataset(dataset)
        dataset_id = myds.id
    except Exception as e:
        error.append("Error: Please select a valid Pennsieve dataset")
        raise Exception(error)

    for tag in tags:
        result = bf._api._post(
            "/datasets/" + str(dataset_id) + "/collections?collectionId=" + str(tag)
        )
        statusResponses.append(result)

    return statusResponses
