# -*- coding: utf-8 -*-
"""
Created on Mon May 11 14:01:07 2020

@author:Bhavesh Patel
"""

import os


from validator_soda import (
    pathToJsonStruct,
    validate_high_level_folder_structure,
    validate_high_level_metadata_files,
    validate_sub_level_organization,
    validate_submission_file,
    validate_dataset_description_file,
)


rootFolder = r"C:\Users\Calmi2\Desktop\DatasetSODA"
jsonStruct = pathToJsonStruct(rootFolder)

validatorHighLevelFolder = validate_high_level_folder_structure(jsonStruct)
validatorObj = validatorHighLevelFolder
print("Fatal error")
print(validatorObj.fatal)
print("Warnings")
print(validatorObj.warnings)
print("Pass")
print(validatorObj.passes)


(
    validatorHighLevelMetadataFiles,
    isSubmission,
    isDatasetDescription,
    isSubjects,
    isSamples,
) = validate_high_level_metadata_files(jsonStruct)
validatorObj = validatorHighLevelMetadataFiles
print("Fatal error")
print(validatorObj.fatal)
print("Warnings")
print(validatorObj.warnings)
print("Pass")
print(validatorObj.passes)


validatorSubLevelOrganization = validate_sub_level_organization(jsonStruct)
validatorObj = validatorSubLevelOrganization
print("Fatal error")
print(validatorObj.fatal)
print("Warnings")
print(validatorObj.warnings)
print("Pass")
print(validatorObj.passes)

if isSubmission == 1:
    metadataFiles = jsonStruct["main"]
    for f in metadataFiles:
        fullName = os.path.basename(f)
        if os.path.splitext(fullName)[0] == "submission":
            submFilePath = f
    validatorSubmissionFile = validate_submission_file(submFilePath)
    validatorObj = validatorSubmissionFile
    print("Fatal error")
    print(validatorObj.fatal)
    print("Warnings")
    print(validatorObj.warnings)
    print("Pass")
    print(validatorObj.passes)

ddFilePath = r"C:\Users\Calmi2\Desktop\dataset_description.xlsx"
# ddFilePath = r'C:\Users\Calmi2\Downloads\dataset_description.xlsx'
validatorDatasetDescriptionFile = validate_dataset_description_file(ddFilePath)
validatorObj = validatorDatasetDescriptionFile
print("Fatal error")
print(validatorObj.fatal)
print("Warnings")
print(validatorObj.warnings)
print("Pass")
print(validatorObj.passes)
