'''
This code validates the proposed folder structure and files
against the schema required by the SPARC curation team.
Note that since this code is separate from the code used
the the SPARC curation team that automatically checks similar
items, code passing this validator may not pass the official
SPARC validator code.  The converse is not true however.
The code checks the following items:

1. The required files exist (completed)
2. The required folders exist (completed)
3. A manifest files exists either in the root folder or in each terminal folder (completed)
4. The number of subject folders and that in the subjects info file agree (completed)
5. Check that there are no empty folders (completed)
6. Check that there are no DS.STORE files in the dataset (completed)
7. Check that there are no empty files (completed)
8. Check that all csv starts at first row and xlsx files start at (0,0) (completed)
9. Check that all csv files are UTF-8 encoded. (completed)
10. Check that all csv/xlsx files do not have any blank rows (completed)
11. Check that the subjects and sample files have the mandatory column headings and they are in the
    right order (completed)
12. Check that mandatory fields are populated for each subject/sample (completed)
13. Check that the number of samples is the same in the dataset_description and samples files
    and that those numbers match the actual number of folders (completed)

14. Check that the subjects/samples files have unique IDs (completed)
15. Check that the submission file has all of the required columns (to do) and are populated (completed)
16. Check that the dataset_description file has all of the required rows (completed) and are populated (completed)

definitions:
a) a terminal folder is one with no further subfolders

variables:
fPathList - list of the files including the path and extension
fList - list of the filenames only
dPathList - list of directories including the path
fullFilePath - the filename with path, but without the extension
fileExtension - the file extension

code I/O:
input: path to the folder selected by the user
output: list of fatal errors and/or warnings, flags that signal whether the
        folder organization and naming, file naming, and position of manifest
        files is correct.

ver 0.1 2020-01-13 (start)
ver 0.2 2020-01-31 (1-9 checks)
ver 0.3 2020-03-05 (1-13 checks)

Karl G. Helmer
Martinos Center for Biomedical Imaging
Massachusetts General Hospital
helmer@nmr.mgh.harvard.edu
'''

import os
import xlrd
import csv
import ntpath
import chardet
import re

class DictValidator:
    reqFolderNames = ['primary', 'sub']
    optFolderNames = ['samples', 'code', 'derivatives', 'docs', 'protocol']
    optSubfolderNames = ['anat', 'ephys', 'microscopy', 'rna-seq', 'mri']
    reqFileNames = ['dataset_description.xlsx', 'dataset_description.csv', 'subjects.csv', 'subjects.xlsx', 'samples.xlsx', 'samples.xlsx', 'submission.xlsx', 'submission.csv']
    reqManifest = ['manifest.xlsx', 'manifest.csv']
    optFileNames = ['README.txt', 'CHANGES.txt']
    submissionRows = ['SPARC Award number', 'Milestone achieved', 'Milestone completion date']
    reqFiles = ['dataset_description', 'subjects', 'samples', 'submission']
    subjCols = ['subject_id', 'pool_id', 'experimental group', 'age', 'sex', 'species', 'strain', 'Organism RRID']
    samCols = ['subject_id', 'sample_id', 'wasDerivedFromSample', 'pool_id', 'experimental group']

    # note: the capitalizations below are inconsistent, but are what is given in SPARC_FAIR-Folder_Structure V1.2.pdf
    ddCols = ['Name', 'Description', 'Keywords', 'Contributors', 'Contributor ORCID ID',
                   'Contributor Affiliation', 'Contributor Role',
                   'Is Contact Person', 'Acknowledgements', 'Funding', 'Originating Article DOI',
                   'Protocol URL or DOI', 'Additional Links', 'Link Description', 'Number of subjects',
                   'Number of samples', 'Completeness of data set', 'Parent dataset ID', 'Title for complete data set',
                   'Metadata Version']

    submCols = ['SPARC Award number', 'Milestone achieved', 'Milestone completion date']

    def __init__(self):
        self.fatal = []
        self.warnings = []
        self.passes = []

    def get_files_folders(self,path):
        """
        gets a list of the files and folders in the path of the root directory
        fPathList is a list of the files including the path
        fList is the list of the filenames only
        dPathList is the list of directories including the path
        """
        fList = []
        fPathList = []
        dPathList = []

        for root, dirs, files in os.walk(path):
            dPathList.append(root)

            for f in files:
                fName = os.path.join(root,f)
                fList.append(f)
                fPathList.append(fName)

        #print(fList)

        return [dPathList[0], fList, fPathList, dPathList]



    def find_folder_status(self,dPathList):
    # finds which folders only contains files and not other folders
    # used to check for manifest files
        notTerminal = []
        terminal = []
        for d in dPathList:
            contents = os.listdir(d)
            for c in contents:
                if os.path.isdir(d+"/"+c):
                    notTerminal.append(d)

        for d in dPathList:
            if d not in notTerminal:
                terminal.append(d)

        #remove duplicates from each list
        notTerminal = list(set(notTerminal))
        terminal = list(set(terminal))

        return terminal, notTerminal

    def check_for_req_folders(self, rootFolder):
        s = 0
        p = 0
        o = 0
        w = 0
        numSubjFolders = 0
        rootFolderPass = 0

        # first check for req and optional folders at the root level
        allContents = os.listdir(rootFolder)

        for c in allContents:
            if os.path.isdir(rootFolder+"/"+c):
                if c == self.reqFolderNames[0]:   #primary folder
                    p = 1
                    # check for subjects and/or samples
                    pContents = os.listdir(rootFolder+"/"+c)
                    for pc in pContents:
                        if self.reqFolderNames[1] in pc:
                            s = 1
                            numSubjFolders += 1
                elif c in self.optFolderNames:   #check for optional folders
                    o = 1

        if p==0 and s==0 and o==0: #non-standard folders are present
            w = 1

        if not p:
            self.fatal.append("This dataset is missing the 'primary' folder.")
        else:
            self.passes.append("This dataset contains a 'primary' folder")

        if not s:
            self.warnings.append("This dataset does not contain a 'subjects' or 'samples' folder. Typically, a dataset contains AT LEAST one of those folders.")
        else:
            self.passes.append("This dataset contains at least a 'subjects' or 'samples' folder")

        if not o:
            self.warnings.append("This dataset contains no optional folders.")

        if w == 1:
            self.fatal.append("This dataset contains non-standard folder names. The only folder names allowed are code, primary, docs, derivatives, protocol, and source.")

        else:
            self.passes.append("This dataset only contains folders that have standard folder names")


        checksumRootFolders = p+s
        if checksumRootFolders == 2:  # check for req folders
            rootFolderPass = 1

        return rootFolderPass, numSubjFolders




    def check_for_req_files(self, rootFolder):
        # this checks the root directory for the presence of required files
        dd = 0
        subj = 0
        sam = 0
        subm = 0
        man = 0
        rd = 0
        w = 0
        rootFilePass = 0

        allContents = os.listdir(rootFolder)
        for c in allContents:
            if os.path.isfile(rootFolder+"/"+c):
                if c == self.reqFileNames[0] or c == self.reqFileNames[1]:  #dataset_description
                    dd = 1
                elif c == self.reqFileNames[2] or c == self.reqFileNames[3]:   #subjects
                    subj = 1
                elif c == self.reqFileNames[4] or c == self.reqFileNames[5]:   #samples
                    sam = 1
                elif c == self.reqFileNames[6] or c == self.reqFileNames[7]:   #submission
                    subm = 1
                elif c == self.reqManifest[0] or c == self.reqManifest[1]:   #manifest
                    man = 1
                elif c in self.optFileNames:   #README.txt
                    rd = 1
                else:      #non-standard files are present
                    w = 1
                    if os.path.isdir(rootFolder+"/"+c):
                        pass
                    else:
                        self.warnings.append(rootFolder+"/"+c+" is an unknown file.")
                #print(c,dd,subj,sam,subm,man,rd,w)

        if not dd:
            self.fatal.append("This dataset is missing the dataset_description file.")
        else:
            self.passes.append("This dataset contains a dataset_description file.")
        if (not subj) and (not sam):
            self.fatal.append("This dataset must contain a subjects or samples file.")
        else:
            self.passes.append("This dataset contains either a subjects or a samples file.")
        if not subm:
            self.fatal.append("This dataset is missing the submissions file.")
        else:
            self.passes.append("This dataset contains a submission file.")
        if not man:
            self.warnings.append("This dataset is missing a manifest file in the root folder. Will check in sub-folders...")
        if not rd:
            self.warnings.append("This dataset is missing an optional README and CHANGES file in the root folder. Will check in sub-folders...")

        # check that that there is at least the minimum number of files
        checksumRootFiles = dd+subj+sam+subm
        if checksumRootFiles >= 3:
            rootFilePass = 1

        return rootFilePass, man, dd  #pass back if a manifest file is in the root directory as well


    def check_manifest(self, fList, fPathList, rootMan, terminal):
    # check to make sure there is at least one manifest file
        manPass = 0
        numManifest = 0  # number of manifest files found
        manVector = []
        # rootMan is a flag signalling that a manifest file was found in the root dir

        # if a manifest file is in the root dir, it was detected in check_req_files
        if rootMan == 1:
            manPass = 1
        else:
            # the manifest files should then be one in each terminal folder
            for t in terminal:
                contents = os.listdir(t)
                for c in contents:
                    if c in self.reqManifest:
                        numManifest = numManifest + 1
                        manVector.append("1")

            #print(manVector, len(terminal))
            if len(manVector) == len(terminal):
                manPass = 1

        if manPass == 1:
            self.passes.append("Manifest files are present in EITHER under the root folder OR in sub-folders.")

        else:
            self.fatal.append("Missing manifest file: Check that a manifest file is included either in each high-level SPARC folder or in each terminal folder of the folder structure.")

        return manPass, numManifest



    def path_leaf(self,path):
        head, tail = ntpath.split(path)

        return tail or ntpath.basename(head)



    def read_row_1value_csv(self, f, name):
        valOut = 0
        # this opens a csv file that has the variable name as the first element in a row
        # and returns the 2nd item in the row as the value.  In some cases it may be necessary
        # to return a list of values if the item has multiple values, then this will have
        # to be modified.
        with open(f) as csvFile:
            csvReader = csv.reader(csvFile, delimiter=',')
            for row in csvReader:
                if row[0] == name:
                    valOut = int(row[1])
                    break

        return valOut



    def find_num_rows_csv(self, f):
        # this returns the number of rows -1 (for subjects file only)
        valOut = 0
        rowCount = 0
        with open(f) as csvFile:
            csvReader = csv.reader(csvFile, delimiter=',')
            rowCount = sum(1 for row in csvReader)
            valOut = rowCount - 1  #assume that the first row contains the headings

        return valOut


    def  read_row_1value_xlsx(self, f, name):
        # this opens an xlsx file, finds the variable name in the first column and
        # extracts the value from the next column, same row.  Does not look for
        # multiple values in the row.
        valOut = 0
        workbook = xlrd.open_workbook(f)
        worksheet = workbook.sheet_by_index(0)
        for row in range(1, worksheet.nrows):
            if worksheet.cell_value(row,0) == name:
                valOut = worksheet.cell_value(row,1)
                break

        return valOut



    def find_num_rows_xlsx(self, f):
        # this returns the number of rows -1 (for subjects file only)
        valOut = 0
        workbook = xlrd.open_workbook(f)
        worksheet = workbook.sheet_by_index(0)
        rowCount = worksheet.nrows
        valOut = rowCount - 1 #assume that the first row contains the headings

        return valOut



    def check_num_subjects(self, numSubjFolders, rootFolder, rootDD):

        # this checks that the number of subject folders is the same as the value given in
        # dataset_description and in the subjects file.

        subjectsFilePresent = 0
        checkNumSubjDD = 0
        checkNumSubj = 0
        checkNumSubjS = 0
        numSubjDD = 0
        numSubjS = 0
        toCheck = "Number of subjects"

        if rootDD: # if dataset_decription file exists
            #print(rootDD)
            #print(numSubjFolders)
            allContents = os.listdir(rootFolder)
            for c in allContents:
                fullFilePath = rootFolder+"/"+c
                #print("Inside check_num_subjects: "+fullFilePath)
                if os.path.isfile(fullFilePath):
                    #print("{} is a file".format(fullFilePath))
                    fileName1, fileExtension = os.path.splitext(fullFilePath)
                    fileName = self.path_leaf(fileName1)
                    #print(fileName, fileExtension)
                    if fileName == "dataset_description":
                        #print("...found dataset_description file")
                        if fileExtension == ".csv":
                            numSubjDD = self.read_row_1value_csv(fullFilePath, toCheck)
                            #print(numSubjDD)
                        if fileExtension == ".xlsx":
                            numSubjDD = self.read_row_1value_xlsx(fullFilePath, toCheck)
                    if fileName == "subjects":
                        #print("...found subjects file")
                        subjectsFilePresent = 1
                        if fileExtension == ".csv":
                            numSubjS = self.find_num_rows_csv(fullFilePath)
                            #print(numSubjS)
                        if fileExtension == ".xlsx":
                            numSubjS = self.find_num_rows_xlsx(fullFilePath)

        if subjectsFilePresent == 0:
            self.fatal.append("Subjects file is not present.")
            return checkNumSubjDD, checkNumSubjS, numSubjDD, numSubjS, numSubjFolders

        if numSubjDD == numSubjFolders:
            checkNumSubjDD = 1
            self.passes.append("The # of subjects in dataset_description matches the # of subject folders")
        else:
            self.fatal.append("The # of subjects in dataset_description doesn't match the # of subject folders")

        if numSubjS  == numSubjFolders:
            checkNumSubjS = 1
            self.passes.append("The # of subjects in subjects file matches the # of subject folders")
        else:
            self.fatal.append("The # of subjects in subjects file doesn't match the # of subject folders")

        return checkNumSubjDD, checkNumSubjS, numSubjDD, numSubjS, numSubjFolders



    def check_empty_folders(self, dPathList):
    # detects empty folders if they exist, return a flag
        emptyFolderPass = 0
        for d in dPathList:
            allContents = os.listdir(d)
            if not allContents:
                self.fatal.append("The folder {} is an empty folder".format(d))
                emptyFolderPass = 1

        if emptyFolderPass == 0:
            self.passes.append("This dataset contains no empty folders.")

        return emptyFolderPass


    def check_ds_store(self, fPathList):
    # detects the presence of a DS.STORE file, "1" means the file exists
        dsStoreCheck = 0

        for f in fPathList:
            if "DS.STORE" in f:
                self.warnings.append("A DS.STORE file exists in this dataset.  Please remove {} and re-validate".format(f))
                dsStoreCheck = 1

        if dsStoreCheck == 0:
            self.passes.append("This dataset does not contain any DS.STORE file.")

        return dsStoreCheck

    ## no empty files
    def check_file_size(self, fPathList):
    # detects the presence of empty (zero size) files
        fileSizeCheck = 0

        for f in fPathList:
            if os.path.getsize(f) == 0:
                self.fatal.append("{} is an empty file.  Please remove and re-validate".format(f))
                fileSizeCheck = 1

        if fileSizeCheck != 0:
            self.passes.append("This dataset contains no empty files.")

        return fileSizeCheck

    def check_file_start(self, fPathList):
        # checks to make sure that file starts at first row (csv) or (0,0) (xlsx)
        startOkCheck = 0

        for f in fPathList:
            fileNamePath, fileExtension = os.path.splitext(f)

            if fileExtension == ".csv":
                with open(f) as csvFile:
                    csvReader = csv.reader(csvFile, delimiter=',')
                    row0 = next(csvReader)
                    if row0:
                        startOkCheck = 1
                    else:
                        self.fatal.append("The file {} has an empty first row. Please remove empty row and revalidate.".format(f))

            if fileExtension == ".xlsx":
                workbook = xlrd.open_workbook(f)
                worksheet = workbook.sheet_by_index(0)
                if worksheet.cell_value(0,0):
                    startOkCheck = 1
                else:
                    self.fatal.append("The file {} does not start at (0,0). Please fix and revalidate.".format(f))

            if startOkCheck != 0:
                self.passes.append("All .csv and .xlsx files start with the right format")
            return startOkCheck



    def check_csv_utf8(self, fPathList):
        # checks that all csv files are UTF-8 encoded
        # since looping through the files a "0" means that at least
        # one file was not UTF-8, and which one(s) is/are recorded
        # in the warnings.
        utf8Check = 1

        for f in fPathList:
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
                    #print(chardet.detect(rawdata)['encoding'])
                    if chardet.detect(rawdata)['encoding'] != 'utf-8':
                        utf8Check = 0
                        self.warnings.append("The file {} is not encoded using UTF-8".format(f))

        if utf8Check == 1:
            self.passes.append("All .csv files in this dataset are UTF-8 encoded.")

        return utf8Check



    def check_skipped_rows(self, fPathList):
        # checks to see if there are any blank rows that are followed by non-blank rows

        skipRowCheck = 0
        lineVector = []
        for f in fPathList:
            fileNamePath, fileExtension = os.path.splitext(f)

            if fileExtension == ".csv":
                with open(f) as csvFile:
                    csvReader = csv.reader(csvFile, delimiter=',')
                    numRows = self.find_num_rows_csv(f)
                    #print(numRows)
                    for n in range(numRows):
                        row = next(csvReader)
                        #print(row)
                        if row:
                            lineVector.append(1)
                        else:
                            lineVector.append(0)


            if fileExtension == ".xlsx":
                count = 0
                workbook = xlrd.open_workbook(f)
                sheet = workbook.sheet_by_index(0)
                numRows = sheet.nrows
                numCols = sheet.ncols

                for i in range(numRows):
                    for j in range(numCols):
                        mtRow = i
                        if (sheet.cell_value(mtRow,j) == ""):
                            count += 1

                        if (count == numCols):
                            lineVector.append(0)
                        else:
                            lineVector.append(1)


            testVec = [1,0,1]  # I've already checked that 1st row is not zero in check_file_start
            if testVec in lineVector:
                skpRowCheck = 1
                self.warnings.append("There is a blank row in {}. Please correct and revalidate".format(f))
            else:
                skipRowCheck = 0

        if skipRowCheck == 0:
            self.passes.append("All .csv and .xlsx files in this dataset does not contain any blank rows followed by non-blank rows.")

        return skipRowCheck



    def generic_check_cols(self, cols, fileNamePath, fileExtension):
        # this is called by check_req_file_cols to do the actual checking
        # this is checking that there are at least the required number of columns,
        # that the required column headings are present and in the right order
        # check_req_file_cols loops through all existing files and gets the file extension

        count = 0
        empty1stRow = 0
        colsLenCheck = 0
        colsCheck = 0
        colsVec = []

        # if this is a csv file
        if fileExtension == ".csv":
            with open(fileNamePath+fileExtension) as csvFile:
                csvReader = csv.reader(csvFile, delimiter=',')
                row0 = next(csvReader)
                if len(row0) == len(cols):
                    colsLenCheck = 1
                    for i in cols:
                        if i == row0[count]:
                            subjColsVec.append(1)
                        else:
                            subjColsVec.append(0)
                    count += 1
                elif len(row0) > len(cols):  #if there are more cols than required that is fine
                    colsLenCheck = 1
                else:
                    colsLenCheck = 0         #existing cols are LT required = some missing

        # if this is a xlsx file
        if fileExtension == ".xlsx":
            workbook = xlrd.open_workbook(fileNamePath+fileExtension)
            worksheet = workbook.sheet_by_index(0)
            if worksheet.ncols == len(cols):
                colsLenCheck = 1
                for c in cols:
                    if c == worksheet.cell_value(count,0):
                        colsVec.append(1)
                        count += 1
                    else:
                        colsVec.append(0)
            elif worksheet.ncols > len(cols):  #if there are more cols than required that is fine
                colsLenCheck = 1
            else:
                colsLenCheck = 0         #existing cols are LT required = some missing

        # collect checking flags and return results
        m = 0
        if m in colsVec:
            colsCheck = 0

        return colsLenCheck, colsCheck



    def check_row_values(self, cols, fileNamePath, fileExtension):
        # this is called by check_req_file_cols to do the actual checking
        # this is checking that the required columns have values in req columns for each subject

        rowsValCheck = 0
        rowVals = []
        colsVec = []

        # here I use the number of subject folders as the gold standard.  I've
        # already checked whether the 3 places where the number of subjects is
        # recorded are the same or not. Problem is that each can be wrong, so have
        # to choose something.

        # if this is a csv file
        if fileExtension == ".csv":
            with open(fileNamePath+fileExtension) as csvFile:
                csvReader = csv.reader(csvFile, delimiter=',')
                numRows = self.find_num_rows_csv(fileNamePath+fileExtension)
                numReqCols = len(cols)
                for row in csvReader:  #this will only work is row is a list CHECK
                    #print("current row = {}".format(row))
                    if len(row) >= numReqCols:
                        rowVals.append(1)
                    else:
                        rowVals.append(0)

                b = 0
                if b in rowVals:
                    rowsValCheck = 0  #existing cols are LT the number required
                    self.warnings.append("The file {} is missing row values in required columns.".format(fileNamePath+fileExtension))
                else:
                    rowsValCheck = 1  # all rows are ok

        # if this is a xlsx file
        # checking the rectangle formed by number of req cols and number of subjects
        if fileExtension == ".xlsx":
            workbook = xlrd.open_workbook(fileNamePath+fileExtension)
            worksheet = workbook.sheet_by_index(0)
            for c in range(worksheet.ncols):
                for r in range(worksheet.nrows): #FIX this should really be num of subjects, but which?
                    if worksheet.cell_value(r,c):  #CHECK is this (row, col) order?
                        colsVec.append(1)  # we don't care what the value is, just that it's there
                    else:
                        colsVec.append(0)
                        self.warnings.append("The file {} is missing row values in required columns.".format(fileNamePath+fileExtension))
        # collect checking flags and return results
        m = 0
        if m in colsVec:
            rowsValCheck = 0

        if rowsValCheck == 0:
            self.passes.append("Required columns in all files contain values.")

        return rowsValCheck



    def check_req_file_cols(self, fPathList):
        # Checks to that the col headings in the required subjects/samples files are
        # present, spelled correctly and in correct order
        # Then checks that mandatory fields are populated for each subject
        # Files can be either in csv or xlsx format.
        colsCheck = 1
        subjFlag = 0
        samFlag = 0
        subjectsFile = 0
        samplesFile = 0
        rowsValCheck = 0

        for f in fPathList:
            fileNamePath, fileExtension = os.path.splitext(f)
            fileName = self.path_leaf(fileNamePath)
            if fileName == 'subjects':
                cols = self.subjCols
                subjectsFile = 1
                subjColsLenCheck, subjColsCheck = self.generic_check_cols(cols, fileNamePath, fileExtension)
                rowsValCheck = self.check_row_values(cols, fileNamePath, fileExtension)
            elif fileName == 'samples':
                cols = self.samCols
                samplesFile = 1
                samColsLenCheck, samColsCheck = self.generic_check_cols(cols, fileNamePath, fileExtension)

        # check status flags and return result; only check relevant flags
        if subjectsFile:
            if subjColsLenCheck == 0:
                self.fatal.append("The subjects file does not contain all of the required columns. Please remediate and revalidate.")
            else:
                self.passes.append("The subjects file contains all of the required columns.")
            if subjColsCheck == 0:
                self.fatal.append("The subjects file column headings do not match the required headings or are in the wrong order. Please remediate and revalidate.")
            else:
                self.passes.append("The subjects file column headings match the required headings and are in the right order")
        if samplesFile:
            if samColsLenCheck == 0:
                self.fatal.append("The samples file does not contain all of the required columns. Please remediate and revalidate.")
            else:
                self.passes.append("The samples file contains all of the required columns.")
            if samColsCheck == 0:
                self.fatal.append("The samples file column headings do not match the required headings or are in the wrong order. Please remediate and revalidate.")
            else:
                self.passes.append("The samples file column headings match the required headings and are in the right order.")

        # set the variables that are not applicable to the current dataset to "NA"
        if subjectsFile == 0:
            subjColsLenCheck = "NA"
            subjColsCheck = "NA"
        if samplesFile == 0:
            samColsLenCheck = "NA"
            samColsCheck = "NA"

        return subjColsLenCheck, subjColsCheck, samColsLenCheck, samColsCheck, rowsValCheck



    def read_samples_file(self,filePath):
        # this reads the samples file and finds the number of samples folders per subjects folder
        # used in check_num_samples; compare the results found here from the samples file
        # with the number found from the number of folders
        subjects = []
        samples = []
        # dict of number of samples for each subject; can't use a list
        # since using set to find unique subjects and that's unordered
        numSamFile = {}
        fileNamePath, fileExtension = os.path.splitext(filePath)

        # open file and find put 0th (subject_id) and 1st (sample_id) values in a list
        if fileExtension == ".csv":
            with open(filePath) as csvFile:
                csvReader = csv.reader(csvFile, delimiter=',')
                for row in csvReader:
                    subjects.append(row[0])
                    samples.append(row[1])

        if fileExtension == ".xlsx":
            workbook = xlrd.open_workbook(filePath)
            worksheet = workbook.sheet_by_index(0)
            for row in range(worksheet.nrows):
                subjects.append(worksheet.cell_value(row,0))
                samples.append(worksheet.cell_value(row,1))

        # find how many samples per subject
        # discard the column headings, which are first item in list
        subjects.pop(0)
        samples.pop(0)

        # put the number of unique subject names into a list
        uniSubj = set(subjects)

        # then find the number of samples that correspond to each subject name
        for sb in uniSubj:
            count = 0
            for s in subjects:
                if sb == s:
                    count += 1
            numSamFile[sb] = count
        #print("numSamFile = {}".format(numSamFile))

        return numSamFile


    def find_num_sample_folders(self, rootFolder):
        # This module goes into each subject folder and finds the number of sample
        # folders within. Returns a dict in which each element is the number
        # of sample folders (value) for each subject folder (key)

        # find number of subject directories in the primary folder
        # go into each sub# folder and determine how many sam# folders there are
        # calculate the total number of sample folders; return dict with key = subj
        # and value = number

        subjFolders = []
        numSamFolders = {}

        # check to see if there is a samples file, which means that there
        # should be samples sub-folders
        allContents = os.listdir(rootFolder)
        # continue only if there is a samples file
        if "samples.xlsx" or "samples.csv" in allContents:
            self.passes.append("This dataset contains a samples file.")
            # continue only if there is a primary folder
            if "primary" in allContents:
                pPath = rootFolder+'/'+"primary"+'/'
                primaryContents = os.listdir(pPath)
                #print("primaryContents = {}".format(primaryContents))
                for p in primaryContents:
                    if os.path.isdir(pPath+p) and "sub" in p:
                        subjFolders.append(pPath+p)

                #print("subjFolders = {}".format(subjFolders))
                numSubjFolders = len(subjFolders)  #just in case I need this

                for sf in subjFolders:
                    folderName = self.path_leaf(sf)
                    subjContents = os.listdir(sf)
                    #print(subjContents)
                    count = 0
                    for sc in subjContents:
                        #print(sf+'/'+sc)
                        if os.path.isdir(sf+'/'+sc) and "sam" in sc:
                            count += 1
                    numSamFolders[folderName] = count
                #print("numSamFolders = {}".format(numSamFolders))
            else:
                self.fatal.append("No primary folder found in top-level directory.")

        else:
            self.warnings.append("No samples file found. If this is incorrect, please check filename and revalidate.")

        return numSamFolders



    def check_num_samples(self, rootFolder, rootDD):

        # There are 3 places that gives the number of samples/subject
        # 1) the samples file (read_samples_file module)
        # 2) the number of sam# folders inside each sub# folder (find_num_samples_folders module)
        # 3) the dataset description file

        # this module finds the number of samples from the dataset description file and then
        # calls read_samples_file and find_num_samples_folders to get the dicts that contain
        # the number of samples/subject and then compares each of those instances

        numSamDD = 0
        numSamFile = {}
        numSamFolders = {}
        toCheck = "Number of samples"

        checkSamplesPresent = 0
        checkDDPresent = 0
        checkSamFolDD = 0
        checkSamFilDD = 0
        checkSamFilFol = 0

        if rootDD: # if dataset_decription file exists
            allContents = os.listdir(rootFolder)
            for c in allContents:
                fullFilePath = rootFolder+"/"+c
                if os.path.isfile(fullFilePath):
                    # pull off the file extension
                    fileName1, fileExtension = os.path.splitext(fullFilePath)
                    # find the filename w/o path or extension
                    fileName = self.path_leaf(fileName1)
                    # find the number of samples from the dataset description file
                    # I'm assuming that the number of samples given in the DD file
                    # is the TOTAL number of samples
                    if fileName == "dataset_description":
                        checkDDPresent = 1
                        if fileExtension == ".csv":
                            numSamDD = self.read_row_1value_csv(fullFilePath, toCheck)
                        if fileExtension == ".xlsx":
                            numSamDD = self.read_row_1value_xlsx(fullFilePath, toCheck)

                    # if there is a samples file, find a dict for num samples/subject
                    if fileName == "samples":
                        checkSamplesPresent = 1
                        #print("...found samples file!")
                        numSamFile = self.read_samples_file(fullFilePath)

            if checkSamplesPresent == 0:
                self.fatal.append("Samples file is not present.")
                return checkSamFolDD, checkSamFilDD, checkSamFilFol

            numSamFolders = self.find_num_sample_folders(rootFolder)

            #print("numSamDD = {}".format(numSamDD))

            # find the total number of samples from the dict of samples/subject from actual folders
            totalFol = 0
            if numSamFolders:
                for k in numSamFolders.keys():
                    totalFol += numSamFolders[k]

            # find the total number of samples from the dict of samples/subject from samples file
            totalFil = 0
            if numSamFile:
                for k in numSamFile.keys():
                    totalFil += numSamFile[k]

            # now check each combination for consistency
            if numSamDD == totalFol:
                checkSamFolDD = 1
                self.passes.append("The # of samples reported in the dataset_description file match the # of sample folders.")
            else:
                self.fatal.append("The # of samples reported in the dataset_description file doesn't match the # of sample folders.")

            if numSamDD == totalFil:
                checkSamFilDD = 1
                self.passes.append("The # of samples reported in the dataset_description file match the # of samples reported in the samples file.")
            else:
                self.fatal.append("The # of samples reported in the dataset_description file doesn't match the # of samples reported in the samples file.")

            if totalFil == totalFol:
                checkSamFilFol = 1
                self.passes.append("The # of samples reported in the samples file match the # of sample folders.")
            else:
                self.fatal.append("The # of samples reported in the samples file doesn't match the # of sample folders.")

        return checkSamFolDD, checkSamFilDD, checkSamFilFol


    def get_col_vals_xlsx(self, f, name):
        # this opens an xlsx file, finds the column with the requested variable name
        # and extracts the values from that column. Returns a list with all of the
        # values from that row.
        colVals = []
        workbook = xlrd.open_workbook(f)
        worksheet = workbook.sheet_by_index(0)
        for col in range(1, worksheet.ncols):
            if worksheet.cell_value(0,col) == name:
                colVals = worksheet.col_values(col,1)
                break

        return colVals




    def get_col_vals_csv(self, f, name):
        # this opens a csv file, write the file into a dict assuming that the
        # first row are the variable names (which are then the keys).
        # Then goes through each row and appends the value for the "name"
        # key to the list to be returned.

        colVals = []

        with open(f) as csvFile:
            dict = csv.DictReader(csvFile)
            for row in dict:
                colVals.append(row[name])

        return colVals


    def check_unique_ids(self, rootFolder):
        # This module goes into the subjects and samples files to make sure that
        # the listed subject and sample IDs are unique.
        # In the subjects file there should not be any duplicate entries in the first
        # column (which would mean the same ID was entered twice).
        # The samples file should have a unique combination of the 1st two column values (subjID, samID)

        names = ["subject_id", "sample_id"]
        files = ["subjects.csv", "subjects.xlsx", "samples.csv", "samples.xlsx"]
        extensions = ["csv", "xlsx"]
        samplesFilePresent = 0
        subjectFilePresent = 0
        uniqueSubIDFlag = 1
        uniqueSamIDFlag = 1
        colVals = []

        allContents = os.listdir(rootFolder)

        # subjects first
        for a in allContents:
            fullFilePath = rootFolder+"/"+a
            if os.path.isfile(fullFilePath):
                if a == files[0]:
                    colVals = self.get_col_vals_csv(fullFilePath,names[0])
                    subjectFilePresent = 1
                if a == files[1]:
                    colVals = self.get_col_vals_xlsx(fullFilePath,names[0])
                    subjectFilePresent = 1


        # samples next;
        colValsSub = []
        colValsSam = []
        for a in allContents:
            fullFilePath = rootFolder+"/"+a
            if os.path.isfile(fullFilePath):
                if a == files[2]:
                    colValsSub = self.get_col_vals_csv(fullFilePath,names[0])
                    colValsSam = self.get_col_vals_csv(fullFilePath,names[1])
                    samplesFilePresent = 1
                elif a == files[3]:
                    colValsSub = self.get_col_vals_xlsx(fullFilePath,names[0])
                    colValsSam = self.get_col_vals_xlsx(fullFilePath,names[1])
                    samplesFilePresent = 1

        if subjectFilePresent == 0:
            return uniqueSubIDFlag, uniqueSamIDFlag

        if samplesFilePresent == 0:
            return uniqueSubIDFlag, uniqueSamIDFlag

        # we just need to check whether there are any repeats in subjectID here
        if len(colVals) != len(set(colVals)):
            self.fatal.append("There are duplicate subject ID's in the subjects file!")
            uniqueSubIDFlag = 0

        # here have to include values 1st two columns in comparison
        for i in range(len(colValsSub)):
            for j in range(i+1,len(colValsSub)):
                if colValsSub[i] == colValsSub[j] and colValsSam[i] == colValsSam[j]:
                    uniqueSamIDFlag = 0
                    self.fatal.append("There are duplicate (subject ID, sample ID) values in the samples file!")
                    break

        if uniqueSubIDFlag == 1:
            self.passes.append("There are no repeats in subject ID's in the subjects file.")

        if uniqueSamIDFlag == 1:
            self.passes.append("The samples file has a unique combination of the first two column values (subject ID, sample ID).")

        return uniqueSubIDFlag, uniqueSamIDFlag



    def check_dataset_description(self, rootFolder):
        # The dataset_description file has the variable names in rows rather than columns
        # Check that the first column has the right variable name and that at least the
        # second column is filled in

        checkDDVarsFlag = 1
        checkDDValsFlag = 1
        ddVariables = []
        ddValues = []
        ddFileRootCSV = rootFolder+"/"+"dataset_description.csv"
        ddFileRootXLSX = rootFolder+"/"+"dataset_description.xlsx"

        if os.path.isfile(ddFileRootCSV):
            with open(ddFileRootCSV) as f:
                reader = csv.reader(f, delimiter=",")
                for row in reader:
                    ddVariables.append(row[0])
                    if row[1]:
                        ddValues.append(row[1])
                    else:
                        checkDDVals = 0  # each row has to have a variable name and at least one value (even if N/A)

        if os.path.isfile(ddFileRootXLSX):
            workbook = xlrd.open_workbook(ddFileRootXLSX)
            worksheet = workbook.sheet_by_index(0)
            ddVariables = worksheet.col_values(0)
            ddValues = worksheet.col_values(1)
            if "" in ddValues:
                checkDDValues = 0

        # check to make sure that the variables are correct and in the right order
        print("checking dataset_description required columns...")
        for d in range(len(self.ddCols)):
            if ddVariables[d] != self.ddCols[d]:
                self.fatal.append("There is a problem with the dataset_description file: {}, {}".format(ddVariables[d],self.ddCols[d]))
                print("There is a problem with the dataset_description file: {}, {}".format(ddVariables[d],self.ddCols[d]))
                checkDDVarsFlag = 0

        if checkDDVarsFlag != 0 and checkDDValsFlag != 0:
            self.passes.append("The dataset description file has correct variables and they are in the right order. All required fields are populated.")

        return checkDDVarsFlag, checkDDValsFlag



    def check_submission(self, rootFolder):
        # The submission file has the variable names in rows rather than columns
        # Check that the first column has the right variable name and that at least the
        # second column is filled in

        checkSVarsFlag = 1
        checkSValsFlag = 1
        sVariables = []
        sValues = []
        sFileRootCSV = rootFolder+"/"+"submission.csv"
        sFileRootXLSX = rootFolder+"/"+"submission.xlsx"

        if os.path.isfile(sFileRootCSV):
            with open(sFileRootCSV) as f:
                reader = csv.reader(f, delimiter=",")
                for row in reader:
                    sVariables.append(row[0])
                    if row[1]:
                        sValues.append(row[1])
                    else:
                        checkSVals = 0  # each row has to have a variable name and at least one value (even if N/A)

        if os.path.isfile(sFileRootXLSX):
            workbook = xlrd.open_workbook(sFileRootXLSX)
            worksheet = workbook.sheet_by_index(0)
            sVariables = worksheet.col_values(0)
            sValues = worksheet.col_values(1)
            if "" in sValues:
                checkSValues = 0

        # check to make sure that the variables are correct and in the right order
        print("checking submission required columns...")
        for d in range(len(self.submCols)):
            if sVariables[d] != self.submCols[d]:
                self.fatal.append("There is a problem with the submission file: {}, {}".format(sVariables[d],self.submCols[d]))
                print("there is a problem with the submission file: {}, {}".format(sVariables[d],self.submCols[d]))
                checkSVarsFlag = 0
        if checkSVarsFlag != 0 and checkSValsFlag != 0:
            self.passes.append("The submission file has correct variables and they are in the right order. All three fields are populated.")

        return checkSVarsFlag, checkSValsFlag


######## GRAB High-FOLDER and File INFO #######################
def validate_folders(vPath):
    validator = DictValidator()

    # collect file and folder info from the path given by the user
    rootFolder, fList, fPathList, dPathList = validator.get_files_folders(vPath)

    # figure out which folders are terminal and which contain other folders
    terminal, notTerminal = validator.find_folder_status(dPathList)

    # check the root folder for required and optional folders
    rootFolderPass, numSubjFolders = validator.check_for_req_folders(rootFolder)
    print("Does this dataset contain the required folders? = "+str(rootFolderPass))


    # check the root folder for require files
    rootFilePass, rootMan, rootDD = validator.check_for_req_files(rootFolder)
    print("Does this dataset contain the required files? = "+str(rootFilePass))

    # print out summary of warnings and fatal errors
    print("\n")
    print("Fatal Errors and Warnings")
    print("fatal = ")
    print(validator.fatal)
    print("\n")
    print("warnings = ")
    print(validator.warnings)
    return {'errors': validator.fatal, 'pass': validator.passes, 'warnings': validator.warnings}


###### GRAB FILE AND SUB-FOLDER INFO ###########
def validate_files(vPath):
    validator = DictValidator()

    # collect file and folder info from the path given by the user
    rootFolder, fList, fPathList, dPathList = validator.get_files_folders(vPath)

    # figure out which folders are terminal and which contain other folders
    terminal, notTerminal = validator.find_folder_status(dPathList)

    #check for empty folders
    emptyFolderPass = validator.check_empty_folders(dPathList)
    print("Does this dataset contain empty folders? = "+str(emptyFolderPass))

    #check for empty files
    fileSizeCheck = validator.check_file_size(fPathList)
    print("Does this dataset contain empty files? = "+str(fileSizeCheck))

    #check for DS.STORE files
    dsStoreCheck = validator.check_ds_store(fPathList)
    print("Does this dataset contain a DS.STORE file? = "+str(dsStoreCheck))

    #check for CSV files for UTF-* encoding
    utf8Check = validator.check_csv_utf8(fPathList)
    print("Are CSV files encoded in UTF-8? = "+str(utf8Check))

    #check for skipped rows in csv files
    skipRowCheck = validator.check_skipped_rows(fPathList)
    print("Are there any skipped rows in the required files? = "+str(skipRowCheck))

    #check for starting on row 0 or (0,0)
    fileStartCheck = validator.check_file_start(fPathList)
    print("Do files start at row 0 (csv) or (0,0) (xlsx)? = "+str(fileStartCheck))

    # print out summary of warnings and fatal errors
    print("\n")
    print("Fatal Errors and Warnings")
    print("fatal = ")
    print(validator.fatal)
    print("\n")
    print("warnings = ")
    print(validator.warnings)
    return {'errors': validator.fatal, 'pass': validator.passes, 'warnings': validator.warnings}

############################ MANIFEST FILE #############################
def validate_manifest_file(vPath):

    ### Instantiate 2 instances: 1 to grab just a method's output and 1 main class to get warnings and errors.
    validatorMain = DictValidator()
    validator = DictValidator()

    ###### GRAB FILE AND FOLDER INFO ###########
    # collect file and folder info from the path given by the user
    rootFolder, fList, fPathList, dPathList = validatorMain.get_files_folders(vPath)

    # figure out which folders are terminal and which contain other folders
    terminal, notTerminal = validatorMain.find_folder_status(dPathList)

    # check the root folder for require files (manifest file in this case)
    rootFilePass, rootMan, rootDD = validator.check_for_req_files(rootFolder)
    print("Does this dataset contain the required files? = "+str(rootFilePass))

    # check that the manifest files exist and have the right number
    manPass, numManifest = validatorMain.check_manifest(fList, fPathList, rootMan, terminal)
    print("Does this dataset contain a master manifest file or one manifest in each terminal folder? = "+str(manPass))

    # print out summary of warnings and fatal errors
    print("\n")
    print("Fatal Errors and Warnings")
    print("fatal = ")
    print(validatorMain.fatal)
    print("\n")
    print("warnings = ")
    print(validatorMain.warnings)
    return {'errors': validatorMain.fatal, 'pass': validatorMain.passes, 'warnings': validatorMain.warnings}

########################### SAMPLES, SUBJETCS FILES #####################
def validate_subject_sample_files(vPath):
    ### Instantiate 2 instances: 1 to grab just a method's output and 1 main class to get warnings and errors.
    validatorMain = DictValidator()
    validator = DictValidator()

    # collect file and folder info from the path given by the user
    rootFolder, fList, fPathList, dPathList = validatorMain.get_files_folders(vPath)

    # figure out which folders are terminal and which contain other folders
    terminal, notTerminal = validatorMain.find_folder_status(dPathList)

    #check subjects and samples files for required column headings
    subjColsLenCheck, subjColsCheck, samColsLenCheck, samColsCheck, rowsValCheck = validatorMain.check_req_file_cols(fPathList)
    print("Are there the correct number of column headings in the subjects files and are they named correctly? = "+str(subjColsLenCheck)+" and "+ str(subjColsCheck))
    print("Are there the correct number of column headings in the samples files and are they named correctly? = "+str(samColsLenCheck)+" and "+ str(samColsCheck))
    print("Are there values in the required columns in the subjects file? = "+str(rowsValCheck))

    # check the root folder for required and optional folders
    rootFolderPass, numSubjFolders = validator.check_for_req_folders(rootFolder)
    print("Does this dataset contain the required folders? = "+str(rootFolderPass))

    # check the root folder for require files
    rootFilePass, rootMan, rootDD = validator.check_for_req_files(rootFolder)
    print("Does this dataset contain the required files? = "+str(rootFilePass))

    checkNumSubjDD, checkNumSubjS, numSubjDD, numSubjS, numSubjFolders = validatorMain.check_num_subjects(numSubjFolders, rootFolder, rootDD)
    print("Does the number of subjects folders match the numbers given in the dataset_description and subjects files? = "+ str(checkNumSubjDD)+" and "+str(checkNumSubjS))

    #check that the number of samples match between dataset description, samples, and actual folders
    checkSamFolDD, checkSamFilDD, checkSamFilFol = validatorMain.check_num_samples(rootFolder, rootDD)
    print("Does the number of samples in dataset_description match the number of sample folders? = "+str(checkSamFolDD))
    print("Does the number of samples in dataset_description file match the number in the samples file? = "+str(checkSamFilDD))
    print("Does the number of sample folders match the number in the samples file? = "+str(checkSamFilFol))

    # check that the IDs in the subjects and samples files are unique
    uniqueSubIDFlag, uniqueSamIDFlag = validatorMain.check_unique_ids(rootFolder)
    print("Are the IDs in the subjects file unique? = "+str(uniqueSubIDFlag))
    print("Are the IDs in the samples file unique? = "+str(uniqueSamIDFlag))


    # print out summary of warnings and fatal errors
    print("\n")
    print("Fatal Errors and Warnings")
    print("fatal = ")
    print(validatorMain.fatal)
    print("\n")
    print("warnings = ")
    print(validatorMain.warnings)
    return {'errors': validatorMain.fatal, 'pass': validatorMain.passes, 'warnings': validatorMain.warnings}

############################ Submission and Dataset_description files #############################
def validate_submission_dataset_description_files(vPath):

    ### Instantiate 2 instances: 1 to grab just a method's output and 1 main class to get warnings and errors.
    validatorMain = DictValidator()
    validator = DictValidator()

    ###### GRAB FILE AND FOLDER INFO ###########
    # collect file and folder info from the path given by the user
    rootFolder, fList, fPathList, dPathList = validatorMain.get_files_folders(vPath)

    # check for submission file requirements
    checkSVarsFlag, checkSValsFlag = validatorMain.check_submission(rootFolder)

    # check for dataset_description file requirements
    checkDDVarsFlag, checkDDValsFlag = validatorMain.check_dataset_description(rootFolder)

    return {'errors': validatorMain.fatal}

# if __name__ == "__main__":
#     vPath = "/home/karl/Work/SPARC/test_data_new_xlsx"
#     pathInfo = {os.path.basename(path): path for path in os.path.listdir(vPath)}
#     main(vPath)
