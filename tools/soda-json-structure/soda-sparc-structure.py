
"""
This is the json structure used in SODA for the major communication between front and back end
Details about the different keys are provided below
"""

"""
dataset-strucuture: contains info about the dataset structure

1. The high-level SPARC folders are included in a "folders" key
2. Each file/folder info is stored in a key refering to the name of the file/folder (including the extension for files). If user renames the file/folder, this key should change to register that.
3. The files/folders in each folder are stored in a "files"/"folders" key, respectively.
4. Each file/folder has a subkey "type" which is a string with value either "virtual" (only for folders, if created in SODA), "local", or "bf"
5. Each non virtual file/folder has a subkey "path" with is a string with value being the absolute path (for local files) or blackfynn id 
6. Each non virtual file/folder has a subkey "action" which is an array containing "existing" (if it from an existing local or bf dataset) or "new" (if imported).
7. If "new", additional "action" could be "renamed". If "existing", addtional "action" could be "renamed", "moved" (if an existing file/folder is moved), and/or "deleted" (if delete is requested in the UI)
8. If provided, a file with have the subkeys "description" and "additional-metadata" each contain a string value to be later included in the manifest files, if requested

"""

"""
metadata-files: contains info about the high-level metadata files

1. Each major key is the name of the metadata file specified by the user (including the extension)
2. Each file has a subkey "type" with is a string value either "local" (imported file) or "soda-form" (generated through SODA)
3. Each file has a subkey "action" which is a string with value either "new" (if imported or created with the SODA form) or "existing" (if the metadata file is already in the existing local or Blackfynn dataset)
4. If "type" is local, a "path" subkey must be included which include the absolute path of the file
5. Each file has a subkey "destination" which is a string with value either "generate-dataset" (meaning it is part of the curate process and destination info is available in the "generate-dataset" main key), "local" (generate the file locally), or "bf" (generate the dataset on bf, look for the bf account and dataset keys for info)
6. If "destination" is "local", a "destination-path" subkey must be included which includes the path of the folder where the file should be created

"""

"""
manifest-files: if manifest files are requested, this will include information about where they need to be created

1. Has a key "destination" which is a string with value either "generate-dataset" (meaning it is part of the curate process and destination info is available in the "generate-dataset" main key), "local" (generate the file locally), or "bf" (generate the dataset on bf, look for the bf account and dataset keys for info)
2. If "destination" is "local", a "destination-path" subkey must be included which includes the path of the folder for which the manifest files are to be created

"""

"""
generate-dataset: contains info about the dataset to be generated

1. Has a key "destination" which is a string with value either "local" (generate the file locally) or "bf" (generate the dataset on bf, look for the bf account and dataset keys for info)
2. If "destination" is "local", a "destination-path" subkey must be included which includes the path of the folder where the dataset will be generated
3. If "destination" is "local", a "dataset-name" key must be included with the name of the dataset
4. If "destination" is "local", an "if-existing" key must be included with string value either "new" (create new dataset, added (2) etc. behind the dataset name if already exists) or "merge" (decide to modify existing dataset)

"""


"""
Notes:

1. Adding new bf or Airtable accounts will be done outside from the json structure (i.e., user enter API key, we add account)
2. Creating/renaming Blackfynn account will be done outside and not recorded in the json structure

"""



soda_json_structure = {
    "bf-account-selected": {
        "account-name": "bhavesh-Windows-work",
    },
    
    "bf-dataset-selected": {
        "dataset-name": "bigdata",
    },
    
    "dataset-structure": {
        "folders": {
            "code": {
                "type": "virtual",
                "folders": {     
                    "codefolder1": { 
                        "type": "virtual",
                        "folders": {
                            "subfolder1": { 
                                "type": "virtual",
                                "files": {
                                    "some-jpg-image.jpg":{
                                        "type": "local",
                                        "action": ["new"],
                                        "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder1\some-jpg-image.jpg",  
                                        "description": "my jpg description",
                                        "additional-metadata": "my additional jpg metadata",
                                    },
                                },
                            },
                            "subfolder2-renamed": { 
                                "type": "local",
                                "action": ["new"],
                                "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder2",
                                "folders": { 
                                    "subsubfolder1":{
                                        "type": "virtual",
                                        "files": {
                                            "some-source-data.csv":{
                                                "type": "local",
                                                "action": ["new"],
                                                "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder2\subsubfolder1\some-source-data.csv",
                                                "description": "my csv description",
                                                "additional-metadata": "my additional csv metadata",
                                                "action": ["new"]
                                            },
                                        },
                                    },
                                },
                                "files": {
                                    "some-png-image.png":{
                                        "type": "local",
                                        "action": ["new"],
                                        "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder2\some-png-image.png",
                                    },
                                },
                            },

                        },
                     },

                     "codefolder2": { 
                        "type": "local",
                        "action": ["new"],
                        "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder2",
                        "folders": {
                        },
                        "files": {
                            "random-text-file.txt":{
                                "type": "local",
                                "action": ["new"],
                                "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder2\random-text-file.txt"
                            },
                        },
                    },
                },



                "files":{
                    "some-abaqus-input-renamed.inp": { 
                        "type": "local",
                        "action": ["new"],
                        "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\some-abaqus-input.inp",
                        "description": "my inp description",
                        "additional-metadata": "my additional inp metadata",
                    },
                    "some-abaqus-model.cae": { 
                        "type": "local",
                        "action": ["new"],
                        "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\some-abaqus-model.cae",
                        "description": "my cae description",
                        "additional-metadata": "my additional cae metadata",
                    },   
                },
            },
        },
    },
        
    
    "metadata-files": {
        "submission.xlsx":{
            "type": "local",
            "action": ["new"],
            "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\submission.xlsx", 
            },

        "dataset_description.xlsx": {
            "type": "local",
            "action": ["new"],
            "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\dataset_description.xlsx",  
        },
    },

    
    "manifest-files":{
        "destination": "generate-dataset",
    },
    

    "generate-dataset": {
        "destination": "local",
        "path": r"C:\Users\Bhavesh\Desktop\new-dataset",
        "dataset-name": "generate-local-new-dataset",
        "if-existing": "new",
    },
}