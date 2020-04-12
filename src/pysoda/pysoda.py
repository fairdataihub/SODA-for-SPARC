
# -*- coding: utf-8 -*-

### Import required python modules
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
# import threading
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

from openpyxl import load_workbook
from openpyxl import Workbook
from docx import Document

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

bf = ""
myds = ""
initial_bfdataset_size = 0
upload_directly_to_bf = 0
initial_bfdataset_size_submit = 0

forbidden_characters = '<>:"/\|?*'
forbidden_characters_bf = '\/:*?"<>'

### Internal functions
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


def create_folder_level_manifest(datasetpath, jsonpath, jsondescription):
    """
    Function to create manifest files for each SPARC folder.
    Files are created in a temporary folder

    Args:
        datasetpath: path of the dataset (string)
        jsonpath: all paths in json format with key being SPARC folder names (dictionary)
        jsondescription: description associated with each path (dictionary)
    Action:
        Creates manifest files in csv format for each SPARC folder
    """
    global total_dataset_size
    try:
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
                                filepath = join(paths,subdir,file) #full local file path
                                lastmodtime = getmtime(filepath)
                                timestamp.append(strftime('%Y-%m-%d %H:%M:%S',
                                                                      localtime(lastmodtime)))
                                fullfilename = basename(filepath)
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
                        file = basename(paths)
                        filename.append(file)
                        lastmodtime = getmtime(paths)
                        timestamp.append(strftime('%Y-%m-%d %H:%M:%S',
                                                  localtime(lastmodtime)))
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

def check_forbidden_characters_bf(my_string):
    """
    Check for forbidden characters in blackfynn file/folder name

    Args:
        my_string: string with characters (string)
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile('[' + forbidden_characters_bf + ']')
    if(regex.search(my_string) == None and "\\" not in r"%r" % my_string):
        return False
    else:
        return True

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

### Import Milestone document
def import_milestone(filepath):
    doc = Document(filepath)
    table = doc.tables[0]
    data = []
    keys = None
    for i, row in enumerate(table.rows):
        text = (cell.text for cell in row.cells)
        # headers will become the keys of our dictionary
        if i == 0:
            keys = tuple(text)
            continue
        # Construct a dictionary for this row, mapping
        # keys to values for this row
        row_data = dict(zip(keys, text))
        data.append(row_data)
    return data

def extract_milestone_info(datalist):
    milestone = defaultdict(list)
    milestone_key = "Related milestone, aim, or task"
    other_keys = ["Description of data", "Expected date of completion"]
    for row in datalist:
        key = row[milestone_key]
        milestone[key].append({key: row[key] for key in other_keys})
    return milestone

### Prepare submission file
def save_submission_file(filepath, json_str):
    source = join(dirname( __file__ ), "..", "file_templates", "submission.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)
    # json array to python list
    val_arr = json.loads(json_str)
    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb['Sheet1']
    # date_obj = datetime.strptime(val_arr[2], "%Y-%m")
    # date_new = date_obj.strftime("%m-%Y")
    ws1["C2"] = val_arr[0]
    ws1["C3"] = val_arr[1]
    ws1["C4"] = val_arr[2]

    wb.save(destination)

from string import ascii_uppercase
import itertools


def excel_columns():
    """
    NOTE: does not support more than 699 contributors/links
    """
    # start with column D not A
    single_letter = list(ascii_uppercase[3:])
    two_letter = [a + b for a,b in itertools.product(ascii_uppercase, ascii_uppercase)]
    return single_letter + two_letter

### Prepare dataset-description file
def save_ds_description_file(filepath, dataset_str, misc_str, optional_str, con_str):
    source = join(dirname( __file__ ), "..", "file_templates", "dataset_description.xlsx")
    destination = filepath
    shutil.copyfile(source, destination)

    # json array to python list
    val_arr_ds = json.loads(dataset_str)
    val_arr_con = json.loads(con_str)
    val_arr_misc = json.loads(misc_str)
    val_arr_optional = json.loads(optional_str)

    # write to excel file
    wb = load_workbook(destination)
    ws1 = wb['Sheet1']

    ## name, description, keywords, samples, subjects
    ws1["D2"] = val_arr_ds[0]
    ws1["D3"] = val_arr_ds[1]
    ws1["D4"] = ", ".join(val_arr_ds[2])
    ws1["D16"] = val_arr_ds[3]
    ws1["D17"] = val_arr_ds[4]

    ## contributor info
    ws1["D10"] = val_arr_con["acknowlegdment"]
    ws1["D11"] = val_arr_con["funding"]
    for contributor, column in zip(val_arr_con['contributors'], excel_columns()):
        ws1[column + "5"] = contributor["conName"]
        ws1[column + "6"] = contributor["conID"]
        ws1[column + "7"] = contributor["conAffliation"]
        ws1[column + "8"] = contributor["conRole"]
        ws1[column + "9"] = contributor["conContact"]

    ## originating DOI, Protocol DOI
    ws1["D12"] = ", ".join(val_arr_misc["doi"])
    ws1["D13"] = ", ".join(val_arr_misc["url"])
    for link, column in zip(val_arr_misc['additional links'], excel_columns()):
        ws1[column + "14"] = link["link"]
        ws1[column + "15"] = link["description"]

    ## completeness, parent dataset ID, title Respectively
    ws1["D18"] = val_arr_optional["completeness"]
    ws1["D19"] = val_arr_optional["parentDS"]
    ws1["D20"] = val_arr_optional["completeDSTitle"]

    wb.save(destination)

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
                        for path, dirs, files in walk(path):
                            for f in files:
                                fp = join(path, f)
                                mypathsize =  getsize(fp)
                                if mypathsize == 0:
                                    c += 1
                                    error = error + path + ' is 0 KB <br>'
                                else:
                                    total_dataset_size += mypathsize
                else:
                    c += 1
                    error = error + path + ' does not exist <br>'

    if c > 0:
        error = error + '<br>Please remove invalid paths'
        curatestatus = 'Done'
        raise Exception(error)

    total_dataset_size = total_dataset_size - 1

    # Add metadata to jsonpath
    userpath = expanduser("~")
    metadatapath = join(userpath, 'SODA', 'SODA_metadata')
    curateprogress = 'Generating metadata'

    if manifeststatus:
        try:
            shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
            makedirs(metadatapath)
            jsonpath = create_folder_level_manifest(metadatapath, jsonpath, jsondescription)
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
            role = bf_get_current_user_permission(accountname, bfdataset)
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


### Manage datasets (Blackfynn interface)
def bf_add_account(keyname, key, secret):
    """
    Associated with 'Add account' button in 'Login to your Blackfynn account' section of SODA

    Args:
        keyname: Name of the account to be associated with the given credentials (string)
        key: API key (string)
        secret: API Secret (string)
    Action:
        Adds account to the Blackfynn configuration file (local machine)
    """
    try:
        error, c = '', 0
        keyname = keyname.strip()
        if (not keyname) or (not key) or (not secret):
            raise Exception('Error: Please enter valid keyname, key, and/or secret')

        if (keyname.isspace()) or (key.isspace()) or (secret.isspace()):
            raise Exception('Error: Please enter valid keyname, key, and/or secret')

        bfpath = join(userpath, '.blackfynn')
        # Load existing or create new config file
        config = ConfigParser()
        if exists(configpath):
            config.read(configpath)
            if config.has_section(keyname):
                raise Exception('Error: Key name already exists')
        else:
            if not exists(bfpath):
                mkdir(bfpath)
            if not exists(join(bfpath, 'cache')):
                mkdir(join(bfpath, 'cache'))

        # Add agent section
        agentkey = 'agent'
        if not config.has_section(agentkey):
            config.add_section(agentkey)
            config.set(agentkey, 'proxy_local_port', '8080')
            # config.set(agentkey, 'cache_base_path', join(bfpath, 'cache'))
            config.set(agentkey, 'uploader', 'true')
            config.set(agentkey, 'cache_hard_cache_size', '10000000000')
            config.set(agentkey, 'status_port', '11235')
            config.set(agentkey, 'metrics', 'true')
            config.set(agentkey, 'cache_page_size', '100000')
            config.set(agentkey, 'proxy', 'true')
            config.set(agentkey, 'cache_soft_cache_size', '5000000000')
            config.set(agentkey, 'timeseries_local_port', '9090')
            config.set(agentkey, 'timeseries', 'true')

        # Add new account
        config.add_section(keyname)
        config.set(keyname, 'api_token', key)
        config.set(keyname, 'api_secret', secret)

        with open(configpath, 'w') as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    # Check key and secret are valid, if not delete account from config
    try:
        bf = Blackfynn(keyname)

        if not config.has_section("global"):
            config.add_section("global")

        default_acc = config["global"]
        default_acc["default_profile"] = keyname

        with open(configpath, 'w') as configfile:
            config.write(configfile)
        return 'Successfully added account ' + str(bf)

    except:
        bf_delete_account(keyname)
        raise Exception('Authentication Error: please check that key name, key, and secret are entered properly')


def bf_delete_account(keyname):
    """
    Args:
        keyname: name of local Blackfynn account key (string)
    Action:
        Deletes account information from the Blackfynn config file
    """
    config = ConfigParser()
    config.read(configpath)
    config.remove_section(keyname)
    with open(configpath, 'w') as configfile:
        config.write(configfile)


def bf_account_list():
    """
    Action:
        Returns list of accounts stored in the system
    """
    try:
        accountlist = ['Select']
        if exists(configpath):
            config = ConfigParser()
            config.read(configpath)
            accountname = config.sections()
            accountnamenoglobal = [n for n in accountname]
            # if accountnamenoglobal:
            for n in accountnamenoglobal:
                try:
                    bfn = Blackfynn(n)
                    accountlist.append(n)
                except Exception as e:
                    pass
            with open(configpath, 'w') as configfile:
                config.write(configfile)
        return accountlist
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
            config = ConfigParser()
            config.read(configpath)
            keys = config.sections()
            accountlist = []
            if "global" in keys:
                default_acc = config["global"]
                if "default_profile" in default_acc:
                    n = default_acc["default_profile"]
                    try:
                        bfn = Blackfynn(n)
                        accountlist.append(n)
                    except Exception as e:
                        return accountlist
            # accountnamenoglobal = [n for n in accountname]
            # if accountnamenoglobal:
            #     for n in accountnamenoglobal:
            #         try:
            #             bfn = Blackfynn(n)
            #             accountlist.append(n)
            #             break
            #         except:
            #             pass
            #     with open(configpath, 'w') as configfile:
            #         config.write(configfile)
        return accountlist
    except Exception as e:
        raise e

def bf_dataset_account(accountname):
    """
    Args:
        accountname: name of local Blackfynn account key (string)
    Return:
        dataset_list: list of datasets associated with the specified account Name (list of string)
    Action:
        Returns list of datasets associated with the specified account Name ('accountname')
    """
    try:
        dataset_list = []
        bf = Blackfynn(accountname)
        current_user = bf._api._get('/user')
        current_user_id = current_user['id']
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        dataset_list.sort(key=lambda v: v.upper()) # Returning the list of datasets in alphabetical order
        dataset_list.insert(0, ['Select dataset'])
        return dataset_list
    except Exception as e:
        raise e


def bf_account_details(accountname):
    """
    Args:
        accountname: name of local Blackfynn account key (string)
    Return:
        acc_details: account user email and organization (string)
    Action:
        Returns: return details of user associated with the account
    """
    try:
        bf = Blackfynn(accountname)
        acc_details = "User email: " + bf.profile.email + "<br>"
        acc_details = acc_details + "Organization: " + bf.context.name

        if exists(configpath):
            config = ConfigParser()
            config.read(configpath)

        if not config.has_section("global"):
            config.add_section("global")
            config.set("global", "default_profile", accountname)
        else:
            config["global"]["default_profile"] = accountname

        with open(configpath, 'w') as configfile:
            config.write(configfile)

        return acc_details

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

        try:
            bf = Blackfynn(accountname)
        except Exception as e:
            error = error + 'Error: Please select a valid Blackfynn account' + "<br>"
            c += 1

        if c>0:
            raise Exception(error)

        dataset_list = []
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        if datasetname in dataset_list:
            raise Exception('Error: Dataset name already exists')
        else:
            bf.create_dataset(datasetname)

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
    error, c = '', 0
    datasetname = renamed_dataset_name.strip()

    try:
        role = bf_get_current_user_permission(accountname, current_dataset_name)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions to change the name of this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise(e)

    if check_forbidden_characters_bf(datasetname):
        error = error + 'Error: A Blackfynn dataset name cannot contain any of the following characters: ' + forbidden_characters_bf + "<br>"
        c += 1

    if (not datasetname):
        error = error + 'Error: Please enter valid new dataset name' + "<br>"
        c += 1

    if (datasetname.isspace()):
        error = error + 'Error: Please enter valid new dataset name' + "<br>"
        c += 1

    try:
        bf = Blackfynn(accountname)
    except Exception as e:
        error = error + 'Error: Please select a valid Blackfynn account' + "<br>"
        c += 1

    if c>0:
        raise Exception(error)

    try:
        myds = bf.get_dataset(current_dataset_name)
    except Exception as e:
        error = error + 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    dataset_list = []
    for ds in bf.datasets():
        dataset_list.append(ds.name)
    if datasetname in dataset_list:
        raise Exception('Error: Dataset name already exists')
    else:
        myds = bf.get_dataset(current_dataset_name)
        selected_dataset_id = myds.id
        jsonfile = {'name': datasetname}
        bf._api.datasets._put('/' + str(selected_dataset_id), 
            json=jsonfile)


def clear_queue():
    command = [agent_cmd(), "upload-status", "--cancel-all"]

    proc = subprocess.run(command, check=True)   # env=agent_env(?settings?)
    return proc


def agent_running():
    logger = get_logger('blackfynn.agent')
    listen_port = 11235

    try:
        logger.debug("Checking port %s", listen_port)
        create_connection(socket_address(listen_port)).close()

    except socket.error as e:

        if e.errno == errno.ECONNREFUSED:  # ConnectionRefusedError for Python 3
            logger.debug("No agent found, port %s OK", listen_port)
            return True
        else:
            raise
    else:
        raise AgentError("The Blackfynn agent is already running. Please go to your Task Manager/Activity Monitor to stop any running blackfynn_agent processes and try again")

    socket_address(listen_port)


def bf_submit_dataset(accountname, bfdataset, pathdataset):
    """
    Associated with 'Submit dataset' button in 'Submit new dataset' section
    Uploads the specified folder to the specified dataset on Blackfynn account

    Input:
        accountname: account in which the dataset needs to be created (string)
        bfdataset: name of the dataset on Blackfynn (string)
        pathdataset: path of dataset on local machine (string)
    Action:
        Uploads dataset on Blackfynn account
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

    submitdataprogress = ' '
    submitdatastatus = ' '
    uploaded_file_size = 0
    submitprintstatus = ' '
    start_time_bf_upload = 0
    initial_bfdataset_size_submit = 0
    start_submit = 0

    try:
        bf = Blackfynn(accountname)
    except Exception as e:
        submitdatastatus = 'Done'
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    error, c = '', 0
    try:
        myds = bf.get_dataset(bfdataset)
    except Exception as e:
        submitdatastatus = 'Done'
        error = error + 'Error: Please select a valid Blackfynn dataset' + '<br>'
        c += 1

    if not isdir(pathdataset):
        submitdatastatus = 'Done'
        error = error + 'Error: Please select a valid local dataset folder' + '<br>'
        c += 1

    if c>0:
        raise Exception(error)

    error, c = '', 0
    total_file_size = 1
    try:
        for path, dirs, files in walk(pathdataset):
            for f in files:
                fp = join(path, f)
                mypathsize = getsize(fp)
                if mypathsize == 0:
                    c += 1
                    error = error + path + ' is 0 KB <br>'
                else:
                    total_file_size += mypathsize
    except Exception as e:
        raise e

    if c>0:
        submitdatastatus = 'Done'
        error = error + '<br>Please remove invalid files from your dataset'
        raise Exception(error)

    total_file_size = total_file_size - 1

    role = bf_get_current_user_permission(accountname, bfdataset)
    if role not in ['owner', 'manager', 'editor']:
        submitdatastatus = 'Done'
        error = "Error: You don't have permissions for uploading to this Blackfynn dataset"
        raise Exception(error)

    clear_queue()
    try:
        agent_running()
        def calluploadfolder():

            try:

                global submitdataprogress
                global submitdatastatus

                myds = bf.get_dataset(bfdataset)

                for filename in listdir(pathdataset):
                    filepath = join(pathdataset, filename)
                    if isdir(filepath):
                        submitdataprogress = "Uploading folder '%s' to dataset '%s \n' " %(filepath, bfdataset)
                        myds.upload(filepath, recursive=True, use_agent=True)
                    else:
                        submitdataprogress = "Uploading file '%s' to dataset '%s \n' " %(filepath, bfdataset)
                        myds.upload(filepath, use_agent=True)
                submitdataprogress = 'Success: COMPLETED!'
                submitdatastatus = 'Done'

            except Exception as e:
                raise e

        submitprintstatus = 'Uploading'
        start_time_bf_upload = time.time()
        initial_bfdataset_size_submit = bf_dataset_size()
        start_submit = 1
        gev = []
        gev.append(gevent.spawn(calluploadfolder))
        gevent.sleep(0)
        gevent.joinall(gev)
        submitdatastatus = 'Done'

        try:
            return gev[0].get()
        except Exception as e:
            raise e

    except Exception as e:
        submitdatastatus = 'Done'
        raise e

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
        elapsed_time_formatted_display = '<br>' + 'Elapsed time: ' + elapsed_time_formatted + '<br>'
    else:
        uploaded_file_size = 0
        elapsed_time_formatted = 0
        elapsed_time_formatted_display = '<br>' + 'Initiating...' + '<br>'
    #gevent.sleep(0)
    return (submitdataprogress + elapsed_time_formatted_display, submitdatastatus, submitprintstatus, total_file_size, uploaded_file_size, elapsed_time_formatted)


def bf_get_users(selected_bfaccount):
    """
    Function to get list of users belonging to the organization of
    the given Blackfynn account

    Args:
      selected_bfaccount: name of selected Blackfynn acccount (string)
    Retun:
        list_users : list of users (first name -- last name) associated with the organization of the
        selected Blackfynn account (list of string)
    """
    try:
        # def get_users_list():
        bf = Blackfynn(selected_bfaccount)
        organization_name = bf.context.name
        organization_id = bf.context.id
        list_users = bf._api._get('/organizations/' + str(organization_id) + '/members')
        list_users_first_last = []
        for i in range(len(list_users)):
                first_last = list_users[i]['firstName'] + ' ' + list_users[i]['lastName']
                list_users_first_last.append(first_last)
        list_users_first_last.sort() # Returning the list of users in alphabetical order
        return list_users_first_last
        # list_users_first_last = gevent.spawn(get_users_list())
        # gevent.sleep(0)
        # return list_users_first_last
    except Exception as e:
        raise e


def bf_get_teams(selected_bfaccount):
    """
    Args:
      selected_bfaccount: name of selected Blackfynn acccount (string)
    Return:
        list_teams : list of teams (name) associated with the organization of the
        selected Blackfynn account (list of string)
    Action:
        Provides list of teams belonging to the organization of
        the given Blackfynn account
    """
    try:
        bf = Blackfynn(selected_bfaccount)
        organization_name = bf.context.name
        organization_id = bf.context.id
        list_teams = bf._api._get('/organizations/' + str(organization_id) + '/teams')
        list_teams_name = []
        for i in range(len(list_teams)):
                team_name = list_teams[i]['team']['name']
                list_teams_name.append(team_name)
        list_teams_name.sort() # Returning the list of teams in alphabetical order
        return list_teams_name
    except Exception as e:
        raise e


def bf_get_permission(selected_bfaccount, selected_bfdataset):

    """
    Function to get permission for a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Output:
        list_permission: list of permission (first name -- last name -- role) associated with the
        selected dataset (list of string)
    """

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset' + '<br>'
        raise Exception(error)

    try:
        # user permissions
        selected_dataset_id = myds.id
        list_dataset_permission = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/users')
        list_dataset_permission_first_last_role = []
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]['firstName']
            last_name = list_dataset_permission[i]['lastName']
            role = list_dataset_permission[i]['role']
            list_dataset_permission_first_last_role.append('User ' +  first_name + ' ' + last_name + ' , role: ' + role)

        # team permissions
        list_dataset_permission_teams = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/teams')
        for i in range(len(list_dataset_permission_teams)):
            team_keys = list(list_dataset_permission_teams[i].keys())
            if 'role' in team_keys:
                team_name = list_dataset_permission_teams[i]['name']
                team_role = list_dataset_permission_teams[i]['role']
                list_dataset_permission_first_last_role.append('Team ' + team_name + ', role: ' + team_role)

        # Organization permissions
        list_dataset_permission_organizations = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/organizations')
        if type(list_dataset_permission_organizations) is dict:
                organization_keys = list(list_dataset_permission_organizations.keys())
                if 'role' in organization_keys:
                    organization_name = list_dataset_permission_organizations['name']
                    organization_role = list_dataset_permission_organizations['role']
                    list_dataset_permission_first_last_role.append('Organization ' + organization_name + ', role: ' + organization_role)
        else:
            for i in range(len(list_dataset_permission_organizations)):
                organization_keys = list(list_dataset_permission_organizations[i].keys())
                if 'role' in organization_keys:
                    organization_name = list_dataset_permission_organizations[i]['name']
                    organization_role = list_dataset_permission_organizations[i]['role']
                    list_dataset_permission_first_last_role.append('Organization ' + organization_name + ', role: ' + organization_role)

        return list_dataset_permission_first_last_role

    except Exception as e:
        raise e

def bf_get_current_user_permission(selected_bfaccount, selected_bfdataset):

    """
    Function to get the permission of currently logged in user for a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Output:
        permission of current user (string)
    """

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset' + '<br>'
        raise Exception(error)

    try:
        # user permissions
        current_user_email = bf.profile.email
        selected_dataset_id = myds.id
        list_dataset_permission = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/users')
        c = 0
        for i in range(len(list_dataset_permission)):
            email = list_dataset_permission[i]['email']
            role = list_dataset_permission[i]['role']
            if current_user_email == email:
                res = role
                c +=1
        if c == 0:
            res = "No permission"
        return res

    except Exception as e:
        raise e


def bf_add_permission(selected_bfaccount, selected_bfdataset, selected_user, selected_role):

    """
    Function to add/remove permission for a suser to a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        selected_user: name (first name -- last name) of selected Blackfynn user (string)
        selected_role: desired role ('manager', 'viewer', 'editor', 'remove current permissions') (string)
    Return:
        success or error message (string)
    """

    error = ''
    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = error + 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    c = 0
    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = error + 'Error: Please select a valid Blackfynn dataset' + '<br>'
        c += 1

    try:
        organization_name = bf.context.name
        organization_id = bf.context.id
        list_users = bf._api._get('/organizations/' + str(organization_id) + '/members')
        dict_users = {}
        list_users_firstlast = []
        for i in range(len(list_users)):
            list_users_firstlast.append(list_users[i]['firstName'] + ' ' + list_users[i]['lastName'] )
            dict_users[list_users_firstlast[i]] = list_users[i]['id']
        if selected_user not in list_users_firstlast:
            error = error + 'Error: Please select a valid user' + '<br>'
            c += 1
    except Exception as e:
        raise e

    if selected_role not in ['manager', 'viewer', 'editor', 'owner', 'remove current permissions']:
        error = error + 'Error: Please select a valid role' + '<br>'
        c += 1

    if c > 0:
        raise Exception(error)
    else:
        try:
            selected_dataset_id = myds.id
            selected_user_id = dict_users[selected_user]

            # check that currently logged in user is a manager or a owner of the selected dataset (only manager and owner can change dataset permission)
            current_user = bf._api._get('/user')
            first_name_current_user = current_user['firstName']
            last_name_current_user = current_user['lastName']
            list_dataset_permission = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/users')
            c = 0
            for i in range(len(list_dataset_permission)):
                first_name = list_dataset_permission[i]['firstName']
                last_name = list_dataset_permission[i]['lastName']
                role = list_dataset_permission[i]['role']
                user_id = list_dataset_permission[i]['id']
                if (first_name == first_name_current_user and last_name == last_name_current_user):
                    if role not in ['owner', 'manager']:
                        raise Exception('Error: you must be dataset owner or manager to change its permissions')
                    elif selected_role == 'owner' and role != 'owner':
                        raise Exception('Error: you must be dataset owner to change the ownership')
                    else:
                        c += 1
                #check if selected user is owner, dataset permission cannot be changed for owner
                if user_id == selected_user_id and role == 'owner':
                    raise Exception("Error: owner's permission cannot be changed")

            if (c == 0):
                raise Exception('Error: you must be dataset owner or manager to change its permissions')

            if (selected_role == 'remove current permissions'):

                bf._api.datasets._del('/' + str(selected_dataset_id) + '/collaborators/users'.format(dataset_id = selected_dataset_id),
                              json={'id': selected_user_id})
                return "Permission removed for " + selected_user
            elif (selected_role == 'owner'):
                #check if currently logged in user is owner of selected dataset (only owner can change owner)

                # change owner
                bf._api.datasets._put('/' + str(selected_dataset_id) + '/collaborators/owner'.format(dataset_id = selected_dataset_id),
                              json={'id': selected_user_id})
                return "Permission " + "'" + selected_role + "' " +  " added for " + selected_user
            else:
                bf._api.datasets._put('/' + str(selected_dataset_id) + '/collaborators/users'.format(dataset_id = selected_dataset_id),
                              json={'id': selected_user_id, 'role': selected_role})
                return "Permission " + "'" + selected_role + "' " +  " added for " + selected_user
        except Exception as e:
                raise e


def bf_add_permission_team(selected_bfaccount, selected_bfdataset, selected_team, selected_role):

    """
    Function to add/remove permission fo a team to a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        selected_team: name of selected Blackfynn team (string)
        selected_role: desired role ('manager', 'viewer', 'editor', 'remove current permissions') (string)
    Return:
        success or error message (string)
    """

    error = ''

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        if (selected_team == 'SPARC Data Curation Team'):
            if bf.context.name != 'SPARC Consortium':
                raise Exception('Error: Please login under the SPARC Consortium organization to share with Curation Team')
    except Exception as e:
        raise e

    c = 0

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = error + 'Error: Please select a valid Blackfynn dataset' + '<br>'
        c += 1

    try:
        organization_name = bf.context.name
        organization_id = bf.context.id
        list_teams = bf._api._get('/organizations/' + str(organization_id) + '/teams')
        dict_teams = {}
        list_teams_name = []
        for i in range(len(list_teams)):
                list_teams_name.append(list_teams[i]['team']['name'])
                dict_teams[list_teams_name[i]] = list_teams[i]['team']['id']
        if selected_team not in list_teams_name:
           error = error + 'Error: Please select a valid team' + '<br>'
           c += 1
    except Exception as e:
        raise e

    if selected_role not in ['manager', 'viewer', 'editor', 'remove current permissions']:
        error = error + 'Error: Please select a valid role' + '<br>'
        c += 1

    if c > 0:
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        selected_team_id = dict_teams[selected_team]

        # check that currently logged in user is a manager or a owner of the selected dataset (only manager and owner can change dataset permission)
        current_user = bf._api._get('/user')
        first_name_current_user = current_user['firstName']
        last_name_current_user = current_user['lastName']
        list_dataset_permission = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/users')
        c = 0
        for i in range(len(list_dataset_permission)):
            first_name = list_dataset_permission[i]['firstName']
            last_name = list_dataset_permission[i]['lastName']
            role = list_dataset_permission[i]['role']
            user_id = list_dataset_permission[i]['id']
            if (first_name == first_name_current_user and last_name == last_name_current_user):
                if role not in ['owner', 'manager']:
                    raise Exception('Error: you must be dataset owner or manager to change its permissions')
                else:
                    c += 1
        if (c == 0):
            raise Exception('Error: you must be dataset owner or manager to change its permissions')

        if (selected_role == 'remove current permissions'):

            bf._api.datasets._del('/' + str(selected_dataset_id) + '/collaborators/teams'.format(dataset_id = selected_dataset_id),
                          json={'id': selected_team_id})
            return "Permission removed for " + selected_team
        else:
            bf._api.datasets._put('/' + str(selected_dataset_id) + '/collaborators/teams'.format(dataset_id = selected_dataset_id),
                          json={'id': selected_team_id, 'role': selected_role})
            return "Permission " + "'" + selected_role + "' " +  " added for " + selected_team
    except Exception as e:
            raise e


"""
    Function to get current subtitle associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        License name, if any, or "No license" message
    """
def bf_get_subtitle(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        dataset_info = bf._api._get('/datasets/' + str(selected_dataset_id))
        res = dataset_info['content']['description']
        return res
    except Exception as e:
        raise Exception(e)


"""
    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        input_subtitle: subtitle limited to 256 characters (string)
    Action:
        Add/change subtitle for a selected dataset
    Return:
        Success messsge or error
    """
def bf_add_subtitle(selected_bfaccount, selected_bfdataset, input_subtitle):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions for editing metadata on this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        jsonfile = {'description': input_subtitle}
        bf._api.datasets._put('/' + str(selected_dataset_id),
                              json=jsonfile)
        return 'Subtitle added!'
    except Exception as e:
        raise Exception(e)


"""
    Function to get current description associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        Description (string with markdown code)
    """
def bf_get_description(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        dataset_readme_info = bf._api._get('/datasets/' + str(selected_dataset_id) + '/readme')
        res = dataset_readme_info['readme']
        return res
    except Exception as e:
        raise Exception(e)


"""
    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        markdown_input: description with markdown formatting (string)
    Action:
        Add/change desciption for a selected dataset
    Return:
        Success messsge or error
    """
def bf_add_description(selected_bfaccount, selected_bfdataset, markdown_input):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions for editing metadata on this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        jsonfile = {'readme': markdown_input}
        bf._api.datasets._put('/' + str(selected_dataset_id) + '/readme',
                              json=jsonfile)
        return 'Description added!'
    except Exception as e:
        raise Exception(e)


"""
    Function to get url of current banner image associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        url of banner image (string)
    """
def bf_get_banner_image(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        dataset_banner_info = bf._api._get('/datasets/' + str(selected_dataset_id) + '/banner')
        list_keys = dataset_banner_info.keys()
        if 'banner' in list_keys:
            res = dataset_banner_info['banner']
        else:
            res = 'No banner image'
        return res
    except Exception as e:
        raise Exception(e)


"""
    Function to add banner to a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        selected_banner_image: name of selected Blackfynn dataset (data-uri)
    Return:
        Success or error message
    """
def bf_add_banner_image(selected_bfaccount, selected_bfdataset, banner_image_path):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions for editing metadata on this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        def upload_image():
            with open(banner_image_path, "rb") as f:
                bf._api._put('/datasets/' + str(selected_dataset_id) + '/banner', files={"banner": f})
        #delete banner image folder if it is located in SODA
        gevent.spawn(upload_image())
        image_folder = dirname(banner_image_path)
        if isdir(image_folder) and ('SODA' in image_folder):
            shutil.rmtree(image_folder, ignore_errors=True)
        return('Uploaded!')
    except Exception as e:
        raise Exception(e)


"""
    Function to get current license associated with a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        License name, if any, or "No license" message
    """
def bf_get_license(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        dataset_info = bf._api._get('/datasets/' + str(selected_dataset_id))
        list_keys = dataset_info['content'].keys()
        if 'license' in list_keys:
            res = dataset_info['content']['license']
        else:
            res = 'No license is currently assigned to this dataset'
        return res
    except Exception as e:
        raise Exception(e)


"""
    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        selected_license: name of selected license (string)
    Action:
        Add/change license for a selected dataset
    Return:
        Success messsge or error
    """
def bf_add_license(selected_bfaccount, selected_bfdataset, selected_license):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions for editing metadata on this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        allowed_licenses_list = [
            'Community Data License Agreement – Permissive',
            'Community Data License Agreement – Sharing',
            'Creative Commons Zero 1.0 Universal',
            'Creative Commons Attribution',
            'Creative Commons Attribution - ShareAlike',
            'Open Data Commons Open Database',
            'Open Data Commons Attribution',
            'Open Data Commons Public Domain Dedication and License',
            'Apache 2.0',
            'GNU General Public License v3.0',
            'GNU Lesser General Public License',
            'MIT',
            'Mozilla Public License 2.0'
            ]
        if selected_license not in allowed_licenses_list:
            error = 'Error: Please select a valid license'
            raise Exception(error)
        selected_dataset_id = myds.id
        jsonfile = {'license': selected_license}
        bf._api.datasets._put('/' + str(selected_dataset_id),
                              json=jsonfile)
        return 'License added!'
    except Exception as e:
        raise Exception(e)


"""
    Function to get current status for a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        List of available status options for the account (list of string).
        Current dataset status (string)
    """
def bf_get_dataset_status(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        #get list of available status options
        organization_id = bf.context.id
        list_status = bf._api._get('/organizations/' + str(organization_id) + '/dataset-status')
        #get current status of select dataset
        selected_dataset_id = myds.id
        dataset_current_status = bf._api._get('/datasets/' + str(selected_dataset_id))['content']['status']
        return [list_status, dataset_current_status]
    except Exception as e:
        raise Exception(e)

"""
    Function to get current status for a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
        selected_status: display name of selected status (string)
    Return:
        success message
    """
def bf_change_dataset_status(selected_bfaccount, selected_bfdataset, selected_status):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions for changing the status of this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        #find name corresponding to display name or show error message
        organization_id = bf.context.id
        list_status = bf._api._get('/organizations/' + str(organization_id) + '/dataset-status')
        c = 0
        for option in list_status:
            if option['displayName'] == selected_status:
                new_status = option['name']
                c += 1
                break
        if c==0:
            error = "Error: Selected status is not available for this blackfynn account"
            raise Exception(error)

        #gchange dataset status
        selected_dataset_id = myds.id
        jsonfile = {'status': new_status}
        bf._api.datasets._put('/' + str(selected_dataset_id),
                              json=jsonfile)
        return "Success: Changed dataset status to " + selected_status
    except Exception as e:
        raise Exception(e)

"""
    Function to get current doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        Current doi or "None"
    """
def bf_get_doi(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions to view/edit DOI for this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        selected_dataset_id = myds.id
        doi_status = bf._api._get('/datasets/' + str(selected_dataset_id) + '/doi')
        return doi_status['doi']
    except Exception as e:
        if "doi" in str(e) and "not found" in str(e):
            error = "No DOI has been reserved for this dataset"
            raise Exception(error)
        else:
            raise e

"""
    Function to reserve doi for a selected dataset

    Args:
        selected_bfaccount: name of selected Blackfynn acccount (string)
        selected_bfdataset: name of selected Blackfynn dataset (string)
    Return:
        Success or error message
"""
def bf_reserve_doi(selected_bfaccount, selected_bfdataset):

    try:
        bf = Blackfynn(selected_bfaccount)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

    try:
        myds = bf.get_dataset(selected_bfdataset)
    except Exception as e:
        error = 'Error: Please select a valid Blackfynn dataset'
        raise Exception(error)

    try:
        role = bf_get_current_user_permission(selected_bfaccount, selected_bfdataset)
        if role not in ['owner', 'manager']:
            error = "Error: You don't have permissions to view/edit DOI for this Blackfynn dataset"
            raise Exception(error)
    except Exception as e:
        raise e

    try:
        bf_get_doi(selected_bfaccount, selected_bfdataset)
    except Exception as e: 
        if (str(e) == "No DOI has been reserved for this dataset"):
            pass
        else:
            raise e
    else:
        error = "Error: A DOI has already been reserved for this dataset"
        raise Exception(error)

    try:
        selected_dataset_id = myds.id
        contributors_list = bf._api._get('/datasets/' + str(selected_dataset_id) + '/contributors')
        creators_list = []
        for item in contributors_list:
            creators_list.append(item['firstName'] + ' ' + item['lastName'])
        jsonfile = {
        'title' : selected_bfdataset,
        'creators' : creators_list,
        }
        bf._api.datasets._post('/' + str(selected_dataset_id)+ '/doi', 
                              json=jsonfile)
        return 'Done!'
    except Exception as e:
        raise e