
#Adding bf or any accounts will be done appart from the json structure (i.e., user enter API key, we add account)
#Creating/renaming Blackfynn account will also be done outside


soda_json_structure = {
    "bf-account-selected": {
        "account-name": "bhavesh-Windows-work",
    },
    
    "bf-dataset-selected": {
        "dataset-name": "bigdata",
    },
    
    "dataset-structure": {
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
                                    "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder1\some-jpg-image.jpg",  
                                    "description": "my jpg description",
                                    "additional-metadata": "my additional jpg metadata",
                                },
                            },
                        },
                        "subfolder2-renamed": { 
                            "type": "local",
                            "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder2",
                            "folders": { 
                                "subsubfolder1":{
                                    "type": "virtual",
                                    "files": {
                                        "some-source-data.csv":{
                                            "type": "local",
                                            "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder2\subsubfolder1\some-source-data.csv",
                                            "description": "my csv description",
                                            "additional-metadata": "my additional csv metadata",
                                        },
                                    },
                                },
                            },
                            "files": {
                                "some-png-image.png":{
                                    "type": "local",
                                    "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder1\subfolder2\some-png-image.png",
                                },
                            },
                        },
                        
                    },
                 },
                
                 "codefolder2": { 
                    "type": "local",
                    "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder2",
                    "folders": {
                    },
                    "files": {
                        "random-text-file.txt":{
                            "type": "local",
                            "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\codefolder2\random-text-file.txt"
                        }
                    },
                },
                
            },
                
               
            
            "files":{
                "some-abaqus-input-renamed.inp": { 
                    "type": "local",
                    "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\some-abaqus-input.inp",
                    "description": "my inp description",
                    "additional-metadata": "my additional inp metadata",
                },
                "some-abaqus-model.cae": { 
                    "type": "local",
                    "path": r"C:\Users\Bhavesh\OneDrive - Calmi2\Bhavesh\SPARC\SODA - Phase 2\Code\test-data\virtual_dataset\code\some-abaqus-model.cae",
                    "description": "my cae description",
                    "additional-metadata": "my additional cae metadata",
                },   
            },
        },
    },
    
    "metadata-files": {
        "destination": "generate",
        "submission":{
            "form": {
            },
        },
            
        "dataset_description": {
          "path": "local-path-to-the-file",  
        },
    },
    
    "manifest-files":{
       "destination": "generate",
        "existing": "replace",
    },
    
    "generate-dataset": {
        "destination": "local",
        "path": r"C:\Users\Bhavesh\Desktop\datasets",
        "dataset-name": "mynewdataset",
        "duplicate-handling": "duplicate",
    },
}