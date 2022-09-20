"""
Given a sodaJSONObject dataset-structure key, create a skeleton of the dataset structure on the user's filesystem. Then pass the path to the skeleton to the validator.
"""

import os
from posixpath import expanduser
import shutil
import subprocess


dataset_structure = {
    "files": {},
    "folders": {
        "code": {
            "type": "bf",
            "path": "N:collection:47f91fe1-4525-4842-a13f-c72c91dfd8db",
            "action": [
                "existing"
            ],
            "files": {
                "renderer.log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:22d6044d-adf5-4e7e-bd7c-a74602a25b3d",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-15T21:12:28,638373Z",
                    "type": "bf",
                    "description": "celery",
                    "additional-metadata": "",
                    "file type": ".log"
                },
                ".DS_Store": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:fd28f906-0811-4950-abd2-6a3aabb1241a",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-15T21:12:28,638373Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": "None"
                },
                "main.log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:336456fc-23c3-465d-971c-12ef3d49f1fe",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-15T21:12:41,933137Z",
                    "type": "bf",
                    "description": "salary",
                    "additional-metadata": "",
                    "file type": ".log"
                },
                "main (2).log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:d69166e9-0c3d-4419-b07a-64a34d0b39bf",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-20T12:47:32,868236Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": ".log"
                },
                " (2).DS_Store": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:9e6376e9-7317-42c0-a112-27c7b361deb4",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-20T12:47:32,868236Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": ".DS_Store"
                },
                "renderer (2).log": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:package:ff85bbd3-0bea-495d-b1ee-168609ab0829",
                    "bfpath": [
                        "code"
                    ],
                    "timestamp": "2022-09-20T12:47:32,868236Z",
                    "type": "bf",
                    "additional-metadata": "",
                    "file type": ".log"
                }
            },
            "folders": {
                "homeilk": {
                    "action": [
                        "existing"
                    ],
                    "path": "N:collection:99b90041-cf38-4909-ad61-ac75b29a16d7",
                    "bfpath": [
                        "code",
                        "homeilk"
                    ],
                    "files": {
                        "samples.xlsx": {
                            "action": [
                                "existing"
                            ],
                            "path": "N:package:47f931ce-f4dc-4b72-8a5b-a064db414b47",
                            "bfpath": [
                                "code",
                                "homeilk"
                            ],
                            "timestamp": "2022-09-15T21:12:28,638373Z",
                            "type": "bf",
                            "description": "marshmallow",
                            "additional-metadata": "",
                            "file type": ".xlsx"
                        },
                        "samples (2).xlsx": {
                            "action": [
                                "existing"
                            ],
                            "path": "N:package:b01cacaf-8100-4e82-bef7-81bdd8ac4351",
                            "bfpath": [
                                "code",
                                "homeilk"
                            ],
                            "timestamp": "2022-09-20T12:47:32,868236Z",
                            "type": "bf",
                            "additional-metadata": "",
                            "file type": ".xlsx"
                        }
                    },
                    "folders": {},
                    "type": "bf"
                }
            },
            "bfpath": [
                "code"
            ]
        }
    }
}


path = os.path.join(expanduser("~"), "SODA", "skeleton")

# check if the skeleton directory exists
if os.path.exists(path):
    # remove the non-empty skeleton directory
    shutil.rmtree(path)

# create a folder to hold the skeleton
os.mkdir(path)

def create_skeleton(dataset_structure, path):
    """
    Create a skeleton of the dataset structure on the user's filesystem.
    """
    for folder in dataset_structure["folders"]:
        os.mkdir(os.path.join(path, folder))
        create_skeleton(dataset_structure["folders"][folder], os.path.join(path, folder))
    for file in dataset_structure["files"]:
        with open(os.path.join(path, file), "w") as f:
            f.write("SODA")

create_skeleton(dataset_structure, path)

# place the high level metadata files at the root of the skeleton
metadata_files =  { 
    "metadata-files": {
        "dataset_description.xlsx": {
            "type": "bf",
            "action": [
                "existing"
            ],
            "path": "N:package:de839459-9847-4b51-bdba-ea89e892c4c0"
        },
        "subjects.xlsx": {
            "type": "bf",
            "action": [
                "existing"
            ],
            "path": "N:package:cd0b4ea1-3a9f-4921-becf-30f116156dab"
        },
        "submission.xlsx": {
            "type": "bf",
            "action": [
                "existing"
            ],
            "path": "N:package:21e76aef-7f98-454b-9964-a8eb5879d99b"
        }
    }
}



# use the shell to open the skeleton directory
subprocess.call(["open", path])