/*
What is it:  Enums for analytics Category, Actio, Label, Status, and Event Data values for Kombucha Analytics. 
Purpose:     SODA for SPARC follows a naming convention for analytics events. This file contains enums for existing 
             Category, Action, Label, and Event Data fields to help the client code remain consistent with the 
             naming convention. For creating new entries in the following Enums, please refer to the following 
             schema definition.
TODO:        Implement schema validation in the client code that is consistent with the schema definition.
*/

const Category = {
  STARTUP: "Startup",
  MANAGE_DATASETS: "Manage Datasets",
  PREPARE_DATASETS: "Prepare Datasets",
  GUIDED_MODE: "Guided Mode",
  DISSEMINATE_DATASETS: "Disseminate Datasets",
  PREPARE_METADATA: "Prepare Metadata",
};

const Action = {
  GENERATE_DATASET: "Generate Dataset",
  ADD_EDIT_DATASET_METADATA: "Add/Edit Dataset Metadata",
  CREATE_NEW_DATASET: "Create New Dataset",
  RENAME_DATASET: "Rename Dataset",
  IMPORT_ITEMS: "Import Items",
  REPLACE_ITEMS: "Replace Items",
  MERGE_ITEMS: "Merge Items",
  SKIP_ITEMS: "Skip Items",
  DUPLICATE_ITEMS: "Duplicate Items",
  SHARE_WITH_CURATION_TEAM: "Share With Curation Team",
  DOWNLOAD_TEMPLATES: "Download Templates",
  GENERATE_METADATA: "Generate Metadata",
  IMPORT_METADATA: "Import Metadata",
  VALIDATE_DATASET: "Validate Dataset",
  TEMPLATE_PATHS: "Setting Templates Paths",
};

const Label = {
  FILES: "Files",
  FOLDERS: "Folders",
  SIZE: "Size",
  BANNER_SIZE: "Banner - Size",
  DESCRIPTION: "Description",
  TAGS: "Tags",
  PERMISSIONS: "Permissions",
  README: "README",
  STATUS: "status",
  SUBTITLE: "Subtitle",
  LICENSE: "License",
  SUBMISSION: "Submission",
  MANIFEST_XLSX: "manifest.xlsx",
  DATASET_DESCRIPTION_XLSX: "dataset_description.xlsx",
  SUBJECTS_XLSX: "subjects.xlsx",
  SAMPLES_XLSX: "samples.xlsx",
  SUBMISSION_XLSX: "submission.xlsx",
  README_TXT: "README.txt",
  CHANGES_TXT: "CHANGES.txt",
  MANIFEST_XLSX_SIZE: "manifest.xlsx - Size",
  DATASET_DESCRIPTION_XLSX_SIZE: "dataset_description.xlsx - Size",
  SUBJECTS_XLSX_SIZE: "subjects.xlsx - Size",
  SAMPLES_XLSX_SIZE: "samples.xlsx - Size",
  SUBMISSION_XLSX_SIZE: "submission.xlsx - Size",
  README_TXT_SIZE: "README.txt - Size",
  CHANGES_TXT_SIZE: "CHANGES.txt - Size",
  PROGRESS_TRACK: "Progress Track",
  TOTAL_UPLOADS: "Total Uploads",
  PI_OWNER: "Change PI Owner",
};

const Status = {
  SUCCESS: "success",
  FAIL: "fail",
};

const kombuchaEnums = {
  Category,
  Action,
  Label,
  Status,
};

module.exports = { kombuchaEnums };
