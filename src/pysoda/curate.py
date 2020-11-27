# -*- coding: utf-8 -*-

### Import required python modules
import logging

from gevent import monkey; monkey.patch_all()
import platform
import os
from os import listdir, stat, makedirs, mkdir, walk, remove, pardir, rename
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

from datetime import datetime, timezone

from validator_soda import pathToJsonStruct, validate_high_level_folder_structure, validate_high_level_metadata_files, \
validate_sub_level_organization, validate_submission_file, validate_dataset_description_file

from pysoda import clear_queue, agent_running, check_forbidden_characters, check_forbidden_characters_bf

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

DEV_TEMPLATE_PATH = join(dirname(__file__), "..", "file_templates")

# once pysoda has been packaged with pyinstaller
# it becomes nested into the pysodadist/api directory
PROD_TEMPLATE_PATH = join(dirname(__file__), "..", "..", "file_templates")
TEMPLATE_PATH = DEV_TEMPLATE_PATH if exists(DEV_TEMPLATE_PATH) else PROD_TEMPLATE_PATH

logging.basicConfig(level=logging.DEBUG, filename=os.path.join(os.path.expanduser("~"), f"{__name__}.log"))
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(os.path.join(os.path.expanduser("~"), f"{__name__}.log"))
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)


### Internal functions
def TZLOCAL():
    return datetime.now(timezone.utc).astimezone().tzinfo

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

def time_format(elapsed_time):
    mins, secs = divmod(elapsed_time, 60)
    hours, mins = divmod(mins, 60)
    return "%dh:%02dmin:%02ds" % (hours, mins, secs)

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


### Prepare dataset
def save_file_organization(jsonpath, jsondescription, jsonpathmetadata, pathsavefileorganization):
    """
    Associated with 'Save' button in the SODA interface
    Saves the paths and associated descriptions from the interface table to a CSV file for future use
    Each json key (SPARC foler name) becomes a header in the CSV

    Args:
        jsonpath: paths of all files (dictionary)
        jsondescription: description associated with each file (dictionary)
        pathsavefileorganization: destination path for CSV file to be saved (string)
    Action:
        Creates CSV file with path and description for files in SPARC folders
    """
    try:
        mydict = jsonpath
        mydict2 = jsondescription
        mydict3 = jsonpathmetadata
        mydict.update(mydict2)
        mydict.update(mydict3)
        dictkeys = list(mydict.keys())
        dictkeys.sort()
        df = pd.DataFrame(columns=[dictkeys[0]])
        df[dictkeys[0]] = mydict[dictkeys[0]]
        for i in range(1,len(dictkeys)):
            dfnew = pd.DataFrame(columns=[dictkeys[i]])
            dfnew[dictkeys[i]] = mydict[dictkeys[i]]
            df = pd.concat([df, dfnew], axis=1)
        df = df.replace(np.nan, '', regex=True)
        csvsavepath = join(pathsavefileorganization)
        df.to_csv(csvsavepath, index = None, header=True)
        return 'Saved!'
    except Exception as e:
        raise e


def import_file_organization(pathuploadfileorganization, headernames):
    """
    Associated with 'Import' button in the SODA interface
    Import previously saved progress (CSV file) for viewing in the SODA interface

    Args:
        pathuploadfileorganization: path of previously saved CSV file (string)
        headernames: names of SPARC folder (list of strings)
    Returns:
        mydict: dictionary with headers of CSV file as keys and cell contents as list of strings for each key
    """
    try:
        csvsavepath = join(pathuploadfileorganization)
        df = pd.read_csv(csvsavepath)
        dfnan = df.isnull()
        mydict = {}
        mydictmetadata ={}
        dictkeys = df.columns
        compare = lambda x, y: collections.Counter(x) == collections.Counter(y)
        if not compare(dictkeys, headernames):
            raise Exception("Error: Please select a valid file")
        rowcount = len(df.index)
        for i in range(len(dictkeys)):
            pathvect = []
            for j in range(rowcount):
                pathval = df.at[j, dictkeys[i]]
                if not dfnan.at[j, dictkeys[i]]:
                    pathvect.append(pathval)
                else:
                    pathvect.append("")
            if dictkeys[i] == 'metadata':
                mydictmetadata[dictkeys[i]] = pathvect
            else:
                mydict[dictkeys[i]] = pathvect
        return [mydict, mydictmetadata]
    except Exception as e:
        raise e


def create_preview_files(paths, folder_path):
    """
    Creates folders and empty files from original 'paths' to the destination 'folder_path'

    Args:
        paths: paths of all the files that need to be copied (list of strings)
        folder_path: Destination to which the files / folders need to be copied (string)
    Action:
        Creates folders and empty files at the given 'folder_path'
    """
    try:
        for p in paths:
            gevent.sleep(0)
            if isfile(p):
                file = basename(p)
                open(join(folder_path, file), 'a').close()
            else:
                all_files = listdir(p)
                all_files_path = []
                for f in all_files:
                    all_files_path.append(join(p, f))

                pname = basename(p)
                new_folder_path = join(folder_path, pname)
                makedirs(new_folder_path)
                create_preview_files(all_files_path, new_folder_path)
        return
    except Exception as e:
        raise e


def preview_file_organization(jsonpath):
    """
    Associated with 'Preview' button in the SODA interface
    Creates a folder for preview and adds mock files from SODA table (same name as origin but 0 kb in size)
    Opens the dialog box to showcase the files / folders added

    Args:
        jsonpath: dictionary containing all paths (keys are SPARC folder names)
    Action:
        Opens the dialog box at preview_path
    Returns:
        preview_path: path of the folder where the preview files are located
    """
    mydict = jsonpath
    preview_path = join(userpath, "SODA", "Preview")
    try:
        if isdir(preview_path):
            delete_preview_file_organization()
            makedirs(preview_path)
        else:
            makedirs(preview_path)
    except Exception as e:
        raise e

    try:

        folderrequired = []
        for i in mydict.keys():
            if mydict[i] != []:
                folderrequired.append(i)
                if i != 'main':
                    makedirs(join(preview_path, i))

        def preview_func(folderrequired, preview_path):
            for i in folderrequired:
                paths = mydict[i]
                if (i == 'main'):
                    create_preview_files(paths, join(preview_path))
                else:
                    create_preview_files(paths, join(preview_path, i))
        output = []
        output.append(gevent.spawn(preview_func, folderrequired, preview_path))
        gevent.sleep(0)
        gevent.joinall(output)

        if len(listdir(preview_path)) > 0:
            folder_in_preview = listdir(preview_path)[0]

            open_file(join(preview_path, folder_in_preview))

        else:
            open_file(preview_path)

        return preview_path

    except Exception as e:
        raise e


def delete_preview_file_organization():
    """
    Associated with 'Delete Preview Folder' button of the SODA interface

    Action:
        Deletes the 'Preview' folder from the disk
    """
    try:
        userpath = expanduser("~")
        preview_path = join(userpath, "SODA", "Preview")
        if isdir(preview_path):
            shutil.rmtree(preview_path, ignore_errors=True)
        else:
            raise Exception("Error: Preview folder not present or already deleted!")
    except Exception as e:
        raise e


def create_dataset(jsonpath, pathdataset):
    """
    Associated with 'Create new dataset locally' option of SODA interface
    for creating requested folders and files to the destination path specified

    Args:
        jsonpath: all paths (dictionary, keys are SPARC folder names)
        pathdataset: destination path for creating a new dataset as specified (string)
    Action:
        Creates the folders and files specified
    """
    global curateprogress

    try:
        mydict = jsonpath
        folderrequired = []

        #create SPARC folder structure
        for i in mydict.keys():
            if mydict[i] != []:
                folderrequired.append(i)
                if i != 'main':
                    makedirs(join(pathdataset, i))

        # create all subfolders and generate a list of all files to copy
        listallfiles = []
        for i in folderrequired:
            if i == 'main':
                outputpath = pathdataset
            else:
                outputpath = join(pathdataset, i)
            for tablepath in mydict[i]:
                if isdir(tablepath):
                    foldername = basename(tablepath)
                    outputpathdir = join(outputpath, foldername)
                    if not os.path.isdir(outputpathdir):
                        os.mkdir(outputpathdir)
                    for dirpath, dirnames, filenames in os.walk(tablepath):
                        distdir = os.path.join(outputpathdir, os.path.relpath(dirpath, tablepath))
                        if not os.path.isdir(distdir):
                            os.mkdir(distdir)
                        for file in filenames:
                            srcfile = os.path.join(dirpath, file)
                            distfile = os.path.join(distdir, file)
                            listallfiles.append([srcfile, distfile])
                else:
                    srcfile = tablepath
                    file = basename(tablepath)
                    distfile= os.path.join(outputpath, file)
                    listallfiles.append([srcfile, distfile])

        # copy all files to corresponding folders
        for fileinfo in listallfiles:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            curateprogress = 'Copying ' + str(srcfile)
            mycopyfile_with_metadata(srcfile, distfile)

    except Exception as e:
        raise e

def bf_get_current_user_permission(bf, myds):

    """
    Function to get the permission of currently logged in user for a selected dataset

    Args:
        bf: logged Blackfynn acccount (dict)
        myds: selected Blackfynn dataset (dict)
    Output:
        permission of current user (string)
    """

    try:
        selected_dataset_id = myds.id
        user_role = bf._api._get('/datasets/' + str(selected_dataset_id) + '/role')['role']

        return user_role

    except Exception as e:
        raise e


def curate_dataset(sourcedataset, destinationdataset, pathdataset, newdatasetname,\
        manifeststatus, jsonpath, jsondescription):
    """
    Associated with 'Generate' button in the 'Generate dataset' section of SODA interface
    Checks validity of files / paths / folders and then generates the files and folders
    as requested along with progress status

    Args:
        sourcedataset: state of the source dataset ('already organized' or 'not organized')
        destinationdataset: type of destination dataset ('modify existing', 'create new', or 'upload to blackfynn')
        pathdataset: destination path of new dataset if created locally or name of blackfynn account (string)
        newdatasetname: name of the local dataset or name of the dataset on blackfynn (string)
        manifeststatus: boolean to check if user request manifest files
        jsonpath: path of the files to be included in the dataset (dictionary)
        jsondescription: associated description to be included in manifest file (dictionary)
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

    # if sourcedataset == 'already organized':
    #     if not isdir(pathdataset):
    #         curatestatus = 'Done'
    #         raise Exception('Error: Please select a valid dataset folder')

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

    # check if path in jsonpath are valid and calculate total dataset size
    error, c = '', 0
    total_dataset_size = 1
    for folders in jsonpath.keys():
        if jsonpath[folders] != []:
            for path in jsonpath[folders]:
                if exists(path):

                    if isfile(path):
                        mypathsize =  getsize(path)
                        if mypathsize == 0:
                            c += 1
                            error = error + path + ' is 0 KB <br>'
                        else:
                            total_dataset_size += mypathsize
                    else:

                        myfoldersize = folder_size(path)
                        if myfoldersize == 0:
                            c += 1
                            error = error + path + ' is empty <br>'
                        else:
                            for path, dirs, files in walk(path):
                                for f in files:
                                    fp = join(path, f)
                                    mypathsize =  getsize(fp)
                                    if mypathsize == 0:
                                        c += 1
                                        error = error + fp + ' is 0 KB <br>'
                                    else:
                                        total_dataset_size += mypathsize
                                for d in dirs:
                                    dp = join(path,d)
                                    myfoldersize = folder_size(dp)
                                    if myfoldersize == 0:
                                        c += 1
                                        error = error + dp + ' is empty <br>'
                else:
                    c += 1
                    error = error + path + ' does not exist <br>'

    if c > 0:
        error = error + '<br>Please remove invalid files/folders from your dataset and try again'
        curatestatus = 'Done'
        raise Exception(error)

    total_dataset_size = total_dataset_size - 1

    # Add metadata to jsonpath
    curateprogress = 'Generating metadata'

    if manifeststatus:
        try:
            jsonpath = create_folder_level_manifest(jsonpath, jsondescription)
        except Exception as e:
            curatestatus = 'Done'
            raise e

    # CREATE NEW
    if destinationdataset == 'create new':
        try:
            pathnewdatasetfolder = join(pathdataset, newdatasetname)
            pathnewdatasetfolder  = return_new_path(pathnewdatasetfolder)
            open_file(pathnewdatasetfolder)

            curateprogress = 'Started'
            curateprintstatus = 'Curating'
            start_time = time.time()
            start_submit = 1

            pathdataset = pathnewdatasetfolder
            mkdir(pathdataset)
            create_dataset(jsonpath, pathdataset)

            curateprogress = 'New dataset created'
            curateprogress = 'Success: COMPLETED!'
            curatestatus = 'Done'
            shutil.rmtree(metadatapath) if isdir(metadatapath) else 0

        except Exception as e:
            curatestatus = 'Done'
            shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
            raise e

    # UPLOAD TO BLACKFYNN
    elif destinationdataset == 'upload to blackfynn':
        error, c = '', 0
        accountname = pathdataset
        bfdataset = newdatasetname
        upload_directly_to_bf = 1

        try:
            bf = Blackfynn(accountname)
        except Exception as e:
            curatestatus = 'Done'
            error = error + 'Error: Please select a valid Blackfynn account<br>'
            c += 1

        try:
            myds = bf.get_dataset(bfdataset)
        except Exception as e:
            curatestatus = 'Done'
            error = error + 'Error: Please select a valid Blackfynn dataset<br>'
            c += 1

        if c>0:
            shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
            raise Exception(error)

        try:
            role = bf_get_current_user_permission(bf, myds)
            if role not in ['owner', 'manager', 'editor']:
                curatestatus = 'Done'
                error = "Error: You don't have permissions for uploading to this Blackfynn dataset"
                raise Exception(error)
        except Exception as e:
            raise e

        clear_queue()
        try:
            agent_running()
            def calluploaddirectly():

                try:
                    global curateprogress
                    global curatestatus

                    myds = bf.get_dataset(bfdataset)

                    for folder in jsonpath.keys():
                        if jsonpath[folder] != []:
                            if folder != 'main':
                                mybffolder = myds.create_collection(folder)
                            else:
                                mybffolder = myds
                            for mypath in jsonpath[folder]:
                                if isdir(mypath):
                                    curateprogress = "Uploading folder '%s' to dataset '%s' " %(mypath, bfdataset)
                                    mybffolder.upload(mypath, recursive=True, use_agent=True)
                                else:
                                    curateprogress = "Uploading file '%s' to dataset '%s' " %(mypath, bfdataset)
                                    mybffolder.upload(mypath, use_agent=True)

                    curateprogress = 'Success: COMPLETED!'
                    curatestatus = 'Done'
                    shutil.rmtree(metadatapath) if isdir(metadatapath) else 0

                except Exception as e:
                    shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
                    raise e


            curateprintstatus = 'Curating'
            start_time = time.time()
            initial_bfdataset_size = bf_dataset_size()
            start_submit = 1
            gev = []
            gev.append(gevent.spawn(calluploaddirectly))
            gevent.sleep(0)
            gevent.joinall(gev) #wait for gevent to finish before exiting the function
            curatestatus = 'Done'

            try:
                return gev[0].get()
            except Exception as e:
                raise e

        except Exception as e:
            curatestatus = 'Done'
            shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
            raise e

def curate_dataset_progress():
    """
    Function frequently called by front end to help keep track of the dataset generation progress
    """
    global curateprogress
    global curatestatus
    global curateprintstatus
    global total_dataset_size
    global curated_dataset_size
    global start_time
    global upload_directly_to_bf
    global start_submit
    global initial_bfdataset_size

    if start_submit == 1:
        if upload_directly_to_bf == 1:
            curated_dataset_size = bf_dataset_size() - initial_bfdataset_size
        elapsed_time = time.time() - start_time
        elapsed_time_formatted = time_format(elapsed_time)
        elapsed_time_formatted_display = '<br>' + 'Elapsed time: ' + elapsed_time_formatted + '<br>'
    else:
        if upload_directly_to_bf == 1:
            curated_dataset_size = 0
        elapsed_time_formatted = 0
        elapsed_time_formatted_display = '<br>' + 'Initiating...' + '<br>'

    return (curateprogress+elapsed_time_formatted_display, curatestatus, curateprintstatus, total_dataset_size, curated_dataset_size, elapsed_time_formatted)

### Validate dataset
def validate_dataset(validator_input):
    try:
        if type(validator_input) is str:
            jsonStruct = pathToJsonStruct(validator_input)
        elif type(validator_input) is dict:
            jsonStruct = validator_input
        else:
            raise Exception('Error: validator input must be string (path to dataset) or a SODA JSON Structure/Python dictionary')

        res = []

        validatorHighLevelFolder = validate_high_level_folder_structure(jsonStruct)
        validatorObj = validatorHighLevelFolder
        resitem = {}
        resitem['pass'] = validatorObj.passes
        resitem['warnings'] = validatorObj.warnings
        resitem['fatal'] = validatorObj.fatal
        res.append(resitem)

        validatorHighLevelMetadataFiles, isSubmission, isDatasetDescription, isSubjects, isSamples = \
         validate_high_level_metadata_files(jsonStruct)
        validatorObj = validatorHighLevelMetadataFiles
        resitem = {}
        resitem['pass'] = validatorObj.passes
        resitem['warnings'] = validatorObj.warnings
        resitem['fatal'] = validatorObj.fatal
        res.append(resitem)

        validatorSubLevelOrganization = validate_sub_level_organization(jsonStruct)
        validatorObj = validatorSubLevelOrganization
        resitem = {}
        resitem['pass'] = validatorObj.passes
        resitem['warnings'] = validatorObj.warnings
        resitem['fatal'] = validatorObj.fatal
        res.append(resitem)

        if isSubmission == 1:
            metadataFiles = jsonStruct['main']
            for f in metadataFiles:
                fullName = os.path.basename(f)
                if os.path.splitext(fullName)[0] == 'submission':
                    subFilePath = f
            validatorSubmissionFile = validate_submission_file(subFilePath)
            validatorObj = validatorSubmissionFile
            resitem = {}
            resitem['pass'] = validatorObj.passes
            resitem['warnings'] = validatorObj.warnings
            resitem['fatal'] = validatorObj.fatal
            res.append(resitem)
        elif isSubmission == 0:
            resitem = {}
            resitem['warnings'] = ["Include a 'submission' file in a valid format to check it through the validator"]
            res.append(resitem)

        elif isSubmission>1:
            resitem = {}
            resitem['warnings'] = ["Include a unique 'submission' file to check it through the validator"]
            res.append(resitem)

        if isDatasetDescription == 1:
            metadataFiles = jsonStruct['main']
            for f in metadataFiles:
                fullName = os.path.basename(f)
                if os.path.splitext(fullName)[0] == 'dataset_description':
                    ddFilePath = f
            validatorDatasetDescriptionFile = validate_dataset_description_file(ddFilePath)
            validatorObj = validatorDatasetDescriptionFile
            resitem = {}
            resitem['pass'] = validatorObj.passes
            resitem['warnings'] = validatorObj.warnings
            resitem['fatal'] = validatorObj.fatal
            res.append(resitem)

        elif isDatasetDescription == 0:
            resitem = {}
            resitem['warnings'] = ["Include a 'dataset_description' file in a valid format to check it through the validator"]
            res.append(resitem)
        elif isDatasetDescription>1:
            resitem = {}
            resitem['warnings'] = ["Include a unique 'dataset_description' file to check it through the validator"]
            res.append(resitem)

        return res

    except Exception as e:
        raise e


'''
------------------------------------------
NEW
FUNCTIONS
------------------------------------------

'''

def check_empty_files_folders(soda_json_structure):
    """
    Function to check for empty files and folders

    Args:
        soda_json_structure: soda dict with information about all specified files and folders
    Output:
        error: error message with list of non valid local data files, if any
    """
    
    def recursive_empty_files_check(my_folder, my_relative_path, error_files):
        for folder_key, folder in my_folder["folders"].items():
            relative_path = my_relative_path + "/" + folder_key
            error_files = recursive_empty_files_check(folder, relative_path, error_files)
                    
        for file_key in list(my_folder["files"].keys()):
            file = my_folder["files"][file_key]
            file_type = file["type"] 
            if file_type == "local":
                file_path = file["path"]
                if isfile(file_path):
                    file_size = getsize(file_path)
                    if file_size == 0:
                        del my_folder["files"][file_key] 
                        relative_path = my_relative_path + "/" +  file_key
                        error_message = relative_path + " (path: " + file_path + ")"
                        error_files.append(error_message)
                        
        return error_files
    
    def recursive_empty_local_folders_check(my_folder, my_folder_key, my_folders_content, my_relative_path, error_folders):
        folders_content = my_folder["folders"]
        for folder_key in list(my_folder["folders"].keys()):
            folder = my_folder["folders"][folder_key]
            relative_path = my_relative_path + "/" + folder_key
            error_folders = recursive_empty_local_folders_check(folder, folder_key, folders_content, relative_path, error_folders)
                
        if not my_folder["folders"]:
            if not my_folder["files"]:
                error_message = my_relative_path
                error_folders.append(error_message)
                del my_folders_content[my_folder_key]
        return error_folders
              
    error_files = []
    error_folders = []
    if "dataset-structure" in soda_json_structure.keys():
        dataset_structure = soda_json_structure["dataset-structure"]
        if "folders" in dataset_structure:
            for folder_key, folder in dataset_structure["folders"].items():
                relative_path = folder_key
                error_files = recursive_empty_files_check(folder, relative_path, error_files)
            
            folders_content = dataset_structure["folders"]
            for folder_key in list(dataset_structure["folders"].keys()):
                folder = dataset_structure["folders"][folder_key]
                relative_path = folder_key
                error_folders = recursive_empty_local_folders_check(folder, folder_key, folders_content, relative_path, error_folders) 
    
    if "metadata-files" in soda_json_structure.keys():
        metadata_files = soda_json_structure["metadata-files"]
        for file_key in list(metadata_files.keys()):
            file = metadata_files[file_key]
            file_type = file["type"] 
            if file_type == "local":
                file_path = file["path"]
                if isfile(file_path):
                    file_size = getsize(file_path)
                    if file_size == 0:
                        error_message = file_key + " (path: " + file_path + ")"
                        error_files.append(error_message)
        
    if len(error_files)>0:
        error_message = ["The following local file(s) is/are empty (0 kb) and will be ignored."]
        error_files = error_message + [] + error_files

    if len(error_folders)>0:
        error_message = ["The following folder(s) is/are empty or only contain(s) empty file(s), and will be ignored."]
        error_folders = error_message + [] + error_folders
        
    return [error_files, error_folders]


def check_local_dataset_files_validity(soda_json_structure):
    """
    Function to check that the local data files and folders specified in the dataset are valid

    Args:
        soda_json_structure: soda dict with information about all specified files and folders
    Output:
        error: error message with list of non valid local data files, if any
    """

    def recursive_local_file_check(my_folder, my_relative_path, error):
        for folder_key, folder in my_folder["folders"].items():
            relative_path = my_relative_path + "/" + folder_key
            error = recursive_local_file_check(folder, relative_path, error)

        for file_key in list(my_folder["files"].keys()):
            file = my_folder["files"][file_key]
            file_type = file["type"]
            if file_type == "local":
                file_path = file["path"]
                if not isfile(file_path):
                    relative_path = my_relative_path + "/" +  file_key
                    error_message = relative_path + " (path: " + file_path + ")"
                    error.append(error_message)
                else:
                    file_size = getsize(file_path)
                    if file_size == 0:
                        del my_folder["files"][file_key] 
                        
        return error
    
    def recursive_empty_local_folder_remove(my_folder, my_folder_key, my_folders_content):
        
        folders_content = my_folder["folders"]
        for folder_key in list(my_folder["folders"].keys()):
            folder = my_folder["folders"][folder_key]
            recursive_empty_local_folder_remove(folder, folder_key, folders_content)
                
        if not my_folder["folders"]:
            if not my_folder["files"]:
                del my_folders_content[my_folder_key]
                       
    error = []
    if "dataset-structure" in soda_json_structure.keys():
        dataset_structure = soda_json_structure["dataset-structure"]
        if "folders" in dataset_structure:
            for folder_key, folder in dataset_structure["folders"].items():
                relative_path = folder_key
                error = recursive_local_file_check(folder, relative_path, error)
            
            folders_content = dataset_structure["folders"]
            for folder_key in list(dataset_structure["folders"].keys()):
                folder = dataset_structure["folders"][folder_key]
                recursive_empty_local_folder_remove(folder, folder_key, folders_content) 
    
    if "metadata-files" in soda_json_structure.keys():
        metadata_files = soda_json_structure["metadata-files"]
        for file_key in list(metadata_files.keys()):
            file = metadata_files[file_key]
            file_type = file["type"] 
            if file_type == "local":
                file_path = file["path"]
                if not isfile(file_path):
                    error_message = file_key + " (path: " + file_path + ")"
                    error.append(error_message)
                else:
                    file_size = getsize(file_path)
                    if file_size == 0:
                        print(file_path)
                        del metadata_files[file_key] 
        
    if len(error)>0:
        error_message = ["Error: The following local files were not found. Specify them again or remove them."]
        error = error_message + error
        
    return error


#path to local SODA folder for saving manifest files
manifestpath = join(userpath, 'SODA', 'manifest_files')


def create_high_level_manifest_files(soda_json_structure):
    """
    Function to create manifest files for each high-level SPARC folder.

    Args:
        soda_json_structure: soda dict with information about the dataset to be generated/modified
    Action:
        manifest_files_structure: dict including the local path of the manifest files
    """
    try:
        
        def recursive_manifest_builder(my_folder, my_relative_path, dict_folder_manifest):
            if "files" in my_folder.keys():
                for file_key, file in my_folder["files"].items():
                    dict_folder_manifest = file_manifest_entry(file_key, file, my_relative_path, dict_folder_manifest)
                            
            if "folders" in my_folder.keys():
                for folder_key, folder in my_folder["folders"].items():
                    relative_path = join(my_relative_path, folder_key)
                    dict_folder_manifest = recursive_manifest_builder(folder, relative_path, dict_folder_manifest)
            
            return dict_folder_manifest
        
        def file_manifest_entry(file_key, file, relative_path, dict_folder_manifest):
            #filename
            filename = join(relative_path, file_key)
            dict_folder_manifest["filename"].append(filename)
            #timestamp
            file_type = file["type"]
            if file_type == "local":
                file_path = file["path"] 
                filepath = pathlib.Path(file_path)
                mtime = filepath.stat().st_mtime
                lastmodtime = datetime.fromtimestamp(mtime).astimezone(local_timezone)
                dict_folder_manifest["timestamp"].append(lastmodtime.isoformat().replace('.', ',').replace('+00:00', 'Z'))
            elif file_type == "bf":
                dict_folder_manifest["timestamp"].append(file["timestamp"])
            #description     
            if "description" in file.keys(): 
                dict_folder_manifest["description"].append(file["description"])
            else: 
                dict_folder_manifest["description"].append("")                                    
            #file type
            name_split = splitext(file_key)
            if name_split[1] == "":
                fileextension = "None"
            else:      
                fileextension = name_split[1]
            dict_folder_manifest["file type"].append(fileextension)
            #addtional metadata  
            if "additional-metadata" in file.keys(): 
                dict_folder_manifest["Additional Metadata"].append(file["additional-metadata"])     
            else: 
                dict_folder_manifest["Additional Metadata"].append("") 

            return dict_folder_manifest
    
        #create local folder to save manifest files temporarly (delete any existing one first)
        shutil.rmtree(manifestpath) if isdir(manifestpath) else 0
        makedirs(manifestpath)

        dataset_structure = soda_json_structure["dataset-structure"]
        local_timezone = TZLOCAL()
        manifest_files_structure = {}
        for folder_key, folder in dataset_structure["folders"].items():
            # Initialize dict where manifest info will be stored
            dict_folder_manifest = {}
            dict_folder_manifest["filename"] = []
            dict_folder_manifest["timestamp"] = []
            dict_folder_manifest["description"] = []
            dict_folder_manifest["file type"] = []
            dict_folder_manifest["Additional Metadata"] = []
            
            relative_path = ""
            dict_folder_manifest = recursive_manifest_builder(folder, relative_path, dict_folder_manifest)
            
            #create high-level folder at the temporary location
            folderpath = join(manifestpath, folder_key)
            makedirs(folderpath)
            
            #save manifest file 
            manifestfilepath = join(folderpath, 'manifest.xlsx')
            df = pd.DataFrame.from_dict(dict_folder_manifest)
            df.to_excel(manifestfilepath, index=None, header=True)

            manifest_files_structure[folder_key] = manifestfilepath
            
        return manifest_files_structure

    except Exception as e:
        raise e

def add_local_manifest_files(manifest_files_structure, datasetpath):
    try:
        for key in manifest_files_structure.keys():  
            manifestpath = manifest_files_structure[key]
            destination_folder = join(datasetpath, key)
            if isdir(destination_folder):
                dst = join(destination_folder, "manifest.xlsx")
                mycopyfile_with_metadata(manifestpath, dst)
                
        shutil.rmtree(manifestpath) if isdir(manifestpath) else 0
    
    except Exception as e:
        raise e   

def bf_add_manifest_files(manifest_files_structure, ds):
    # IN PROGRESS
    try:
        for key in manifest_files_structure.keys():  
            manifestpath = manifest_files_structure[key]
            for item in ds:
                if item.name == key and item.type == "Collection":
                    destination_folder_id = item.id
                    #delete existing manifest files
                    for subitem in item:
                        if subitem.name == "manifest":
                            subitem.delete()   
                    #upload new manifest files
                    bf_upload_file(item, manifestpath)
                    break
        shutil.rmtree(manifestpath) if isdir(manifestpath) else 0
    
    except Exception as e:
        raise e     
        
def bf_upload_file(item, path):
    item.upload(path)

    
def get_generate_dataset_size(soda_json_structure, manifest_files_structure):
    """
    Function to get the size of the data to be generated (not existing at the local or Blackfynn destination)

    Args:
        soda_json_structure: soda dict with information about all specified files and folders
        manifest_files_structure: soda dict with information about the manifest files (if requested)
    Output:
        generate_dataset_size: total size of data to be generated (in bytes)
    """
    
    def recursive_dataset_size(my_folder):
        total_size = 0

        if "folders" in my_folder.keys():
            for folder_key, folder in my_folder["folders"].items():
                total_size += recursive_dataset_size(folder)
        if "files" in my_folder.keys():
            for file_key, file in my_folder["files"].items():
                file_type = file["type"]
                if file_type == "local":
                    if "new" in file["action"]:
                        file_path = file["path"]
                        if isfile(file_path):
                            total_size += getsize(file_path)
        return total_size
    
    try:
        dataset_structure = soda_json_structure["dataset-structure"]
                
        generate_dataset_size = 0
        for folder_key, folder in dataset_structure["folders"].items():
            generate_dataset_size += recursive_dataset_size(folder)

        if manifest_files_structure:
            for key in manifest_files_structure.keys():  
                manifest_path = manifest_files_structure[key]
                generate_dataset_size += getsize(manifest_path)
            
        if "metadata-files" in soda_json_structure.keys():
            metadata_files = soda_json_structure["metadata-files"]
            for file_key, file in metadata_files.items():
                if file["type"] == "local":
                    if "new" in file["action"]:
                        metadata_path = file["path"]
                        generate_dataset_size += getsize(metadata_path)
                
        return generate_dataset_size
    
    except Exception as e:
        raise e    

def generate_dataset_locally(soda_json_structure):

    try:
        
        def recursive_dataset_scan(my_folder, my_folderpath, list_copy_files, list_move_files):
            if "folders" in my_folder.keys():
                for folder_key, folder in my_folder["folders"].items():
                    folderpath = join(my_folderpath, folder_key)
                    if not isdir(folderpath):
                        mkdir(folderpath)
                    list_copy_files, list_move_files = recursive_dataset_scan(folder, folderpath, list_copy_files, list_move_files)
                        
            if "files" in my_folder.keys():
                for file_key, file in my_folder["files"].items():
                    if not "deleted" in file["action"]:
                        file_type = file["type"]
                        if file_type == "local":
                            file_path = file["path"]
                            if isfile(file_path):
                                destination_path = abspath(join(my_folderpath, file_key))
                                if not isfile(destination_path):
                                    if "existing" in file["action"]:
                                        list_move_files.append([file_path, destination_path])
                                    elif "new" in file["action"]:
                                        list_copy_files.append([file_path, destination_path])
            return list_copy_files, list_move_files
 
        # 1. Create new folder for dataset or use existing merge with existing or create new dataset?
        dataset_absolute_path = soda_json_structure["generate-dataset"]["path"]
        if_existing = soda_json_structure["generate-dataset"]["if-existing"]
        dataset_name = soda_json_structure["generate-dataset"]["dataset-name"]
        datasetpath = join(dataset_absolute_path, dataset_name)
        datasetpath  = return_new_path(datasetpath)
        mkdir(datasetpath)
        
        # 2. Scan the dataset structure and:
        # 2.1. Create all folders (with new name if renamed)
        # 2.2. Compile a list of files to be copied and a list of files to be moved (with new name recorded if renamed)
        list_copy_files = []
        list_move_files = []
        dataset_structure = soda_json_structure["dataset-structure"]
        for folder_key, folder in dataset_structure["folders"].items():
            folderpath = join(datasetpath, folder_key)
            mkdir(folderpath)
            list_copy_files, list_move_files = recursive_dataset_scan(folder, folderpath, list_copy_files, list_move_files)
        
        # 3. Add high-level metadata files in the list
        if "metadata-files" in soda_json_structure.keys():
            metadata_files = soda_json_structure["metadata-files"]
            for file_key, file in metadata_files.items():
                if file["type"] == "local":
                    metadata_path = file["path"]
                    if isfile(metadata_path):
                        destination_path = join(datasetpath, file_key)
                        if "existing" in file["action"]:
                            list_move_files.append([metadata_path, destination_path])
                        elif "new" in file["action"]:
                            list_copy_files.append([metadata_path, destination_path])
                        
        # Move files to new location
        for fileinfo in list_move_files:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            curateprogress = 'Moving ' + str(srcfile)
            mymovefile_with_metadata(srcfile, distfile)
            
        # Copy files to new location
        for fileinfo in list_copy_files:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            curateprogress = 'Copying ' + str(srcfile)
            mycopyfile_with_metadata(srcfile, distfile)
 
        # Delete original folder if merge requested and rename new folder
        if if_existing == "merge":
            original_dataset_path = join(dataset_absolute_path, dataset_name)
            shutil.rmtree(original_dataset_path)
            rename(datasetpath, original_dataset_path)

        return datasetpath
     
    except Exception as e:
        raise e
        
def mymovefile_with_metadata(src, dst):
    shutil.move(src, dst)


def bf_create_new_dataset(datasetname, bf):
    """

    Args:
        datasetname: name of the dataset to be created (string)
        bf: Blackfynn account object
    Action:
        Creates dataset for the account specified
    """
    try:
        error, c = '', 0
        datasetname = datasetname.strip()

        if check_forbidden_characters_bf(datasetname):
            error = error + 'Error: A Blackfynn dataset name cannot contain any of the following characters: ' + forbidden_characters_bf + "<br>"
            c += 1

        if (not datasetname):
            error = error + 'Error: Please enter valid dataset name' + "<br>"
            c += 1

        if (datasetname.isspace()):
            error = error + 'Error: Please enter valid dataset name' + "<br>"
            c += 1

        if c>0:
            raise Exception(error)

        dataset_list = []
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        if datasetname in dataset_list:
            raise Exception('Error: Dataset name already exists')
        else:
            ds = bf.create_dataset(datasetname)
        
        return ds
    
    except Exception as e:
        raise e

        
def bf_generate_new_dataset(soda_json_structure, bf, ds):

    try:
        
        def recursive_create_folder_for_bf(my_folder, my_tracking_folder, existing_folder_option):
            my_bf_folder = my_tracking_folder["value"]
            my_bf_existing_folders = [x for x in my_bf_folder.items if x.type == "Collection"]
            my_bf_existing_folders_name = [x.name for x in my_bf_existing_folders]
            if "folders" in my_folder.keys():
                my_tracking_folder["folders"] = {}
                for folder_key, folder in my_folder["folders"].items():
                    
                    if existing_folder_option == "skip":
                        if folder_key in my_bf_existing_folders_name:
                            continue
                            
                    elif existing_folder_option == "create-duplicate":
                        bf_folder = my_bf_folder.create_collection(folder_key)
                        
                    elif existing_folder_option == "replace":
                        if folder_key in my_bf_existing_folders_name:
                            index_folder = my_bf_existing_folders_name.index(folder_key)
                            bf_folder = my_bf_existing_folders[index_folder]
                            bf_folder.delete() 
                        bf_folder = my_bf_folder.create_collection(folder_key)
                        
                    elif existing_folder_option == "merge":
                        if folder_key in my_bf_existing_folders_name:
                            index_folder = my_bf_existing_folders_name.index(folder_key)
                            bf_folder = my_bf_existing_folders[index_folder]
                        else:
                            bf_folder = my_bf_folder.create_collection(folder_key)
                            
                    my_tracking_folder["folders"][folder_key] = {"value": bf_folder}
                    tracking_folder = my_tracking_folder["folders"][folder_key]
                    recursive_create_folder_for_bf(folder, tracking_folder, existing_folder_option)                      

        def recursive_dataset_scan_for_bf(my_folder, my_tracking_folder, existing_file_option, list_upload_files):
            my_bf_folder = my_tracking_folder["value"]
            
            if "folders" in my_folder.keys():
                my_bf_existing_folders = [x for x in my_bf_folder.items if x.type == "Collection"]
                my_bf_existing_folders_name = [splitext(x.name)[0] for x in my_bf_existing_folders]
            
                for folder_key, folder in my_folder["folders"].items():
                    
                    if existing_folder_option == "skip":
                        if folder_key in my_bf_existing_folders_name:
                            continue
                    
                    tracking_folder = my_tracking_folder["folders"][folder_key]
                    list_upload_files = recursive_dataset_scan_for_bf(folder, tracking_folder, existing_file_option, list_upload_files)
                        
            if "files" in my_folder.keys():
                my_bf_existing_files = [x for x in my_bf_folder.items if x.type != "Collection"]
                my_bf_existing_files_name = [splitext(x.name)[0] for x in my_bf_existing_files]
            
                list_local_files = []
                list_projected_name = []
                list_desired_name = []
                additional_upload_lists = []
                additional_list_count = 0
                list_upload_schedule_projected_names = []
                for file_key, file in my_folder["files"].items():
                    if file["type"] == "local":
                        file_path = file["path"]
                        if isfile(file_path):
                            
                            initial_name = splitext(basename(file_path))[0]
                            desired_name = splitext(file_key)[0]
                            
                            if existing_file_option == "replace":
                                if initial_name in my_bf_existing_files_name:
                                    index_file = my_bf_existing_files_name.index(initial_name)
                                    my_file = my_bf_existing_files[index_file]
                                    my_file.delete() 
                            
                            if existing_file_option == "skip":
                                if initial_name in my_bf_existing_files_name:
                                    continue
                                    
                            # find projected filename on Blackfynn

                            # check if initial filename exists on Blackfynn dataset
                            count_done = 0
                            count_exist = 0
                            projected_name = initial_name
                            while count_done == 0:
                                if projected_name in my_bf_existing_files_name:
                                    count_exist += 1
                                    projected_name = initial_name + " (" + str(count_exist) + ")"
                                else:
                                    count_done = 1

                            # check if projected filename will exist a previous file scheduled for uploading
                            count_exist_projected = 0
                            if projected_name in list_upload_schedule_projected_names:
                                count_exist += 1
                                count_exist_projected = 1
                                projected_name = initial_name + " (" + str(count_exist) + ")" 

                            # save in list accordingly
                            if count_exist_projected == 1:
                                additional_upload_lists.append([[file_path], my_bf_folder, [projected_name], [desired_name], my_tracking_folder])
                                
                            else:
                                list_local_files.append(file_path)
                                list_desired_name.append(desired_name)
                                list_projected_name.append(projected_name)
                            list_upload_schedule_projected_names.append(projected_name)
                
                if list_local_files:
                    list_upload_files.append([list_local_files, my_bf_folder, list_projected_name, list_desired_name, my_tracking_folder])
                    print(list_local_files)

                for item in additional_upload_lists:
                    list_upload_files.append(item)  
                    print("item", item)
                
            return list_upload_files
        
                               
        # 1. Scan the dataset structure to create all non-existent folders
        # create a tracking dict which would track the generation of the dataset on Blackfynn
        dataset_structure = soda_json_structure["dataset-structure"]
        tracking_json_structure = {"value": ds}
        existing_folder_option = soda_json_structure["generate-dataset"]["if-existing"]
        recursive_create_folder_for_bf(dataset_structure, tracking_json_structure, existing_folder_option)

        # 2. Scan the dataset structure and compile a list of files to be uploaded along with desired renaming
        existing_file_option = soda_json_structure["generate-dataset"]["if-existing-files"]
        list_upload_files = []
        list_upload_files = recursive_dataset_scan_for_bf(dataset_structure, tracking_json_structure, existing_file_option, list_upload_files)
        
        # 3. Upload files, rename, and add to tracking list
        for item in list_upload_files:
            list_upload = item[0]
            bf_folder = item[1]
            list_projected_names = item[2]
            list_desired_names = item[3]
            tracking_folder = item[4]
            
            #upload
            print("UPLOAD LIST", list_upload, list_projected_names, list_desired_names)
            print(bf_folder)
            bf_folder.upload(*list_upload)
            
            #rename to desired
            for item in bf_folder.items:
                projected_name = item.name
                if projected_name in list_projected_names:
                    index = list_projected_names.index(projected_name)
                    desired_name = list_desired_names[index]
                    if desired_name != projected_name:
                        item.name = desired_name
                    if "files" not in tracking_folder:
                        tracking_folder["files"] = {}
                    tracking_folder["files"][desired_name] = {"value": item}
            
            # second rename iteration in case name is swapped between two uploaded files
            if "files" in tracking_folder:
                for desired_name in  tracking_folder["files"].keys():
                    item = tracking_folder["files"][desired_name]["value"]
                    if item.name != desired_name:
                        item.name = desired_name
                    tracking_folder["files"][desired_name] = {"value": item}
            
        # 4. Add high-level metadata files to a list and upload 
        list_upload_metadata_files = []
        if "metadata-files" in soda_json_structure.keys():
            
            my_bf_existing_files = [x for x in ds.items if x.type != "Collection"]
            my_bf_existing_files_name = [splitext(x.name)[0] for x in my_bf_existing_files]
            
            metadata_files = soda_json_structure["metadata-files"]
            
            for file_key, file in metadata_files.items():
                if file["type"] == "local":
                    metadata_path = file["path"]
                    if isfile(metadata_path): 
                        
                        initial_name = splitext(basename(metadata_path))[0]
                        
                        if existing_file_option == "replace":
                            if initial_name in my_bf_existing_files_name:
                                index_file = my_bf_existing_files_name.index(initial_name)
                                my_file = my_bf_existing_files[index_file]
                                my_file.delete() 
                            
                        if existing_file_option == "skip":
                            if initial_name in my_bf_existing_files_name:
                                continue
                                
                        list_upload_metadata_files.append(metadata_path)
        
        if list_upload_metadata_files:                 
            ds.upload(*list_upload_metadata_files)
    
    except Exception as e:
        raise e


def main_curate_function(soda_json_structure):
    main_keys = soda_json_structure.keys()
    error = []

    # 1] Check for potential errors

    # 1.1. Check that the local destination is valid if generate dataset locally is requested
    if "generate-dataset" in main_keys and soda_json_structure["generate-dataset"]["destination"] == "local":
        generate_dataset = soda_json_structure["generate-dataset"]
        local_dataset_path = generate_dataset["path"]
        # if generate_dataset["if-existing"] == "merge":
        #     local_dataset_path = join(local_dataset_path, generate_dataset["dataset-name"])
        if not isdir(local_dataset_path):
            error_message = 'Error: The Path ' + local_dataset_path + ' is not found. Please select a valid destination folder for the new dataset'
            curatestatus = 'Done'
            error.append(error_message)
            raise Exception(error)

    # 1.2. Check that the bf destination is valid if generate on bf, or any other bf actions are requested
    if "generate-dataset" in main_keys and soda_json_structure["generate-dataset"]["destination"] == "bf":
        accountname = soda_json_structure["bf-account-selected"]["account-name"]  

        # check that the blackfynn account is valid
        try:
            bf = Blackfynn(accountname)
        except Exception as e:
            curatestatus = 'Done'
            error.append('Error: Please select a valid Blackfynn account')
            raise Exception(error)
        
        # if uploading on an existing bf dataset
        dataset_name = soda_json_structure["generate-dataset"]["dataset-name"]
        if not dataset_name:
            # check that the blackfynn dataset is valid
            try:
                bfdataset = soda_json_structure["bf-dataset-selected"]["dataset-name"]
                myds = bf.get_dataset(bfdataset)
            except Exception as e:
                curatestatus = 'Done'
                error.append('Error: Please select a valid Blackfynn dataset')
                raise Exception(error)           

            # check that the user has permissions for uploading and modifying the dataset
            try:
                role = bf_get_current_user_permission(bf, myds)
                if role not in ['owner', 'manager', 'editor']:
                    curatestatus = 'Done'
                    error.append("Error: You don't have permissions for uploading to this Blackfynn dataset")
                    raise Exception(error)
            except Exception as e:
                raise e

    # 1.3. Check that specified dataset files and folders are valid (existing path) if generate dataset is requested
    # Note: Empty folders and 0 kb files will be removed without warning (a warning will be provided on the front end before starting the curate process)
    if "generate-dataset" in main_keys:
        generate_option = soda_json_structure["generate-dataset"]["generate-option"]
        # Check at least one file or folder are added to the dataset
        try:
            dataset_structure = soda_json_structure["dataset-structure"]
        except Exception as e:
            curatestatus = 'Done'
            error.append('Error: Your dataset is empty. Please add files/folders to your dataset')
            raise Exception(error) 

        # Check that local files/folders exist
        try:
            error = check_local_dataset_files_validity(soda_json_structure)
            print(error)
            if error: 
                curatestatus = 'Done'
                raise Exception(error)

            if not soda_json_structure["dataset-structure"]["folders"]:
                curatestatus = 'Done'
                error.append('Error: Your dataset is empty. Please add valid files and non-empty folders to your dataset')
                raise Exception(error) 

        except Exception as e:
            curatestatus = 'Done'
            raise e
        
        # Check that bf files/folders exist
        if generate_option == "existing-bf":
            try:
                if soda_json_structure["generate-dataset"]["destination"] == "bf":
                    error = bf_check_dataset_files_validity(soda_json_structure,bf)
                    if error: 
                        curatestatus = 'Done'
                        raise Exception(error)
            except Exception as e:
                curatestatus = 'Done'
                raise e

    # 3] Generate manifest files based on the json structure 
    manifest_files_structure = ""
    if "manifest-files" in main_keys:
        try:
            manifest_files_structure = create_high_level_manifest_files(soda_json_structure)
            print(manifest_files_structure)

            manifest_file_request = soda_json_structure["manifest-files"]
            if manifest_file_request["destination"] == "local":
                datasetpath = manifest_file_request["path"]
                add_local_manifest_files(manifest_files_structure, datasetpath)
            elif manifest_file_request["destination"] == "bf":
                bf_add_manifest_files(manifest_files_structure, myds)

        except Exception as e:
            curatestatus = 'Done'
            raise e
            
    # 4] Evaluate total size of data to be generated
    if "generate-dataset" in main_keys:
        generate_dataset_size = get_generate_dataset_size(soda_json_structure, manifest_files_structure)
        print("SIZE", generate_dataset_size)
        
    # 5] Generate
    if "generate-dataset" in main_keys:
        if soda_json_structure["generate-dataset"]["destination"] == "local":
            datasetpath = generate_dataset_locally(soda_json_structure)
            add_local_manifest_files(manifest_files_structure, datasetpath)
            
        if soda_json_structure["generate-dataset"]["destination"] == "bf":
            if generate_option == "new":
                if dataset_name:
                    myds = bf_create_new_dataset(dataset_name, bf)
                bf_generate_new_dataset(soda_json_structure, bf, myds)
                bf_add_manifest_files(manifest_files_structure, myds)