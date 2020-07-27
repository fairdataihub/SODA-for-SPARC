'''
This code validates the proposed folder structure and files
against the schema required by the SPARC curation team.
Note that since this code is separate from the code used
the the SPARC curation team that automatically checks similar
items, code passing this validator may not pass the official
SPARC validator code.  The converse is not true however.
To get a list of items that are checked, visit our dedicated page:
https://github.com/bvhpatel/SODA/wiki/Validate-dataset/_edit#about-the-validator

Bhavesh Patel
California Medical Innovations Institute
bpatel@acalmi2.org

Karl G. Helmer
Martinos Center for Biomedical Imaging
Massachusetts General Hospital
helmer@nmr.mgh.harvard.edu
'''

import os
import chardet #utf8 check for csv
import pandas as pd
import numpy as np
from os.path import getsize

class DictValidator:

    #High level folder
    reqFolderNames = ['primary']
    optFolderNames = [ 'code', 'derivative', 'docs', 'protocol', 'source']

    # High level metadata files
    reqMetadataFileNames = ['submission', 'dataset_description', 'subjects', 'README']
    optMetadataFileNames = ['samples', 'CHANGES']
    manifestFileName = 'manifest'
    metadataFileFormats1 = ['.xlsx','.csv', '.json']
    metadataFileFormats2 = ['.txt']

    # submission file
    reqSubmissionHeaders = ['Submission Item', 'Value']
    optSubmissionHeaders = ['Definition']
    submissionCol0 = ['SPARC Award number', 'Milestone achieved', 'Milestone completion date']

    #dataset_description file
    # note: the capitalizations below are inconsistent, but are what is given in SPARC_FAIR-Folder_Structure V1.2.pdf
    reqddHeaders = ['Metadata element', 'Value']
    optddHeaders = ['Description', 'Example']
    for i in range(2,101):
        el = 'Value '+ str(i)
        optddHeaders.append(el)

    ddCol0 = ['Name', 'Description', 'Keywords', 'Contributors', 'Contributor ORCID ID',
                   'Contributor Affiliation', 'Contributor Role',
                   'Is Contact Person', 'Acknowledgements', 'Funding', 'Originating Article DOI',
                   'Protocol URL or DOI', 'Additional Links', 'Link Description', 'Number of subjects',
                   'Number of samples', 'Completeness of data set', 'Parent dataset ID', 'Title for complete data set',
                   'Metadata Version DO NOT CHANGE']

    ddCol0Req = ['Name', 'Description', 'Keywords', 'Contributors', 'Contributor ORCID ID',
                   'Contributor Affiliation', 'Contributor Role',
                   'Is Contact Person',  'Funding',
                   'Protocol URL or DOI', 'Number of subjects',
                   'Number of samples', 'Metadata Version DO NOT CHANGE']

    ddCol0Opt = ['Acknowledgements', 'Originating Article DOI', 'Additional Links', 'Link Description',
                 'Completeness of data set', 'Parent dataset ID', 'Title for complete data set']


    contributorRoles = ['PrincipleInvestigator', 'Creator', 'CoInvestigator', 'ContactPerson', 'DataCollector',
                        'DataCurator', 'DataManager', 'Distributor', 'Editor', 'Producer', 'ProjectLeader',
                        'ProjectManager', 'ProjectMember', 'RelatedPerson', 'Researcher', 'ResearchGroup',
                        'Sponsor', 'Supervisor', 'WorkPackageLeader', 'Other']

    contactPersonOptions = ["Yes", "No"]

    completnessInfo = ['hasNext', 'hasChildren']

    #subjects file
    subjCols = ['subject_id', 'pool_id', 'experimental group', 'age', 'sex', 'species', 'strain', 'Organism RRID']

    #samples file
    samCols = ['subject_id', 'sample_id', 'wasDerivedFromSample', 'pool_id', 'experimental group']

    #none terms
    noneTerms = ['None', 'NONE', 'none', 'N/A', 'n/a', 'NA', 'na', 'Not applicable', 'Not Applicable']

    empty = 'empty'

    metadataVersion = '1.2.3'

    def __init__(self):
        self.fatal = []
        self.warnings = []
        self.passes = []

    def check_high_level_folder_structure(self, jsonStruct):
        primaryf = 0
        sparcf = 0
        emptyf = 0
        nonstandardf = 0
        nonStandardFolders = ""
        emptyFolders = ""

        # get all high-level files/folders
        allContents = jsonStruct.keys()
        allContents = [ x for x in allContents if x!='main' ]
        for c in allContents:
            if c == self.reqFolderNames[0]: #primary folder
                primaryf = 1
                pContents = jsonStruct[c]
                if len(pContents) == 0: #check primary empty
                    emptyf = 1
                    emptyFolders += " " + c + ","
            elif c in self.optFolderNames:   #check for optional folders
                sparcf = 1
                pContents = jsonStruct[c]
                if len(pContents) == 0: #check optional folder empty
                    emptyf = 1
                    emptyFolders += " " + c + ","
            else:
                nonstandardf = 1
                nonStandardFolders += " " + c + ","

        check1 = "All folders are SPARC standard folders"
        check1f = "Only SPARC standard folders ('code', 'derivative', 'docs', 'primary', 'protocol', and/or 'source', all lowercase) are allowed. The following folder(s) must be removed:"

        check2 = "A 'primary' folder is included"
        check2f = "A non-empty 'primary' folder is required in all datasets, make sure it is included"

        check3 = "All SPARC folders are non-empty"
        check3f = "No empty SPARC folder should be included. Populate or remove the following folder(s):"

        if nonstandardf == 1:
            self.fatal.append(check1 + "--" + check1f + nonStandardFolders[:-1])
        else:
            if primaryf == 1 and sparcf == 1:
                self.passes.append(check1)

        if not primaryf:
            self.fatal.append(check2 + "--" + check2f)
        else:
            self.passes.append(check2)

        if emptyf == 1:
            self.fatal.append(check3 + "--" + check3f + emptyFolders[:-1])
        else:
            if primaryf == 1 and sparcf == 1:
                self.passes.append(check3)

    def check_high_level_metadata_files(self, jsonStruct):
        nofiles = 0
        subm = 0
        subm0kb = 0
        dd = 0
        dd0kb = 0
        subj = 0
        subj0kb = 0
        sam = 0
        sam0kb = 0
        rm = 0
        rm0kb = 0
        chg = 0
        csvf = 0
        nonstand = 0
        nonStandardFiles = ""
        nonUTF8 = 0
        nonUTF8Files = ""
        nonu = 0
        nonUniqueFiles = ""

        #check for req files at the root level
        allFiles = jsonStruct['main']
        if len(allFiles) == 0:
            nofiles = 1
        else:
            for c in allFiles:
                filePath = c
                fullFileName = os.path.basename(c)
                cname = os.path.splitext(fullFileName)[0]
                extension = os.path.splitext(fullFileName)[1]

                if cname == self.reqMetadataFileNames[0]: #submission file
                    if extension in self.metadataFileFormats1: #if in xlsx, csv, or json format
                        subm += 1
                        if getsize(filePath)>0:
                            print('Size sub', getsize(filePath))
                            if extension in self.metadataFileFormats1[1]:#if csv
                                csvf = 1
                                UTF8status = self.check_csv_utf8(filePath)
                                if UTF8status == 0:
                                   nonUTF8 = 1
                                   nonUTF8Files = " " + c + ","
                        else:
                           subm0kb = 1 
                    else:
                        nonstand = 1
                        nonStandardFiles += " " + c + ","

                elif cname == self.reqMetadataFileNames[1]: #dataset_description file
                    if extension in self.metadataFileFormats1: #if in xlsx, csv, or json format
                        dd += 1
                        if getsize(filePath)>0:
                            print('Size dd', getsize(filePath))
                            if extension in self.metadataFileFormats1[1]: #if csv
                                csvf = 1
                                UTF8status = self.check_csv_utf8(filePath)
                                if UTF8status == 0:
                                   nonUTF8 = 1
                                   nonUTF8Files = " " + c + ","
                        else:
                           dd0kb = 1
                    else:
                        nonstand = 1
                        nonStandardFiles += " " + c + ","

                elif cname == self.reqMetadataFileNames[2]: #subjects file
                    if extension in self.metadataFileFormats1: #if in xlsx, csv, or json format
                        subj += 1
                        if getsize(filePath)>0:
                            print('Size subj', getsize(filePath))
                            if extension in self.metadataFileFormats1[1]: #if csv
                                csvf = 1
                                UTF8status = self.check_csv_utf8(filePath)
                                if UTF8status == 0:
                                   nonUTF8 = 1
                                   nonUTF8Files = " " + c + ","
                        else:
                           subj0kb = 1
                    else: #if not in xlsx, csv, or json format
                        nonstand = 1
                        nonStandardFiles += " " + c + ","

                elif cname == self.optMetadataFileNames[0]: #samples file
                    if extension in self.metadataFileFormats1: #if in xlsx, csv, or json format
                        sam += 1
                        if getsize(filePath)>0:
                            print('Size sam', getsize(filePath))
                            if extension in self.metadataFileFormats1[1]: #if csv
                                csvf = 1
                                UTF8status = self.check_csv_utf8(filePath)
                                if UTF8status == 0:
                                   nonUTF8 = 1
                                   nonUTF8Files = " " + c + ","
                        else:
                           sam0kb = 1
                    else:
                        nonstand = 1
                        nonStandardFiles += " " + c + ","

                elif (fullFileName == self.reqMetadataFileNames[3] + self.metadataFileFormats2[0]): #README.txt file
                    if getsize(filePath)>0:
                        rm = 1
                    else:
                        rm0kb = 1

                elif (fullFileName == self.optMetadataFileNames[1] + self.metadataFileFormats2[0]): #CHANGES.txt file
                    chg = 1

                else:
                    nonstand = 1
                    nonStandardFiles += " " + c + ","

            #check for uniqueness
            if subm>1:
                cname = self.reqMetadataFileNames[0]
                nonu = 1
                nonUniqueFiles = " " + cname + ","
            if dd>1:
                cname = self.reqMetadataFileNames[1]
                nonu = 1
                nonUniqueFiles = " " + cname + ","
            if subj>1:
                cname = self.reqMetadataFileNames[2]
                nonu = 1
                nonUniqueFiles = " " + cname + ","
            if sam>1:
                cname = self.reqMetadataFileNames[3]
                nonu = 1
                nonUniqueFiles = " " + cname + ","


        check1 = "All files are SPARC metadata files"
        check1f = "Only SPARC metadata files are allowed in the high-level dataset folder. The following file(s) must be removed:"

        check2 = "A non-empty 'submission' metadata file is included in either xlsx, csv, or json format"
        check2f = "This is a mandatory file for ALL SPARC datasets. It must be included and be in the correct format. You can prepare it in the 'Prepare Metadata' section of SODA."
        check2f2 =  "Your file is empty (0 kb). Ensure that the required content is included in the file. You can prepare it in the 'Prepare Metadata' section of SODA."
        
        check3 = "A 'dataset_description' metadata file is included in either xlsx, csv, or json format"
        check3f = "This is a mandatory file for ALL SPARC datasets. It must be included and be in the correct format. You can prepare it in the 'Prepare Metadata' section of SODA."
        check3f2 =  "Your file is empty (0 kb). Ensure that the required content is included in the file. You can prepare it in the 'Prepare Metadata' section of SODA."
        
        check4 = "A 'subjects' metadata file is included in either xlsx, csv, or json format"
        check4f = "This is a mandatory file for ALL SPARC datasets. It must be included and be in the correct format."
        check4f2 =  "Your file is empty (0 kb). Ensure that the required content is included in the file."
        
        check5 = "A 'samples' metadata file is included in either xlsx, csv, or json format"
        check5f = "This is NOT a mandatory file but must be included (and be in the correct format) if your study includes samples (e.g., tissue slices). "
        check5f2 =  "Your file is empty (0 kb). Ensure that the required content is included in the file."
        
        check6 = "A 'README' (all uppercase) metadata file is included in txt format"
        check6f = "This is NOT a mandatory file but suggested for all SPARC datasets. If included, it must be in the txt format."
        check6f2 =  "Your file is empty (0 kb). This is not a mandatory file but if included, ensure that the required content is included in the file."
        
        check7 = "All csv metadata files are UTF-8 encoded"
        check7f = "As per requirement from the SPARC Curation Team, please change the csv encoding format to UTF-8 for the following metadata files: "

        check8 = "All metadata files are unique"
        check8f = "Each metadata file should only be included once. The following metadata files are included more than once:"

        if nofiles == 0:
            if  nonstand == 1:
                self.fatal.append(check1 + "--" + check1f + nonStandardFiles[:-1])
            else:
                self.passes.append(check1)

        if subm == 1:
            if subm0kb == 1:
                subm = 0
                self.fatal.append(check2 + "--" + check2f2)
            else:
                self.passes.append(check2) 
        elif subm == 0:
            self.fatal.append(check2 + "--" + check2f)
        
        if dd == 1:
            if dd0kb == 1:
                dd = 0
                self.fatal.append(check3 + "--" + check3f2)
            else:
                self.passes.append(check3) 
        elif dd == 0:
            self.fatal.append(check3 + "--" + check3f)
            
        if subj == 1:
            if subj0kb == 1:
                subj = 0
                self.fatal.append(check4 + "--" + check4f2)
            else:
                self.passes.append(check4) 
        elif subj == 0:
            self.fatal.append(check4 + "--" + check4f)
            
        if sam == 1:
            if sam0kb == 1:
                sam = 0
                self.fatal.append(check5 + "--" + check5f2)
            else:
                self.passes.append(check5) 
        elif sam == 0:
            self.fatal.append(check5 + "--" + check5f)
  
        if not rm:
            if rm0kb == 1:
                self.fatal.append(check6 + "--" + check6f2)
            else:
                self.warnings.append(check6 + "--" + check6f)
        else:
            self.passes.append(check6)

        if csvf == 1:
            if nonUTF8 == 1:
                self.fatal.append(check7 + "--" + check7f + nonUTF8Files[:-1])
            else:
                self.passes.append(check7)

        if nofiles == 0:
            if nonu == 1:
                self.fatal.append(check8 + "--" + check8f + nonUniqueFiles[:-1])
            else:
                self.passes.append(check8)
                
        print('SUBM', subm)

        return subm, dd, subj, sam


    def check_empty_folders(self, jsonStruct):
    # detects empty folders if they exist, return a flag
        emptyFolderSearch = 0
        emptyFolderList = ""
        nonExistFolderSearch = 0
        nonExistFolderList = ""

        for folders in jsonStruct.keys():
            if len(jsonStruct[folders]) != 0:
                for mainPath in jsonStruct[folders]:
                    if os.path.exists(mainPath):
                        if os.path.isdir(mainPath):
                            pathContent = os.listdir(mainPath)
                            if len(pathContent) == 0:
                                emptyFolderSearch = 1
                                emptyFolderList += " " + mainPath + ","
                            else:
                                for root, dirs, files in os.walk(mainPath):
                                    for d in dirs:
                                        dp = os.path.join(root,d)
                                        pathContent = os.listdir(dp)
                                        if len(pathContent) == 0:
                                            emptyFolderSearch = 1
                                            emptyFolderList += " " + dp + ","
                    else:
                        nonExistFolderSearch = 1
                        nonExistFolderList += " " + mainPath + ","

        check1 = "All sub-folders are non-empty"
        check1f = "Empty folders MUST not be included in your dataset. The following empty folder(s) must be removed:"

        check2 = "All folder paths exist"
        check2f = "The following folder path(s) are non-existent and must be removed: "

        if emptyFolderSearch == 0:
            self.passes.append(check1)
        else:
            self.fatal.append(check1 + '--' + check1f + emptyFolderList[:-1])

        if nonExistFolderSearch == 1:
            self.fatal.append(check2 + '--' + check2f + nonExistFolderList[:-1])


    def check_empty_files(self, jsonStruct):
    # detects empty files if they exist, return a flag
        emptyFileSearch = 0
        emptyFileList = ""
        nonExistFileSearch = 0
        nonExistFileList = ""

        for folders in jsonStruct.keys():
            if len(jsonStruct[folders]) != 0:
                for mainPath in jsonStruct[folders]:
                    if os.path.exists(mainPath):
                        if os.path.isfile(mainPath):
                            fileSize = os.path.getsize(mainPath)
                            if fileSize == 0:
                                emptyFileSearch = 1
                                emptyFileList += " " + mainPath + ","
                        else:
                            for root, dirs, files in os.walk(mainPath):
                                for f in files:
                                    fp = os.path.join(root,f)
                                    fileSize = os.path.getsize(fp)
                                    if fileSize == 0:
                                        emptyFileSearch = 1
                                        emptyFileList += " " + fp + ","
                    else:
                        nonExistFileSearch = 1
                        nonExistFileList += " " + mainPath + ","

        check1 = "No empty files are included"
        check1f = "The following empty file(s) must be removed or corrected:"

        check2 = "All file paths exist"
        check2f = "The following file path(s) are non-existent and must be removed: "

        if emptyFileSearch == 0:
            self.passes.append(check1)
        else:
            self.fatal.append(check1 + '--' + check1f + emptyFileList[:-1])

        if nonExistFileSearch == 1:
            self.fatal.append(check2 + '--' + check2f + nonExistFolderList[:-1])

    def check_ds_store(self, jsonStruct):
    # detects the presence of a DS.STORE file, "1" means the file exists
        # detects empty files if they exist, return a flag
        DS_STORESearch = 0
        DS_STOREList = ""

        for folders in jsonStruct.keys():
            if len(jsonStruct[folders]) != 0:
                for mainPath in jsonStruct[folders]:
                    if os.path.exists(mainPath):
                        if os.path.isfile(mainPath):
                            fullName = os.path.basename(mainPath)
                            if fullName == 'DS.STORE':
                                DS_STORESearch = 1
                                DS_STOREList += " " + mainPath + ","
                        else:
                            for root, dirs, files in os.walk(mainPath):
                                for f in files:
                                    fp = os.path.join(root,f)
                                    fullName = os.path.basename(mainPath)
                                    if fullName == 'DS.STORE':
                                        DS_STORESearch = 1
                                        DS_STOREList += " " + fp + ","

        check1 = "No DS.STORE files are included"
        check1f = "The following DS.STORE file(s) must be removed:"

        if DS_STORESearch == 0:
            self.passes.append(check1)
        else:
            self.fatal.append(check1 + '--' + check1f + DS_STOREList[:-1])


    def check_csv_utf8(self, fPathList):
        # checks that all csv files are UTF-8 encoded
        # since looping through the files a "0" means that at least
        # one file was not UTF-8, and which one(s) is/are recorded
        # in the warnings.
        utf8Check = 1

        f = fPathList
        fileNamePath, fileExtension = os.path.splitext(f)

        if fileExtension == ".csv":
            # this is another way to do it, but it passes test files
            # that chardet says are ascii, rather than utf-8
            #try:
            #    fd=open(f, encoding='utf-8', errors='strict')
            #except UnicodeDecodeError:
            #    utf8Check = 0
            #    warnings.append("The file {} is not encoded using UTF-8".format(f))

            # open the file as binary; join some lines together and pass to chardet
            # chardet returns a dictionary with the key <encoding> giving what we want
            with open(f, 'rb') as fd:
                # Join binary lines for specified number of lines;
                rawdata = b''.join([fd.readline() for _ in range(3)])
                if 'UTF-8' not in chardet.detect(rawdata)['encoding']:
                        utf8Check = 0

        #if utf8Check == 1:
         #   self.passes.append("All .csv files in this dataset are UTF-8 encoded.")

        return utf8Check

    def check_manifest_file_included(self, jsonStruct):
        # checks if a manifest file is included in all folders with files or in all high-level SPARC folders
        mnf_style = 0 # 0 = none; 1 if manifest file is included in all folders with files; 2 if manifest file is included in all high-level SPARC folders

        mnf_hlf = 0
        mnf_slf = 0

        msng_hlf = 0
        missingHLF = ""
        msng_slf = 0
        missingSLF = ""

        not_req_slf = 0
        notRequiredSLF = ""

        multiple_mnf_hlf = 0
        multipleListHLF = ""
        multiple_mnf_slf = 0
        multipleListSLF = ""

        manifest_allowed_name = []
        for extension in self.metadataFileFormats1:
            manifest_allowed_name.append(self.manifestFileName + extension)

        # check for manifest files in any of the allowable format
        allContents = jsonStruct.keys()
        allContents = [ x for x in allContents if x!='main' ]
        for folder in allContents:
            if len(jsonStruct[folder]) != 0:
                hl_file = 0
                num_manifest_hlf = 0
                for mainPath in jsonStruct[folder]:
                    if os.path.exists(mainPath):
                        if os.path.isdir(mainPath):
                            pathContent = os.listdir(mainPath)
                            if len(pathContent) != 0:
                                # check manifest file in sub-level folders
                                for root, dirs, files in os.walk(mainPath):
                                    if len(files) > 0 :
                                        num_manifest = 0
                                        num_file = 0
                                        for f in files:
                                            if f in manifest_allowed_name:
                                                mnf_slf += 1
                                                num_manifest += 1
                                        else:
                                            fname = os.path.splitext(f)[0]
                                            if fname != 'README':
                                                num_file += 1
                                        if num_file == 0:
                                            if num_manifest>0:
                                               notRequiredSLF = " " +  str(root) + ","
                                        if num_file > 0:
                                            if num_manifest == 0:
                                                missingSLF += " " + str(root) + ","
                                            elif num_manifest > 1:
                                                multiple_mnf_slf += 1
                                                multipleListSLF += " " + str(root) + ","
                        else:
                            # check for manifest file in high-level SPARC folder
                            fullFileName = os.path.basename(mainPath)
                            if fullFileName in manifest_allowed_name:
                                mnf_hlf += 1
                                num_manifest_hlf += 1
                            else:
                                fname = os.path.splitext(fullFileName)[0]
                                if fname != 'README':
                                    hl_file += 1

                if num_manifest_hlf == 0:
                    msng_hlf += 1
                    missingHLF += " " + str(folder) + ","
                    if hl_file>0:
                        msng_slf += 1
                        missingSLF += " " + str(folder) + ","
                elif num_manifest_hlf == 1:
                    if hl_file == 0:
                        not_req_slf += 1
                        notRequiredSLF += " " + str(folder) + ","
                elif num_manifest_hlf > 1:
                    multiple_mnf_hlf += 1
                    multipleListHLF += " " + str(folder) + ","
                    if hl_file>0:
                        multiple_mnf_slf += 1
                        multipleListSLF += " " + str(folder) + ","


        check1 = "Manifest files in xlsx, csv, or json format are included in EITHER all folders with at least one file or all high-level SPARC folders only"

        check1f = "Please include manifest files according to one of the two allowable configurations. They can be generated automatically from the 'Prepare Dataset' section of SODA."

        check1c1 = "It is likely you chose the 'all folders with at least one file' option"
        check1c2 = "It is likely you chose the 'all high-level SPARC folders only' option"

        check1f2 = "A manifest is missing in the following folders: "

        check1f3 = "The manifest must be removed from the following folder(s) since they contain only folders or a 'README' file: "
        check1f4 = "Multiple manifest files are included in the following folder(s): "

        user_msg = check1
        if mnf_hlf == 0 and mnf_slf == 0:
            user_msg += '--' + check1f
            self.fatal.append(user_msg)

        elif mnf_slf>0:
            mnf_style = 1
            user_msg += '--' + check1c1
            if msng_slf == 0 and not_req_slf == 0 and multiple_mnf_slf == 0:
                self.passes.append(user_msg)
            else:
                if msng_slf>0:
                    user_msg += '--' + check1f2 + missingSLF[:-1]
                if not_req_slf > 0:
                    user_msg += '--' + check1f3 + notRequiredSLF[:-1]
                if multiple_mnf_slf > 0:
                    user_msg += '--' + check1f4 + multipleListSLF[:-1]
                self.fatal.append(user_msg)

        elif mnf_hlf>0:
            mnf_style = 2
            user_msg += '--' + check1c2
            if msng_hlf == 0 and multiple_mnf_hlf == 0:
                self.passes.append(user_msg)
            else:
                if msng_hlf>0:
                    user_msg += '--' + check1f2 + missingHLF[:-1]
                if multiple_mnf_hlf > 0:
                    user_msg += '--' + check1f4 + multipleListHLF[:-1]
                self.fatal.append(user_msg)

        return mnf_style

    def check_submission_file(self, submFilePath):
        firsth = 0
        valueh = 0
        nonstandardh = 0
        nonStandardHeaders = ""
        c0 = 0
        v = 1

        fullName = os.path.basename(submFilePath)

        submissionName = self.reqMetadataFileNames[0]
        expectedSubmissionFullName = [(submissionName + i) for i in self.metadataFileFormats1]

        if fullName not in expectedSubmissionFullName:
            raise Exception("Please select a valid submission file")

        if os.path.isfile(submFilePath):
            extension = os.path.splitext(fullName)[1]
            if extension == '.csv':

                df = pd.read_csv(submFilePath)
            elif extension == '.xlsx':
                df = pd.read_excel(submFilePath)
            elif extension == '.json':
                self.warnings.append("The SODA validator currently doesn't support the json format so your file cannot be validated. This will be implemented in a future release.")
                return

            # check that first header is "Submission item"
            fileHeaders = list(df)
            if fileHeaders[0] == self.reqSubmissionHeaders[0]:
                firsth = 1

                #check that first column matches with template
                if df[self.reqSubmissionHeaders[0]].tolist() == self.submissionCol0:
                    c0 = 1

            # check that 'Value' header is included
            if self.reqSubmissionHeaders[1] in fileHeaders:
                valueh = 1

                #check that the value column does't contain any NaN or empty elements
                if df[self.reqSubmissionHeaders[1]].isnull().any():
                    v = 0

                valueCol = df[self.reqSubmissionHeaders[1]].values
                valueColMod = []
                for x in valueCol:
                    if type(x) == str:
                        valueColMod.append(x.strip())
                    else:
                        valueColMod.append(x)
                if "" in valueCol:
                    v = 0

            #check that the only other header is "Definition"
            for header in fileHeaders:
                if header not in (self.reqSubmissionHeaders + self.optSubmissionHeaders):
                    nonstandardh = 1
                    nonStandardHeaders += " " + header + ","

        check1 = "The submission file format matches with the template provided by the SPARC Curation Team"
        check1f0 = "The above format error(s) must be corrected before further check of the file"
        check1f = "The first header (in cell A1) MUST be " +  self.reqSubmissionHeaders[0]
        check1f2 = "The first column items do not match exactly with the template, please correct them."

        check1f3 = "A " + self.reqSubmissionHeaders[1] + " header must be included"

        check1f4 = "Only the following headers are expected: " + str(self.reqSubmissionHeaders[0]) +  \
        str(self.reqSubmissionHeaders[1]) + "," + str(self.optSubmissionHeaders[0]) + \
        ". Remove the following non-standard headers: "

        check2 = "All cells in the 'Value' column are populated"
        check2f = "One or multiple cells from the 'Value' column are empty. All three of them must be populated."

        if firsth==1 and c0==1 and valueh==1 and nonstandardh==0:
            self.passes.append(check1)
            if v == 1:
                self.passes.append(check2)
            else:
                self.fatal.append(check2 + '--' + check2f)
        else:
            user_msg = check1
            if firsth == 0:
                user_msg += '--' + check1f
            else:
                if c0 == 0:
                    user_msg += '--' + check1f2
            if valueh == 0:
                user_msg += '--' + check1f3
            if nonstandardh == 1:
                user_msg += '--' + check1f4
            user_msg += '--' + check1f0
            self.fatal.append(user_msg)
            if valueh == 1:
                if v == 1:
                    self.passes.append(check2)
                else:
                    self.fatal.append(check2 + '--' + check2f)

    def check_dataset_description_file(self, ddFilePath):
        # Check that
        # - The dataset description file follows the format provided by the Curation Team
        # - All mandatory "Value" fields are populated
        # - No negative statements ('None', 'N/A', etc.) are providedf for optional fields
        # - All populated fields follow required format (when applicable)

        columnfail = 0
        firsthnotstd = 0
        c0empt = 0
        c0emptList = ""
        c0duplicate = 0
        c0duplicateList = ""
        c0mandmissing = 0
        c0mandmissingList = ""
        c0optremove = 0
        c0optremoveList = ""

        cempty = 0
        cemptyList = ""

        headersfail = 0
        hvaluemissing = 0
        hempty = 0
        hemptyList = ""
        hnotallowed = 0
        hnotallowedList = ""
        hnotunq = 0
        hnotunqList = ""
        hvaluesequencewrong = 0

        valuemandempty = 0
        valuemandemptyList = ""
        valuemandnoneterm = 0
        valuemandnonetermList = ""
        valueoptnoneterm = 0
        valueoptnonetermList = ""
        valuefail = 0

        keywordsfail = 0
        contributorsnameunqfail = 0
        contributorsnameunqfailList = ""
        contributorsnameformatfail = 0
        contributorsnameformatfailList = ""
        contributorinfofail = 0
        contributorinfofailList = ""
        orcidformatfail = 0
        orcidformatfailList = ""
        rolefail = 0
        rolefailList = ""
        contactpersonformatfail = 0
        contactpersonformatfailList = ""
        contactpersonfail = 0
        fundingsourcefail = 0
        fundingsourcefailList = ""
        linksnumfail = 0
        linksnumfailList = ""
        articleformatfail = 0
        articleformatfailList = ""
        protocolformatfail = 0
        protocolformatfailList = ""
        numsubjectsformatfail = 0
        numsamplesformatfail = 0
        completenessformatfail = 0
        parentidvaluefail = 0
        parentidvaluefailList = ""
        parentidformatfail = 0
        parentidformatfailList = ""
        metadataversionfail = 0

        fullName = os.path.basename(ddFilePath)
        dDName = self.reqMetadataFileNames[1]
        expectedDDFullName = [(dDName + i) for i in self.metadataFileFormats1]

        if fullName not in expectedDDFullName:
            raise Exception("Please select a valid dataset_description file")

        if not os.path.isfile(ddFilePath):
            raise Exception("File path not found, please select a valid file")
        else:
            extension = os.path.splitext(ddFilePath)[1]
            if extension == '.csv':
                UTF8status = self.check_csv_utf8(ddFilePath)
                if UTF8status == 0:
                   self.fatal.append("You csv format file must be UTF-8 encoded")
                   return
                df = pd.read_csv(ddFilePath, header=None) # headers ignored here since pandas modify duplicat headers
            elif extension == '.xlsx':
                df = pd.read_excel(ddFilePath, header=None)
            elif extension == '.json':
                self.warnings.append("The SODA validator currently doesn't support the json format so your file cannot be validated. This will be implemented in a future release.")
                return
            df = cleanDataFrame(df)
            # Column headers of the cleaned up df
            fileHeaders = list(df)

            #check that first hearder is "Metadata element"
            if fileHeaders[0] != self.reqddHeaders[0]:
                firsthnotstd = 1
            else:

                #FIRST COLUMN CHECK

                #check for empty first column elements
                valueCol = df[self.reqddHeaders[0]].values
                index_empty = [i for i, e in enumerate(valueCol) if e == "empty"]
                if len(index_empty)>0:
                    c0empt = 1
                    index_empty.sort()
                    for i in index_empty:
                        c0emptList += str(i+2) + ","

                #check for duplicates first column elements
                dfnoEmpt = df.drop(index_empty)
                valueColnoEmpt = dfnoEmpt[self.reqddHeaders[0]].values
                if len(set(valueColnoEmpt)) != len(valueColnoEmpt):
                    c0duplicate = 1
                    #list of non unique items:
                    item = []
                    duplicate_list = []
                    for x in valueColnoEmpt:
                        if x in self.ddCol0Req or x in self.ddCol0Opt:
                            if x not in item:
                                item.append(x)
                            else:
                                if x not in duplicate_list:
                                    duplicate_list.append(x)
                                    c0duplicateList += " " + x + ","

                #check that mandatory column elements are present
                valueColUnq = set(valueColnoEmpt)
                for el in self.ddCol0Req:
                    if el not in valueColUnq:
                        c0mandmissing = 1
                        c0mandmissingList += " " + el + ","

                #check that other column elements are within allowable optional elements
                for el in valueColUnq:
                    if el not in self.ddCol0Req:
                        if el not in self.ddCol0Opt:
                            c0optremove = 1
                            c0optremoveList += " " + el + ","

                #empty column check:
                listh = list(df)
                for i, header in enumerate(listh):
                    if len(set(df.iloc[:,i].values))==1 and df.iloc[0, i]=='empty':
                        cempty = 1
                        cemptyList += " " + str(i+1) + ","

                # HEADERS CHECK

                # check that Value header is included
                if self.reqddHeaders[1] not in fileHeaders:
                    hvaluemissing = 1

                # check that there are no empty headers
                index_unnamed = [i for i, e in enumerate(fileHeaders) if "Empty." in e]
                if len(index_unnamed)>0:
                    hempty = 1
                    index_unnamed.sort()
                    for i in index_unnamed:
                        hemptyList += " " + str(i+1) + ","

                # check that only allowable hearders are used
                fileHeadersnonEmpty = list(fileHeaders)
                for index in sorted(index_unnamed, reverse=True):
                    del fileHeadersnonEmpty[index]
                fileHeadersnonEmpty = set(fileHeadersnonEmpty)
                for item in fileHeadersnonEmpty:
                    if item not in self.reqddHeaders and item not in self.optddHeaders:
                        hnotallowed = 1
                        hnotallowedList += " " + item + ","

                # check that all headers are unique
                if len(set(fileHeadersnonEmpty)) != len(fileHeadersnonEmpty):
                    hnotunq = 1
                    #list of non unique headers:
                    item = []
                    notunqval = []
                    for x in fileHeadersnonEmpty:
                        if x not in item:
                            item.append(x)
                        else:
                            if x not in notunqval:
                                notunqval.append(x)
                                hnotunqList += " " + x + ","

                # Value must be the first column (besides Metadata element, Description, and Example) and all subsequent must be Value 2, Value 3, etc.
                removeHeadersList = [self.reqddHeaders[0], self.optddHeaders[0], self.optddHeaders[1]]
                fileHeadersVal = list(fileHeaders)
                for item in removeHeadersList:
                    if item in fileHeadersVal: fileHeadersVal.remove(item)
                if len(fileHeadersVal) == 0:
                    hvaluesequencewrong = 1
                elif fileHeadersVal[0] != self.reqddHeaders[1]:
                    hvaluesequencewrong = 1
                else:
                    if len(fileHeadersVal)>1:
                        count = 2
                        for item in fileHeadersVal[1:]:
                            if item != 'Value ' + str(count):
                                hvaluesequencewrong = 1
                                break
                            else:
                                count += 1

                # If column pass and headers pass continue
                if c0empt == 0 and c0duplicate == 0 and c0mandmissing == 0 and c0optremove == 0 and cempty == 0:
                    columnfail = 0
                else:
                    columnfail = 1

                if hvaluemissing == 0 and hempty == 0 and hnotallowed == 0 and hnotunq == 0 and hvaluesequencewrong == 0:
                    headersfail = 0
                else:
                    headersfail = 1

                if columnfail == 0 and headersfail == 0:

                    #check for empty "Value" for mandatory fields
                    dfMand = df.loc[df[self.reqddHeaders[0]].isin(self.ddCol0Req)]
                    valueColMod = []
                    for x in valueCol:
                        if type(x) == str:
                            valueColMod.append(x.strip())
                        else:
                            valueColMod.append(x)
                    index_empty = [i for i, e in enumerate(valueColMod) if e == "empty"]
                    if len(index_empty)>0:
                        valuemandempty = 1
                        for i in index_empty:
                            valuemandemptyList += " " + dfMand[self.reqddHeaders[0]].iloc[i] + ","

                    #check for non terms for "Value" for mandatory fields
                    index_none = [i for i, e in enumerate(valueColMod) if e in self.noneTerms]
                    if len(index_none)>0:
                        valuemandnoneterm = 1
                        for i in index_none:
                            valuemandnonetermList += " " + dfMand[self.reqddHeaders[0]].iloc[i] + ","

                    #check in optional fields for none terms
                    dfOpt = df.loc[df[self.reqddHeaders[0]].isin(self.ddCol0Opt)]
                    valueCol = dfOpt[self.reqddHeaders[1]].values
                    valueColMod = []
                    for x in valueCol:
                        if type(x) == str:
                            valueColMod.append(x.strip())
                        else:
                            valueColMod.append(x)
                    index_none = [i for i, e in enumerate(valueColMod) if e in self.noneTerms]
                    if len(index_none)>0:
                        valueoptnoneterm = 1
                        for i in index_none:
                            valueoptnonetermList += " " + dfMand[self.reqddHeaders[0]].iloc[i] + ","

                    # CHECK PROVIDED VALUES
                    if valuemandempty == 0 and valuemandnoneterm == 0 and valueoptnoneterm == 0:
                        valuefail = 0
                    else:
                        valuefail = 1

                    if valuefail == 0:
                        dfv = df
                        dropColumn = [self.optddHeaders[0], self.optddHeaders[1]]
                        for item in dropColumn:
                            if item in fileHeaders:
                                dfv = dfv.drop(item, axis=1)

                        metadataEl = self.reqddHeaders[0]
                        valueEl = self.reqddHeaders[1]

                        # 3-5 unique keywords are provided and they are each in a separate column
                        selectedEl = self.ddCol0Req[2]
                        keywordsList = dfv.loc[dfv[metadataEl] == selectedEl].iloc[0].values
                        keywordsList = np.delete(keywordsList, np.argwhere(keywordsList == selectedEl))
                        keywordsList = np.delete(keywordsList, np.argwhere(keywordsList == self.empty))
                        keywordsListUnq = np.unique(keywordsList)

                        if len(keywordsListUnq)>2 and len(keywordsListUnq)<6:
                            keywordsfail = 0
                        else:
                            keywordsfail = 1

                        # Contributors Names are unique and in the Format Last, First Middle
                        selectedEl = self.ddCol0Req[3]
                        contributorsList = dfv.loc[dfv[metadataEl] == selectedEl].iloc[0].values
                        contributorsList = np.delete(contributorsList, np.argwhere(contributorsList == selectedEl))
                        contributorsList = np.delete(contributorsList, np.argwhere(contributorsList == self.empty))
                        contributorsListUnq = np.unique(contributorsList)

                        if len(contributorsListUnq) != len(contributorsList):
                            contributorsnameunqfail = 1
                            #list of non unique names:
                            item = []
                            notunqval = []
                            for x in contributorsList:
                                if x not in item:
                                    item.append(x)
                                else:
                                    if x not in notunqval:
                                        notunqval.append(x)
                                        contributorsnameunqfailList += " " + x + ","

                        for item in contributorsList:
                            #number of comma
                            countcomma = 0
                            for i in item:
                                if i == ",":
                                    countcomma += 1
                            if countcomma != 1:
                                contributorsnameformatfail = 1
                                contributorsnameformatfailList += " " + item + ","

                        # For each Contributor there must be at least one affiliation, only one ORCID, at least one role
                        if contributorsnameunqfail == 0 and contributorsnameformatfail == 0:
                            selectedEl1 = self.ddCol0Req[3]
                            selectedEl2 = self.ddCol0Req[4]
                            selectedEl3 = self.ddCol0Req[5]
                            selectedEl4 = self.ddCol0Req[6]
                            selectedEl5 = self.ddCol0Req[7]

                            nameList = dfv.loc[dfv[metadataEl] == selectedEl1].iloc[0].values
                            nameList = np.delete(nameList, np.argwhere(nameList == selectedEl1))
                            orcidList = dfv.loc[dfv[metadataEl] == selectedEl2].iloc[0].values
                            orcidList = np.delete(orcidList, np.argwhere(orcidList == selectedEl2))
                            affiliationList = dfv.loc[dfv[metadataEl] == selectedEl3].iloc[0].values
                            affiliationList = np.delete(affiliationList, np.argwhere(affiliationList == selectedEl3))
                            roleList = dfv.loc[dfv[metadataEl] == selectedEl4].iloc[0].values
                            roleList = np.delete(roleList, np.argwhere(roleList == selectedEl4))
                            contactpersonList = dfv.loc[dfv[metadataEl] == selectedEl5].iloc[0].values
                            contactpersonList = np.delete(contactpersonList, np.argwhere(contactpersonList == selectedEl5))

                            for name, orcid, affiliation, role, contactperson in zip(nameList, orcidList, affiliationList, roleList, contactpersonList):
                                if name != self.empty:
                                    if orcid == self.empty or affiliation == self.empty or role == self.empty  or contactperson == self.empty:
                                        contributorinfofail = 1
                                        contributorinfofailList += " " + name + ";"

                            # ORCID in the format https://orcid.org/0000-0002-5497-0243
                            for orcid in orcidList:
                                if orcid != self.empty:
                                    if 'https://orcid.org/' not in orcid:
                                        orcidformatfail = 1
                                        orcidformatfailList += " " + orcid + ","

                            # There must be only one contributor role per column and each of them must be from the Data Cite list of roles
                            for role in roleList:
                                if role != self.empty:
                                    if role not in self.contributorRoles:
                                            rolefail = 1
                                            rolefailList += " " + role + ","

                            # Contact person must be 'Yes' or 'No' and there must one and only one 'Yes'
                            countYes = 0
                            for contactperson in contactpersonList:
                                if contactperson != self.empty:
                                    if contactperson not in self.contactPersonOptions:
                                        contactpersonformatfail = 1
                                        contactpersonformatfailList += " " + contactperson + ","
                                    elif contactperson == self.contactPersonOptions[0]:
                                        countYes += 1
                            if countYes != 1:
                                contactpersonfail = 1

                        # One funding source listed per column
                        selectedEl = self.ddCol0Req[8]
                        fundingList = dfv.loc[dfv[metadataEl] == selectedEl].iloc[0].values
                        fundingList = np.delete(fundingList, np.argwhere(fundingList == selectedEl))
                        fundingList = np.delete(fundingList, np.argwhere(fundingList == self.empty))
                        for fundingsource in fundingList:
                            if "," in fundingsource or ";" in fundingsource:
                                fundingsourcefail = 1
                                fundingsourcefailList += " " + fundingsource + ","

                        # There must be only one of DOI of articles, DOI/URL of protocol or Additional link per column
                        selectedEl1 = self.ddCol0Req[9]
                        selectedEl2 = self.ddCol0Opt[1]
                        selectedEl3 = self.ddCol0Opt[2]
                        selectedElList = [selectedEl1, selectedEl2, selectedEl3]
                        dfc = dfv.loc[dfv[metadataEl].isin(selectedElList)]

                        linkHeaders = list(dfc)
                        for header in linkHeaders:
                            if header != metadataEl:
                                linkList = dfc[header].values
                                numempty = list(linkList).count(self.empty)
                                if numempty == 0 or numempty == 1:
                                    linksnumfail = 0
                                    linksnumfailList += " " + header + ","

                        # DOI articles format follows https://doi.org/xxxx
                        articleList = dfv.loc[dfv[metadataEl] == selectedEl1].iloc[0].values
                        articleList = np.delete(articleList, np.argwhere(articleList == selectedEl1))
                        for article in articleList:
                            if article != self.empty:
                                if 'https://doi.org/' not in article:
                                    articleformatfail = 1
                                    articleformatfailList += " " + str(article) + ","

                        # URL/DOI format follows  https://protocol.io/xxxx or https://doi.org/xxxx
                        protocolList = dfv.loc[dfv[metadataEl] == selectedEl2].iloc[0].values
                        protocolList = np.delete(protocolList, np.argwhere(protocolList == selectedEl2))
                        for protocol in protocolList:
                            if protocol != 'empty':
                                if 'https://doi.org/' not in protocol or 'https://www.protocols.io/' not in protocol:
                                    protocolformatfail = 1
                                    protocolformatfailList += " " + protocol + ","

                        # Number of subjects must be an integer
                        selectedEl = self.ddCol0Req[10]
                        selectedElList = [selectedEl]
                        dfc = dfv.loc[dfv[metadataEl].isin(selectedElList)]
                        numSubjects = dfc[valueEl].values[0]
                        try:
                            numSubjects = int(numSubjects)
                        except ValueError:
                            numsubjectsformatfail = 1
                            print(f"Number of subjects: {numSubjects} is not a valid integer.")
                        # if not numSubjects.isdigit():
                        #     numsubjectsformatfail = 1

                        # Number of samples must be an integer
                        selectedEl = self.ddCol0Req[11]
                        selectedElList = [selectedEl]
                        dfc = dfv.loc[dfv[metadataEl].isin(selectedElList)]
                        numSamples = dfc[valueEl].values[0]
                        try:
                            numSamples = int(numSamples)
                        except ValueError:
                            numsamplesformatfail = 1
                            print(f"Number of samples: {numSamples} is not a valid integer.")
                        # if not numSamples.isdigit():
                        #     numsamplesformatfail = 1

                        # Completeness of data must be "empty", "hasNext", or "hasChildren"
                        selectedEl = self.ddCol0Opt[4]
                        selectedElList = [selectedEl]
                        dfc = dfv.loc[dfv[metadataEl].isin(selectedElList)]
                        completeness = dfc[valueEl].values[0]
                        if completeness not in self.completnessInfo and completeness != self.empty:
                            completenessformatfail = 1

                        # Parent dataset ID must be comma seperated list and each ID must be of the format N:dataset:xxxx
                        selectedEl = self.ddCol0Opt[5]
                        selectedElList = [selectedEl]
                        dfc = dfv.loc[dfv[metadataEl].isin(selectedElList)]

                        for header in list(dfc):
                            if header != metadataEl and header != valueEl:
                                item = dfc[header].values[0]
                                if item != self.empty:
                                    parentidvaluefail = 1
                                    parentidvaluefailList += " " + header + ","


                        parentIDList = dfc[valueEl].values[0]
                        if parentIDList != self.empty:
                            if ',' in parentIDList:
                                parentIDList = [parentID for parentID in parentIDList.split(',')]
                                parentIDList = [parentID.strip() for parentID in parentIDList]
                                for parentID in parentIDList:

                                    if "N:dataset:" not in parentID:
                                        parentidformatfail = 1
                                        parentidformatfailList += " " + parentID + ","

                            else:
                                if "N:dataset:" not in parentIDList:
                                    parentidformatfail = 1
                                    parentidformatfailList += " " + parentIDList + ","

                        # Metadata version must be 1.2.3 as of 06/2020
                        selectedEl = self.ddCol0Req[12]
                        selectedElList = [selectedEl]
                        dfc = dfv.loc[dfv[metadataEl].isin(selectedElList)]
                        metadataV = dfc[valueEl].values[0]
                        metadataV.strip()
                        if metadataV != self.metadataVersion:
                            metadataversionfail = 1


        check1= "The first column header is 'Metadata element' and is located in the top left corner"
        check1f = "The header of the first column MUST be 'Metadata element' and must be located in cell A1. Rectify it."
        check1f0 = "The above format error(s) must be corrected before further check of the file"

        check1_c = "The content of the first column 'Metadata element' match exactly with the template version 1.2.3 provided by the Curation Team and there are no empty columns."
        check1_c1 = "In the first column, the following row number element(s) is/are empty and must be populated or removed: "
        check1_c2 = "All elements in the first column must be unique. The following element(s) is/are duplicated: "
        check1_c3 = "The following standard element(s) is/are missing in the first column and MUST be included: "
        check1_c4 = "The following element(s) is/are not standard in the first column and MUST be removed: "
        check1_c5 = "The following column number is/are empty and must be deleted or populated: "

        check1_h = "The names of the column headers meet all requirements"
        check1_h1 = "The following mandatory header is missing: 'Value'"
        check1_h2 = "All columns must have a header. The following column number do not have a header: "
        check1_h3 = "Only the following hearders are expected: 'Metadata element', 'Description', 'Example', and \
        'Value', 'Value 2', 'Value 3', etc. The following headers should be removed/corrected: "
        check1_h4 = "All headers must be unique. The following header(s) is/are duplicated: "
        check1_h5 = "'Value' must be the first column header after 'Metadata element' (and the optional 'Description' and 'Example' columns) followed by the sequence Value 2, Value 3, etc. as applicable"

        check2 = "There is an element in the 'Value' column for all mandatory fields of the first column 'Metadata element'"
        check2_1 = "The following mandatory element(s) of the first column MUST be provived an element in the 'Value' column: "
        check2_2 = "Negative statements ('None', 'N/A', etc.) are not allowed for mandatory element(s). Rectify the 'Value' element for the folowing 'Metadata element': "

        check3 = "There is an acceptable element in the 'Value' column for optional fields of the first column 'Metadata element' elements or it is left empty"
        check3_1 = "Negative statements ('None', 'N/A', etc.) are not allowed for optional element(s). Rectify/detele the 'Value' element for the folowing optional 'Metadata element': "

        check_keywords = "3 to 5 unique keywords are provided for the 'Keywords' field"
        check_keywords_f = "Ensure that 3 to 5 unique keywords are provided, each one in a seperate column"

        check_contributorsname = "Contributors names are unique and in the format 'Last, First Middle'"
        check_contributorsname_f1 = "The following contributor name(s) may have been included more than once: "
        check_contributorsname_f2 = "The following contributor name(s) may not follow the expected 'Last, First Middle' format: "

        check_contributorinfo = "For each 'Contributors' listed there is at least only one 'Contributor ORCID ID', at least one 'Contributor Affiliation', at least one 'Contributor Role', and one 'Is Contact Person' specified"
        check_contributorinfo_f = "Check that above requirements are met for the following 'Contributors': "

        check_orcid = " 'Contributor ORCID ID' are in the format 'https://orcid.org/xxxx-xxxx-xxxx-xxxx"
        check_orcid_f = "The following ORCID element is/are not in the required format and must be corrected: "

        check_contributorrole = "There must be only one contributor role per column and each of them must be from the Data Cite list of roles"
        check_contributorrole_f = "The following role(s) do(es) not fit the requirements and must be corrected: "

        check_contactperson = "'Is Contact Person' is either 'Yes' or 'No' and there is one and only one 'Yes' across all contributors"
        check_contactperson_f1 = "The following 'Is Contact Person' element is not 'Yes' or 'No': "
        check_contactperson_f2 = "There must be one and only one 'Yes' for the 'Is Contact Person' field. Currently there is either none or more than one"

        check_fundingsource = "Each funding source is mentioned in a seperate column"
        check_fundingsource_f = "Make sure the following refers to a single funding source: "

        check_links = "There is only one of the following in each Value column: Originating Article DOI, Protocol URL or DOI, or Additional Links"
        check_links_f = "Make sure the above condition is met in the following column(s): "

        check_articles = "'Originating Article DOI' is in the format https://doi.org/xxxx"
        check_articles_f = "Make sure the above condition is for the following DOI article(s): "

        check_protocols = "'Protocol URL or DOI' is in the format https://protocol.io/xxxx or https://doi.org/xxxx"
        check_protocols_f = "Make sure the above condition is met for the following Protocol URL or DOI: "

        check_numsubjects = "'Number of subjects' is provided an integer number as 'Value'"
        check_numsubjects_f = "Ensure that an integer number is provided for the 'Number of subjects' field in the 'Value' column"

        check_numsamples = "'Number of samples' is provided an integer number as 'Value'"
        check_numsamples_f = "Ensure that an integer number is provided for the 'Number of samples' field in the 'Value' column"

        check_completness = "'Completeness of data set' is provided an allowable 'Value'"
        check_completness_f = "Ensure that the 'Value' for 'Completeness of data set' is either empty, 'hasNext', or 'hasChildren'"

        check_parentID = "'Parent dataset ID' is only provided in the 'Value' column and is in the correct format or left empty"
        check_parentID_f1 = "'Parent dataset ID' must be only provided in the 'Value' column. Delete values in the following column: "
        check_parentID_f2 = "'Parent dataset ID' must be of the format 'N:dataset:xxxx' (Blackfynn dataset ID). Correct the following ID or delete it: "

        check_metadatav = "The 'Value' for 'Metadata Version DO NOT CHANGE' is '1.2.3'"
        check_metadatav_f = "The 'Value' for 'Metadata Version DO NOT CHANGE' must be '1.2.3'. Correct it."

        if firsthnotstd == 1:
            self.fatal.append(check1 + '--' + check1f + '--' + check1f0)
        else:
            self.passes.append(check1)

            msg = check1_c
            if columnfail == 1:
                if c0empt == 1:
                    msg += '--' + check1_c1 + c0emptList[:-1]
                if c0duplicate == 1 :
                    msg += '--' + check1_c2 + c0duplicateList[:-1]
                if c0mandmissing == 1:
                    msg += '--' + check1_c3 + c0mandmissingList[:-1]
                if c0optremove == 1:
                    msg += '--' + check1_c4 + c0optremoveList[:-1]
                if cempty == 1:
                    msg += '--' + check1_c5 + cemptyList[:-1]
                msg +=  '--' + check1f0
                self.fatal.append(msg)
            else:
                self.passes.append(msg)

            msg = check1_h
            if headersfail == 1:
                if hvaluemissing == 1:
                    msg += '--' + check1_h1
                if hempty == 1:
                    msg += '--' + check1_h2 + hemptyList[:-1]
                if hnotallowed == 1:
                    msg += '--' + check1_h3 + hnotallowedList[:-1]
                if hnotunq == 1:
                    msg += '--' + check1_h4 + hnotunqList[:-1]
                if hvaluesequencewrong == 1:
                    msg += '--' + check1_h5
                msg +=  '--' + check1f0
                self.fatal.append(msg)
            else:
                self.passes.append(msg)

            if columnfail == 0 and headersfail == 0:
                msg = check2
                if valuemandempty == 0 and valuemandnoneterm == 0:
                    self.passes.append(msg)
                else:
                    if valuemandempty ==1:
                        msg += '--' + check2_1 + valuemandemptyList[:-1]
                    if valuemandnoneterm == 1:
                        msg += '--' + check2_2 + valuemandnonetermList[:-1]
                    self.fatal.append(msg)

                msg = check3
                if valueoptnoneterm == 0:
                    self.passes.append(msg)
                else:
                    msg += '--' + check3_1 + valueoptnonetermList[:-1]
                    self.fatal.append(msg)

                if valuefail == 0:

                    msg = check_keywords
                    if keywordsfail == 0:
                        self.passes.append(msg)
                    else:
                        self.fatal.append(msg + '--' + check_keywords_f)

                    msg = check_contributorsname
                    if contributorsnameunqfail == 0 and contributorsnameformatfail == 0:
                        self.passes.append(msg)

                        msg = check_contributorinfo
                        if contributorinfofail == 0:
                            self.passes.append(msg)
                        else:
                            msg += '--' + check_contributorinfo_f + contributorinfofailList[:-1]
                            self.fatal.append(msg)
                    else:
                        if contributorsnameunqfail == 1:
                            msg += '--' + check_contributorsname_f1 + contributorsnameunqfailList[:-1]

                        if contributorsnameformatfail == 1:
                            msg += '--' + check_contributorsname_f2 + contributorsnameformatfailList[:-1]
                        self.warnings.append(msg)

                    msg = check_orcid
                    if orcidformatfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_orcid_f + orcidformatfailList[:-1]
                        self.fatal.append(msg)

                    msg = check_contributorrole
                    if rolefail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_contributorrole_f + rolefailList[:-1]
                        self.fatal.append(msg)

                    msg = check_contactperson
                    if contactpersonformatfail == 0 and contactpersonfail == 0:
                        self.passes.append(msg)
                    else:
                        if contactpersonformatfail == 1:
                            msg += '--' + check_contactperson_f1 + contactpersonformatfailList[:-1]
                        if contactpersonfail == 1:
                            msg += '--' + check_contactperson_f2
                        self.fatal.append(msg)

                    msg = check_fundingsource
                    if fundingsourcefail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_fundingsource_f + fundingsourcefailList[:-1]
                        self.warnings.append(msg)

                    msg = check_links
                    if linksnumfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_links_f + linksnumfailList[:-1]
                        self.fatal.append(msg)

                    msg = check_articles
                    if articleformatfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_articles_f + articleformatfailList[:-1]
                        self.fatal.append(msg)

                    msg = check_protocols
                    if protocolformatfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_protocols_f + protocolformatfailList[:-1]
                        self.fatal.append(msg)

                    msg = check_numsubjects
                    if numsubjectsformatfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_numsubjects_f
                        self.fatal.append(msg)

                    msg = check_numsamples
                    if numsamplesformatfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_numsamples_f
                        self.fatal.append(msg)

                    msg = check_completness
                    if completenessformatfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_completness_f
                        self.fatal.append(msg)

                    msg = check_parentID
                    if parentidvaluefail == 0 and parentidformatfail == 0:
                        self.passes.append(msg)
                    else:
                        if parentidvaluefail == 1:
                            msg += '--' + check_parentID_f1 + parentidvaluefailList[:-1]
                        if parentidformatfail == 1:
                            msg += '--' + check_parentID_f2 + parentidformatfailList[:-1]
                        self.fatal.append(msg)

                    msg = check_metadatav
                    if metadataversionfail == 0:
                        self.passes.append(msg)
                    else:
                        msg += '--' + check_metadatav_f
                        self.fatal.append(msg)


def cleanDataFrame(df):
    #Replace nan and empty first row cells by "Empty.n"
    empty_count = 0
    for column in list(df):
        element = df[column].iloc[0]
        if type(element) == str:
            if not element.strip():
                df[column].iloc[0] = "Empty." + str(empty_count)
                empty_count += 1
        elif np.isnan(df[column].iloc[0]):
            df[column].iloc[0] = "Empty." + str(empty_count)
            empty_count += 1

        #Change all empty and nan cells to "empty" to handle them more easily
        for rownum in df.index.values[1:]:
            element = df[column].iloc[rownum]
            if type(element) == str:
                if not element.strip():
                    df[column].iloc[rownum] = "empty"
            elif np.isnan(df[column].iloc[rownum]):
                df[column].iloc[rownum] = "empty"

    #Trim last empty columns if imported (e.g. if user accidently include space)
    for header in list(df)[::-1]:
        if "Empty." in df[header].iloc[0] and len(set(df[header].values[1:]))==1 and df[header].iloc[1]=='empty':
            df = df.drop(header, 1)
        else:
            break

    #Trim last empty rows if imported (e.g. if user accidently include space)
    for rownum in df.index.values[::-1]:
        if len(set(df.iloc[rownum].values))==1 and df[list(df)[0]].iloc[rownum] == 'empty':
            df = df.drop(rownum)
        else:
            break

    #Set first row as headers
    df = df.rename(columns=df.iloc[0], copy=False).iloc[1:].reset_index(drop=True)
    # df.to_excel('testfile.xlsx')
    return df

######## Main validation functions called in pysoda #######################
def pathToJsonStruct(vPath): #create a jsonStruct convenient for SODA's workflow
  jsonvar = {}
  contentDataset = os.listdir(vPath)
  listPathFilesinDataset = []
  for i in range(len(contentDataset)):
    contentName = contentDataset[i]
    contentPath = os.path.join(vPath, contentName)
    if (os.path.isdir(contentPath)):
      filesInFolder = os.listdir(contentPath)
      listPathFilesinFolder = []
      for j in range(len(filesInFolder)):
        fileNameInFolder = filesInFolder[j]
        listPathFilesinFolder.append(os.path.join(contentPath, fileNameInFolder))
      jsonvar[contentName] = listPathFilesinFolder
    else:
      listPathFilesinDataset.append(contentPath)
  jsonvar['main'] = listPathFilesinDataset
  return jsonvar

def validate_high_level_folder_structure(jsonStruct):
    validator = DictValidator()

    # check the root folder for required and optional folders
    validator.check_high_level_folder_structure(jsonStruct)

    return(validator)

def validate_high_level_metadata_files(jsonStruct):
    validator = DictValidator()

    # check the root folder for required metadata files
    isSubmission, isDatasetDescription, isSubjects, isSamples = validator.check_high_level_metadata_files(jsonStruct)

    return(validator, isSubmission, isDatasetDescription, isSubjects, isSamples)

def validate_sub_level_organization(jsonStruct):
    validator = DictValidator()

    #check sub level structure for empty folders
    validator.check_empty_folders(jsonStruct)

    #check sub level structure for empty files
    validator.check_empty_files(jsonStruct)

    #check sub level structure for DS.STORE
    validator.check_ds_store(jsonStruct)

     #check sub level structure for DS.STORE
    mnf_style = validator.check_manifest_file_included(jsonStruct)

    return(validator)

def validate_submission_file(submFilePath):
    validator = DictValidator()

    #check sub level structure for empty folders
    validator.check_submission_file(submFilePath)

    return(validator)


def validate_dataset_description_file(ddFilePath):
    validator = DictValidator()

    #check sub level structure for empty folders
    validator.check_dataset_description_file(ddFilePath)

    return(validator)
