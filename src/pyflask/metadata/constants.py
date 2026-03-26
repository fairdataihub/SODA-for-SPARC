from os.path import join, getsize, abspath, dirname, expanduser
from os import makedirs



TEMPLATE_PATH = join(dirname(abspath(__file__)), '..', 'metadata_templates')
METADATA_UPLOAD_PS_PATH = expanduser("~/.pysoda")
makedirs(METADATA_UPLOAD_PS_PATH, exist_ok=True)


SCHEMA_NAMES = {
    "submission": "submission_schema.json",
    "subjects": "subjects_schema.json"
}


SDS_FILE_SUBJECTS = "subjects.xlsx"
SCHEMA_NAME_SUBJECTS = "subjects.json"
SDS_FILE_SAMPLES = "samples.xlsx"
SCHEMA_NAME_SAMPLES = "samples.json"
SDS_FILE_PERFORMANCES = "performances.xlsx"
SCHEMA_NAME_PERFORMANCES = "performances.json"
SDS_FILE_SITES = "sites.xlsx"
SCHEMA_NAME_SITES = "sites.json"
SDS_FILE_RESOURCES = "resources.xlsx"
SCHEMA_NAME_RESOURCES = "resources.json"
SDS_FILE_DATASET_DESCRIPTION = "dataset_description.xlsx"
SCHEMA_NAME_DATASET_DESCRIPTION = "dataset_description.json"
SDS_FILE_CODE_DESCRIPTION = "code_description.xlsx"
SCHEMA_NAME_CODE_DESCRIPTION = "code_description.json"
SDS_FILE_MANIFEST = "manifest.xlsx"
SCHEMA_NAME_MANIFEST = "manifest.json"