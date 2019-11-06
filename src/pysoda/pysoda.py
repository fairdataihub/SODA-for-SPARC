# -*- coding: utf-8 -*-

# python module for Software for Organizing Data Automatically (SODA)
import os
import platform
from os import listdir, stat, makedirs, mkdir, walk
from os.path import isdir, isfile, join, splitext, getmtime, basename, normpath, exists, expanduser, split, dirname, getsize
import pandas as pd
from time import strftime, localtime
from shutil import copy2, copy, copyfile
from blackfynn import Blackfynn
from configparser import ConfigParser
import threading
import json
from pandas.io.html import read_html
import numpy as np
import collections
import subprocess
import shutil
import re
import gevent

### Global variables
curateprogress = ' '
curatestatus = ' '
curateprintstatus = ' '
total_dataset_size = 0
curated_dataset_size = 0

userpath = expanduser("~")
configpath = join(userpath, '.blackfynn', 'config.ini')
submitdataprogress = ' '
submitdatastatus = ' '
submitprintstatus = ' '


### Internal functions
def open_file(file_path):
    """
    Opening folder on all platforms
    https://stackoverflow.com/questions/6631299/python-opening-a-folder-in-explorer-nautilus-mac-thingie

    Args:
        file_path: path of the folder
    Action:
        Opens dialog box for the given path
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
            path: path of the folder
    Returns:
            total_siz: Total size of the folder in bytes (integer)
    """
    total_size = 0
    start_path = '.'  # To get size of current directory
    for path, dirs, files in walk(path):
        for f in files:
            fp = join(path, f)
            total_size += getsize(fp)
    return total_size


def path_size(path):
    """
    Returns size of the path, after checking if it's a folder or a file
    """
    if isdir(path):
        return folder_size(path)
    else:
        return getsize(path)


def create_manifest_with_description(datasetpath, jsonpath, jsondescription):
    """
    Creates manifest files with the description specified

    Args:
        datasetpath: path of the dataset
        jsonpath: all paths in json format
        jsondescription: description associated with each path
    Action:
        Creates manifest files in Excel format
    """
    try:
        folders = list(jsonpath.keys())
        if 'main' in folders:
            folders.remove('main')
        # In each subfolder, generate a manifest file
        for folder in folders:
            if (jsonpath[folder] != []):

                # Initialize dataframe where manifest info will be stored
                df = pd.DataFrame(columns=['filename', 'timestamp', 'description',
                                        'file type', 'Additional Metadata…'])
                # Get list of files/folders in the the folde#
                # Remove manifest file from the list if already exists
                folderpath = join(datasetpath, folder)
                allfiles = jsonpath[folder]
                alldescription = jsondescription[folder + '_description']
                manifestexists = join(folderpath, 'manifest.csv')

                countpath = -1
                for pathname in allfiles:
                    countpath += 1
                    if basename(pathname) == 'manifest.csv':
                        allfiles.pop(countpath)
                        alldescription.pop(countpath)

                # Populate manifest dataframe
                filename, timestamp, filetype, filedescription = [], [], [], []
                countpath = -1
                for filepath in allfiles:
                    countpath += 1
                    file = basename(filepath)
                    filename.append(splitext(file)[0])
                    lastmodtime = getmtime(filepath)
                    timestamp.append(strftime('%Y-%m-%d %H:%M:%S',
                                              localtime(lastmodtime)))
                    filedescription.append(alldescription[countpath])
                    if isdir(filepath):
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

                # Save manifest as Excel sheet
                manifestfile = join(folderpath, 'manifest.csv')
                df.to_csv(manifestfile, index=None, header=True)

    except Exception as e:
        raise e


def check_forbidden_characters(my_string):
    """
    Check for forbidden characters in file/folder name
    Args:
        my_string: string with characters
    Returns:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile('[@!#$%^&*()<>?/\|}{~:],')
    if(regex.search(my_string) == None):
        return False
    else:
        return True


def return_new_path(topath):
    """
    This function checks if the folder already exists and in such cases, appends the name with (2) or (3) etc.

    Args:
        topath: path where the folder is supposed to be copied
    Returns:
        topath: new folder name based on the availability in destination folder
    """
    if exists(topath):
        i = 2
        while True:
            if not exists(topath + ' (' + str(i) + ')'):
                return topath + ' (' + str(i) + ')'
            i += 1
    else:
        return topath


def mycopyfileobj(fsrc, fdst, src, length=16*1024):
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
        curateprogress = 'Copying ' + str(src) + ','
        # curateprogress += 'Progress: ' + str(curated_dataset_size/total_dataset_size*100) + '%'


def mycopyfile_with_metadata(src, dst, *, follow_symlinks=True):
    """
    Copy file src to dst with metadata (timestamp, permission, etc.) conserved

    If follow_symlinks is not set and src is a symbolic link, a new
    symlink will be created instead of copying the file it points to.

    """
    if not follow_symlinks and os.path.islink(src):
        os.symlink(os.readlink(src), dst)
    else:
        with open(src, 'rb') as fsrc:
            with open(dst, 'wb') as fdst:
                mycopyfileobj(fsrc, fdst, src)
    shutil.copystat(src, dst)
    return dst


### SPARC dataset organizer
def save_file_organization(jsonpath, jsondescription, pathsavefileorganization):
    """
    Associated with 'Save' button in the SODA GUI
    Saves the paths and associated descriptions from json to a CSV file for future use
    Each json key (SPARC foler name) becomes a header in the CSV

    Args:
        jsonpath: paths of all files (json object)
        jsondescription: description associated with each file (json object)
        pathsavefileorganization: destination path for CSV file to be saved (string)
    Returns:
        CSV file with path and description for files in SPARC folders
    """
    try:
        mydict = jsonpath
        mydict2 = jsondescription
        mydict.update(mydict2)
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
    Associated with 'Import' button in the SODA GUI
    Import previously saved progress (CSV file) to a dictionary for viewing in the SODA GUI

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
            mydict[dictkeys[i]] = pathvect
        return mydict
    except Exception as e:
        raise e


def create_preview_files(paths, folder_path):
    """
    Creates folders and empty files from original 'paths' to the destination 'folder_path'

    Args:
        paths: Paths of all the files that need to be copied
        folder_path: Destination to which the files / folders need to be copied
    Action:
        Creates folders and empty files at the given 'folder_path'
    """
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


def preview_file_organization(jsonpath):
    """
    Associated with 'Preview' button in the SODA GUI
    Creates a folder for preview and adds mock files from SODA table (same name as origin but 0 kb in size)
    Opens the dialog box to showcase the files / folders added

    Args:
        jsonpath: json object containing all paths (keys are SPARC folder names)
    Action:
        Opens the dialog box at preview_path
    Returns:
        preview_path: path of the folder where the preview files are located
    """
    mydict = jsonpath
    userpath = expanduser("~")
    preview_path = join(userpath, "SODA", "Preview")
    try:
        makedirs(preview_path)
    except:
        raise Exception("Error: Preview folder already present, click on 'Delete Preview Folder' option to get rid of the older vesion")

    try:
        folderrequired = []
        for i in mydict.keys():
            if mydict[i] != []:
                folderrequired.append(i)
                if i != 'main':
                    makedirs(join(preview_path, i))

        for i in folderrequired:
            paths = mydict[i]
            if (i == 'main'):
                create_preview_files(paths, join(preview_path))
            else:
                create_preview_files(paths, join(preview_path, i))
        open_file(preview_path)
        return preview_path
    except Exception as e:
        raise e


def delete_preview_file_organization():
    """
    Associated with 'Delete Preview Folder' button
    Deletes the 'Preview' folder from the disk
    """
    try:
        userpath = expanduser("~")
        preview_path = join(userpath, "SODA")
        if isdir(preview_path):
            shutil.rmtree(preview_path, ignore_errors=True)
        else:
            raise Exception("Error: Preview folder not present or already deleted !")
    except Exception as e:
        raise e


### SPARC generate dataset
def create_dataset(jsonpath, pathdataset):
    """
    Associated with 'Create new dataset locally'
    Creates folders and files from paths specified in json object TO the destination path specified

    Input:
        jsonpath: JSON object of all paths from origin
        pathdataset: destination path for creating a new dataset as specified
    Action:
        Creates the folders and files specified
    """
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
            mycopyfile_with_metadata(srcfile, distfile)

    except Exception as e:
        raise e


def curate_dataset(sourcedataset, destinationdataset, pathdataset, newdatasetname,\
        submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription, \
        subjectsstatus, pathsubjects, samplesstatus, pathsamples, manifeststatus, \
        jsonpath, jsondescription):
    """
    Associated with 'Generate' button in the 'Generate dataset' section
    Checks validity of files / paths / folders and then generates the files and folders as requested along with progress status
    """

    global curatestatus #set to 'Done' when completed or error to stop progress tracking from front-end
    global curateprogress #GUI messages shown to user to provide upadte on progress
    global curateprintstatus # If = "Curating" Progress messages are shown to user
    global total_dataset_size # total size of the dataset to be generated
    global curated_dataset_size # total size of the dataset generated (locally or on blackfynn) at a given time

    curateprogress = ' '
    curatestatus = ''
    curateprintstatus = ' '
    error, c = '', 0
    total_dataset_size = 0
    curated_dataset_size = 0

    # if sourcedataset == 'already organized':
    #     if not isdir(pathdataset):
    #         curatestatus = 'Done'
    #         raise Exception('Error: Please select a valid dataset folder')

    if destinationdataset == 'create new':
        if not isdir(pathdataset):
            curatestatus = 'Done'
            raise Exception('Error: Please select a valid folder for new dataset')
        if (check_forbidden_characters(newdatasetname) or not newdatasetname):
            curatestatus = 'Done'
            raise Exception('Error: Please enter a valid name for new dataset folder')

    error, c = '', 0
    if submissionstatus:
        if not isfile(pathsubmission):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for submission file<br>'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathsubmission))[0] != 'submission':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for submission file<br>'
            c += 1

    if datasetdescriptionstatus:
        if not isfile(pathdescription):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for dataset description file<br>'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathdescription))[0] != 'dataset_description':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for dataset_description file<br>'
            c += 1

    if subjectsstatus:
        if not isfile(pathsubjects):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for subjects file<br>'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathsubjects))[0] != 'subjects':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for subjects file<br>'
            c += 1

    if samplesstatus:
        if not isfile(pathsamples):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for samples file<br>'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathsamples))[0] != 'samples':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for samples file<br>'
            c += 1
    if c > 0:
        raise Exception(error)

    # check if path in jsonpath are valid and calculate total dataset size
    error, c = '', 0
    for folders in jsonpath.keys():
        if jsonpath[folders] != []:
            for path in jsonpath[folders]:
                if exists(path):
                    total_dataset_size += path_size(path)
                else:
                    c += 1
                    error = error + path + ' does not exist <br>'

    if c > 0:
        error = error + '<br>Please remove invalid paths'
        curatestatus = 'Done'
        raise Exception(error)

    # MODIFY EXISTING
    if destinationdataset == 'modify existing':
        error, c = '', 0
        namefiles = [f for f in listdir(pathdataset) if isfile(join(pathdataset, f))]
        if ('submission.xlsx' in namefiles or 'submission.csv' in namefiles) and submissionstatus:
            error = error + 'submission file already present<br>'
            c += 1
        if 'dataset_description.xlsx' in namefiles and datasetdescriptionstatus:
            error = error + 'dataset_description file already present<br>'
            c += 1
        if  'samples.xlsx' in namefiles and samplesstatus:
            error = error + 'samples file already present<br>'
            c += 1
        if  'subjects.xlsx' in namefiles and subjectsstatus:
            error = error + 'subjects file already present<br>'
            c += 1

        if c > 0:
            error = error + '<br>Error: Either delete or select "None" in the SODA interface'
            curatestatus = 'Done'
            raise Exception(error)

        # If no errors, code-block below will execute which will start the data generation process
        else:
            try:

                open_file(pathdataset)

                curateprogress = 'Started'
                curateprintstatus = 'Curating'

                curateprogress = "New dataset not requested"

                if manifeststatus:
                    create_manifest_with_description(pathdataset, jsonpath, jsondescription)
                    curateprogress = 'Manifest created'

                if submissionstatus:
                    copy(pathsubmission, pathdataset)
                    curateprogress = 'Submission file created'

                if datasetdescriptionstatus:
                    copy(pathdescription, pathdataset)
                    curateprogress = 'Dataset description file created'

                if subjectsstatus:
                    copy(pathsubjects, pathdataset)
                    curateprogress = 'Subjects file created'

                if samplesstatus:
                    copy(pathsamples, pathdataset)
                    curateprogress = 'Samples file created'

                curateprogress = 'Success: COMPLETED!'

                curatestatus = 'Done'

            except Exception as e:
                curatestatus = 'Done'
                raise e

    # CREATE NEW
    elif destinationdataset == 'create new':
        try:

            pathnewdatasetfolder = join(pathdataset, newdatasetname)
            pathnewdatasetfolder  = return_new_path(pathnewdatasetfolder)
            open_file(pathnewdatasetfolder)
            curateprogress = 'Started'

            curateprintstatus = 'Curating'

            pathdataset = pathnewdatasetfolder
            mkdir(pathdataset)

            create_dataset(jsonpath, pathdataset)

            curateprogress = 'New dataset created'

            if manifeststatus:
                create_manifest_with_description(pathdataset, jsonpath, jsondescription)
                curateprogress = 'Manifest created'

            if submissionstatus:
                copy2(pathsubmission, pathdataset)
                curateprogress = 'Submission file created'

            if datasetdescriptionstatus:
                copy2(pathdescription, pathdataset)
                curateprogress = 'Dataset description file created'

            if subjectsstatus:
                copy2(pathsubjects, pathdataset)
                curateprogress = 'Subjects file created'

            if samplesstatus:
                copy2(pathsamples, pathdataset)
                curateprogress = 'Samples file created'

            curateprogress = 'Success: COMPLETED!'

            curatestatus = 'Done'

        except Exception as e:
            curatestatus = 'Done'
            raise e

    # UPLOAD TO BLACKFYNN

    elif destinationdataset == 'upload to blackfynn':
        error, c = '', 0
        accountname = pathdataset
        bfdataset = newdatasetname
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

        # if not isdir(pathdataset):
        #     submitdatastatus = 'Done'
        #     error = error + 'Error: Please select a valid local dataset folder' + '<br>'
        #     c += 1
        if c>0:
            raise Exception(error)

        try:
            def calluploaddirectly():
                global curateprogress
                global curatestatus
                curateprogress = "Started uploading to dataset %s" %(bfdataset)
                # return submitdataprogress
                myds = bf.get_dataset(bfdataset)
                myfolder = myds.name
                for folder in jsonpath.keys():
                    if jsonpath[folder] != []:
                        if folder != 'main':
                            mybffolder = myds.create_collection(folder)
                        else:
                            mybffolder = myds
                        for mypath in jsonpath[folder]:
                            if isdir(mypath):
                                temp_bffolder = mybffolder
                                mybffolder = mybffolder.create_collection(basename(mypath))
                                curateprogress = str(mypath)
                                directly_upload_structured_file(mybffolder, mypath, folder)
                                mybffolder = temp_bffolder
                            else:
                                curateprogress = str(mypath)
                                directly_upload_structured_file(mybffolder, mypath, folder)


                curateprogress = "Success: dataset and associated files have been uploaded"
                curatestatus = 'Done'

            curateprintstatus = 'Curating'
            t = threading.Thread(target=calluploaddirectly)
            t.start()
        except Exception as e:
            curatestatus = 'Done'
            raise e

def directly_upload_structured_file(myds, mypath, myfolder):
    """
    Helper function to upload given folder to Blackfynn dataset in the original folder structure

    Input:
        myds: Dataset name on Blackfynn
        mypath: Path of the organized dataset on local machine
        myfolder: Current folder inside the path
    Action:
        Uploads the folder to Blackfynn
    """
    global curateprogress
    global curated_dataset_size
    global total_dataset_size

    try:
        mypath = join(mypath)
        if isdir(mypath):
            for f in listdir(mypath):
                if isfile(join(mypath, f)):
                    curateprogress =  "Uploading " + f
                    filepath = join(mypath, f)
                    # curateprogress = curateprogress + ',' + 'Progress: ' + str((curated_dataset_size/total_dataset_size)*100) + '%'
                    myds.upload(filepath, use_agent=False)
                    curated_dataset_size += getsize(filepath)
                else:
                    mybffolder = myds.create_collection(f)
                    myfolderpath = join(mypath, f)
                    directly_upload_structured_file(mybffolder, myfolderpath, f)
        else:
            curateprogress = "Uploading " + str(mypath)
            # curateprogress = curateprogress + ',' + 'Progress: ' + str(curated_dataset_size/total_dataset_size) + '%'
            myds.upload(mypath, use_agent=False)
            curated_dataset_size += getsize(mypath)

    except Exception as e:
        curatestatus = 'Done'
        raise e


def curate_dataset_progress():
    """
    Function frequently called by front end to help keep track of the progress
    """
    global curateprogress
    global curatestatus
    global curateprintstatus
    global total_dataset_size
    global curated_dataset_size
    return (curateprogress, curatestatus, curateprintstatus, total_dataset_size, curated_dataset_size)


### SODA Blackfynn interface

def bf_add_account(keyname, key, secret):
    """
    Associated with 'Add account' button in 'Login to your Blackfynn account' section
    Adds an account on the local machine linked to the credentials specified

    Input:
        keyname: Name of the Account to be associated with the given credentials
        key: API key
        secret: API Secret
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
        #Load existing or create new config file
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

        #Add new account
        config.add_section(keyname)
        config.set(keyname, 'api_token', key)
        config.set(keyname, 'api_secret', secret)

        with open(configpath, 'w') as configfile:
            config.write(configfile)

    except Exception as e:
        raise e

    #Check key and secret are valid, if not delete account from config
    try:
        bf = Blackfynn(keyname)
        with open(configpath, 'w') as configfile:
            config.write(configfile)
        return 'Success: added account ' + str(bf)
    except:
        bf_delete_account(keyname)
        raise Exception('Authentication Error: please check that key name, key, and secret are entered properly')


def bf_delete_account(keyname):
    """
    Deletes account information from the system
    """
    config = ConfigParser()
    config.read(configpath)
    config.remove_section(keyname)
    with open(configpath, 'w') as configfile:
        config.write(configfile)


def bf_account_list():
    """
    Returns list of accounts stored in the system
    """
    try:
        accountlist = ['Select']
        if exists(configpath):
            config = ConfigParser()
            config.read(configpath)
            accountname = config.sections()
            accountnamenoglobal = [n for n in accountname if n != "global"]
            if accountnamenoglobal:
                for n in accountnamenoglobal:
                    try:
                        bfn = Blackfynn(n)
                        accountlist.append(n)
                    except:
                        config.remove_section(n)
                with open(configpath, 'w') as configfile:
                    config.write(configfile)
        return accountlist

    except Exception as e:
        raise e


def bf_dataset_account(accountname):
    """
    Returns list of datasets associated with the specified Account Name ('accountname')
    """
    try:
        dataset_list = []
        bf = Blackfynn(accountname)
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        dataset_list.sort(key=lambda v: v.upper()) # Returning the list of datasets in alphabetical order
        dataset_list.insert(0, ['Select dataset'])
        return dataset_list
    except Exception as e:
        raise e


def bf_account_details(accountname):
    """
    Returns list of datasets associated with the specified Account Name ('accountname')
    """
    try:
        bf = Blackfynn(accountname)
        acc_details = "User email: " + bf.profile.email + "<br>"
        acc_details = acc_details + "Organization: " + bf.context.name
        return acc_details
    except Exception as e:
        raise e


def bf_new_dataset_folder(datasetname, accountname):
    """
    Associated with 'Create' button in 'Create new dataset folder'

    Input:
        datasetname: Name of the dataset to be created
        accountname: Account in which the dataset needs to be created
    Action:
        Creates dataset for the account specified
    """
    try:
        error, c = '', 0
        datasetname = datasetname.strip()

        if check_forbidden_characters(datasetname):
            error = error + 'Error: Please enter valid dataset folder name' + '\n'
            c += 1

        if (not datasetname):
            error = error + 'Error: Please enter valid dataset folder name' + '\n'
            c += 1

        if (datasetname.isspace()):
            error = error + 'Error: Please enter valid dataset folder name' + '\n'
            c += 1

        try:
            bf = Blackfynn(accountname)
        except Exception as e:
            error = error + 'Error: Please select a valid Blackfynn account' + '\n'
            c += 1

        if c>0:
            raise Exception(error)

        dataset_list = []
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        if datasetname in dataset_list:
            raise Exception('Error: Dataset folder name already exists')
        else:
            bf.create_dataset(datasetname)

    except Exception as e:
        raise e


def upload_structured_file(myds, mypath, myfolder):
    """
    Helper function to upload given folder to Blackfynn dataset in the original folder structure

    Input:
        myds: Dataset name on Blackfynn
        mypath: Path of the organized dataset on local machine
        myfolder: Current folder inside the path
    Action:
        Uploads the folder to Blackfynn
    """
    global submitdataprogress
    global submitdatastatus
    global uploaded_file_size

    mypath = join(mypath)
    for f in listdir(mypath):
        if isfile(join(mypath, f)):
            submitdataprogress = submitdataprogress + ', ,' + "Uploading " + f + " in " + myfolder
            filepath = join(mypath, f)
            myds.upload(filepath, use_agent=False)
            uploaded_file_size += getsize(filepath)
            submitdataprogress = submitdataprogress + ',' + " uploaded"
        else:
            submitdataprogress = submitdataprogress + ', ,' +"Creating folder " + f
            mybffolder = myds.create_collection(f)
            myfolderpath = join(mypath, f)
            upload_structured_file(mybffolder, myfolderpath, f)


def bf_submit_dataset(accountname, bfdataset, pathdataset):
    """
    Associated with 'Submit dataset' button in 'Submit new dataset' section
    Uploads the specified folder to the specified dataset on Blackfynn account

    Input:
        accountname: Account in which the dataset needs to be created
        bfdataset: Name of the dataset on Blackfynn
        pathdataset: Path of dataset on local machine
    Action:
        Uploads dataset on Blackfynn account
    """
    global submitdataprogress
    global submitdatastatus
    global total_file_size
    global uploaded_file_size
    global submitprintstatus
    total_file_size = folder_size(pathdataset)
    submitdataprogress = ' '
    submitdatastatus = ' '
    uploaded_file_size = 0
    submitprintstatus = ' '
    error, c = '', 0

    try:
        bf = Blackfynn(accountname)
    except Exception as e:
        submitdatastatus = 'Done'
        error = error + 'Error: Please select a valid Blackfynn account'
        raise Exception(error)

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

    try:
        def calluploadfolder():
            global submitdataprogress
            global submitdatastatus
            submitdataprogress = "Started uploading to dataset %s \n" %(bfdataset)
            # return submitdataprogress
            myds = bf.get_dataset(bfdataset)
            myfolder = myds.name
            mypath = pathdataset
            upload_structured_file(myds, mypath, myfolder)
            submitdataprogress = submitdataprogress + ', ,' + "Success: dataset and associated files have been uploaded"
            submitdatastatus = 'Done'

        submitprintstatus = 'Uploading'
        t = threading.Thread(target=calluploadfolder)
        t.start()
    except Exception as e:
        submitdatastatus = 'Done'
        raise e


def submit_dataset_progress():
    """
    Creates global variables to help keep track of the dataset submission progress
    """
    global submitdataprogress
    global submitdatastatus
    global submitprintstatus
    global uploaded_file_size
    global total_file_size
    return (submitdataprogress, submitdatastatus, submitprintstatus, uploaded_file_size, total_file_size)



def bf_get_users(selected_bfaccount):
    """
    Function to get list of users belonging to the organization of
    the given Blackfynn account

    Input:
      selected_bfaccount (string): name of selected Blackfynn acccount
    Output:
        list_users : list of users (first name -- last name) associated with the organization of the
        selected Blackfynn account
    """
    try:
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
    except Exception as e:
        raise e


def bf_get_teams(selected_bfaccount):
    """
    Function to get list of teams belonging to the organization of
    the given Blackfynn account

    Input:
      selected_bfaccount (string): name of selected Blackfynn acccount
    Output:
        list_teams : list of teams (name) associated with the organization of the
        selected Blackfynn account
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

    Input:
        selected_bfaccount (string): name of selected Blackfynn acccount
        selected_bfdataset (string): name of selected Blackfynn dataset
    Output:
        list_permission (list): list of permission (first name -- last name -- role) associated with the
        selected dataset
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
        if c > 0:
            raise Exception(error)
        else:
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
                    list_dataset_permission_first_last_role.append('Team ' + team_name + ' , role: ' + team_role)

            # Organization permissions
            list_dataset_permission_organizations = bf._api._get('/datasets/' + str(selected_dataset_id) + '/collaborators/organizations')
            if type(list_dataset_permission_organizations) is dict:
                    organization_keys = list(list_dataset_permission_organizations.keys())
                    if 'role' in organization_keys:
                        organization_name = list_dataset_permission_organizations['name']
                        organization_role = list_dataset_permission_organizations['role']
                        list_dataset_permission_first_last_role.append('Organization ' + organization_name + ' , role: ' + organization_role)
            else:
                for i in range(len(list_dataset_permission_organizations)):
                    organization_keys = list(list_dataset_permission_organizations[i].keys())
                    if 'role' in organization_keys:
                        organization_name = list_dataset_permission_organizations[i]['name']
                        organization_role = list_dataset_permission_organizations[i]['role']
                        list_dataset_permission_first_last_role.append('Organization ' + organization_name + ' , role: ' + organization_role)

            return list_dataset_permission_first_last_role

    except Exception as e:
        raise e


def bf_add_permission(selected_bfaccount, selected_bfdataset, selected_user, selected_role):

    """
    Function to add/remove permission for a suser to a selected dataset

    Input:
        selected_bfaccount (string): name of selected Blackfynn acccount
        selected_bfdataset (string): name of selected Blackfynn dataset
        selected_user (string): name (first name -- last name) of selected Blackfynn user
        selected_role (string): desired role ('manager', 'viewer', 'editor', 'remove current permission')
    Output:
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

    if selected_role not in ['manager', 'viewer', 'editor', 'owner', 'remove current permission']:
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

            if (selected_role == 'remove current permission'):

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

    Input:
        selected_bfaccount (string): name of selected Blackfynn acccount
        selected_bfdataset (string): name of selected Blackfynn dataset
        selected_team (string): name of selected Blackfynn team
        selected_role (string): desired role ('manager', 'viewer', 'editor', 'remove current permission')
    Output:
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

    if selected_role not in ['manager', 'viewer', 'editor', 'remove current permission']:
        error = error + 'Error: Please select a valid role' + '<br>'
        c += 1

    if c > 0:
        raise Exception(error)
    else:
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

            if (selected_role == 'remove current permission'):

                bf._api.datasets._del('/' + str(selected_dataset_id) + '/collaborators/teams'.format(dataset_id = selected_dataset_id),
                              json={'id': selected_team_id})
                return "Permission removed for " + selected_team
            else:
                bf._api.datasets._put('/' + str(selected_dataset_id) + '/collaborators/teams'.format(dataset_id = selected_dataset_id),
                              json={'id': selected_team_id, 'role': selected_role})
                return "Permission " + "'" + selected_role + "' " +  " added for " + selected_team
        except Exception as e:
                raise e
