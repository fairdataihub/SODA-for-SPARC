# -*- coding: utf-8 -*-

### Import required python modules
from gevent import monkey

monkey.patch_all()
import platform
import os
from os import listdir, stat, makedirs, mkdir, walk, remove, pardir, rename
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
import io
from contextlib import redirect_stdout

from datetime import datetime, timezone

from validator_soda import (
    pathToJsonStruct,
    validate_high_level_folder_structure,
    validate_high_level_metadata_files,
    validate_sub_level_organization,
    validate_submission_file,
    validate_dataset_description_file,
)

from pysoda import (
    clear_queue,
    agent_running,
    check_forbidden_characters,
    check_forbidden_characters_bf,
    bf_dataset_size,
)

from organize_datasets import bf_get_dataset_files_folders

### Global variables
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
bf_recognized_file_extensions = [
    ".cram",
    ".jp2",
    ".jpx",
    ".lsm",
    ".ndpi",
    ".nifti",
    ".oib",
    ".oif",
    ".roi",
    ".rtf",
    ".swc",
    ".abf",
    ".acq",
    ".adicht",
    ".adidat",
    ".aedt",
    ".afni",
    ".ai",
    ".avi",
    ".bam",
    ".bash",
    ".bcl",
    ".bcl.gz",
    ".bin",
    ".brik",
    ".brukertiff.gz",
    ".continuous",
    ".cpp",
    ".csv",
    ".curv",
    ".cxls",
    ".czi",
    ".data",
    ".dcm",
    ".df",
    ".dicom",
    ".doc",
    ".docx",
    ".e",
    ".edf",
    ".eps",
    ".events",
    ".fasta",
    ".fastq",
    ".fcs",
    ".feather",
    ".fig",
    ".gif",
    ".h4",
    ".h5",
    ".hdf4",
    ".hdf5",
    ".hdr",
    ".he2",
    ".he5",
    ".head",
    ".hoc",
    ".htm",
    ".html",
    ".ibw",
    ".img",
    ".ims",
    ".ipynb",
    ".jpeg",
    ".jpg",
    ".js",
    ".json",
    ".lay",
    ".lh",
    ".lif",
    ".m",
    ".mat",
    ".md",
    ".mef",
    ".mefd.gz",
    ".mex",
    ".mgf",
    ".mgh",
    ".mgh.gz",
    ".mgz",
    ".mnc",
    ".moberg.gz",
    ".mod",
    ".mov",
    ".mp4",
    ".mph",
    ".mpj",
    ".mtw",
    ".ncs",
    ".nd2",
    ".nev",
    ".nex",
    ".nex5",
    ".nf3",
    ".nii",
    ".nii.gz",
    ".ns1",
    ".ns2",
    ".ns3",
    ".ns4",
    ".ns5",
    ".ns6",
    ".nwb",
    ".ogg",
    ".ogv",
    ".ome.btf",
    ".ome.tif",
    ".ome.tif2",
    ".ome.tif8",
    ".ome.tiff",
    ".ome.xml",
    ".openephys",
    ".pdf",
    ".pgf",
    ".png",
    ".ppt",
    ".pptx",
    ".ps",
    ".pul",
    ".py",
    ".r",
    ".raw",
    ".rdata",
    ".rh",
    ".rhd",
    ".sh",
    ".sldasm",
    ".slddrw",
    ".smr",
    ".spikes",
    ".svg",
    ".svs",
    ".tab",
    ".tar",
    ".tar.gz",
    ".tcsh",
    ".tdm",
    ".tdms",
    ".text",
    ".tif",
    ".tiff",
    ".tsv",
    ".txt",
    ".vcf",
    ".webm",
    ".xlsx",
    ".xml",
    ".yaml",
    ".yml",
    ".zip",
    ".zsh",
]
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
            subprocess.Popen(r"explorer /select," + str(file_path))
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
    start_path = "."  # To get size of current directory
    for path, dirs, files in walk(path):
        for f in files:
            fp = join(path, f)
            total_size += getsize(fp)
    return total_size


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


def return_new_path(topath):
    """
    This function checks if a folder already exists and in such cases,
    appends (1) or (2) etc. to the folder name

    Args:
        topath: path where the folder is supposed to be created (string)
    Returns:
        topath: new folder name based on the availability in destination folder (string)
    """
    if exists(topath):
        i = 1
        while True:
            if not exists(topath + " (" + str(i) + ")"):
                return topath + " (" + str(i) + ")"
            i += 1
    else:
        return topath


def time_format(elapsed_time):
    mins, secs = divmod(elapsed_time, 60)
    hours, mins = divmod(mins, 60)
    return "%dh:%02dmin:%02ds" % (hours, mins, secs)


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
    global main_generated_dataset_size

    while True:
        buf = fsrc.read(length)
        if not buf:
            break
        gevent.sleep(0)
        fdst.write(buf)
        curated_dataset_size += len(buf)
        main_generated_dataset_size += len(buf)


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


### Prepare dataset
# def save_file_organization(jsonpath, jsondescription, jsonpathmetadata, pathsavefileorganization):
#     """
#     Associated with 'Save' button in the SODA interface
#     Saves the paths and associated descriptions from the interface table to a CSV file for future use
#     Each json key (SPARC foler name) becomes a header in the CSV

#     Args:
#         jsonpath: paths of all files (dictionary)
#         jsondescription: description associated with each file (dictionary)
#         pathsavefileorganization: destination path for CSV file to be saved (string)
#     Action:
#         Creates CSV file with path and description for files in SPARC folders
#     """
#     try:
#         mydict = jsonpath
#         mydict2 = jsondescription
#         mydict3 = jsonpathmetadata
#         mydict.update(mydict2)
#         mydict.update(mydict3)
#         dictkeys = list(mydict.keys())
#         dictkeys.sort()
#         df = pd.DataFrame(columns=[dictkeys[0]])
#         df[dictkeys[0]] = mydict[dictkeys[0]]
#         for i in range(1,len(dictkeys)):
#             dfnew = pd.DataFrame(columns=[dictkeys[i]])
#             dfnew[dictkeys[i]] = mydict[dictkeys[i]]
#             df = pd.concat([df, dfnew], axis=1)
#         df = df.replace(np.nan, '', regex=True)
#         csvsavepath = join(pathsavefileorganization)
#         df.to_csv(csvsavepath, index = None, header=True)
#         return 'Saved!'
#     except Exception as e:
#         raise e


# def import_file_organization(pathuploadfileorganization, headernames):
#     """
#     Associated with 'Import' button in the SODA interface
#     Import previously saved progress (CSV file) for viewing in the SODA interface

#     Args:
#         pathuploadfileorganization: path of previously saved CSV file (string)
#         headernames: names of SPARC folder (list of strings)
#     Returns:
#         mydict: dictionary with headers of CSV file as keys and cell contents as list of strings for each key
#     """
#     try:
#         csvsavepath = join(pathuploadfileorganization)
#         df = pd.read_csv(csvsavepath)
#         dfnan = df.isnull()
#         mydict = {}
#         mydictmetadata ={}
#         dictkeys = df.columns
#         compare = lambda x, y: collections.Counter(x) == collections.Counter(y)
#         if not compare(dictkeys, headernames):
#             raise Exception("Error: Please select a valid file")
#         rowcount = len(df.index)
#         for i in range(len(dictkeys)):
#             pathvect = []
#             for j in range(rowcount):
#                 pathval = df.at[j, dictkeys[i]]
#                 if not dfnan.at[j, dictkeys[i]]:
#                     pathvect.append(pathval)
#                 else:
#                     pathvect.append("")
#             if dictkeys[i] == 'metadata':
#                 mydictmetadata[dictkeys[i]] = pathvect
#             else:
#                 mydict[dictkeys[i]] = pathvect
#         return [mydict, mydictmetadata]
#     except Exception as e:
#         raise e


# def create_preview_files(paths, folder_path):
#     """
#     Creates folders and empty files from original 'paths' to the destination 'folder_path'

#     Args:
#         paths: paths of all the files that need to be copied (list of strings)
#         folder_path: Destination to which the files / folders need to be copied (string)
#     Action:
#         Creates folders and empty files at the given 'folder_path'
#     """
#     try:
#         for p in paths:
#             gevent.sleep(0)
#             if isfile(p):
#                 file = basename(p)
#                 open(join(folder_path, file), 'a').close()
#             else:
#                 all_files = listdir(p)
#                 all_files_path = []
#                 for f in all_files:
#                     all_files_path.append(join(p, f))

#                 pname = basename(p)
#                 new_folder_path = join(folder_path, pname)
#                 makedirs(new_folder_path)
#                 create_preview_files(all_files_path, new_folder_path)
#         return
#     except Exception as e:
#         raise e


# def preview_file_organization(jsonpath):
#     """
#     Associated with 'Preview' button in the SODA interface
#     Creates a folder for preview and adds mock files from SODA table (same name as origin but 0 kb in size)
#     Opens the dialog box to showcase the files / folders added

#     Args:
#         jsonpath: dictionary containing all paths (keys are SPARC folder names)
#     Action:
#         Opens the dialog box at preview_path
#     Returns:
#         preview_path: path of the folder where the preview files are located
#     """
#     mydict = jsonpath
#     preview_path = join(userpath, "SODA", "Preview")
#     try:
#         if isdir(preview_path):
#             delete_preview_file_organization()
#             makedirs(preview_path)
#         else:
#             makedirs(preview_path)
#     except Exception as e:
#         raise e

#     try:

#         folderrequired = []
#         for i in mydict.keys():
#             if mydict[i] != []:
#                 folderrequired.append(i)
#                 if i != 'main':
#                     makedirs(join(preview_path, i))

#         def preview_func(folderrequired, preview_path):
#             for i in folderrequired:
#                 paths = mydict[i]
#                 if (i == 'main'):
#                     create_preview_files(paths, join(preview_path))
#                 else:
#                     create_preview_files(paths, join(preview_path, i))
#         output = []
#         output.append(gevent.spawn(preview_func, folderrequired, preview_path))
#         gevent.sleep(0)
#         gevent.joinall(output)

#         if len(listdir(preview_path)) > 0:
#             folder_in_preview = listdir(preview_path)[0]

#             open_file(join(preview_path, folder_in_preview))

#         else:
#             open_file(preview_path)

#         return preview_path

#     except Exception as e:
#         raise e


# def delete_preview_file_organization():
#     """
#     Associated with 'Delete Preview Folder' button of the SODA interface

#     Action:
#         Deletes the 'Preview' folder from the disk
#     """
#     try:
#         userpath = expanduser("~")
#         preview_path = join(userpath, "SODA", "Preview")
#         if isdir(preview_path):
#             shutil.rmtree(preview_path, ignore_errors=True)
#         else:
#             raise Exception("Error: Preview folder not present or already deleted!")
#     except Exception as e:
#         raise e


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

        # create SPARC folder structure
        for i in mydict.keys():
            if mydict[i] != []:
                folderrequired.append(i)
                if i != "main":
                    makedirs(join(pathdataset, i))

        # create all subfolders and generate a list of all files to copy
        listallfiles = []
        for i in folderrequired:
            if i == "main":
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
                        distdir = os.path.join(
                            outputpathdir, os.path.relpath(dirpath, tablepath)
                        )
                        if not os.path.isdir(distdir):
                            os.mkdir(distdir)
                        for file in filenames:
                            srcfile = os.path.join(dirpath, file)
                            distfile = os.path.join(distdir, file)
                            listallfiles.append([srcfile, distfile])
                else:
                    srcfile = tablepath
                    file = basename(tablepath)
                    distfile = os.path.join(outputpath, file)
                    listallfiles.append([srcfile, distfile])

        # copy all files to corresponding folders
        for fileinfo in listallfiles:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            curateprogress = "Copying " + str(srcfile)
            mycopyfile_with_metadata(srcfile, distfile)

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
        user_role = bf._api._get("/datasets/" + str(selected_dataset_id) + "/role")[
            "role"
        ]

        return user_role

    except Exception as e:
        raise e


# def curate_dataset(sourcedataset, destinationdataset, pathdataset, newdatasetname,\
#         manifeststatus, jsonpath, jsondescription):
#     """
#     Associated with 'Generate' button in the 'Generate dataset' section of SODA interface
#     Checks validity of files / paths / folders and then generates the files and folders
#     as requested along with progress status

#     Args:
#         sourcedataset: state of the source dataset ('already organized' or 'not organized')
#         destinationdataset: type of destination dataset ('modify existing', 'create new', or 'upload to pennsieve')
#         pathdataset: destination path of new dataset if created locally or name of pennsieve account (string)
#         newdatasetname: name of the local dataset or name of the dataset on pennsieve (string)
#         manifeststatus: boolean to check if user request manifest files
#         jsonpath: path of the files to be included in the dataset (dictionary)
#         jsondescription: associated description to be included in manifest file (dictionary)
#     """
#     global curatestatus #set to 'Done' when completed or error to stop progress tracking from front-end
#     global curateprogress #GUI messages shown to user to provide update on progress
#     global curateprintstatus # If = "Curating" Progress messages are shown to user
#     global total_dataset_size # total size of the dataset to be generated
#     global curated_dataset_size # total size of the dataset generated (locally or on pennsieve) at a given time
#     global start_time
#     global bf
#     global myds
#     global upload_directly_to_bf
#     global start_submit
#     global initial_bfdataset_size

#     curateprogress = ' '
#     curatestatus = ''
#     curateprintstatus = ' '
#     error, c = '', 0
#     curated_dataset_size = 0
#     start_time = 0
#     upload_directly_to_bf = 0
#     start_submit = 0
#     initial_bfdataset_size = 0

#     # if sourcedataset == 'already organized':
#     #     if not isdir(pathdataset):
#     #         curatestatus = 'Done'
#     #         raise Exception('Error: Please select a valid dataset folder')

#     if destinationdataset == 'create new':
#         if not isdir(pathdataset):
#             curatestatus = 'Done'
#             raise Exception('Error: Please select a valid folder for new dataset')
#         if not newdatasetname:
#             curatestatus = 'Done'
#             raise Exception('Error: Please enter a valid name for new dataset folder')
#         if check_forbidden_characters(newdatasetname):
#             curatestatus = 'Done'
#             raise Exception('Error: A folder name cannot contain any of the following characters ' + forbidden_characters)

#     # check if path in jsonpath are valid and calculate total dataset size
#     error, c = '', 0
#     total_dataset_size = 1
#     for folders in jsonpath.keys():
#         if jsonpath[folders] != []:
#             for path in jsonpath[folders]:
#                 if exists(path):

#                     if isfile(path):
#                         mypathsize =  getsize(path)
#                         if mypathsize == 0:
#                             c += 1
#                             error = error + path + ' is 0 KB <br>'
#                         else:
#                             total_dataset_size += mypathsize
#                     else:

#                         myfoldersize = folder_size(path)
#                         if myfoldersize == 0:
#                             c += 1
#                             error = error + path + ' is empty <br>'
#                         else:
#                             for path, dirs, files in walk(path):
#                                 for f in files:
#                                     fp = join(path, f)
#                                     mypathsize =  getsize(fp)
#                                     if mypathsize == 0:
#                                         c += 1
#                                         error = error + fp + ' is 0 KB <br>'
#                                     else:
#                                         total_dataset_size += mypathsize
#                                 for d in dirs:
#                                     dp = join(path,d)
#                                     myfoldersize = folder_size(dp)
#                                     if myfoldersize == 0:
#                                         c += 1
#                                         error = error + dp + ' is empty <br>'
#                 else:
#                     c += 1
#                     error = error + path + ' does not exist <br>'

#     if c > 0:
#         error = error + '<br>Please remove invalid files/folders from your dataset and try again'
#         curatestatus = 'Done'
#         raise Exception(error)

#     total_dataset_size = total_dataset_size - 1

#     # Add metadata to jsonpath
#     curateprogress = 'Generating metadata'

#     if manifeststatus:
#         try:
#             jsonpath = create_folder_level_manifest(jsonpath, jsondescription)
#         except Exception as e:
#             curatestatus = 'Done'
#             raise e

#     # CREATE NEW
#     if destinationdataset == 'create new':
#         try:
#             pathnewdatasetfolder = join(pathdataset, newdatasetname)
#             pathnewdatasetfolder  = return_new_path(pathnewdatasetfolder)
#             open_file(pathnewdatasetfolder)

#             curateprogress = 'Started'
#             curateprintstatus = 'Curating'
#             start_time = time.time()
#             start_submit = 1

#             pathdataset = pathnewdatasetfolder
#             mkdir(pathdataset)
#             create_dataset(jsonpath, pathdataset)

#             curateprogress = 'New dataset created'
#             curateprogress = 'Success: COMPLETED!'
#             curatestatus = 'Done'
#             shutil.rmtree(metadatapath) if isdir(metadatapath) else 0

#         except Exception as e:
#             curatestatus = 'Done'
#             shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
#             raise e

#     # UPLOAD TO Pennsieve
#     elif destinationdataset == 'upload to pennsieve':
#         error, c = '', 0
#         accountname = pathdataset
#         bfdataset = newdatasetname
#         upload_directly_to_bf = 1

#         try:
#             bf = Pennsieve(accountname)
#         except Exception as e:
#             curatestatus = 'Done'
#             error = error + 'Error: Please select a valid Pennsieve account<br>'
#             c += 1

#         try:
#             myds = bf.get_dataset(bfdataset)
#         except Exception as e:
#             curatestatus = 'Done'
#             error = error + 'Error: Please select a valid Pennsieve dataset<br>'
#             c += 1

#         if c>0:
#             shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
#             raise Exception(error)

#         try:
#             role = bf_get_current_user_permission(bf, myds)
#             if role not in ['owner', 'manager', 'editor']:
#                 curatestatus = 'Done'
#                 error = "Error: You don't have permissions for uploading to this Pennsieve dataset"
#                 raise Exception(error)
#         except Exception as e:
#             raise e

#         clear_queue()
#         try:
#             agent_running()
#             def calluploaddirectly():

#                 try:
#                     global curateprogress
#                     global curatestatus

#                     myds = bf.get_dataset(bfdataset)

#                     for folder in jsonpath.keys():
#                         if jsonpath[folder] != []:
#                             if folder != 'main':
#                                 mybffolder = myds.create_collection(folder)
#                             else:
#                                 mybffolder = myds
#                             for mypath in jsonpath[folder]:
#                                 if isdir(mypath):
#                                     curateprogress = "Uploading folder '%s' to dataset '%s' " %(mypath, bfdataset)
#                                     mybffolder.upload(mypath, recursive=True, use_agent=True)
#                                 else:
#                                     curateprogress = "Uploading file '%s' to dataset '%s' " %(mypath, bfdataset)
#                                     mybffolder.upload(mypath, use_agent=True)

#                     curateprogress = 'Success: COMPLETED!'
#                     curatestatus = 'Done'
#                     shutil.rmtree(metadatapath) if isdir(metadatapath) else 0

#                 except Exception as e:
#                     shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
#                     raise e


#             curateprintstatus = 'Curating'
#             start_time = time.time()
#             initial_bfdataset_size = bf_dataset_size()
#             start_submit = 1
#             gev = []
#             gev.append(gevent.spawn(calluploaddirectly))
#             gevent.sleep(0)
#             gevent.joinall(gev) #wait for gevent to finish before exiting the function
#             curatestatus = 'Done'

#             try:
#                 return gev[0].get()
#             except Exception as e:
#                 raise e

#         except Exception as e:
#             curatestatus = 'Done'
#             shutil.rmtree(metadatapath) if isdir(metadatapath) else 0
#             raise e

# def curate_dataset_progress():
#     """
#     Function frequently called by front end to help keep track of the dataset generation progress
#     """
#     global curateprogress
#     global curatestatus
#     global curateprintstatus
#     global total_dataset_size
#     global curated_dataset_size
#     global start_time
#     global upload_directly_to_bf
#     global start_submit
#     global initial_bfdataset_size

#     if start_submit == 1:
#         if upload_directly_to_bf == 1:
#             curated_dataset_size = bf_dataset_size() - initial_bfdataset_size
#         elapsed_time = time.time() - start_time
#         elapsed_time_formatted = time_format(elapsed_time)
#         elapsed_time_formatted_display = '<br>' + 'Elapsed time: ' + elapsed_time_formatted + '<br>'
#     else:
#         if upload_directly_to_bf == 1:
#             curated_dataset_size = 0
#         elapsed_time_formatted = 0
#         elapsed_time_formatted_display = '<br>' + 'Initiating...' + '<br>'

#     return (curateprogress+elapsed_time_formatted_display, curatestatus, curateprintstatus, total_dataset_size, curated_dataset_size, elapsed_time_formatted)

### Validate dataset
def validate_dataset(validator_input):
    try:
        if type(validator_input) is str:
            jsonStruct = pathToJsonStruct(validator_input)
        elif type(validator_input) is dict:
            jsonStruct = validator_input
        else:
            raise Exception(
                "Error: validator input must be string (path to dataset) or a SODA JSON Structure/Python dictionary"
            )

        res = []

        validatorHighLevelFolder = validate_high_level_folder_structure(jsonStruct)
        validatorObj = validatorHighLevelFolder
        resitem = {}
        resitem["pass"] = validatorObj.passes
        resitem["warnings"] = validatorObj.warnings
        resitem["fatal"] = validatorObj.fatal
        res.append(resitem)

        (
            validatorHighLevelMetadataFiles,
            isSubmission,
            isDatasetDescription,
            isSubjects,
            isSamples,
        ) = validate_high_level_metadata_files(jsonStruct)
        validatorObj = validatorHighLevelMetadataFiles
        resitem = {}
        resitem["pass"] = validatorObj.passes
        resitem["warnings"] = validatorObj.warnings
        resitem["fatal"] = validatorObj.fatal
        res.append(resitem)

        validatorSubLevelOrganization = validate_sub_level_organization(jsonStruct)
        validatorObj = validatorSubLevelOrganization
        resitem = {}
        resitem["pass"] = validatorObj.passes
        resitem["warnings"] = validatorObj.warnings
        resitem["fatal"] = validatorObj.fatal
        res.append(resitem)

        if isSubmission == 1:
            metadataFiles = jsonStruct["main"]
            for f in metadataFiles:
                fullName = os.path.basename(f)
                if os.path.splitext(fullName)[0] == "submission":
                    subFilePath = f
            validatorSubmissionFile = validate_submission_file(subFilePath)
            validatorObj = validatorSubmissionFile
            resitem = {}
            resitem["pass"] = validatorObj.passes
            resitem["warnings"] = validatorObj.warnings
            resitem["fatal"] = validatorObj.fatal
            res.append(resitem)
        elif isSubmission == 0:
            resitem = {}
            resitem["warnings"] = [
                "Include a 'submission' file in a valid format to check it through the validator"
            ]
            res.append(resitem)

        elif isSubmission > 1:
            resitem = {}
            resitem["warnings"] = [
                "Include a unique 'submission' file to check it through the validator"
            ]
            res.append(resitem)

        if isDatasetDescription == 1:
            metadataFiles = jsonStruct["main"]
            for f in metadataFiles:
                fullName = os.path.basename(f)
                if os.path.splitext(fullName)[0] == "dataset_description":
                    ddFilePath = f
            validatorDatasetDescriptionFile = validate_dataset_description_file(
                ddFilePath
            )
            validatorObj = validatorDatasetDescriptionFile
            resitem = {}
            resitem["pass"] = validatorObj.passes
            resitem["warnings"] = validatorObj.warnings
            resitem["fatal"] = validatorObj.fatal
            res.append(resitem)

        elif isDatasetDescription == 0:
            resitem = {}
            resitem["warnings"] = [
                "Include a 'dataset_description' file in a valid format to check it through the validator"
            ]
            res.append(resitem)
        elif isDatasetDescription > 1:
            resitem = {}
            resitem["warnings"] = [
                "Include a unique 'dataset_description' file to check it through the validator"
            ]
            res.append(resitem)

        return res

    except Exception as e:
        raise e


"""
------------------------------------------
NEW
FUNCTIONS
------------------------------------------

"""


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


def check_empty_files_folders(soda_json_structure):
    """
    Function to check for empty files and folders

    Args:
        soda_json_structure: soda dict with information about all specified files and folders
    Output:
        error: error message with list of non valid local data files, if any
    """
    try:

        def recursive_empty_files_check(my_folder, my_relative_path, error_files):
            for folder_key, folder in my_folder["folders"].items():
                relative_path = my_relative_path + "/" + folder_key
                error_files = recursive_empty_files_check(
                    folder, relative_path, error_files
                )

            for file_key in list(my_folder["files"].keys()):
                file = my_folder["files"][file_key]
                file_type = file["type"]
                if file_type == "local":
                    file_path = file["path"]
                    if isfile(file_path):
                        file_size = getsize(file_path)
                        if file_size == 0:
                            del my_folder["files"][file_key]
                            relative_path = my_relative_path + "/" + file_key
                            error_message = relative_path + " (path: " + file_path + ")"
                            error_files.append(error_message)

            return error_files

        def recursive_empty_local_folders_check(
            my_folder,
            my_folder_key,
            my_folders_content,
            my_relative_path,
            error_folders,
        ):
            folders_content = my_folder["folders"]
            for folder_key in list(my_folder["folders"].keys()):
                folder = my_folder["folders"][folder_key]
                relative_path = my_relative_path + "/" + folder_key
                error_folders = recursive_empty_local_folders_check(
                    folder, folder_key, folders_content, relative_path, error_folders
                )

            if not my_folder["folders"]:
                if not my_folder["files"]:
                    ignore = False
                    if "type" in my_folder:
                        if my_folder["type"] == "bf":
                            ignore = True
                    if ignore == False:
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
                    error_files = recursive_empty_files_check(
                        folder, relative_path, error_files
                    )

                folders_content = dataset_structure["folders"]
                for folder_key in list(dataset_structure["folders"].keys()):
                    folder = dataset_structure["folders"][folder_key]
                    relative_path = folder_key
                    error_folders = recursive_empty_local_folders_check(
                        folder,
                        folder_key,
                        folders_content,
                        relative_path,
                        error_folders,
                    )

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
                            del metadata_files[file_key]
                            error_message = file_key + " (path: " + file_path + ")"
                            error_files.append(error_message)
            if not metadata_files:
                del soda_json_structure["metadata-files"]

        if len(error_files) > 0:
            error_message = [
                "The following local file(s) is/are empty (0 kb) and will be ignored."
            ]
            error_files = error_message + [] + error_files

        if len(error_folders) > 0:
            error_message = [
                "The following folder(s) is/are empty or only contain(s) empty file(s), and will be ignored."
            ]
            error_folders = error_message + [] + error_folders

        return [error_files, error_folders, soda_json_structure]

    except Exception as e:
        raise e


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
                if file["type"] == "bf":
                    continue
                if not isfile(file_path):
                    relative_path = my_relative_path + "/" + file_key
                    error_message = relative_path + " (path: " + file_path + ")"
                    error.append(error_message)
                else:
                    file_size = getsize(file_path)
                    if file_size == 0:
                        del my_folder["files"][file_key]

        return error

    def recursive_empty_local_folder_remove(
        my_folder, my_folder_key, my_folders_content
    ):

        folders_content = my_folder["folders"]
        for folder_key in list(my_folder["folders"].keys()):
            folder = my_folder["folders"][folder_key]
            recursive_empty_local_folder_remove(folder, folder_key, folders_content)

        if not my_folder["folders"]:
            if not my_folder["files"]:
                if my_folder["type"] != "bf":
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
                        del metadata_files[file_key]
        if not metadata_files:
            del soda_json_structure["metadata-files"]

    if len(error) > 0:
        error_message = [
            "Error: The following local files were not found. Specify them again or remove them."
        ]
        error = error_message + error

    return error


# path to local SODA folder for saving manifest files
manifest_sparc = ["manifest.xlsx", "manifest.csv"]
manifest_folder_path = join(userpath, "SODA", "manifest_files")


def create_high_level_manifest_files(soda_json_structure):
    """
    Function to create manifest files for each high-level SPARC folder.

    Args:
        soda_json_structure: soda dict with information about the dataset to be generated/modified
    Action:
        manifest_files_structure: dict including the local path of the manifest files
    """
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

    try:

        def get_name_extension(file_name):
            double_ext = False
            for ext in double_extensions:
                if file_name.find(ext) != -1:
                    double_ext = True
                    break

            ext = ""
            name = ""

            if double_ext == False:
                name = os.path.splitext(file_name)[0]
                ext = os.path.splitext(file_name)[1]
            else:
                ext = (
                    os.path.splitext(os.path.splitext(file_name)[0])[1]
                    + os.path.splitext(file_name)[1]
                )
                name = os.path.splitext(os.path.splitext(file_name)[0])[0]
            return name, ext

        def recursive_manifest_builder(
            my_folder, my_relative_path, dict_folder_manifest
        ):
            if "files" in my_folder.keys():
                for file_key, file in my_folder["files"].items():
                    gevent.sleep(0)
                    dict_folder_manifest = file_manifest_entry(
                        file_key, file, my_relative_path, dict_folder_manifest
                    )

            if "folders" in my_folder.keys():
                for folder_key, folder in my_folder["folders"].items():
                    if my_relative_path:
                        relative_path = my_relative_path + "/" + folder_key
                    else:
                        relative_path = folder_key
                    dict_folder_manifest = recursive_manifest_builder(
                        folder, relative_path, dict_folder_manifest
                    )

            return dict_folder_manifest

        def file_manifest_entry(file_key, file, relative_path, dict_folder_manifest):
            # filename
            if relative_path:
                filename = relative_path + "/" + file_key
            else:
                filename = file_key
            dict_folder_manifest["filename"].append(filename)
            # timestamp
            file_type = file["type"]
            if file_type == "local":
                file_path = file["path"]
                filepath = pathlib.Path(file_path)
                mtime = filepath.stat().st_mtime
                lastmodtime = datetime.fromtimestamp(mtime).astimezone(local_timezone)
                dict_folder_manifest["timestamp"].append(
                    lastmodtime.isoformat().replace(".", ",").replace("+00:00", "Z")
                )
            elif file_type == "bf":
                dict_folder_manifest["timestamp"].append(file["timestamp"])
            # description
            if "description" in file.keys():
                dict_folder_manifest["description"].append(file["description"])
            else:
                dict_folder_manifest["description"].append("")
            # file type
            fileextension = ""
            name_split = splitext(file_key)
            if name_split[1] == "":
                fileextension = "None"
            else:
                unused_file_name, fileextension = get_name_extension(file_key)
                # fileextension = name_split[1]
            dict_folder_manifest["file type"].append(fileextension)
            # addtional metadata
            if "additional-metadata" in file.keys():
                dict_folder_manifest["Additional Metadata"].append(
                    file["additional-metadata"]
                )
            else:
                dict_folder_manifest["Additional Metadata"].append("")

            return dict_folder_manifest

        # create local folder to save manifest files temporarly (delete any existing one first)
        shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0
        makedirs(manifest_folder_path)

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
            dict_folder_manifest = recursive_manifest_builder(
                folder, relative_path, dict_folder_manifest
            )

            # create high-level folder at the temporary location
            folderpath = join(manifest_folder_path, folder_key)
            makedirs(folderpath)

            # save manifest file
            manifestfilepath = join(folderpath, "manifest.xlsx")
            df = pd.DataFrame.from_dict(dict_folder_manifest)
            df.to_excel(manifestfilepath, index=None, header=True)

            manifest_files_structure[folder_key] = manifestfilepath

        return manifest_files_structure

    except Exception as e:
        raise e


# def add_local_manifest_files(manifest_files_structure, datasetpath):
#     try:
#         for key in manifest_files_structure.keys():
#             manifestpath = manifest_files_structure[key]
#             destination_folder = join(datasetpath, key)
#             if isdir(destination_folder):
#                 dst = join(destination_folder, "manifest.xlsx")
#                 mycopyfile_with_metadata(manifestpath, dst)

#         shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0

#     except Exception as e:
#         raise e

# def bf_add_manifest_files(manifest_files_structure, ds):
#     try:
#         for key in manifest_files_structure.keys():
#             manifestpath = manifest_files_structure[key]
#             for item in ds:
#                 if item.name == key and item.type == "Collection":
#                     destination_folder_id = item.id
#                     #delete existing manifest files
#                     for subitem in item:
#                         if subitem.name == "manifest":
#                             subitem.delete()
#                     #upload new manifest files
#                     bf_upload_file(item, manifestpath)
#                     break
#         shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0

#     except Exception as e:
#         raise e

# def bf_upload_file(item, path):
#     item.upload(path)


# def get_generate_dataset_size(soda_json_structure):
#     """
#     Function to get the size of the data to be generated (not existing at the local or Pennsieve destination)

#     Args:
#         soda_json_structure: soda dict with information about all specified files and folders
#         manifest_files_structure: soda dict with information about the manifest files (if requested)
#     Output:
#         generate_dataset_size: total size of data to be generated (in bytes)
#     """

#     def recursive_dataset_size(my_folder):
#         total_size = 0

#         if "folders" in my_folder.keys():
#             for folder_key, folder in my_folder["folders"].items():
#                 total_size += recursive_dataset_size(folder)
#         if "files" in my_folder.keys():
#             for file_key, file in my_folder["files"].items():
#                 file_type = file["type"]
#                 if file_type == "local":
#                     if "new" in file["action"]:
#                         file_path = file["path"]
#                         if isfile(file_path):
#                             total_size += getsize(file_path)
#         return total_size

#     try:
#         dataset_structure = soda_json_structure["dataset-structure"]

#         generate_dataset_size = 0
#         for folder_key, folder in dataset_structure["folders"].items():
#             generate_dataset_size += recursive_dataset_size(folder)

#         if manifest_files_structure:
#             for key in manifest_files_structure.keys():
#                 manifest_path = manifest_files_structure[key]
#                 generate_dataset_size += getsize(manifest_path)

#         if "metadata-files" in soda_json_structure.keys():
#             metadata_files = soda_json_structure["metadata-files"]
#             for file_key, file in metadata_files.items():
#                 if file["type"] == "local":
#                     if "new" in file["action"]:
#                         metadata_path = file["path"]
#                         generate_dataset_size += getsize(metadata_path)

#         return generate_dataset_size

#     except Exception as e:
#         raise e


def generate_dataset_locally(soda_json_structure):

    global main_curate_progress_message
    global progress_percentage
    global main_total_generate_dataset_size
    global start_generate

    try:

        def recursive_dataset_scan(
            my_folder, my_folderpath, list_copy_files, list_move_files
        ):
            global main_total_generate_dataset_size

            if "folders" in my_folder.keys():
                for folder_key, folder in my_folder["folders"].items():
                    folderpath = join(my_folderpath, folder_key)
                    if not isdir(folderpath):
                        mkdir(folderpath)
                    list_copy_files, list_move_files = recursive_dataset_scan(
                        folder, folderpath, list_copy_files, list_move_files
                    )

            if "files" in my_folder.keys():
                for file_key, file in my_folder["files"].items():
                    if not "deleted" in file["action"]:
                        file_type = file["type"]
                        if file_type == "local":
                            file_path = file["path"]
                            if isfile(file_path):
                                destination_path = abspath(
                                    join(my_folderpath, file_key)
                                )
                                if not isfile(destination_path):
                                    if (
                                        "existing" in file["action"]
                                        and soda_json_structure["generate-dataset"][
                                            "if-existing"
                                        ]
                                        == "merge"
                                    ):
                                        list_move_files.append(
                                            [file_path, destination_path]
                                        )
                                    else:
                                        main_total_generate_dataset_size += getsize(
                                            file_path
                                        )
                                        list_copy_files.append(
                                            [file_path, destination_path]
                                        )
            return list_copy_files, list_move_files

        # 1. Create new folder for dataset or use existing merge with existing or create new dataset?
        main_curate_progress_message = "Generating folder structure and list of files to be included in the dataset"
        dataset_absolute_path = soda_json_structure["generate-dataset"]["path"]
        if_existing = soda_json_structure["generate-dataset"]["if-existing"]
        dataset_name = soda_json_structure["generate-dataset"]["dataset-name"]
        datasetpath = join(dataset_absolute_path, dataset_name)
        datasetpath = return_new_path(datasetpath)
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
            list_copy_files, list_move_files = recursive_dataset_scan(
                folder, folderpath, list_copy_files, list_move_files
            )

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
                            main_total_generate_dataset_size += getsize(metadata_path)
                            list_copy_files.append([metadata_path, destination_path])

        # 4. Add manifest files in the list
        if "manifest-files" in soda_json_structure.keys():
            main_curate_progress_message = "Preparing manifest files"
            manifest_files_structure = create_high_level_manifest_files(
                soda_json_structure
            )
            for key in manifest_files_structure.keys():
                manifestpath = manifest_files_structure[key]
                if isfile(manifestpath):
                    destination_path = join(datasetpath, key, "manifest.xlsx")
                    main_total_generate_dataset_size += getsize(manifestpath)
                    list_copy_files.append([manifestpath, destination_path])

        # 5. Move files to new location
        main_curate_progress_message = "Moving files to new location"
        for fileinfo in list_move_files:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            main_curate_progress_message = (
                "Moving file " + str(srcfile) + " to " + str(distfile)
            )
            mymovefile_with_metadata(srcfile, distfile)

        # 6. Copy files to new location
        main_curate_progress_message = "Copying files to new location"
        start_generate = 1
        for fileinfo in list_copy_files:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            main_curate_progress_message = (
                "Copying file " + str(srcfile) + " to " + str(distfile)
            )
            mycopyfile_with_metadata(srcfile, distfile)

        # 7. Delete manifest folder and original folder if merge requested and rename new folder
        shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0
        if if_existing == "merge":
            main_curate_progress_message = "Finalizing dataset"
            original_dataset_path = join(dataset_absolute_path, dataset_name)
            shutil.rmtree(original_dataset_path)
            rename(datasetpath, original_dataset_path)
            open_file(join(dataset_absolute_path, original_dataset_path))
        else:
            open_file(join(dataset_absolute_path, datasetpath))
        return datasetpath, main_total_generate_dataset_size

    except Exception as e:
        raise e


def mymovefile_with_metadata(src, dst):
    shutil.move(src, dst)


def bf_create_new_dataset(datasetname, bf):
    """

    Args:
        datasetname: name of the dataset to be created (string)
        bf: Pennsieve account object
    Action:
        Creates dataset for the account specified
    """
    try:
        error, c = "", 0
        datasetname = datasetname.strip()

        if check_forbidden_characters_bf(datasetname):
            error = (
                error
                + "Error: A Pennsieve dataset name cannot contain any of the following characters: "
                + forbidden_characters_bf
                + "<br>"
            )
            c += 1

        if not datasetname:
            error = error + "Error: Please enter valid dataset name" + "<br>"
            c += 1

        if datasetname.isspace():
            error = error + "Error: Please enter valid dataset name" + "<br>"
            c += 1

        if c > 0:
            raise Exception(error)

        dataset_list = []
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        if datasetname in dataset_list:
            raise Exception("Error: Dataset name already exists")
        else:
            ds = bf.create_dataset(datasetname)

        return ds

    except Exception as e:
        raise e


def create_high_level_manifest_files_existing_bf_starting_point(soda_json_structure):
    """
    Function to create manifest files for each high-level SPARC folder for an existing Pennsieve dataset.
    Args:
        soda_json_structure: soda dict with information about the dataset to be generated/modified
    Action:
        manifest_files_structure: dict including the local path of the manifest files
    """
    high_level_folders_present = []
    manifest_files_structure = {}
    local_timezone = TZLOCAL()

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

    def get_name_extension(file_name):
        double_ext = False
        for ext in double_extensions:
            if file_name.find(ext) != -1:
                double_ext = True
                break

        ext = ""
        name = ""

        if double_ext == False:
            name = os.path.splitext(file_name)[0]
            ext = os.path.splitext(file_name)[1]
        else:
            ext = (
                os.path.splitext(os.path.splitext(file_name)[0])[1]
                + os.path.splitext(file_name)[1]
            )
            name = os.path.splitext(os.path.splitext(file_name)[0])[0]
        return name, ext

    def recursive_folder_traversal(folder, dict_folder_manifest):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                relative_file_name = ""
                i = 1
                while i < len(folder["files"][item]["folderpath"]):
                    relative_file_name += folder["files"][item]["folderpath"][i] + "/"
                    i += 1
                relative_file_name += item
                relative_file_name.replace("\\", "/")
                dict_folder_manifest["filename"].append(relative_file_name)
                unused_file_name, file_extension = get_name_extension(item)
                if file_extension == "":
                    file_extension = "None"
                dict_folder_manifest["file type"].append(file_extension)

                if "type" in folder["files"][item].keys():
                    if folder["files"][item]["type"] == "bf":
                        dict_folder_manifest["timestamp"].append(
                            folder["files"][item]["timestamp"]
                        )
                    elif folder["files"][item]["type"] == "local":
                        file_path = folder["files"][item]["path"]
                        filepath = pathlib.Path(file_path)
                        mtime = filepath.stat().st_mtime
                        lastmodtime = datetime.fromtimestamp(mtime).astimezone(
                            local_timezone
                        )
                        dict_folder_manifest["timestamp"].append(
                            lastmodtime.isoformat()
                            .replace(".", ",")
                            .replace("+00:00", "Z")
                        )
                else:
                    dict_folder_manifest["timestamp"].append("")

                if "description" in folder["files"][item].keys():
                    dict_folder_manifest["description"].append(
                        folder["files"][item]["description"]
                    )
                else:
                    dict_folder_manifest["description"].append("")

                if "additional-metadata" in folder["files"][item].keys():
                    dict_folder_manifest["Additional Metadata"].append(
                        folder["files"][item]["additional-metadata"]
                    )
                else:
                    dict_folder_manifest["Additional Metadata"].append("")

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                recursive_folder_traversal(
                    folder["folders"][item], dict_folder_manifest
                )

        return

    dataset_structure = soda_json_structure["dataset-structure"]

    # create local folder to save manifest files temporarly (delete any existing one first)
    shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0
    makedirs(manifest_folder_path)

    for high_level_folder in list(dataset_structure["folders"]):
        high_level_folders_present.append(high_level_folder)

        folderpath = join(manifest_folder_path, high_level_folder)
        makedirs(folderpath)
        manifestfilepath = join(folderpath, "manifest.xlsx")

        # Initialize dict where manifest info will be stored
        dict_folder_manifest = {}
        dict_folder_manifest["filename"] = []
        dict_folder_manifest["timestamp"] = []
        dict_folder_manifest["description"] = []
        dict_folder_manifest["file type"] = []
        dict_folder_manifest["Additional Metadata"] = []

        recursive_folder_traversal(
            dataset_structure["folders"][high_level_folder], dict_folder_manifest
        )

        df = pd.DataFrame.from_dict(dict_folder_manifest)
        df.to_excel(manifestfilepath, index=None, header=True)
        manifest_files_structure[high_level_folder] = manifestfilepath

    return manifest_files_structure


def create_high_level_manifest_files_existing_bf(
    soda_json_structure, bf, ds, my_tracking_folder
):
    """
    Function to create manifest files for each high-level SPARC folder.

    Args:
        soda_json_structure: soda dict with information about the dataset to be generated/modified
    Action:
        manifest_files_structure: dict including the local path of the manifest files
    """
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

    try:

        def get_name_extension(file_name):
            double_ext = False
            for ext in double_extensions:
                if file_name.find(ext) != -1:
                    double_ext = True
                    break

            ext = ""
            name = ""

            if double_ext == False:
                name = os.path.splitext(file_name)[0]
                ext = os.path.splitext(file_name)[1]
            else:
                ext = (
                    os.path.splitext(os.path.splitext(file_name)[0])[1]
                    + os.path.splitext(file_name)[1]
                )
                name = os.path.splitext(os.path.splitext(file_name)[0])[0]
            return name, ext

        def recursive_manifest_info_import_bf(
            my_item, my_relative_path, dict_folder_manifest, manifest_df
        ):

            for item in my_item.items:
                if item.type == "Collection":
                    folder_name = item.name
                    relative_path = generate_relative_path(
                        my_relative_path, folder_name
                    )
                    dict_folder_manifest = recursive_manifest_info_import_bf(
                        item, relative_path, dict_folder_manifest, manifest_df
                    )
                else:
                    if item.name != "manifest":
                        file_id = item.id
                        file_details = bf._api._get(
                            "/packages/" + str(file_id) + "/view"
                        )
                        file_name = file_details[0]["content"]["name"]
                        file_extension = splitext(file_name)[1]
                        file_name_with_extension = (
                            splitext(item.name)[0] + file_extension
                        )
                        relative_path = generate_relative_path(
                            my_relative_path, file_name_with_extension
                        )
                        dict_folder_manifest["filename"].append(relative_path)

                        # file type
                        unused_file_name, file_extension = get_name_extension(file_name)
                        if file_extension == "":
                            file_extension = "None"
                        # file_extension = splitext(file_name)[1]
                        dict_folder_manifest["file type"].append(file_extension)

                        # timestamp, description, Additional Metadata
                        if not manifest_df.empty:
                            if relative_path in manifest_df["filename"].values:
                                timestamp = manifest_df[
                                    manifest_df["filename"] == relative_path
                                ]["timestamp"].iloc[0]
                                description = manifest_df[
                                    manifest_df["filename"] == relative_path
                                ]["description"].iloc[0]
                                additional_metadata = manifest_df[
                                    manifest_df["filename"] == relative_path
                                ]["Additional Metadata"].iloc[0]
                            else:
                                timestamp = ""
                                description = ""
                                additional_metadata = ""
                            dict_folder_manifest["timestamp"].append(timestamp)
                            dict_folder_manifest["description"].append(description)
                            dict_folder_manifest["Additional Metadata"].append(
                                additional_metadata
                            )
                        else:
                            dict_folder_manifest["timestamp"].append("")
                            dict_folder_manifest["description"].append("")
                            dict_folder_manifest["Additional Metadata"].append("")

            return dict_folder_manifest

        # Merge existing folders
        def recursive_manifest_builder_existing_bf(
            my_folder,
            my_bf_folder,
            my_bf_folder_exists,
            my_relative_path,
            dict_folder_manifest,
        ):

            if "folders" in my_folder.keys():
                if my_bf_folder_exists:
                    (
                        my_bf_existing_folders,
                        my_bf_existing_folders_name,
                    ) = bf_get_existing_folders_details(my_bf_folder)
                else:
                    my_bf_existing_folders = []
                    my_bf_existing_folders_name = []

                for folder_key, folder in my_folder["folders"].items():
                    relative_path = generate_relative_path(my_relative_path, folder_key)
                    if folder_key in my_bf_existing_folders_name:
                        bf_folder_index = my_bf_existing_folders_name.index(folder_key)
                        bf_folder = my_bf_existing_folders[bf_folder_index]
                        bf_folder_exists = True
                    else:
                        bf_folder = ""
                        bf_folder_exists = False
                    dict_folder_manifest = recursive_manifest_builder_existing_bf(
                        folder,
                        bf_folder,
                        bf_folder_exists,
                        relative_path,
                        dict_folder_manifest,
                    )

            if "files" in my_folder.keys():
                if my_bf_folder_exists:
                    (
                        my_bf_existing_files,
                        my_bf_existing_files_name,
                        my_bf_existing_files_name_with_extension,
                    ) = bf_get_existing_files_details(my_bf_folder)
                else:
                    my_bf_existing_files = []
                    my_bf_existing_files_name = []
                    my_bf_existing_files_name_with_extension = []

                for file_key, file in my_folder["files"].items():
                    gevent.sleep(0)
                    if file["type"] == "local":
                        file_path = file["path"]
                        if isfile(file_path):
                            desired_name = splitext(file_key)[0]
                            file_extension = splitext(file_key)[1]

                            # manage existing file request
                            if existing_file_option == "skip":
                                if file_key in my_bf_existing_files_name_with_extension:
                                    continue

                            if existing_file_option == "replace":
                                if file_key in my_bf_existing_files_name_with_extension:
                                    # remove existing from manifest
                                    filename = generate_relative_path(
                                        my_relative_path, file_key
                                    )
                                    filename_list = dict_folder_manifest["filename"]
                                    index_file = filename_list.index(filename)
                                    del dict_folder_manifest["filename"][index_file]
                                    del dict_folder_manifest["timestamp"][index_file]
                                    del dict_folder_manifest["description"][index_file]
                                    del dict_folder_manifest["file type"][index_file]
                                    del dict_folder_manifest["Additional Metadata"][
                                        index_file
                                    ]

                                    index_name = (
                                        my_bf_existing_files_name_with_extension.index(
                                            file_key
                                        )
                                    )
                                    del my_bf_existing_files[index_name]
                                    del my_bf_existing_files_name[index_name]
                                    del my_bf_existing_files_name_with_extension[
                                        index_name
                                    ]

                            if desired_name not in my_bf_existing_files_name:
                                final_name = file_key
                            else:

                                # expected final name
                                count_done = 0
                                final_name = desired_name
                                output = get_base_file_name(desired_name)
                                if output:
                                    base_name = output[0]
                                    count_exist = output[1]
                                    while count_done == 0:
                                        if final_name in my_bf_existing_files_name:
                                            count_exist += 1
                                            final_name = (
                                                base_name + "(" + str(count_exist) + ")"
                                            )
                                        else:
                                            count_done = 1
                                else:
                                    count_exist = 0
                                    while count_done == 0:
                                        if final_name in my_bf_existing_files_name:
                                            count_exist += 1
                                            final_name = (
                                                desired_name
                                                + " ("
                                                + str(count_exist)
                                                + ")"
                                            )
                                        else:
                                            count_done = 1

                                final_name = final_name + file_extension
                                my_bf_existing_files_name.append(
                                    splitext(final_name)[0]
                                )

                            # filename
                            filename = generate_relative_path(
                                my_relative_path, final_name
                            )
                            dict_folder_manifest["filename"].append(filename)

                            # timestamp
                            file_path = file["path"]
                            filepath = pathlib.Path(file_path)
                            mtime = filepath.stat().st_mtime
                            lastmodtime = datetime.fromtimestamp(mtime).astimezone(
                                local_timezone
                            )
                            dict_folder_manifest["timestamp"].append(
                                lastmodtime.isoformat()
                                .replace(".", ",")
                                .replace("+00:00", "Z")
                            )

                            # description
                            if "description" in file.keys():
                                dict_folder_manifest["description"].append(
                                    file["description"]
                                )
                            else:
                                dict_folder_manifest["description"].append("")

                            # file type
                            if file_extension == "":
                                file_extension = "None"
                            dict_folder_manifest["file type"].append(file_extension)

                            # addtional metadata
                            if "additional-metadata" in file.keys():
                                dict_folder_manifest["Additional Metadata"].append(
                                    file["additional-metadata"]
                                )
                            else:
                                dict_folder_manifest["Additional Metadata"].append("")

            return dict_folder_manifest

        # create local folder to save manifest files temporarly (delete any existing one first)
        shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0
        makedirs(manifest_folder_path)

        # import info about files already on bf
        dataset_structure = soda_json_structure["dataset-structure"]
        manifest_dict_save = {}
        for item in ds.items:
            if (
                item.type == "Collection"
                and item.name in dataset_structure["folders"].keys()
            ):

                relative_path = ""
                item_id = item.id
                # Initialize dict where manifest info will be stored
                dict_folder_manifest = {}
                dict_folder_manifest["filename"] = []
                dict_folder_manifest["timestamp"] = []
                dict_folder_manifest["description"] = []
                dict_folder_manifest["file type"] = []
                dict_folder_manifest["Additional Metadata"] = []

                # pull manifest file into if exists
                manifest_df = pd.DataFrame()
                for file in item.items:
                    if file.type != "Collection":
                        file_id = file.id
                        file_details = bf._api._get(
                            "/packages/" + str(file_id) + "/view"
                        )
                        file_name_with_extension = file_details[0]["content"]["name"]
                        if file_name_with_extension in manifest_sparc:
                            file_id_2 = file_details[0]["content"]["id"]
                            file_url_info = bf._api._get(
                                "/packages/" + str(file_id) + "/files/" + str(file_id_2)
                            )
                            file_url = file_url_info["url"]
                            manifest_df = pd.read_excel(file_url, engine="openpyxl")
                            manifest_df = manifest_df.fillna("")
                            if (
                                "filename" not in manifest_df.columns
                                or "description" not in manifest_df.columns
                                or "Additional Metadata" not in manifest_df.columns
                            ):
                                manifest_df = pd.DataFrame()
                            break
                dict_folder_manifest = recursive_manifest_info_import_bf(
                    item, relative_path, dict_folder_manifest, manifest_df
                )
                manifest_dict_save[item.name] = {
                    "manifest": dict_folder_manifest,
                    "bf_folder": item,
                }

        # import info from local files to be uploaded
        local_timezone = TZLOCAL()
        manifest_files_structure = {}
        existing_folder_option = soda_json_structure["generate-dataset"]["if-existing"]
        existing_file_option = soda_json_structure["generate-dataset"][
            "if-existing-files"
        ]
        for folder_key, folder in dataset_structure["folders"].items():
            relative_path = ""

            if (
                folder_key in manifest_dict_save.keys()
                and existing_folder_option == "merge"
            ):
                bf_folder = manifest_dict_save[folder_key]["bf_folder"]
                bf_folder_exists = True
                dict_folder_manifest = manifest_dict_save[folder_key]["manifest"]

            elif (
                folder_key in manifest_dict_save.keys()
                and folder_key not in my_tracking_folder["folders"].keys()
                and existing_folder_option == "skip"
            ):
                continue

            else:
                bf_folder = ""
                bf_folder_exists = False
                dict_folder_manifest = {}
                dict_folder_manifest["filename"] = []
                dict_folder_manifest["timestamp"] = []
                dict_folder_manifest["description"] = []
                dict_folder_manifest["file type"] = []
                dict_folder_manifest["Additional Metadata"] = []

            dict_folder_manifest = recursive_manifest_builder_existing_bf(
                folder, bf_folder, bf_folder_exists, relative_path, dict_folder_manifest
            )

            # create high-level folder at the temporary location
            folderpath = join(manifest_folder_path, folder_key)
            makedirs(folderpath)

            # save manifest file
            manifestfilepath = join(folderpath, "manifest.xlsx")
            df = pd.DataFrame.from_dict(dict_folder_manifest)
            df.to_excel(manifestfilepath, index=None, header=True)

            manifest_files_structure[folder_key] = manifestfilepath

        return manifest_files_structure

    except Exception as e:
        raise e


def generate_relative_path(x, y):
    if x:
        relative_path = x + "/" + y
    else:
        relative_path = y
    return relative_path


def bf_get_existing_folders_details(bf_folder):
    bf_existing_folders = [x for x in bf_folder.items if x.type == "Collection"]
    bf_existing_folders_name = [x.name for x in bf_existing_folders]

    return bf_existing_folders, bf_existing_folders_name


def bf_get_existing_files_details(bf_folder):

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

    bf_existing_files = [x for x in bf_folder.items if x.type != "Collection"]
    bf_existing_files_name = [splitext(x.name)[0] for x in bf_existing_files]
    bf_existing_files_name_with_extension = []
    for file in bf_existing_files:
        file_name_with_extension = ""
        file_id = file.id
        file_details = bf._api._get("/packages/" + str(file_id))
        # file_name_with_extension = verify_file_name(file_details["content"]["name"], file_details["extension"])
        if "extension" not in file_details:
            file_name_with_extension = verify_file_name(
                file_details["content"]["name"], ""
            )
        else:
            file_name_with_extension = verify_file_name(
                file_details["content"]["name"], file_details["extension"]
            )

        # file_extension = splitext(file_name_with_extension)[1]
        # file_name_with_extension = splitext(file.name)[0] + file_extension
        bf_existing_files_name_with_extension.append(file_name_with_extension)

    return (
        bf_existing_files,
        bf_existing_files_name,
        bf_existing_files_name_with_extension,
    )


def check_if_int(s):
    try:
        int(s)
        return True
    except ValueError:
        return False


def get_base_file_name(file_name):
    output = []
    if file_name[-1] == ")":
        string_length = len(file_name)
        count_start = string_length
        character = file_name[count_start - 1]
        while character != "(" and count_start >= 0:
            count_start -= 1
            character = file_name[count_start - 1]
        if character == "(":
            base_name = file_name[0 : count_start - 1]
            num = file_name[count_start : string_length - 1]
            if check_if_int(num):
                output = [base_name, int(num)]
            return output
        else:
            return output

    else:
        return output


def bf_update_existing_dataset(soda_json_structure, bf, ds):
    global main_curate_progress_message
    global main_total_generate_dataset_size
    global start_generate
    global main_initial_bfdataset_size
    # global progress_percentage
    # global progress_percentage_array
    bfsd = ""

    # Delete any files on Pennsieve that have been marked as deleted
    def recursive_file_delete(folder):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if "deleted" in folder["files"][item]["action"]:
                    file = bf.get(folder["files"][item]["path"])
                    file.delete()
                    del folder["files"][item]

        for item in list(folder["folders"]):
            recursive_file_delete(folder["folders"][item])
        return

    # Delete any files on Pennsieve that have been marked as deleted
    def metadata_file_delete(soda_json_structure):
        if "metadata-files" in soda_json_structure.keys():
            folder = soda_json_structure["metadata-files"]
            for item in list(folder):
                if "deleted" in folder[item]["action"]:
                    file = bf.get(folder[item]["path"])
                    file.delete()
                    del folder[item]

        return

    # Add a new key containing the path to all the files and folders on the
    # local data structure.
    # Allows us to see if the folder path of a specfic file already
    # exists on Pennsieve.
    def recursive_item_path_create(folder, path):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if "folderpath" not in folder["files"][item]:
                    folder["files"][item]["folderpath"] = path[:]

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                if "folderpath" not in folder["folders"][item]:
                    folder["folders"][item]["folderpath"] = path[:]
                    folder["folders"][item]["folderpath"].append(item)
                recursive_item_path_create(
                    folder["folders"][item], folder["folders"][item]["folderpath"][:]
                )

        return

    # Check and create any non existing folders for the file move process
    def recursive_check_and_create_bf_file_path(
        folderpath, index, current_folder_structure
    ):
        folder = folderpath[index]

        if folder not in current_folder_structure["folders"]:
            if index == 0:
                new_folder = ds.create_collection(folder)
            else:
                current_folder = bf.get(current_folder_structure["path"])
                new_folder = current_folder.create_collection(folder)
            current_folder_structure["folders"][folder] = {
                "type": "bf",
                "action": ["existing"],
                "path": new_folder.id,
                "folders": {},
                "files": {},
            }

        index += 1

        if index < len(folderpath):
            return recursive_check_and_create_bf_file_path(
                folderpath, index, current_folder_structure["folders"][folder]
            )
        else:
            return current_folder_structure["folders"][folder]["path"]

    # Check for any files that have been moved and verify paths before moving
    def recursive_check_moved_files(folder):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if (
                    "moved" in folder["files"][item]["action"]
                    and folder["files"][item]["type"] == "bf"
                ):
                    new_folder_id = ""
                    new_folder_id = recursive_check_and_create_bf_file_path(
                        folder["files"][item]["folderpath"].copy(), 0, bfsd
                    )
                    destination_folder = bf.get(new_folder_id)
                    bf.move(destination_folder, folder["files"][item]["path"])

        for item in list(folder["folders"]):
            recursive_check_moved_files(folder["folders"][item])

        return

    # Rename any files that exist on Pennsieve
    def recursive_file_rename(folder):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if (
                    "renamed" in folder["files"][item]["action"]
                    and folder["files"][item]["type"] == "bf"
                ):
                    file = bf.get(folder["files"][item]["path"])
                    if file is not None:
                        file.name = item
                        file.update()

        for item in list(folder["folders"]):
            recursive_file_rename(folder["folders"][item])

        return

    # Delete any stray folders that exist on Pennsieve
    # Only top level files are deleted since the api deletes any
    # files and folders that exist inside.
    def recursive_folder_delete(folder):
        for item in list(folder["folders"]):
            if folder["folders"][item]["type"] == "bf":
                if "moved" in folder["folders"][item]["action"]:
                    file = bf.get(folder["folders"][item]["path"])
                    if file is not None:
                        file.delete()
                if "deleted" in folder["folders"][item]["action"]:
                    file = bf.get(folder["folders"][item]["path"])
                    if file is not None:
                        file.delete()
                    del folder["folders"][item]
                else:
                    recursive_folder_delete(folder["folders"][item])
            else:
                recursive_folder_delete(folder["folders"][item])

        return

    # Rename any folders that still exist.
    def recursive_folder_rename(folder, mode):
        for item in list(folder["folders"]):
            if (
                folder["folders"][item]["type"] == "bf"
                and "action" in folder["folders"][item].keys()
            ):
                if mode in folder["folders"][item]["action"]:
                    file = bf.get(folder["folders"][item]["path"])
                    if file is not None:
                        file.name = item
                        file.update()
            recursive_folder_rename(folder["folders"][item], mode)

        return

    # 1. Remove all existing files on Pennsieve, that the user deleted.
    main_curate_progress_message = "Checking Pennsieve for deleted files"
    dataset_structure = soda_json_structure["dataset-structure"]
    recursive_file_delete(dataset_structure)
    main_curate_progress_message = (
        "Files on Pennsieve marked for deletion have been deleted"
    )

    # 2. Rename any deleted folders on Pennsieve to allow for replacements.
    main_curate_progress_message = "Checking Pennsieve for deleted folders"
    dataset_structure = soda_json_structure["dataset-structure"]
    recursive_folder_rename(dataset_structure, "deleted")
    main_curate_progress_message = "Folders on Pennsieve have been marked for deletion"

    # 2.5 Rename folders that need to be in the final destination.
    main_curate_progress_message = "Renaming any folders requested by the user"
    recursive_folder_rename(dataset_structure, "renamed")
    main_curate_progress_message = "Renamed all folders requested by the user"

    # 3. Get the status of all files currently on Pennsieve and create
    # the folderpath for all items in both dataset structures.
    main_curate_progress_message = "Fetching files and folders from Pennsieve"
    current_bf_dataset_files_folders = bf_get_dataset_files_folders(
        soda_json_structure.copy()
    )[0]
    bfsd = current_bf_dataset_files_folders["dataset-structure"]
    main_curate_progress_message = "Creating file paths for all files on Pennsieve"
    recursive_item_path_create(dataset_structure, [])
    recursive_item_path_create(bfsd, [])
    main_curate_progress_message = "File paths created"

    # 4. Move any files that are marked as moved on Pennsieve.
    # Create any additional folders if required
    main_curate_progress_message = "Moving any files requested by the user"
    recursive_check_moved_files(dataset_structure)
    main_curate_progress_message = "Moved all files requested by the user"

    # 5. Rename any Pennsieve files that are marked as renamed.
    main_curate_progress_message = "Renaming any files requested by the user"
    recursive_file_rename(dataset_structure)
    main_curate_progress_message = "Renamed all files requested by the user"

    # 6. Delete any Pennsieve folders that are marked as deleted.
    main_curate_progress_message = (
        "Deleting any additional folders present on Pennsieve"
    )
    recursive_folder_delete(dataset_structure)
    main_curate_progress_message = "Deletion of additional folders complete"

    # 7. Rename any Pennsieve folders that are marked as renamed.
    main_curate_progress_message = "Renaming any folders requested by the user"
    recursive_folder_rename(dataset_structure, "renamed")
    main_curate_progress_message = "Renamed all folders requested by the user"

    # 8. Delete any metadata files that are marked as deleted.
    main_curate_progress_message = "Removing any metadata files marked for deletion"
    metadata_file_delete(soda_json_structure)
    main_curate_progress_message = "Removed metadata files marked for deletion"

    # 9. Run the original code to upload any new files added to the dataset.
    if "manifest-files" in soda_json_structure.keys():
        soda_json_structure["manifest-files"] = {"destination": "bf"}

    soda_json_structure["generate-dataset"] = {
        "destination": "bf",
        "if-existing": "merge",
        "if-existing-files": "replace",
    }

    bfdataset = soda_json_structure["bf-dataset-selected"]["dataset-name"]
    myds = bf.get_dataset(bfdataset)
    bf_generate_new_dataset(soda_json_structure, bf, myds)

    return


def bf_generate_new_dataset(soda_json_structure, bf, ds):

    global main_curate_progress_message
    global main_total_generate_dataset_size
    global start_generate
    global main_initial_bfdataset_size
    # global progress_percentage
    # global progress_percentage_array

    try:

        def recursive_create_folder_for_bf(
            my_folder, my_tracking_folder, existing_folder_option
        ):

            # list of existing bf folders at this level
            my_bf_folder = my_tracking_folder["value"]
            (
                my_bf_existing_folders,
                my_bf_existing_folders_name,
            ) = bf_get_existing_folders_details(my_bf_folder)

            # create/replace/skip folder
            if "folders" in my_folder.keys():
                my_tracking_folder["folders"] = {}
                for folder_key, folder in my_folder["folders"].items():

                    if existing_folder_option == "skip":
                        if folder_key in my_bf_existing_folders_name:
                            continue
                        else:
                            bf_folder = my_bf_folder.create_collection(folder_key)

                    elif existing_folder_option == "create-duplicate":
                        bf_folder = my_bf_folder.create_collection(folder_key)

                    elif existing_folder_option == "replace":
                        if folder_key in my_bf_existing_folders_name:
                            index_folder = my_bf_existing_folders_name.index(folder_key)
                            bf_folder_delete = my_bf_existing_folders[index_folder]
                            bf_folder_delete.delete()
                            my_bf_folder.update()
                        bf_folder = my_bf_folder.create_collection(folder_key)

                    elif existing_folder_option == "merge":
                        if folder_key in my_bf_existing_folders_name:
                            index_folder = my_bf_existing_folders_name.index(folder_key)
                            bf_folder = my_bf_existing_folders[index_folder]
                        else:
                            bf_folder = my_bf_folder.create_collection(folder_key)
                    bf_folder.update()
                    my_tracking_folder["folders"][folder_key] = {"value": bf_folder}
                    tracking_folder = my_tracking_folder["folders"][folder_key]
                    recursive_create_folder_for_bf(
                        folder, tracking_folder, existing_folder_option
                    )

        def recursive_dataset_scan_for_bf(
            my_folder,
            my_tracking_folder,
            existing_file_option,
            list_upload_files,
            my_relative_path,
        ):

            global main_total_generate_dataset_size

            my_bf_folder = my_tracking_folder["value"]

            if "folders" in my_folder.keys():
                (
                    my_bf_existing_folders,
                    my_bf_existing_folders_name,
                ) = bf_get_existing_folders_details(my_bf_folder)

                for folder_key, folder in my_folder["folders"].items():
                    relative_path = generate_relative_path(my_relative_path, folder_key)

                    if existing_folder_option == "skip":
                        if folder_key not in my_tracking_folder["folders"].keys():
                            continue

                    tracking_folder = my_tracking_folder["folders"][folder_key]
                    list_upload_files = recursive_dataset_scan_for_bf(
                        folder,
                        tracking_folder,
                        existing_file_option,
                        list_upload_files,
                        relative_path,
                    )

            if "files" in my_folder.keys():

                # delete files to be deleted
                (
                    my_bf_existing_files,
                    my_bf_existing_files_name,
                    my_bf_existing_files_name_with_extension,
                ) = bf_get_existing_files_details(my_bf_folder)
                for file_key, file in my_folder["files"].items():
                    if file["type"] == "local":
                        file_path = file["path"]
                        if isfile(file_path):
                            if existing_file_option == "replace":
                                if file_key in my_bf_existing_files_name_with_extension:
                                    index_file = (
                                        my_bf_existing_files_name_with_extension.index(
                                            file_key
                                        )
                                    )
                                    my_file = my_bf_existing_files[index_file]
                                    my_file.delete()
                                    my_bf_folder.update()

                # create list of files to be uploaded with projected and desired names saved
                (
                    my_bf_existing_files,
                    my_bf_existing_files_name,
                    my_bf_existing_files_name_with_extension,
                ) = bf_get_existing_files_details(my_bf_folder)

                list_local_files = []
                list_projected_names = []
                list_desired_names = []
                list_final_names = []
                additional_upload_lists = []
                additional_list_count = 0
                list_upload_schedule_projected_names = []
                list_initial_names = []
                for file_key, file in my_folder["files"].items():
                    if file["type"] == "local":
                        file_path = file["path"]
                        if isfile(file_path):
                            initial_name = splitext(basename(file_path))[0]
                            initial_extension = splitext(basename(file_path))[1]
                            initial_name_with_extension = basename(file_path)
                            desired_name = splitext(file_key)[0]
                            desired_name_extension = splitext(file_key)[1]
                            desired_name_with_extension = file_key
                            # desired_name = file_key

                            if existing_file_option == "skip":
                                if file_key in my_bf_existing_files_name_with_extension:
                                    continue

                            # check if initial filename exists on Pennsieve dataset and get the projected name of the file after upload
                            count_done = 0
                            count_exist = 0
                            projected_name = initial_name_with_extension
                            while count_done == 0:
                                if (
                                    projected_name
                                    in my_bf_existing_files_name_with_extension
                                ):
                                    count_exist += 1
                                    projected_name = (
                                        initial_name
                                        + " ("
                                        + str(count_exist)
                                        + ")"
                                        + initial_extension
                                    )
                                else:
                                    count_done = 1

                            # expected final name
                            count_done = 0
                            final_name = desired_name_with_extension
                            output = get_base_file_name(desired_name)
                            if output:
                                base_name = output[0]
                                count_exist = output[1]
                                while count_done == 0:
                                    if final_name in my_bf_existing_files_name:
                                        count_exist += 1
                                        final_name = (
                                            base_name
                                            + "("
                                            + str(count_exist)
                                            + ")"
                                            + desired_name_extension
                                        )
                                    else:
                                        count_done = 1
                            else:
                                count_exist = 0
                                while count_done == 0:
                                    if final_name in my_bf_existing_files_name:
                                        count_exist += 1
                                        final_name = (
                                            desired_name
                                            + " ("
                                            + str(count_exist)
                                            + ")"
                                            + desired_name_extension
                                        )
                                    else:
                                        count_done = 1

                            # save in list accordingly
                            if (
                                initial_name in list_initial_names
                                or initial_name in list_final_names
                                or projected_name in list_final_names
                                or final_name in list_projected_names
                            ):
                                additional_upload_lists.append(
                                    [
                                        [file_path],
                                        my_bf_folder,
                                        [projected_name],
                                        [desired_name],
                                        [final_name],
                                        my_tracking_folder,
                                        my_relative_path,
                                    ]
                                )
                            else:
                                list_local_files.append(file_path)
                                list_projected_names.append(projected_name)
                                list_desired_names.append(desired_name_with_extension)
                                list_final_names.append(final_name)
                                list_initial_names.append(initial_name)

                            my_bf_existing_files_name.append(final_name)
                            if initial_extension in bf_recognized_file_extensions:
                                my_bf_existing_files_name_with_extension.append(
                                    final_name
                                )
                            else:
                                my_bf_existing_files_name_with_extension.append(
                                    final_name + initial_extension
                                )

                            # add to projected dataset size to be generated
                            main_total_generate_dataset_size += getsize(file_path)

                if list_local_files:
                    list_upload_files.append(
                        [
                            list_local_files,
                            my_bf_folder,
                            list_projected_names,
                            list_desired_names,
                            list_final_names,
                            my_tracking_folder,
                            my_relative_path,
                        ]
                    )

                for item in additional_upload_lists:
                    list_upload_files.append(item)

            return list_upload_files

        # 1. Scan the dataset structure to create all non-existent folders
        # create a tracking dict which would track the generation of the dataset on Pennsieve
        main_curate_progress_message = "Creating folder structure"
        dataset_structure = soda_json_structure["dataset-structure"]
        tracking_json_structure = {"value": ds}
        existing_folder_option = soda_json_structure["generate-dataset"]["if-existing"]
        recursive_create_folder_for_bf(
            dataset_structure, tracking_json_structure, existing_folder_option
        )

        # 2. Scan the dataset structure and compile a list of files to be uploaded along with desired renaming
        ds.update()
        main_curate_progress_message = "Preparing a list of files to upload"
        existing_file_option = soda_json_structure["generate-dataset"][
            "if-existing-files"
        ]
        list_upload_files = []
        relative_path = ds.name
        list_upload_files = recursive_dataset_scan_for_bf(
            dataset_structure,
            tracking_json_structure,
            existing_file_option,
            list_upload_files,
            relative_path,
        )

        # 3. Add high-level metadata files to a list
        ds.update()
        list_upload_metadata_files = []
        if "metadata-files" in soda_json_structure.keys():

            (
                my_bf_existing_files,
                my_bf_existing_files_name,
                my_bf_existing_files_name_with_extension,
            ) = bf_get_existing_files_details(ds)
            metadata_files = soda_json_structure["metadata-files"]
            for file_key, file in metadata_files.items():
                if file["type"] == "local":
                    metadata_path = file["path"]
                    if isfile(metadata_path):
                        initial_name = splitext(basename(metadata_path))[0]
                        if existing_file_option == "replace":
                            if initial_name in my_bf_existing_files_name:
                                index_file = my_bf_existing_files_name.index(
                                    initial_name
                                )
                                my_file = my_bf_existing_files[index_file]
                                my_file.delete()

                        if existing_file_option == "skip":
                            if initial_name in my_bf_existing_files_name:
                                continue

                        list_upload_metadata_files.append(metadata_path)
                        main_total_generate_dataset_size += getsize(metadata_path)

        # 4. Prepare and add manifest files to a list
        list_upload_manifest_files = []
        if "manifest-files" in soda_json_structure.keys():

            # prepare manifest files
            if soda_json_structure["starting-point"]["type"] == "bf":
                manifest_files_structure = (
                    create_high_level_manifest_files_existing_bf_starting_point(
                        soda_json_structure
                    )
                )
            else:
                if (
                    soda_json_structure["generate-dataset"]["destination"] == "bf"
                    and "dataset-name" not in soda_json_structure["generate-dataset"]
                ):
                    # generating dataset on an existing bf dataset - account for existing files and manifest files
                    manifest_files_structure = (
                        create_high_level_manifest_files_existing_bf(
                            soda_json_structure, bf, ds, tracking_json_structure
                        )
                    )
                else:
                    # generating on new bf
                    manifest_files_structure = create_high_level_manifest_files(
                        soda_json_structure
                    )

            # add manifest files to list after deleting existing ones
            list_upload_manifest_files = []
            for key in manifest_files_structure.keys():
                manifestpath = manifest_files_structure[key]
                item = tracking_json_structure["folders"][key]["value"]
                destination_folder_id = item.id
                # delete existing manifest files
                for subitem in item:
                    file_name_no_ext = os.path.splitext(subitem.name)[0]
                    if file_name_no_ext.lower() == "manifest":
                        subitem.delete()
                        item.update()
                # upload new manifest files
                list_upload_manifest_files.append([[manifestpath], item])
                main_total_generate_dataset_size += getsize(manifestpath)

        # 5. Upload files, rename, and add to tracking list
        main_initial_bfdataset_size = bf_dataset_size()
        start_generate = 1
        for item in list_upload_files:
            list_upload = item[0]
            bf_folder = item[1]
            list_projected_names = item[2]
            list_desired_names = item[3]
            list_final_names = item[4]
            tracking_folder = item[5]
            relative_path = item[6]

            # track block upload size for a more reactive progress bar
            # progress_percentage = io.StringIO()
            # total_size = 0
            # progress_percentage_array.append({});
            # progress_percentage_array[-1]["files"] = {}
            # for file in list_upload:
            # file_size = os.path.getsize(file)
            # file_name = os.path.basename(file)
            # progress_percentage_array[-1]["files"][file] = file_size
            # total_size += file_size
            # progress_percentage_array[-1]["output-stream"] = progress_percentage
            # progress_percentage_array[-1].pop('completed-size', None)

            ## check if agent is running in the background
            agent_running()

            # upload
            main_curate_progress_message = "Uploading files in " + str(relative_path)

            bf_folder.upload(*list_upload)
            bf_folder.update()

            # rename to final name
            for index, projected_name in enumerate(list_projected_names):
                final_name = list_final_names[index]
                desired_name = list_desired_names[index]
                if final_name != projected_name:
                    bf_item_list = bf_folder.items
                    (
                        my_bf_existing_files,
                        my_bf_existing_files_name,
                        my_bf_existing_files_name_with_extension,
                    ) = bf_get_existing_files_details(bf_folder)
                    for item in my_bf_existing_files:
                        if item.name == projected_name:
                            item.name = final_name
                            item.update()
                            if "files" not in tracking_folder:
                                tracking_folder["files"] = {}
                            tracking_folder["files"][desired_name] = {"value": item}

        if list_upload_metadata_files:
            main_curate_progress_message = (
                "Uploading metadata files in high-level dataset folder " + str(ds.name)
            )
            ds.upload(*list_upload_metadata_files)

        if list_upload_manifest_files:
            for item in list_upload_manifest_files:
                manifest_file = item[0]
                bf_folder = item[1]
                main_curate_progress_message = (
                    "Uploading manifest file in " + str(bf_folder.name) + " folder"
                )
                bf_folder.upload(*manifest_file)
                # bf_folder.update()
        shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0

    except Exception as e:
        raise e


main_curate_status = ""
main_curate_print_status = ""
main_curate_progress_message = ""
# progress_percentage = "0.0%"
# progress_percentage_array = []
main_total_generate_dataset_size = 1
main_generated_dataset_size = 0
start_generate = 0
generate_start_time = 0
main_generate_destination = ""
main_initial_bfdataset_size = 0
bf = ""
myds = ""


def bf_check_dataset_files_validity(soda_json_structure, bf):
    """
    Function to check that the bf data files and folders specified in the dataset are valid

    Args:
        dataset_structure: soda dict with information about all specified files and folders
    Output:
        error: error message with list of non valid local data files, if any
    """

    def recursive_bf_dataset_check(my_folder, my_relative_path, error):
        if "folders" in my_folder.keys():
            for folder_key, folder in my_folder["folders"].items():
                folder_type = folder["type"]
                relative_path = my_relative_path + "/" + folder_key
                if folder_type == "bf":
                    package_id = folder["path"]
                    try:
                        details = bf._api._get("/packages/" + str(package_id) + "/view")
                    except Exception as e:
                        error_message = relative_path + " (id: " + package_id + ")"
                        error.append(error_message)
                        pass
                error = recursive_bf_dataset_check(folder, relative_path, error)
        if "files" in my_folder.keys():
            for file_key, file in my_folder["files"].items():
                file_type = file["type"]
                if file_type == "bf":
                    package_id = file["path"]
                    try:
                        details = bf._api._get("/packages/" + str(package_id) + "/view")
                    except Exception as e:
                        relative_path = my_relative_path + "/" + file_key
                        error_message = relative_path + " (id: " + package_id + ")"
                        error.append(error_message)
                        pass

        return error

    error = []
    if "dataset-structure" in soda_json_structure.keys():
        dataset_structure = soda_json_structure["dataset-structure"]
        if "folders" in dataset_structure:
            for folder_key, folder in dataset_structure["folders"].items():
                folder_type = folder["type"]
                relative_path = folder_key
                if folder_type == "bf":
                    package_id = folder["path"]
                    try:
                        details = bf._api._get("/packages/" + str(package_id) + "/view")
                    except Exception as e:
                        error_message = relative_path + " (id: " + package_id + ")"
                        error.append(error_message)
                        pass
                error = recursive_bf_dataset_check(folder, relative_path, error)
        if "files" in dataset_structure:
            for file_key, file in dataset_structure["files"].items():
                file_type = file["type"]
                if file_type == "bf":
                    package_id = folder["path"]
                    try:
                        details = bf._api._get("/packages/" + str(package_id) + "/view")
                    except Exception as e:
                        relative_path = file_key
                        error_message = relative_path + " (id: " + package_id + ")"
                        error.append(error_message)
                        pass

    if "metadata-files" in soda_json_structure:
        metadata_files = soda_json_structure["metadata-files"]
        for file_key, file in metadata_files.items():
            file_type = file["type"]
            if file_type == "bf":
                package_id = file["path"]
                try:
                    details = bf._api._get("/packages/" + str(package_id) + "/view")
                except Exception as e:
                    error_message = file_key + " (id: " + package_id + ")"
                    error.append(error_message)
                    pass

    if len(error) > 0:
        error_message = [
            "Error: The following Pennsieve files/folders are invalid. Specify them again or remove them."
        ]
        error = error_message + error

    return error


def main_curate_function(soda_json_structure):

    global main_curate_status
    global main_curate_progress_message
    global main_total_generate_dataset_size
    global main_generated_dataset_size
    global start_generate
    global generate_start_time
    global main_generate_destination
    global main_initial_bfdataset_size
    # global progress_percentage
    # global progress_percentage_array

    global bf
    global myds

    start_generate = 0
    generate_start_time = time.time()

    main_curate_status = ""
    main_curate_progress_message = "Starting..."
    main_total_generate_dataset_size = 1
    main_generated_dataset_size = 0

    main_curate_status = "Curating"
    main_curate_progress_message = "Starting dataset curation"
    # progress_percentage = "000.0%"
    # progress_percentage_array = []
    main_generate_destination = ""
    main_initial_bfdataset_size = 0
    bf = ""
    myds = ""

    main_keys = soda_json_structure.keys()
    error = ""

    # 1] Check for potential errors

    # 1.1. Check that the local destination is valid if generate dataset locally is requested
    if "generate-dataset" in main_keys:
        if soda_json_structure["generate-dataset"]["destination"] == "local":
            main_curate_progress_message = "Checking that the local destination selected for generating your dataset is valid"
            generate_dataset = soda_json_structure["generate-dataset"]
            local_dataset_path = generate_dataset["path"]
            # if generate_dataset["if-existing"] == "merge":
            #     local_dataset_path = join(local_dataset_path, generate_dataset["dataset-name"])
            if not isdir(local_dataset_path):
                error_message = (
                    "Error: The Path "
                    + local_dataset_path
                    + " is not found. Please select a valid destination folder for the new dataset"
                )
                main_curate_status = "Done"
                error = error_message
                raise Exception(error)

    # 1.2. Check that the bf destination is valid if generate on bf, or any other bf actions are requested
    if "bf-account-selected" in soda_json_structure:
        # check that the Pennsieve account is valid
        try:
            main_curate_progress_message = (
                "Checking that the selected Pennsieve account is valid"
            )
            accountname = soda_json_structure["bf-account-selected"]["account-name"]
            bf = Pennsieve(accountname)
        except Exception as e:
            main_curate_status = "Done"
            error = "Error: Please select a valid Pennsieve account"
            raise Exception(error)

    # if uploading on an existing bf dataset
    if "bf-dataset-selected" in soda_json_structure:
        # check that the Pennsieve dataset is valid
        try:
            main_curate_progress_message = (
                "Checking that the selected Pennsieve dataset is valid"
            )
            bfdataset = soda_json_structure["bf-dataset-selected"]["dataset-name"]
            myds = bf.get_dataset(bfdataset)
        except Exception as e:
            main_curate_status = "Done"
            error = "Error: Please select a valid Pennsieve dataset"
            raise Exception(error)

        # check that the user has permissions for uploading and modifying the dataset
        try:
            main_curate_progress_message = "Checking that you have required permissions for modifying the selected dataset"
            role = bf_get_current_user_permission(bf, myds)
            if role not in ["owner", "manager", "editor"]:
                main_curate_status = "Done"
                error = "Error: You don't have permissions for uploading to this Pennsieve dataset"
                raise Exception(error)
        except Exception as e:
            raise e

    # 1.3. Check that specified dataset files and folders are valid (existing path) if generate dataset is requested
    # Note: Empty folders and 0 kb files will be removed without warning (a warning will be provided on the front end before starting the curate process)
    if "generate-dataset" in main_keys:

        # Check at least one file or folder are added to the dataset
        try:
            main_curate_progress_message = "Checking that the dataset is not empty"
            if (
                "dataset-structure" not in soda_json_structure
                and "metadata-files" not in soda_json_structure
            ):
                main_curate_status = "Done"
                error = "Error: Your dataset is empty. Please add valid files and non-empty folders to your dataset."
                raise Exception(error)
        except Exception as e:
            main_curate_status = "Done"
            raise Exception(e)

        # Check that local files/folders exist
        try:

            error = check_local_dataset_files_validity(soda_json_structure)
            if error:
                main_curate_status = "Done"
                raise Exception(error)

            # check that dataset is not empty after removing all the empty files and folders
            if (
                not soda_json_structure["dataset-structure"]["folders"]
                and not "metadata-files" in soda_json_structure
            ):
                main_curate_status = "Done"
                error = "Error: Your dataset is empty. Please add valid files and non-empty folders to your dataset."
                raise Exception(error)

        except Exception as e:
            main_curate_status = "Done"
            raise e

        # Check that bf files/folders exist
        generate_option = soda_json_structure["generate-dataset"]["generate-option"]
        if generate_option == "existing-bf":
            try:
                main_curate_progress_message = (
                    "Checking that the Pennsieve files and folders are valid"
                )
                if soda_json_structure["generate-dataset"]["destination"] == "bf":
                    error = bf_check_dataset_files_validity(soda_json_structure, bf)
                    if error:
                        main_curate_status = "Done"
                        raise Exception(error)
            except Exception as e:
                main_curate_status = "Done"
                raise e

    # 3] Generate
    if "generate-dataset" in main_keys:
        main_curate_progress_message = "Generating dataset"
        try:
            if soda_json_structure["generate-dataset"]["destination"] == "local":
                main_generate_destination = soda_json_structure["generate-dataset"][
                    "destination"
                ]
                _, main_total_generate_dataset_size = generate_dataset_locally(
                    soda_json_structure
                )
                # if "manifest-files" in main_keys:
                #     main_curate_progress_message = "Generating manifest files"
                #     add_local_manifest_files(manifest_files_structure, datasetpath)

            if soda_json_structure["generate-dataset"]["destination"] == "bf":
                main_generate_destination = soda_json_structure["generate-dataset"][
                    "destination"
                ]
                if generate_option == "new":
                    if "dataset-name" in soda_json_structure["generate-dataset"]:
                        dataset_name = soda_json_structure["generate-dataset"][
                            "dataset-name"
                        ]
                        myds = bf_create_new_dataset(dataset_name, bf)
                    bf_generate_new_dataset(soda_json_structure, bf, myds)
                    # if "manifest-files" in main_keys:
                    #     main_curate_progress_message = "Generating manifest files"
                    #     bf_add_manifest_files(manifest_files_structure, myds)
                if generate_option == "existing-bf":
                    myds = bf.get_dataset(bfdataset)
                    bf_update_existing_dataset(soda_json_structure, bf, myds)

        except Exception as e:
            main_curate_status = "Done"
            raise e

    main_curate_status = "Done"
    main_curate_progress_message = "Success: COMPLETED!"

    return main_curate_progress_message, main_total_generate_dataset_size


def main_curate_function_progress():
    """
    Function frequently called by front end to help keep track of the dataset generation progress
    """

    global main_curate_status  # empty if curate on going, "Done" when main curate function stopped (error or completed)
    global main_curate_progress_message
    global main_total_generate_dataset_size
    global main_generated_dataset_size
    global start_generate
    global generate_start_time
    global main_generate_destination
    global main_initial_bfdataset_size
    # global progress_percentage
    # global progress_percentage_array

    elapsed_time = time.time() - generate_start_time
    elapsed_time_formatted = time_format(elapsed_time)

    if start_generate == 1:
        if main_generate_destination == "bf":
            main_generated_dataset_size = (
                bf_dataset_size() - main_initial_bfdataset_size
            )

    return (
        main_curate_status,
        start_generate,
        main_curate_progress_message,
        main_total_generate_dataset_size,
        main_generated_dataset_size,
        elapsed_time_formatted,
    )


def preview_dataset(soda_json_structure):
    """
    Associated with 'Preview' button in the SODA interface
    Creates a folder for preview and adds mock files based on the files specified in the UI by the user (same name as origin but 0 kb in size)
    Opens the dialog box to showcase the files / folders added

    Args:
        soda_json_structure: soda dict with information about all specified files and folders
    Action:
        Opens the dialog box at preview_path
    Returns:
        preview_path: path of the folder where the preview files are located
    """

    preview_path = join(userpath, "SODA", "Preview_dataset")

    # remove empty files and folders from dataset
    try:
        check_empty_files_folders(soda_json_structure)
    except Exception as e:
        raise e

    # create Preview_dataset folder
    try:
        if isdir(preview_path):
            shutil.rmtree(preview_path, ignore_errors=True)
        makedirs(preview_path)
    except Exception as e:
        raise e

    try:

        if "dataset-structure" in soda_json_structure.keys():
            # create folder structure
            def recursive_create_mock_folder_structure(my_folder, my_folderpath):
                if "folders" in my_folder.keys():
                    for folder_key, folder in my_folder["folders"].items():
                        folderpath = join(my_folderpath, folder_key)
                        if not isdir(folderpath):
                            mkdir(folderpath)
                        recursive_create_mock_folder_structure(folder, folderpath)

                if "files" in my_folder.keys():
                    for file_key, file in my_folder["files"].items():
                        if not "deleted" in file["action"]:
                            open(join(my_folderpath, file_key), "a").close()

            dataset_structure = soda_json_structure["dataset-structure"]
            folderpath = preview_path
            recursive_create_mock_folder_structure(dataset_structure, folderpath)

            if "manifest-files" in soda_json_structure.keys():
                if "folders" in dataset_structure.keys():
                    for folder_key, folder in dataset_structure["folders"].items():
                        manifest_path = join(preview_path, folder_key, "manifest.xlsx")
                        if not isfile(manifest_path):
                            open(manifest_path, "a").close()

        if "metadata-files" in soda_json_structure.keys():
            for metadata_key in soda_json_structure["metadata-files"].keys():
                open(join(preview_path, metadata_key), "a").close()

        if len(listdir(preview_path)) > 0:
            folder_in_preview = listdir(preview_path)[0]
            open_file(join(preview_path, folder_in_preview))
        else:
            open_file(preview_path)

        return preview_path

    except Exception as e:
        raise e


def generate_manifest_file_locally(soda_json_structure):
    """
    Function to generate manifest files locally
    """

    def recursive_item_path_create(folder, path):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                if "folderpath" not in folder["files"][item]:
                    folder["files"][item]["folderpath"] = path[:]

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                if "folderpath" not in folder["folders"][item]:
                    folder["folders"][item]["folderpath"] = path[:]
                    folder["folders"][item]["folderpath"].append(item)
                recursive_item_path_create(
                    folder["folders"][item], folder["folders"][item]["folderpath"][:]
                )

        return

    def copytree(src, dst, symlinks=False, ignore=None):
        for item in os.listdir(src):
            s = os.path.join(src, item)
            d = os.path.join(dst, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, symlinks, ignore)
            else:
                shutil.copy2(s, d)

    dataset_structure = soda_json_structure["dataset-structure"]
    starting_point = soda_json_structure["starting-point"]["type"]
    manifest_destination = soda_json_structure["manifest-files"]["local-destination"]

    recursive_item_path_create(dataset_structure, [])
    create_high_level_manifest_files_existing_bf_starting_point(soda_json_structure)
    manifest_destination = return_new_path(
        os.path.join(manifest_destination, "SODA Manifest Files")
    )
    copytree(manifest_folder_path, manifest_destination)
    open_file(manifest_destination)
    return "success"
