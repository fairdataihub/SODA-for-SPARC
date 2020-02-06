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
11. Check that the subjects and sample files have the mandatory column headings and they are in the right order (completed)

12. Check that the subjects file has unique IDs, that a folder for each subject exists (to do)
13. Check that the submission file has all of the required columns (to do)
14. Check that the dataset_description file has all of the required rows (to do)

definitions:
a) a terminal folder is one with no further subfolders

variables:
fPathList - list of the files including the path
fList - list of the filenames only
dPathList - list of directories including the path

code I/O:
input: path to the folder selected by the user
output: list of fatal errors and/or warnings, flags that signal whether the 
        folder organization and naming, file naming, and position of manifest
        files is correct.

ver 0.1 2020-01-13
ver 0.2 2020-01-31

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

class dictValidator():

    def __init__(self):

        self.reqFolderNames = ['primary', 'sub']

        self.optFolderNames = ['samples', 'code', 'derivatives', 'docs', 'protocol']

        self.optSubfolderNames = ['anat', 'ephys', 'microscopy', 'rna-seq', 'mri']

        self.reqFileNames = ['dataset_description.xlsx', 'dataset_description.csv', 'subjects.csv', 'subjects.xlsx', 'samples.xlsx', 'samples.xlsx', 'submission.xlsx', 'submission.csv']

        self.reqManifest = ['manifest.xlsx', 'manifest.csv']

        self.optFileNames = ['README.txt', 'CHANGES.txt']

        self.submissionRows = ['SPARC Award number', 'Milestone achieved', 'Milestone completion date']

        self.reqFiles = ['dataset_description', 'subjects', 'samples', 'submission']

        self.subjCols = ['subject_id', 'pool_id', 'experimental group', 'age', 'sex', 'species', 'strain', 'Organism RRID']

        self.samCols = ['subject_id', 'sample_id', 'wasDerivedFromSample', 'pool_id', 'experimental group']

    
    def get_files_folders(self,path):
        # gets a list of the files and folders in the path of the root directory 
        # fPathList is a list of the files including the path
        # fList is the list of the filenames only
        # dPathList is the list of directories including the path
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

        return dPathList[0], fList, fPathList, dPathList



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
                        warnings.append(rootFolder+"/"+c+" is an unknown file.")
                #print(c,dd,subj,sam,subm,man,rd,w)

        if not dd:
            fatal.append("This dataset is missing the dataset_description file.")
        if (not subj) and (not sam):
            fatal.append("This dataset must contain a subjects or samples file.")
        if not subm:
            fatal.append("This dataset is missing the submissions file.")
        if not man:
            warnings.append("This dataset is missing a manifest file in the root folder. Will check in sub-folders...")
        if not rd:
            warnings.append("This dataset is missing an optional README and CHANGES file in the root folder. Will check in sub-folders...")

        checksumRootFiles = dd+subj+sam+subm
        if checksumRootFiles >= 3:  # check for req files
            rootFilePass = 1

        return rootFilePass, man, dd  #pass back if a manifest file is in the root directory as well



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
                else:      #non-standard folders are present
                    w = 1
                #print(c,p,o,s,w)
                #print('numSubj = '+str(numSubjFolders))

        if not p:
            fatal.append("This dataset is missing the 'primary' folder.")
        if not s:
            fatal.append("This dataset is must contain either a 'subjects' or 'samples' folder.")
        if not o:
            warnings.append("This dataset contains no optional folders.")
        if w:
            warnings.append("This dataset contains non-standard folder names.")

        checksumRootFolders = p+s
        if checksumRootFolders == 2:  # check for req folders
            rootFolderPass = 1

        return rootFolderPass, numSubjFolders



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
            else:
                fatal.append("Missing manifest file: check each terminal folder.")


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

        checkNumSubjDD = 0
        checkNumSubj = 0
        numSubjDD = 0
        numSubjS = 0
        toCheck = "Number of subjects"

        if rootDD: # if dataset_decription file exists
            #print(rootDD)
            #print(numSubjFolders)
            allContents = os.listdir(rootFolder)
            for c in allContents:
                fullFilepath = rootFolder+"/"+c
                #print(fullFilepath)
                if os.path.isfile(fullFilepath):
                    #print("this is a file")
                    fileName1, fileExtension = os.path.splitext(fullFilepath)
                    fileName = self.path_leaf(fileName1)
                    #print(fileName, fileExtension)
                    if fileName == "dataset_description":
                        #print("found dataset_description")
                        if fileExtension == ".csv":
                            numSubjDD = self.read_row_1value_csv(fullFilepath, toCheck)
                            #print(numSubjDD)
                        if fileExtension == ".xlsx":
                            numSubjDD = self.read_row_1value_xlsx(fullFilepath, toCheck)
                    if fileName == "subjects":
                        #print("found subjects")
                        if fileExtension == ".csv":
                            numSubjS = self.find_num_rows_csv(fullFilepath)
                            #print(numSubjS)
                        if fileExtension == ".xlsx":
                            numSubjS = self.find_num_rows_xlsx(fullFilepath)
                    
        if numSubjDD == numSubjFolders:
            checkNumSubjDD = 1
        else:
            fatal.append("The # of subjects in dataset_description doesn't match the # of subject folders")

        if numSubjS  == numSubjFolders:
            checkNumSubj = 1
        else:
            fatal.append("The # of subjects in subjects file doesn't match the # of subject folders")

        return checkNumSubjDD, checkNumSubj



    def check_empty_folders(self, dPathList):
    # detects empty folders if they exist, return a flag
        emptyFolderPass = 0
        for d in dPathList:
            allContents = os.listdir(d)
            if not allContents:
                warnings.append("The folder {} is an empty folder".format(d))
                emptyFolderPass = 1

        return emptyFolderPass



    def check_ds_store(self, fPathList):
    # detects the presence of a DS.STORE file, "1" means the file exists
        dsStoreCheck = 0

        for f in fPathList:
            if "DS.STORE" in f:
                warnings.append("A DS.STORE file exists in this dataset.  Please remove {} and re-validate".format(f))
                dsStoreCheck = 1

        return dsStoreCheck



    def check_file_size(self, fPathList):
    # detects the presence of empty (zero size) files
        fileSizeCheck = 0

        for f in fPathList:
            if os.path.getsize(f) == 0:
                fatal.append("{} is an empty file.  Please remove and re-validate".format(f))
                fileSizeCheck = 1

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
                        fatal.append("The file {} has an empty first row. Please remove empty row and revalidate.".format(f))

            if fileExtension == ".xlsx":
                workbook = xlrd.open_workbook(f)
                worksheet = workbook.sheet_by_index(0)
                if worksheet.cell_value(0,0):
                    startOkCheck = 1
                else:
                    fatal.append("The file {} does not start at (0,0). Please fix and revalidate.".format(f))

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
                        warnings.append("The file {} is not encoded using UTF-8".format(f))
        
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
                warnings.append("There is a blank row in {}. Please correct and revalidate".format(f))
            else:
                skipRowCheck = 0

        return skipRowCheck



    def generic_check_cols(self, cols, fileName, fileExtension):
        # this is called by check_req_file_cols to do the actual checking
        # this is checking that there are at least the required number of columns, 
        # that the required column headings are present and in the right order
        # check_req_file_cols loops through all existing files and gets file extension

        count = 0
        empty1stRow = 0
        colsLenCheck = 0
        colsCheck = 0
        colsVec = []

        # if this is a csv file
        if fileExtension == ".csv":
            with open(fileName+fileExtension) as csvFile:
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
            workbook = xlrd.open_workbook(fileName+fileExtension)
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



    def check_req_file_cols(self, fPathList):
        # checks to that the col headings in the required subjects/samples files are 
        # present, spelled correctly and in correct order
        colsCheck = 1
        subjFlag = 0
        samFlag = 0
        subjectsFile = 0 
        samplesFile = 0

        for f in fPathList:
            fileNamePath, fileExtension = os.path.splitext(f)
            fileName = self.path_leaf(fileNamePath)
            if fileName == 'subjects':
                cols = self.subjCols
                subjectsFile = 1
                subjColsLenCheck, subjColsCheck = self.generic_check_cols(cols, fileNamePath, fileExtension)
            elif fileName == 'samples':
                cols = self.samCols
                samColsLenCheck, samColsCheck = self.generic_check_cols(cols, fileNamePath, fileExtension)
                samplesFile = 1
            else:
                pass
                
        # check status flags and return result; only check relevant flags
        if subjectsFile:
            if subjColsLenCheck == 0:
                fatal.append("The subjects file does not contain all of the required columns. Please remediate and revalidate.")
            if subjColsCheck == 0:
                fatal.append("The subjects file column headings do not match the required headings or are in the wrong order. Please remediate and revalidate.")
        if samplesFile:
            if samColsLenCheck == 0:
                fatal.append("The samples file does not contain all of the required columns. Please remediate and revalidate.")
            if samColsCheck == 0:
                fatal.append("The samples file column headings do not match the required headings or are in the wrong order. Please remediate and revalidate.")

        # set the variables that are not applicable to the current dataset to "NA"
        if subjectsFile == 0:
            subjColsLenCheck = "NA"
            subjColsCheck = "NA"
        if samplesFile == 0:
            samColsLenCheck = "NA"
            samColsCheck = "NA"

        return subjColsLenCheck, subjColsCheck, samColsLenCheck, samColsCheck




def main():

    global warnings, fatal

    warnings = []
    fatal = []

    #hard code the path to the top-level directory for now; in reality this will be passed in
    vPath = "/home/karl/Work/SPARC/test_data_new_xlsx"

    validator = dictValidator()

    # collect file and folder info from the path given by the user
    rootFolder, fList, fPathList, dPathList = validator.get_files_folders(vPath)

    # figure out which folders are terminal and which contain other folders
    terminal, notTerminal = validator.find_folder_status(dPathList)

    # check the root folder for require files
    rootFilePass, rootMan, rootDD = validator.check_for_req_files(rootFolder)

    # check the root folder for required and optional folders
    rootFolderPass, numSubjFolders = validator.check_for_req_folders(rootFolder)

    # check that the manifest files exist and have the right number
    manPass, numManifest = validator.check_manifest(fList, fPathList, rootMan, terminal)

    #check that the number of subjects agrees
    checkNumSubjDD, checkNumSubj = validator.check_num_subjects(numSubjFolders, rootFolder, rootDD)

    #check for empty folders
    emptyFolderPass = validator.check_empty_folders(dPathList)

    #check for empty files
    fileSizeCheck = validator.check_file_size(fPathList)

    #check for DS.STORE files 
    dsStoreCheck = validator.check_ds_store(fPathList)

    #check for starting on row 0 or (0,0)
    fileStartCheck = validator.check_file_start(fPathList)

    #check for CSV files for UTF-* encoding
    utf8Check = validator.check_csv_utf8(fPathList)

    #check for skipped rows in csv files
    skipRowCheck = validator.check_skipped_rows(fPathList)

    #check subjects and samples files for required column headings
    subjColsLenCheck, subjColsCheck, samColsLenCheck, samColsCheck = validator.check_req_file_cols(fPathList)

    # print out the status flags
    print("files pass? = "+str(rootFilePass))
    print("folders pass? = "+str(rootFolderPass))
    print("manifest pass? = "+str(manPass))
    print("consistent number of subjects? = "+ str(checkNumSubjDD)+" and "+str(checkNumSubj))
    print("empty folders? = "+str(emptyFolderPass))
    print("empty files? = "+str(fileSizeCheck))
    print("DS.STORE file exists? = "+str(dsStoreCheck))
    print("CSV files start at row 0 or (0,0)? = "+str(fileStartCheck))
    print("CSV files are UTF-8? = "+str(utf8Check))
    print("Are there any skipped rows in the required files? = "+str(skipRowCheck))
    print("Are the number of and correct column headings present in the subjects files? = "+str(subjColsLenCheck)+" and "+ str(subjColsCheck))
    print("Are the number of and correct column headings present in the samples files? = "+str(samColsLenCheck)+" and "+ str(samColsCheck))

    # print out summary of warnings and fatal errors
    print("fatal = ")
    print(fatal)
    print("warnings = ")
    print(warnings)


if __name__ == "__main__":
    main()

    
