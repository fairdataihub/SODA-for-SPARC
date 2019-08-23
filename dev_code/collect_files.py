'''
This code allows the user to specify the location of files
that are needed for the curation of data from the SPARC project.

The set of folders is fixed by the project and the user will be
prompted to assign files to each. 

Program Flow:
1) user is prompted to provide a location.json file, so can load partial info if exists
2) if no locations.json file exists, creates a dictionary to store location info
3) code prompts user to provide info on numbers of subjects, samples, sessions, and datatypes
Info:
4) currently there is no support for subjects/samples that have a different number of sessions/datatypes
5) code determines what info is still needed and prompts user for provide its location
6) for Subjects and Samples, user is prompted for top level dir and lower levels are 
   stored in a list that can be parsed as needed to get number of subjects/sessions/datatypes


Originally prompted user for locations of required CSV files. Now not needed
since other code does this.

author: Karl G. Helmer
institution: Athinoula A. Martinos Center for Biomedical Imaging
date started: 20190624
version 1: 20190823

call:
>python collect_files.py 

change log:
'''
import tkinter as tk
from tkinter import filedialog, simpledialog
import os, json



class CollectFiles(object):

    def __init__(self):

        # list of SPARC folders to be populated
        self.folders = ['subjects', 'samples', 'protocol', 'docs', 'code', 'derivatives', 'sourcedata']

        # these are messages paired with the contents of the folders list
        self.messages = {'subjects':'The naming convention for subject folders is: subj-#.', \
                    'samples':'The naming convention for subject folders is: sam-#.', \
                    'protocol':'Be sure to upload your protocol onto protocols.io.' , \
                    'docs':'The docs folder stores supporting documents.', \
                    'code':'The code folder stores the code used to process or analyze the data. (optional)', \
                    'derivatives':'The derivatives folder stores derived data from the experiment. (optional)', \
                    'sourcedata':'The sourcedata folder stores data prior to manipulation or processing. (optional)'}

        # this is the list of example types from the curation team
        self.datatypes = ['anat', 'ephys', 'microscopy', 'ma-seq', 'derivatives']

        self.manifest = 'manifest.csv'  # required for each folder with supplementary info 

        # last two are optional
        self.topLevelFiles = ['subjects.csv', 'samples.csv', 'dataset_description.csv', \
                         'submission.csv', 'README', 'CHANGES']

        # set up the tkObject
        self.tkObject = tk.Tk()



    def get_non_negative_int(self,prompt):
        while True:
            try:
                value = int(input(prompt))
            except ValueError:
                print("Please enter a non-negative integer.")
                continue

            if value < 0:
                print("Your response must be a non-negative integer.")
                continue
            else:
                break
        return value



    def check_for_locations_file(self):
        # first see if a location file exists and read it if it does
        locFilePath = None   #assume that there isn't one
        while True:
            lfp = tk.filedialog.askopenfilenames(parent=self.tkObject,title='Choose an existing locations.json file')
            lfp = self.tkObject.tk.splitlist(lfp)
            lenLFP = len(lfp)
            if lenLFP == 1:
                for z in lfp:   #returns a tuple; we want a list so
                    locFilePath = z
                break
            elif lenLFP > 1:
                print('Please specify a *single* location filepath.')
                continue
            elif lenLFP == 0: # user selects cancel in dialog box; box won't close if you don't select, but click 'open'
                locFilePath = None
                break

        return locFilePath



#    def create_locations_template(self):
#        locationsDict = {'topfiles': {'subjectscsv':'', 'samplescsv':'', 'descriptioncsv':'', 'submissioncsv':'', \
#                                    'readme':'', 'changes':''}, \
#                        'counts': {'numSubjects':0, 'numSessions':0, 'numDatatypes':0, 'numSamples':0}, \
#                        'folders': {'subjectsf':[], 'samplesf':[], 'protocol':[], 'docs':[], 'code':'', \
#                                    'derivatives':[], 'sourcedata':[]}
#                       }
#
#        return locationsDict
#
#
#    # for testing only - creates a sample "full-version" locations.csv file to be used in testing
#    def write_locations_file(self):
#        locationsTestDict = {'topfiles': {'subjectscsv':'/home/karl/Work/SPARC/data/subjects.csv', \
#                                          'samplescsv':'', \
#                                          'descriptioncsv':'/home/karl/Work/SPARC/data/descriptions.csv', \
#                                          'submissioncsv':'/home/karl/Work/SPARC/data/submission.csv', \
#                                          'readme':'', 'changes':''}, \
#                             'counts': {'numSubjects':2, 'numSessions':1, 'numDatatypes':5, 'numSamples':0}, \
#                             'folders': {'subjectsf':['/home/karl/Work/SPARC/data/subj1', '/home/karl/Work/SPARC/data/subj2'], \
#                                         'samplesf':[], 'protocol':[], 'docs':[], \
#                                         'code':[], \
#                                         'derivatives':[], \
#                                         'sourcedata':[]}
#                       }
#
#        with open ("/home/karl/Work/SPARC/SODA/SODA/dev_code/locations.json", "wb") as fp:
#            pickle.dump(locationsTestDict,fp)



    def create_locations_template(self):
        locationsDict = {'counts': {'numSubjects':0, 'numSessions':0, 'numDatatypes':0, 'numSamples':0}, \
                         'folders': {'subjectsf':[], 'samplesf':[], 'protocol':[], 'docs':[], 'code':[], \
                                    'derivatives':[], 'sourcedata':[]}
                       }

        return locationsDict



    # for testing only - creates a sample "reduced" locations.csv file to be used in testing
    def write_locations_file(self):
        locationsTestDict = {'counts': {'numSubjects':2, 'numSessions':0, 'numDatatypes':2, 'numSamples':0}, \
                             'folders': {'subjectsf':['/home/karl/Work/SPARC/data/subj1', '/home/karl/Work/SPARC/data/subj2'], \
                                         'samplesf':[], 'protocol':[], 'docs':[], \
                                         'code':[], \
                                         'derivatives':[], \
                                         'sourcedata':[]}
                       }

        with open ("locations.json", "w") as fp: # this will create the file in the run directory
            json.dump(locationsTestDict,fp)



    def load_locations_file(self,locFilePath):
        # assumes that there is an existing location file that contains a dictionary
        locationsFile = {}
        success = 1
        if locFilePath != None:
            try:
                with open(locFilePath, "r") as fp:
                    locationsDict = json.load(fp)
            except Exception as e:
                print("There is an error in your JSON file: %s" % str(e))
                success = 0
        else:  # there really isn't one or user decided not to load it.
            print("No file selected...initializing locations file template")
            locationsDict = create_locations_template()

        return locationsDict, success



    def get_empty_locs(self,locationsDict):
        emptyLocs = []
        for k,v in locationsDict.items():
            #print(k)
            if isinstance(v, dict):
                self.get_empty_locs(v)
            else:
                #print("{0} : {1}".format(k,v))  #now have k and v so print with format
                if isinstance(v, list): # if the value is a list, check into the list
                    if len(v) == 0:
                        #print("{0} : {1}".format(k,v))
                        #print("{0}".format(k))
                        emptyLocs.append(k)
                elif v == '':
                    #print("{0} : {1}".format(k,v))
                    emptyLocs.append(k)

        return emptyLocs



    def get_empty_counts(self,countsDict): #restrict to "counts" key
        emptyCounts = []
        for k,v in countsDict.items():
            if v == 0: 
                emptyCounts.append(k)

        return emptyCounts



    def get_folder_path(self, boxTitle):
        # generic function used to get and return a file path using a file dialog 
        locFilePath = None   #assume that there isn't one
        success = 0
        while True:
            lfp = tk.filedialog.askdirectory(parent=self.tkObject,title=boxTitle)
            lfp = self.tkObject.tk.splitlist(lfp)
            lenLFP = len(lfp)
            if lenLFP == 1:
                for z in lfp:   #returns a tuple; we want a string so
                    locFilePath = z
                    print(locFilePath)
                    success = 1
                break
            elif lenLFP > 1:
                print('Please specify a *single* folder path.')
                success = 0
                continue
            elif lenLFP == 0: # user selects cancel in dialog box; box won't close if you don't select a valid folder, but still click 'open'
                locFilePath = None
                success = 0 
                break

        return locFilePath, success



#    def get_top_level_files(self):  #no longer need this since BP code gets csv files already
#        topLevelPaths = []
#        while True:
#            for tlf in self.topLevelFiles:
#                fileList = tk.filedialog.askopenfilenames(parent=self.tkObject,title='Choose '+tlf)
#                fileList = tkObject.tk.splitlist(fileList)
#                if len(fileList) == 1:
#                    for z in fileList:   #returns a tuple; we want a list so
#                        topLevelPaths.append(z)
#                        success = 1
#                    break
#                elif len(fileList) == 0:
#                    topLevelPaths.append('NA')
#                    success = 2
#                    break
#                else:
#                    print("Please choose a single file!")
#                    success = 0
#                    break
#        return success
                



def main():

    # prompts used for folder selection 
    prompts = {'subjects':'Please select the subjects folder.', 'protocol':'Please select the protocols folder.', \
               'docs':'Please select the docs folder.', 'code':'Please select the code folder.', \
               'derivatives':'Please select the derivatives folder.', 'sourcedata':'Please select the sourcedata folder.', \
               'num_subjects':'Please enter the number of subjects for each subject: ', \
               'num_sessions':'Please enter the number of sessions for each subject: ', \
               'num_samples':'Please enter the number of samples for each subject: ', \
               'samples':'Please select the samples folder.', 'num_datatypes':'Please enter the number of datatypes: '}

    # define types
    locFilePath = ''
    loc = ''
    subjDirList = []
    sampleDirList = []

    # create the object
    f = CollectFiles()

    # for testing only: create a locations.json file
    #f.write_locations_file()

    # Check to see if a location file exists already (may be partially filled out)
    while True:
        ans = input("Is there an existing locations.json file that you would like to load? (y/n): ")
        if ans == 'y' or ans == 'Y':
            locFilePath = f.check_for_locations_file()
            break
        elif ans == 'n' or ans == 'N':
            print("...initializing locations file template")
            locationsDict = f.create_locations_template() # creates variable, doesn't write file
            break
        else:
            print("Please answer y/n!")
            continue

    #if there is an existing location file, open it
    if locFilePath:
        locationsDict, success = f.load_locations_file(locFilePath)

        # check to see what information is missing from the loaded file
        if success:
            print("Existing locations file successfully loaded.")
        else:
            print("Unable to open selected file")
            print("...initializing locations file template")
            locationsDict = f.create_locations_template()  #create dict structure if I can't open chosen file
    elif not locationsDict:  # user said "y", but then cancelled without specifying a filename
        print("No locations.json file selected.")
        print("...initializing locations file template")
        locationsDict = f.create_locations_template()  #create dict structure if there isn't a file chosen

    # now determine which locations are missing 
    emptyLocs = f.get_empty_locs(locationsDict)
    
    # determine which counts are missing
    countsValue = locationsDict["counts"]
    emptyCounts = f.get_empty_counts(countsValue)

    # gather all of the necessary counts; can use this below to check that all the directories exist
    for c in emptyCounts:
        if c == 'numSubjects':
            locationsDict['counts']['numSubjects'] = f.get_non_negative_int(prompts['num_subjects'])
        elif c == 'numSessions':
            locationsDict['counts']['numSessions'] = f.get_non_negative_int(prompts['num_sessions'])
        elif c == 'numDatatypes':
            locationsDict['counts']['numDatatypes'] = f.get_non_negative_int(prompts['num_datatypes'])
        elif c == 'numSamples':
            locationsDict['counts']['numSamples'] = f.get_non_negative_int(prompts['num_samples'])
        else:
            pass

    #note that if any of the counts = 0 at this point, we assume that the answer is really 0, rather than "not filled in yet"

    # get the subject folder, then us os.walk to find the sub-folders
    if not locationsDict['folders']['subjectsf'] and locationsDict['counts']['numSubjects']:
        loc, success = f.get_folder_path(prompts['subjects'])
        if success:
            locationsDict['folders']['subjectsf'] = loc
        else:
            print ('Subject folder not specified!')

    if locationsDict['folders']['subjectsf']:
        for root, dirs, files in os.walk(locationsDict['folders']['subjectsf'], topdown=True):
            subjDirList.append(root)
        #print(dirList)  #this is a list of all of the sub-directories, with all sessions and datatype folders if needed  


    # get the samples folder, then us os.walk to find the sub-folders
    if not locationsDict['folders']['samplesf'] and locationsDict['counts']['numSamples']:
        loc, success = f.get_folder_path(prompts['samples'])
        if success:
            locationsDict['folders']['samplesf'] = loc
        else:
            print ('Samples folder not specified!')

    if locationsDict['folders']['samplesf']:
        for root, dirs, files in os.walk(locationsDict['folders']['samplesf'], topdown=True):
            sampleDirList.append(root)
        #print(dirList)  #this is a list of all of the sub-directories, with all sessions and datatype folders if needed  


    # get the protocol directory
    if not locationsDict['folders']['protocol']:
        #print(prompts['protocol'])
        loc, success = f.get_folder_path(prompts['protocol'])
        if success:
            locationsDict['folders']['protocol'].append(loc)
        else:
            print('Protocol folder not specified!')


    # get the docs directory
    if not locationsDict['folders']['docs']:
        #print(prompts['docs'])
        loc, success = f.get_folder_path(prompts['docs'])
        if success:
            locationsDict['folders']['docs'].append(loc)
        else:
            print('Docs folder not specified!')


    # get the code directory
    if not locationsDict['folders']['code']:
        #print(prompts['code'])
        loc, success = f.get_folder_path(prompts['code'])
        if success:
            locationsDict['folders']['code'].append(loc)
        else:
            print('Code folder not specified!')


    # get the derivatives directory
    if not locationsDict['folders']['derivatives']:
        #print(prompts['derivatives'])
        loc, success = f.get_folder_path(prompts['derivatives'])
        if success:
            locationsDict['folders']['derivatives'].append(loc)
        else:
            print('Derivativess folder not specified!')


    # get the sourcedata directory
    if not locationsDict['folders']['sourcedata']:
        #print(prompts['sourcedata'])
        loc, success = f.get_folder_path(prompts['sourcedata'])
        if success:
            locationsDict['folders']['sourcedata'].append(loc)
        else:
            print('Sourcedata folder not specified!')


    print(locationsDict)
    
    
if __name__ == "__main__":
    main()
