# -*- coding: utf-8 -*-

# python module for Software for Organizing Data Automatically (SODA)
import os ## Some functions are not available on all OS
import platform
from os import listdir, stat, makedirs, mkdir, walk
from os.path import isdir, isfile, join, splitext, getmtime, basename, normpath, exists, expanduser, split, dirname, getsize
import pandas as pd
from time import strftime, localtime
from shutil import copy2
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

### Global variables
curateprogress = ' '
curatestatus = ' '
curateprintstatus = ' '

userpath = expanduser("~")
configpath = join(userpath, '.blackfynn', 'config.ini')
submitdataprogress = ' '
submitdatastatus = ' '
submitprintstatus = ' '

### FEATURE #1: SPARC dataset organizer
# Organize dataset
def save_file_organization(jsonpath, jsondescription, pathsavefileorganization):
    """
    Associated with 'Save' button in 'Organize my dataset' section
    Saves the paths specified along with the description in a CSV file as a template for future use

    Input:
        jsonpath: paths of all files in the json object
        jsondescription: description associated with each file in json object
        pathsavefileorganization: destination path of saved template
    Action:
        Saves all the paths specified in a CSV file
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


compare = lambda x, y: collections.Counter(x) == collections.Counter(y)
def upload_file_organization(pathuploadfileorganization, headernames):
    """
    Associated with 'Upload' button
    Converts uploaded file template to a dictionary for viewing on UI

    Input:
        pathuploadfileorganization: path of saved template
        headernames: Folder names according to SPARC format
    Returns:
        mydict: Returns all folders and corresponding paths as a dictionary
    """
    try:
        csvsavepath = join(pathuploadfileorganization)
        df = pd.read_csv(csvsavepath)
        dfnan = df.isnull()
        mydict = {}
        dictkeys = df.columns
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


def preview_file_organization(jsonpath):
    """
    Associated with 'Preview' button on UI
    Creates a folder for preview and adds empty files but with same name as origin
    Opens the dialog box to showcase the files / folders added

    Input:
        jsonpath: json object containing all paths
    Action:
        Opens the dialog box at preview_path
    Returns:
        preview_path: path where the preview files are located
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
                preview_folder_structure(paths, join(preview_path))
            else:
                preview_folder_structure(paths, join(preview_path, i))
        open_file(preview_path)
        return preview_path
    except Exception as e:
        raise e


def open_file(file_path):
    """
    Opening folder on all platforms
    https://stackoverflow.com/questions/6631299/python-opening-a-folder-in-explorer-nautilus-mac-thingie

    Input:
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


def preview_folder_structure(paths, folder_path):
    """
    Creates folders and empty files from original 'paths' to the destination 'folder_path'

    Input:
        paths: Paths of all the files that need to be copied
        folder_path: Destination to which the files / folders need to be copied
    Action:
        Creates folders and empty files at the given 'folder_path'
    """
    for p in paths:
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
            preview_folder_structure(all_files_path, new_folder_path)
    return


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
        return
    except Exception as e:
        raise e


### FEATURE #2: SPARC metadata generator
def curate_dataset(pathdataset, createnewstatus, pathnewdataset, \
        manifeststatus, submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription, \
        subjectsstatus, pathsubjects, samplesstatus, pathsamples, jsonpath, jsondescription, modifyexistingstatus, bfdirectlystatus,
        alreadyorganizedstatus, organizedatasetstatus, newdatasetname):
    """
    Associated with 'Generate' button in the 'Generate dataset' section
    Checks validity of files / paths / folders and then generates the files and folders as requested along with progress status
    """
    global curateprogress
    global curatestatus
    global curateprintstatus
    curateprogress = ' '
    curatestatus = ''
    curateprintstatus = ' '
    error, c = '', 0

    if alreadyorganizedstatus:
        if not isdir(pathdataset):
            curatestatus = 'Done'
            raise Exception('Error: Please select a valid dataset folder')

    if createnewstatus:
        pathnewdataset = pathnewdataset.strip()
        newdatasetname = newdatasetname.strip()
        if not isdir(pathnewdataset):
            curatestatus = 'Done'
            raise Exception('Error: Please select a valid folder for new dataset')
        if (check_forbidden_characters(newdatasetname) or not newdatasetname):
            curatestatus = 'Done'
            raise Exception('Error: Please enter a valid name for new dataset folder')

    if submissionstatus:
        if not isfile(pathsubmission):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for submission file\n'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathsubmission))[0] != 'submission':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for submission file\n'
            c += 1

    if datasetdescriptionstatus:
        if not isfile(pathdescription):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for dataset description file\n'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathdescription))[0] != 'dataset_description':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for dataset_description file\n'
            c += 1

    if subjectsstatus:
        if not isfile(pathsubjects):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for subjects file\n'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathsubjects))[0] != 'subjects':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for subjects file\n'
            c += 1

    if samplesstatus:
        if not isfile(pathsamples):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for samples file\n'
            c += 1
        # Adding check for correct file name
        elif splitext(basename(pathsamples))[0] != 'samples':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for samples file\n'
            c += 1
    if c > 0:
        raise Exception(error)

    # check if path in jsonpath are valid
    error, c = '', 0
    for folders in jsonpath.keys():
        if jsonpath[folders] != []:
            for path in jsonpath[folders]:
                if not exists(path):
                    c += 1
                    error = error + path + ' does not exist \n'

    if c > 0:
        error = error + '\nPlease remove invalid paths'
        curatestatus = 'Done'
        raise Exception(error)

    # get list of file in pathnewdataset
    # see if any of submission, dataset_description, subjects, samples exist
    # Show error 'File xxx already exists at target location: either delete or select "None" in the SODA interface'
    if modifyexistingstatus:
        error, c = '', 0
        namefiles = [f for f in listdir(pathdataset) if isfile(join(pathdataset, f))]
        if 'submission.xlsx' in namefiles and submissionstatus:
            error = error + 'submission file already present\n'
            c += 1
        if 'dataset_description.xlsx' in namefiles and datasetdescriptionstatus:
            error = error + 'dataset_description file already present\n'
            c += 1
        if  'samples.xlsx' in namefiles and samplesstatus:
            error = error + 'samples file already present\n'
            c += 1
        if  'subjects.xlsx' in namefiles and subjectsstatus:
            error = error + 'subjects file already present\n'
            c += 1

        if c > 0:
            error = error + '\nError: Either delete or select "None" in the SODA interface'
            curatestatus = 'Done'
            raise Exception(error)

        # In case of no errors, code-bloack below will execute which will start the data preparation process
        else:
            try:
                curateprogress = 'Started'
                curateprintstatus = 'Curating'

                curateprogress = curateprogress + ', ,' + "New dataset not requested"

                if manifeststatus:
                    create_manifest_with_description(pathdataset, jsonpath, jsondescription)
                    curateprogress = curateprogress + ', ,' + 'Manifest created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Manifest not requested'

                if submissionstatus:
                    copyfile(pathsubmission, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Submission file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Submission file not requested'

                if datasetdescriptionstatus:
                    copyfile(pathdescription, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Dataset description file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Dataset description file not requested'

                if subjectsstatus:
                    copyfile(pathsubjects, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Subjects file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Subjects file not requested'

                if samplesstatus:
                    copyfile(pathsamples, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Samples file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Samples file not requested'

                curateprogress = curateprogress + ', ,' + 'Success: COMPLETED!'
                curatestatus = 'Done'

            except Exception as e:
                curatestatus = 'Done'
                raise e

    elif createnewstatus:
        try:
            pathnewdatasetfolder = join(pathnewdataset, newdatasetname)
        except Exception as e:
            curatestatus = 'Done'
            raise e
        try:
            pathnewdatasetfolder  = return_new_path(pathnewdatasetfolder)
            curateprogress = 'Started'
            curateprintstatus = 'Curating'

            pathdataset = pathnewdatasetfolder
            mkdir(pathdataset)

            create_dataset(jsonpath, pathdataset)
            curateprogress = curateprogress + ', ,' + 'New dataset created'

            if manifeststatus:
                create_manifest_with_description(pathdataset, jsonpath, jsondescription)
                curateprogress = curateprogress + ', ,' + 'Manifest created'
            else:
                curateprogress = curateprogress + ', ,' + 'Manifest not requested'

            if submissionstatus:
                copyfile(pathsubmission, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Submission file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Submission file not requested'

            if datasetdescriptionstatus:
                copyfile(pathdescription, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Dataset description file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Dataset description file not requested'

            if subjectsstatus:
                copyfile(pathsubjects, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Subjects file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Subjects file not requested'

            if samplesstatus:
                copyfile(pathsamples, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Samples file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Samples file not requested'

            curateprogress = curateprogress + ', ,' + 'Success: COMPLETED!'
            curatestatus = 'Done'

        except Exception as e:
            curatestatus = 'Done'
            raise e


def curate_dataset_progress():
    """
    Creates global variables to help keep track of the progress
    """
    global curateprogress
    global curatestatus
    global curateprintstatus
    return (curateprogress, curatestatus, curateprintstatus)


def create_manifest_with_description(datasetpath, jsonpath, jsondescription):
    """
    Creates manifest files with the description specified

    Input:
        datasetpath: original path of the dataset
        jsonpath: all paths in json format
        jsondescription: Description associated with each path
    Action:
        Creates manifest files in Excel format
    """
    # Get the names of all the subfolder in the dataset
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
            manifestexists = join(folderpath, 'manifest.xlsx')

            countpath = -1
            for pathname in allfiles:
                countpath += 1
                if basename(pathname) == 'manifest.xlsx':
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
                    if not fileextension:  #if empty (happens for Readme files)
                        fileextension = 'None'
                    filetype.append(fileextension)

            df['filename'] = filename
            df['timestamp'] = timestamp
            df['file type'] = filetype
            df['description'] = filedescription

            # Save manifest as Excel sheet
            manifestfile = join(folderpath, 'manifest.xlsx')
            df.to_excel(manifestfile, index=None, header=True)


def create_dataset(jsonpath, pathdataset):
    """
    Associated with 'Create new dataset locally' button
    Creates folders and files from paths specified in json object TO the destination path specified

    Input:
        jsonpath: JSON object of all paths from origin
        pathdataset: destination path for creating a new dataset as specified
    Action:
        Creates the folders and files specified
    """
    try:
        mydict = jsonpath
        userpath = expanduser("~")
        preview_path = pathdataset
        folderrequired = []

        for i in mydict.keys():
            if mydict[i] != []:
                folderrequired.append(i)
                if i != 'main':
                    makedirs(join(preview_path, i))

        for i in folderrequired:
            for path in mydict[i]:
                if (i == 'main'):
                    create_new_file(path, join(pathdataset))
                else:
                    create_new_file(path, join(pathdataset, i))
    except Exception as e:
        raise e


def create_new_file(path, folder_path):
    """
    Helper function to copy all files from source ('path') to destination ('folder_path') in the same folder structure
    """
    if isfile(path):
        copyfile(path, folder_path)
    elif isdir(path):
        foldername = basename(path)
        copytree(path, join(folder_path, foldername))


def return_new_path(topath):
    """
    This function checks if the folder already exists and in such cases, appends the name with (2) or (3) etc.

    Input:
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


def copytree(src, dst, symlinks=False, ignore=None):
    """
    Preserves the original folder structure by creating corresponding folders in destination path

    Input:
        src: Path of the source folder
        dst: Path of the destination folder
    Action:
        Creates folders in the original folder structure
    """
    if not exists(dst):
        makedirs(dst)
    for item in listdir(src):
        s = join(src, item)
        d = join(dst, item)
        if isdir(s):
            copytree(s, d, symlinks, ignore)
        else:
            if not exists(d) or stat(s).st_mtime - stat(d).st_mtime > 1:
                copy2(s, d)


def copyfile(src, dst):
    """
    Wrapper function to copy files from source path ('src') to destination ('dst')
    """
    copy2(src, dst)


def check_forbidden_characters(my_string):
    """
    Check for forbidden characters in file/folder name
    Output:
        False: no forbidden character
        True: presence of forbidden character(s)
    """
    regex = re.compile('[@!#$%^&*()<>?/\|}{~:]')
    if(regex.search(my_string) == None):
        return False
    else:
        return True

### FEATURE #4: SODA Blackfynn interface
# Log in to Blackfynn
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


# Visualize existing dataset in the selected account
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

# Visualize existing dataset in the selected account
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


# Add new empty dataset folder
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


# Submit dataset to selected account
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
            myds.upload(filepath)
            uploaded_file_size += getsize(filepath)
            submitdataprogress = submitdataprogress + ',' + " uploaded"
        else:
            submitdataprogress = submitdataprogress + ', ,' +"Creating folder " + f
            mybffolder = myds.create_collection(f)
            myfolderpath = join(mypath, f)
            upload_structured_file(mybffolder, myfolderpath, f)


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


def folder_size(path):
    """
    Returns total size of a folder
    """
    total_size = 0
    start_path = '.'  # To get size of current directory
    for path, dirs, files in walk(path):
        for f in files:
            fp = join(path, f)
            total_size += getsize(fp)
    return total_size


# Share dataset with Curation Team
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

# Share dataset with Curation Team
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
    Function to add permission to a selected dataset

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
                    else:
                        c += 1
                #check if selected user is owner, dataset permission cannot be changed for owner
                if user_id == selected_user_id:
                    if role == 'owner':
                        raise Exception('Error: owner permission cannot be changed')
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
                # raise error
            else:
                bf._api.datasets._put('/' + str(selected_dataset_id) + '/collaborators/users'.format(dataset_id = selected_dataset_id),
                              json={'id': selected_user_id, 'role': selected_role})
                return "Permission " + "'" + selected_role + "' " +  " added for " + selected_user
        except Exception as e:
                raise e

def bf_add_permission_team(selected_bfaccount, selected_bfdataset, selected_team, selected_role):

    """
    Function to add permission to a selected dataset

    Input:
        selected_bfaccount (string): name of selected Blackfynn acccount
        selected_bfdataset (string): name of selected Blackfynn dataset
        selected_team (string): name (first name -- last name) of selected Blackfynn user
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