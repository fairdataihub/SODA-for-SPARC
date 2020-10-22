### Import required python modules
import logging

from gevent import monkey; monkey.patch_all()
import platform
import os
from os import listdir, stat, makedirs, mkdir, walk, remove, pardir
from os.path import isdir, isfile, join, splitext, getmtime, basename, normpath, exists, expanduser, split, dirname, getsize, abspath
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
from blackfynn import Blackfynn
from blackfynn.log import get_logger
from blackfynn.api.agent import agent_cmd
from blackfynn.api.agent import AgentError, check_port, socket_address
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

### Global variables
curateprogress = ' '
curatestatus = ' '
curateprintstatus = ' '
total_dataset_size = 1
curated_dataset_size = 0
start_time = 0

userpath = expanduser("~")
configpath = join(userpath, '.blackfynn', 'config.ini')
submitdataprogress = ' '
submitdatastatus = ' '
submitprintstatus = ' '
total_file_size = 1
uploaded_file_size = 0
start_time_bf_upload = 0
start_submit = 0
metadatapath = join(userpath, 'SODA', 'SODA_metadata')

bf = ""
myds = ""
initial_bfdataset_size = 0
upload_directly_to_bf = 0
initial_bfdataset_size_submit = 0

forbidden_characters = '<>:"/\|?*'
forbidden_characters_bf = '\/:*?"<>'

## these subsequent CheckLeafValue and traverseForLeafNodes functions check for the validity of file paths,
## and folder and file size

def checkLeafValue(leafName, leafNodeValue):

    error, c = '', 0
    total_dataset_size = 1
    curatestatus = ''

    if isinstance(leafNodeValue, list):
        filePath = leafNodeValue[0]

        if exists(filePath):
            filePathSize =  getsize(filePath)
            if filePathSize == 0:
                c += 1
                error = error + filePath + ' is 0 KB <br>'
            else:
                total_dataset_size += filePathSize
        else:
            c += 1
            error = error + filePath + ' doesn not exist! <br>'

    elif isinstance(leafNodeValue, dict):
            c += 1
            error = error + leafName + ' is empty <br>'

    if c > 0:
        error = error + '<br>Please remove invalid files/folders from your dataset and try again'
        curatestatus = 'Done'
        raise Exception(error)

    else:
        return [True, total_dataset_size-1]


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
    items_to_delete = [folder for folder in jsonObject.keys() if len(jsonObject[folder].keys()) == 0]

    for item in items_to_delete:
        del jsonObject[item]

    return jsonObject

def generate_dataset_locally(destinationdataset, pathdataset, newdatasetname, jsonpath):
    """
    Associated with 'Generate' button in the 'Generate dataset' section of SODA interface
    Checks validity of files / paths / folders and then generates the files and folders
    as requested along with progress status

    Args:
        destinationdataset: type of destination dataset ('modify existing', 'create new', or 'upload to blackfynn')
        pathdataset: destination path of new dataset if created locally or name of blackfynn account (string)
        newdatasetname: name of the local dataset or name of the dataset on blackfynn (string)
        manifeststatus: boolean to check if user request manifest files
        jsonpath: path of the files to be included in the dataset (dictionary)
    """
    global curatestatus #set to 'Done' when completed or error to stop progress tracking from front-end
    global curateprogress #GUI messages shown to user to provide update on progress
    global curateprintstatus # If = "Curating" Progress messages are shown to user
    global total_dataset_size # total size of the dataset to be generated
    global curated_dataset_size # total size of the dataset generated (locally or on blackfynn) at a given time
    global start_time
    global bf
    global myds
    global upload_directly_to_bf
    global start_submit
    global initial_bfdataset_size

    curateprogress = ' '
    curatestatus = ''
    curateprintstatus = ' '
    error, c = '', 0
    curated_dataset_size = 0
    start_time = 0
    upload_directly_to_bf = 0
    start_submit = 0
    initial_bfdataset_size = 0

    jsonstructure_non_empty = ignore_empty_high_level_folders(jsonpath)

    if destinationdataset == 'create new':
        if not isdir(pathdataset):
            curatestatus = 'Done'
            raise Exception('Error: Please select a valid folder for new dataset')
        if not newdatasetname:
            curatestatus = 'Done'
            raise Exception('Error: Please enter a valid name for new dataset folder')
        if check_forbidden_characters(newdatasetname):
            curatestatus = 'Done'
            raise Exception('Error: A folder name cannot contain any of the following characters ' + forbidden_characters)

    total_dataset_size = 1

    # check if path in jsonpath are valid and calculate total dataset size
    total_dataset_size = traverseForLeafNodes(jsonstructure_non_empty)
    total_dataset_size = total_dataset_size - 1

    # CREATE NEW
    if destinationdataset == 'create new':
        try:
            listallfiles = []
            pathnewdatasetfolder = join(pathdataset, newdatasetname)
            pathnewdatasetfolder  = return_new_path(pathnewdatasetfolder)
            open_file(pathnewdatasetfolder)

            curateprogress = 'Started'
            curateprintstatus = 'Curating'
            start_time = time.time()
            start_submit = 1

            pathdataset = pathnewdatasetfolder
            mkdir(pathdataset)
            create_dataset(pathdataset, jsonstructure_non_empty, listallfiles)

            curateprogress = 'New dataset created'
            curateprogress = 'Success: COMPLETED!'
            curatestatus = 'Done'

        except Exception as e:
            curatestatus = 'Done'
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
        if 'main' in folders:
            folders.remove('main')
        # In each SPARC folder, generate a manifest file
        for folder in folders:
            if (jsonpath[folder] != []):
                # Initialize dataframe where manifest info will be stored
                df = pd.DataFrame(columns=['filename', 'timestamp', 'description',
                                        'file type', 'Additional Metadata'])
                # Get list of files/folders in the the folder
                # Remove manifest file from the list if already exists
                folderpath = join(datasetpath, folder)
                allfiles = jsonpath[folder]
                alldescription = jsondescription[folder + '_description']
                manifestexists = join(folderpath, 'manifest.xlsx')

                countpath = -1
                for pathname in allfiles:
                    countpath += 1
                    if basename(pathname) == 'manifest.csv' or basename(pathname) == 'manifest.xlsx':
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
                                lastmodtime = datetime.fromtimestamp(mtime).astimezone(local_timezone)
                                timestamp.append(lastmodtime.isoformat().replace('.', ',').replace('+00:00', 'Z'))
                                fullfilename = filepath.name

                                if folder == 'main': # if file in main folder
                                    filename.append(fullfilename) if folder == '' else filename.append(join(folder, fullfilename))
                                else:
                                    subdirname = os.path.relpath(subdir, paths) # gives relative path of the directory of the file w.r.t paths
                                    if subdirname == '.':
                                        filename.append(join(key, fullfilename))
                                    else:
                                        filename.append(join(key, subdirname, fullfilename))

                                fileextension = splitext(fullfilename)[1]
                                if not fileextension:  # if empty (happens e.g. with Readme files)
                                    fileextension = 'None'
                                filetype.append(fileextension)
                                filedescription.append('')
                    else:
                        gevent.sleep(0)
                        countpath += 1
                        filepath = pathlib.Path(paths)
                        file = filepath.name
                        filename.append(file)
                        mtime = filepath.stat().st_mtime
                        lastmodtime = datetime.fromtimestamp(mtime).astimezone(local_timezone)
                        timestamp.append(lastmodtime.isoformat().replace('.', ',').replace('+00:00', 'Z'))
                        filedescription.append(alldescription[countpath])
                        if isdir(paths):
                            filetype.append('folder')
                        else:
                            fileextension = splitext(file)[1]
                            if not fileextension:  #if empty (happens e.g. with Readme files)
                                fileextension = 'None'
                            filetype.append(fileextension)

                df['filename'] = filename
                df['timestamp'] = timestamp
                df['file type'] = filetype
                df['description'] = filedescription

                makedirs(folderpath)
                # Save manifest as Excel sheet
                manifestfile = join(folderpath, 'manifest.xlsx')
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
    regex = re.compile('[' + forbidden_characters + ']')
    if(regex.search(my_string) == None and "\\" not in r"%r" % my_string):
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
    start_path = '.'  # To get size of current directory
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
            subprocess.Popen(r'explorer /select,' + str(file_path))
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", file_path])
        else:
            subprocess.Popen(["xdg-open", file_path])
    except Exception as e:
        raise e


def bf_dataset_size():
    """
    Function to get storage size of a dataset on Blackfynn
    """
    global bf
    global myds

    try:
        selected_dataset_id = myds.id
        bf_response = bf._api._get('/datasets/' + str(selected_dataset_id))
        return bf_response['storage'] if 'storage' in bf_response.keys() else 0
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
        with open(src, 'rb') as fsrc:
            with open(dst, 'wb') as fdst:
                mycopyfileobj(fsrc, fdst)
    shutil.copystat(src, dst)
    return dst

def mycopyfileobj(fsrc, fdst, length=16*1024*16):
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
            if not exists(topath + ' (' + str(i) + ')'):
                return topath + ' (' + str(i) + ')'
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
                curateprogress = 'Copying ' + str(srcfile)

                mycopyfile_with_metadata(srcfile, distfile)
