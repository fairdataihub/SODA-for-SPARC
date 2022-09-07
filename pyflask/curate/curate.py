# -*- coding: utf-8 -*-

### Import required python modules
from gevent import monkey
import requests

monkey.patch_all()
import platform
import os
from os import listdir, makedirs, mkdir, walk, rename
from os.path import (
    isdir,
    isfile,
    join,
    splitext,
    basename,
    exists,
    expanduser,
    dirname,
    getsize,
    abspath,
)
import pandas as pd
import time
import shutil
import subprocess
import gevent
from pennsieve import Pennsieve
import pathlib
from flask import abort
import requests
from datetime import datetime, timezone

from pysodaUtils import (
    clear_queue,
    agent_running,
    check_forbidden_characters_bf,
    bf_dataset_size,
)

from organizeDatasets import import_pennsieve_dataset

from namespaces import NamespaceEnum, get_namespace_logger

namespace_logger = get_namespace_logger(NamespaceEnum.CURATE_DATASETS)


### Global variables
curateprogress = " "
curatestatus = " "
curateprintstatus = " "
total_dataset_size = 1
curated_dataset_size = 0
start_time = 0
uploaded_folder_counter = 0
current_size_of_uploaded_files = 0
generated_dataset_id = None


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

# a global that tracks the amount of files that have been uploaded in an upload session;
# is reset once the session ends by success, or failure (is implicitly reset in case of Pennsieve Agent freeze by the user closing SODA)
main_curation_uploaded_files = 0

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


def return_new_path_replace(topath):
    """
    This function checks if a folder already exists and in such cases,
    replace the existing folder (this is the opposite situation to the function return_new_path)

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

        return {
            "empty_files": error_files, 
            "empty_folders": error_folders, 
            "soda_json_structure": soda_json_structure
        }

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
guided_manifest_folder_path = join(userpath, "SODA", "Guided-Manifest-Files")


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


def check_JSON_size(jsonStructure):
    """
        This function is called to check size of files that will be created locally on a user's device.
    """
    global total_dataset_size
    total_dataset_size = 0

    try:
        def recursive_dataset_scan(folder):
            global total_dataset_size

            if "files" in folder.keys():
                for file_key, file in folder["files"].items():
                    if not "deleted" in file["action"]:
                        file_type = file["type"]
                        if file_type == "local":
                            file_path = file["path"]
                            if isfile(file_path):
                                total_dataset_size += getsize(file_path)

            if "folders" in folder.keys():
                for folder_key, folder in folder["folders"].items():
                    recursive_dataset_scan(folder)

        # scan dataset structure
        dataset_structure = jsonStructure["dataset-structure"]
        folderSection = dataset_structure["folders"]
        # gets keys like code, primary, source and their content...
        for keys, contents in folderSection.items():
            recursive_dataset_scan(contents)

        if "metadata-files" in jsonStructure.keys():
            metadata_files = jsonStructure["metadata-files"]
            for file_key, file in metadata_files.items():
                if file["type"] == "local":
                    metadata_path = file["path"]
                    if isfile(metadata_path):
                        if "new" in file["action"]:
                            total_dataset_size += getsize(metadata_path)

        if "manifest-files" in jsonStructure.keys():
            manifest_files_structure = create_high_level_manifest_files(jsonStructure)
            for key in manifest_files_structure.keys():
                manifestpath = manifest_files_structure[key]
                if isfile(manifestpath):
                    total_dataset_size += getsize(manifestpath)

        # returns in bytes
        return {"dataset_size": total_dataset_size}
    except Exception as e:
        raise e


def generate_dataset_locally(soda_json_structure):

    global namespace_logger

    namespace_logger.info("starting generate_dataset_locally")

    global main_curate_progress_message
    global progress_percentage
    global main_total_generate_dataset_size
    global start_generate
    global main_curation_uploaded_files

    main_curation_uploaded_files = 0

    # def generate(soda_json_structure):
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
                    if "deleted" not in file["action"]:
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


        namespace_logger.info("generate_dataset_locally step 1")
        # 1. Create new folder for dataset or use existing merge with existing or create new dataset?
        main_curate_progress_message = "Generating folder structure and list of files to be included in the dataset"
        dataset_absolute_path = soda_json_structure["generate-dataset"]["path"]
        if_existing = soda_json_structure["generate-dataset"]["if-existing"]
        dataset_name = soda_json_structure["generate-dataset"]["dataset-name"]
        datasetpath = join(dataset_absolute_path, dataset_name)
        datasetpath = return_new_path(datasetpath)
        mkdir(datasetpath)

        namespace_logger.info("generate_dataset_locally step 2")
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
            namespace_logger.info("generate_dataset_locally (optional) step 3 handling metadata-files")
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
            namespace_logger.info("generate_dataset_locally (optional) step 4 handling manifest-files")
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

        namespace_logger.info("generate_dataset_locally step 5 moving files to new location")
        # 5. Move files to new location
        main_curate_progress_message = "Moving files to new location"
        for fileinfo in list_move_files:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            main_curate_progress_message = (
                "Moving file " + str(srcfile) + " to " + str(distfile)
            )
            mymovefile_with_metadata(srcfile, distfile)

        namespace_logger.info("generate_dataset_locally step 6 copying files to new location")
        # 6. Copy files to new location
        main_curate_progress_message = "Copying files to new location"
        start_generate = 1
        for fileinfo in list_copy_files:
            srcfile = fileinfo[0]
            distfile = fileinfo[1]
            main_curate_progress_message = (
                "Copying file " + str(srcfile) + " to " + str(distfile)
            )
            # track amount of copied files for loggin purposes
            mycopyfile_with_metadata(srcfile, distfile)
            main_curation_uploaded_files += 1

       
        namespace_logger.info("generate_dataset_locally step 7")
        # 7. Delete manifest folder and original folder if merge requested and rename new folder
        shutil.rmtree(manifest_folder_path) if isdir(manifest_folder_path) else 0
        if if_existing == "merge":
            namespace_logger.info("generate_dataset_locally (optional) step 7.1 delete manifest folder if merge requested")
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
            error = f"{error}Error: Please enter valid dataset name<br>"
            c += 1

        if datasetname.isspace():
            error = error + "Error: Please enter valid dataset name" + "<br>"
            c += 1

        if c > 0:
            abort(400, error)

        dataset_list = []
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        if datasetname in dataset_list:
            abort(400, "Error: Dataset name already exists")
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


def create_high_level_manifest_files_existing_local_starting_point(dataset_path):
    soda_manifest_folder_path = join(userpath, "SODA", "manifest_files")

    if dataset_path != "":
        for high_level_fol in listdir(dataset_path):

            if high_level_fol in [
                "primary",
                "derivative",
                "docs",
                "code",
                "source",
                "protocol",
            ]:
                onlyfiles = [
                    join(dataset_path, high_level_fol, f)
                    for f in listdir(join(dataset_path, high_level_fol))
                    if isfile(join(dataset_path, high_level_fol, f))
                ]

                for file in onlyfiles:

                    p = pathlib.Path(file)
                    # create high-level folder at the temporary location
                    folderpath = join(soda_manifest_folder_path, high_level_fol)
                    if p.stem == "manifest":
                        # make copy from this manifest path to folderpath
                        shutil.copyfile(file, join(folderpath, p.name))


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

    global namespace_logger

    namespace_logger.info("Starting bf_update_existing_dataset")

    global main_curate_progress_message
    global main_total_generate_dataset_size
    global start_generate
    global main_initial_bfdataset_size
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
    namespace_logger.info("bf_update_existing_dataset step 1 remove existing files on Pennsieve the user delted")
    main_curate_progress_message = "Checking Pennsieve for deleted files"
    dataset_structure = soda_json_structure["dataset-structure"]
    recursive_file_delete(dataset_structure)
    main_curate_progress_message = (
        "Files on Pennsieve marked for deletion have been deleted"
    )

    # 2. Rename any deleted folders on Pennsieve to allow for replacements.
    namespace_logger.info("bf_update_existing_dataset step 2 rename deleted folders on Pennsieve to allow for replacements")
    main_curate_progress_message = "Checking Pennsieve for deleted folders"
    dataset_structure = soda_json_structure["dataset-structure"]
    recursive_folder_rename(dataset_structure, "deleted")
    main_curate_progress_message = "Folders on Pennsieve have been marked for deletion"

    # 2.5 Rename folders that need to be in the final destination.
    namespace_logger.info("bf_update_existing_dataset step 2.5 rename folders that need to be in the final destination")
    main_curate_progress_message = "Renaming any folders requested by the user"
    recursive_folder_rename(dataset_structure, "renamed")
    main_curate_progress_message = "Renamed all folders requested by the user"

    # 3. Get the status of all files currently on Pennsieve and create
    # the folderpath for all items in both dataset structures.
    namespace_logger.info("bf_update_existing_dataset step 3 get the status of all files currently on Pennsieve and create the folderpath for all items in both dataset structures")
    main_curate_progress_message = "Fetching files and folders from Pennsieve"
    current_bf_dataset_files_folders = import_pennsieve_dataset(
        soda_json_structure.copy()
    )["soda_object"]
    bfsd = current_bf_dataset_files_folders["dataset-structure"]
    main_curate_progress_message = "Creating file paths for all files on Pennsieve"
    recursive_item_path_create(dataset_structure, [])
    recursive_item_path_create(bfsd, [])
    main_curate_progress_message = "File paths created"

    # 4. Move any files that are marked as moved on Pennsieve.
    # Create any additional folders if required
    namespace_logger.info("bf_update_existing_dataset step 4 move any files that are marked as moved on Pennsieve")
    main_curate_progress_message = "Moving any files requested by the user"
    recursive_check_moved_files(dataset_structure)
    main_curate_progress_message = "Moved all files requested by the user"

    # 5. Rename any Pennsieve files that are marked as renamed.
    namespace_logger.info("bf_update_existing_dataset step 5 rename any Pennsieve files that are marked as renamed")
    main_curate_progress_message = "Renaming any files requested by the user"
    recursive_file_rename(dataset_structure)
    main_curate_progress_message = "Renamed all files requested by the user"

    # 6. Delete any Pennsieve folders that are marked as deleted.
    namespace_logger.info("bf_update_existing_dataset step 6 delete any Pennsieve folders that are marked as deleted")
    main_curate_progress_message = (
        "Deleting any additional folders present on Pennsieve"
    )
    recursive_folder_delete(dataset_structure)
    main_curate_progress_message = "Deletion of additional folders complete"

    # 7. Rename any Pennsieve folders that are marked as renamed.
    namespace_logger.info("bf_update_existing_dataset step 7 rename any Pennsieve folders that are marked as renamed")
    main_curate_progress_message = "Renaming any folders requested by the user"
    recursive_folder_rename(dataset_structure, "renamed")
    main_curate_progress_message = "Renamed all folders requested by the user"

    # 8. Delete any metadata files that are marked as deleted.
    namespace_logger.info("bf_update_existing_dataset step 8 delete any metadata files that are marked as deleted")
    main_curate_progress_message = "Removing any metadata files marked for deletion"
    metadata_file_delete(soda_json_structure)
    main_curate_progress_message = "Removed metadata files marked for deletion"

    # 9. Run the original code to upload any new files added to the dataset.
    namespace_logger.info("bf_update_existing_dataset step 9 run the bf_generate_new_dataset code to upload any new files added to the dataset")
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

    global namespace_logger

    namespace_logger.info("Starting bf_generate_new_dataset")

    global main_curate_progress_message
    global main_total_generate_dataset_size
    global start_generate
    global main_initial_bfdataset_size
    global main_curation_uploaded_files
    global uploaded_folder_counter
    global current_size_of_uploaded_files

    uploaded_folder_counter = 0
    current_size_of_uploaded_files = 0

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

                    if existing_folder_option == "skip" and folder_key not in my_tracking_folder["folders"].keys():
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
                        if isfile(file_path) and existing_file_option == "replace" and file_key in my_bf_existing_files_name_with_extension:
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
                            if existing_file_option == "skip" and desired_name_with_extension in my_bf_existing_files_name_with_extension:
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
                            if output := get_base_file_name(desired_name):
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

        namespace_logger.info("bf_generate_new_dataset step 1 create non-existent folders")
        # 1. Scan the dataset structure to create all non-existent folders
        # create a tracking dict which would track the generation of the dataset on Pennsieve
        main_curate_progress_message = "Creating folder structure"
        dataset_structure = soda_json_structure["dataset-structure"]
        tracking_json_structure = {"value": ds}
        existing_folder_option = soda_json_structure["generate-dataset"]["if-existing"]
        recursive_create_folder_for_bf(
            dataset_structure, tracking_json_structure, existing_folder_option
        )

        namespace_logger.info("bf_generate_new_dataset step 2 create list of files to be uploaded and handle renaming")
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

        
        # main_curate_progress_message = "About to update after doing recursive dataset scan"
        # 3. Add high-level metadata files to a list
        ds.update()
        list_upload_metadata_files = []
        if "metadata-files" in soda_json_structure.keys():
            namespace_logger.info("bf_generate_new_dataset (optional) step 3 create high level metadata list")
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
            namespace_logger.info("bf_generate_new_dataset (optional) step 4 create manifest list")

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
        namespace_logger.info("bf_generate_new_dataset step 5 upload files, rename and add to tracking list")
        main_initial_bfdataset_size = bf_dataset_size()
        start_generate = 1
        clear_queue()

        for item in list_upload_files:
            # main_curate_progress_message = "In file one"
            list_upload = item[0]
            bf_folder = item[1]
            list_projected_names = item[2]
            list_desired_names = item[3]
            list_final_names = item[4]
            tracking_folder = item[5]
            relative_path = item[6]

            ## check if agent is running in the background
            agent_running()

            BUCKET_SIZE = 500

            # determine if the current folder's files exceeds 750 (past 750 is a breaking point atm)
            # if so proceed to batch uploading
            if len(list_upload) > BUCKET_SIZE:
                # store the aggregate of the amount of files in the folder
                total_files = len(list_upload)

                # create a start index and an end index
                start_index = end_index = 0

                # while startIndex < files.length
                while start_index < total_files:
                    # set the endIndex to startIndex plus 750
                    end_index = start_index + BUCKET_SIZE - 1

                    # check if the endIndex is out of bounds
                    if end_index >= total_files:
                        # if so set end index to files.length - 1
                        end_index = len(list_upload) - 1

                    # get the 750 files between startIndex and endIndex (inclusive of endIndex)
                    upload_bucket = list_upload[start_index : end_index + 1]

                    # inform the user files are being uploaded
                    main_curate_progress_message = "Uploading files in " + str(
                        relative_path
                    )

                    namespace_logger.info(f"bf_generate_new_dataset step 5.1 uploading files to folder {bf_folder.name}")


                    current_os = platform.system()

                    # clear the pennsieve queue for successive batches
                    # Mac builds not able to spawn subprocess from Python at the moment
                    if not current_os == "Darwin":
                        clear_queue()

                    # upload the file
                    bf_folder.upload(*upload_bucket)

                    # update the files
                    bf_folder.update()

                    for file in upload_bucket:
                        current_size_of_uploaded_files += getsize(file)

                    # update the global that tracks the amount of files that have been successfully uploaded
                    main_curation_uploaded_files = BUCKET_SIZE
                    uploaded_folder_counter += 1

                    # handle renaming to final names
                    for index, projected_name in enumerate(
                        list_projected_names[start_index : end_index + 1]
                    ):
                        final_name = list_final_names[start_index : end_index + 1][
                            index
                        ]
                        desired_name = list_desired_names[start_index : end_index + 1][
                            index
                        ]
                        if final_name != projected_name:
                            bf_item_list = bf_folder.items
                            (
                                my_bf_existing_files,
                                my_bf_existing_files_name,
                                my_bf_existing_files_name_with_extension,
                            ) = bf_get_existing_files_details(bf_folder)
                            for item in my_bf_existing_files[
                                start_index : end_index + 1
                            ]:
                                if item.name == projected_name:
                                    item.name = final_name
                                    try: 
                                        item.update()
                                    except requests.exceptions.HTTPError as e:
                                        handle_duplicate_package_name_error(e, soda_json_structure)
                                    if "files" not in tracking_folder:
                                        tracking_folder["files"] = {}
                                        tracking_folder["files"][desired_name] = {
                                            "value": item
                                        }

                    # update the start_index to end_index + 1
                    start_index = end_index + 1
            else:
                # get the current OS
                current_os = platform.system()

                # clear the pennsieve queue
                if not current_os == "Darwin":
                    # clear the pennsieve queue
                    clear_queue()

                # upload all files at once for the folder
                main_curate_progress_message = "Uploading files in " + str(
                    relative_path
                )

                namespace_logger.info(f"bf_generate_new_dataset step 5.1 uploading files to folder {bf_folder.name}")

                # fails when a single folder has more than 750 files (at which point I'm not sure)

                bf_folder.upload(*list_upload)
                bf_folder.update()

                main_curation_uploaded_files = len(list_upload)
                uploaded_folder_counter += 1

                for file in list_upload:
                    current_size_of_uploaded_files += getsize(file)

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
                                try: 
                                    item.update()
                                except requests.exceptions.HTTPError as e:
                                    handle_duplicate_package_name_error(e, soda_json_structure)
                                   
                                if "files" not in tracking_folder:
                                    tracking_folder["files"] = {}
                                    tracking_folder["files"][desired_name] = {
                                        "value": item
                                    }


        # 6. Upload metadata files
        if list_upload_metadata_files:
            namespace_logger.info("bf_generate_new_dataset (optional) step 6 upload metadata files")
            main_curate_progress_message = (
                "Uploading metadata files in high-level dataset folder " + str(ds.name)
            )
            ds.upload(*list_upload_metadata_files)


        # 7. Upload manifest files
        if list_upload_manifest_files:
            namespace_logger.info("bf_generate_new_dataset (optional) step 7 upload manifest files")
            for item in list_upload_manifest_files:
                manifest_file = item[0]
                bf_folder = item[1]
                main_curate_progress_message = (
                    "Uploading manifest file in " + str(bf_folder.name) + " folder"
                )
                bf_folder.upload(*manifest_file)
                bf_folder.update()
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


# TODO: Make sure copying as we do for the local case is fine. I believe it is since there is no freeze. Just make that case wait for the success or fail to log. Get the result from the backend in the fail case.
def handle_duplicate_package_name_error(e, soda_json_structure):
    if e.response.text == '{"type":"BadRequest","message":"package name must be unique","code":400}':
        if "if-existing-files" in soda_json_structure["generate-dataset"]:
            if soda_json_structure["generate-dataset"]["if-existing-files"] == "create-duplicate":
                return

    raise e

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
                        details = bf._api._get(f"/packages/{str(package_id)}/view")
                    except Exception as e:
                        error_message = relative_path + " (id: " + package_id + ")"
                        error.append(error_message)
                error = recursive_bf_dataset_check(folder, relative_path, error)
        if "files" in my_folder.keys():
            for file_key, file in my_folder["files"].items():
                file_type = file["type"]
                if file_type == "bf":
                    package_id = file["path"]
                    try:
                        details = bf._api._get(f"/packages/{str(package_id)}/view")
                    except Exception as e:
                        relative_path = my_relative_path + "/" + file_key
                        error_message = relative_path + " (id: " + package_id + ")"
                        error.append(error_message)
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

    global namespace_logger

    namespace_logger.info("Starting main_curate_function")
    namespace_logger.info(f"main_curate_function metadata generate-options={soda_json_structure['generate-dataset']}")
        
    global main_curate_status
    global main_curate_progress_message
    global main_total_generate_dataset_size
    global main_generated_dataset_size
    global start_generate
    global generate_start_time
    global main_generate_destination
    global main_initial_bfdataset_size
    global main_curation_uploaded_files
    global uploaded_folder_counter

    global bf
    global myds
    global generated_dataset_id

    start_generate = 0
    generate_start_time = time.time()

    main_curate_status = ""
    main_curate_progress_message = "Starting..."
    main_total_generate_dataset_size = 1
    main_generated_dataset_size = 0
    main_curation_uploaded_files = 0
    uploaded_folder_counter = 0
    generated_dataset_id = None

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

    namespace_logger.info("main_curate_function step 1")

    # 1.1. Check that the local destination is valid if generate dataset locally is requested
    if "generate-dataset" in main_keys and soda_json_structure["generate-dataset"]["destination"] == "local":
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
            abort(400, error)

    namespace_logger.info("main_curate_function step 1.2")

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
            abort(400, "Error: Please select a valid Pennsieve account")

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
            abort(400, "Error: Please select a valid Pennsieve dataset")

        # check that the user has permissions for uploading and modifying the dataset
        main_curate_progress_message = "Checking that you have required permissions for modifying the selected dataset"
        role = bf_get_current_user_permission(bf, myds)
        if role not in ["owner", "manager", "editor"]:
            main_curate_status = "Done"
            abort(403, "Error: You don't have permissions for uploading to this Pennsieve dataset")

    namespace_logger.info("main_curate_function step 1.3")

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
                abort(400, "Error: Your dataset is empty. Please add valid files and non-empty folders to your dataset.")
        except Exception as e:
            main_curate_status = "Done"
            raise e

        # Check that local files/folders exist
        try:
            if error := check_local_dataset_files_validity(soda_json_structure):
                main_curate_status = "Done"
                abort(400, error)

            # check that dataset is not empty after removing all the empty files and folders
            if not soda_json_structure["dataset-structure"]["folders"] and "metadata-files" not in soda_json_structure:
                main_curate_status = "Done"
                abort(400, "Error: Your dataset is empty. Please add valid files and non-empty folders to your dataset.")

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
                    if error := bf_check_dataset_files_validity(soda_json_structure, bf):
                        main_curate_status = "Done"
                        abort(400, error)
            except Exception as e:
                main_curate_status = "Done"
                raise e


    namespace_logger.info("main_curate_function step 3")

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
                        generated_dataset_id = myds.id
                    bf_generate_new_dataset(soda_json_structure, bf, myds)
                if generate_option == "existing-bf":
                    myds = bf.get_dataset(bfdataset)
                    bf_update_existing_dataset(soda_json_structure, bf, myds)

        except Exception as e:
            main_curate_status = "Done"
            raise e

    namespace_logger.info("main_curate_function finished")

    main_curate_status = "Done"
    main_curate_progress_message = "Success: COMPLETED!"

    return {
        "main_curate_progress_message": main_curate_progress_message,
        "main_total_generate_dataset_size": main_total_generate_dataset_size,
        "main_curation_uploaded_files": main_curation_uploaded_files,
    }


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

    if start_generate == 1 and main_generate_destination == "bf":
        main_generated_dataset_size = (
            bf_dataset_size() - main_initial_bfdataset_size
        )

    return {
        "main_curate_status": main_curate_status,
        "start_generate": start_generate,
        "main_curate_progress_message": main_curate_progress_message,
        "main_total_generate_dataset_size": main_total_generate_dataset_size,
        "main_generated_dataset_size": main_generated_dataset_size,
        "elapsed_time_formatted": elapsed_time_formatted,
    }


def main_curate_function_upload_details():
    """
    Function frequently called by front end to help keep track of the amount of files that have
    been successfully uploaded to Pennsieve, and the size of the uploaded files
    Also tells us how many files have been copied (double usage of both variables) to a destination folder
    for local dataset generation.
    """
    global main_curation_uploaded_files
    global main_generated_dataset_size
    global uploaded_folder_counter
    global current_size_of_uploaded_files
    # when the user creates a new Pennsieve dataset return back their new dataset id
    global generated_dataset_id

    return {
        "main_curation_uploaded_files": main_curation_uploaded_files,
        "current_size_of_uploaded_files": current_size_of_uploaded_files,
        "uploaded_folder_counter": uploaded_folder_counter,
        "generated_dataset_id": generated_dataset_id,
    }


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


def generate_manifest_file_locally(generate_purpose, soda_json_structure):
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
                if os.path.exists(d):
                    shutil.rmtree(d)
                shutil.copytree(s, d, symlinks, ignore)
            else:
                shutil.copy2(s, d)

    dataset_structure = soda_json_structure["dataset-structure"]
    starting_point = soda_json_structure["starting-point"]["type"]
    manifest_destination = soda_json_structure["manifest-files"]["local-destination"]

    recursive_item_path_create(dataset_structure, [])
    create_high_level_manifest_files_existing_bf_starting_point(soda_json_structure)

    if generate_purpose == "edit-manifest":
        manifest_destination = os.path.join(manifest_destination, "SODA Manifest Files")

    else:
        manifest_destination = return_new_path(
            os.path.join(manifest_destination, "SODA Manifest Files")
        )

    copytree(manifest_folder_path, manifest_destination)

    if generate_purpose == "edit-manifest":
        return {"success_message_or_manifest_destination": manifest_destination}

    open_file(manifest_destination)
    return {"success_message_or_manifest_destination": "success"}


def guided_generate_manifest_file_data(high_level_folder_contents):
    """
    Function to create manifest files for each high-level SPARC folder for an existing Pennsieve dataset.
    Args:
        soda_json_structure: soda dict with information about the dataset to be generated/modified
    Action:
        manifest_files_structure: dict including the local path of the manifest files
    """
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

        if double_ext == False:
            ext = os.path.splitext(file_name)[1]
        else:
            ext = (
                os.path.splitext(os.path.splitext(file_name)[0])[1]
                + os.path.splitext(file_name)[1]
            )
        return ext

    def guided_recursive_folder_traversal(folder, dict_folder_manifest):
        if "files" in folder.keys():
            for item in list(folder["files"]):
                # Auto generate file name
                relative_file_name = folder["files"][item]["path"]
                relative_file_name.replace("\\", "/")
                dict_folder_manifest["filename"].append(relative_file_name)

                # Auto generate file extension
                file_extension = get_name_extension(relative_file_name)
                if file_extension == "":
                    file_extension = "None"
                dict_folder_manifest["file type"].append(file_extension)

                # Auto generate file timestamp
                filepath = pathlib.Path(relative_file_name)
                mtime = filepath.stat().st_mtime
                lastmodtime = datetime.fromtimestamp(mtime).astimezone(
                    local_timezone
                )
                dict_folder_manifest["timestamp"].append(
                    lastmodtime.isoformat()
                    .replace(".", ",")
                    .replace("+00:00", "Z")
                )

                dict_folder_manifest["description"].append("")
                dict_folder_manifest["Additional Metadata"].append("")

        if "folders" in folder.keys():
            for item in list(folder["folders"]):
                guided_recursive_folder_traversal(
                    folder["folders"][item], dict_folder_manifest
                )

        return

    # Initialize dict where manifest info will be stored
    dict_folder_manifest = {}
    dict_folder_manifest["filename"] = []
    dict_folder_manifest["timestamp"] = []
    dict_folder_manifest["description"] = []
    dict_folder_manifest["file type"] = []
    dict_folder_manifest["Additional Metadata"] = []

    guided_recursive_folder_traversal(
        high_level_folder_contents, dict_folder_manifest
    )

    return dict_folder_manifest


def handle_duplicate_package_name_error(e, soda_json_structure):
    if (
        e.response.text
        == '{"type":"BadRequest","message":"package name must be unique","code":400}'
    ):
        if "if-existing-files" in soda_json_structure["generate-dataset"]:
            if (
                soda_json_structure["generate-dataset"]["if-existing-files"]
                == "create-duplicate"
            ):
                return

    raise e
