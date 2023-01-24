import os.path
import requests
from utils import create_request_headers

PENNSIEVE_URL = "https://api.pennsieve.io"

# check for non-empty fields (cells)
def column_check(x):
    return "unnamed" not in x.lower()


# obtain Pennsieve S3 URL for an existing metadata file
def returnFileURL(ps, item_id):
    r = requests.get(f"{PENNSIEVE_URL}/packages/{item_id}/view", headers=create_request_headers(ps))
    r.raise_for_status()

    file_details = r.json()
    file_id = file_details[0]["content"]["id"]
    r = requests.get(
        f"{PENNSIEVE_URL}/packages/{item_id}/files/{file_id}", headers=create_request_headers(ps)
    )
    r.raise_for_status()

    file_url_info = r.json()
    return file_url_info["url"]


def remove_high_level_folder_from_path(paths):
    """
        Remove the high level folder from the path. This is necessary because the high level folder is not included in the manifest file name entry.
    """

    return "" if len(paths) == 1 else "/".join(paths[1:]) + "/"




double_extensions = [
    ".ome.tiff",
    ".ome.tif",
    ".ome.tf2,",
    ".ome.tf8",
    ".ome.btf",
    ".ome.xml",
    ".brukertiff.gz",
    ".mefd.gz",
    ".moberg.gz",
    ".nii.gz",
    ".mgh.gz",
    ".tar.gz",
    ".bcl.gz",
]


def get_name_extension(file_name):
    double_ext = False
    for ext in double_extensions:
        if file_name.find(ext) != -1:
            double_ext = True
            break

    ext = ""
    name = ""

    if double_ext == False:
        name = os.path.splitext(file_name)[0]
        ext = os.path.splitext(file_name)[1]
    else:
        ext = (
            os.path.splitext(os.path.splitext(file_name)[0])[1]
            + os.path.splitext(file_name)[1]
        )
        name = os.path.splitext(os.path.splitext(file_name)[0])[0]
    return name, ext