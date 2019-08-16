'''
This code allows the user to specify the location of files
that are needed for the curation of data from the SPARC project.

The set of folders is fixed by the project and the user will be
prompted to assign files to each. 

Program flow:
1) user is prompted to provide a location.json file, so can load partial info if exists
2) if no locations.json file exists, create one in a location selected by the user
3) code determines what info is still needed and prompts user for provide its location
4) empty fields are None 

author: Karl G. Helmer
institution: Athinoula A. Martinos Center for Biomedical Imaging
date started: 20190624

call:
>python collect_files.py 

change log:
'''
import tkinter as tk
from tkinter import filedialog, simpledialog

import json

class CollectFiles(object):

    def __init__(self):

        # list of SPARC folders to be populated
        self.folders = ['subjects', 'samples', 'protocol', 'docs', 'code', 'derivatives', 'sourcedata']

        # these are messages paired with the contents of the folders list
        self.messages = {'subjects':'The naming convention for subject folders is: subj-#.', \
                    'samples':'The naming convention for subject folders is: subj-#.', \
                    'protocol':'Be sure to upload your protocol onto protocols.io.' , \
                    'docs':'The docs folder stores supporting documents.', \
                    'code':'The code folder stores the code used to process or analyze the data. (optional)', \
                    'derivatives':'The derivatives folder stores derived data from the experiment. (optional)', \
                    'sourcedata':'The sourcedata folder stores data prior to manipulation or processing. (optional)'}


        # this is the list of example types from the curation team
        self.datatypes = ['anat', 'ephys', 'microscopy', 'ma-seq', 'derivatives']

        # used to get info from the user re the numeration of their data
        self.numSubjects = 0   # sub-# folders go in the subject folder
        self.numSessions = 0   # NB: if only one session, then no session folder
        self.numDatatypes = 0  # use standardized names from the datatypes list; potentially let users create own?
        self.numSamples = 0    # sam-# folders go in the samples folder

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
#    # for testing only - creates a sample locations.csv file to be used in testing
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
#        with open ("/home/karl/Work/SPARC/SODA/locations.json", "wb") as fp:
#            pickle.dump(locationsTestDict,fp)



    def create_locations_template(self):
        locationsDict = {'counts': {'numSubjects':0, 'numSessions':0, 'numDatatypes':0, 'numSamples':0}, \
                         'folders': {'subjectsf':[], 'samplesf':[], 'protocol':[], 'docs':[], 'code':'', \
                                    'derivatives':[], 'sourcedata':[]}
                       }

        return locationsDict


    # for testing only - creates a sample locations.csv file to be used in testing
    def write_locations_file(self):
        locationsTestDict = {'counts': {'numSubjects':2, 'numSessions':1, 'numDatatypes':5, 'numSamples':0}, \
                             'folders': {'subjectsf':['/home/karl/Work/SPARC/data/subj1', '/home/karl/Work/SPARC/data/subj2'], \
                                         'samplesf':[], 'protocol':[], 'docs':[], \
                                         'code':[], \
                                         'derivatives':[], \
                                         'sourcedata':[]}
                       }

        with open ("/home/karl/Work/SPARC/SODA/locations.json", "w") as fp:
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



    def get_keys_dict(self,locationsDict):
        emptyKeys = []
        for k,v in locationsDict.items():
            print(v)
            if isinstance(v, dict):
                self.get_keys_dict(v)
            else:
                #print("{0} : {1}".format(k,v))  #now have k and v so print with format
                if isinstance(v, list): # if the value is a list, check into the list
                    if len(v) == 0:
                        #print("{0} : {1}".format(k,v))
                        emptyKeys.append(k)
                elif v == '':
                    #print("{0} : {1}".format(k,v))
                    emptyKeys.append(k)

        return emptyKeys



    def collect_numSubjects(self):
        self.numSubjects = tk.simpledialog.askinteger('Input', 'How many subjects are in this study?', \
                           parent = application_window, minvalue=0)
        if self.numSubjects is not None:
            print("The number of subjects is ",self.numSubjects)
        else:
            print("Please enter the number of subjects in the study.")



    def collect_numSessions(self):   #this should be for each subject
        self.numSessions = tk.simpledialog.askinteger('Input', 'How many sessions does this subject have?', \
                           parent = application_window, minvalue=0)
        if self.numSubjects is not None:
            print("The number of subjects is ",self.numSessions)
        else:
            print("Please enter the number of sessions for this subject.")



    def collect_numDatatypes(self):   #this should be for each subject
        self.numDatatypes = tk.simpledialog.askinteger('Input', 'How many datatypes are in this study?', \
                           parent = application_window, minvalue=0)
        if self.numDatatyspe is not None:
            print("The number of subjects is ",self.numDatatypes)
        else:
            print("Please enter the number of datatypes in the study.")



    def collect_numSamples(self):   #this is instead of subjects?
        self.numSamples = tk.simpledialog.askinteger('Input', 'How many samples are in this study?', \
                           parent = application_window, minvalue=0)
        if self.numSamples is not None:
            print("The number of subjects is ",self.numSamples)
        else:
            print("Please enter the number of samples in the study.")



    def get_top_level_files(self):   #move to while True / try
        topLevelPaths = []
        for tlf in self.topLevelFiles:
            fileList = tk.filedialog.askopenfilenames(parent=self.tkObject,title='Choose '+tlf)
            fileList = tkObject.tk.splitlist(fileList)
            if len(fileList) == 1:
                for z in fileList:   #returns a tuple; we want a list so
                    topLevelPaths.append(z)
                    success = 1
            elif len(fileList) == 0:
                topLevelPaths.append('NA')
                success = 2
            else:
                print("Please choose a single file!")
                success = 0
        return success
                

        
def main():

    # deal with different number of sessions per subject? If one value, the all the same. Else list?
    prompts = {'num_subjects':'Please enter the number of subjects: ', 'num_samples':'Please enter the number of samples: ', \
                    'num_sessions':'Please enter the number of sessions for each subject: ', \
                    'num_datatypes':'Please enter the number of datatypes: '}


    # create the object
    f = CollectFiles()
    locFilePath = ''

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
            locationsDict = f.create_locations_template()
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
            print("Unable to open selected file as locations.json")
            print("...initializing locations file template")
            locationsDict = f.create_locations_template()  #create dict structure if I can't open chosen file
    else:
        print("No locations.json file selected.")
        print("...initializing locations file template")
        locationsDict = f.create_locations_template()  #create dict structure if there isn't a file chosen

    # now determine which fields are missing values and ask about those
    emptyKeys = f.get_keys_dict(locationsDict)
    print(emptyKeys)


#    else:
        # get values used in setup, this allows us to set up the directory tree
#        numSubjects = f.get_non_negative_int(prompts['num_subjects'])
#        numSamples = f.get_non_negative_int(prompts['num_samples'])
#        numDatatypes = f.get_non_negative_int(prompts['num_datatypes'])
#        numSessions = f.get_non_negative_int(prompts['num_sessions'])

    
    
if __name__ == "__main__":
    main()
