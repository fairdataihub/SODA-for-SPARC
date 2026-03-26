from .constants import METADATA_UPLOAD_PS_PATH, TEMPLATE_PATH
from os.path import join, getsize
from .helpers import upload_metadata_file, get_template_path
import shutil


# this function saves and uploads the README/CHANGES to Pennsieve, just when users choose to generate onto Pennsieve
## (not used for generating locally)
def create_text_file(soda, upload_boolean, local_destination, metadata_filename):
    """
    Create a text file for README, LICENSE, or CHANGES metadata using a template.

    Args:
        soda (dict): The soda object containing dataset metadata.
        upload_boolean (bool): Whether to upload the file to Pennsieve.
        local_destination (str): The path to save the text file.
        metadata_filename (str): The name of the metadata file to be created (e.g., "README.md", "LICENSE", "CHANGES").

    Returns:
        int: The size of the metadata file in bytes.
    """

    # Use metadata_filename directly for template and output filename
    source = get_template_path(metadata_filename)
    destination = join(METADATA_UPLOAD_PS_PATH, metadata_filename) if upload_boolean else local_destination

    # Copy the template to the destination (if it exists)
    try:
        shutil.copyfile(source, destination)
    except FileNotFoundError:
        # If template not found, just create a new file
        with open(destination, "w", encoding="utf-8") as f:
            pass

    # Write the actual content from soda into the file (overwriting template content)
    # Use metadata_filename as the key for content
    text = soda["dataset_metadata"].get(metadata_filename, "")
    with open(destination, "w", encoding="utf-8") as file:
        file.write(text)

    size = getsize(destination)
    if upload_boolean:
        upload_metadata_file(metadata_filename, soda, destination, True)

    return size


